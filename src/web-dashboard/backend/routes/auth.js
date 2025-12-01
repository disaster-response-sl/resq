// routes/auth.js
const express = require('express');
// TODO: When real eSignet (SLUDI) endpoints are available, replace MockSLUDIService with actual integration
const MockSLUDIService = require('../services/mock-sludi-service');
// Example: const RealSLUDIService = require('../services/real-sludi-service');

// Config flag to switch between mock and real SLUDI/eSignet integration
const USE_MOCK_SLUDI = process.env.USE_MOCK_SLUDI === 'true';
const jwt = require('jsonwebtoken');
const { authenticateToken, requireAdmin, requireResponder } = require('../middleware/auth');

const router = express.Router();
// Use mock or real SLUDI/eSignet service based on config
const sludiService = USE_MOCK_SLUDI
  ? new MockSLUDIService()
  : null; // TODO: Replace null with new RealSLUDIService() when available

// Login endpoint (no auth required)
// TODO: Update this endpoint to use real eSignet API when available
router.post('/login', async (req, res) => {
  try {
    console.log('🔐 Login attempt started for:', req.body.individualId);
    const { individualId, otp } = req.body;
    
    // Check critical environment variables
    if (!process.env.JWT_SECRET) {
      console.error('❌ CRITICAL: JWT_SECRET not set in environment variables!');
      return res.status(500).json({
        success: false,
        message: "Server configuration error. Please contact administrator.",
        error: "JWT_SECRET_MISSING"
      });
    }
    
    console.log('Using mock SLUDI:', USE_MOCK_SLUDI);
    console.log('SLUDI service initialized:', !!sludiService);
    
    if (!sludiService) {
      console.error('❌ CRITICAL: SLUDI service not initialized!');
      return res.status(500).json({
        success: false,
        message: "Authentication service unavailable. Please contact administrator.",
        error: "SLUDI_SERVICE_NOT_INITIALIZED"
      });
    }
    
    const authRequest = {
      id: "mosip.identity.auth",
      version: "1.0",
      individualId: individualId,
      individualIdType: "UIN", 
      transactionID: `TXN_${Date.now()}`,
      requestTime: new Date().toISOString(),
      request: {
        otp: otp,
        timestamp: new Date().toISOString()
      },
      consentObtained: true
    };

    console.log('Calling sludiService.authenticate...');
    const authResponse = await sludiService.authenticate(authRequest);
    console.log('✅ Auth response received:', authResponse.response.authStatus);
    
    if (authResponse.response.authStatus) {
      // Get user data from database for JWT payload
      const User = require('../models/User');
      const userData = await User.findOne({ individualId });
      
      if (!userData) {
        return res.status(404).json({
          success: false,
          message: "User not found in database",
          error: "USER_NOT_FOUND"
        });
      }
      
      // Check if user has permission to access web dashboard (only responders and admins)
      if (userData.role !== 'responder' && userData.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: "Access denied. Only responders and administrators can access the web dashboard.",
          error: "INSUFFICIENT_PERMISSIONS"
        });
      }
      
      // Generate JWT token with user info
      const appToken = jwt.sign(
        { 
          individualId: individualId,
          role: userData.role,
          name: userData.name,
          sludiToken: authResponse.response.authToken
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );
      
      res.json({
        success: true,
        token: appToken,
        user: {
          individualId: userData.individualId,
          name: userData.name,
          role: userData.role
        },
        message: "Authentication successful"
      });
    } else {
      res.status(401).json({
        success: false,
        message: "Authentication failed",
        errors: authResponse.errors
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
});

// Get user profile (requires authentication)
// TODO: Update this endpoint to use real eSignet KYC API when available
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const { individualId } = req.user;
    
    const kycRequest = {
      id: "mosip.identity.kyc",
      version: "1.0", 
      individualId: individualId,
      individualIdType: "UIN",
      transactionID: `TXN_${Date.now()}`,
      requestTime: new Date().toISOString(),
      allowedKycAttributes: ["name", "email", "phone", "role"],
      consentObtained: true
    };

    const kycResponse = await sludiService.performKYC(kycRequest);
    
    if (kycResponse.response.kycStatus) {
      res.json({
        success: true,
        user: kycResponse.response.identity
      });
    } else {
      res.status(400).json({
        success: false,
        message: "KYC failed"
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false, 
      message: "Internal server error"
    });
  }
});

// Admin-only route example
// Admin-only route example (no SLUDI integration needed)
router.get('/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  res.json({
    success: true,
    users: sludiService.mockUsers,
    message: "Admin access granted"
  });
});

// Responder route example  
// TODO: If responder dashboard needs SLUDI/eSignet data, update here when integrating real API
router.get('/responder/dashboard', authenticateToken, requireResponder, async (req, res) => {
  res.json({
    success: true,
    message: "Responder dashboard access granted",
    user: req.user
  });
});

// Logout endpoint
// TODO: In a real implementation, you might blacklist the token or revoke it via eSignet if supported
router.post('/logout', authenticateToken, async (req, res) => {
  res.json({
    success: true,
    message: "Logged out successfully"
  });
});

module.exports = router;
