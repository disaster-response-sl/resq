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

export interface MissingPerson {
  _id: string;
  full_name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  description: string;
  last_seen_location: {
    lat: number;
    lng: number;
    address: string;
  };
  last_seen_date: string;
  circumstances: string;
  reporter_name: string;
  reporter_phone: string;
  reporter_relationship?: string;
  physical_characteristics?: {
    height?: string;
    weight?: string;
    build?: string;
    hair_color?: string;
    eye_color?: string;
    distinguishing_marks?: string;
  };
  clothing_description?: string;
  photos?: string[];
  medical_conditions?: string;
  status: 'missing' | 'found_safe' | 'found_deceased' | 'sighting_reported' | 'investigation_ongoing';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  case_number: string;
  sightings?: Array<{
    location: { lat: number; lng: number; address: string };
    date: string;
    description: string;
    reporter_phone?: string;
    verified: boolean;
  }>;
  created_at: string;
  updated_at: string;
}

export interface MissingPersonFilters {
  status?: string;
  priority?: string;
  disaster_related?: boolean;
  limit?: number;
  skip?: number;
}

export interface SearchQuery {
  q?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  status?: string;
  priority?: string;
}

export interface SightingReport {
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  date: string;
  description: string;
  reporter_phone?: string;
}

export const missingPersonsService = {
  // Get all missing persons with filters
  getAll: async (filters?: MissingPersonFilters) => {
    const response = await api.get('/api/missing-persons', { params: filters });
    return response.data;
  },

  // Get missing persons statistics
  getStats: async () => {
    const response = await api.get('/api/missing-persons/stats');
    return response.data;
  },

  // Search missing persons (text + geospatial)
  search: async (query: SearchQuery) => {
    const response = await api.get('/api/missing-persons/search', { params: query });
    return response.data;
  },

  // Get missing person by ID
  getById: async (id: string) => {
    const response = await api.get(`/api/missing-persons/${id}`);
    return response.data;
  },

  // Create missing person report
  create: async (data: Partial<MissingPerson>) => {
    const response = await api.post('/api/missing-persons', data);
    return response.data;
  },

  // Update missing person report
  update: async (id: string, data: Partial<MissingPerson>) => {
    const response = await api.put(`/api/missing-persons/${id}`, data);
    return response.data;
  },

  // Add sighting report (public - no auth required)
  addSighting: async (id: string, sighting: SightingReport) => {
    const response = await axios.post(
      `${API_BASE_URL}/api/missing-persons/${id}/sightings`,
      sighting
    );
    return response.data;
  },

  // Add investigation update
  addUpdate: async (id: string, update: { description: string; updated_by: string }) => {
    const response = await api.post(`/api/missing-persons/${id}/updates`, update);
    return response.data;
  },

  // Update status
  updateStatus: async (
    id: string,
    data: {
      status: string;
      resolution_details?: string;
      found_location?: { lat: number; lng: number; address: string };
    }
  ) => {
    const response = await api.put(`/api/missing-persons/${id}/status`, data);
    return response.data;
  },

  // Delete missing person report
  delete: async (id: string) => {
    const response = await api.delete(`/api/missing-persons/${id}`);
    return response.data;
  },
};
