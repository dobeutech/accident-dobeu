-- Rollback for 001_create_tables.sql
-- WARNING: This will drop all tables and data!

BEGIN;

-- Drop tables in reverse order (respecting foreign keys)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS report_audio CASCADE;
DROP TABLE IF EXISTS report_photos CASCADE;
DROP TABLE IF EXISTS accident_reports CASCADE;
DROP TABLE IF EXISTS fleet_form_configs CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS fleets CASCADE;

-- Drop extensions
DROP EXTENSION IF EXISTS "uuid-ossp";

COMMIT;
