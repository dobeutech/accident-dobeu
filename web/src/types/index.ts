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
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
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
  subscriptionStatus: string;
  createdAt: string;
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
  validationRules?: Record<string, any>;
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

// Report Types
export interface AccidentReport {
  id: string;
  reportNumber?: string;
  fleetId: string;
  driverId: string;
  driverName?: string;
  driverEmail?: string;
  incidentType: IncidentType;
  status: ReportStatus;
  incidentDate: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  customFields: Record<string, any>;
  photos: ReportPhoto[];
  audio: ReportAudio[];
  photoCount?: number;
  audioCount?: number;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
  isOffline: boolean;
}

export type IncidentType = 'accident' | 'incident' | 'near_miss';
export type ReportStatus = 'draft' | 'submitted' | 'under_review' | 'closed';

export interface ReportPhoto {
  id: string;
  fileKey: string;
  fileUrl?: string;
  fileSize?: number;
  mimeType?: string;
  description?: string;
  orderIndex: number;
  createdAt: string;
}

export interface ReportAudio {
  id: string;
  fileKey: string;
  fileUrl?: string;
  fileSize?: number;
  durationSeconds?: number;
  description?: string;
  createdAt: string;
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

// Dashboard Stats
export interface DashboardStats {
  totalReports: number;
  reportsThisMonth: number;
  pendingReview: number;
  activeDrivers: number;
  reportsByType: {
    accident: number;
    incident: number;
    near_miss: number;
  };
  reportsByStatus: {
    draft: number;
    submitted: number;
    under_review: number;
    closed: number;
  };
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'report_created' | 'report_updated' | 'photo_uploaded' | 'status_changed';
  reportId: string;
  reportNumber?: string;
  userId: string;
  userName?: string;
  details?: string;
  timestamp: string;
}

// Export Types
export type ExportFormat = 'pdf' | 'xlsx' | 'csv' | 'xml' | 'json' | 'zip';
