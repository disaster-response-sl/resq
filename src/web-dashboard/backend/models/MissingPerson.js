const mongoose = require('mongoose');

const MissingPersonSchema = new mongoose.Schema({
  // Basic Information
  full_name: {
    type: String,
    required: true,
    trim: true
  },
  age: {
    type: Number,
    min: 0
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  
  // Physical Characteristics
  height: {
    type: String, // e.g., "5'8\"" or "170 cm"
  },
  build: {
    type: String,
    enum: ['slim', 'average', 'athletic', 'heavy'],
  },
  complexion: {
    type: String,
  },
  hair_color: {
    type: String,
  },
  eye_color: {
    type: String,
  },
  identifying_marks: {
    type: String, // Scars, tattoos, birthmarks, etc.
  },
  
  // Last Seen Information
  last_seen_date: {
    type: Date,
    required: true
  },
  last_seen_location: {
    lat: {
      type: Number,
      required: true
    },
    lng: {
      type: Number,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    city: String,
    district: String
  },
  last_seen_wearing: {
    type: String, // Description of clothing
  },
  circumstances: {
    type: String, // How they went missing
    required: true
  },
  
  // Contact Information
  reporter_name: {
    type: String,
    required: true
  },
  reporter_relationship: {
    type: String,
    required: true
  },
  reporter_phone: {
    type: String,
    required: true,
    match: /^[\d\s\-\+\(\)]+$/
  },
  reporter_email: {
    type: String,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  alternate_contact_name: String,
  alternate_contact_phone: {
    type: String,
    match: /^[\d\s\-\+\(\)]+$/
  },
  
  // Images
  photo_urls: [{
    type: String
  }],
  
  // Status Tracking
  status: {
    type: String,
    enum: ['missing', 'found_safe', 'found_deceased', 'sighting_reported', 'investigation_ongoing'],
    default: 'missing'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  
  // Risk Factors
  is_vulnerable: {
    type: Boolean,
    default: false // Elderly, child, medical condition, etc.
  },
  medical_conditions: {
    type: String
  },
  medication_required: {
    type: String
  },
  
  // Disaster Association
  associated_disaster_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Disaster'
  },
  disaster_related: {
    type: Boolean,
    default: false
  },
  
  // Investigation
  case_number: {
    type: String,
    unique: true,
    sparse: true
  },
  police_station: String,
  investigating_officer: String,
  
  // Sightings
  sightings: [{
    location: {
      lat: Number,
      lng: Number,
      address: String
    },
    date: {
      type: Date,
      default: Date.now
    },
    description: String,
    reported_by: String,
    contact: String,
    verified: {
      type: Boolean,
      default: false
    }
  }],
  
  // Updates
  updates: [{
    message: String,
    added_by: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    update_type: {
      type: String,
      enum: ['general', 'sighting', 'status_change', 'investigation']
    }
  }],
  
  // Resolution
  found_date: Date,
  found_location: {
    lat: Number,
    lng: Number,
    address: String
  },
  found_condition: String,
  resolution_details: String,
  
  // AI Extraction Fields (Hybrid Approach)
  extracted_data: {
    name: String,
    age: Number,
    lastSeenLocation: String,
    extractedText: String,
    confidence: Number,
    extractedContacts: [{
      phone: String,
      relation: String
    }]
  },
  data_source: {
    type: String,
    enum: ['manual', 'ai_extracted', 'api_import'],
    default: 'manual'
  },
  verification_status: {
    type: String,
    enum: ['unverified', 'verified', 'rejected'],
    default: 'unverified'
  },
  verified_by: {
    user_id: String,
    username: String,
    role: String,
    verified_at: Date
  },
  rejection_reason: String,
  
  // System Fields
  created_by: {
    type: String,
    required: true
  },
  last_modified_by: String,
  search_radius_km: {
    type: Number,
    default: 50 // Default search radius
  },
  public_visibility: {
    type: Boolean,
    default: true // Whether to show in public missing persons list
  },
  
  // Community Policing
  spam_reports: [{
    reported_by: String, // User ID or IP
    reason: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  auto_hidden: {
    type: Boolean,
    default: false // Auto-hidden if 3+ spam reports
  },
  
  // Metadata
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient queries
MissingPersonSchema.index({ status: 1, created_at: -1 });
MissingPersonSchema.index({ 'last_seen_location.lat': 1, 'last_seen_location.lng': 1 });
MissingPersonSchema.index({ case_number: 1 });
MissingPersonSchema.index({ disaster_related: 1, associated_disaster_id: 1 });
MissingPersonSchema.index({ priority: 1, status: 1 });

// Auto-update timestamp
MissingPersonSchema.pre('save', function(next) {
  this.updated_at = new Date();
  
  // Generate case number if not exists
  if (!this.case_number) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.case_number = `MP-${year}${month}-${random}`;
  }
  
  next();
});

// Static method to get statistics
MissingPersonSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $facet: {
        byStatus: [
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ],
        byPriority: [
          { $group: { _id: '$priority', count: { $sum: 1 } } }
        ],
        vulnerable: [
          { $match: { is_vulnerable: true } },
          { $count: 'count' }
        ],
        disasterRelated: [
          { $match: { disaster_related: true } },
          { $count: 'count' }
        ],
        recentCases: [
          { $match: { status: 'missing' } },
          { $sort: { created_at: -1 } },
          { $limit: 10 }
        ]
      }
    }
  ]);
  
  return stats[0];
};

module.exports = mongoose.model('MissingPerson', MissingPersonSchema, 'missing_persons');
