const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const reportGenerator = require('../services/report-generator.service');
const { authenticateToken } = require('../middleware/auth');

/**
 * @route   GET /api/reports
 * @desc    Get all reports with filters
 * @access  Private
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      type,
      status,
      priority,
      start_date,
      end_date,
      limit = 50,
      skip = 0
    } = req.query;

    let query = {};

    // Apply filters
    if (type) query.type = type;
    if (status) query.status = status;
    if (priority) query.priority = priority;

    // Date range filter
    if (start_date || end_date) {
      query.timestamp = {};
      if (start_date) query.timestamp.$gte = new Date(start_date);
      if (end_date) query.timestamp.$lte = new Date(end_date);
    }

    const reports = await Report.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .populate('reported_by', 'name email')
      .populate('disaster_id', 'name type severity');

    const total = await Report.countDocuments(query);

    res.json({
      success: true,
      data: reports,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        has_more: total > parseInt(skip) + parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reports'
    });
  }
});

/**
 * @route   GET /api/reports/stats
 * @desc    Get report statistics
 * @access  Private
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let dateQuery = {};
    if (start_date || end_date) {
      dateQuery.timestamp = {};
      if (start_date) dateQuery.timestamp.$gte = new Date(start_date);
      if (end_date) dateQuery.timestamp.$lte = new Date(end_date);
    }

    const stats = await Report.aggregate([
      { $match: dateQuery },
      {
        $facet: {
          by_type: [
            { $group: { _id: '$type', count: { $sum: 1 } } }
          ],
          by_status: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ],
          by_priority: [
            { $group: { _id: '$priority', count: { $sum: 1 } } }
          ],
          total_affected: [
            { $group: { _id: null, total: { $sum: '$affected_people' } } }
          ],
          daily_trend: [
            {
              $group: {
                _id: {
                  $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } }
          ]
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        by_type: stats[0].by_type.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        by_status: stats[0].by_status.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        by_priority: stats[0].by_priority.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        total_affected_people: stats[0].total_affected[0]?.total || 0,
        daily_trend: stats[0].daily_trend
      }
    });
  } catch (error) {
    console.error('Error fetching report stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

/**
 * @route   POST /api/reports/generate
 * @desc    Generate advanced reports with PDF/Excel export
 * @access  Private
 */
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const {
      report_type,
      date_range,
      filters,
      include_charts = true,
      include_maps = false
    } = req.body;

    // Validate report type
    const validTypes = [
      'sos',
      'missing_persons',
      'disasters',
      'resources',
      'relief_ops',
      'financial',
      'comprehensive'
    ];

    if (!validTypes.includes(report_type)) {
      return res.status(400).json({
        success: false,
        error: `Invalid report type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    // Generate report
    const result = await reportGenerator.generateReport({
      report_type,
      date_range,
      filters,
      include_charts,
      include_maps
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      report_type,
      data: result.data,
      generated_at: new Date()
    });

  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate report'
    });
  }
});

/**
 * @route   POST /api/reports
 * @desc    Create a new report
 * @access  Private
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const reportData = {
      ...req.body,
      reported_by: req.user.userId
    };

    const report = new Report(reportData);
    await report.save();

    await report.populate('reported_by', 'name email');

    res.status(201).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create report'
    });
  }
});

/**
 * @route   GET /api/reports/:id
 * @desc    Get report by ID
 * @access  Private
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('reported_by', 'name email')
      .populate('disaster_id', 'name type severity');

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch report'
    });
  }
});

/**
 * @route   PUT /api/reports/:id
 * @desc    Update report
 * @access  Private
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updated_at: Date.now() },
      { new: true, runValidators: true }
    ).populate('reported_by', 'name email');

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update report'
    });
  }
});

/**
 * @route   DELETE /api/reports/:id
 * @desc    Delete report
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    res.json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete report'
    });
  }
});

module.exports = router;
