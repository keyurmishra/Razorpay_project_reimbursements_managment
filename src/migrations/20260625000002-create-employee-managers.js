'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  /**
   * Creates the `employee_managers` table.
   *
   * Design decisions:
   *   - `employee_id` is the PRIMARY KEY (not a surrogate id).
   *     This means one employee row = one assignment, enforcing the
   *     "employee reports to exactly one RM" constraint at the DB level.
   *   - `manager_id` is a plain FK; many employees can share the same RM.
   *   - Both columns are FK-constrained to `users.id` with ON DELETE CASCADE
   *     so the assignment is automatically removed if either user is deleted.
   *   - A non-unique index on `manager_id` supports efficient "list all
   *     employees of this RM" queries.
   */
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('employee_managers', {
      employee_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },

      manager_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
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

    // Fast lookup: which RM does this employee report to?
    // (employee_id IS the PK so it's already indexed, but explicit naming is clear)

    // Fast lookup: which employees report to this RM?
    await queryInterface.addIndex('employee_managers', ['manager_id'], {
      name: 'employee_managers_manager_id_idx',
    });
  },

  /**
   * Drops the `employee_managers` table.
   */
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('employee_managers');
  },
};
