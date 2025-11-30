const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const Disaster = require('../models/Disaster');

// Get all reports with geographic data for map visualization
router.get('/reports', async (req, res) => {
  try {
    const { 
      status, 
      type, 
      priority, 
      startDate, 
      endDate,
      bounds, // { north, south, east, west }
      limit = 1000 
    } = req.query;

    let query = {};

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by report type
    if (type) {
      query.type = type;
    }

    // Filter by priority
    if (priority) {
      query.priority = priority;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Filter by geographic bounds
    if (bounds) {
      query['location.lat'] = { $gte: parseFloat(bounds.south), $lte: parseFloat(bounds.north) };
      query['location.lng'] = { $gte: parseFloat(bounds.west), $lte: parseFloat(bounds.east) };
    }

    const reports = await Report.find(query)
      .select('location type status priority description timestamp affected_people resource_requirements')
      .limit(parseInt(limit))
      .sort({ timestamp: -1 });

    res.json({
      success: true,
      data: reports,
      count: reports.length
    });

  } catch (error) {
    console.error('Error fetching reports for map:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reports for map visualization',
      error: error.message
    });
  }
});

// Get heatmap data aggregated by geographic areas
router.get('/heatmap', async (req, res) => {
  try {
    const { 
      type, 
      status, 
      priority,
      startDate, 
      endDate,
      gridSize = 0.01 // Default grid size for aggregation
    } = req.query;

    let matchQuery = {};
    const numericGridSize = parseFloat(gridSize);

    // Apply filters
    if (type) matchQuery.type = type;
    if (status) matchQuery.status = status;
    if (priority) matchQuery.priority = priority;
    if (startDate || endDate) {
      matchQuery.timestamp = {};
      if (startDate) matchQuery.timestamp.$gte = new Date(startDate);
      if (endDate) matchQuery.timestamp.$lte = new Date(endDate);
    }

    const heatmapData = await Report.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            lat: { $round: [{ $multiply: ['$location.lat', 1/numericGridSize] }, 0] },
            lng: { $round: [{ $multiply: ['$location.lng', 1/numericGridSize] }, 0] }
          },
          count: { $sum: 1 },
          totalAffected: { $sum: '$affected_people' },
          avgPriority: { $avg: { $cond: [
            { $eq: ['$priority', 'critical'] }, 4,
            { $cond: [{ $eq: ['$priority', 'high'] }, 3,
            { $cond: [{ $eq: ['$priority', 'medium'] }, 2, 1] }] }
          ]}},
          types: { $addToSet: '$type' },
          statuses: { $addToSet: '$status' },
          centerLat: { $avg: '$location.lat' },
          centerLng: { $avg: '$location.lng' }
        }
      },
      {
        $project: {
          _id: 0,
          lat: '$centerLat',
          lng: '$centerLng',
          count: 1,
          totalAffected: 1,
          avgPriority: 1,
          types: 1,
          statuses: 1,
          intensity: { $multiply: ['$count', '$avgPriority'] }
        }
      },
      { $sort: { intensity: -1 } }
    ]);

    res.json({
      success: true,
      data: heatmapData,
      gridSize: parseFloat(gridSize)
    });

  } catch (error) {
    console.error('Error generating heatmap data:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating heatmap data',
      error: error.message
    });
  }
});

// Get resource requirement analysis by geographic areas
router.get('/resource-analysis', async (req, res) => {
  try {
    const { 
      type, 
      status, 
      startDate, 
      endDate,
      bounds 
    } = req.query;

    let matchQuery = {};

    // Apply filters
    if (type) matchQuery.type = type;
    if (status) matchQuery.status = status;
    if (startDate || endDate) {
      matchQuery.timestamp = {};
      if (startDate) matchQuery.timestamp.$gte = new Date(startDate);
      if (endDate) matchQuery.timestamp.$lte = new Date(endDate);
    }

    // Filter by geographic bounds
    if (bounds) {
      matchQuery['location.lat'] = { $gte: parseFloat(bounds.south), $lte: parseFloat(bounds.north) };
      matchQuery['location.lng'] = { $gte: parseFloat(bounds.west), $lte: parseFloat(bounds.east) };
    }

    const resourceAnalysis = await Report.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            lat: { $round: ['$location.lat', 2] },
            lng: { $round: ['$location.lng', 2] }
          },
          totalReports: { $sum: 1 },
          totalAffected: { $sum: '$affected_people' },
          foodRequired: { $sum: '$resource_requirements.food' },
          waterRequired: { $sum: '$resource_requirements.water' },
          medicalSuppliesRequired: { $sum: '$resource_requirements.medical_supplies' },
          shelterRequired: { $sum: '$resource_requirements.shelter' },
          transportationRequired: { $sum: '$resource_requirements.transportation' },
          personnelRequired: { $sum: '$resource_requirements.personnel' },
          pendingReports: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          addressedReports: { $sum: { $cond: [{ $eq: ['$status', 'addressed'] }, 1, 0] } },
          criticalReports: { $sum: { $cond: [{ $eq: ['$priority', 'critical'] }, 1, 0] } },
          centerLat: { $avg: '$location.lat' },
          centerLng: { $avg: '$location.lng' }
        }
      },
      {
        $project: {
          _id: 0,
          lat: '$centerLat',
          lng: '$centerLng',
          totalReports: 1,
          totalAffected: 1,
          resources: {
            food: '$foodRequired',
            water: '$waterRequired',
            medicalSupplies: '$medicalSuppliesRequired',
            shelter: '$shelterRequired',
            transportation: '$transportationRequired',
            personnel: '$personnelRequired'
          },
          status: {
            pending: '$pendingReports',
            addressed: '$addressedReports'
          },
          criticalReports: 1,
          urgencyScore: { 
            $add: [
              { $multiply: ['$criticalReports', 10] },
              { $multiply: ['$pendingReports', 5] },
              '$totalAffected'
            ]
          }
        }
      },
      { $sort: { urgencyScore: -1 } }
    ]);

    res.json({
      success: true,
      data: resourceAnalysis,
      summary: {
        totalAreas: resourceAnalysis.length,
        totalReports: resourceAnalysis.reduce((sum, area) => sum + area.totalReports, 0),
        totalAffected: resourceAnalysis.reduce((sum, area) => sum + area.totalAffected, 0),
        totalCritical: resourceAnalysis.reduce((sum, area) => sum + area.criticalReports, 0)
      }
    });

  } catch (error) {
    console.error('Error generating resource analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating resource analysis',
      error: error.message
    });
  }
});

// Get statistics for dashboard filters
router.get('/statistics', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.timestamp = {};
      if (startDate) dateFilter.timestamp.$gte = new Date(startDate);
      if (endDate) dateFilter.timestamp.$lte = new Date(endDate);
    }

    const stats = await Report.aggregate([
      { $match: dateFilter },
      {
        $facet: {
          byType: [
            { $group: { _id: '$type', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ],
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ],
          byPriority: [
            { $group: { _id: '$priority', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ],
          totalReports: [{ $count: 'count' }],
          totalAffected: [{ $group: { _id: null, total: { $sum: '$affected_people' } } }],
          geographicSpread: [
            { $group: { _id: { lat: { $round: ['$location.lat', 1] }, lng: { $round: ['$location.lng', 1] } }, count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
          ]
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        byType: stats[0].byType,
        byStatus: stats[0].byStatus,
        byPriority: stats[0].byPriority,
        totalReports: stats[0].totalReports[0]?.count || 0,
        totalAffected: stats[0].totalAffected[0]?.total || 0,
        geographicSpread: stats[0].geographicSpread
      }
    });

  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

// Get disasters with geographic data
router.get('/disasters', async (req, res) => {
  try {
    console.log('🌊 MAP DISASTERS - Fetching real-time DMC flood data...');
    
    // Fetch real-time flood alerts from DMC API
    const floodResponse = await axios.get('https://lk-flood-api.vercel.app/alerts');
    const alerts = floodResponse.data || [];

    // Also fetch station data for coordinates
    const stationsResponse = await axios.get('https://lk-flood-api.vercel.app/stations');
    const stations = stationsResponse.data || [];

    // Create station lookup map
    const stationMap = {};
    stations.forEach(station => {
      stationMap[station.name] = station;
    });

    // Transform DMC flood data to disaster format for the map
    const disasters = alerts.map(alert => {
      const station = stationMap[alert.station_name] || {};
      const latLng = station.lat_lng || [6.9271, 79.8612];
      
      return {
        _id: `flood-${alert.station_name}`,
        location: {
          type: 'Point',
          coordinates: [latLng[1], latLng[0]] // [lng, lat] for GeoJSON
        },
        type: 'flood',
        severity: alert.alert_status === 'MAJOR' ? 'critical' : 
                 alert.alert_status === 'MINOR' ? 'high' : 'medium',
        description: `${alert.alert_status} flood alert at ${alert.station_name}. Water level: ${alert.water_level}m (${alert.rising_or_falling}). River: ${alert.river_name}`,
        timestamp: alert.timestamp,
        status: 'active',
        station_name: alert.station_name,
        river_name: alert.river_name,
        water_level: alert.water_level,
        alert_status: alert.alert_status
      };
    });

    console.log(`✅ MAP DISASTERS - Returning ${disasters.length} real-time flood alerts from DMC`);

    res.json({
      success: true,
      data: disasters,
      count: disasters.length,
      source: 'dmc_flood_api'
    });

  } catch (error) {
    console.error('❌ MAP DISASTERS ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching disasters',
      error: error.message
    });
  }
});

module.exports = router;

