const mongoose = require('mongoose');

/**
 * Civilian Responder Model - "Good Samaritan" Verification Layer
 * Allows verified civilians with certifications to respond to low-priority SOS signals
 */
const CivilianResponderSchema = new mongoose.Schema({
  user_id: {
    type: String, // Individual ID from authentication
    required: true,
    unique: true
  },
  full_name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  
  // Verification Layer
  verification_status: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'suspended'],
    default: 'pending'
  },
  verified_at: {
    type: Date
  },
  verified_by: {
    admin_id: String,
    admin_name: String
  },
  
  // Certifications
  certifications: [{
    type: {
      type: String,
      enum: [
        'red_cross',           // Red Cross First Aid
        'life_saving',         // Life Saving Association
        'heavy_vehicle',       // Heavy Vehicle License (for rescue with trucks/boats)
        'medical_professional', // Doctor/Nurse/Paramedic
        'fire_safety',         // Fire Safety Training
        'search_rescue',       // Search & Rescue Training
        'boat_license',        // Boat Operation License
        'other'
      ],
      required: true
    },
    certificate_number: String,
    issued_by: String,
    issue_date: Date,
    expiry_date: Date,
    document_url: String,  // S3/Cloud storage URL for uploaded certificate
    verified: {
      type: Boolean,
      default: false
    }
  }],
  
  // Capabilities (based on certifications)
  allowed_sos_levels: [{
    type: String,
    enum: ['level_1', 'level_2', 'level_3'],
    // level_1: Food/Water needed (Low risk)
    // level_2: Medical Emergency (Medium risk, requires medical cert)
    // level_3: Drowning/Life-threatening (High risk, requires life saving cert)
  }],
  
  // Location
  current_location: {
    lat: Number,
    lng: Number,
    address: String,
    last_updated: {
      type: Date,
      default: Date.now
    }
  },
  
  // Availability
  is_available: {
    type: Boolean,
    default: true
  },
  availability_radius_km: {
    type: Number,
    default: 5, // Will only see SOS within 5km
    min: 1,
    max: 20
  },
  
  // Response History
  total_responses: {
    type: Number,
    default: 0
  },
  successful_responses: {
    type: Number,
    default: 0
  },
  failed_responses: {
    type: Number,
    default: 0
  },
  average_response_time_minutes: {
    type: Number,
    default: 0
  },
  
  // Current Assignment
  assigned_sos_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SosSignal',
    default: null
  },
  
  // Ratings & Reviews
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  total_ratings: {
    type: Number,
    default: 0
  },
  reviews: [{
    sos_id: mongoose.Schema.Types.ObjectId,
    victim_id: String,
    rating: Number,
    comment: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Safety & Trust
  background_check_status: {
    type: String,
    enum: ['not_required', 'pending', 'cleared', 'failed'],
    default: 'not_required'
  },
  incidents_reported: {
    type: Number,
    default: 0
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

// Indexes
CivilianResponderSchema.index({ user_id: 1 });
CivilianResponderSchema.index({ verification_status: 1, is_available: 1 });
CivilianResponderSchema.index({ 'current_location.lat': 1, 'current_location.lng': 1 });
CivilianResponderSchema.index({ rating: -1 });

// Auto-update timestamp
CivilianResponderSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

// Method to calculate allowed SOS levels based on certifications
CivilianResponderSchema.methods.updateAllowedLevels = function() {
  const levels = new Set(['level_1']); // Everyone gets level_1 (food/water)
  
  const verifiedCerts = this.certifications.filter(c => c.verified);
  
  verifiedCerts.forEach(cert => {
    switch(cert.type) {
      case 'medical_professional':
      case 'red_cross':
        levels.add('level_2'); // Medical emergencies
        break;
      case 'life_saving':
      case 'search_rescue':
      case 'boat_license':
        levels.add('level_2');
        levels.add('level_3'); // Life-threatening situations
        break;
    }
  });
  
  this.allowed_sos_levels = Array.from(levels);
};

module.exports = mongoose.model('CivilianResponder', CivilianResponderSchema, 'civilian_responders');
