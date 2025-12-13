import { API_CONFIG, ENDPOINTS } from '../config/api';
import { ApiResponse, AccidentReport, User, FormField } from '../types';

class ApiServiceClass {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || 'Request failed' };
      }

      return { data };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return { error: 'Request timeout' };
      }
      return { error: error.message || 'Network error' };
    }
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<ApiResponse<{ token: string; user: User }>> {
    return this.request(ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    fleetCode?: string;
  }): Promise<ApiResponse<{ token: string; user: User }>> {
    return this.request(ENDPOINTS.REGISTER, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMe(): Promise<ApiResponse<User>> {
    return this.request(ENDPOINTS.ME);
  }

  // Reports endpoints
  async getReports(params?: {
    status?: string;
    incidentType?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ reports: AccidentReport[]; pagination: any }>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    const query = queryParams.toString();
    return this.request(`${ENDPOINTS.REPORTS}${query ? `?${query}` : ''}`);
  }

  async getReport(id: string): Promise<ApiResponse<{ report: AccidentReport }>> {
    return this.request(ENDPOINTS.REPORT(id));
  }

  async createReport(report: Partial<AccidentReport>): Promise<ApiResponse<{ report: AccidentReport }>> {
    // Transform to snake_case for API
    const payload = {
      incident_type: report.incidentType,
      incident_date: report.incidentDate,
      latitude: report.latitude,
      longitude: report.longitude,
      address: report.address,
      custom_fields: report.customFields,
    };

    return this.request(ENDPOINTS.REPORTS, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateReport(
    id: string,
    updates: Partial<AccidentReport>
  ): Promise<ApiResponse<{ report: AccidentReport }>> {
    const payload: Record<string, any> = {};
    
    if (updates.status) payload.status = updates.status;
    if (updates.incidentType) payload.incident_type = updates.incidentType;
    if (updates.incidentDate) payload.incident_date = updates.incidentDate;
    if (updates.latitude) payload.latitude = updates.latitude;
    if (updates.longitude) payload.longitude = updates.longitude;
    if (updates.address) payload.address = updates.address;
    if (updates.customFields) payload.custom_fields = updates.customFields;

    return this.request(ENDPOINTS.REPORT(id), {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteReport(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request(ENDPOINTS.REPORT(id), {
      method: 'DELETE',
    });
  }

  // Form configs endpoints
  async getFormConfigs(): Promise<ApiResponse<{ form_configs: any[] }>> {
    return this.request(ENDPOINTS.FORM_CONFIGS);
  }

  // Upload endpoints
  async uploadPhoto(
    reportId: string,
    localUri: string,
    description?: string
  ): Promise<ApiResponse<{ photo: any }>> {
    const formData = new FormData();
    
    // Get file name and type from URI
    const filename = localUri.split('/').pop() || 'photo.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    
    formData.append('photo', {
      uri: localUri,
      name: filename,
      type,
    } as any);
    
    if (description) {
      formData.append('description', description);
    }

    const url = `${API_CONFIG.BASE_URL}${ENDPOINTS.UPLOAD_PHOTO(reportId)}`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || 'Upload failed' };
      }

      return { data };
    } catch (error: any) {
      return { error: error.message || 'Upload error' };
    }
  }

  async uploadAudio(
    reportId: string,
    localUri: string,
    description?: string
  ): Promise<ApiResponse<{ audio: any }>> {
    const formData = new FormData();
    
    const filename = localUri.split('/').pop() || 'audio.m4a';
    const type = 'audio/m4a';
    
    formData.append('audio', {
      uri: localUri,
      name: filename,
      type,
    } as any);
    
    if (description) {
      formData.append('description', description);
    }

    const url = `${API_CONFIG.BASE_URL}${ENDPOINTS.UPLOAD_AUDIO(reportId)}`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || 'Upload failed' };
      }

      return { data };
    } catch (error: any) {
      return { error: error.message || 'Upload error' };
    }
  }

  async getSignedUrl(fileKey: string): Promise<ApiResponse<{ signed_url: string }>> {
    return this.request(ENDPOINTS.SIGNED_URL(fileKey));
  }
}

export const ApiService = new ApiServiceClass();
