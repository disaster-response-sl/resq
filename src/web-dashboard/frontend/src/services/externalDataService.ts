import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export interface SOSSignal {
  id: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: string;
  external?: boolean;
  marker_color?: string;
  created_at: string;
}

export interface ReliefCamp {
  id: string;
  name: string;
  type: 'emergency' | 'temporary' | 'permanent';
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  capacity?: number;
  current_occupancy?: number;
  facilities?: string[];
  contact_phone?: string;
  status: string;
}

export interface EmergencyRequest {
  id: string;
  type: string;
  description: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  requester_name: string;
  requester_phone: string;
  status: string;
  created_at: string;
}

export interface Contribution {
  id: string;
  type: string;
  description: string;
  contributor_name: string;
  contributor_phone?: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  quantity?: number;
  unit?: string;
  created_at: string;
}

export interface CacheStatus {
  floodSupport: {
    lastUpdated: string;
    recordCount: number;
    isStale: boolean;
  };
  reliefData: {
    cacheCount: number;
    queries: Array<{ query: string; recordCount: number; lastUpdated: string }>;
  };
}

export const externalDataService = {
  // Get FloodSupport.org verified SOS signals
  getFloodSupportSOS: async () => {
    const response = await axios.get(`${API_BASE_URL}/api/external/floodsupport-sos`);
    return response.data;
  },

  // Get all relief data with filters
  getReliefData: async (params?: {
    type?: string;
    urgency?: string;
    lat?: number;
    lng?: number;
    radius?: number;
    limit?: number;
    offset?: number;
  }) => {
    const response = await axios.get(`${API_BASE_URL}/api/external/relief-data`, { params });
    return response.data;
  },

  // Get relief camps by type
  getReliefCamps: async (
    type: 'emergency' | 'temporary' | 'permanent',
    params?: { lat?: number; lng?: number; radius?: number }
  ) => {
    const response = await axios.get(`${API_BASE_URL}/api/external/relief-camps/${type}`, {
      params,
    });
    return response.data;
  },

  // Get emergency help requests
  getEmergencyRequests: async (params?: {
    urgency?: string;
    lat?: number;
    lng?: number;
    radius?: number;
  }) => {
    const response = await axios.get(`${API_BASE_URL}/api/external/emergency-requests`, {
      params,
    });
    return response.data;
  },

  // Get volunteer contributions
  getNearbyContributions: async (params?: {
    lat?: number;
    lng?: number;
    radius?: number;
    type?: string;
  }) => {
    const response = await axios.get(`${API_BASE_URL}/api/external/nearby-contributions`, {
      params,
    });
    return response.data;
  },

  // Get combined SOS signals (local + external)
  getCombinedSOS: async () => {
    const response = await axios.get(`${API_BASE_URL}/api/external/combined-sos`);
    return response.data;
  },

  // Get cache status
  getCacheStatus: async () => {
    const response = await axios.get(`${API_BASE_URL}/api/external/cache-status`);
    return response.data;
  },

  // Clear cache
  clearCache: async () => {
    const response = await axios.post(`${API_BASE_URL}/api/external/clear-cache`);
    return response.data;
  },
};
