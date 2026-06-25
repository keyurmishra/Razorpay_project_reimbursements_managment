'use strict';

const { DataTypes, Model } = require('sequelize');

/**
 * Reimbursement Status Enum
 *
 * Lifecycle:
 *   PENDING     → submitted by employee, awaiting RM review
 *   RM_APPROVED → RM approved, awaiting APE (or CFO) processing
 *   APPROVED    → APE (or CFO) approved — fully authorised for payment
 *   REJECTED    → rejected at any stage by RM, APE, or CFO
 *   PAID        → APE has processed and disbursed the payment
 */
const REIMBURSEMENT_STATUS = Object.freeze({
  PENDING:     'PENDING',
  RM_APPROVED: 'RM_APPROVED',
  APPROVED:    'APPROVED',
  REJECTED:    'REJECTED',
  PAID:        'PAID',
});

class Reimbursement extends Model {
  /**
   * Define associations with other models.
   * Called automatically by src/models/index.js after all models are loaded.
   *
   * @param {Object} models - All registered Sequelize models
   */
  static associate(models) {
    // A reimbursement belongs to the employee who submitted it.
    // reimbursement.getEmployee() → User
    Reimbursement.belongsTo(models.User, {
      foreignKey: 'employeeId',
      as: 'employee',
    });

    // A reimbursement can have many approval decisions (one per stage in the
    // workflow: RM → APE → CFO).
    // reimbursement.getApprovals() → array of Approval rows
    Reimbursement.hasMany(models.Approval, {
      foreignKey: 'reimbursementId',
      as: 'approvals',
    });
  }
}

/**
 * Initialize the Reimbursement model and attach it to the Sequelize instance.
 *
 * @param {import('sequelize').Sequelize} sequelize
 * @returns {typeof Reimbursement}
 */
const initReimbursementModel = (sequelize) => {
  Reimbursement.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      employeeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'employee_id',
        validate: {
          notNull: { msg: 'employeeId is required.' },
        },
      },

      title: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Title cannot be empty.' },
          len: { args: [2, 200], msg: 'Title must be between 2 and 200 characters.' },
        },
      },

      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          notNull: { msg: 'Amount is required.' },
          isDecimal: { msg: 'Amount must be a valid number.' },
          min: { args: [0.01], msg: 'Amount must be greater than zero.' },
        },
      },

      status: {
        type: DataTypes.ENUM(...Object.values(REIMBURSEMENT_STATUS)),
        allowNull: false,
        defaultValue: REIMBURSEMENT_STATUS.PENDING,
        validate: {
          isIn: {
            args: [Object.values(REIMBURSEMENT_STATUS)],
            msg: `Status must be one of: ${Object.values(REIMBURSEMENT_STATUS).join(', ')}.`,
          },
        },
      },
    },
    {
      sequelize,
      modelName: 'Reimbursement',
      tableName: 'reimbursements',
      timestamps: true,   // createdAt / updatedAt
      underscored: true,  // camelCase JS ↔ snake_case columns
    }
  );

  return Reimbursement;
};

module.exports = { initReimbursementModel, REIMBURSEMENT_STATUS };
