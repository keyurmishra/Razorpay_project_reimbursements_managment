'use strict';

const express    = require('express');
const router     = express.Router();

const authenticate   = require('../middleware/authenticate');
const authorize      = require('../middleware/authorize');
const rolesController = require('../controllers/roles.controller');

/**
 * Roles Routes
 * Base path: /rest/roles  (mounted in src/routes/index.js)
 *
 * POST /rest/roles/assign
 *   → authenticate  : verify JWT cookie, attach req.user
 *   → authorize     : allow CFO only (403 for all other roles)
 *   → assignRole    : validate body, update role, return updated user
 */
router.post(
  '/assign',
  authenticate,
  authorize('CFO'),
  rolesController.assignRole
);

module.exports = router;
