// models/AdminSession.js - Track admin login sessions for security
const mongoose = require('mongoose');

const adminSessionSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
    index: true
  },
  individualId: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'responder'],
    required: true
  },
  login_time: {
    type: Date,
    default: Date.now
  },
  logout_time: Date,
  ip_address: String,
  user_agent: String,
  location: {
    lat: Number,
    lng: Number,
    city: String,
    country: String
  },
  session_token: {
    type: String,
    required: true,
    unique: true
  },
  is_active: {
    type: Boolean,
    default: true
  },
  suspicious_activity: {
    type: Boolean,
    default: false
  },
  activity_log: [{
    action: String,
    target_resource: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: mongoose.Schema.Types.Mixed
  }]
}, {
  timestamps: true
});

// Index for session lookup
adminSessionSchema.index({ session_token: 1, is_active: 1 });
adminSessionSchema.index({ user_id: 1, is_active: 1 });

// Auto-expire sessions after 8 hours of inactivity
adminSessionSchema.index({ login_time: 1 }, { expireAfterSeconds: 28800 });

module.exports = mongoose.model('AdminSession', adminSessionSchema);
