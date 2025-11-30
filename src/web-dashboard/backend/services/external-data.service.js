// Service to integrate external FloodSupport.org SOS requests and Public Relief Data API
const axios = require('axios');

const FLOODSUPPORT_API = 'https://floodsupport.org/api/sos/verified';
const RELIEF_DATA_API = 'https://cynwvkagfmhlpsvkparv.supabase.co/functions/v1/public-data-api';

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let floodSupportCache = {
  data: null,
  timestamp: null
};
let reliefDataCache = {
  data: null,
  timestamp: null
};

class ExternalDataService {
  /**
   * Fetch verified SOS requests from FloodSupport.org
   * Returns external emergency requests with purple marker designation
   */
  async getFloodSupportSOS() {
    try {
      // Check cache first
      if (floodSupportCache.data && 
          floodSupportCache.timestamp && 
          (Date.now() - floodSupportCache.timestamp < CACHE_DURATION)) {
        console.log('📦 Returning cached FloodSupport.org data');
        return {
          success: true,
          data: floodSupportCache.data,
          cached: true
        };
      }

      console.log('🌐 Fetching fresh data from FloodSupport.org...');
      const response = await axios.get(FLOODSUPPORT_API, {
        timeout: 8000,
        params: {
          status: 'VERIFIED',
          limit: 100
        }
      });

      // Transform FloodSupport data to our format
      const transformedData = response.data.map(sos => ({
        _id: `external-fs-${sos.id}`,
        source: 'floodsupport.org',
        external: true,
        user_id: 'external-floodsupport',
        location: {
          lat: sos.latitude,
          lng: sos.longitude,
          address: sos.location || sos.address || 'Location from FloodSupport.org'
        },
        message: sos.description || sos.message || 'Emergency request from FloodSupport.org',
        priority: this.mapPriorityFromFloodSupport(sos),
        status: 'pending',
        emergency_type: this.mapEmergencyType(sos),
        contact_info: {
          phone: sos.contact_number || sos.phone,
          alternate_contact: sos.alternate_contact
        },
        water_level: sos.water_level,
        people_trapped: sos.affected_people || sos.people_count,
        created_at: sos.created_at || sos.timestamp,
        updated_at: sos.updated_at || sos.timestamp,
        external_metadata: {
          original_id: sos.id,
          verification_status: sos.status,
          verified_at: sos.verified_at,
          verification_source: 'FloodSupport.org'
        }
      }));

      // Update cache
      floodSupportCache = {
        data: transformedData,
        timestamp: Date.now()
      };

      console.log(`✅ Fetched ${transformedData.length} SOS requests from FloodSupport.org`);
      return {
        success: true,
        data: transformedData,
        cached: false
      };

    } catch (error) {
      console.error('❌ Error fetching FloodSupport.org data:', error.message);
      
      // Return cached data if available, even if stale
      if (floodSupportCache.data) {
        console.log('⚠️ Returning stale cached data due to API error');
        return {
          success: true,
          data: floodSupportCache.data,
          cached: true,
          stale: true,
          error: error.message
        };
      }
      
      return {
        success: false,
        data: [],
        error: error.message
      };
    }
  }

  /**
   * Fetch relief camp data and contributions from public-data-api
   */
  async getReliefData(options = {}) {
    try {
      const {
        type = 'all',
        status = 'all',
        urgency = 'all',
        establishment = 'all',
        lat,
        lng,
        radius_km = 50,
        search,
        sort = 'newest',
        limit = 100
      } = options;

      // Build query params
      const params = {
        type,
        status,
        urgency,
        establishment,
        sort,
        limit
      };

      if (search) params.search = search;
      if (lat && lng && radius_km) {
        params.lat = lat;
        params.lng = lng;
        params.radius_km = radius_km;
      }

      // Check cache for same query
      const cacheKey = JSON.stringify(params);
      if (reliefDataCache.data && 
          reliefDataCache.queryKey === cacheKey &&
          reliefDataCache.timestamp && 
          (Date.now() - reliefDataCache.timestamp < CACHE_DURATION)) {
        console.log('📦 Returning cached relief data');
        return {
          success: true,
          ...reliefDataCache.data,
          cached: true
        };
      }

      console.log('🌐 Fetching relief data from public-data-api...');
      const response = await axios.get(RELIEF_DATA_API, {
        params,
        timeout: 10000
      });

      // Update cache
      reliefDataCache = {
        data: response.data,
        queryKey: cacheKey,
        timestamp: Date.now()
      };

      console.log(`✅ Fetched ${response.data.requests?.length || 0} help requests and ${response.data.contributions?.length || 0} contributions`);
      return {
        success: true,
        ...response.data,
        cached: false
      };

    } catch (error) {
      console.error('❌ Error fetching relief data:', error.message);
      
      // Return cached data if available
      if (reliefDataCache.data) {
        console.log('⚠️ Returning stale cached data due to API error');
        return {
          success: true,
          ...reliefDataCache.data,
          cached: true,
          stale: true,
          error: error.message
        };
      }
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get emergency help requests by urgency
   */
  async getEmergencyRequests(lat, lng, radius_km = 30) {
    try {
      const data = await this.getReliefData({
        type: 'requests',
        urgency: 'emergency',
        status: 'pending',
        lat,
        lng,
        radius_km,
        sort: 'urgency'
      });

      return data;
    } catch (error) {
      console.error('Error fetching emergency requests:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get nearby contributions (volunteers, donations, supplies)
   */
  async getNearbyContributions(lat, lng, radius_km = 20) {
    try {
      const data = await this.getReliefData({
        type: 'contributions',
        status: 'available',
        verified: 'true',
        lat,
        lng,
        radius_km,
        sort: 'distance'
      });

      return data;
    } catch (error) {
      console.error('Error fetching nearby contributions:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Search relief camps by type
   */
  async searchReliefCamps(establishment_type, limit = 50) {
    try {
      const data = await this.getReliefData({
        establishment: establishment_type,
        type: 'requests',
        limit
      });

      return data;
    } catch (error) {
      console.error('Error searching relief camps:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get combined emergency data (local + FloodSupport.org)
   */
  async getCombinedEmergencyData(localSOS = []) {
    try {
      const externalSOS = await this.getFloodSupportSOS();
      
      return {
        success: true,
        data: {
          local: localSOS,
          external: externalSOS.data || [],
          total: localSOS.length + (externalSOS.data?.length || 0)
        },
        metadata: {
          local_count: localSOS.length,
          external_count: externalSOS.data?.length || 0,
          external_cached: externalSOS.cached,
          external_stale: externalSOS.stale
        }
      };
    } catch (error) {
      console.error('Error combining emergency data:', error);
      return {
        success: true,
        data: {
          local: localSOS,
          external: [],
          total: localSOS.length
        },
        error: error.message
      };
    }
  }

  /**
   * Map FloodSupport.org priority to our system
   */
  mapPriorityFromFloodSupport(sos) {
    // Check water level
    if (sos.water_level >= 5 || sos.priority === 'CRITICAL') return 'critical';
    if (sos.water_level >= 3 || sos.priority === 'HIGH') return 'high';
    if (sos.water_level >= 1 || sos.priority === 'MEDIUM') return 'medium';
    
    // Check affected people count
    if (sos.affected_people > 50) return 'critical';
    if (sos.affected_people > 20) return 'high';
    if (sos.affected_people > 5) return 'medium';
    
    return 'medium';
  }

  /**
   * Map emergency type from description
   */
  mapEmergencyType(sos) {
    const description = (sos.description || sos.message || '').toLowerCase();
    
    if (description.includes('flood') || description.includes('water')) return 'natural_disaster';
    if (description.includes('medical') || description.includes('injury') || description.includes('sick')) return 'medical';
    if (description.includes('fire')) return 'fire';
    if (description.includes('accident')) return 'accident';
    
    return 'natural_disaster'; // Default for FloodSupport.org
  }

  /**
   * Clear caches (for testing or manual refresh)
   */
  clearCache() {
    floodSupportCache = { data: null, timestamp: null };
    reliefDataCache = { data: null, timestamp: null };
    console.log('🧹 External data cache cleared');
  }

  /**
   * Get cache status
   */
  getCacheStatus() {
    return {
      floodSupport: {
        cached: !!floodSupportCache.data,
        age_seconds: floodSupportCache.timestamp ? Math.floor((Date.now() - floodSupportCache.timestamp) / 1000) : null,
        records: floodSupportCache.data?.length || 0
      },
      reliefData: {
        cached: !!reliefDataCache.data,
        age_seconds: reliefDataCache.timestamp ? Math.floor((Date.now() - reliefDataCache.timestamp) / 1000) : null
      }
    };
  }
}

module.exports = new ExternalDataService();
