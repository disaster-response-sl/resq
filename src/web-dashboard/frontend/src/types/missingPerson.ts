// Missing Person Types for ResQ Platform
// Hybrid Approach: MongoDB as Source of Truth, External API as Processor

export interface Location {
  lat: number;
  lng: number;
  address: string;
  city?: string;
  district?: string;
}

export interface Contact {
  phone: string;
  relation: string;
}

export interface ExtractedData {
  name: string;
  age: number;
  lastSeenLocation: string;
  extractedText: string;
  confidence: number;
  extractedContacts: Contact[];
}

export interface Sighting {
  _id?: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  date: Date;
  description: string;
  reported_by: string;
  contact: string;
  verified: boolean;
}

export interface Update {
  _id?: string;
  message: string;
  added_by: string;
  timestamp: Date;
  update_type: 'general' | 'sighting' | 'status_change' | 'investigation';
}

export interface VerifiedBy {
  user_id: string;
  username: string;
  role: string;
  verified_at: Date;
}

export interface MissingPerson {
  _id: string;
  
  // Basic Information
  full_name: string;
  age?: number;
  gender: 'male' | 'female' | 'other';
  description: string;
  
  // Physical Characteristics
  height?: string;
  build?: 'slim' | 'average' | 'athletic' | 'heavy';
  complexion?: string;
  hair_color?: string;
  eye_color?: string;
  identifying_marks?: string;
  
  // Last Seen Information
  last_seen_date: Date;
  last_seen_location: Location;
  last_seen_wearing?: string;
  circumstances: string;
  
  // Contact Information
  reporter_name: string;
  reporter_relationship: string;
  reporter_phone: string;
  reporter_email?: string;
  alternate_contact_name?: string;
  alternate_contact_phone?: string;
  
  // Images
  photo_urls: string[];
  
  // Status Tracking
  status: 'missing' | 'found_safe' | 'found_deceased' | 'sighting_reported' | 'investigation_ongoing';
  priority: 'low' | 'medium' | 'high' | 'critical';
  
  // Risk Factors
  is_vulnerable: boolean;
  medical_conditions?: string;
  medication_required?: string;
  
  // Disaster Association
  associated_disaster_id?: string;
  disaster_related: boolean;
  
  // Investigation
  case_number: string;
  police_station?: string;
  investigating_officer?: string;
  
  // Sightings and Updates
  sightings: Sighting[];
  updates: Update[];
  
  // Resolution
  found_date?: Date;
  found_location?: Location;
  found_condition?: string;
  resolution_details?: string;
  
  // AI Extraction (Hybrid Approach)
  extracted_data?: ExtractedData;
  data_source: 'manual' | 'ai_extracted' | 'api_import';
  verification_status: 'pending' | 'verified' | 'rejected';
  verified_by?: VerifiedBy;
  rejection_reason?: string;
  
  // System Fields
  created_by: string;
  last_modified_by?: string;
  search_radius_km: number;
  public_visibility: boolean;
  created_at: Date;
  updated_at: Date;
  
  // Computed field (from search)
  distance_km?: number;
}

// API Request/Response Types

export interface CreateMissingPersonRequest {
  full_name: string;
  age?: number;
  gender: 'male' | 'female' | 'other';
  description: string;
  height?: string;
  build?: 'slim' | 'average' | 'athletic' | 'heavy';
  complexion?: string;
  hair_color?: string;
  eye_color?: string;
  identifying_marks?: string;
  last_seen_date: Date;
  last_seen_location: Location;
  last_seen_wearing?: string;
  circumstances: string;
  reporter_name: string;
  reporter_relationship: string;
  reporter_phone: string;
  reporter_email?: string;
  alternate_contact_name?: string;
  alternate_contact_phone?: string;
  photo_urls?: string[];
  priority?: 'low' | 'medium' | 'high' | 'critical';
  is_vulnerable?: boolean;
  medical_conditions?: string;
  medication_required?: string;
  disaster_related?: boolean;
  associated_disaster_id?: string;
  police_station?: string;
  extracted_data?: ExtractedData;
  data_source?: 'manual' | 'ai_extracted';
}

export interface ExtractionResponse {
  success: boolean;
  message: string;
  extracted_data?: ExtractedData;
  confidence?: number;
  note?: string;
  error?: string;
  fallback_to_manual?: boolean;
}

export interface MissingPersonResponse {
  success: boolean;
  message?: string;
  data: MissingPerson;
  error?: string;
}

export interface MissingPersonListResponse {
  success: boolean;
  data: MissingPerson[];
  pagination?: {
    total: number;
    limit: number;
    skip: number;
    hasMore: boolean;
  };
  count?: number;
}

export interface MissingPersonStats {
  byStatus: Array<{ _id: string; count: number }>;
  byPriority: Array<{ _id: string; count: number }>;
  vulnerable: Array<{ count: number }>;
  disasterRelated: Array<{ count: number }>;
  recentCases: MissingPerson[];
}

export interface StatsResponse {
  success: boolean;
  data: MissingPersonStats;
}

export interface SearchParams {
  q?: string;
  status?: string;
  priority?: string;
  disaster_related?: boolean;
  lat?: number;
  lng?: number;
  radius_km?: number;
  limit?: number;
  skip?: number;
}

export interface VerificationAction {
  action: 'approve' | 'reject';
  rejection_reason?: string;
}

export interface AddSightingRequest {
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  description: string;
  reported_by: string;
  contact: string;
}

export interface AddUpdateRequest {
  message: string;
  update_type?: 'general' | 'sighting' | 'status_change' | 'investigation';
}

export interface UpdateStatusRequest {
  status: 'missing' | 'found_safe' | 'found_deceased' | 'sighting_reported' | 'investigation_ongoing';
  found_location?: Location;
  found_condition?: string;
  resolution_details?: string;
}
