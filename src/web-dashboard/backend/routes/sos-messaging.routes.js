// routes/sos-messaging.routes.js
/**
 * SOS Messaging Routes
 * Allows responders and citizens to communicate about SOS
 */
const express = require('express');
const router = express.Router();
const SosSignal = require('../models/SosSignal');
const { authenticateToken } = require('../middleware/auth');
const socketService = require('../services/socket.service');

/**
 * POST /api/sos/:id/messages
 * Send a message on an SOS
 * Both citizens and responders can send messages
 */
router.post('/:id/messages', authenticateToken, async (req, res) => {
  try {
    const { id: sosId } = req.params;
    const { message } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }
    
    const sos = await SosSignal.findById(sosId);
    
    if (!sos) {
      return res.status(404).json({
        success: false,
        message: 'SOS signal not found'
      });
    }
    
    // Determine message sender
    const userId = req.user.citizenId || req.user.individualId || req.user._id;
    const userRole = req.user.role || 'citizen';
    const userName = req.user.name || 'User';
    
    // Check authorization - only SOS creator or responders can message
    const isSOSCreator = sos.user_id === userId;
    const hasActiveResponse = sos.active_response_id != null;
    
    if (!isSOSCreator && userRole !== 'responder' && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to message on this SOS'
      });
    }
    
    // Add message to victim_status_updates
    const messageUpdate = {
      message: `${userName}: ${message}`,
      update_type: 'chat_message',
      timestamp: new Date(),
      sender_id: userId,
      sender_role: userRole,
      sender_name: userName
    };
    
    sos.victim_status_updates.push(messageUpdate);
    await sos.save();
    
    // Emit real-time notification via Socket.io
    socketService.notifyChatMessage(sosId, {
      sosId,
      message: messageUpdate,
      sender: {
        id: userId,
        name: userName,
        role: userRole
      }
    });
    
    res.json({
      success: true,
      message: 'Message sent successfully',
      data: messageUpdate
    });
    
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message',
      error: error.message
    });
  }
});

/**
 * GET /api/sos/:id/messages
 * Get all messages for an SOS
 */
router.get('/:id/messages', authenticateToken, async (req, res) => {
  try {
    const { id: sosId } = req.params;
    
    const sos = await SosSignal.findById(sosId).select('victim_status_updates user_id');
    
    if (!sos) {
      return res.status(404).json({
        success: false,
        message: 'SOS signal not found'
      });
    }
    
    // Check authorization
    const userId = req.user.citizenId || req.user.individualId || req.user._id;
    const userRole = req.user.role || 'citizen';
    const isSOSCreator = sos.user_id === userId;
    
    if (!isSOSCreator && userRole !== 'responder' && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view messages on this SOS'
      });
    }
    
    // Filter only chat messages
    const messages = sos.victim_status_updates
      .filter(update => update.update_type === 'chat_message')
      .map(update => ({
        id: update._id,
        message: update.message,
        timestamp: update.timestamp,
        sender_id: update.sender_id,
        sender_name: update.sender_name,
        sender_role: update.sender_role
      }));
    
    res.json({
      success: true,
      data: messages
    });
    
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching messages',
      error: error.message
    });
  }
});

/**
 * PUT /api/sos/:id/status
 * Update SOS status (for citizens to mark as resolved, etc.)
 */
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id: sosId } = req.params;
    const { status, notes } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }
    
    const sos = await SosSignal.findById(sosId);
    
    if (!sos) {
      return res.status(404).json({
        success: false,
        message: 'SOS signal not found'
      });
    }
    
    // Check authorization - only SOS creator, responders, or admins can update status
    const userId = req.user.citizenId || req.user.individualId || req.user._id;
    const userRole = req.user.role || 'citizen';
    const isSOSCreator = sos.user_id === userId;
    
    if (!isSOSCreator && userRole !== 'responder' && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this SOS status'
      });
    }
    
    const oldStatus = sos.status;
    sos.status = status;
    
    // Add status update to timeline
    const userName = req.user.name || 'User';
    sos.victim_status_updates.push({
      message: `${userName} updated status from ${oldStatus} to ${status}${notes ? `: ${notes}` : ''}`,
      update_type: 'system_update',
      timestamp: new Date()
    });
    
    // If marked as resolved, set resolution time
    if (status === 'resolved' && !sos.resolution_time) {
      sos.resolution_time = new Date();
    }
    
    await sos.save();
    
    // Emit real-time notification
    socketService.emitToRoom(`sos_${sosId}`, 'status-update', {
      sosId,
      status,
      oldStatus,
      updatedBy: userName
    });
    
    res.json({
      success: true,
      message: 'SOS status updated successfully',
      data: {
        id: sos._id,
        status: sos.status,
        updated_at: sos.updated_at
      }
    });
    
  } catch (error) {
    console.error('Error updating SOS status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating SOS status',
      error: error.message
    });
  }
});

module.exports = router;
