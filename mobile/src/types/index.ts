// User and Authentication Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  fleetId: string;
  fleetName?: string;
}

export type UserRole = 'super_admin' | 'fleet_admin' | 'fleet_manager' | 'fleet_viewer' | 'driver';

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Fleet Types
export interface Fleet {
  id: string;
  name: string;
  companyName?: string;
  email: string;
  phone?: string;
  address?: string;
}

// Form Configuration Types
export interface FormField {
  id: string;
  fieldKey: string;
  fieldType: FieldType;
  label: string;
  placeholder?: string;
  isRequired: boolean;
  orderIndex: number;
  section?: string;
  validationRules?: ValidationRules;
  options?: FieldOption[];
  defaultValue?: string;
}

export type FieldType = 
  | 'text' 
  | 'number' 
  | 'date' 
  | 'datetime' 
  | 'dropdown' 
  | 'checkbox' 
  | 'radio' 
  | 'textarea' 
  | 'file' 
  | 'signature';

export interface FieldOption {
  label: string;
  value: string;
}

export interface ValidationRules {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  patternMessage?: string;
}

// Report Types
export interface AccidentReport {
  id: string;
  reportNumber?: string;
  fleetId: string;
  driverId: string;
  incidentType: IncidentType;
  status: ReportStatus;
  incidentDate: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  customFields: Record<string, any>;
  photos: ReportPhoto[];
  audio: ReportAudio[];
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
  isOffline: boolean;
}

export type IncidentType = 'accident' | 'incident' | 'near_miss';
export type ReportStatus = 'draft' | 'submitted' | 'under_review' | 'closed';

export interface ReportPhoto {
  id: string;
  localUri?: string;
  remoteUrl?: string;
  description?: string;
  orderIndex: number;
  uploadStatus: 'pending' | 'uploading' | 'uploaded' | 'failed';
}

export interface ReportAudio {
  id: string;
  localUri?: string;
  remoteUrl?: string;
  durationSeconds?: number;
  description?: string;
  uploadStatus: 'pending' | 'uploading' | 'uploaded' | 'failed';
}

// Wizard Step Types
export interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  isComplete: boolean;
  isRequired: boolean;
}

// Sync Queue Types
export interface SyncQueueItem {
  id: string;
  entityType: 'report' | 'photo' | 'audio';
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  payload: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retryCount: number;
  errorMessage?: string;
  createdAt: string;
}

// Location Types
export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  timestamp: string;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
