'use strict';

const db = require('../db');
const { users, employeeManagers } = require('../db/schema');
const { eq, inArray, and } = require('drizzle-orm');

// Helper to exclude passwordHash
const excludePassword = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
};

const findByEmail = async (email) => {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase().trim()),
    columns: excludePassword,
  });
  return user || null;
};

const findByEmailWithPassword = async (email) => {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase().trim()),
  });
  return user || null;
};

const findById = async (id) => {
  const user = await db.query.users.findFirst({
    where: eq(users.id, id),
    columns: excludePassword,
  });
  return user || null;
};

const createUser = async ({ name, email, passwordHash, role }) => {
  const [user] = await db
    .insert(users)
    .values({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: role || 'EMP',
    })
    .returning(excludePassword);
  return user;
};

const updateRole = async (id, role) => {
  const [updated] = await db
    .update(users)
    .set({ role, updatedAt: new Date().toISOString() })
    .where(eq(users.id, id))
    .returning({ id: users.id });
  
  return updated ? [1] : [0];
};

const findDirectReports = async (managerId) => {
  // We need users who have a manager matching managerId
  // In Drizzle, we can query users and include their managerAssignment if it matches managerId
  // Wait, relational query might return users even if the with-condition fails (it just returns null for the relation).
  // So it's better to query employeeManagers and include the employee, then map the result.
  const assignments = await db.query.employeeManagers.findMany({
    where: eq(employeeManagers.managerId, managerId),
    with: {
      employee: {
        columns: excludePassword,
      },
    },
    orderBy: (assignments, { asc }) => [asc(assignments.createdAt)],
  });

  // Map to match the Sequelize output format which returned users with assignment attached
  return assignments
    .map((a) => {
      const user = a.employee;
      if (!user) return null; // should not happen with FK constraint
      user.assignment = {
        managerId: a.managerId,
        createdAt: a.createdAt,
      };
      return user;
    })
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name));
};

const findByRoles = async (roles) => {
  return db.query.users.findMany({
    where: inArray(users.role, roles),
    columns: excludePassword,
    orderBy: (users, { asc }) => [asc(users.name)],
  });
};

const findAllUsers = async () => {
  return db.query.users.findMany({
    columns: excludePassword,
    orderBy: (users, { asc }) => [asc(users.role), asc(users.name)],
  });
};

module.exports = {
  findByEmail,
  findByEmailWithPassword,
  findById,
  createUser,
  updateRole,
  findDirectReports,
  findByRoles,
  findAllUsers,
};
