const mongoose = require('mongoose');

const RouteStatusSchema = new mongoose.Schema({
  // Route Identification
  route_id: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  route_name: {
    type: String,
    required: true,
    trim: true
  },
  route_number: {
    type: String,
    trim: true
  },
  route_type: {
    type: String,
    enum: ['highway', 'main_road', 'secondary_road', 'rural_road', 'bridge'],
    default: 'main_road'
  },

  // Location Information
  start_location: {
    name: {
      type: String,
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  end_location: {
    name: {
      type: String,
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  districts: [{
    type: String,
    required: true
  }],
  provinces: [{
    type: String
  }],

  // Route Details
  distance_km: {
    type: Number,
    required: true
  },
  typical_travel_time_minutes: {
    type: Number
  },
  current_travel_time_minutes: {
    type: Number
  },

  // Status Information
  status: {
    type: String,
    required: true,
    enum: ['open', 'partially_blocked', 'blocked', 'closed', 'hazardous', 'under_repair'],
    default: 'open'
  },
  severity: {
    type: String,
    enum: ['normal', 'minor', 'moderate', 'severe', 'critical'],
    default: 'normal'
  },
  description: {
    type: String,
    trim: true
  },

  // Traffic Information
  traffic_density: {
    type: String,
    enum: ['light', 'moderate', 'heavy', 'congested', 'unknown'],
    default: 'unknown'
  },
  average_speed_kmh: {
    type: Number
  },
  
  // Conditions Affecting Route
  active_incidents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RoadReport'
  }],
  weather_conditions: {
    type: String,
    enum: ['clear', 'rain', 'heavy_rain', 'fog', 'storm', 'flood_risk'],
    default: 'clear'
  },
  visibility: {
    type: String,
    enum: ['good', 'moderate', 'poor', 'very_poor'],
    default: 'good'
  },

  // Safety and Accessibility
  emergency_vehicles_accessible: {
    type: Boolean,
    default: true
  },
  alternative_routes_available: {
    type: Boolean,
    default: false
  },
  alternative_routes: [{
    route_id: String,
    route_name: String,
    additional_distance_km: Number,
    additional_time_minutes: Number
  }],

  // Risk Assessment
  risk_level: {
    type: String,
    enum: ['low', 'medium', 'high', 'extreme'],
    default: 'low'
  },
  risk_factors: [{
    type: String
  }],
  warnings: [{
    type: String
  }],

  // Update Information
  last_updated_by: {
    type: String,
    enum: ['system', 'admin', 'citizen_report', 'traffic_authority', 'police'],
    default: 'system'
  },
  last_verified_at: {
    type: Date
  },
  next_check_at: {
    type: Date
  },

  // Statistics
  reports_count: {
    type: Number,
    default: 0
  },
  views_count: {
    type: Number,
    default: 0
  },

  // Additional Data
  notes: {
    type: String
  },
  estimated_clearance: {
    type: Date
  },
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'route_status'
});

// Indexes
RouteStatusSchema.index({ route_id: 1 }, { unique: true });
RouteStatusSchema.index({ status: 1, is_active: 1 });
RouteStatusSchema.index({ districts: 1 });
RouteStatusSchema.index({ 'start_location.coordinates': '2dsphere' });
RouteStatusSchema.index({ 'end_location.coordinates': '2dsphere' });
RouteStatusSchema.index({ route_name: 'text', description: 'text' });

// Virtual for delay percentage
RouteStatusSchema.virtual('delay_percentage').get(function() {
  if (!this.typical_travel_time_minutes || !this.current_travel_time_minutes) {
    return 0;
  }
  return Math.round(((this.current_travel_time_minutes - this.typical_travel_time_minutes) / this.typical_travel_time_minutes) * 100);
});

// Method to update status
RouteStatusSchema.methods.updateStatus = function(newStatus, description, updatedBy = 'system') {
  this.status = newStatus;
  this.description = description;
  this.last_updated_by = updatedBy;
  this.last_verified_at = new Date();
  return this.save();
};

// Static method to get routes by district
RouteStatusSchema.statics.getByDistrict = function(district) {
  return this.find({ 
    districts: district, 
    is_active: true,
    status: { $ne: 'open' }
  }).sort({ severity: -1, updatedAt: -1 });
};

// Static method to get critical routes
RouteStatusSchema.statics.getCritical = function() {
  return this.find({ 
    is_active: true,
    $or: [
      { severity: { $in: ['severe', 'critical'] } },
      { status: { $in: ['blocked', 'closed'] } }
    ]
  }).sort({ severity: -1 });
};

module.exports = mongoose.model('RouteStatus', RouteStatusSchema);
