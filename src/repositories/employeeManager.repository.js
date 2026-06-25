'use strict';

const db = require('../models');

/**
 * EmployeeManagerRepository
 * All direct Sequelize queries for the EmployeeManager model live here.
 * Services must NOT import the model directly — always go through this layer.
 */

/**
 * Find the current manager assignment for a given employee.
 *
 * @param {number} employeeId
 * @returns {Promise<import('../models/employeeManager.model').EmployeeManager|null>}
 */
const findByEmployeeId = async (employeeId) => {
  return db.EmployeeManager.findOne({ where: { employeeId } });
};

/**
 * Create a new employee-manager assignment.
 *
 * @param {number} employeeId
 * @param {number} managerId
 * @returns {Promise<import('../models/employeeManager.model').EmployeeManager>}
 */
const createAssignment = async (employeeId, managerId) => {
  return db.EmployeeManager.create({ employeeId, managerId });
};

/**
 * Delete the manager assignment for a given employee.
 * Returns the number of rows deleted (1 on success, 0 if no row existed).
 *
 * @param {number} employeeId
 * @returns {Promise<number>}
 */
const deleteAssignment = async (employeeId) => {
  return db.EmployeeManager.destroy({ where: { employeeId } });
};

module.exports = {
  findByEmployeeId,
  createAssignment,
  deleteAssignment,
};
