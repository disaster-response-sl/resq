/**
 * FloodSupport API Token Refresh Service
 * 
 * Handles automatic OAuth2 token refresh using client credentials flow.
 * Tokens are cached in memory and refreshed before expiry.
 * 
 * Security: Consumer key/secret are read from environment variables ONLY.
 * They are NEVER exposed to the frontend or logged.
 */

const axios = require('axios');

class TokenRefreshService {
  constructor() {
    this.tokenCache = {
      accessToken: null,
      expiresAt: null,
    };
    
    // OAuth2 Configuration from environment
    this.tokenUrl = process.env.FLOODSUPPORT_OAUTH_TOKEN_URL;
    this.consumerKey = process.env.FLOODSUPPORT_CONSUMER_KEY;
    this.consumerSecret = process.env.FLOODSUPPORT_CONSUMER_SECRET;
    
    // Validate configuration on startup
    if (!this.tokenUrl || !this.consumerKey || !this.consumerSecret) {
      console.error('⚠️ FloodSupport OAuth2 credentials not configured. Set FLOODSUPPORT_CONSUMER_KEY and FLOODSUPPORT_CONSUMER_SECRET in .env');
    }
  }

  /**
   * Get a valid access token (from cache or refresh if expired)
   */
  async getAccessToken() {
    // Check if we have a valid cached token
    if (this.tokenCache.accessToken && this.tokenCache.expiresAt) {
      const now = Date.now();
      const bufferTime = 5 * 60 * 1000; // Refresh 5 minutes before expiry
      
      if (now < (this.tokenCache.expiresAt - bufferTime)) {
        console.log('✅ Using cached FloodSupport access token');
        return this.tokenCache.accessToken;
      }
    }

    // Token expired or not cached - refresh it
    console.log('🔄 Refreshing FloodSupport access token...');
    return await this.refreshToken();
  }

  /**
   * Refresh the access token using OAuth2 client credentials flow
   */
  async refreshToken() {
    try {
      if (!this.consumerKey || !this.consumerSecret) {
        throw new Error('OAuth2 credentials not configured');
      }

      // Create Basic Auth header: Base64(consumer_key:consumer_secret)
      const credentials = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');

      const response = await axios.post(
        this.tokenUrl,
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const { access_token, expires_in } = response.data;

      if (!access_token) {
        throw new Error('No access token received from OAuth2 server');
      }

      // Cache the token with expiry time
      this.tokenCache.accessToken = access_token;
      this.tokenCache.expiresAt = Date.now() + (expires_in * 1000);

      console.log(`✅ FloodSupport access token refreshed successfully (expires in ${expires_in}s)`);
      return access_token;

    } catch (error) {
      console.error('❌ Failed to refresh FloodSupport access token:', error.message);
      
      // Clear cache on error
      this.tokenCache.accessToken = null;
      this.tokenCache.expiresAt = null;
      
      throw new Error('Failed to refresh access token: ' + error.message);
    }
  }

  /**
   * Clear the token cache (useful for testing or manual refresh)
   */
  clearCache() {
    this.tokenCache.accessToken = null;
    this.tokenCache.expiresAt = null;
    console.log('🗑️ FloodSupport token cache cleared');
  }

  /**
   * Get token status for debugging
   */
  getTokenStatus() {
    if (!this.tokenCache.accessToken) {
      return { status: 'no_token', message: 'No token cached' };
    }

    const now = Date.now();
    const expiresIn = Math.floor((this.tokenCache.expiresAt - now) / 1000);

    if (expiresIn <= 0) {
      return { status: 'expired', message: 'Token expired', expiresIn: 0 };
    }

    return {
      status: 'valid',
      message: 'Token is valid',
      expiresIn,
      expiresAt: new Date(this.tokenCache.expiresAt).toISOString(),
    };
  }
}

// Export singleton instance
module.exports = new TokenRefreshService();
