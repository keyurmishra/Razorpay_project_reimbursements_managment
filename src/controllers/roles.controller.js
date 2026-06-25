'use strict';

const rolesService = require('../services/roles.service');
const { validateAssignRole } = require('../validations/roles.validation');
const asyncHandler = require('../utils/asyncHandler');

/**
 * assignRole
 *
 * @route   POST /rest/roles/assign
 * @access  Private — CFO only  (enforced by authenticate + authorize in the router)
 *
 * @desc    Assigns a new role to an existing user.
 *          The acting user must be authenticated as CFO.
 *          A CFO cannot change their own role.
 */
const assignRole = asyncHandler(async (req, res) => {
  // 1. Validate request body — throws AppError(400) on failure
  validateAssignRole(req.body);

  const userId = Number(req.body.userId);
  const role   = req.body.role.trim().toUpperCase();

  // 2. Delegate to service (contains business-rule guard for self-demotion)
  const updatedUser = await rolesService.assignRole(userId, role, req.user);

  // 3. Respond
  return res.status(200).json({
    success: true,
    message: `Role updated to '${role}' for user ${updatedUser.email}.`,
    data: { user: updatedUser },
  });
});

module.exports = { assignRole };
