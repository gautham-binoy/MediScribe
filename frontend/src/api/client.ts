import {
  AuthResponse,
  User,
  Patient,
  PatientHistoryResponse,
  Consultation,
  Transcript,
  Approval,
  HospitalDashboardData,
  AuditLog,
  AIHealthStatus,
} from '@/types';

const BASE_URL = '/api';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('mediscribe_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = 'An error occurred';
    try {
      const errorJson = await response.json();
      const detail = errorJson.detail;
      if (Array.isArray(detail)) {
        // FastAPI validation errors: [{loc: [...], msg: '...', type: '...'}]
        errorDetail = detail
          .map((e: any) => {
            const field = Array.isArray(e.loc) ? e.loc.filter((l: any) => l !== 'body').join('.') : '';
            return field ? `${field}: ${e.msg}` : e.msg;
          })
          .join(' | ');
      } else if (typeof detail === 'string') {
        errorDetail = detail;
      } else if (typeof errorJson.message === 'string') {
        errorDetail = errorJson.message;
      } else {
        errorDetail = JSON.stringify(errorJson);
      }
    } catch {
      errorDetail = response.statusText;
    }
    throw new ApiError(errorDetail, response.status);
  }

  return response.json();
}

// 1. Auth API
export const authApi = {
  login: (credentials: { email: string; password: string }): Promise<AuthResponse> =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  getMe: (): Promise<User> => request<User>('/auth/me'),
};

// 2. Patients API
export const patientsApi = {
  getAll: (search?: string): Promise<Patient[]> => {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    return request<Patient[]>(`/patients${q}`);
  },
  getById: (id: string): Promise<Patient> => request<Patient>(`/patients/${id}`),
  create: (data: Partial<Patient>): Promise<Patient> =>
    request<Patient>('/patients', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<Patient>): Promise<Patient> =>
    request<Patient>(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getHistory: (id: string): Promise<PatientHistoryResponse> =>
    request<PatientHistoryResponse>(`/patients/${id}/history`),
};

// 3. Consultations API
export const consultationsApi = {
  create: (data: {
    patient_id: string;
    conversation_language?: string;
    output_language?: string;
    is_demo?: boolean;
  }): Promise<Consultation> =>
    request<Consultation>('/consultations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getAll: (status?: string): Promise<Consultation[]> => {
    const q = status ? `?status=${encodeURIComponent(status)}` : '';
    return request<Consultation[]>(`/consultations${q}`);
  },
  getById: (id: string): Promise<Consultation> => request<Consultation>(`/consultations/${id}`),
  updateTranscript: (
    id: string,
    data: {
      original_transcript: string;
      normalized_clinical_text?: string;
      detected_language?: string;
      segments?: any[];
    }
  ): Promise<Transcript> =>
    request<Transcript>(`/consultations/${id}/transcript`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  generateDrafts: (id: string): Promise<Consultation> =>
    request<Consultation>(`/consultations/${id}/generate`, {
      method: 'POST',
    }),
  saveDraft: (id: string, data: any): Promise<Consultation> =>
    request<Consultation>(`/consultations/${id}/draft`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  approve: (id: string, data: { doctor_notes?: string }): Promise<Approval> =>
    request<Approval>(`/consultations/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  reject: (id: string, data: { reason: string }): Promise<Consultation> =>
    request<Consultation>(`/consultations/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  triggerDemoAudio: (id: string, scenario: string = 'malayalam_fever'): Promise<Transcript> =>
    request<Transcript>(`/consultations/${id}/demo-audio?scenario=${encodeURIComponent(scenario)}`, {
      method: 'POST',
    }),
  uploadAudio: async (id: string, file: File, languagePreference: string = 'Auto Detect'): Promise<Transcript> => {
    const token = localStorage.getItem('mediscribe_token');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('language_preference', languagePreference);

    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}/consultations/${id}/audio-upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: response.statusText }));
      throw new ApiError(err.detail || 'Upload failed', response.status);
    }
    return response.json();
  },
};

// 4. Hospital Dashboard API
export const hospitalApi = {
  getDashboard: (): Promise<HospitalDashboardData> => request<HospitalDashboardData>('/hospital/dashboard'),
};

// 5. Audit API
export const auditApi = {
  getLogs: (action?: string, targetId?: string): Promise<AuditLog[]> => {
    const params = new URLSearchParams();
    if (action) params.append('action', action);
    if (targetId) params.append('target_id', targetId);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<AuditLog[]>(`/audit${qs}`);
  },
};

// 6. System & AI Health API
export const systemApi = {
  getHealth: (): Promise<any> => request<any>('/health'),
  getAiHealth: (): Promise<AIHealthStatus> => request<AIHealthStatus>('/health/ai'),
};

// 7. Admin API
export const adminApi = {
  getUsers: (): Promise<User[]> => request<User[]>('/admin/users'),
  createUser: (data: {
    email: string;
    full_name: string;
    password: string;
    role: string;
    department?: string;
  }): Promise<User> =>
    request<User>('/admin/users', { method: 'POST', body: JSON.stringify(data) }),
  deactivateUser: (userId: string): Promise<User> =>
    request<User>(`/admin/users/${userId}/deactivate`, { method: 'PATCH' }),
  activateUser: (userId: string): Promise<User> =>
    request<User>(`/admin/users/${userId}/activate`, { method: 'PATCH' }),
  createPatient: (data: any): Promise<Patient> => {
    // Sanitize: convert empty string optional fields to null for FastAPI EmailStr validation
    const payload = { ...data };
    const nullableFields = ['email', 'address', 'emergency_contact'];
    nullableFields.forEach((f) => {
      if (payload[f] === '' || payload[f] === undefined) payload[f] = null;
    });
    return request<Patient>('/admin/patients', { method: 'POST', body: JSON.stringify(payload) });
  },
};
