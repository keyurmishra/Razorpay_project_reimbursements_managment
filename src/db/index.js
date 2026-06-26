'use strict';

const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const schema = require('./schema');

// Disable prefetch as it is not supported for "Transaction" pool mode
const queryClient = postgres(process.env.DATABASE_URL, { prepare: false, ssl: 'require' });
const db = drizzle(queryClient, { schema });

module.exports = db;
