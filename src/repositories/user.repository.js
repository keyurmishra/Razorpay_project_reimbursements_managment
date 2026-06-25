'use strict';

const db = require('../models');

/**
 * UserRepository
 * All direct Sequelize queries for the User model live here.
 * Services must NOT import the model directly — always go through this layer.
 *
 * NOTE: db.User is accessed inside each function (not destructured at the top)
 * to avoid capturing undefined during the module-load circular-reference window.
 */

/**
 * Find a user by email.
 * Uses the defaultScope, so passwordHash is excluded.
 *
 * @param {string} email
 * @returns {Promise<import('../models/user.model').User|null>}
 */
const findByEmail = async (email) => {
  return db.User.findOne({ where: { email: email.toLowerCase().trim() } });
};

/**
 * Find a user by email AND include the passwordHash field.
 * ONLY use this in the auth service during login verification.
 *
 * @param {string} email
 * @returns {Promise<import('../models/user.model').User|null>}
 */
const findByEmailWithPassword = async (email) => {
  return db.User.scope('withPassword').findOne({
    where: { email: email.toLowerCase().trim() },
  });
};

/**
 * Find a user by primary key (id).
 * Uses the defaultScope, so passwordHash is excluded.
 *
 * @param {number} id
 * @returns {Promise<import('../models/user.model').User|null>}
 */
const findById = async (id) => {
  return db.User.findByPk(id);
};

/**
 * Create a new user record.
 *
 * @param {{ name: string, email: string, passwordHash: string, role?: string }} data
 * @returns {Promise<import('../models/user.model').User>}
 */
const createUser = async ({ name, email, passwordHash, role }) => {
  return db.User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash,
    role,
  });
};

/**
 * Update the role of an existing user by their primary key.
 *
 * Returns the number of rows affected ([1] on success, [0] if id not found).
 *
 * @param {number} id   - User's primary key
 * @param {string} role - New role value (must match the ENUM defined in user.model.js)
 * @returns {Promise<[number]>}
 */
const updateRole = async (id, role) => {
  return db.User.update({ role }, { where: { id } });
};

/**
 * Find all users who are direct reports of a given manager (RM view).
 *
 * Uses a required include through EmployeeManager to restrict the result
 * to employees assigned to this RM — equivalent to:
 *   SELECT users.* FROM users
 *   INNER JOIN employee_managers em ON em.employee_id = users.id
 *   WHERE em.manager_id = managerId
 *
 * @param {number} managerId - The RM's user id
 * @returns {Promise<import('../models/user.model').User[]>}
 */
const findDirectReports = async (managerId) => {
  return db.User.findAll({
    include: [
      {
        model: db.EmployeeManager,
        as: 'assignment',
        where: { managerId },   // filter: only this RM's direct reports
        attributes: ['managerId', 'createdAt'],  // expose assignment metadata
        required: true,         // INNER JOIN — exclude unassigned employees
      },
    ],
    order: [['name', 'ASC']],
  });
};

/**
 * Find all users whose role is in the given list (APE view).
 *
 * @param {string[]} roles - Array of role strings, e.g. ['EMP', 'RM']
 * @returns {Promise<import('../models/user.model').User[]>}
 */
const findByRoles = async (roles) => {
  return db.User.findAll({
    where: { role: roles },   // Sequelize translates array → WHERE role IN (...)
    order: [['name', 'ASC']],
  });
};

/**
 * Find all users in the system (CFO view).
 * passwordHash is excluded via the model's defaultScope.
 *
 * @returns {Promise<import('../models/user.model').User[]>}
 */
const findAllUsers = async () => {
  return db.User.findAll({
    order: [['role', 'ASC'], ['name', 'ASC']],
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
