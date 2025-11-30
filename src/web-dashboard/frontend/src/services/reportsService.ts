import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export type ReportType =
  | 'sos'
  | 'missing_persons'
  | 'disasters'
  | 'resources'
  | 'relief_ops'
  | 'financial'
  | 'comprehensive';

export interface ReportConfig {
  report_type: ReportType;
  date_range?: {
    start?: string;
    end?: string;
  };
  filters?: Record<string, any>;
  include_charts?: boolean;
  include_maps?: boolean;
}

export interface Report {
  _id: string;
  type: string;
  status: string;
  priority: string;
  timestamp: string;
  reported_by: {
    _id: string;
    name: string;
    email: string;
  };
  disaster_id?: {
    _id: string;
    name: string;
    type: string;
    severity: string;
  };
}

export interface ReportStats {
  by_type: Record<string, number>;
  by_status: Record<string, number>;
  by_priority: Record<string, number>;
  total_affected_people: number;
  daily_trend: Array<{ _id: string; count: number }>;
}

export const reportsService = {
  // Get all reports with filters
  getAll: async (filters?: {
    type?: string;
    status?: string;
    priority?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
    skip?: number;
  }) => {
    const response = await api.get('/api/reports', { params: filters });
    return response.data;
  },

  // Get report statistics
  getStats: async (filters?: { start_date?: string; end_date?: string }) => {
    const response = await api.get('/api/reports/stats', { params: filters });
    return response.data;
  },

  // Generate advanced report
  generate: async (config: ReportConfig) => {
    const response = await api.post('/api/reports/generate', config);
    return response.data;
  },

  // Get report by ID
  getById: async (id: string) => {
    const response = await api.get(`/api/reports/${id}`);
    return response.data;
  },

  // Create report
  create: async (data: Partial<Report>) => {
    const response = await api.post('/api/reports', data);
    return response.data;
  },

  // Update report
  update: async (id: string, data: Partial<Report>) => {
    const response = await api.put(`/api/reports/${id}`, data);
    return response.data;
  },

  // Delete report
  delete: async (id: string) => {
    const response = await api.delete(`/api/reports/${id}`);
    return response.data;
  },
};
