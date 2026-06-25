'use strict';

const { sequelize } = require('../config/database');
const { initUserModel }            = require('./user.model');
const { initEmployeeManagerModel } = require('./employeeManager.model');
const { initReimbursementModel }   = require('./reimbursement.model');
const { initApprovalModel }        = require('./approval.model');

/**
 * Central model registry.
 *
 * Steps to add a new model:
 *   1. Create  src/models/<name>.model.js  exporting an init<Name>Model function.
 *   2. Import and call it below, assigning the result to db.<Name>.
 *   3. Define associations inside the model's static associate() method.
 *
 * Usage anywhere in the app:
 *   const db = require('./models');
 *   const users = await db.User.findAll();
 */
const db = {};

// ── Register models ───────────────────────────────────────────────────────────
db.User            = initUserModel(sequelize);
db.EmployeeManager = initEmployeeManagerModel(sequelize);
db.Reimbursement   = initReimbursementModel(sequelize);
db.Approval        = initApprovalModel(sequelize);

// ── Run associations ──────────────────────────────────────────────────────────
// Each model's static associate() method declares its relationships.
// This runs after ALL models are loaded, so cross-references are safe.
Object.values(db).forEach((model) => {
  if (typeof model.associate === 'function') {
    model.associate(db);
  }
});

// ── Expose Sequelize instance ─────────────────────────────────────────────────
db.sequelize = sequelize;

module.exports = db;
