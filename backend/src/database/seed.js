/* eslint-disable radix, max-len, no-unused-vars, no-restricted-syntax, no-await-in-loop, no-return-await, global-require, no-plusplus, no-restricted-globals, guard-for-in */
require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

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

const seed = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const fleetCheck = await client.query("SELECT id FROM fleets WHERE email = 'admin@fleet.com'");
    if (fleetCheck.rows.length > 0) {
      console.log('Seed data already exists. Skipping.');
      await client.query('ROLLBACK');
      return;
    }

    const fleetResult = await client.query(`
      INSERT INTO fleets (name, company_name, email, phone, subscription_status)
      VALUES ('Default Fleet', 'Fleet Management Corp', 'admin@fleet.com', '+1-555-0100', 'active')
      RETURNING id
    `);
    const fleetId = fleetResult.rows[0].id;
    console.log('Created fleet:', fleetId);

    const adminHash = await bcrypt.hash('Admin123!', 10);
    const managerHash = await bcrypt.hash('Manager123!', 10);
    const driverHash = await bcrypt.hash('Driver123!', 10);

    const adminResult = await client.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role, fleet_id, phone)
      VALUES ('admin@fleet.com', $1, 'System', 'Admin', 'fleet_admin', $2, '+1-555-0101')
      RETURNING id, email, role
    `, [adminHash, fleetId]);
    console.log('Created admin:', adminResult.rows[0].email);

    const managerResult = await client.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role, fleet_id, phone)
      VALUES ('manager@fleet.com', $1, 'Fleet', 'Manager', 'fleet_manager', $2, '+1-555-0102')
      RETURNING id, email, role
    `, [managerHash, fleetId]);
    console.log('Created manager:', managerResult.rows[0].email);

    const driverResult = await client.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role, fleet_id, phone)
      VALUES ('driver@fleet.com', $1, 'John', 'Driver', 'driver', $2, '+1-555-0103')
      RETURNING id, email, role
    `, [driverHash, fleetId]);
    console.log('Created driver:', driverResult.rows[0].email);

    await client.query(`
      INSERT INTO vehicles (fleet_id, vehicle_number, make, model, year, license_plate, vin)
      VALUES 
        ($1, 'VH-001', 'Ford', 'F-150', 2023, 'ABC-1234', '1FTEW1EP3NFA00001'),
        ($1, 'VH-002', 'Chevrolet', 'Silverado', 2022, 'XYZ-5678', '1GCUYEED3NZ000002'),
        ($1, 'VH-003', 'RAM', '1500', 2024, 'DEF-9012', '1C6SRFFT3PN000003')
    `, [fleetId]);
    console.log('Created 3 sample vehicles');

    await client.query('COMMIT');
    console.log('\nSeed completed successfully!');
    console.log('\nLogin credentials:');
    console.log('  Admin:   admin@fleet.com / Admin123!');
    console.log('  Manager: manager@fleet.com / Manager123!');
    console.log('  Driver:  driver@fleet.com / Driver123!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

seed().catch(() => process.exit(1));
