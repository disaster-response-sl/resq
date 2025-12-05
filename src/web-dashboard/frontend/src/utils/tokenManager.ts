/**
 * FloodSupport Token Manager
 * 
 * Automatically fetches and refreshes access tokens from backend.
 * Frontend never sees consumer key/secret - only gets short-lived access tokens.
 * 
 * Features:
 * - Automatic token refresh before expiry
 * - Token caching in memory
 * - Retry logic for 401 errors
 */

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

interface TokenCache {
  accessToken: string | null;
  expiresAt: number | null;
}

interface AuthRequestOptions extends AxiosRequestConfig {
  _retried?: boolean;
}

class TokenManager {
  private tokenCache: TokenCache;

  constructor() {
    this.tokenCache = {
      accessToken: null,
      expiresAt: null,
    };
  }

  /**
   * Get a valid access token (from cache or fetch from backend)
   */
  async getAccessToken() {
    // Check if we have a valid cached token
    if (this.tokenCache.accessToken && this.tokenCache.expiresAt) {
      const now = Date.now();
      const bufferTime = 60 * 60 * 1000; // Refresh 1 hour before expiry (for 7-day tokens)
      
      if (now < (this.tokenCache.expiresAt - bufferTime)) {
        return this.tokenCache.accessToken;
      }
    }

    // Token expired or not cached - fetch from backend
    return await this.fetchTokenFromBackend();
  }

  /**
   * Fetch fresh token from backend
   */
  async fetchTokenFromBackend() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/auth/floodsupport-token`);

      if (response.data.success && response.data.accessToken) {
        const accessToken = response.data.accessToken;
        
        // Cache token for 7 days (604800 seconds)
        // Token expiry is now 1 week - will auto-refresh 1 hour before expiry
        this.tokenCache.accessToken = accessToken;
        this.tokenCache.expiresAt = Date.now() + (604800 * 1000);

        console.log('✅ FloodSupport access token obtained from backend (valid for 7 days)');
        return accessToken;
      }

      throw new Error('No access token in response');
    } catch (error: any) {
      console.error('❌ Failed to get access token from backend:', error.message);
      
      // Clear cache on error
      this.tokenCache.accessToken = null;
      this.tokenCache.expiresAt = null;
      
      throw error;
    }
  }

  /**
   * Make an authenticated request to FloodSupport API with automatic token refresh
   */
  async makeAuthenticatedRequest(url: string, options: AuthRequestOptions = {}): Promise<AxiosResponse> {
    try {
      // Get valid token
      const accessToken = await this.getAccessToken();

      // Add Authorization header
      const headers = {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`,
      };

      // Make request
      const response = await axios({
        url,
        ...options,
        headers,
      });

      return response;
    } catch (error: any) {
      // If 401, clear cache and retry once
      if (error.response?.status === 401 && !options._retried) {
        console.log('⚠️ 401 error - refreshing token and retrying...');
        
        // Clear cache and retry
        this.tokenCache.accessToken = null;
        this.tokenCache.expiresAt = null;
        
        return await this.makeAuthenticatedRequest(url, { ...options, _retried: true });
      }

      throw error;
    }
  }

  /**
   * Force refresh token (useful for testing)
   */
  async forceRefresh() {
    this.tokenCache.accessToken = null;
    this.tokenCache.expiresAt = null;
    return await this.getAccessToken();
  }

  /**
   * Clear cached token
   */
  clearCache() {
    this.tokenCache.accessToken = null;
    this.tokenCache.expiresAt = null;
  }

  /**
   * Get token status
   */
  getStatus() {
    if (!this.tokenCache.accessToken || this.tokenCache.expiresAt == null) {
      return { cached: false, expiresIn: 0, valid: false };
    }

    // At this point expiresAt is non-null
    const expiresIn = Math.floor((this.tokenCache.expiresAt - Date.now()) / 1000);
    return {
      cached: true,
      expiresIn,
      valid: expiresIn > 0,
    };
  }
}

// Export singleton instance
export default new TokenManager();
