'use strict';

const db = require('../db');
const { reimbursements, employeeManagers, users } = require('../db/schema');
const { eq, and, desc } = require('drizzle-orm');

const userColumns = {
  id: true,
  name: true,
  email: true,
  role: true,
};

const createReimbursement = async (employeeId, { title, description, amount }) => {
  const [reimbursement] = await db
    .insert(reimbursements)
    .values({
      employeeId,
      title: title.trim(),
      description: description ? description.trim() : null,
      amount,
      status: 'PENDING',
    })
    .returning();
  return reimbursement;
};

const findById = async (id) => {
  const reimbursement = await db.query.reimbursements.findFirst({
    where: eq(reimbursements.id, id),
    with: {
      employee: {
        columns: userColumns,
      },
      approvals: {
        with: {
          approver: {
            columns: userColumns,
          },
        },
      },
    },
  });
  return reimbursement || null;
};

const findAllByEmployee = async (employeeId) => {
  return db.query.reimbursements.findMany({
    where: eq(reimbursements.employeeId, employeeId),
    with: {
      employee: { columns: userColumns },
    },
    orderBy: (reimbursements, { desc }) => [desc(reimbursements.createdAt)],
  });
};

const findPendingForManager = async (managerId) => {
  // Find reimbursements WHERE status='PENDING' AND employee_id IN (subordinates)
  // With Drizzle relational queries, it's easier to join or query the employeeManagers
  
  // Get all employee IDs for this manager
  const assignments = await db.query.employeeManagers.findMany({
    where: eq(employeeManagers.managerId, managerId),
    columns: { employeeId: true },
  });
  const employeeIds = assignments.map(a => a.employeeId);

  if (employeeIds.length === 0) return [];

  // Query reimbursements matching those employees and PENDING
  const { inArray } = require('drizzle-orm');
  
  return db.query.reimbursements.findMany({
    where: and(
      eq(reimbursements.status, 'PENDING'),
      inArray(reimbursements.employeeId, employeeIds)
    ),
    with: {
      employee: { columns: userColumns },
    },
    orderBy: (reimbursements, { desc }) => [desc(reimbursements.createdAt)],
  });
};

const findRmApproved = async () => {
  return db.query.reimbursements.findMany({
    where: eq(reimbursements.status, 'RM_APPROVED'),
    with: {
      employee: { columns: userColumns },
    },
    orderBy: (reimbursements, { desc }) => [desc(reimbursements.createdAt)],
  });
};

const findApproved = async () => {
  return db.query.reimbursements.findMany({
    where: eq(reimbursements.status, 'APPROVED'),
    with: {
      employee: { columns: userColumns },
    },
    orderBy: (reimbursements, { desc }) => [desc(reimbursements.createdAt)],
  });
};

const updateStatus = async (id, status) => {
  const [updated] = await db
    .update(reimbursements)
    .set({ status, updatedAt: new Date().toISOString() })
    .where(eq(reimbursements.id, id))
    .returning({ id: reimbursements.id });
  return updated ? [1] : [0];
};

module.exports = {
  createReimbursement,
  findById,
  findAllByEmployee,
  findPendingForManager,
  findRmApproved,
  findApproved,
  updateStatus,
};
