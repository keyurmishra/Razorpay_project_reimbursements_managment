'use strict';

const employeesService = require('../services/employees.service');
const { validateAssignEmployee, validateRemoveEmployee } = require('../validations/employees.validation');
const asyncHandler = require('../utils/asyncHandler');

/**
 * assignEmployee
 *
 * @route   POST /rest/employees/assign
 * @access  Private — CFO only  (enforced by authenticate + authorize in the router)
 *
 * @desc    Assigns an employee to a reporting manager (RM).
 */
const assignEmployee = asyncHandler(async (req, res) => {
  // 1. Validate body shape
  validateAssignEmployee(req.body);

  const employeeId = Number(req.body.employeeId);
  const managerId  = Number(req.body.managerId);

  // 2. Delegate to service (all business-rule checks happen there)
  const assignment = await employeesService.assignEmployee(employeeId, managerId);

  // 3. Respond
  return res.status(201).json({
    success: true,
    message: `Employee ${assignment.employee.email} has been assigned to manager ${assignment.manager.email}.`,
    data: { assignment },
  });
});

/**
 * removeEmployee
 *
 * @route   DELETE /rest/employees/assign
 * @access  Private — CFO only  (enforced by authenticate + authorize in the router)
 *
 * @desc    Removes the manager assignment for an employee.
 */
const removeEmployee = asyncHandler(async (req, res) => {
  // 1. Validate body shape
  validateRemoveEmployee(req.body);

  const employeeId = Number(req.body.employeeId);

  // 2. Delegate to service
  await employeesService.removeEmployee(employeeId);

  // 3. Respond — 200 with body (204 cannot carry a body)
  return res.status(200).json({
    success: true,
    message: `Manager assignment for employee ${employeeId} has been removed.`,
  });
});

/**
 * listEmployees
 *
 * @route   GET /rest/employees
 * @access  Private — RM, APE, CFO  (EMP denied by authorize middleware)
 *
 * @desc    Returns users visible to the authenticated role.
 *          RM   → direct subordinates
 *          APE  → all EMP and RM
 *          CFO  → all users
 */
const listEmployees = asyncHandler(async (req, res) => {
  const users = await employeesService.listEmployees(req.user);

  return res.status(200).json({
    success: true,
    count: users.length,
    data: { users },
  });
});

module.exports = { assignEmployee, removeEmployee, listEmployees };
