const mongoose = require('mongoose');

/**
 * SOS Response Model - Tracks civilian/official responder assignments and live tracking
 */
const SosResponseSchema = new mongoose.Schema({
  sos_signal_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SosSignal',
    required: true
  },
  
  // Responder Information
  responder_id: {
    type: String, // user_id (civilian or official)
    required: true
  },
  responder_type: {
    type: String,
    enum: ['official', 'civilian', 'volunteer'], // official = Navy/Army, civilian = Good Samaritan
    required: true
  },
  responder_name: {
    type: String,
    required: true
  },
  responder_organization: {
    type: String, // e.g., "Navy Rescue Team", "Red Cross Volunteer"
  },
  responder_phone: {
    type: String
  },
  
  // Status Tracking
  status: {
    type: String,
    enum: [
      'assigned',      // Responder accepted the SOS
      'en_route',      // Responder is traveling to location
      'arrived',       // Responder reached the location
      'assisting',     // Currently helping the victim
      'completed',     // Mission completed successfully
      'cancelled',     // Response cancelled
      'failed'         // Unable to complete
    ],
    default: 'assigned'
  },
  
  // Timeline
  assigned_at: {
    type: Date,
    default: Date.now
  },
  en_route_at: {
    type: Date
  },
  arrived_at: {
    type: Date
  },
  completed_at: {
    type: Date
  },
  
  // Live Tracking
  responder_location: {
    lat: Number,
    lng: Number,
    last_updated: {
      type: Date,
      default: Date.now
    }
  },
  estimated_arrival_time: {
    type: Date
  },
  distance_to_victim_km: {
    type: Number
  },
  
  // Post-Rescue Information
  rescue_outcome: {
    type: String,
    enum: [
      'rescued_safe',           // Victim rescued, safe and sound
      'rescued_injured',        // Victim rescued but injured
      'rescued_critical',       // Victim rescued in critical condition
      'transported_to_hospital', // Taken to hospital
      'transported_to_camp',    // Taken to relief camp
      'victim_safe_already',    // Victim was already safe (false alarm)
      'victim_relocated',       // Victim moved to different location
      'victim_not_found',       // Could not locate victim
      'other'
    ]
  },
  
  // Relief Camp Handover (Links to Missing Persons DB)
  relief_camp_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ReliefCamp'
  },
  relief_camp_name: {
    type: String
  },
  hospital_name: {
    type: String
  },
  
  // Victim Status After Rescue
  victim_status: {
    type: String,
    enum: ['safe', 'injured', 'critical', 'deceased', 'missing'],
    default: 'safe'
  },
  
  // Create Missing/Found Person Entry
  created_missing_person_entry: {
    type: Boolean,
    default: false
  },
  missing_person_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MissingPerson'
  },
  
  // Notes & Updates
  notes: [{
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    added_by: String // responder_id or system
  }],
  
  // Chat Messages (Victim ↔ Responder)
  chat_messages: [{
    sender_id: String,
    sender_name: String,
    sender_type: {
      type: String,
      enum: ['victim', 'responder']
    },
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    read: {
      type: Boolean,
      default: false
    }
  }],
  
  // Feedback (Victim rates Responder)
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    submitted_at: Date
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
SosResponseSchema.index({ sos_signal_id: 1 });
SosResponseSchema.index({ responder_id: 1, status: 1 });
SosResponseSchema.index({ status: 1, created_at: -1 });

// Auto-update timestamp
SosResponseSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

module.exports = mongoose.model('SosResponse', SosResponseSchema, 'sos_responses');
