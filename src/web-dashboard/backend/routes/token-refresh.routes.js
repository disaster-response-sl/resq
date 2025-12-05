/**
 * Token Refresh API Routes
 * 
 * Provides secure endpoints for frontend to obtain fresh access tokens.
 * Consumer keys/secrets never leave the backend.
 */

const express = require('express');
const router = express.Router();
const tokenRefreshService = require('../services/tokenRefreshService');

/**
 * GET /api/auth/floodsupport-token
 * 
 * Get a valid FloodSupport API access token.
 * Frontend calls this endpoint to get a fresh token automatically.
 * 
 * Security: Consumer key/secret stay on backend, only access token is returned.
 */
router.get('/floodsupport-token', async (req, res) => {
  try {
    const accessToken = await tokenRefreshService.getAccessToken();

    res.json({
      success: true,
      accessToken,
      message: 'Access token retrieved successfully',
    });
  } catch (error) {
    console.error('Error getting FloodSupport token:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to obtain access token',
      message: error.message,
    });
  }
});

/**
 * POST /api/auth/floodsupport-token/refresh
 * 
 * Force refresh the access token (useful for testing or manual refresh).
 */
router.post('/floodsupport-token/refresh', async (req, res) => {
  try {
    // Clear cache and get fresh token
    tokenRefreshService.clearCache();
    const accessToken = await tokenRefreshService.getAccessToken();

    res.json({
      success: true,
      accessToken,
      message: 'Access token refreshed successfully',
    });
  } catch (error) {
    console.error('Error refreshing FloodSupport token:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to refresh access token',
      message: error.message,
    });
  }
});

/**
 * GET /api/auth/floodsupport-token/status
 * 
 * Get token status for debugging (does not expose the token itself).
 */
router.get('/floodsupport-token/status', (req, res) => {
  const status = tokenRefreshService.getTokenStatus();
  
  res.json({
    success: true,
    ...status,
  });
});

module.exports = router;
