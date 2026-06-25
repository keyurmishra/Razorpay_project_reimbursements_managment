'use strict';

const { DataTypes, Model } = require('sequelize');

/**
 * User Roles Enum
 * EMP  — Employee         (submits reimbursement requests)
 * RM   — Reporting Manager (reviews team requests)
 * APE  — Accounts Payable (processes approved payments)
 * CFO  — CFO              (final approval authority)
 */
const USER_ROLES = Object.freeze({
  EMP: 'EMP',
  RM: 'RM',
  APE: 'APE',
  CFO: 'CFO',
});

class User extends Model {
  /**
   * Define associations with other models.
   * Called automatically by src/models/index.js after all models are loaded.
   *
   * @param {Object} models - All registered Sequelize models
   */
  static associate(models) {
    // An employee has at most one manager assignment record.
    // employee.getAssignment() → EmployeeManager row (or null)
    User.hasOne(models.EmployeeManager, {
      foreignKey: 'employeeId',
      as: 'assignment',
    });

    // A manager (RM) can have many employee assignments.
    // manager.getEmployees() → array of EmployeeManager rows
    User.hasMany(models.EmployeeManager, {
      foreignKey: 'managerId',
      as: 'managedEmployees',
    });

    // An employee can submit many reimbursement requests.
    // employee.getReimbursements() → array of Reimbursement rows
    User.hasMany(models.Reimbursement, {
      foreignKey: 'employeeId',
      as: 'reimbursements',
    });

    // An approver (RM / APE / CFO) can make many approval decisions.
    // approver.getApprovalsMade() → array of Approval rows
    User.hasMany(models.Approval, {
      foreignKey: 'approverId',
      as: 'approvalsMade',
    });
  }
}

/**
 * Initialize the User model and attach it to the Sequelize instance.
 *
 * @param {import('sequelize').Sequelize} sequelize
 * @returns {typeof User}
 */
const initUserModel = (sequelize) => {
  User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Name cannot be empty.' },
          len: { args: [2, 100], msg: 'Name must be between 2 and 100 characters.' },
        },
      },

      email: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: { msg: 'This email address is already registered.' },
        validate: {
          isEmail: { msg: 'Must be a valid email address.' },
          notEmpty: { msg: 'Email cannot be empty.' },
        },
      },

      passwordHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        // Never expose the hash in API responses.
        // Exclude it at query level using: { attributes: { exclude: ['passwordHash'] } }
      },

      role: {
        type: DataTypes.ENUM(...Object.values(USER_ROLES)),
        allowNull: false,
        defaultValue: USER_ROLES.EMP,
        validate: {
          isIn: {
            args: [Object.values(USER_ROLES)],
            msg: `Role must be one of: ${Object.values(USER_ROLES).join(', ')}.`,
          },
        },
      },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      timestamps: true,           // createdAt, updatedAt managed by Sequelize
      underscored: true,          // maps camelCase fields → snake_case columns
      defaultScope: {
        attributes: { exclude: ['passwordHash'] }, // passwordHash hidden by default
      },
      scopes: {
        // withPassword: overrides defaultScope to include ALL columns.
        // attributes: { exclude: [] } is the correct pattern — an empty
        // exclude list means "don't exclude anything", so passwordHash is returned.
        withPassword: {
          attributes: { exclude: [] },
        },
      },
    }
  );

  return User;
};

module.exports = { initUserModel, USER_ROLES };
