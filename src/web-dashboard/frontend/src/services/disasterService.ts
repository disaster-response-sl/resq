import { authService } from './authService';

// Types for disaster management
export interface Location {
  lat: number;
  lng: number;
}

export interface Zone {
  zone_name: string;
  boundary_coordinates: number[][]; // Array of [lat, lng] pairs
  estimated_population?: number;
  area_km2?: number;
  risk_level?: 'low' | 'medium' | 'high' | 'critical';
}

export interface ResourceRequirements {
  personnel?: number;
  rescue_teams?: number;
  medical_units?: number;
  vehicles?: number;
  boats?: number;
  helicopters?: number;
  food_supplies?: number;
  water_supplies?: number;
  medical_supplies?: number;
  temporary_shelters?: number;
}

export interface Disaster {
  _id?: string;
  type: 'flood' | 'landslide' | 'cyclone' | 'fire' | 'earthquake' | 'drought' | 'tsunami';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location?: Location;
  timestamp?: string;
  status: 'active' | 'monitoring' | 'resolved' | 'archived';
  title: string;
  disaster_code?: string;
  zones?: Zone[];
  resources_required?: ResourceRequirements;
  priority_level?: 'low' | 'medium' | 'high' | 'critical' | 'emergency';
  response_status?: 'preparing' | 'responding' | 'recovery' | 'completed';
  assigned_teams?: string[];
  estimated_duration?: number;
  actual_duration?: number;
  incident_commander?: string;
  contact_number?: string;
  reporting_agency?: string;
  public_alert?: boolean;
  alert_message?: string;
  evacuation_required?: boolean;
  evacuation_zones?: string[];
  created_by?: string;
  updated_by?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDisasterRequest {
  type: string;
  severity: string;
  title: string;
  description: string;
  location?: Location;
  zones?: Zone[];
  resources_required?: ResourceRequirements;
  priority_level?: string;
  incident_commander?: string;
  contact_number?: string;
  reporting_agency?: string;
  public_alert?: boolean;
  alert_message?: string;
  evacuation_required?: boolean;
  evacuation_zones?: string[];
  assigned_teams?: string[];
  estimated_duration?: number;
}

export interface DisasterResponse {
  success: boolean;
  data: Disaster | Disaster[];
  warnings?: string[];
  message?: string;
  pagination?: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

export interface DisasterFilters {
  status?: string;
  type?: string;
  severity?: string;
  priority_level?: string;
  startDate?: string;
  endDate?: string;
  zone?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  includeArchived?: boolean;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

class DisasterService {
  private baseURL = `${API_BASE_URL}/api/admin/disasters`;

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = authService.getToken();
    
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  /**
   * Create a new disaster
   */
  async createDisaster(disaster: CreateDisasterRequest): Promise<DisasterResponse> {
    try {
      return await this.makeRequest('', {
        method: 'POST',
        body: JSON.stringify(disaster),
      });
    } catch (error) {
      console.error('Error creating disaster:', error);
      throw error;
    }
  }

  /**
   * Get all disasters with optional filters
   */
  async getDisasters(filters: DisasterFilters = {}): Promise<DisasterResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const endpoint = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return await this.makeRequest(endpoint);
    } catch (error) {
      console.error('Error fetching disasters:', error);
      throw error;
    }
  }

  /**
   * Get a single disaster by ID
   */
  async getDisasterById(id: string): Promise<DisasterResponse> {
    try {
      return await this.makeRequest(`/${id}`);
    } catch (error) {
      console.error('Error fetching disaster:', error);
      throw error;
    }
  }

  /**
   * Update a disaster
   */
  async updateDisaster(id: string, updates: Partial<CreateDisasterRequest>): Promise<DisasterResponse> {
    try {
      return await this.makeRequest(`/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    } catch (error) {
      console.error('Error updating disaster:', error);
      throw error;
    }
  }

  /**
   * Delete a disaster
   */
  async deleteDisaster(id: string): Promise<DisasterResponse> {
    try {
      return await this.makeRequest(`/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting disaster:', error);
      throw error;
    }
  }

  /**
   * Update disaster status
   */
  async updateDisasterStatus(id: string, status: string): Promise<DisasterResponse> {
    try {
      return await this.makeRequest(`/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    } catch (error) {
      console.error('Error updating disaster status:', error);
      throw error;
    }
  }

  /**
   * Assign teams to disaster
   */
  async assignTeams(id: string, teams: string[]): Promise<DisasterResponse> {
    try {
      return await this.makeRequest(`/${id}/assign-teams`, {
        method: 'PATCH',
        body: JSON.stringify({ assigned_teams: teams }),
      });
    } catch (error) {
      console.error('Error assigning teams:', error);
      throw error;
    }
  }

  /**
   * Get disaster statistics for dashboard
   */
  async getDisasterStats(): Promise<any> {
    try {
      return await this.makeRequest('/stats');
    } catch (error) {
      console.error('Error fetching disaster stats:', error);
      throw error;
    }
  }
}

export const disasterService = new DisasterService();
export default disasterService;
