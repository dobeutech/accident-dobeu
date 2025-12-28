-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER DATABASE accident_app SET row_security = on;

-- Fleets table
CREATE TABLE IF NOT EXISTS fleets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    subscription_status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fleet_id UUID REFERENCES fleets(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'fleet_admin', 'fleet_manager', 'fleet_viewer', 'driver')),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(fleet_id, email)
);

-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role VARCHAR(50) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role, resource, action)
);

-- Fleet form configurations
CREATE TABLE IF NOT EXISTS fleet_form_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fleet_id UUID REFERENCES fleets(id) ON DELETE CASCADE NOT NULL,
    field_key VARCHAR(100) NOT NULL,
    field_type VARCHAR(50) NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'datetime', 'dropdown', 'checkbox', 'radio', 'textarea', 'file', 'signature')),
    label VARCHAR(255) NOT NULL,
    placeholder TEXT,
    is_required BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    validation_rules JSONB,
    options JSONB, -- For dropdown, radio, checkbox
    default_value TEXT,
    section VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(fleet_id, field_key)
);

-- Accident reports table
CREATE TABLE IF NOT EXISTS accident_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fleet_id UUID REFERENCES fleets(id) ON DELETE CASCADE NOT NULL,
    driver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    report_number VARCHAR(100) UNIQUE,
    incident_type VARCHAR(50) CHECK (incident_type IN ('accident', 'incident', 'near_miss')),
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'closed')),
    
    -- Location data
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    address TEXT,
    
    -- Timestamps
    incident_date TIMESTAMP,
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Custom fields (JSONB for flexibility)
    custom_fields JSONB DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    synced_at TIMESTAMP,
    is_offline BOOLEAN DEFAULT false
);

-- Report photos table
CREATE TABLE IF NOT EXISTS report_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID REFERENCES accident_reports(id) ON DELETE CASCADE NOT NULL,
    fleet_id UUID REFERENCES fleets(id) ON DELETE CASCADE NOT NULL,
    file_key VARCHAR(500) NOT NULL,
    file_url TEXT,
    file_size INTEGER,
    mime_type VARCHAR(100),
    description TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Report audio recordings
CREATE TABLE IF NOT EXISTS report_audio (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID REFERENCES accident_reports(id) ON DELETE CASCADE NOT NULL,
    fleet_id UUID REFERENCES fleets(id) ON DELETE CASCADE NOT NULL,
    file_key VARCHAR(500) NOT NULL,
    file_url TEXT,
    file_size INTEGER,
    duration_seconds INTEGER,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sync queue for offline support
CREATE TABLE IF NOT EXISTS sync_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fleet_id UUID REFERENCES fleets(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    operation VARCHAR(50) NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
    payload JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fleet_id UUID REFERENCES fleets(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id UUID,
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_fleet_id ON users(fleet_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_accident_reports_fleet_id ON accident_reports(fleet_id);
CREATE INDEX IF NOT EXISTS idx_accident_reports_driver_id ON accident_reports(driver_id);
CREATE INDEX IF NOT EXISTS idx_accident_reports_status ON accident_reports(status);
CREATE INDEX IF NOT EXISTS idx_accident_reports_incident_date ON accident_reports(incident_date);
CREATE INDEX IF NOT EXISTS idx_report_photos_report_id ON report_photos(report_id);
CREATE INDEX IF NOT EXISTS idx_report_photos_fleet_id ON report_photos(fleet_id);
CREATE INDEX IF NOT EXISTS idx_report_audio_report_id ON report_audio(report_id);
CREATE INDEX IF NOT EXISTS idx_report_audio_fleet_id ON report_audio(fleet_id);
CREATE INDEX IF NOT EXISTS idx_sync_queue_fleet_id ON sync_queue(fleet_id);
CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_fleet_id ON audit_logs(fleet_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_fleet_form_configs_fleet_id ON fleet_form_configs(fleet_id);

