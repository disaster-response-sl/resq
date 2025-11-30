const mongoose = require('mongoose');

const RoadReportSchema = new mongoose.Schema({
  // Reporter Information
  reporter_name: {
    type: String,
    required: true,
    trim: true
  },
  reporter_phone: {
    type: String,
    required: true,
    trim: true
  },
  reporter_email: {
    type: String,
    trim: true
  },

  // Location Information
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      validate: {
        validator: function(v) {
          return v.length === 2 && v[0] >= -180 && v[0] <= 180 && v[1] >= -90 && v[1] <= 90;
        },
        message: 'Invalid coordinates format. Must be [longitude, latitude]'
      }
    }
  },
  location_name: {
    type: String,
    required: true,
    trim: true
  },
  district: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  road_name: {
    type: String,
    required: true,
    trim: true
  },

  // Road Condition Details
  condition: {
    type: String,
    required: true,
    enum: ['blocked', 'damaged', 'flooded', 'landslide', 'accident', 'hazardous', 'debris', 'closed'],
    default: 'blocked'
  },
  severity: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  affected_lanes: {
    type: String,
    enum: ['all', 'partial', 'one_lane', 'shoulder'],
    default: 'all'
  },
  traffic_status: {
    type: String,
    enum: ['completely_blocked', 'slow_moving', 'one_way', 'detour_available', 'normal'],
    default: 'completely_blocked'
  },

  // Additional Information
  estimated_clearance_time: {
    type: String,
    trim: true
  },
  alternative_route: {
    type: String,
    trim: true
  },
  emergency_vehicles_accessible: {
    type: Boolean,
    default: false
  },
  casualties_reported: {
    type: Boolean,
    default: false
  },
  casualties_count: {
    type: Number,
    default: 0
  },

  // Media
  photos: [{
    url: String,
    uploaded_at: {
      type: Date,
      default: Date.now
    }
  }],

  // Status and Verification
  status: {
    type: String,
    enum: ['pending', 'verified', 'in_progress', 'resolved', 'dismissed'],
    default: 'pending'
  },
  verified_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verified_at: {
    type: Date
  },
  resolution_notes: {
    type: String,
    trim: true
  },
  resolved_at: {
    type: Date
  },

  // Engagement Metrics
  views: {
    type: Number,
    default: 0
  },
  helpful_count: {
    type: Number,
    default: 0
  },
  not_helpful_count: {
    type: Number,
    default: 0
  },

  // Metadata
  ip_address: {
    type: String
  },
  user_agent: {
    type: String
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  }
}, {
  timestamps: true,
  collection: 'road_reports'
});

// Indexes for better query performance
RoadReportSchema.index({ location: '2dsphere' });
RoadReportSchema.index({ district: 1, status: 1 });
RoadReportSchema.index({ condition: 1, severity: 1 });
RoadReportSchema.index({ status: 1, createdAt: -1 });
RoadReportSchema.index({ road_name: 'text', location_name: 'text', description: 'text' });

// Virtual for age calculation
RoadReportSchema.virtual('age_hours').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60));
});

// Method to mark as verified
RoadReportSchema.methods.verify = function(userId) {
  this.status = 'verified';
  this.verified_by = userId;
  this.verified_at = new Date();
  return this.save();
};

// Method to mark as resolved
RoadReportSchema.methods.resolve = function(notes) {
  this.status = 'resolved';
  this.resolved_at = new Date();
  this.resolution_notes = notes;
  return this.save();
};

// Static method to get reports by district
RoadReportSchema.statics.getByDistrict = function(district) {
  return this.find({ district, status: { $in: ['pending', 'verified', 'in_progress'] } })
    .sort({ severity: -1, createdAt: -1 });
};

// Static method to get nearby reports
RoadReportSchema.statics.getNearby = function(longitude, latitude, maxDistance = 5000) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance
      }
    },
    status: { $in: ['pending', 'verified', 'in_progress'] }
  });
};

module.exports = mongoose.model('RoadReport', RoadReportSchema);
