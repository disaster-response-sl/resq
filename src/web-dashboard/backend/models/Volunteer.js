const mongoose = require('mongoose');

const volunteerSchema = new mongoose.Schema({
  full_name: {
    type: String,
    required: true,
    trim: true
  },
  mobile_number: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  nic: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  contribution_types: {
    type: [String],
    required: true,
    enum: ['food_distribution', 'medical_assistance', 'shelter_support', 'transportation', 'counseling', 'search_rescue', 'other']
  },
  skills: {
    type: [String],
    default: []
  },
  availability: {
    type: String,
    enum: ['weekdays', 'weekends', 'both', 'anytime'],
    default: 'anytime'
  },
  coverage_radius_km: {
    type: Number,
    default: 10,
    min: 1,
    max: 100
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    }
  },
  status: {
    type: String,
    enum: ['available', 'assigned', 'unavailable'],
    default: 'available'
  },
  notes: {
    type: String,
    trim: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Create geospatial index for location-based queries
volunteerSchema.index({ location: '2dsphere' });

// Update the location field before saving
volunteerSchema.pre('save', function(next) {
  if (this.longitude && this.latitude) {
    this.location = {
      type: 'Point',
      coordinates: [this.longitude, this.latitude]
    };
  }
  this.updated_at = Date.now();
  next();
});

const Volunteer = mongoose.model('Volunteer', volunteerSchema);

module.exports = Volunteer;
