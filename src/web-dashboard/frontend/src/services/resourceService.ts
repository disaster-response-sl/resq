// Resource Management API Service
// Implements all 16 endpoints from the Resource API documentation

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const API_BASE = `${API_BASE_URL}/api/resources`;

// Helper function to get auth headers
const getAuthHeaders = (token: string) => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
});

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  return response.json();
};

// 1. Get All Resources
export const getAllResources = async (token: string, queryParams?: {
  type?: string;
  category?: string;
  status?: string;
  priority?: string;
  location?: string; // "lat,lng"
  radius?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) => {
  const params = new URLSearchParams();
  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });
  }
  
  const url = `${API_BASE}${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(token)
  });
  
  const result = await handleResponse(response);
  
  // Map backend pagination format to frontend expected format
  if (result.pagination) {
    const backendPagination = result.pagination;
    result.pagination = {
      page: backendPagination.current_page,
      limit: backendPagination.items_per_page,
      total: backendPagination.total_items,
      pages: backendPagination.total_pages,
      hasNext: backendPagination.current_page < backendPagination.total_pages,
      hasPrev: backendPagination.current_page > 1
    };
  }
  
  return result;
};

// 2. Get Resource by ID
export const getResourceById = async (token: string, id: string) => {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'GET',
    headers: getAuthHeaders(token)
  });
  
  return handleResponse(response);
};

// 3. Create Resource
export const createResource = async (token: string, resourceData: {
  name: string;
  type: string;
  category: string;
  quantity: {
    current: number;
    unit: string;
    allocated?: number;
    reserved?: number;
  };
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  status?: string;
  priority?: string;
  description?: string;
  specifications?: Record<string, any>;
  vendor_info?: {
    vendor_id?: string;
    vendor_name?: string;
    contact_info?: string;
  };
}) => {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(resourceData)
  });
  
  return handleResponse(response);
};

// 4. Update Resource
export const updateResource = async (token: string, id: string, updateData: Partial<{
  name: string;
  type: string;
  category: string;
  quantity: {
    current: number;
    unit: string;
    allocated?: number;
    reserved?: number;
  };
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  status: string;
  priority: string;
  description: string;
  specifications: Record<string, any>;
  vendor_info: {
    vendor_id?: string;
    vendor_name?: string;
    contact_info?: string;
  };
}>) => {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    body: JSON.stringify(updateData)
  });
  
  return handleResponse(response);
};

// 5. Delete Resource
export const deleteResource = async (token: string, id: string) => {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token)
  });
  
  return handleResponse(response);
};

// 6. Allocate Resource
export const allocateResource = async (token: string, id: string, allocationData: {
  quantity: number;
  disaster_id: string; // Required
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  estimated_duration?: number;
}) => {
  const response = await fetch(`${API_BASE}/${id}/allocate`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(allocationData)
  });
  
  return handleResponse(response);
};

// 7. Reserve Resource
export const reserveResource = async (token: string, id: string, reservationData: {
  quantity: number;
  reason: string;
  reserved_until: string; // ISO date string
}) => {
  const response = await fetch(`${API_BASE}/${id}/reserve`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(reservationData)
  });
  
  return handleResponse(response);
};

// 8. Inventory Summary
export const getInventorySummary = async (token: string) => {
  const response = await fetch(`${API_BASE}/inventory/summary`, {
    method: 'GET',
    headers: getAuthHeaders(token)
  });
  
  return handleResponse(response);
};

// 9. AI Allocation Recommendations
export const getAIAllocationRecommendations = async (token: string, queryParams: {
  disaster_id?: string;
  location?: string; // "lat,lng"
}) => {
  const params = new URLSearchParams();
  Object.entries(queryParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value.toString());
    }
  });
  
  const response = await fetch(`${API_BASE}/analytics/allocation?${params.toString()}`, {
    method: 'GET',
    headers: getAuthHeaders(token)
  });
  
  return handleResponse(response);
};

// 10. Supply Chain Status
export const getSupplyChainStatus = async (token: string, queryParams?: {
  status?: string;
  vendor_id?: string;
}) => {
  const params = new URLSearchParams();
  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });
  }
  
  const url = `${API_BASE}/supply-chain/status${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(token)
  });
  
  return handleResponse(response);
};

// 11. Deployment Tracking
export const getDeploymentTracking = async (token: string, queryParams?: {
  disaster_id?: string;
  status?: string;
  start_date?: string; // ISO date string
  end_date?: string; // ISO date string
}) => {
  const params = new URLSearchParams();
  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });
  }
  
  const url = `${API_BASE}/deployment/tracking${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(token)
  });
  
  return handleResponse(response);
};

// 12. Bulk Update Resource Status
export const bulkUpdateResourceStatus = async (token: string, updateData: {
  resource_ids: string[];
  new_status: string;
  reason: string;
}) => {
  const response = await fetch(`${API_BASE}/bulk/update-status`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(updateData)
  });
  
  return handleResponse(response);
};

// 13. AI Optimize Allocation
export const optimizeAllocation = async (token: string, optimizationData: {
  location: {
    lat: number;
    lng: number;
  };
  radius: number;
}) => {
  const response = await fetch(`${API_BASE}/ai/optimize-allocation`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(optimizationData)
  });
  
  return handleResponse(response);
};

// 14. AI Supply Chain Optimization
export const getSupplyChainOptimization = async (token: string, queryParams?: {
  timeframe?: string;
}) => {
  const params = new URLSearchParams();
  if (queryParams?.timeframe) {
    params.append('timeframe', queryParams.timeframe);
  }
  
  const url = `${API_BASE}/ai/supply-chain-optimization${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(token)
  });
  
  return handleResponse(response);
};

// 15. Dashboard Metrics
export const getDashboardMetrics = async (token: string, queryParams?: {
  timeframe?: string;
}) => {
  const params = new URLSearchParams();
  if (queryParams?.timeframe) {
    params.append('timeframe', queryParams.timeframe);
  }
  
  const url = `${API_BASE}/dashboard/metrics${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(token)
  });
  
  return handleResponse(response);
};

// 16. Complete Deployment
export const completeDeployment = async (token: string, id: string, deploymentData: {
  deployment_id: string;
  actual_duration?: number;
  notes?: string;
}) => {
  const response = await fetch(`${API_BASE}/${id}/complete-deployment`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(deploymentData)
  });
  
  return handleResponse(response);
};

// Export all functions as a default object for easier imports
export default {
  getAllResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
  allocateResource,
  reserveResource,
  getInventorySummary,
  getAIAllocationRecommendations,
  getSupplyChainStatus,
  getDeploymentTracking,
  bulkUpdateResourceStatus,
  optimizeAllocation,
  getSupplyChainOptimization,
  getDashboardMetrics,
  completeDeployment
};
