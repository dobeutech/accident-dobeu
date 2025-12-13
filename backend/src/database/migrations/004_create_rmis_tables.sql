-- RMIS Integration Configuration Table
CREATE TABLE IF NOT EXISTS rmis_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fleet_id UUID REFERENCES fleets(id) ON DELETE CASCADE NOT NULL,
    integration_type VARCHAR(50) NOT NULL CHECK (integration_type IN ('origami_risk', 'riskonnect', 'custom_api')),
    config JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(fleet_id, integration_type)
);

-- RMIS Integration Logs for audit trail
CREATE TABLE IF NOT EXISTS rmis_integration_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fleet_id UUID REFERENCES fleets(id) ON DELETE SET NULL,
    integration_type VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    report_id UUID REFERENCES accident_reports(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
    details JSONB,
    external_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RMIS Field Mappings (for custom API integrations)
CREATE TABLE IF NOT EXISTS rmis_field_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fleet_id UUID REFERENCES fleets(id) ON DELETE CASCADE NOT NULL,
    integration_type VARCHAR(50) NOT NULL,
    source_field VARCHAR(255) NOT NULL,
    target_field VARCHAR(255) NOT NULL,
    transform_function VARCHAR(255),
    is_required BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(fleet_id, integration_type, source_field)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rmis_integrations_fleet_id ON rmis_integrations(fleet_id);
CREATE INDEX IF NOT EXISTS idx_rmis_integration_logs_fleet_id ON rmis_integration_logs(fleet_id);
CREATE INDEX IF NOT EXISTS idx_rmis_integration_logs_report_id ON rmis_integration_logs(report_id);
CREATE INDEX IF NOT EXISTS idx_rmis_integration_logs_created_at ON rmis_integration_logs(created_at);

-- RLS Policies for RMIS tables
ALTER TABLE rmis_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE rmis_integration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rmis_field_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY rmis_integrations_select_own_fleet ON rmis_integrations
  FOR SELECT USING (fleet_id = current_fleet_id() OR is_super_admin());

CREATE POLICY rmis_integrations_manage_own_fleet ON rmis_integrations
  FOR ALL USING (
    fleet_id = current_fleet_id() AND
    current_setting('app.user_role', true) IN ('fleet_admin', 'super_admin')
  );

CREATE POLICY rmis_integration_logs_select_own_fleet ON rmis_integration_logs
  FOR SELECT USING (fleet_id = current_fleet_id() OR is_super_admin());

CREATE POLICY rmis_field_mappings_select_own_fleet ON rmis_field_mappings
  FOR SELECT USING (fleet_id = current_fleet_id() OR is_super_admin());

CREATE POLICY rmis_field_mappings_manage_own_fleet ON rmis_field_mappings
  FOR ALL USING (
    fleet_id = current_fleet_id() AND
    current_setting('app.user_role', true) IN ('fleet_admin', 'super_admin')
  );
