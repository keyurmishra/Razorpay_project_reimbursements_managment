'use strict';

const db = require('../models');

/**
 * ApprovalRepository
 * All direct Sequelize queries for the Approval model live here.
 * Services must NOT import the model directly — always go through this layer.
 */

/**
 * Find an existing approval record for a specific reimbursement + approver role.
 * Used to enforce the duplicate-approval prevention rule.
 *
 * @param {number} reimbursementId
 * @param {string} approverRole - One of RM | APE | CFO
 * @returns {Promise<import('../models/approval.model').Approval|null>}
 */
const findByReimbursementAndRole = async (reimbursementId, approverRole) => {
  return db.Approval.findOne({ where: { reimbursementId, approverRole } });
};

/**
 * Persist a new approval decision record.
 *
 * @param {{
 *   reimbursementId : number,
 *   approverId      : number,
 *   approverRole    : string,
 *   decision        : string,
 *   approvedAt      : Date,
 * }} data
 * @returns {Promise<import('../models/approval.model').Approval>}
 */
const createApproval = async ({ reimbursementId, approverId, approverRole, decision, approvedAt }) => {
  return db.Approval.create({
    reimbursementId,
    approverId,
    approverRole,
    decision,
    approvedAt,
  });
};

/**
 * Fetch all approval records for a given reimbursement, newest first.
 * Includes the approver's basic info for response shaping.
 *
 * @param {number} reimbursementId
 * @returns {Promise<import('../models/approval.model').Approval[]>}
 */
const findAllByReimbursement = async (reimbursementId) => {
  return db.Approval.findAll({
    where: { reimbursementId },
    include: [
      {
        model: db.User,
        as: 'approver',
        attributes: ['id', 'name', 'email', 'role'],
      },
    ],
    order: [['createdAt', 'ASC']],
  });
};

module.exports = {
  findByReimbursementAndRole,
  createApproval,
  findAllByReimbursement,
};
