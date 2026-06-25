'use strict';

const userRepository            = require('../repositories/user.repository');
const employeeManagerRepository = require('../repositories/employeeManager.repository');
const AppError = require('../utils/AppError');

// ── Service Methods ───────────────────────────────────────────────────────────

/**
 * assignEmployee
 *
 * Assigns an employee to a reporting manager (RM).
 *
 * Business rules enforced (in order):
 *   1. Employee user must exist.
 *   2. Manager user must exist.
 *   3. The manager's role must be 'RM'.
 *   4. The employee must not already have a manager assignment
 *      (one-to-one constraint — also enforced at DB level via PK on employee_id).
 *
 * @param {number} employeeId
 * @param {number} managerId
 * @returns {Promise<object>} The created assignment record
 * @throws {AppError} 404  Employee or manager not found
 * @throws {AppError} 422  Manager is not an RM
 * @throws {AppError} 409  Employee already has a manager assigned
 */
const assignEmployee = async (employeeId, managerId) => {
  // ── Rule 1: Employee must exist ─────────────────────────────────────────────
  const employee = await userRepository.findById(employeeId);
  if (!employee) {
    throw new AppError(`No user found with employeeId ${employeeId}.`, 404);
  }

  // ── Rule 2: Manager must exist ──────────────────────────────────────────────
  const manager = await userRepository.findById(managerId);
  if (!manager) {
    throw new AppError(`No user found with managerId ${managerId}.`, 404);
  }

  // ── Rule 3: Manager must be an RM ──────────────────────────────────────────
  if (manager.role !== 'RM') {
    throw new AppError(
      `User ${managerId} has role '${manager.role}'. Only users with role 'RM' can be assigned as managers.`,
      422
    );
  }

  // ── Rule 4: Employee must not already have a manager ───────────────────────
  const existing = await employeeManagerRepository.findByEmployeeId(employeeId);
  if (existing) {
    throw new AppError(
      `Employee ${employeeId} already has a manager assigned (managerId: ${existing.managerId}). ` +
      `Remove the existing assignment first.`,
      409
    );
  }

  // ── Persist ─────────────────────────────────────────────────────────────────
  const assignment = await employeeManagerRepository.createAssignment(employeeId, managerId);

  return {
    employeeId: assignment.employeeId,
    managerId:  assignment.managerId,
    employee:   { id: employee.id, name: employee.name, email: employee.email, role: employee.role },
    manager:    { id: manager.id,  name: manager.name,  email: manager.email,  role: manager.role  },
    createdAt:  assignment.createdAt,
  };
};

/**
 * removeEmployee
 *
 * Removes the manager assignment for an employee.
 *
 * Business rules enforced:
 *   1. Employee user must exist.
 *   2. An assignment must actually exist before attempting to remove it.
 *
 * @param {number} employeeId
 * @returns {Promise<void>}
 * @throws {AppError} 404  Employee not found or has no assignment
 */
const removeEmployee = async (employeeId) => {
  // ── Rule 1: Employee must exist ─────────────────────────────────────────────
  const employee = await userRepository.findById(employeeId);
  if (!employee) {
    throw new AppError(`No user found with employeeId ${employeeId}.`, 404);
  }

  // ── Rule 2: Assignment must exist ───────────────────────────────────────────
  const existing = await employeeManagerRepository.findByEmployeeId(employeeId);
  if (!existing) {
    throw new AppError(
      `Employee ${employeeId} does not have a manager assignment to remove.`,
      404
    );
  }

  // ── Delete ──────────────────────────────────────────────────────────────────
  await employeeManagerRepository.deleteAssignment(employeeId);
};

/**
 * listEmployees
 *
 * Returns users visible to the authenticated user based on their role.
 *
 * Visibility rules:
 *   EMP  → 403 Access denied
 *   RM   → direct subordinates only (users assigned to this RM)
 *   APE  → all users with role EMP or RM
 *   CFO  → all users in the system
 *
 * @param {object} actingUser - req.user (the authenticated user)
 * @returns {Promise<object[]>} Array of user records (passwordHash excluded)
 * @throws {AppError} 403  If called by an EMP
 */
const listEmployees = async (actingUser) => {
  const { id: userId, role } = actingUser;

  switch (role) {
    case 'EMP':
      throw new AppError('Access denied. Employees cannot view the user directory.', 403);

    case 'RM':
      // Only this RM's direct reports (via employee_managers join)
      return userRepository.findDirectReports(userId);

    case 'APE':
      // All employees and managers — the operational workforce APE deals with
      return userRepository.findByRoles(['EMP', 'RM']);

    case 'CFO':
      // Full visibility over all users
      return userRepository.findAllUsers();

    default:
      throw new AppError(`Role '${role}' is not recognised.`, 403);
  }
};

module.exports = { assignEmployee, removeEmployee, listEmployees };
