-- Enable Row Level Security on all tables
ALTER TABLE fleets ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE accident_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_audio ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet_form_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create function to get current user's fleet_id from JWT
CREATE OR REPLACE FUNCTION current_fleet_id()
RETURNS UUID AS $$
BEGIN
  RETURN current_setting('app.current_fleet_id', true)::UUID;
END;
$$ LANGUAGE plpgsql STABLE;

-- Create function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN current_setting('app.user_role', true) = 'super_admin';
END;
$$ LANGUAGE plpgsql STABLE;

-- Fleets RLS Policies
-- Super admins can see all fleets
CREATE POLICY fleet_select_all_for_super_admin ON fleets
  FOR SELECT USING (is_super_admin());

-- Users can see their own fleet
CREATE POLICY fleet_select_own ON fleets
  FOR SELECT USING (id = current_fleet_id());

-- Super admins can insert/update/delete fleets
CREATE POLICY fleet_all_for_super_admin ON fleets
  FOR ALL USING (is_super_admin());

-- Users RLS Policies
-- Super admins can see all users
CREATE POLICY user_select_all_for_super_admin ON users
  FOR SELECT USING (is_super_admin());

-- Users can see users in their fleet
CREATE POLICY user_select_own_fleet ON users
  FOR SELECT USING (fleet_id = current_fleet_id());

-- Fleet admins can manage users in their fleet
CREATE POLICY user_manage_own_fleet ON users
  FOR ALL USING (
    fleet_id = current_fleet_id() AND
    current_setting('app.user_role', true) IN ('fleet_admin', 'super_admin')
  );

-- Accident Reports RLS Policies
-- Super admins can see all reports
CREATE POLICY report_select_all_for_super_admin ON accident_reports
  FOR SELECT USING (is_super_admin());

-- Users can see reports in their fleet
CREATE POLICY report_select_own_fleet ON accident_reports
  FOR SELECT USING (fleet_id = current_fleet_id());

-- Drivers can create reports in their fleet
CREATE POLICY report_insert_own_fleet ON accident_reports
  FOR INSERT WITH CHECK (fleet_id = current_fleet_id());

-- Fleet managers/admins can update reports in their fleet
CREATE POLICY report_update_own_fleet ON accident_reports
  FOR UPDATE USING (
    fleet_id = current_fleet_id() AND
    current_setting('app.user_role', true) IN ('fleet_admin', 'fleet_manager', 'super_admin')
  );

-- Report Photos RLS Policies
CREATE POLICY photo_select_own_fleet ON report_photos
  FOR SELECT USING (fleet_id = current_fleet_id() OR is_super_admin());

CREATE POLICY photo_insert_own_fleet ON report_photos
  FOR INSERT WITH CHECK (fleet_id = current_fleet_id());

CREATE POLICY photo_delete_own_fleet ON report_photos
  FOR DELETE USING (
    fleet_id = current_fleet_id() AND
    current_setting('app.user_role', true) IN ('fleet_admin', 'fleet_manager', 'super_admin')
  );

-- Report Audio RLS Policies
CREATE POLICY audio_select_own_fleet ON report_audio
  FOR SELECT USING (fleet_id = current_fleet_id() OR is_super_admin());

CREATE POLICY audio_insert_own_fleet ON report_audio
  FOR INSERT WITH CHECK (fleet_id = current_fleet_id());

CREATE POLICY audio_delete_own_fleet ON report_audio
  FOR DELETE USING (
    fleet_id = current_fleet_id() AND
    current_setting('app.user_role', true) IN ('fleet_admin', 'fleet_manager', 'super_admin')
  );

-- Fleet Form Configs RLS Policies
CREATE POLICY form_config_select_own_fleet ON fleet_form_configs
  FOR SELECT USING (fleet_id = current_fleet_id() OR is_super_admin());

CREATE POLICY form_config_manage_own_fleet ON fleet_form_configs
  FOR ALL USING (
    fleet_id = current_fleet_id() AND
    current_setting('app.user_role', true) IN ('fleet_admin', 'super_admin')
  );

-- Sync Queue RLS Policies
CREATE POLICY sync_queue_select_own_fleet ON sync_queue
  FOR SELECT USING (fleet_id = current_fleet_id() OR is_super_admin());

CREATE POLICY sync_queue_insert_own_fleet ON sync_queue
  FOR INSERT WITH CHECK (fleet_id = current_fleet_id());

-- Audit Logs RLS Policies
CREATE POLICY audit_log_select_all_for_super_admin ON audit_logs
  FOR SELECT USING (is_super_admin());

CREATE POLICY audit_log_select_own_fleet ON audit_logs
  FOR SELECT USING (fleet_id = current_fleet_id());

CREATE POLICY audit_log_insert_all ON audit_logs
  FOR INSERT WITH CHECK (true);

