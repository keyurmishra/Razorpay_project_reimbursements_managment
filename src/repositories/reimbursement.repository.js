'use strict';

const db = require('../models');

/**
 * ReimbursementRepository
 * All direct Sequelize queries for the Reimbursement model live here.
 * Services must NOT import the model directly — always go through this layer.
 */

/**
 * Create a new reimbursement request.
 * Status is always forced to PENDING by the caller (service layer).
 *
 * @param {{ employeeId: number, title: string, description?: string, amount: number, status: string }} data
 * @returns {Promise<import('../models/reimbursement.model').Reimbursement>}
 */
const createReimbursement = async ({ employeeId, title, description, amount, status }) => {
  return db.Reimbursement.create({ employeeId, title, description, amount, status });
};

/**
 * Find a single reimbursement by its primary key.
 * Includes the submitting employee's basic info for response shaping.
 *
 * @param {number} id
 * @returns {Promise<import('../models/reimbursement.model').Reimbursement|null>}
 */
const findById = async (id) => {
  return db.Reimbursement.findByPk(id, {
    include: [
      {
        model: db.User,
        as: 'employee',
        attributes: ['id', 'name', 'email', 'role'],
      },
    ],
  });
};

/**
 * Find all reimbursements submitted by a specific employee (EMP view).
 * Returns all statuses, newest first.
 *
 * @param {number} employeeId
 * @returns {Promise<import('../models/reimbursement.model').Reimbursement[]>}
 */
const findAllByEmployee = async (employeeId) => {
  return db.Reimbursement.findAll({
    where: { employeeId },
    include: [
      {
        model: db.User,
        as: 'employee',
        attributes: ['id', 'name', 'email', 'role'],
      },
    ],
    order: [['createdAt', 'DESC']],
  });
};

/**
 * Find PENDING reimbursements from employees who directly report to this RM.
 *
 * Strategy: join Reimbursement → User (employee) → EmployeeManager, filter
 * where EmployeeManager.managerId = managerId AND status = PENDING.
 * Using a nested required include so only matched rows are returned (INNER JOIN).
 *
 * @param {number} managerId - The RM's user id
 * @returns {Promise<import('../models/reimbursement.model').Reimbursement[]>}
 */
const findPendingForManager = async (managerId) => {
  return db.Reimbursement.findAll({
    where: { status: 'PENDING' },
    include: [
      {
        model: db.User,
        as: 'employee',
        attributes: ['id', 'name', 'email', 'role'],
        required: true,           // INNER JOIN — only employees that have an assignment
        include: [
          {
            model: db.EmployeeManager,
            as: 'assignment',
            where: { managerId }, // only direct reports of this RM
            attributes: [],       // we don't need assignment columns in the response
            required: true,
          },
        ],
      },
    ],
    order: [['createdAt', 'DESC']],
  });
};

/**
 * Find all RM_APPROVED reimbursements (APE view — ready for payment processing).
 *
 * @returns {Promise<import('../models/reimbursement.model').Reimbursement[]>}
 */
const findRmApproved = async () => {
  return db.Reimbursement.findAll({
    where: { status: 'RM_APPROVED' },
    include: [
      {
        model: db.User,
        as: 'employee',
        attributes: ['id', 'name', 'email', 'role'],
      },
    ],
    order: [['createdAt', 'DESC']],
  });
};

/**
 * Find all APPROVED reimbursements (CFO view — fully authorised, awaiting payment).
 *
 * @returns {Promise<import('../models/reimbursement.model').Reimbursement[]>}
 */
const findApproved = async () => {
  return db.Reimbursement.findAll({
    where: { status: 'APPROVED' },
    include: [
      {
        model: db.User,
        as: 'employee',
        attributes: ['id', 'name', 'email', 'role'],
      },
    ],
    order: [['createdAt', 'DESC']],
  });
};

/**
 * Update the status of a reimbursement by its primary key.
 *
 * @param {number} id
 * @param {string} status - One of REIMBURSEMENT_STATUS values
 * @returns {Promise<[number]>} Affected row count
 */
const updateStatus = async (id, status) => {
  return db.Reimbursement.update({ status }, { where: { id } });
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
