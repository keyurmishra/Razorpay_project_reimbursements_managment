'use strict';

require('dotenv').config();

const express = require('express');
const cookieParser = require('cookie-parser');

const routes = require('./routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ── Core Middleware ────────────────────────────────────────────────────────────
app.use(express.json());                          // Parse JSON request bodies
app.use(express.urlencoded({ extended: true }));  // Parse URL-encoded request bodies
app.use(cookieParser(process.env.COOKIE_SECRET)); // Parse cookies (with optional signing)

// ── API Routes ─────────────────────────────────────────────────────────────────
app.use('/api', routes);

// ── 404 Handler ────────────────────────────────────────────────────────────────
app.use(notFound);

// ── Global Error Handler ───────────────────────────────────────────────────────
// Must be registered LAST — after all routes and other middleware
app.use(errorHandler);

module.exports = app;
