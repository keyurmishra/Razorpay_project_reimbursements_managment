'use strict';

const reimbursementRepository = require('../repositories/reimbursement.repository');
const approvalRepository      = require('../repositories/approval.repository');
const REIMBURSEMENT_STATUS = {
  PENDING: 'PENDING',
  RM_APPROVED: 'RM_APPROVED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  PAID: 'PAID',
};

const APPROVAL_DECISION = {
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
};
const AppError = require('../utils/AppError');

// ── State machine ─────────────────────────────────────────────────────────────
//
// Maps: approverRole → { allowedCurrentStatuses, nextStatusOnApprove }
// Rejection always leads to REJECTED regardless of role.
//
// RM  : can act on PENDING          → approve: RM_APPROVED
// APE : can act on RM_APPROVED      → approve: APPROVED
// CFO : can act on PENDING or       → approve: RM_APPROVED (from PENDING)
//       RM_APPROVED                              APPROVED   (from RM_APPROVED)
//
const WORKFLOW = {
  RM: {
    allowed: [REIMBURSEMENT_STATUS.PENDING],
    nextOnApprove: { [REIMBURSEMENT_STATUS.PENDING]: REIMBURSEMENT_STATUS.RM_APPROVED },
  },
  APE: {
    allowed: [REIMBURSEMENT_STATUS.RM_APPROVED],
    nextOnApprove: { [REIMBURSEMENT_STATUS.RM_APPROVED]: REIMBURSEMENT_STATUS.APPROVED },
  },
  CFO: {
    allowed: [REIMBURSEMENT_STATUS.PENDING, REIMBURSEMENT_STATUS.RM_APPROVED],
    nextOnApprove: {
      [REIMBURSEMENT_STATUS.PENDING]:     REIMBURSEMENT_STATUS.RM_APPROVED,
      [REIMBURSEMENT_STATUS.RM_APPROVED]: REIMBURSEMENT_STATUS.APPROVED,
    },
  },
};

// ── Service Methods ───────────────────────────────────────────────────────────

/**
 * createReimbursement
 *
 * Creates a new reimbursement request on behalf of the authenticated employee.
 *
 * Business rules:
 *   - `status` is always forced to PENDING regardless of what the client sends.
 *   - `employeeId` is taken from `req.user` (the authenticated session), never
 *     from the request body — this prevents an employee from submitting on
 *     behalf of another user.
 *
 * @param {{ title: string, description?: string, amount: number }} data   - Validated body fields
 * @param {object} actingUser - req.user (the authenticated EMP)
 * @returns {Promise<object>} The newly created reimbursement record
 */
const createReimbursement = async ({ title, description, amount }, actingUser) => {
  const reimbursement = await reimbursementRepository.createReimbursement({
    employeeId:  actingUser.id,
    title:       title.trim(),
    description: description ? description.trim() : null,
    amount:      parseFloat(amount),
    status:      REIMBURSEMENT_STATUS.PENDING,   // always PENDING on creation
  });

  // Re-fetch with the employee association so the response body is fully shaped.
  return reimbursementRepository.findById(reimbursement.id);
};

/**
 * processDecision
 *
 * Records an approval or rejection decision against a reimbursement.
 *
 * Business rules enforced (in order):
 *   1. Reimbursement must exist.
 *   2. Reimbursement must not be in a terminal state (APPROVED / REJECTED / PAID).
 *   3. The acting role must be allowed to act on the current status
 *      (e.g. RM can only act on PENDING; APE can only act on RM_APPROVED).
 *   4. The same role cannot approve/reject the same reimbursement twice.
 *   5. Write the Approval audit record.
 *   6. Transition the reimbursement to the new status.
 *
 * @param {number} reimbursementId   - Route param :id
 * @param {string} decision          - 'APPROVED' | 'REJECTED'
 * @param {object} actingUser        - req.user (authenticated RM / APE / CFO)
 * @returns {Promise<{ reimbursement: object, approval: object }>}
 */
const processDecision = async (reimbursementId, decision, actingUser) => {
  const role = actingUser.role;

  // ── Rule 1: Reimbursement must exist ────────────────────────────────────────
  const reimbursement = await reimbursementRepository.findById(reimbursementId);
  if (!reimbursement) {
    throw new AppError(`No reimbursement found with id ${reimbursementId}.`, 404);
  }

  const currentStatus = reimbursement.status;

  // ── Rule 2: Must not be a terminal state ────────────────────────────────────
  const TERMINAL = [
    REIMBURSEMENT_STATUS.APPROVED,
    REIMBURSEMENT_STATUS.REJECTED,
    REIMBURSEMENT_STATUS.PAID,
  ];
  if (TERMINAL.includes(currentStatus)) {
    throw new AppError(
      `Reimbursement ${reimbursementId} is already in a terminal state ('${currentStatus}') and cannot be actioned further.`,
      409
    );
  }

  // ── Rule 3: Role must be allowed to act on the current status ───────────────
  const workflow = WORKFLOW[role];
  if (!workflow || !workflow.allowed.includes(currentStatus)) {
    throw new AppError(
      `A user with role '${role}' cannot action a reimbursement that is currently '${currentStatus}'.`,
      422
    );
  }

  // ── Rule 4: Prevent duplicate approval by the same role ─────────────────────
  const existing = await approvalRepository.findByReimbursementAndRole(reimbursementId, role);
  if (existing) {
    throw new AppError(
      `Role '${role}' has already recorded a decision (${existing.decision}) for reimbursement ${reimbursementId}.`,
      409
    );
  }

  // ── Determine next status ───────────────────────────────────────────────────
  const nextStatus = decision === APPROVAL_DECISION.APPROVED
    ? workflow.nextOnApprove[currentStatus]
    : REIMBURSEMENT_STATUS.REJECTED;

  // ── Rule 5: Write approval audit record ────────────────────────────────────
  const approval = await approvalRepository.createApproval({
    reimbursementId,
    approverId:   actingUser.id,
    approverRole: role,
    decision,
    approvedAt:   new Date(),
  });

  // ── Rule 6: Transition reimbursement status ─────────────────────────────────
  await reimbursementRepository.updateStatus(reimbursementId, nextStatus);

  // Re-fetch the updated reimbursement for the response
  const updated = await reimbursementRepository.findById(reimbursementId);

  return { reimbursement: updated, approval };
};

/**
 * listReimbursements
 *
 * Returns the reimbursements visible to the authenticated user based on their role.
 *
 * Visibility rules:
 *   EMP  → own submissions only (any status)
 *   RM   → PENDING requests from direct subordinates only
 *   APE  → all RM_APPROVED requests (ready for payment processing)
 *   CFO  → all APPROVED requests (fully authorised)
 *
 * @param {object} actingUser - req.user
 * @returns {Promise<object[]>} Array of reimbursement records
 * @throws {AppError} 403  If the role is unrecognised (should not occur in practice
 *                         as the route enforces valid roles via authenticate)
 */
const listReimbursements = async (actingUser) => {
  const { id: userId, role } = actingUser;

  switch (role) {
    case 'EMP':
      return reimbursementRepository.findAllByEmployee(userId);

    case 'RM':
      return reimbursementRepository.findPendingForManager(userId);

    case 'APE':
      return reimbursementRepository.findRmApproved();

    case 'CFO':
      return reimbursementRepository.findApproved();

    default:
      throw new AppError(`Role '${role}' does not have access to reimbursements.`, 403);
  }
};

module.exports = { createReimbursement, processDecision, listReimbursements };
