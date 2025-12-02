// middleware/security.js - Enhanced security middleware
const AdminSession = require('../models/AdminSession');
const MissingPerson = require('../models/MissingPerson');
const rateLimit = require('express-rate-limit');

// Track admin actions for audit trail
const logAdminAction = async (req, action, targetResource, details = {}) => {
  try {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'responder')) {
      const session = await AdminSession.findOne({
        user_id: req.user.individualId,
        is_active: true
      }).sort({ login_time: -1 });

      if (session) {
        session.activity_log.push({
          action,
          target_resource: targetResource,
          details
        });
        await session.save();
      }
    }
  } catch (error) {
    console.error('Error logging admin action:', error);
  }
};

// Verify admin session is valid and not suspicious
const verifyAdminSession = async (req, res, next) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'responder')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin or responder role required.'
      });
    }

    // Find active session
    const session = await AdminSession.findOne({
      user_id: req.user.individualId,
      is_active: true
    }).sort({ login_time: -1 });

    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session. Please login again.',
        code: 'SESSION_EXPIRED'
      });
    }

    // Check for suspicious activity
    if (session.suspicious_activity) {
      return res.status(403).json({
        success: false,
        message: 'Account flagged for suspicious activity. Contact administrator.',
        code: 'SUSPICIOUS_ACTIVITY'
      });
    }

    // Check IP consistency (optional - can be disabled for mobile admins)
    const currentIp = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    if (session.ip_address && session.ip_address !== currentIp) {
      // Log IP change but don't block (could be legitimate)
      console.warn(`⚠️ IP change detected for ${req.user.individualId}: ${session.ip_address} -> ${currentIp}`);
      session.activity_log.push({
        action: 'ip_change',
        target_resource: 'session',
        details: { old_ip: session.ip_address, new_ip: currentIp }
      });
      await session.save();
    }

    req.session = session;
    next();
  } catch (error) {
    console.error('Session verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Session verification failed'
    });
  }
};

// Rate limiting for missing person submissions
const missingPersonSubmissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes (reduced from 1 hour)
  max: 10, // Max 10 submissions per 15 min (increased from 5/hour)
  message: {
    success: false,
    message: 'Too many submissions. Please try again in a few minutes.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: 15 // minutes
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for verified admins
    return req.user && req.user.role === 'admin';
  },
  // More lenient handler that provides clear feedback
  handler: (req, res) => {
    console.warn(`⚠️ Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many missing person submissions. To prevent spam, please wait 15 minutes before submitting again.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: 15,
      tip: 'If you need to submit multiple reports, please contact an admin for assistance.'
    });
  }
});

// Rate limiting for verification actions (prevent spam verification)
const verificationActionLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // Max 20 verification actions per 5 min
  message: {
    success: false,
    message: 'Too many verification actions. Please slow down.',
    code: 'VERIFICATION_RATE_LIMIT'
  },
  keyGenerator: (req) => {
    return req.user?.individualId || req.ip;
  }
});

// Check for duplicate submissions (similar name + location + timeframe)
const checkDuplicateSubmission = async (req, res, next) => {
  try {
    const { full_name, last_seen_location } = req.body;
    
    if (!full_name || !last_seen_location) {
      return next();
    }

    // Check for similar submissions in last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const duplicates = await MissingPerson.find({
      full_name: new RegExp(full_name, 'i'),
      'last_seen_location.lat': {
        $gte: last_seen_location.lat - 0.01,
        $lte: last_seen_location.lat + 0.01
      },
      'last_seen_location.lng': {
        $gte: last_seen_location.lng - 0.01,
        $lte: last_seen_location.lng + 0.01
      },
      created_at: { $gte: yesterday }
    });

    if (duplicates.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'A similar missing person report was recently submitted. Please check existing reports.',
        code: 'POSSIBLE_DUPLICATE',
        existing_reports: duplicates.map(d => ({
          id: d._id,
          name: d.full_name,
          case_number: d.case_number,
          status: d.verification_status
        }))
      });
    }

    req.body.submission_metadata = {
      duplicate_check_passed: true,
      submission_time: new Date()
    };

    next();
  } catch (error) {
    console.error('Duplicate check error:', error);
    next(); // Continue even if check fails
  }
};

// Require admin approval for high-risk actions
const requireAdminRole = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin role required for this action',
      code: 'ADMIN_ONLY'
    });
  }
  next();
};

module.exports = {
  logAdminAction,
  verifyAdminSession,
  missingPersonSubmissionLimiter,
  verificationActionLimiter,
  checkDuplicateSubmission,
  requireAdminRole
};
