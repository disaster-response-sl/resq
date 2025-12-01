// routes/sos-citizen.routes.js
/**
 * Citizen SOS Routes - No Authentication Required
 * Automatically creates shadow accounts for citizens
 */
const express = require('express');
const router = express.Router();
const SosSignal = require('../models/SosSignal');
const ShadowAuthService = require('../services/shadow-auth.service');
const { authenticateToken } = require('../middleware/auth');

/**
 * POST /api/sos/citizen/submit
 * Submit SOS without prior authentication
 * Automatically creates shadow account and returns JWT token
 */
router.post('/submit', async (req, res) => {
  try {
    const { name, phone, location, message, priority, photo } = req.body;
    
    // Validation
    if (!name || !phone || !location || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, phone, location, and message are required'
      });
    }
    
    if (!location.lat || !location.lng) {
      return res.status(400).json({
        success: false,
        message: 'Valid location coordinates (lat, lng) are required'
      });
    }
    
    console.log('[CITIZEN SOS] New submission from:', name, phone);
    
    // Step 1: Find or create shadow account
    const citizen = await ShadowAuthService.findOrCreateCitizen(phone, name);
    
    // Step 2: Create SOS signal
    const sos = new SosSignal({
      user_id: citizen._id.toString(),
      citizen_name: name,
      citizen_phone: phone,
      location: {
        lat: parseFloat(location.lat),
        lng: parseFloat(location.lng)
      },
      message,
      priority: priority || 'high',
      photo_url: photo,
      status: 'pending',
      created_at: new Date()
    });
    
    await sos.save();
    
    console.log('[CITIZEN SOS] SOS saved:', sos._id);
    
    // Step 3: Increment activity counter
    await ShadowAuthService.incrementActivity(citizen._id, 'sos');
    
    // Step 4: Generate JWT token
    const token = ShadowAuthService.generateToken(citizen);
    
    console.log('[CITIZEN SOS] Token generated for:', citizen.name);
    
    // Step 5: Return response with token
    res.json({
      success: true,
      message: 'SOS submitted successfully. Help is on the way!',
      data: {
        sos: {
          id: sos._id,
          status: sos.status,
          priority: sos.priority,
          created_at: sos.created_at
        },
        citizen: {
          id: citizen._id,
          name: citizen.name,
          phone: citizen.phone
        },
        auth: {
          token, // JWT token for future authenticated requests
          expiresIn: '30d'
        }
      }
    });
    
  } catch (error) {
    console.error('[CITIZEN SOS ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit SOS',
      error: error.message
    });
  }
});

/**
 * POST /api/sos/citizen/register-push
 * Register push notification token
 * Requires authentication (token from SOS submission)
 */
router.post('/register-push', authenticateToken, async (req, res) => {
  try {
    const { pushToken, deviceType } = req.body;
    
    if (!pushToken) {
      return res.status(400).json({
        success: false,
        message: 'Push token is required'
      });
    }
    
    const citizenId = req.user.citizenId || req.user.individualId;
    
    await ShadowAuthService.registerPushToken(citizenId, pushToken, deviceType || 'web');
    
    res.json({
      success: true,
      message: 'Push notifications enabled'
    });
    
  } catch (error) {
    console.error('[REGISTER PUSH ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register push token',
      error: error.message
    });
  }
});

/**
 * GET /api/sos/citizen/my-sos
 * Get all SOS signals submitted by this citizen
 * Requires authentication
 */
router.get('/my-sos', authenticateToken, async (req, res) => {
  try {
    const citizenId = req.user.citizenId || req.user.individualId;
    console.log('[MY SOS] Fetching SOS for citizen:', citizenId);
    console.log('[MY SOS] User object:', req.user);
    
    const sosSignals = await SosSignal.find({ user_id: citizenId })
      .sort({ created_at: -1 })
      .limit(20);
    
    console.log('[MY SOS] Found', sosSignals.length, 'SOS signals');
    if (sosSignals.length > 0) {
      console.log('[MY SOS] Sample SOS user_ids:', sosSignals.slice(0, 3).map(s => s.user_id));
    }
    
    res.json({
      success: true,
      data: sosSignals
    });
    
  } catch (error) {
    console.error('[MY SOS ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch SOS history',
      error: error.message
    });
  }
});

module.exports = router;
