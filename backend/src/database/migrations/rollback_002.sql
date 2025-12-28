-- Rollback for 002_create_rls_policies.sql
-- Removes all RLS policies

BEGIN;

-- Drop policies for audit_logs
DROP POLICY IF EXISTS audit_logs_select_policy ON audit_logs;
DROP POLICY IF EXISTS audit_logs_insert_policy ON audit_logs;

-- Drop policies for report_audio
DROP POLICY IF EXISTS report_audio_select_policy ON report_audio;
DROP POLICY IF EXISTS report_audio_insert_policy ON report_audio;
DROP POLICY IF EXISTS report_audio_update_policy ON report_audio;
DROP POLICY IF EXISTS report_audio_delete_policy ON report_audio;

-- Drop policies for report_photos
DROP POLICY IF EXISTS report_photos_select_policy ON report_photos;
DROP POLICY IF EXISTS report_photos_insert_policy ON report_photos;
DROP POLICY IF EXISTS report_photos_update_policy ON report_photos;
DROP POLICY IF EXISTS report_photos_delete_policy ON report_photos;

-- Drop policies for accident_reports
DROP POLICY IF EXISTS accident_reports_select_policy ON accident_reports;
DROP POLICY IF EXISTS accident_reports_insert_policy ON accident_reports;
DROP POLICY IF EXISTS accident_reports_update_policy ON accident_reports;
DROP POLICY IF EXISTS accident_reports_delete_policy ON accident_reports;

-- Drop policies for fleet_form_configs
DROP POLICY IF EXISTS fleet_form_configs_select_policy ON fleet_form_configs;
DROP POLICY IF EXISTS fleet_form_configs_insert_policy ON fleet_form_configs;
DROP POLICY IF EXISTS fleet_form_configs_update_policy ON fleet_form_configs;
DROP POLICY IF EXISTS fleet_form_configs_delete_policy ON fleet_form_configs;

-- Drop policies for users
DROP POLICY IF EXISTS users_select_policy ON users;
DROP POLICY IF EXISTS users_insert_policy ON users;
DROP POLICY IF EXISTS users_update_policy ON users;
DROP POLICY IF EXISTS users_delete_policy ON users;

-- Drop policies for fleets
DROP POLICY IF EXISTS fleets_select_policy ON fleets;
DROP POLICY IF EXISTS fleets_insert_policy ON fleets;
DROP POLICY IF EXISTS fleets_update_policy ON fleets;
DROP POLICY IF EXISTS fleets_delete_policy ON fleets;

-- Disable RLS on all tables
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE report_audio DISABLE ROW LEVEL SECURITY;
ALTER TABLE report_photos DISABLE ROW LEVEL SECURITY;
ALTER TABLE accident_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE fleet_form_configs DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE fleets DISABLE ROW LEVEL SECURITY;

COMMIT;
