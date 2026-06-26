'use strict';

const db = require('../db');
const { employeeManagers } = require('../db/schema');
const { eq } = require('drizzle-orm');

const findByEmployeeId = async (employeeId) => {
  const assignment = await db.query.employeeManagers.findFirst({
    where: eq(employeeManagers.employeeId, employeeId),
  });
  return assignment || null;
};

const createAssignment = async (employeeId, managerId) => {
  const [assignment] = await db
    .insert(employeeManagers)
    .values({
      employeeId,
      managerId,
    })
    .returning();
  return assignment;
};

const deleteAssignment = async (employeeId) => {
  await db.delete(employeeManagers).where(eq(employeeManagers.employeeId, employeeId));
};

module.exports = { findByEmployeeId, createAssignment, deleteAssignment };
