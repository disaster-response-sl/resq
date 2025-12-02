// middleware/auth.js
const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  // Get token from Authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  // Verify token
  const jwtSecret = process.env.JWT_SECRET;
  
  if (!jwtSecret) {
    console.error('❌ JWT_SECRET not configured in environment variables');
    return res.status(500).json({
      success: false,
      message: 'Server configuration error: JWT_SECRET not set'
    });
  }
  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    
    // Add user info to request object
    req.user = user;
    next();
  });
};

// Middleware to check user roles
const authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Optional: Middleware for admin-only routes
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

// Optional: Middleware for responder access (admin + responder)
const requireResponder = (req, res, next) => {
  if (!req.user || !['admin', 'responder'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Responder access required'
    });
  }
  next();
};

module.exports = {
  authenticateToken,
  authorizeRole,
  requireAdmin,
  requireResponder
};
