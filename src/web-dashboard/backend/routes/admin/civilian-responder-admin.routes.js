const express = require('express');
const router = express.Router();
const CivilianResponder = require('../../models/CivilianResponder');
const { authenticateToken, requireAdmin } = require('../../middleware/auth');

// Apply authentication and admin middleware
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * GET /api/admin/civilian-responders
 * Get all civilian responders (with filters)
 */
router.get('/', async (req, res) => {
  try {
    const { 
      verification_status, 
      is_available,
      limit = 50,
      page = 1
    } = req.query;
    
    let query = {};
    
    if (verification_status) {
      query.verification_status = verification_status;
    }
    
    if (is_available !== undefined) {
      query.is_available = is_available === 'true';
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const responders = await CivilianResponder.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await CivilianResponder.countDocuments(query);
    
    res.json({
      success: true,
      data: responders,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching civilian responders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching civilian responders',
      error: error.message
    });
  }
});

/**
 * GET /api/admin/civilian-responders/pending
 * Get responders pending verification
 */
router.get('/pending', async (req, res) => {
  try {
    const pendingResponders = await CivilianResponder.find({
      verification_status: 'pending'
    })
    .sort({ created_at: -1 });
    
    res.json({
      success: true,
      data: pendingResponders,
      count: pendingResponders.length
    });
  } catch (error) {
    console.error('Error fetching pending responders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending responders',
      error: error.message
    });
  }
});

/**
 * PUT /api/admin/civilian-responders/:id/verify-certification
 * Verify a specific certification
 */
router.put('/:id/verify-certification/:certIndex', async (req, res) => {
  try {
    const { id, certIndex } = req.params;
    const { verified } = req.body;
    
    const responder = await CivilianResponder.findById(id);
    
    if (!responder) {
      return res.status(404).json({
        success: false,
        message: 'Civilian responder not found'
      });
    }
    
    if (certIndex >= responder.certifications.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid certification index'
      });
    }
    
    // Update certification verification
    responder.certifications[certIndex].verified = verified;
    
    // Recalculate allowed SOS levels
    responder.updateAllowedLevels();
    
    await responder.save();
    
    res.json({
      success: true,
      message: `Certification ${verified ? 'verified' : 'rejected'}`,
      data: responder
    });
  } catch (error) {
    console.error('Error verifying certification:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying certification',
      error: error.message
    });
  }
});

/**
 * PUT /api/admin/civilian-responders/:id/verify
 * Verify/Reject civilian responder account
 */
router.put('/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'approve' or 'reject'
    
    const responder = await CivilianResponder.findById(id);
    
    if (!responder) {
      return res.status(404).json({
        success: false,
        message: 'Civilian responder not found'
      });
    }
    
    if (action === 'approve') {
      responder.verification_status = 'verified';
      responder.verified_at = new Date();
      responder.verified_by = {
        admin_id: req.user.individualId,
        admin_name: req.user.name
      };
      
      // Calculate allowed levels based on verified certifications
      responder.updateAllowedLevels();
    } else if (action === 'reject') {
      responder.verification_status = 'rejected';
    }
    
    await responder.save();
    
    res.json({
      success: true,
      message: `Civilian responder ${action}d`,
      data: responder
    });
  } catch (error) {
    console.error('Error verifying responder:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying responder',
      error: error.message
    });
  }
});

/**
 * PUT /api/admin/civilian-responders/:id/suspend
 * Suspend civilian responder
 */
router.put('/:id/suspend', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const responder = await CivilianResponder.findByIdAndUpdate(
      id,
      {
        verification_status: 'suspended',
        is_available: false,
        $push: {
          notes: {
            message: `Account suspended by admin. Reason: ${reason}`,
            timestamp: new Date(),
            added_by: req.user.individualId
          }
        }
      },
      { new: true }
    );
    
    if (!responder) {
      return res.status(404).json({
        success: false,
        message: 'Civilian responder not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Civilian responder suspended',
      data: responder
    });
  } catch (error) {
    console.error('Error suspending responder:', error);
    res.status(500).json({
      success: false,
      message: 'Error suspending responder',
      error: error.message
    });
  }
});

/**
 * GET /api/admin/civilian-responders/stats
 * Get civilian responder statistics
 */
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await CivilianResponder.aggregate([
      {
        $facet: {
          byStatus: [
            { $group: { _id: '$verification_status', count: { $sum: 1 } } }
          ],
          available: [
            { $match: { is_available: true, verification_status: 'verified' } },
            { $count: 'count' }
          ],
          topRated: [
            { $match: { verification_status: 'verified' } },
            { $sort: { rating: -1 } },
            { $limit: 10 },
            { $project: { full_name: 1, rating: 1, total_responses: 1, successful_responses: 1 } }
          ],
          totalResponses: [
            { $group: { _id: null, total: { $sum: '$total_responses' } } }
          ],
          averageRating: [
            { $match: { verification_status: 'verified', total_ratings: { $gt: 0 } } },
            { $group: { _id: null, avgRating: { $avg: '$rating' } } }
          ]
        }
      }
    ]);
    
    res.json({
      success: true,
      data: stats[0]
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
