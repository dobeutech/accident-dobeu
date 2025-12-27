// API Configuration
export const API_TIMEOUT = 30000;
export const QUERY_STALE_TIME = 5 * 60 * 1000; // 5 minutes
export const QUERY_CACHE_TIME = 10 * 60 * 1000; // 10 minutes

// Report Statuses
export const REPORT_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  CLOSED: 'closed'
};

export const REPORT_STATUS_LABELS = {
  [REPORT_STATUS.DRAFT]: 'Draft',
  [REPORT_STATUS.SUBMITTED]: 'Submitted',
  [REPORT_STATUS.UNDER_REVIEW]: 'Under Review',
  [REPORT_STATUS.CLOSED]: 'Closed'
};

export const REPORT_STATUS_COLORS = {
  [REPORT_STATUS.DRAFT]: '#FFA500',
  [REPORT_STATUS.SUBMITTED]: '#007AFF',
  [REPORT_STATUS.UNDER_REVIEW]: '#5856D6',
  [REPORT_STATUS.CLOSED]: '#34C759'
};

// Incident Types
export const INCIDENT_TYPE = {
  ACCIDENT: 'accident',
  INCIDENT: 'incident',
  NEAR_MISS: 'near_miss'
};

export const INCIDENT_TYPE_LABELS = {
  [INCIDENT_TYPE.ACCIDENT]: 'Accident',
  [INCIDENT_TYPE.INCIDENT]: 'Incident',
  [INCIDENT_TYPE.NEAR_MISS]: 'Near Miss'
};

// User Roles
export const USER_ROLE = {
  SUPER_ADMIN: 'super_admin',
  FLEET_ADMIN: 'fleet_admin',
  FLEET_MANAGER: 'fleet_manager',
  FLEET_VIEWER: 'fleet_viewer',
  DRIVER: 'driver'
};

export const USER_ROLE_LABELS = {
  [USER_ROLE.SUPER_ADMIN]: 'Super Admin',
  [USER_ROLE.FLEET_ADMIN]: 'Fleet Admin',
  [USER_ROLE.FLEET_MANAGER]: 'Fleet Manager',
  [USER_ROLE.FLEET_VIEWER]: 'Fleet Viewer',
  [USER_ROLE.DRIVER]: 'Driver'
};

// Form Field Types
export const FIELD_TYPE = {
  TEXT: 'text',
  NUMBER: 'number',
  DATE: 'date',
  DATETIME: 'datetime',
  TEXTAREA: 'textarea',
  DROPDOWN: 'dropdown',
  CHECKBOX: 'checkbox',
  RADIO: 'radio',
  FILE: 'file',
  SIGNATURE: 'signature'
};

export const FIELD_TYPE_LABELS = {
  [FIELD_TYPE.TEXT]: 'Text',
  [FIELD_TYPE.NUMBER]: 'Number',
  [FIELD_TYPE.DATE]: 'Date',
  [FIELD_TYPE.DATETIME]: 'Date & Time',
  [FIELD_TYPE.TEXTAREA]: 'Textarea',
  [FIELD_TYPE.DROPDOWN]: 'Dropdown',
  [FIELD_TYPE.CHECKBOX]: 'Checkbox',
  [FIELD_TYPE.RADIO]: 'Radio',
  [FIELD_TYPE.FILE]: 'File Upload',
  [FIELD_TYPE.SIGNATURE]: 'Signature'
};

// Export Formats
export const EXPORT_FORMAT = {
  PDF: 'pdf',
  XLSX: 'xlsx',
  CSV: 'csv',
  XML: 'xml',
  JSON: 'json',
  ZIP: 'zip'
};

// Pagination
export const DEFAULT_PAGE_SIZE = 50;
export const PAGE_SIZE_OPTIONS = [25, 50, 100, 200];

// Validation
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

// Date Formats
export const DATE_FORMAT = 'MMM dd, yyyy';
export const DATETIME_FORMAT = 'MMM dd, yyyy HH:mm';
export const TIME_FORMAT = 'HH:mm';
