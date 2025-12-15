-- Insert default permissions for each role

-- Super Admin - Full access to everything
INSERT INTO permissions (role, resource, action) VALUES
('super_admin', '*', '*')
ON CONFLICT DO NOTHING;

-- Fleet Admin - Full fleet management
INSERT INTO permissions (role, resource, action) VALUES
('fleet_admin', 'reports', 'read'),
('fleet_admin', 'reports', 'write'),
('fleet_admin', 'reports', 'delete'),
('fleet_admin', 'users', 'read'),
('fleet_admin', 'users', 'write'),
('fleet_admin', 'users', 'delete'),
('fleet_admin', 'form_configs', 'read'),
('fleet_admin', 'form_configs', 'write'),
('fleet_admin', 'form_configs', 'delete'),
('fleet_admin', 'exports', 'read'),
('fleet_admin', 'analytics', 'read')
ON CONFLICT DO NOTHING;

-- Fleet Manager - View and edit reports, export
INSERT INTO permissions (role, resource, action) VALUES
('fleet_manager', 'reports', 'read'),
('fleet_manager', 'reports', 'write'),
('fleet_manager', 'exports', 'read'),
('fleet_manager', 'analytics', 'read')
ON CONFLICT DO NOTHING;

-- Fleet Viewer - Read-only access
INSERT INTO permissions (role, resource, action) VALUES
('fleet_viewer', 'reports', 'read'),
('fleet_viewer', 'analytics', 'read')
ON CONFLICT DO NOTHING;

-- Driver - Create reports only
INSERT INTO permissions (role, resource, action) VALUES
('driver', 'reports', 'create'),
('driver', 'reports', 'read_own')
ON CONFLICT DO NOTHING;

-- Telematics and Kill Switch Permissions
INSERT INTO permissions (role, resource, action) VALUES
('fleet_admin', 'vehicles', 'read'),
('fleet_admin', 'vehicles', 'write'),
('fleet_admin', 'vehicles', 'create'),
('fleet_admin', 'vehicles', 'delete'),
('fleet_admin', 'kill_switch', 'read'),
('fleet_admin', 'kill_switch', 'write'),
('fleet_admin', 'telematics', 'read'),
('fleet_admin', 'telematics', 'write'),
('fleet_admin', 'telematics', 'create'),
('fleet_admin', 'override', 'read'),
('fleet_admin', 'override', 'approve'),
('fleet_manager', 'vehicles', 'read'),
('fleet_manager', 'kill_switch', 'read'),
('fleet_manager', 'telematics', 'read'),
('fleet_manager', 'override', 'read'),
('fleet_manager', 'override', 'approve'),
('driver', 'vehicles', 'read'),
('driver', 'override', 'request')
ON CONFLICT DO NOTHING;

