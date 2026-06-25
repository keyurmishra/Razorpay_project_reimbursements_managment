'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  /**
   * Adds 'RM_APPROVED' to the enum_reimbursements_status PostgreSQL ENUM type.
   *
   * PostgreSQL requires ALTER TYPE to add new ENUM values; you cannot do this
   * with a simple column alteration. The IF NOT EXISTS guard makes this
   * migration safe to run multiple times.
   */
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_reimbursements_status" ADD VALUE IF NOT EXISTS 'RM_APPROVED';`
    );
  },

  /**
   * down — PostgreSQL does not support removing a value from an ENUM type
   * without dropping and recreating it (which would break existing rows).
   *
   * The safest rollback here is a no-op; remove rows with RM_APPROVED status
   * manually before attempting to remove the enum value in production.
   */
  async down(queryInterface, Sequelize) {
    // No safe automated rollback for ENUM value removal in PostgreSQL.
    // Manual intervention required if a true rollback is needed.
  },
};
