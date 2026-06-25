'use strict';

const { DataTypes, Model } = require('sequelize');

class EmployeeManager extends Model {
  /**
   * Define associations with other models.
   * Called automatically by src/models/index.js after all models are loaded.
   *
   * Relationships:
   *   - An EmployeeManager record belongs to one User as the "employee".
   *   - An EmployeeManager record belongs to one User as the "manager".
   *
   * @param {Object} models - All registered Sequelize models
   */
  static associate(models) {
    // The employee side of this assignment
    EmployeeManager.belongsTo(models.User, {
      foreignKey: 'employeeId',
      as: 'employee',
    });

    // The manager (RM) side of this assignment
    EmployeeManager.belongsTo(models.User, {
      foreignKey: 'managerId',
      as: 'manager',
    });
  }
}

/**
 * Initialize the EmployeeManager model and attach it to the Sequelize instance.
 *
 * Table: `employee_managers`
 * Primary Key: `employee_id` (not a surrogate — one row per employee enforces
 *              the "exactly one manager" constraint at the database level).
 *
 * @param {import('sequelize').Sequelize} sequelize
 * @returns {typeof EmployeeManager}
 */
const initEmployeeManagerModel = (sequelize) => {
  EmployeeManager.init(
    {
      employeeId: {
        type: DataTypes.INTEGER,
        primaryKey: true,       // PK on employeeId → one assignment per employee
        allowNull: false,
        field: 'employee_id',  // explicit snake_case mapping (underscored: true handles this,
                               // but being explicit makes the intent obvious)
      },

      managerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'manager_id',
      },
    },
    {
      sequelize,
      modelName: 'EmployeeManager',
      tableName: 'employee_managers',
      timestamps: true,   // createdAt / updatedAt
      underscored: true,  // camelCase JS ↔ snake_case columns
    }
  );

  return EmployeeManager;
};

module.exports = { initEmployeeManagerModel };
