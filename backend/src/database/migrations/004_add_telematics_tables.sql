-- Telematics providers configuration
CREATE TABLE IF NOT EXISTS telematics_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fleet_id UUID REFERENCES fleets(id) ON DELETE CASCADE NOT NULL,
    provider_name VARCHAR(100) NOT NULL CHECK (provider_name IN ('geotab', 'samsara', 'verizon_connect', 'fleet_complete', 'teletrac_navman', 'custom')),
    api_endpoint VARCHAR(500),
    api_key_encrypted TEXT NOT NULL,
    api_secret_encrypted TEXT,
    additional_config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(fleet_id, provider_name)
);

-- Vehicles/Trucks table with telematics integration
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fleet_id UUID REFERENCES fleets(id) ON DELETE CASCADE NOT NULL,
    telematics_provider_id UUID REFERENCES telematics_providers(id) ON DELETE SET NULL,
    vehicle_number VARCHAR(100) NOT NULL,
    vin VARCHAR(17),
    make VARCHAR(100),
    model VARCHAR(100),
    year INTEGER,
    license_plate VARCHAR(50),
    telematics_device_id VARCHAR(255),
    kill_switch_enabled BOOLEAN DEFAULT false,
    kill_switch_status VARCHAR(50) DEFAULT 'inactive' CHECK (kill_switch_status IN ('inactive', 'active', 'engaged', 'overridden')),
    current_driver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    last_location_lat DECIMAL(10, 8),
    last_location_lng DECIMAL(11, 8),
    last_location_updated_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(fleet_id, vehicle_number)
);

-- Kill switch events log
CREATE TABLE IF NOT EXISTS kill_switch_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
    fleet_id UUID REFERENCES fleets(id) ON DELETE CASCADE NOT NULL,
    report_id UUID REFERENCES accident_reports(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('engaged', 'disengaged', 'override_requested', 'override_approved', 'override_denied', 'workflow_completed')),
    triggered_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    supervisor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reason TEXT,
    override_code VARCHAR(100),
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Image validation results
CREATE TABLE IF NOT EXISTS image_validations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    photo_id UUID REFERENCES report_photos(id) ON DELETE CASCADE NOT NULL,
    report_id UUID REFERENCES accident_reports(id) ON DELETE CASCADE NOT NULL,
    fleet_id UUID REFERENCES fleets(id) ON DELETE CASCADE NOT NULL,
    validation_status VARCHAR(50) DEFAULT 'pending' CHECK (validation_status IN ('pending', 'processing', 'valid', 'invalid', 'flagged', 'manual_review')),
    ai_provider VARCHAR(50) CHECK (ai_provider IN ('aws_rekognition', 'google_vision', 'azure_vision', 'custom')),
    
    -- Image identification results
    detected_labels JSONB DEFAULT '[]',
    detected_objects JSONB DEFAULT '[]',
    scene_confidence DECIMAL(5, 4),
    is_vehicle_damage_detected BOOLEAN,
    damage_severity VARCHAR(50),
    
    -- Text extraction (OCR) results
    extracted_text TEXT,
    text_confidence DECIMAL(5, 4),
    detected_license_plates JSONB DEFAULT '[]',
    detected_documents JSONB DEFAULT '[]',
    
    -- Quality checks
    image_quality_score DECIMAL(5, 4),
    is_blurry BOOLEAN,
    is_dark BOOLEAN,
    has_faces BOOLEAN,
    face_count INTEGER DEFAULT 0,
    
    -- Validation flags
    contains_inappropriate_content BOOLEAN DEFAULT false,
    requires_manual_review BOOLEAN DEFAULT false,
    manual_review_reason TEXT,
    reviewed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP,
    
    processing_time_ms INTEGER,
    error_message TEXT,
    raw_response JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Workflow completion tracking
CREATE TABLE IF NOT EXISTS workflow_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID REFERENCES accident_reports(id) ON DELETE CASCADE NOT NULL,
    fleet_id UUID REFERENCES fleets(id) ON DELETE CASCADE NOT NULL,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    driver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Workflow steps completion
    steps_required JSONB NOT NULL DEFAULT '[]',
    steps_completed JSONB NOT NULL DEFAULT '[]',
    completion_percentage INTEGER DEFAULT 0,
    is_complete BOOLEAN DEFAULT false,
    
    -- Kill switch control
    kill_switch_engaged BOOLEAN DEFAULT false,
    kill_switch_engaged_at TIMESTAMP,
    kill_switch_released_at TIMESTAMP,
    
    -- Override tracking
    override_requested BOOLEAN DEFAULT false,
    override_approved BOOLEAN DEFAULT false,
    override_by_supervisor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    override_reason TEXT,
    override_at TIMESTAMP,
    
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(report_id)
);

-- Supervisor override requests
CREATE TABLE IF NOT EXISTS supervisor_override_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_completion_id UUID REFERENCES workflow_completions(id) ON DELETE CASCADE NOT NULL,
    report_id UUID REFERENCES accident_reports(id) ON DELETE CASCADE NOT NULL,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
    fleet_id UUID REFERENCES fleets(id) ON DELETE CASCADE NOT NULL,
    requested_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL NOT NULL,
    supervisor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'expired')),
    reason TEXT NOT NULL,
    urgency VARCHAR(50) CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
    
    approved_at TIMESTAMP,
    denied_at TIMESTAMP,
    expires_at TIMESTAMP,
    supervisor_notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_telematics_providers_fleet_id ON telematics_providers(fleet_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_fleet_id ON vehicles(fleet_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_telematics_device_id ON vehicles(telematics_device_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_current_driver_id ON vehicles(current_driver_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_kill_switch_status ON vehicles(kill_switch_status);
CREATE INDEX IF NOT EXISTS idx_kill_switch_events_vehicle_id ON kill_switch_events(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_kill_switch_events_report_id ON kill_switch_events(report_id);
CREATE INDEX IF NOT EXISTS idx_kill_switch_events_created_at ON kill_switch_events(created_at);
CREATE INDEX IF NOT EXISTS idx_image_validations_photo_id ON image_validations(photo_id);
CREATE INDEX IF NOT EXISTS idx_image_validations_report_id ON image_validations(report_id);
CREATE INDEX IF NOT EXISTS idx_image_validations_validation_status ON image_validations(validation_status);
CREATE INDEX IF NOT EXISTS idx_workflow_completions_report_id ON workflow_completions(report_id);
CREATE INDEX IF NOT EXISTS idx_workflow_completions_vehicle_id ON workflow_completions(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_workflow_completions_is_complete ON workflow_completions(is_complete);
CREATE INDEX IF NOT EXISTS idx_supervisor_override_requests_status ON supervisor_override_requests(status);
CREATE INDEX IF NOT EXISTS idx_supervisor_override_requests_supervisor_id ON supervisor_override_requests(supervisor_id);

-- Add vehicle_id to accident_reports
ALTER TABLE accident_reports ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_accident_reports_vehicle_id ON accident_reports(vehicle_id);

-- Add validation status to report_photos
ALTER TABLE report_photos ADD COLUMN IF NOT EXISTS validation_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE report_photos ADD COLUMN IF NOT EXISTS validation_required BOOLEAN DEFAULT true;
CREATE INDEX IF NOT EXISTS idx_report_photos_validation_status ON report_photos(validation_status);
