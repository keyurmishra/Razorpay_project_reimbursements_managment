'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  /**
   * Creates the `approvals` table.
   *
   * Design decisions:
   *   - One `approvals` row per decision event. A reimbursement can have
   *     multiple rows (e.g. RM approved → APE approved / rejected).
   *   - `approver_role` is stored as a snapshot of the approver's role at
   *     decision time. This preserves audit history even if the user's role
   *     is later changed.
   *   - `approver_id` uses SET NULL on DELETE so the approval record is
   *     retained for auditing even if the approver's account is removed.
   *   - `reimbursement_id` uses CASCADE on DELETE — approvals are meaningless
   *     without their parent reimbursement.
   *   - `approved_at` is nullable; it is set only when a decision is recorded.
   *     A NULL value indicates the row was created but no decision made yet
   *     (useful if a draft/pending state is ever needed).
   */
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('approvals', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      reimbursement_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'reimbursements',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },

      approver_id: {
        type: Sequelize.INTEGER,
        allowNull: true,            // SET NULL keeps audit trail if user is deleted
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },

      approver_role: {
        type: Sequelize.ENUM('RM', 'APE', 'CFO'),
        allowNull: false,
      },

      decision: {
        type: Sequelize.ENUM('APPROVED', 'REJECTED'),
        allowNull: false,
      },

      approved_at: {
        type: Sequelize.DATE,
        allowNull: true,            // set at the moment the decision is recorded
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },

      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // ── Indexes ─────────────────────────────────────────────────────────────────

    // "All approval decisions for this reimbursement" (most common query)
    await queryInterface.addIndex('approvals', ['reimbursement_id'], {
      name: 'approvals_reimbursement_id_idx',
    });

    // "All decisions made by this approver" (audit / reporting)
    await queryInterface.addIndex('approvals', ['approver_id'], {
      name: 'approvals_approver_id_idx',
    });
  },

  /**
   * Drops the `approvals` table and its ENUM types (PostgreSQL specific).
   */
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('approvals');

    // PostgreSQL keeps ENUM types even after the table is dropped.
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_approvals_approver_role";'
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_approvals_decision";'
    );
  },
};
