const express = require('express');
const router = express.Router();
const SosSignal = require('../models/SosSignal');
const SosResponse = require('../models/SosResponse');
const CivilianResponder = require('../models/CivilianResponder');
const MissingPerson = require('../models/MissingPerson');
const { authenticateToken } = require('../middleware/auth');

// Utility function to calculate distance
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * GET /api/sos/public/nearby
 * Public endpoint - ALL verified responders see ALL active SOS signals
 * No admin assignment needed - responders can self-assign
 */
router.get('/public/nearby', authenticateToken, async (req, res) => {
  try {
    const { lat, lng, radius_km = 10000 } = req.query; // Default to 10,000km (entire country)
    
    const userLat = lat ? parseFloat(lat) : null;
    const userLng = lng ? parseFloat(lng) : null;
    
    // Get all active SOS signals (NO admin assignment needed)
    const sosSignals = await SosSignal.find({
      status: { $in: ['pending', 'acknowledged', 'responding'] },
      'victim_safe_confirmation.is_safe': { $ne: true }
    })
    .sort({ priority: -1, created_at: -1 })
    .lean();
    
    // Calculate distance for each SOS if location provided
    let sosWithDistance = sosSignals;
    if (userLat && userLng) {
      sosWithDistance = sosSignals.map(sos => {
        const distance = calculateDistance(userLat, userLng, sos.location.lat, sos.location.lng);
        return { ...sos, distance_km: distance };
      });
      
      // Apply radius filter only if specified
      const radius = parseFloat(radius_km);
      if (radius < 10000) {
        sosWithDistance = sosWithDistance.filter(sos => sos.distance_km <= radius);
      }
      
      // Sort by distance
      sosWithDistance.sort((a, b) => a.distance_km - b.distance_km);
    } else {
      // No location, just add null distance
      sosWithDistance = sosSignals.map(sos => ({ ...sos, distance_km: null }));
    }
    
    // Check if user is a civilian responder
    const civilianResponder = await CivilianResponder.findOne({ user_id: req.user.individualId });
    
    // Filter by allowed levels if civilian responder
    // But if user is a regular responder (role === 'responder'), show all SOS
    let filteredSOS = sosWithDistance;
    if (req.user.role !== 'responder' && civilianResponder && civilianResponder.verification_status === 'verified') {
      // Civilian responder - filter by allowed levels
      filteredSOS = sosWithDistance.filter(sos => 
        civilianResponder.allowed_sos_levels.includes(sos.sos_level)
      );
    }
    // Otherwise (regular responder or admin) - show all SOS
    
    res.json({
      success: true,
      data: filteredSOS,
      count: filteredSOS.length,
      total_active: sosSignals.length,
      user_is_civilian_responder: !!civilianResponder,
      civilian_verification_status: civilianResponder?.verification_status || null,
      allowed_levels: civilianResponder?.allowed_sos_levels || ['level_1'],
      message: 'All verified responders can see and self-assign to any SOS alert'
    });
  } catch (error) {
    console.error('Error fetching SOS signals:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching SOS signals',
      error: error.message
    });
  }
});

/**
 * POST /api/sos/:id/accept
 * Civilian responder accepts an SOS signal
 */
router.post('/:id/accept', authenticateToken, async (req, res) => {
  try {
    const sosId = req.params.id;
    
    // Verify user is a civilian responder
    const responder = await CivilianResponder.findOne({ user_id: req.user.individualId });
    
    if (!responder) {
      return res.status(403).json({
        success: false,
        message: 'You must be registered as a civilian responder'
      });
    }
    
    if (responder.verification_status !== 'verified') {
      return res.status(403).json({
        success: false,
        message: 'Your civilian responder account is not verified yet'
      });
    }
    
    if (!responder.is_available) {
      return res.status(400).json({
        success: false,
        message: 'You must be marked as available to accept SOS'
      });
    }
    
    if (responder.assigned_sos_id) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active SOS assignment'
      });
    }
    
    // Get SOS signal
    const sos = await SosSignal.findById(sosId);
    
    if (!sos) {
      return res.status(404).json({
        success: false,
        message: 'SOS signal not found'
      });
    }
    
    // Check if SOS level is allowed for this responder
    if (!responder.allowed_sos_levels.includes(sos.sos_level)) {
      return res.status(403).json({
        success: false,
        message: `You are not authorized to respond to ${sos.sos_level} emergencies. Upload relevant certifications to unlock.`
      });
    }
    
    // Allow multiple responders (no longer block if already assigned)
    // First responder becomes primary, others can also help
    const isFirstResponder = !sos.assigned_responder;
    
    // Create SOS Response
    const response = new SosResponse({
      sos_signal_id: sosId,
      responder_id: req.user.individualId,
      responder_type: 'civilian',
      responder_name: responder.full_name,
      responder_organization: 'Verified Civilian Responder',
      responder_phone: responder.phone,
      status: 'assigned',
      responder_location: {
        lat: responder.current_location.lat,
        lng: responder.current_location.lng,
        last_updated: new Date()
      },
      distance_to_victim_km: calculateDistance(
        responder.current_location.lat,
        responder.current_location.lng,
        sos.location.lat,
        sos.location.lng
      )
    });
    
    await response.save();
    
    // Update SOS signal
    if (isFirstResponder) {
      sos.assigned_responder = req.user.individualId;
      sos.response_time = new Date();
    }
    sos.status = 'acknowledged';
    sos.active_response_id = response._id;
    
    // Add status update for victim
    const statusMessage = isFirstResponder 
      ? `${responder.full_name} from Verified Civilian Responder is on the way!`
      : `Additional help: ${responder.full_name} is also responding!`;
    
    sos.victim_status_updates.push({
      message: statusMessage,
      update_type: 'responder_assigned',
      timestamp: new Date()
    });
    
    await sos.save();
    
    // Update responder assignment
    responder.assigned_sos_id = sosId;
    await responder.save();
    
    res.json({
      success: true,
      message: 'SOS accepted! Please update your status as you travel.',
      data: {
        sos,
        response
      }
    });
  } catch (error) {
    console.error('Error accepting SOS:', error);
    res.status(500).json({
      success: false,
      message: 'Error accepting SOS',
      error: error.message
    });
  }
});

/**
 * PUT /api/sos/response/:responseId/status
 * Update response status (en_route, arrived, assisting, completed)
 */
router.put('/response/:responseId/status', authenticateToken, async (req, res) => {
  try {
    const { responseId } = req.params;
    const { status, lat, lng } = req.body;
    
    const response = await SosResponse.findById(responseId);
    
    if (!response) {
      return res.status(404).json({
        success: false,
        message: 'Response not found'
      });
    }
    
    if (response.responder_id !== req.user.individualId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    // Update status
    response.status = status;
    
    // Update timestamps
    switch(status) {
      case 'en_route':
        response.en_route_at = new Date();
        break;
      case 'arrived':
        response.arrived_at = new Date();
        break;
      case 'completed':
        response.completed_at = new Date();
        break;
    }
    
    // Update location if provided
    if (lat && lng) {
      response.responder_location = {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        last_updated: new Date()
      };
      
      // Calculate distance to victim
      const sos = await SosSignal.findById(response.sos_signal_id);
      if (sos) {
        response.distance_to_victim_km = calculateDistance(
          lat, lng, sos.location.lat, sos.location.lng
        );
      }
    }
    
    await response.save();
    
    // Update SOS signal status
    const sos = await SosSignal.findById(response.sos_signal_id);
    if (sos) {
      let statusMessage = '';
      
      if (status === 'en_route') {
        sos.status = 'responding';
        statusMessage = `Responder is on the way to your location`;
        sos.victim_status_updates.push({
          message: statusMessage,
          update_type: 'responder_en_route',
          timestamp: new Date()
        });
      } else if (status === 'arrived') {
        statusMessage = `Responder has arrived at your location`;
        sos.victim_status_updates.push({
          message: statusMessage,
          update_type: 'responder_arrived',
          timestamp: new Date()
        });
      }
      await sos.save();
      
      // Send real-time notification via Socket.io
      const socketService = require('../services/socket.service');
      socketService.notifyResponderUpdate(sos._id.toString(), {
        status,
        message: statusMessage,
        responder_location: response.responder_location,
        distance_to_victim_km: response.distance_to_victim_km,
        estimated_arrival_time: response.estimated_arrival_time
      });
    }
    
    res.json({
      success: true,
      message: 'Status updated successfully',
      data: response
    });
  } catch (error) {
    console.error('Error updating response status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating status',
      error: error.message
    });
  }
});

/**
 * POST /api/sos/response/:responseId/chat
 * Send chat message between victim and responder
 */
router.post('/response/:responseId/chat', authenticateToken, async (req, res) => {
  try {
    const { responseId } = req.params;
    const { message } = req.body;
    
    const response = await SosResponse.findById(responseId);
    const sos = await SosSignal.findById(response.sos_signal_id);
    
    if (!response) {
      return res.status(404).json({
        success: false,
        message: 'Response not found'
      });
    }
    
    // Determine sender type
    const isResponder = response.responder_id === req.user.individualId;
    const isVictim = sos.user_id === req.user.individualId;
    
    if (!isResponder && !isVictim) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    // Add chat message
    response.chat_messages.push({
      sender_id: req.user.individualId,
      sender_name: req.user.name,
      sender_type: isResponder ? 'responder' : 'victim',
      message,
      timestamp: new Date(),
      read: false
    });
    
    await response.save();
    
    // Add notification to SOS
    if (isResponder) {
      sos.victim_status_updates.push({
        message: `Responder: ${message}`,
        update_type: 'chat_message',
        timestamp: new Date()
      });
      await sos.save();
      
      // Send real-time notification via Socket.io
      const socketService = require('../services/socket.service');
      socketService.notifyChatMessage(sos._id.toString(), {
        sender: req.user.name,
        message,
        timestamp: new Date()
      });
    }
    
    res.json({
      success: true,
      message: 'Message sent',
      data: response.chat_messages[response.chat_messages.length - 1]
    });
  } catch (error) {
    console.error('Error sending chat message:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message',
      error: error.message
    });
  }
});

/**
 * POST /api/sos/:id/mark-safe
 * Victim marks themselves as safe ("I Am Safe" button)
 */
router.post('/:id/mark-safe', authenticateToken, async (req, res) => {
  try {
    const sosId = req.params.id;
    const { lat, lng } = req.body;
    
    const sos = await SosSignal.findById(sosId);
    
    if (!sos) {
      return res.status(404).json({
        success: false,
        message: 'SOS signal not found'
      });
    }
    
    if (sos.user_id !== req.user.individualId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    // Mark as safe
    sos.victim_safe_confirmation = {
      is_safe: true,
      confirmed_at: new Date(),
      location: { lat, lng }
    };
    sos.status = 'resolved';
    sos.resolution_time = new Date();
    
    await sos.save();
    
    // Cancel active response if any
    if (sos.active_response_id) {
      await SosResponse.findByIdAndUpdate(sos.active_response_id, {
        status: 'cancelled',
        rescue_outcome: 'victim_safe_already'
      });
      
      // Free up the responder
      if (sos.assigned_responder) {
        await CivilianResponder.findOneAndUpdate(
          { user_id: sos.assigned_responder },
          { assigned_sos_id: null }
        );
      }
    }
    
    res.json({
      success: true,
      message: 'Marked as safe! SOS has been cancelled.',
      data: sos
    });
  } catch (error) {
    console.error('Error marking safe:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking safe',
      error: error.message
    });
  }
});

/**
 * POST /api/sos/response/:responseId/complete
 * Complete rescue and optionally create Missing Person entry
 */
router.post('/response/:responseId/complete', authenticateToken, async (req, res) => {
  try {
    const { responseId } = req.params;
    const {
      rescue_outcome,
      victim_status,
      relief_camp_name,
      relief_camp_id,
      hospital_name,
      create_missing_person_entry,
      victim_name,
      victim_age,
      victim_gender,
      notes
    } = req.body;
    
    const response = await SosResponse.findById(responseId);
    
    if (!response) {
      return res.status(404).json({
        success: false,
        message: 'Response not found'
      });
    }
    
    if (response.responder_id !== req.user.individualId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    // Update response
    response.status = 'completed';
    response.completed_at = new Date();
    response.rescue_outcome = rescue_outcome;
    response.victim_status = victim_status;
    response.relief_camp_name = relief_camp_name;
    response.relief_camp_id = relief_camp_id;
    response.hospital_name = hospital_name;
    
    if (notes) {
      response.notes.push({
        message: notes,
        timestamp: new Date(),
        added_by: req.user.individualId
      });
    }
    
    await response.save();
    
    // Update SOS signal
    const sos = await SosSignal.findById(response.sos_signal_id);
    sos.status = 'resolved';
    sos.resolution_time = new Date();
    sos.rescue_completed = true;
    
    if (rescue_outcome === 'transported_to_camp') {
      sos.transported_to_camp = true;
      sos.relief_camp_name = relief_camp_name;
      sos.relief_camp_id = relief_camp_id;
    }
    
    await sos.save();
    
    // Free up the responder
    await CivilianResponder.findOneAndUpdate(
      { user_id: req.user.individualId },
      { 
        assigned_sos_id: null,
        $inc: { 
          total_responses: 1,
          successful_responses: rescue_outcome.includes('rescued') ? 1 : 0
        }
      }
    );
    
    // Create Missing Person entry if requested
    let missingPersonEntry = null;
    if (create_missing_person_entry && rescue_outcome === 'transported_to_camp') {
      missingPersonEntry = new MissingPerson({
        full_name: victim_name,
        age: victim_age,
        gender: victim_gender || 'other',
        description: `Rescued from SOS emergency and transported to ${relief_camp_name}`,
        last_seen_date: sos.created_at,
        last_seen_location: sos.location,
        circumstances: `Rescued during flood emergency. Currently at ${relief_camp_name}`,
        reporter_name: response.responder_name,
        reporter_relationship: 'Rescue Responder',
        reporter_phone: response.responder_phone,
        status: 'found_safe',
        found_date: new Date(),
        found_location: sos.location,
        found_condition: victim_status,
        resolution_details: `Transported to relief camp: ${relief_camp_name}`,
        verification_status: 'verified', // Auto-verify from official rescue
        verified_by: {
          user_id: req.user.individualId,
          username: response.responder_name,
          role: 'responder',
          verified_at: new Date()
        },
        public_visibility: true,
        created_by: req.user.individualId,
        disaster_related: true
      });
      
      await missingPersonEntry.save();
      
      // Link to response
      response.created_missing_person_entry = true;
      response.missing_person_id = missingPersonEntry._id;
      await response.save();
    }
    
    res.json({
      success: true,
      message: 'Rescue completed successfully!',
      data: {
        response,
        sos,
        missing_person_entry: missingPersonEntry
      }
    });
  } catch (error) {
    console.error('Error completing rescue:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing rescue',
      error: error.message
    });
  }
});

/**
 * GET /api/sos/:id/status
 * Get real-time status updates for victim
 */
router.get('/:id/status', authenticateToken, async (req, res) => {
  try {
    const sosId = req.params.id;
    
    const sos = await SosSignal.findById(sosId);
    
    if (!sos) {
      return res.status(404).json({
        success: false,
        message: 'SOS signal not found'
      });
    }
    
    // Get active response if any
    let response = null;
    if (sos.active_response_id) {
      response = await SosResponse.findById(sos.active_response_id);
    }
    
    res.json({
      success: true,
      data: {
        sos_status: sos.status,
        assigned_responder: sos.assigned_responder,
        response_time: sos.response_time,
        victim_status_updates: sos.victim_status_updates,
        active_response: response,
        responder_location: response?.responder_location,
        distance_to_victim_km: response?.distance_to_victim_km,
        estimated_arrival_time: response?.estimated_arrival_time,
        chat_messages: response?.chat_messages || []
      }
    });
  } catch (error) {
    console.error('Error fetching SOS status:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching status',
      error: error.message
    });
  }
});

module.exports = router;
