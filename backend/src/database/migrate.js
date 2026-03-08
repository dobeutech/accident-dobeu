/* eslint-disable no-restricted-syntax, no-await-in-loop */
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();
const logger = require('../utils/logger');

// Map Replit PG env vars to DB_* vars if not already set
if (!process.env.DB_HOST && process.env.PGHOST) process.env.DB_HOST = process.env.PGHOST;
if (!process.env.DB_PORT && process.env.PGPORT) process.env.DB_PORT = process.env.PGPORT;
if (!process.env.DB_NAME && process.env.PGDATABASE) process.env.DB_NAME = process.env.PGDATABASE;
if (!process.env.DB_USER && process.env.PGUSER) process.env.DB_USER = process.env.PGUSER;
if (!process.env.DB_PASSWORD && process.env.PGPASSWORD) process.env.DB_PASSWORD = process.env.PGPASSWORD;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const runMigrations = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql') && !f.startsWith('rollback_'))
      .sort();

    logger.info(`Found ${files.length} migration files`);

    for (const file of files) {
      logger.info(`Running migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await client.query(sql);
      logger.info(`Completed migration: ${file}`);
    }

    await client.query('COMMIT');
    logger.info('All migrations completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

runMigrations().catch(console.error);
