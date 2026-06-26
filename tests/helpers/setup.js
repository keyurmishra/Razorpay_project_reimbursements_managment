'use strict';

const db = require('../../src/db');
const { users, employeeManagers, reimbursements, approvals } = require('../../src/db/schema');
const authService = require('../../src/services/auth.service');
const bcrypt = require('bcryptjs');

/**
 * Connect to database and clear all tables to ensure a clean state
 */
const setupDatabase = async () => {
  // Truncate all tables using Drizzle and raw SQL
  const { sql } = require('drizzle-orm');
  await db.execute(sql`TRUNCATE TABLE reimbursements, approvals, employee_managers, users RESTART IDENTITY CASCADE;`);
};

/**
 * Create a user directly in the DB
 */
const seedUser = async (name, email, password, role) => {
  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(users).values({
    name,
    email,
    passwordHash,
    role,
  }).returning();
  return user;
};

/**
 * Helper to get a JWT cookie string for supertest.
 */
const getAuthCookie = async (email, password) => {
  const { token } = await authService.login({ email, password });
  return [`authToken=${token}; HttpOnly`];
};

module.exports = {
  setupDatabase,
  seedUser,
  getAuthCookie,
  db,
};
