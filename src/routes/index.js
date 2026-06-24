'use strict';

const express = require('express');
const router = express.Router();

/**
 * API Health Check
 * GET /api/health
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is up and running 🚀',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ── Mount feature routers here ────────────────────────────────────────────────
// Example (uncomment when routes are created):
// const authRoutes = require('./auth.routes');
// router.use('/auth', authRoutes);

module.exports = router;
