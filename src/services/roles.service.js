'use strict';

const userRepository = require('../repositories/user.repository');
const AppError = require('../utils/AppError');

// ── Service Methods ───────────────────────────────────────────────────────────

/**
 * assignRole
 *
 * Assigns a new role to an existing user.
 *
 * Steps:
 *   1. Confirm the target user exists.
 *   2. Prevent the CFO from demoting themselves
 *      (the system must always have at least one CFO account reachable).
 *   3. Persist the role change via the repository.
 *   4. Return the updated user record (passwordHash excluded by defaultScope).
 *
 * @param {number} targetUserId  - PK of the user whose role is being changed
 * @param {string} newRole       - One of EMP | RM | APE | CFO
 * @param {object} actingUser    - req.user (the authenticated CFO performing the action)
 * @returns {Promise<object>}    - Updated user object (no passwordHash)
 * @throws {AppError} 404        - Target user not found
 * @throws {AppError} 403        - CFO attempting to change their own role
 */
const assignRole = async (targetUserId, newRole, actingUser) => {
  // ── Step 1: Confirm target user exists ──────────────────────────────────────
  const targetUser = await userRepository.findById(targetUserId);

  if (!targetUser) {
    throw new AppError(`No user found with id ${targetUserId}.`, 404);
  }

  // ── Step 2: Prevent CFO self-demotion ───────────────────────────────────────
  // A CFO cannot change their own role — this guards against accidental
  // lock-out where the system is left with no CFO account.
  if (targetUser.id === actingUser.id) {
    throw new AppError(
      'You cannot change your own role. Ask another CFO to perform this action.',
      403
    );
  }

  // ── Step 3: Persist role change ─────────────────────────────────────────────
  await userRepository.updateRole(targetUserId, newRole);

  // ── Step 4: Return the refreshed user record ─────────────────────────────────
  // Re-fetch to pick up the updated value; defaultScope excludes passwordHash.
  const updatedUser = await userRepository.findById(targetUserId);

  return updatedUser;
};

module.exports = { assignRole };
