const express = require('express');
const router = express.Router();
const MissingPerson = require('../models/MissingPerson');
const { authenticateToken } = require('../middleware/auth');

// GET /api/missing-persons - Get all missing persons
router.get('/', async (req, res) => {
  try {
    const { status, priority, disaster_related, verification_status, limit = 100, skip = 0 } = req.query;
    
    let query = {};
    
    // Public users only see verified posts with public visibility
    // Admins can filter by verification_status (including pending)
    if (req.query.verification_status && req.user && req.user.role === 'admin') {
      // Admin can request specific verification status
      query.verification_status = req.query.verification_status;
    } else {
      // Public view: only show verified and publicly visible posts
      query.verification_status = 'verified';
      query.public_visibility = true;
    }
    
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (disaster_related) query.disaster_related = disaster_related === 'true';
    
    const missingPersons = await MissingPerson.find(query)
      .sort({ created_at: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));
    
    const total = await MissingPerson.countDocuments(query);
    
    res.json({
      success: true,
      data: missingPersons,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: (parseInt(skip) + missingPersons.length) < total
      }
    });
  } catch (error) {
    console.error('Error fetching missing persons:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching missing persons',
      error: error.message
    });
  }
});

// GET /api/missing-persons/stats - Get statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await MissingPerson.getStats();
    
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

// GET /api/missing-persons/search - Search missing persons
router.get('/search', async (req, res) => {
  try {
    const { q, lat, lng, radius_km = 50 } = req.query;
    
    let query = { 
      status: 'missing',
      // Only show verified and publicly visible posts
      verification_status: 'verified',
      public_visibility: true,
      auto_hidden: { $ne: true }
    };
    
    // Text search
    if (q) {
      query.$or = [
        { full_name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { case_number: { $regex: q, $options: 'i' } },
        { 'last_seen_location.address': { $regex: q, $options: 'i' } }
      ];
    }
    
    let missingPersons = await MissingPerson.find(query)
      .sort({ created_at: -1 })
      .limit(50);
    
    // Filter by distance if location provided
    if (lat && lng && radius_km) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const radiusKm = parseFloat(radius_km);
      
      missingPersons = missingPersons.filter(person => {
        const distance = calculateDistance(
          userLat,
          userLng,
          person.last_seen_location.lat,
          person.last_seen_location.lng
        );
        return distance <= radiusKm;
      }).map(person => {
        const personObj = person.toObject();
        personObj.distance_km = calculateDistance(
          userLat,
          userLng,
          person.last_seen_location.lat,
          person.last_seen_location.lng
        );
        return personObj;
      });
      
      // Sort by distance
      missingPersons.sort((a, b) => a.distance_km - b.distance_km);
    }
    
    res.json({
      success: true,
      data: missingPersons
    });
  } catch (error) {
    console.error('Error searching missing persons:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching missing persons',
      error: error.message
    });
  }
});

// GET /api/missing-persons/:id - Get single missing person
router.get('/:id', async (req, res) => {
  try {
    const missingPerson = await MissingPerson.findById(req.params.id);
    
    if (!missingPerson) {
      return res.status(404).json({
        success: false,
        message: 'Missing person not found'
      });
    }
    
    // Public users can only see verified and publicly visible posts
    // Admins can see all posts
    const isAdmin = req.user && req.user.role === 'admin';
    if (!isAdmin && (!missingPerson.public_visibility || missingPerson.verification_status !== 'verified')) {
      return res.status(403).json({
        success: false,
        message: 'This report is not publicly accessible'
      });
    }
    
    res.json({
      success: true,
      data: missingPerson
    });
  } catch (error) {
    console.error('Error fetching missing person:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching missing person',
      error: error.message
    });
  }
});

// Import security middleware
const { 
  missingPersonSubmissionLimiter, 
  checkDuplicateSubmission 
} = require('../middleware/security');

// POST /api/missing-persons - Create new missing person report
// Now accepts both authenticated and unauthenticated submissions
// WITH rate limiting and duplicate checking
router.post('/', 
  missingPersonSubmissionLimiter, 
  checkDuplicateSubmission,
  async (req, res) => {
  try {
    // Check if user is authenticated (optional)
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    let userId = null;
    let userRole = null;
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const jwtSecret = process.env.JWT_SECRET;
        
        if (!jwtSecret) {
          return res.status(500).json({
            success: false,
            message: 'Server configuration error: JWT_SECRET not set'
          });
        }
        const decoded = jwt.verify(token, jwtSecret);
        userId = decoded._id || decoded.citizenId || decoded.individualId;
        userRole = decoded.role;
        console.log('[MISSING PERSON] Authenticated user:', { userId, userRole, decoded });
      } catch (err) {
        // Token invalid, continue as unauthenticated
        console.log('[MISSING PERSON] Token verification failed:', err.message);
        console.log('[MISSING PERSON] Continuing as unauthenticated submission');
      }
    }
    
    // If phone is provided but not authenticated, create shadow account
    const ShadowAuthService = require('../services/shadow-auth.service');
    let citizenToken = null;
    
    if (!userId && req.body.reporter_phone && req.body.reporter_name) {
      try {
        const citizen = await ShadowAuthService.findOrCreateCitizen(
          req.body.reporter_phone,
          req.body.reporter_name,
          { email: req.body.reporter_email }
        );
        userId = citizen._id;
        
        // Try to generate token, but don't fail if JWT_SECRET is missing
        try {
          citizenToken = ShadowAuthService.generateToken(citizen);
        } catch (tokenErr) {
          console.warn('[MISSING PERSON] Could not generate citizen token (JWT_SECRET not configured)');
        }
        
        await ShadowAuthService.incrementActivity(citizen._id, 'missing_person');
        
        console.log('[MISSING PERSON] Shadow account created for:', citizen.name);
      } catch (err) {
        console.error('[MISSING PERSON] Shadow account creation failed:', err);
        // Continue without user ID - allow anonymous submission
      }
    }
    
    // Capture IP and metadata
    const submittedFromIp = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    const missingPersonData = {
      ...req.body,
      created_by: userId || 'anonymous',
      last_modified_by: userId || 'anonymous',
      // Security fields
      verification_status: userRole === 'admin' ? 'verified' : 'pending',
      requires_admin_approval: userRole !== 'admin',
      public_visibility: userRole === 'admin', // Auto-approve admin submissions
      submitted_from_ip: submittedFromIp,
      submission_metadata: {
        ...(req.body.submission_metadata || {}),
        user_agent: req.headers['user-agent']
      },
      approval_history: [{
        action: 'submitted',
        performed_by: {
          user_id: userId || 'anonymous',
          username: req.body.reporter_name || 'Anonymous',
          role: userRole || 'citizen'
        },
        timestamp: new Date()
      }]
    };
    
    const missingPerson = new MissingPerson(missingPersonData);
    
    try {
      await missingPerson.save();
      console.log(`📝 Missing person report created: ${missingPerson._id} | Status: ${missingPerson.verification_status} | From IP: ${submittedFromIp}`);
    } catch (saveError) {
      console.error('❌ MongoDB save error:', saveError.message);
      console.error('Validation errors:', saveError.errors);
      throw saveError;
    }
    
    const response = {
      success: true,
      message: userRole === 'admin' 
        ? 'Missing person report created and auto-approved'
        : 'Missing person report submitted successfully. Pending admin approval.',
      data: missingPerson,
      pending_approval: userRole !== 'admin'
    };
    
    // Include auth token if shadow account was created
    if (citizenToken) {
      response.auth = {
        token: citizenToken,
        expiresIn: '30d',
        message: 'Account created for updates and notifications'
      };
    }
    
    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating missing person report:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating missing person report',
      error: error.message
    });
  }
});

// PUT /api/missing-persons/:id - Update missing person
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      last_modified_by: req.user._id,
      updated_at: new Date()
    };
    
    const missingPerson = await MissingPerson.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!missingPerson) {
      return res.status(404).json({
        success: false,
        message: 'Missing person not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Missing person updated successfully',
      data: missingPerson
    });
  } catch (error) {
    console.error('Error updating missing person:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating missing person',
      error: error.message
    });
  }
});

// POST /api/missing-persons/:id/sightings - Add sighting
router.post('/:id/sightings', async (req, res) => {
  try {
    const { location, description, reported_by, contact } = req.body;
    
    const missingPerson = await MissingPerson.findById(req.params.id);
    
    if (!missingPerson) {
      return res.status(404).json({
        success: false,
        message: 'Missing person not found'
      });
    }
    
    missingPerson.sightings.push({
      location,
      description,
      reported_by,
      contact,
      date: new Date()
    });
    
    // Add update
    missingPerson.updates.push({
      message: `New sighting reported: ${description}`,
      added_by: reported_by || 'Anonymous',
      update_type: 'sighting'
    });
    
    await missingPerson.save();
    
    res.json({
      success: true,
      message: 'Sighting added successfully',
      data: missingPerson
    });
  } catch (error) {
    console.error('Error adding sighting:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding sighting',
      error: error.message
    });
  }
});

// POST /api/missing-persons/:id/updates - Add update
router.post('/:id/updates', authenticateToken, async (req, res) => {
  try {
    const { message, update_type } = req.body;
    
    const missingPerson = await MissingPerson.findById(req.params.id);
    
    if (!missingPerson) {
      return res.status(404).json({
        success: false,
        message: 'Missing person not found'
      });
    }
    
    missingPerson.updates.push({
      message,
      added_by: req.user._id,
      update_type: update_type || 'general'
    });
    
    await missingPerson.save();
    
    res.json({
      success: true,
      message: 'Update added successfully',
      data: missingPerson
    });
  } catch (error) {
    console.error('Error adding update:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding update',
      error: error.message
    });
  }
});

// PUT /api/missing-persons/:id/status - Update status
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status, found_location, found_condition, resolution_details } = req.body;
    
    const updateData = {
      status,
      last_modified_by: req.user._id
    };
    
    if (status === 'found_safe' || status === 'found_deceased') {
      updateData.found_date = new Date();
      if (found_location) updateData.found_location = found_location;
      if (found_condition) updateData.found_condition = found_condition;
      if (resolution_details) updateData.resolution_details = resolution_details;
    }
    
    const missingPerson = await MissingPerson.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!missingPerson) {
      return res.status(404).json({
        success: false,
        message: 'Missing person not found'
      });
    }
    
    // Add status change update
    missingPerson.updates.push({
      message: `Status changed to: ${status}`,
      added_by: req.user._id,
      update_type: 'status_change'
    });
    
    await missingPerson.save();
    
    res.json({
      success: true,
      message: 'Status updated successfully',
      data: missingPerson
    });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating status',
      error: error.message
    });
  }
});

// DELETE /api/missing-persons/:id - Delete missing person (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const missingPerson = await MissingPerson.findByIdAndDelete(req.params.id);
    
    if (!missingPerson) {
      return res.status(404).json({
        success: false,
        message: 'Missing person not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Missing person report deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting missing person:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting missing person',
      error: error.message
    });
  }
});

// POST /api/missing-persons/extract - Extract data from poster image (HYBRID PROCESSOR)
router.post('/extract', async (req, res) => {
  try {
    const axios = require('axios');
    const FormData = require('form-data');
    
    // Note: This endpoint expects multipart/form-data with image file
    // In a real implementation, use multer middleware to handle file uploads
    
    if (!req.files || !req.files.image) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }
    
    console.log('📸 Extracting data from missing person poster...');
    
    // Forward to extraction API
    const formData = new FormData();
    formData.append('image', req.files.image.data, {
      filename: req.files.image.name,
      contentType: req.files.image.mimetype
    });
    
    const extractionResponse = await axios.post(
      `${process.env.EXTRACTION_API_URL || 'https://flood-callback.asyncdot.com'}/missing-person/extract`,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: 30000 // 30 second timeout
      }
    );
    
    console.log('✅ Extraction API response:', extractionResponse.data);
    
    // Return extracted data for frontend to review
    // DO NOT save to database yet - that's the form's job
    res.json({
      success: true,
      message: 'Data extracted successfully. Please review and submit.',
      extracted_data: extractionResponse.data.data,
      confidence: extractionResponse.data.data.confidence,
      note: 'This data has NOT been saved yet. Review and submit the form to save.'
    });
    
  } catch (error) {
    console.error('❌ Extraction API error:', error.response?.data || error.message);
    
    // If extraction fails, allow manual entry
    res.status(200).json({
      success: false,
      message: 'Could not extract data from image. Please enter details manually.',
      error: error.response?.data?.message || error.message,
      fallback_to_manual: true
    });
  }
});

// POST /api/missing-persons/submit - Submit missing person with extracted data
router.post('/submit', authenticateToken, async (req, res) => {
  try {
    const { extracted_data, manual_data, image_url } = req.body;
    
    // Merge extracted and manual data (manual takes precedence)
    const missingPersonData = {
      ...manual_data,
      extracted_data: extracted_data || null,
      data_source: extracted_data ? 'ai_extracted' : 'manual',
      verification_status: 'unverified', // Trust but Verify - public immediately
      photo_urls: image_url ? [image_url] : [],
      created_by: req.user._id,
      last_modified_by: req.user._id,
      public_visibility: true // Public immediately with unverified badge
    };
    
    const missingPerson = new MissingPerson(missingPersonData);
    await missingPerson.save();
    
    console.log(`✅ Missing person report created: ${missingPerson.case_number} (Status: ${missingPerson.verification_status})`);
    
    res.status(201).json({
      success: true,
      message: 'Missing person report submitted successfully and is now publicly visible as unverified.',
      data: missingPerson
    });
  } catch (error) {
    console.error('❌ Error submitting missing person:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting missing person report',
      error: error.message
    });
  }
});

// PUT /api/missing-persons/:id/verify - Verify pending report (Admin/Responder only)
router.put('/:id/verify', authenticateToken, async (req, res) => {
  try {
    const { action, rejection_reason } = req.body; // action: 'approve' or 'reject'
    
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Use "approve" or "reject"'
      });
    }
    
    const missingPerson = await MissingPerson.findById(req.params.id);
    
    if (!missingPerson) {
      return res.status(404).json({
        success: false,
        message: 'Missing person not found'
      });
    }
    
    if (missingPerson.verification_status !== 'unverified') {
      return res.status(400).json({
        success: false,
        message: `This report has already been ${missingPerson.verification_status}`
      });
    }
    
    if (action === 'approve') {
      missingPerson.verification_status = 'verified';
      missingPerson.verified_by = {
        user_id: req.user._id,
        username: req.user.username || req.user.full_name,
        role: req.user.role,
        verified_at: new Date()
      };
      
      missingPerson.updates.push({
        message: 'Report verified and published',
        added_by: req.user.username || req.user.full_name,
        update_type: 'status_change'
      });
      
      console.log(`✅ Missing person ${missingPerson.case_number} VERIFIED by ${req.user.username}`);
    } else {
      missingPerson.verification_status = 'rejected';
      missingPerson.rejection_reason = rejection_reason || 'No reason provided';
      missingPerson.public_visibility = false; // Hide rejected reports
      
      console.log(`❌ Missing person ${missingPerson.case_number} REJECTED by ${req.user.username}`);
    }
    
    missingPerson.last_modified_by = req.user._id;
    await missingPerson.save();
    
    res.json({
      success: true,
      message: `Report ${action}d successfully`,
      data: missingPerson
    });
  } catch (error) {
    console.error('Error verifying missing person:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying report',
      error: error.message
    });
  }
});

// GET /api/missing-persons/pending/list - Get unverified and spam-flagged reports (Admin/Responder only)
router.get('/pending/list', authenticateToken, async (req, res) => {
  try {
    const pendingReports = await MissingPerson.find({ 
      $or: [
        { verification_status: 'unverified' },
        { auto_hidden: true }
      ]
    })
      .sort({ created_at: -1 })
      .limit(50);
    
    res.json({
      success: true,
      data: pendingReports,
      count: pendingReports.length
    });
  } catch (error) {
    console.error('Error fetching pending reports:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending reports',
      error: error.message
    });
  }
});

// POST /api/missing-persons/:id/spam - Report spam (Community Policing)
router.post('/:id/spam', async (req, res) => {
  try {
    const { reason, reported_by } = req.body;
    
    const missingPerson = await MissingPerson.findById(req.params.id);
    
    if (!missingPerson) {
      return res.status(404).json({
        success: false,
        message: 'Missing person not found'
      });
    }
    
    // Check if already reported by this user/IP
    const alreadyReported = missingPerson.spam_reports.some(
      report => report.reported_by === reported_by
    );
    
    if (alreadyReported) {
      return res.status(400).json({
        success: false,
        message: 'You have already reported this as spam'
      });
    }
    
    // Add spam report
    missingPerson.spam_reports.push({
      reported_by,
      reason: reason || 'Spam or fake report',
      timestamp: new Date()
    });
    
    // Auto-hide if 3 or more spam reports
    if (missingPerson.spam_reports.length >= 3 && !missingPerson.auto_hidden) {
      missingPerson.auto_hidden = true;
      console.log(`⚠️ Auto-hiding report ${missingPerson.case_number} due to ${missingPerson.spam_reports.length} spam reports`);
    }
    
    await missingPerson.save();
    
    res.json({
      success: true,
      message: 'Spam report submitted successfully',
      spam_count: missingPerson.spam_reports.length,
      auto_hidden: missingPerson.auto_hidden
    });
  } catch (error) {
    console.error('Error reporting spam:', error);
    res.status(500).json({
      success: false,
      message: 'Error reporting spam',
      error: error.message
    });
  }
});

// POST /api/missing-persons/:id/approve - Approve missing person report (Admin only)
router.post('/:id/approve', authenticateToken, async (req, res) => {
  try {
    const { verifyAdminSession, requireAdminRole, logAdminAction } = require('../middleware/security');
    
    // Verify admin role
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin role required to approve reports'
      });
    }

    const missingPerson = await MissingPerson.findById(req.params.id);
    
    if (!missingPerson) {
      return res.status(404).json({
        success: false,
        message: 'Missing person not found'
      });
    }

    if (missingPerson.verification_status === 'verified') {
      return res.status(400).json({
        success: false,
        message: 'Report already verified'
      });
    }

    // Approve the report
    missingPerson.verification_status = 'verified';
    missingPerson.public_visibility = true;
    missingPerson.requires_admin_approval = false;
    missingPerson.verified_by = {
      user_id: req.user.individualId,
      username: req.user.name,
      role: req.user.role,
      verified_at: new Date(),
      verification_notes: req.body.notes || ''
    };
    missingPerson.approval_history.push({
      action: 'approved',
      performed_by: {
        user_id: req.user.individualId,
        username: req.user.name,
        role: req.user.role
      },
      reason: req.body.notes || 'Verified by admin',
      timestamp: new Date()
    });

    await missingPerson.save();
    
    // Log admin action
    await logAdminAction(req, 'approve_missing_person', missingPerson._id, {
      case_number: missingPerson.case_number,
      person_name: missingPerson.full_name
    });

    console.log(`✅ Missing person approved: ${missingPerson.case_number} by ${req.user.individualId}`);

    res.json({
      success: true,
      message: 'Missing person report approved successfully',
      data: missingPerson
    });
  } catch (error) {
    console.error('Error approving missing person:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving report',
      error: error.message
    });
  }
});

// POST /api/missing-persons/:id/reject - Reject missing person report (Admin only)
router.post('/:id/reject', authenticateToken, async (req, res) => {
  try {
    const { logAdminAction } = require('../middleware/security');
    
    // Verify admin role
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin role required to reject reports'
      });
    }

    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const missingPerson = await MissingPerson.findById(req.params.id);
    
    if (!missingPerson) {
      return res.status(404).json({
        success: false,
        message: 'Missing person not found'
      });
    }

    // Reject the report
    missingPerson.verification_status = 'rejected';
    missingPerson.public_visibility = false;
    missingPerson.rejection_reason = reason;
    missingPerson.approval_history.push({
      action: 'rejected',
      performed_by: {
        user_id: req.user.individualId,
        username: req.user.name,
        role: req.user.role
      },
      reason: reason,
      timestamp: new Date()
    });

    await missingPerson.save();
    
    // Log admin action
    await logAdminAction(req, 'reject_missing_person', missingPerson._id, {
      case_number: missingPerson.case_number,
      person_name: missingPerson.full_name,
      reason: reason
    });

    console.log(`❌ Missing person rejected: ${missingPerson.case_number} by ${req.user.individualId}`);

    res.json({
      success: true,
      message: 'Missing person report rejected',
      data: missingPerson
    });
  } catch (error) {
    console.error('Error rejecting missing person:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting report',
      error: error.message
    });
  }
});

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

module.exports = router;
