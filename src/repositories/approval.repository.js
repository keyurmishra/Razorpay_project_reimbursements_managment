'use strict';

const db = require('../db');
const { approvals } = require('../db/schema');
const { eq, and } = require('drizzle-orm');

const createApproval = async ({ reimbursementId, approverId, approverRole, decision }) => {
  const [approval] = await db
    .insert(approvals)
    .values({
      reimbursementId,
      approverId,
      approverRole,
      decision,
    })
    .returning();
  return approval;
};

const findByReimbursementAndRole = async (reimbursementId, approverRole) => {
  const approval = await db.query.approvals.findFirst({
    where: and(
      eq(approvals.reimbursementId, reimbursementId),
      eq(approvals.approverRole, approverRole)
    ),
  });
  return approval || null;
};

module.exports = { createApproval, findByReimbursementAndRole };
