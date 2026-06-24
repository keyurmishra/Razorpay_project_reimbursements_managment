'use strict';

const { sequelize } = require('../config/database');

/**
 * Base model loader.
 * Import all models here to register them with the Sequelize instance.
 * This file is the single entry point for model associations.
 *
 * Usage:
 *   const db = require('./index');
 *   db.User.findAll();
 */
const db = {};

// ── Register models ──────────────────────────────────────────────────────────
// Example (uncomment when models are created):
// db.User = require('./user.model')(sequelize);

// ── Define associations ───────────────────────────────────────────────────────
// Object.values(db).forEach((model) => {
//   if (typeof model.associate === 'function') {
//     model.associate(db);
//   }
// });

db.sequelize = sequelize;

module.exports = db;
