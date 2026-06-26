'use strict';

require('dotenv').config();

const app = require('./src/app');

const PORT = process.env.PORT || 7002;

/**
 * Bootstrap the application:
 * 1. Start the Express HTTP server
 */
const startServer = async () => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
  });
};

startServer().catch((err) => {
  console.error('❌ Failed to start server:', err.message);
  process.exit(1);
});
