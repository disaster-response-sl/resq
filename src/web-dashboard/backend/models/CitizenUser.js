// models/CitizenUser.js
const mongoose = require('mongoose');

/**
 * Shadow Account for Citizens
 * Auto-created when they submit SOS or Missing Person report
 * No password required - identified by phone number only
 */
const CitizenUserSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    sparse: true, // Allow null but enforce uniqueness when present
    unique: true
  },
  password: {
    type: String,
    required: false // Not required for shadow accounts
  },
  role: {
    type: String,
    default: 'citizen'
  },
  // Optional profile info (collected over time)
  nic: String, // National Identity Card
  
  // Push notification tokens
  push_tokens: [{
    token: String,
    device_type: {
      type: String,
      enum: ['web', 'android', 'ios']
    },
    added_at: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Account metadata
  account_type: {
    type: String,
    enum: ['shadow', 'verified'], // Shadow = auto-created, Verified = SLUDI linked
    default: 'shadow'
  },
  sludi_id: String, // If they later authenticate with SLUDI
  
  // Activity tracking
  sos_submitted: {
    type: Number,
    default: 0
  },
  missing_persons_reported: {
    type: Number,
    default: 0
  },
  last_active: {
    type: Date,
    default: Date.now
  },
  
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Index for fast phone lookup
CitizenUserSchema.index({ phone: 1 });
CitizenUserSchema.index({ sludi_id: 1 });

module.exports = mongoose.model('CitizenUser', CitizenUserSchema);
