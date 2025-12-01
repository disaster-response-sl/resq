const express = require('express');
const router = express.Router();
const CivilianResponder = require('../models/CivilianResponder');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for certificate uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/certificates/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    cb(null, 'cert-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and PDF files are allowed'));
    }
  }
});

/**
 * POST /api/civilian-responder/register
 * Register as a civilian responder (Good Samaritan)
 */
router.post('/register', authenticateToken, async (req, res) => {
  try {
    const {
      full_name,
      phone,
      email,
      availability_radius_km
    } = req.body;
    
    // Check if already registered
    const existing = await CivilianResponder.findOne({ user_id: req.user.individualId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered as a civilian responder'
      });
    }
    
    const responder = new CivilianResponder({
      user_id: req.user.individualId,
      full_name: full_name || req.user.name,
      phone: phone || req.user.phone,
      email: email || req.user.email,
      availability_radius_km: availability_radius_km || 5,
      verification_status: 'pending',
      certifications: [],
      allowed_sos_levels: ['level_1'] // Default: can only see food/water requests
    });
    
    await responder.save();
    
    res.status(201).json({
      success: true,
      message: 'Registered as civilian responder. Please upload certifications to get verified.',
      data: responder
    });
  } catch (error) {
    console.error('Error registering civilian responder:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering as civilian responder',
      error: error.message
    });
  }
});

/**
 * POST /api/civilian-responder/certification
 * Upload certification document
 */
router.post('/certification', authenticateToken, upload.single('certificate'), async (req, res) => {
  try {
    const {
      cert_type,
      certificate_number,
      issued_by,
      issue_date,
      expiry_date
    } = req.body;
    
    const responder = await CivilianResponder.findOne({ user_id: req.user.individualId });
    if (!responder) {
      return res.status(404).json({
        success: false,
        message: 'Please register as a civilian responder first'
      });
    }
    
    // Add certification
    responder.certifications.push({
      type: cert_type,
      certificate_number,
      issued_by,
      issue_date: issue_date ? new Date(issue_date) : null,
      expiry_date: expiry_date ? new Date(expiry_date) : null,
      document_url: req.file ? `/uploads/certificates/${req.file.filename}` : null,
      verified: false // Admin must verify
    });
    
    await responder.save();
    
    res.json({
      success: true,
      message: 'Certification uploaded successfully. Awaiting admin verification.',
      data: responder
    });
  } catch (error) {
    console.error('Error uploading certification:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading certification',
      error: error.message
    });
  }
});

/**
 * GET /api/civilian-responder/profile
 * Get own profile
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const responder = await CivilianResponder.findOne({ user_id: req.user.individualId });
    
    if (!responder) {
      return res.status(404).json({
        success: false,
        message: 'Not registered as a civilian responder'
      });
    }
    
    res.json({
      success: true,
      data: responder
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
});

/**
 * PUT /api/civilian-responder/location
 * Update current location (for proximity matching)
 */
router.put('/location', authenticateToken, async (req, res) => {
  try {
    const { lat, lng, address } = req.body;
    
    const responder = await CivilianResponder.findOneAndUpdate(
      { user_id: req.user.individualId },
      {
        $set: {
          'current_location.lat': lat,
          'current_location.lng': lng,
          'current_location.address': address,
          'current_location.last_updated': new Date()
        }
      },
      { new: true }
    );
    
    if (!responder) {
      return res.status(404).json({
        success: false,
        message: 'Not registered as a civilian responder'
      });
    }
    
    res.json({
      success: true,
      message: 'Location updated',
      data: responder
    });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating location',
      error: error.message
    });
  }
});

/**
 * PUT /api/civilian-responder/availability
 * Toggle availability status
 */
router.put('/availability', authenticateToken, async (req, res) => {
  try {
    const { is_available } = req.body;
    
    const responder = await CivilianResponder.findOneAndUpdate(
      { user_id: req.user.individualId },
      { $set: { is_available } },
      { new: true }
    );
    
    if (!responder) {
      return res.status(404).json({
        success: false,
        message: 'Not registered as a civilian responder'
      });
    }
    
    res.json({
      success: true,
      message: `Availability set to ${is_available ? 'available' : 'unavailable'}`,
      data: responder
    });
  } catch (error) {
    console.error('Error updating availability:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating availability',
      error: error.message
    });
  }
});

/**
 * GET /api/civilian-responder/stats
 * Get own response statistics
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const responder = await CivilianResponder.findOne({ user_id: req.user.individualId });
    
    if (!responder) {
      return res.status(404).json({
        success: false,
        message: 'Not registered as a civilian responder'
      });
    }
    
    const stats = {
      total_responses: responder.total_responses,
      successful_responses: responder.successful_responses,
      failed_responses: responder.failed_responses,
      success_rate: responder.total_responses > 0 
        ? ((responder.successful_responses / responder.total_responses) * 100).toFixed(1) 
        : 0,
      average_response_time_minutes: responder.average_response_time_minutes,
      rating: responder.rating,
      total_ratings: responder.total_ratings,
      verification_status: responder.verification_status,
      allowed_sos_levels: responder.allowed_sos_levels
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

module.exports = router;
