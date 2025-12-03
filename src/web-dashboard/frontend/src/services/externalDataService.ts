import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const PUBLIC_DATA_API_URL = 'https://api.floodsupport.org/default/sos-emergency-api/v1.0';
const PUBLIC_DATA_API_KEY = import.meta.env.VITE_PUBLIC_DATA_API_KEY || '';

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

// SOS Emergency API types
export interface SOSEmergencyRequest {
  id?: number;
  referenceNumber?: string;
  fullName: string;
  phoneNumber: string;
  alternatePhone?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  landmark?: string;
  district?: string;
  emergencyType: 'TRAPPED' | 'MEDICAL' | 'FOOD_WATER' | 'RESCUE_NEEDED' | 'SHELTER_NEEDED' | 
    'MISSING_PERSON' | 'RESCUE_ASSISTANCE_H' | 'MEDICAL_ASSISTANCE_H' | 'COOKED_FOOD_H' | 
    'DRINKING_WATER_H' | 'DRY_FOOD_H' | 'SHELTER_H' | 'CLOTHING_H' | 'SANITARY_MATERIALS_H' | 'OTHER';
  numberOfPeople?: number;
  hasChildren?: boolean;
  hasElderly?: boolean;
  hasDisabled?: boolean;
  hasMedicalEmergency?: boolean;
  medicalDetails?: string;
  waterLevel?: 'ANKLE' | 'KNEE' | 'WAIST' | 'CHEST' | 'NECK' | 'ROOF';
  buildingType?: string;
  floorLevel?: number;
  safeForHours?: number;
  description?: string;
  hasFood?: boolean;
  hasWater?: boolean;
  hasPowerBank?: boolean;
  batteryPercentage?: number;
  photoUrl?: string;
  photoPublicId?: string;
  source?: string;
  title?: string;
  priority?: 'HIGHLY_CRITICAL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status?: 'PENDING' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESCUED' | 'VERIFIED' | 
    'SECOND_VERIFICATION' | 'CANNOT_CONTACT' | 'COMPLETED' | 'CANCELLED';
  createdAt?: string;
  verifier?: {
    id: number;
    name: string;
    phoneNumber: string;
  };
  coordinator?: {
    id: number;
    name: string;
    phoneNumber: string;
  };
  notesCount?: number;
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

  // ========== SOS Emergency API (Direct Integration) ==========
  
  // Submit new emergency request to external API
  submitSOSEmergency: async (data: Omit<SOSEmergencyRequest, 'id' | 'referenceNumber' | 'status' | 'createdAt'>) => {
    const response = await axios.post(
      `${PUBLIC_DATA_API_URL}/sos/public`,
      data,
      {
        headers: {
          'Authorization': `Bearer ${PUBLIC_DATA_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  },

  // Get filtered SOS emergency requests from external API
  getSOSEmergencyRequests: async (params?: {
    assignedTo?: number;
    district?: string;
    emergencyType?: string;
    hasActionTaken?: boolean;
    limit?: number;
    notVerified?: boolean;
    page?: number;
    priority?: string;
    search?: string;
    source?: 'WEB' | 'PUBLIC';
    status?: string;
  }) => {
    const response = await axios.get(
      `${PUBLIC_DATA_API_URL}/sos`,
      {
        headers: {
          'Authorization': `Bearer ${PUBLIC_DATA_API_KEY}`,
        },
        params,
      }
    );
    return response.data;
  },

  // Get SOS emergency requests for public viewing (no auth required)
  getPublicSOSEmergencyRequests: async (params?: {
    district?: string;
    emergencyType?: string;
    limit?: number;
    page?: number;
    priority?: string;
    status?: string;
  }) => {
    try {
      const response = await axios.get(
        `${PUBLIC_DATA_API_URL}/sos`,
        {
          headers: {
            'Authorization': `Bearer ${PUBLIC_DATA_API_KEY}`,
          },
          params: {
            limit: 100,
            ...params,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch SOS emergency requests:', error);
      return { success: false, data: [], pagination: null, stats: null };
    }
  },
};
