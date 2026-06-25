'use strict';

const { DataTypes, Model } = require('sequelize');

/**
 * Approval Decision Enum
 * The two possible outcomes of a review action.
 */
const APPROVAL_DECISION = Object.freeze({
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
});

/**
 * Approver Role Enum
 * Only these three roles can appear as approvers in the workflow.
 * Stored as a snapshot on each row so audit history is immutable
 * even if the user's role is changed later.
 */
const APPROVER_ROLE = Object.freeze({
  RM:  'RM',
  APE: 'APE',
  CFO: 'CFO',
});

class Approval extends Model {
  /**
   * Define associations with other models.
   * Called automatically by src/models/index.js after all models are loaded.
   *
   * @param {Object} models - All registered Sequelize models
   */
  static associate(models) {
    // Each approval record belongs to one reimbursement request.
    // approval.getReimbursement() → Reimbursement
    Approval.belongsTo(models.Reimbursement, {
      foreignKey: 'reimbursementId',
      as: 'reimbursement',
    });

    // Each approval record belongs to the approver who made the decision.
    // approval.getApprover() → User (nullable if approver account was deleted)
    Approval.belongsTo(models.User, {
      foreignKey: 'approverId',
      as: 'approver',
    });
  }
}

/**
 * Initialize the Approval model and attach it to the Sequelize instance.
 *
 * @param {import('sequelize').Sequelize} sequelize
 * @returns {typeof Approval}
 */
const initApprovalModel = (sequelize) => {
  Approval.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      reimbursementId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'reimbursement_id',
        validate: {
          notNull: { msg: 'reimbursementId is required.' },
        },
      },

      approverId: {
        type: DataTypes.INTEGER,
        allowNull: true,            // SET NULL on FK if approver user is deleted
        field: 'approver_id',
      },

      approverRole: {
        type: DataTypes.ENUM(...Object.values(APPROVER_ROLE)),
        allowNull: false,
        field: 'approver_role',
        validate: {
          isIn: {
            args: [Object.values(APPROVER_ROLE)],
            msg: `approverRole must be one of: ${Object.values(APPROVER_ROLE).join(', ')}.`,
          },
        },
      },

      decision: {
        type: DataTypes.ENUM(...Object.values(APPROVAL_DECISION)),
        allowNull: false,
        validate: {
          isIn: {
            args: [Object.values(APPROVAL_DECISION)],
            msg: `decision must be one of: ${Object.values(APPROVAL_DECISION).join(', ')}.`,
          },
        },
      },

      approvedAt: {
        type: DataTypes.DATE,
        allowNull: true,            // set to NOW() when the decision is persisted
        field: 'approved_at',
      },
    },
    {
      sequelize,
      modelName: 'Approval',
      tableName: 'approvals',
      timestamps: true,   // createdAt / updatedAt
      underscored: true,  // camelCase JS ↔ snake_case columns
    }
  );

  return Approval;
};

module.exports = { initApprovalModel, APPROVAL_DECISION, APPROVER_ROLE };
