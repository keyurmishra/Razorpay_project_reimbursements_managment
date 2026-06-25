'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  /**
   * Creates the `reimbursements` table.
   *
   * Design decisions:
   *   - `employee_id` is a FK → users.id with ON DELETE CASCADE so all
   *     reimbursement records are removed if the employee is deleted.
   *   - `amount` uses DECIMAL(10, 2) — exact arithmetic, two decimal places,
   *     supports up to 99,999,999.99 which is more than enough for any claim.
   *   - `status` is a DB-level ENUM to enforce the allowed lifecycle values.
   *   - Separate indexes on employee_id and status support the common query
   *     patterns: "all requests by this employee" and "all PENDING requests".
   */
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('reimbursements', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },

      title: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },

      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },

      status: {
        type: Sequelize.ENUM('PENDING', 'RM_APPROVED', 'APPROVED', 'REJECTED', 'PAID'),
        allowNull: false,
        defaultValue: 'PENDING',
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

    // "All reimbursements submitted by employee X"
    await queryInterface.addIndex('reimbursements', ['employee_id'], {
      name: 'reimbursements_employee_id_idx',
    });

    // "All reimbursements in a given status" (e.g. all PENDING for RM review)
    await queryInterface.addIndex('reimbursements', ['status'], {
      name: 'reimbursements_status_idx',
    });
  },

  /**
   * Drops the `reimbursements` table and its ENUM type (PostgreSQL specific).
   */
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('reimbursements');

    // PostgreSQL keeps ENUM types even after the table is dropped.
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_reimbursements_status";'
    );
  },
};
