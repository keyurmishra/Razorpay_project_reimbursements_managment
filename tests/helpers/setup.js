'use strict';

const db = require('../../src/models');
const authService = require('../../src/services/auth.service');
const { connectDB } = require('../../src/config/database');
const bcrypt = require('bcryptjs');

/**
 * Connect to database and clear all tables to ensure a clean state
 */
const setupDatabase = async () => {
  // Test DB connection
  await db.sequelize.authenticate();
  
  // Truncate all tables. 
  // CASCADE handles foreign key dependencies.
  await db.sequelize.query('TRUNCATE TABLE reimbursements, approvals, employee_managers, users RESTART IDENTITY CASCADE;');
};

/**
 * Create a user directly in the DB (bypassing service rules for speed/convenience in tests)
 */
const seedUser = async (name, email, password, role) => {
  const passwordHash = await bcrypt.hash(password, 10);
  return db.User.create({
    name,
    email,
    passwordHash,
    role,
  });
};

/**
 * Helper to get a JWT cookie string for supertest.
 * Returns an array that can be passed to supertest's `.set('Cookie', ...)`
 */
const getAuthCookie = async (email, password) => {
  const { token } = await authService.login({ email, password });
  // Simulate what res.cookie does. Supertest expects an array of cookies.
  return [`authToken=${token}; HttpOnly`];
};

module.exports = {
  setupDatabase,
  seedUser,
  getAuthCookie,
  db,
};
