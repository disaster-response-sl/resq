// Missing Person Service
// Handles all API calls for the Hybrid Missing Persons System
// MongoDB = Source of Truth | External API = Processor

import axios from 'axios';
import {
  MissingPersonResponse,
  MissingPersonListResponse,
  StatsResponse,
  CreateMissingPersonRequest,
  ExtractionResponse,
  SearchParams,
  VerificationAction,
  AddSightingRequest,
  AddUpdateRequest,
  UpdateStatusRequest
} from '../types/missingPerson';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const API_URL = `${API_BASE_URL}/api/missing-persons`;

// Helper to get auth headers
const getAuthHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json'
});

/**
 * STEP 1: Extract data from poster image (PROCESSOR - Does NOT save to DB)
 */
export const extractDataFromPoster = async (imageFile: File): Promise<ExtractionResponse> => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    console.log('📸 Sending image to extraction API...');
    
    const response = await axios.post(`${API_URL}/extract`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 30000 // 30 seconds
    });
    
    console.log('✅ Extraction response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Extraction failed:', error.response?.data || error.message);
    
    // Return graceful fallback
    return {
      success: false,
      message: 'Could not extract data. Please enter details manually.',
      fallback_to_manual: true,
      error: error.response?.data?.message || error.message
    };
  }
};

/**
 * STEP 2: Submit missing person report (SAVES to MongoDB)
 */
export const submitMissingPerson = async (
  token: string,
  data: CreateMissingPersonRequest
): Promise<MissingPersonResponse> => {
  const response = await axios.post(
    `${API_URL}/submit`,
    data,
    { headers: getAuthHeaders(token) }
  );
  return response.data;
};

/**
 * Create missing person report (alternative method)
 */
export const createMissingPerson = async (
  token: string,
  data: CreateMissingPersonRequest
): Promise<MissingPersonResponse> => {
  const response = await axios.post(
    API_URL,
    data,
    { headers: getAuthHeaders(token) }
  );
  return response.data;
};

/**
 * Get all missing persons (with filters)
 */
export const getAllMissingPersons = async (
  params?: SearchParams
): Promise<MissingPersonListResponse> => {
  const response = await axios.get(API_URL, { params });
  return response.data;
};

/**
 * Search missing persons (with location-based filtering)
 */
export const searchMissingPersons = async (
  params: SearchParams
): Promise<MissingPersonListResponse> => {
  const response = await axios.get(`${API_URL}/search`, { params });
  return response.data;
};

/**
 * Get single missing person by ID
 */
export const getMissingPersonById = async (id: string): Promise<MissingPersonResponse> => {
  const response = await axios.get(`${API_URL}/${id}`);
  return response.data;
};

/**
 * Get pending reports (Admin/Responder only)
 */
export const getPendingReports = async (token: string): Promise<MissingPersonListResponse> => {
  const response = await axios.get(`${API_URL}/pending/list`, {
    headers: getAuthHeaders(token)
  });
  return response.data;
};

/**
 * Verify/Reject a pending report (Admin/Responder only)
 */
export const verifyReport = async (
  token: string,
  id: string,
  action: VerificationAction
): Promise<MissingPersonResponse> => {
  const response = await axios.put(
    `${API_URL}/${id}/verify`,
    action,
    { headers: getAuthHeaders(token) }
  );
  return response.data;
};

/**
 * Update missing person
 */
export const updateMissingPerson = async (
  token: string,
  id: string,
  data: Partial<CreateMissingPersonRequest>
): Promise<MissingPersonResponse> => {
  const response = await axios.put(
    `${API_URL}/${id}`,
    data,
    { headers: getAuthHeaders(token) }
  );
  return response.data;
};

/**
 * Update status (found/missing/etc)
 */
export const updateStatus = async (
  token: string,
  id: string,
  statusData: UpdateStatusRequest
): Promise<MissingPersonResponse> => {
  const response = await axios.put(
    `${API_URL}/${id}/status`,
    statusData,
    { headers: getAuthHeaders(token) }
  );
  return response.data;
};

/**
 * Add sighting
 */
export const addSighting = async (
  id: string,
  sighting: AddSightingRequest
): Promise<MissingPersonResponse> => {
  const response = await axios.post(`${API_URL}/${id}/sightings`, sighting);
  return response.data;
};

/**
 * Add update
 */
export const addUpdate = async (
  token: string,
  id: string,
  update: AddUpdateRequest
): Promise<MissingPersonResponse> => {
  const response = await axios.post(
    `${API_URL}/${id}/updates`,
    update,
    { headers: getAuthHeaders(token) }
  );
  return response.data;
};

/**
 * Delete missing person (Admin only)
 */
export const deleteMissingPerson = async (
  token: string,
  id: string
): Promise<{ success: boolean; message: string }> => {
  const response = await axios.delete(`${API_URL}/${id}`, {
    headers: getAuthHeaders(token)
  });
  return response.data;
};

/**
 * Get statistics
 */
export const getStatistics = async (): Promise<StatsResponse> => {
  const response = await axios.get(`${API_URL}/stats`);
  return response.data;
};
