const express = require('express');
const router = express.Router();
const RoadReport = require('../models/RoadReport');
const RouteStatus = require('../models/RouteStatus');

// ========================================
// ROAD REPORTS ENDPOINTS
// ========================================

/**
 * @route   POST /api/public/road-reports
 * @desc    Submit a new road condition report
 * @access  Public
 */
router.post('/road-reports', async (req, res) => {
  try {
    const {
      reporter_name,
      reporter_phone,
      reporter_email,
      latitude,
      longitude,
      location_name,
      district,
      city,
      road_name,
      condition,
      severity,
      description,
      affected_lanes,
      traffic_status,
      estimated_clearance_time,
      alternative_route,
      emergency_vehicles_accessible,
      casualties_reported,
      casualties_count
    } = req.body;

    // Validation
    if (!reporter_name || !reporter_phone || !latitude || !longitude || 
        !location_name || !district || !road_name || !condition || !severity || !description) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Create new road report
    const roadReport = new RoadReport({
      reporter_name,
      reporter_phone,
      reporter_email,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      },
      location_name,
      district,
      city,
      road_name,
      condition,
      severity,
      description,
      affected_lanes,
      traffic_status,
      estimated_clearance_time,
      alternative_route,
      emergency_vehicles_accessible: emergency_vehicles_accessible || false,
      casualties_reported: casualties_reported || false,
      casualties_count: casualties_count || 0,
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
      priority: severity === 'critical' ? 'urgent' : severity === 'high' ? 'high' : 'medium'
    });

    await roadReport.save();

    console.log(`🚧 New road report submitted: ${road_name} in ${district} - ${condition} (${severity})`);

    // Auto-verify high severity reports
    if (severity === 'critical' || severity === 'high') {
      roadReport.status = 'verified';
      roadReport.verified_at = new Date();
      await roadReport.save();
    }

    res.status(201).json({
      success: true,
      message: 'Road report submitted successfully',
      data: roadReport,
      report_id: roadReport._id
    });

  } catch (error) {
    console.error('Error creating road report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit road report',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/public/road-reports
 * @desc    Get all road reports with filters
 * @access  Public
 */
router.get('/road-reports', async (req, res) => {
  try {
    const { 
      district, 
      condition, 
      severity, 
      status = 'pending,verified,in_progress',
      limit = 100,
      latitude,
      longitude,
      radius = 10000 // 10km default
    } = req.query;

    let query = {};

    // Build query filters
    if (district) {
      query.district = district;
    }
    if (condition) {
      query.condition = condition;
    }
    if (severity) {
      query.severity = severity;
    }
    if (status) {
      query.status = { $in: status.split(',') };
    }

    let roadReports;

    // If location provided, search nearby
    if (latitude && longitude) {
      roadReports = await RoadReport.getNearby(
        parseFloat(longitude),
        parseFloat(latitude),
        parseInt(radius)
      );
    } else {
      roadReports = await RoadReport.find(query)
        .sort({ severity: -1, createdAt: -1 })
        .limit(parseInt(limit));
    }

    // Calculate statistics
    const stats = {
      total: roadReports.length,
      by_severity: {
        critical: roadReports.filter(r => r.severity === 'critical').length,
        high: roadReports.filter(r => r.severity === 'high').length,
        medium: roadReports.filter(r => r.severity === 'medium').length,
        low: roadReports.filter(r => r.severity === 'low').length
      },
      by_condition: {
        blocked: roadReports.filter(r => r.condition === 'blocked').length,
        flooded: roadReports.filter(r => r.condition === 'flooded').length,
        damaged: roadReports.filter(r => r.condition === 'damaged').length,
        landslide: roadReports.filter(r => r.condition === 'landslide').length,
        hazardous: roadReports.filter(r => r.condition === 'hazardous').length
      }
    };

    console.log(`📊 Retrieved ${roadReports.length} road reports`);

    res.json({
      success: true,
      count: roadReports.length,
      data: roadReports,
      stats
    });

  } catch (error) {
    console.error('Error fetching road reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch road reports',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/public/road-reports/:id
 * @desc    Get single road report by ID
 * @access  Public
 */
router.get('/road-reports/:id', async (req, res) => {
  try {
    const roadReport = await RoadReport.findById(req.params.id);

    if (!roadReport) {
      return res.status(404).json({
        success: false,
        message: 'Road report not found'
      });
    }

    // Increment views
    roadReport.views += 1;
    await roadReport.save();

    res.json({
      success: true,
      data: roadReport
    });

  } catch (error) {
    console.error('Error fetching road report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch road report',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/public/road-reports/district/:district
 * @desc    Get road reports by district
 * @access  Public
 */
router.get('/road-reports/district/:district', async (req, res) => {
  try {
    const roadReports = await RoadReport.getByDistrict(req.params.district);

    res.json({
      success: true,
      count: roadReports.length,
      district: req.params.district,
      data: roadReports
    });

  } catch (error) {
    console.error('Error fetching district road reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch district road reports',
      error: error.message
    });
  }
});

// ========================================
// ROUTE STATUS ENDPOINTS
// ========================================

/**
 * @route   GET /api/public/route-status
 * @desc    Get status of all major routes
 * @access  Public
 */
router.get('/route-status', async (req, res) => {
  try {
    const { 
      district, 
      status, 
      route_type,
      severity,
      limit = 50 
    } = req.query;

    let query = { is_active: true };

    if (district) {
      query.districts = district;
    }
    if (status) {
      query.status = status;
    }
    if (route_type) {
      query.route_type = route_type;
    }
    if (severity) {
      query.severity = severity;
    }

    const routes = await RouteStatus.find(query)
      .populate('active_incidents')
      .sort({ severity: -1, status: -1 })
      .limit(parseInt(limit));

    // Calculate statistics
    const stats = {
      total: routes.length,
      open: routes.filter(r => r.status === 'open').length,
      blocked: routes.filter(r => r.status === 'blocked').length,
      partially_blocked: routes.filter(r => r.status === 'partially_blocked').length,
      hazardous: routes.filter(r => r.status === 'hazardous').length,
      closed: routes.filter(r => r.status === 'closed').length
    };

    console.log(`🛣️ Retrieved ${routes.length} route statuses`);

    res.json({
      success: true,
      count: routes.length,
      data: routes,
      stats
    });

  } catch (error) {
    console.error('Error fetching route status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch route status',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/public/route-status/:route_id
 * @desc    Get specific route status
 * @access  Public
 */
router.get('/route-status/:route_id', async (req, res) => {
  try {
    const route = await RouteStatus.findOne({ route_id: req.params.route_id })
      .populate('active_incidents');

    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }

    // Increment views
    route.views_count += 1;
    await route.save();

    res.json({
      success: true,
      data: route
    });

  } catch (error) {
    console.error('Error fetching route status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch route status',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/public/route-status/critical
 * @desc    Get all critical routes
 * @access  Public
 */
router.get('/route-status/alerts/critical', async (req, res) => {
  try {
    const criticalRoutes = await RouteStatus.getCritical()
      .populate('active_incidents');

    res.json({
      success: true,
      count: criticalRoutes.length,
      data: criticalRoutes
    });

  } catch (error) {
    console.error('Error fetching critical routes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch critical routes',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/public/safe-routes
 * @desc    Get safe route recommendations between two points
 * @access  Public
 */
router.get('/safe-routes', async (req, res) => {
  try {
    const { from_district, to_district, avoid_conditions } = req.query;

    if (!from_district || !to_district) {
      return res.status(400).json({
        success: false,
        message: 'from_district and to_district are required'
      });
    }

    // Find routes connecting these districts
    const routes = await RouteStatus.find({
      is_active: true,
      $or: [
        { districts: { $all: [from_district, to_district] } },
        { 'start_location.name': { $regex: from_district, $options: 'i' } },
        { 'end_location.name': { $regex: to_district, $options: 'i' } }
      ]
    }).populate('active_incidents');

    // Filter safe routes
    let safeRoutes = routes.filter(route => {
      // Exclude blocked or closed routes
      if (['blocked', 'closed'].includes(route.status)) {
        return false;
      }
      
      // Exclude critical severity
      if (route.severity === 'critical') {
        return false;
      }

      // Check avoid conditions
      if (avoid_conditions) {
        const avoidList = avoid_conditions.split(',');
        const hasAvoidCondition = route.active_incidents.some(incident => 
          avoidList.includes(incident.condition)
        );
        if (hasAvoidCondition) {
          return false;
        }
      }

      return true;
    });

    // Sort by safety score (lower risk first, then shorter distance)
    safeRoutes.sort((a, b) => {
      const riskScore = { low: 1, medium: 2, high: 3, extreme: 4 };
      const scoreA = riskScore[a.risk_level] || 0;
      const scoreB = riskScore[b.risk_level] || 0;
      
      if (scoreA !== scoreB) return scoreA - scoreB;
      return a.distance_km - b.distance_km;
    });

    res.json({
      success: true,
      count: safeRoutes.length,
      from: from_district,
      to: to_district,
      data: safeRoutes,
      message: safeRoutes.length === 0 ? 'No safe routes found. Exercise extreme caution.' : undefined
    });

  } catch (error) {
    console.error('Error finding safe routes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to find safe routes',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/public/route-stats
 * @desc    Get overall route statistics
 * @access  Public
 */
router.get('/route-stats', async (req, res) => {
  try {
    const [totalReports, activeReports, totalRoutes, affectedRoutes] = await Promise.all([
      RoadReport.countDocuments(),
      RoadReport.countDocuments({ status: { $in: ['pending', 'verified', 'in_progress'] } }),
      RouteStatus.countDocuments({ is_active: true }),
      RouteStatus.countDocuments({ is_active: true, status: { $ne: 'open' } })
    ]);

    // Get reports by severity
    const reportsBySeverity = await RoadReport.aggregate([
      { $match: { status: { $in: ['pending', 'verified', 'in_progress'] } } },
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]);

    // Get reports by condition
    const reportsByCondition = await RoadReport.aggregate([
      { $match: { status: { $in: ['pending', 'verified', 'in_progress'] } } },
      { $group: { _id: '$condition', count: { $sum: 1 } } }
    ]);

    // Get affected districts
    const affectedDistricts = await RoadReport.distinct('district', {
      status: { $in: ['pending', 'verified', 'in_progress'] }
    });

    const stats = {
      total_reports: totalReports,
      active_reports: activeReports,
      resolved_reports: totalReports - activeReports,
      total_routes_monitored: totalRoutes,
      affected_routes: affectedRoutes,
      safe_routes: totalRoutes - affectedRoutes,
      affected_districts: affectedDistricts.length,
      districts_list: affectedDistricts,
      by_severity: reportsBySeverity.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      by_condition: reportsByCondition.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching route stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch route statistics',
      error: error.message
    });
  }
});

module.exports = router;
