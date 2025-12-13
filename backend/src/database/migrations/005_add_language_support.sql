-- Add language support to users and reports

-- Add preferred_language to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) DEFAULT 'en' 
CHECK (preferred_language IN ('en', 'es', 'fr'));

-- Add input_language to accident_reports to track what language the driver used
ALTER TABLE accident_reports 
ADD COLUMN IF NOT EXISTS input_language VARCHAR(10) DEFAULT 'en' 
CHECK (input_language IN ('en', 'es', 'fr'));

-- Add translated fields storage (JSON) for backend reference
-- Original input is preserved, English translation is stored for reporting
ALTER TABLE accident_reports 
ADD COLUMN IF NOT EXISTS translated_fields JSONB DEFAULT '{}';

-- Create translations table for system labels and UI
CREATE TABLE IF NOT EXISTS translations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    translation_key VARCHAR(255) NOT NULL,
    language_code VARCHAR(10) NOT NULL CHECK (language_code IN ('en', 'es', 'fr')),
    translation_text TEXT NOT NULL,
    context VARCHAR(100), -- e.g., 'mobile', 'web', 'email', 'report'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(translation_key, language_code)
);

-- Create language_audit_log to track language usage
CREATE TABLE IF NOT EXISTS language_usage_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fleet_id UUID REFERENCES fleets(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    report_id UUID REFERENCES accident_reports(id) ON DELETE SET NULL,
    input_language VARCHAR(10) NOT NULL,
    field_name VARCHAR(100),
    original_text TEXT,
    translated_text TEXT, -- English translation
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add fleet default language preference
ALTER TABLE fleets 
ADD COLUMN IF NOT EXISTS default_language VARCHAR(10) DEFAULT 'en' 
CHECK (default_language IN ('en', 'es', 'fr'));

ALTER TABLE fleets 
ADD COLUMN IF NOT EXISTS supported_languages VARCHAR(50) DEFAULT 'en,es,fr';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_preferred_language ON users(preferred_language);
CREATE INDEX IF NOT EXISTS idx_accident_reports_input_language ON accident_reports(input_language);
CREATE INDEX IF NOT EXISTS idx_translations_key_lang ON translations(translation_key, language_code);
CREATE INDEX IF NOT EXISTS idx_language_usage_log_fleet ON language_usage_log(fleet_id);

-- Insert default English labels (sample - extend as needed)
INSERT INTO translations (translation_key, language_code, translation_text, context) VALUES
-- Common
('app.name', 'en', 'FleetGuard Accident Reporter', 'common'),
('app.name', 'es', 'FleetGuard Reportador de Accidentes', 'common'),
('app.name', 'fr', 'FleetGuard Rapporteur d''Accidents', 'common'),

-- Navigation
('nav.dashboard', 'en', 'Dashboard', 'web'),
('nav.dashboard', 'es', 'Panel de Control', 'web'),
('nav.dashboard', 'fr', 'Tableau de Bord', 'web'),

('nav.reports', 'en', 'Reports', 'web'),
('nav.reports', 'es', 'Reportes', 'web'),
('nav.reports', 'fr', 'Rapports', 'web'),

('nav.users', 'en', 'Users', 'web'),
('nav.users', 'es', 'Usuarios', 'web'),
('nav.users', 'fr', 'Utilisateurs', 'web'),

-- Incident Types
('incident.accident', 'en', 'Vehicle Accident', 'common'),
('incident.accident', 'es', 'Accidente Vehicular', 'common'),
('incident.accident', 'fr', 'Accident de Véhicule', 'common'),

('incident.incident', 'en', 'Injury/Incident', 'common'),
('incident.incident', 'es', 'Lesión/Incidente', 'common'),
('incident.incident', 'fr', 'Blessure/Incident', 'common'),

('incident.near_miss', 'en', 'Near Miss', 'common'),
('incident.near_miss', 'es', 'Casi Accidente', 'common'),
('incident.near_miss', 'fr', 'Quasi-Accident', 'common'),

-- Status
('status.draft', 'en', 'Draft', 'common'),
('status.draft', 'es', 'Borrador', 'common'),
('status.draft', 'fr', 'Brouillon', 'common'),

('status.submitted', 'en', 'Submitted', 'common'),
('status.submitted', 'es', 'Enviado', 'common'),
('status.submitted', 'fr', 'Soumis', 'common'),

('status.under_review', 'en', 'Under Review', 'common'),
('status.under_review', 'es', 'En Revisión', 'common'),
('status.under_review', 'fr', 'En Cours d''Examen', 'common'),

('status.closed', 'en', 'Closed', 'common'),
('status.closed', 'es', 'Cerrado', 'common'),
('status.closed', 'fr', 'Fermé', 'common')

ON CONFLICT (translation_key, language_code) DO UPDATE SET 
translation_text = EXCLUDED.translation_text,
updated_at = NOW();
