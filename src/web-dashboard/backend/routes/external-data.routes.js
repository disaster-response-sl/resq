const express = require('express');
const router = express.Router();
const externalDataService = require('../services/external-data.service');

// GET /api/external/floodsupport-sos - Get FloodSupport.org SOS requests
router.get('/floodsupport-sos', async (req, res) => {
  try {
    const result = await externalDataService.getFloodSupportSOS();
    
    res.json(result);
  } catch (error) {
    console.error('Error in FloodSupport.org SOS endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching FloodSupport.org data',
      error: error.message
    });
  }
});

// GET /api/external/relief-data - Get relief camp and contribution data
router.get('/relief-data', async (req, res) => {
  try {
    const options = {
      type: req.query.type || 'all',
      status: req.query.status || 'all',
      urgency: req.query.urgency || 'all',
      establishment: req.query.establishment || 'all',
      lat: req.query.lat ? parseFloat(req.query.lat) : undefined,
      lng: req.query.lng ? parseFloat(req.query.lng) : undefined,
      radius_km: req.query.radius_km ? parseInt(req.query.radius_km) : 50,
      search: req.query.search,
      sort: req.query.sort || 'newest',
      limit: req.query.limit ? parseInt(req.query.limit) : 100
    };
    
    const result = await externalDataService.getReliefData(options);
    
    res.json(result);
  } catch (error) {
    console.error('Error in relief data endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching relief data',
      error: error.message
    });
  }
});

// GET /api/external/emergency-requests - Get emergency help requests
router.get('/emergency-requests', async (req, res) => {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat) : 6.9271; // Default: Colombo
    const lng = req.query.lng ? parseFloat(req.query.lng) : 79.8612;
    const radius_km = req.query.radius_km ? parseInt(req.query.radius_km) : 30;
    
    const result = await externalDataService.getEmergencyRequests(lat, lng, radius_km);
    
    res.json(result);
  } catch (error) {
    console.error('Error in emergency requests endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching emergency requests',
      error: error.message
    });
  }
});

// GET /api/external/nearby-contributions - Get nearby volunteer contributions
router.get('/nearby-contributions', async (req, res) => {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat) : 6.9271;
    const lng = req.query.lng ? parseFloat(req.query.lng) : 79.8612;
    const radius_km = req.query.radius_km ? parseInt(req.query.radius_km) : 20;
    
    const result = await externalDataService.getNearbyContributions(lat, lng, radius_km);
    
    res.json(result);
  } catch (error) {
    console.error('Error in nearby contributions endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching nearby contributions',
      error: error.message
    });
  }
});

// GET /api/external/relief-camps/:type - Search relief camps by establishment type
router.get('/relief-camps/:type', async (req, res) => {
  try {
    const type = req.params.type; // School, Temple, Kitchen, etc.
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;
    
    const result = await externalDataService.searchReliefCamps(type, limit);
    
    res.json(result);
  } catch (error) {
    console.error('Error in relief camps endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching relief camps',
      error: error.message
    });
  }
});

// GET /api/external/combined-sos - Get combined SOS (local + external)
router.get('/combined-sos', async (req, res) => {
  try {
    // This endpoint would typically fetch local SOS from database
    // For now, we'll just return external data
    // In production, merge with SosSignal.find()
    
    const result = await externalDataService.getCombinedEmergencyData([]);
    
    res.json(result);
  } catch (error) {
    console.error('Error in combined SOS endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching combined SOS data',
      error: error.message
    });
  }
});

// GET /api/external/cache-status - Get cache status
router.get('/cache-status', async (req, res) => {
  try {
    const status = externalDataService.getCacheStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error in cache status endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cache status',
      error: error.message
    });
  }
});

// POST /api/external/clear-cache - Clear cache (admin only)
router.post('/clear-cache', async (req, res) => {
  try {
    externalDataService.clearCache();
    
    res.json({
      success: true,
      message: 'External data cache cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing cache',
      error: error.message
    });
  }
});

module.exports = router;
