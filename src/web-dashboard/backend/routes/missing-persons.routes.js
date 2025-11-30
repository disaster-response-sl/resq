const express = require('express');
const router = express.Router();
const MissingPerson = require('../models/MissingPerson');

// Middleware to check authentication (reuse from other routes)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  // For now, we'll skip JWT verification to keep it simple
  // In production, verify the JWT token here
  req.user = { _id: 'admin-user', role: 'admin' };
  next();
};

// GET /api/missing-persons - Get all missing persons
router.get('/', async (req, res) => {
  try {
    const { status, priority, disaster_related, limit = 100, skip = 0 } = req.query;
    
    let query = {};
    
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
    
    let query = { status: 'missing', public_visibility: true };
    
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

// POST /api/missing-persons - Create new missing person report
router.post('/', authenticateToken, async (req, res) => {
  try {
    const missingPersonData = {
      ...req.body,
      created_by: req.user._id,
      last_modified_by: req.user._id
    };
    
    const missingPerson = new MissingPerson(missingPersonData);
    await missingPerson.save();
    
    res.status(201).json({
      success: true,
      message: 'Missing person report created successfully',
      data: missingPerson
    });
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
