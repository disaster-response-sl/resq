import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Users, AlertCircle, Map as MapIcon, ArrowLeft, ExternalLink, RefreshCw, Layers, Filter, BarChart3, TrendingUp } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import axios from 'axios';
import toast from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons for different urgency levels
const createCustomIcon = (urgency: string) => {
  const colors: Record<string, string> = {
    emergency: '#dc2626',
    high: '#f97316',
    medium: '#3b82f6',
    low: '#22c55e',
  };
  
  return L.divIcon({
    className: 'custom-icon',
    html: `<div style="background-color: ${colors[urgency] || '#3b82f6'}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

interface ReliefCamp {
  id: string;
  full_name: string;
  address: string;
  latitude: number;
  longitude: number;
  establishment_type: string;
  num_men?: number;
  num_women?: number;
  num_children?: number;
  urgency: string;
  status: string;
  assistance_types: string[];
  distance_km?: number;
  verified?: boolean;
  verified_by_name?: string;
  pickup_required?: boolean;
  source?: string;
  created_at?: string;
}

const ReliefTrackerPage: React.FC = () => {
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [reliefCamps, setReliefCamps] = useState<ReliefCamp[]>([]);
  const [allCamps, setAllCamps] = useState<ReliefCamp[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchRadius, setSearchRadius] = useState('50');
  const [debouncedRadius, setDebouncedRadius] = useState('50');
  
  // Advanced filters
  const [establishmentFilter, setEstablishmentFilter] = useState('all');
  const [verifiedFilter, setVerifiedFilter] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  
  // Pagination
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 100;
  
  // Real-time updates
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(false);
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);
  
  // Map layers
  const [showRequests, setShowRequests] = useState(true);
  const [showContributions, setShowContributions] = useState(true);
  const [showMongoDB, setShowMongoDB] = useState(true);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Debounce search radius to prevent notification spam while adjusting slider
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedRadius(searchRadius);
    }, 800);
    return () => clearTimeout(timer);
  }, [searchRadius]);

  useEffect(() => {
    if (userLocation) {
      fetchReliefCamps();
    }
  }, [userLocation, debouncedRadius, establishmentFilter, verifiedFilter, statusFilter, sortBy, offset]);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      autoRefreshInterval.current = setInterval(() => {
        fetchReliefCamps(true);
      }, 30000);
    } else {
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current);
      }
    }
    return () => {
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current);
      }
    };
  }, [autoRefresh, userLocation, debouncedRadius]);

  // Apply client-side filtering
  useEffect(() => {
    let filtered = [...allCamps];

    // Text search
    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(camp => 
        camp.full_name.toLowerCase().includes(search) ||
        camp.address.toLowerCase().includes(search) ||
        camp.establishment_type.toLowerCase().includes(search) ||
        camp.assistance_types.some(type => type.toLowerCase().includes(search))
      );
    }

    // Layer filters
    if (!showRequests) {
      filtered = filtered.filter(camp => camp.source !== 'public_api_request');
    }
    if (!showContributions) {
      filtered = filtered.filter(camp => camp.source !== 'public_api_contribution');
    }
    if (!showMongoDB) {
      filtered = filtered.filter(camp => camp.source !== 'mongodb');
    }

    setReliefCamps(filtered);
  }, [allCamps, searchText, showRequests, showContributions, showMongoDB]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Location error:', error);
          setUserLocation({ lat: 6.9271, lng: 79.8612 }); // Default to Colombo
          toast.error('Using default location (Colombo). Enable GPS for accurate results.');
        }
      );
    } else {
      setUserLocation({ lat: 6.9271, lng: 79.8612 });
      toast.error('Geolocation not supported');
    }
  };

  const fetchReliefCamps = async (silent: boolean = false) => {
    if (!userLocation) return;

    try {
      if (!silent) setLoading(true);
      
      // HYBRID DATA MODEL: Fetch Supabase (requests + contributions) AND MongoDB help requests
      const baseParams = new URLSearchParams();
      baseParams.append('limit', '500');
      baseParams.append('lat', userLocation.lat.toString());
      baseParams.append('lng', userLocation.lng.toString());
      baseParams.append('radius_km', debouncedRadius);
      baseParams.append('sort', sortBy);
      baseParams.append('offset', offset.toString());
      
      // Apply filters
      if (establishmentFilter !== 'all') {
        baseParams.append('establishment', establishmentFilter);
      }
      if (verifiedFilter !== 'all') {
        baseParams.append('verified', verifiedFilter);
      }
      if (statusFilter !== 'all') {
        baseParams.append('status', statusFilter);
      }

      // Fetch data from Sri Lanka Flood Relief Public Data API
      const apiUrl = import.meta.env.VITE_PUBLIC_DATA_API_URL || 'https://api.floodsupport.org/default/sri-lanka-flood-relief-jm/v1.0';

      // Import tokenManager dynamically
      const { default: tokenManager } = await import('../utils/tokenManager');

      // Fetch REQUESTS from public API
      const requestParams = new URLSearchParams(baseParams);
      requestParams.append('type', 'requests');
      const requestsResponse = await tokenManager.makeAuthenticatedRequest(
        `${apiUrl}/public-data-api?${requestParams.toString()}`
      ).catch((err) => {
        console.error('❌ Public Data API requests error:', err.message);
        return { data: { requests: [], meta: {} } };
      });

      // Fetch CONTRIBUTIONS from public API
      const contributionParams = new URLSearchParams(baseParams);
      contributionParams.append('type', 'contributions');
      const contributionsResponse = await tokenManager.makeAuthenticatedRequest(
        `${apiUrl}/public-data-api?${contributionParams.toString()}`
      ).catch((err) => {
        console.error('❌ Public Data API contributions error:', err.message);
        return { data: { contributions: [], meta: {} } };
      });

      // Fetch MongoDB help requests - all pending reports (food, shelter, medical, danger)
      const mongoResponse = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/public/user-reports?status=pending&limit=100`
      ).catch(() => ({ data: { success: false, data: [] } }));

      // Public Data API response: { requests: [...], contributions: [...], meta: {...} }
      console.log('🔍 Raw API responses:', {
        requestsResponse: requestsResponse.data,
        contributionsResponse: contributionsResponse.data,
        mongoResponse: mongoResponse.data
      });

      const publicRequests = requestsResponse.data.requests || [];
      const publicContributions = contributionsResponse.data.contributions || [];
      const mongoHelp = mongoResponse.data.success ? mongoResponse.data.data : [];

      console.log('📊 Data fetched:', {
        publicRequests: publicRequests.length,
        publicContributions: publicContributions.length,
        mongoHelp: mongoHelp.length,
        requestsMeta: requestsResponse.data.meta,
        contributionsMeta: contributionsResponse.data.meta
      });

      // Map public requests with metadata
      const requestsCamps = publicRequests.map((req: any) => ({
        ...req,
        source: 'public_api_request',
        verified: false
      }));

      // Map public contributions (people offering help)
      const contributionsCamps = publicContributions.map((contrib: any) => ({
        id: contrib.id,
        full_name: `💚 ${contrib.full_name} (Volunteer)`,
        address: contrib.address,
        latitude: contrib.latitude,
        longitude: contrib.longitude,
        establishment_type: 'Volunteer Contribution',
        urgency: 'low',
        status: contrib.status || 'available',
        assistance_types: [...(contrib.goods_types || []), ...(contrib.services_types || []), ...(contrib.labor_types || [])],
        distance_km: contrib.distance_km,
        verified: contrib.verified || false,
        verified_by_name: contrib.verified_by_name,
        pickup_required: contrib.pickup_required || false,
        created_at: contrib.created_at,
        source: 'public_api_contribution'
      }));

      // Map MongoDB help requests to relief camp format
      const mongoHelpAsCamps = mongoHelp.map((help: any) => {
        const typeLabels: any = {
          food: 'Food Shortage 🍽️',
          shelter: 'Shelter Needed 🏠',
          medical: 'Medical Emergency 🏥',
          danger: 'Danger Alert ⚠️'
        };
        
        return {
          id: help._id,
          full_name: typeLabels[help.type] || 'Help Request',
          address: help.description || 'No description',
          latitude: help.location.lat,
          longitude: help.location.lng,
          establishment_type: typeLabels[help.type] || 'Help Needed',
          urgency: help.type === 'medical' ? 'emergency' : 'high',
          status: help.status,
          assistance_types: [help.type],
          source: 'mongodb'
        };
      });

      // Merge ALL sources
      const mergedCamps = [
        ...requestsCamps,
        ...contributionsCamps,
        ...mongoHelpAsCamps
      ];

      console.log(`✅ HYBRID Relief: ${requestsCamps.length} Public API requests + ${contributionsCamps.length} contributions + ${mongoHelpAsCamps.length} MongoDB help = ${mergedCamps.length} total`);

      setAllCamps(mergedCamps);
      setTotalCount(mergedCamps.length);
      setLastRefresh(new Date());
      
      if (!silent) {
        toast.success(`Found ${mergedCamps.length} relief locations within ${debouncedRadius}km`);
      }
    } catch (error) {
      console.error('Relief camps fetch error:', error);
      toast.error('Failed to fetch relief camps');
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'emergency':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-green-100 text-green-800 border-green-300';
    }
  };

  // Analytics calculations
  const getAnalytics = () => {
    const urgencyCounts = {
      emergency: reliefCamps.filter(c => c.urgency === 'emergency').length,
      high: reliefCamps.filter(c => c.urgency === 'high').length,
      medium: reliefCamps.filter(c => c.urgency === 'medium').length,
      low: reliefCamps.filter(c => c.urgency === 'low').length,
    };

    const establishmentCounts: Record<string, number> = {};
    reliefCamps.forEach(camp => {
      establishmentCounts[camp.establishment_type] = (establishmentCounts[camp.establishment_type] || 0) + 1;
    });

    const statusCounts = {
      pending: reliefCamps.filter(c => c.status === 'pending').length,
      resolved: reliefCamps.filter(c => c.status === 'resolved').length,
      available: reliefCamps.filter(c => c.status === 'available').length,
    };

    const verifiedCount = reliefCamps.filter(c => c.verified).length;
    const pickupRequiredCount = reliefCamps.filter(c => c.pickup_required).length;

    return { urgencyCounts, establishmentCounts, statusCounts, verifiedCount, pickupRequiredCount };
  };

  // Load more camps
  const loadMore = () => {
    setOffset(prev => prev + limit);
  };

  const analytics = getAnalytics();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-green-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/citizen')}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold">Relief Demand & Supply Tracker</h1>
                <p className="text-blue-100 text-sm">Real-time coordination platform</p>
              </div>
            </div>
            <img 
              src="/favicon.png" 
              alt="ResQ Hub Logo" 
              className="h-10 w-10"
            />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Get Help or Volunteer
              </h2>
              <p className="text-gray-600 max-w-3xl mx-auto">
                Real-time coordination platform connecting affected residents with volunteers and 
                authorities during flood emergencies.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => navigate('/citizen/report')}
                className="bg-red-600 hover:bg-red-700 text-white p-6 rounded-xl shadow-lg transition-all transform hover:scale-105 flex items-center justify-center space-x-3"
              >
                <AlertCircle className="h-8 w-8" />
                <div className="text-left">
                  <div className="text-xl font-bold">Ask for Support</div>
                  <div className="text-sm text-red-100">Request immediate assistance</div>
                </div>
              </button>

              <button
                onClick={() => navigate('/citizen/volunteer')}
                className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-xl shadow-lg transition-all transform hover:scale-105 flex items-center justify-center space-x-3"
              >
                <Heart className="h-8 w-8" />
                <div className="text-left">
                  <div className="text-xl font-bold">Offer Support</div>
                  <div className="text-sm text-green-100">Volunteer or donate resources</div>
                </div>
              </button>
            </div>
          </div>

          {/* Analytics Dashboard */}
          <div className="bg-white rounded-xl shadow-lg p-4 md:p-8 mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-3">
              <div className="flex items-center space-x-3">
                <BarChart3 className="h-6 md:h-7 w-6 md:w-7 text-blue-600" />
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Relief Analytics</h2>
              </div>
              <div className="flex items-center space-x-2 text-xs md:text-sm text-gray-600">
                <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
              <div className="bg-red-50 rounded-lg p-4 border-2 border-red-200">
                <div className="text-3xl font-bold text-red-600">{analytics.urgencyCounts.emergency}</div>
                <div className="text-sm text-red-800">Emergency</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 border-2 border-orange-200">
                <div className="text-3xl font-bold text-orange-600">{analytics.urgencyCounts.high}</div>
                <div className="text-sm text-orange-800">High Urgency</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                <div className="text-3xl font-bold text-blue-600">{analytics.urgencyCounts.medium}</div>
                <div className="text-sm text-blue-800">Medium</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                <div className="text-3xl font-bold text-green-600">{analytics.urgencyCounts.low}</div>
                <div className="text-sm text-green-800">Low / Offers</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 border-2 border-purple-200">
                <div className="text-3xl font-bold text-purple-600">{analytics.verifiedCount}</div>
                <div className="text-sm text-purple-800">✓ Verified</div>
              </div>
            </div>

            <div className="mt-4 md:mt-6 grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              <div className="bg-gray-50 rounded-lg p-3 md:p-4">
                <h3 className="font-bold text-gray-900 mb-2 text-sm md:text-base">Top Establishments</h3>
                <div className="space-y-1 text-sm">
                  {Object.entries(analytics.establishmentCounts)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([type, count]) => (
                      <div key={type} className="flex justify-between">
                        <span className="text-gray-700">{type}</span>
                        <span className="font-semibold text-gray-900">{count}</span>
                      </div>
                    ))}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 md:p-4">
                <h3 className="font-bold text-gray-900 mb-2 text-sm md:text-base">Status Breakdown</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">⏳ Pending</span>
                    <span className="font-semibold text-orange-600">{analytics.statusCounts.pending}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">✅ Resolved</span>
                    <span className="font-semibold text-green-600">{analytics.statusCounts.resolved}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">💚 Available</span>
                    <span className="font-semibold text-blue-600">{analytics.statusCounts.available}</span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 md:p-4">
                <h3 className="font-bold text-gray-900 mb-2 text-sm md:text-base">Special Indicators</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">🚚 Pickup Required</span>
                    <span className="font-semibold text-gray-900">{analytics.pickupRequiredCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">📊 Total Locations</span>
                    <span className="font-semibold text-blue-600">{reliefCamps.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">📍 Within Radius</span>
                    <span className="font-semibold text-green-600">{totalCount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Find Nearby Help Section with Advanced Filters */}
          <div className="bg-white rounded-xl shadow-lg p-4 md:p-8 mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-3">
              <div className="flex items-center space-x-3">
                <Filter className="h-6 md:h-7 w-6 md:w-7 text-blue-600" />
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Search & Filter</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setAutoRefresh(!autoRefresh);
                    toast.success(autoRefresh ? 'Auto-refresh disabled' : 'Auto-refresh enabled (30s)');
                  }}
                  className={`px-3 md:px-4 py-2 rounded-lg text-sm md:text-base font-semibold transition-colors flex items-center space-x-2 ${
                    autoRefresh ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Auto-Refresh</span>
                </button>
                <button
                  onClick={() => fetchReliefCamps()}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 md:px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Text Search */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🔍 Text Search
              </label>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search by name, address, type, or assistance..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🏢 Establishment Type
                </label>
                <select
                  value={establishmentFilter}
                  onChange={(e) => setEstablishmentFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="School">School</option>
                  <option value="Temple">Temple</option>
                  <option value="Kitchen">Kitchen</option>
                  <option value="Dispensary">Dispensary</option>
                  <option value="Tent">Tent</option>
                  <option value="Private Land">Private Land</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ✓ Verification Status
                </label>
                <select
                  value={verifiedFilter}
                  onChange={(e) => setVerifiedFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All</option>
                  <option value="true">Verified Only</option>
                  <option value="false">Unverified</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📊 Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="resolved">Resolved</option>
                  <option value="available">Available</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📈 Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="distance">Closest First</option>
                  <option value="urgency">Most Urgent</option>
                </select>
              </div>
            </div>

            {/* Search Radius */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📍 Search Radius: {searchRadius} km
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="5"
                  max="200"
                  value={searchRadius}
                  onChange={(e) => setSearchRadius(e.target.value)}
                  className="flex-1"
                />
                <span className="text-lg font-semibold text-gray-900 w-20">{searchRadius} km</span>
              </div>
            </div>

            {/* Map Layer Toggles */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Layers className="h-4 w-4 inline mr-2" />
                Map Layers
              </label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showRequests}
                    onChange={(e) => setShowRequests(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded"
                  />
                  <span className="text-sm text-gray-700">🔴 Help Requests</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showContributions}
                    onChange={(e) => setShowContributions(e.target.checked)}
                    className="w-4 h-4 text-green-600 rounded"
                  />
                  <span className="text-sm text-gray-700">💚 Volunteer Offers</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showMongoDB}
                    onChange={(e) => setShowMongoDB(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                  <span className="text-sm text-gray-700">🆘 SOS Reports</span>
                </label>
              </div>
            </div>

            {userLocation && (
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700">
                  <strong>Your Location:</strong> {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                </p>
                <button
                  onClick={getCurrentLocation}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2"
                >
                  📍 Update Location
                </button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <button
                onClick={() => fetchReliefCamps()}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg text-sm md:text-base font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Searching...' : '🔍 Find Nearby Shelters'}
              </button>
            </div>
          </div>

          {/* Live Relief Camps Map */}
          <div className="bg-white rounded-xl shadow-lg p-4 md:p-8 mb-8">
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900">Live Relief Camps Map</h2>
                  <p className="text-sm md:text-base text-gray-600">
                    Showing {allCamps.length} active relief camps • Updated in real-time
                  </p>
                </div>
                <button
                  onClick={() => navigate('/citizen/map')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg text-sm md:text-base font-semibold transition-colors flex items-center justify-center space-x-2 w-full sm:w-auto"
                >
                  <MapIcon className="h-5 w-5" />
                  <span>View Full Map</span>
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>

              {loading ? (
                <div className="bg-gray-100 rounded-lg p-12 text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-gray-600">Loading relief camps...</p>
                </div>
              ) : allCamps.length > 0 && userLocation ? (
                <div className="mb-6 h-[400px] md:h-[600px] rounded-lg overflow-hidden">
                  <MapContainer
                    center={[userLocation.lat, userLocation.lng]}
                    zoom={10}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    
                    {/* User location marker */}
                    {userLocation && (
                      <Marker position={[userLocation.lat, userLocation.lng]}>
                        <Popup>
                          <div className="text-center">
                            <strong>📍 Your Location</strong>
                          </div>
                        </Popup>
                      </Marker>
                    )}

                    {/* Search radius circle */}
                    {userLocation && (
                      <Circle
                        center={[userLocation.lat, userLocation.lng]}
                        radius={parseFloat(debouncedRadius) * 1000}
                        pathOptions={{
                          color: '#3b82f6',
                          fillColor: '#3b82f6',
                          fillOpacity: 0.1,
                        }}
                      />
                    )}

                    {/* Relief camp markers with clustering - showing ALL camps */}
                    <MarkerClusterGroup
                      chunkedLoading
                      maxClusterRadius={20}
                      spiderfyOnMaxZoom={true}
                      showCoverageOnHover={false}
                      zoomToBoundsOnClick={true}
                      disableClusteringAtZoom={11}
                    >
                      {allCamps.map((camp) => (
                        <Marker
                          key={camp.id}
                          position={[camp.latitude, camp.longitude]}
                          icon={createCustomIcon(camp.urgency)}
                        >
                          <Popup>
                            <div className="min-w-[250px]">
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="font-bold text-gray-900 flex-1">{camp.full_name}</h3>
                                {camp.verified && (
                                  <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded ml-2">
                                    ✓ Verified
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-700 mb-2">{camp.address}</p>
                              <div className="space-y-1 text-xs text-gray-600">
                                <div>📍 {camp.distance_km?.toFixed(1) || '0.0'} km away</div>
                                <div>🏢 {camp.establishment_type}</div>
                                {camp.pickup_required && (
                                  <div className="text-orange-600 font-semibold">🚚 Pickup Required</div>
                                )}
                                <div>
                                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                                    camp.urgency === 'emergency' ? 'bg-red-500 text-white' :
                                    camp.urgency === 'high' ? 'bg-orange-500 text-white' :
                                    camp.urgency === 'medium' ? 'bg-blue-500 text-white' :
                                    'bg-green-500 text-white'
                                  }`}>
                                    {camp.urgency.toUpperCase()}
                                  </span>
                                </div>
                                {(camp.num_men || camp.num_women || camp.num_children) && (
                                  <div className="flex items-center space-x-2 mt-2">
                                    {camp.num_men && <span>👨 {camp.num_men}</span>}
                                    {camp.num_women && <span>👩 {camp.num_women}</span>}
                                    {camp.num_children && <span>👶 {camp.num_children}</span>}
                                  </div>
                                )}
                                {camp.assistance_types && camp.assistance_types.length > 0 && (
                                  <div className="mt-2">
                                    <strong>Needs:</strong> {camp.assistance_types.slice(0, 3).join(', ')}
                                  </div>
                                )}
                                {camp.created_at && (
                                  <div className="text-xs text-gray-500 mt-2">
                                    Added: {new Date(camp.created_at).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </div>
                          </Popup>
                        </Marker>
                      ))}
                    </MarkerClusterGroup>
                  </MapContainer>
                </div>
              ) : null}

              {loading ? null : (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                    <p className="text-xs md:text-sm text-gray-600">
                      Showing <strong>{reliefCamps.length}</strong> of <strong>{totalCount}</strong> locations
                      {searchText && <span className="block sm:inline"> • Filtered by: "{searchText}"</span>}
                    </p>
                    {reliefCamps.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 md:px-3 py-1 rounded-full">
                          {analytics.urgencyCounts.emergency} Emergency
                        </span>
                        <span className="text-xs bg-orange-100 text-orange-800 px-2 md:px-3 py-1 rounded-full">
                          {analytics.urgencyCounts.high} High
                        </span>
                        <span className="text-xs bg-green-100 text-green-800 px-2 md:px-3 py-1 rounded-full">
                          {analytics.verifiedCount} Verified
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {reliefCamps.length === 0 ? (
                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">No relief camps found</p>
                      <p className="text-sm text-gray-500 mt-2">Try adjusting your filters or increasing the search radius</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 max-h-[600px] overflow-y-auto">
                        {reliefCamps.slice(0, 50).map((camp) => (
                          <div
                            key={camp.id}
                            className={`border-2 rounded-lg p-4 hover:shadow-md transition-shadow ${getUrgencyColor(camp.urgency)}`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-bold text-gray-900 flex-1">{camp.full_name}</h3>
                              <div className="flex flex-col gap-1">
                                <span
                                  className={`px-2 py-1 rounded text-xs font-bold ${
                                    camp.urgency === 'emergency'
                                      ? 'bg-red-500 text-white'
                                      : camp.urgency === 'high'
                                      ? 'bg-orange-500 text-white'
                                      : camp.urgency === 'medium'
                                      ? 'bg-blue-500 text-white'
                                      : 'bg-green-500 text-white'
                                  }`}
                                >
                                  {camp.urgency.toUpperCase()}
                                </span>
                                {camp.verified && (
                                  <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">
                                    ✓ Verified
                                  </span>
                                )}
                                {camp.pickup_required && (
                                  <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-1 rounded">
                                    🚚 Pickup
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">{camp.address}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-600 mb-2">
                              <span>📍 {camp.distance_km?.toFixed(1) || '0.0'} km away</span>
                              <span>🏢 {camp.establishment_type}</span>
                            </div>
                            {(camp.num_men || camp.num_women || camp.num_children) && (
                              <div className="flex items-center space-x-3 text-xs text-gray-600 mb-2">
                                {camp.num_men && <span>👨 {camp.num_men} men</span>}
                                {camp.num_women && <span>👩 {camp.num_women} women</span>}
                                {camp.num_children && <span>👶 {camp.num_children} children</span>}
                              </div>
                            )}
                            {camp.assistance_types && camp.assistance_types.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {camp.assistance_types.slice(0, 4).map((type, idx) => (
                                  <span
                                    key={idx}
                                    className="bg-white px-2 py-1 rounded text-xs font-medium text-gray-700 border border-gray-200"
                                  >
                                    {type}
                                  </span>
                                ))}
                                {camp.assistance_types.length > 4 && (
                                  <span className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-600">
                                    +{camp.assistance_types.length - 4} more
                                  </span>
                                )}
                              </div>
                            )}
                            {camp.created_at && (
                              <div className="text-xs text-gray-500 mt-2 flex items-center justify-between">
                                <span>Added: {new Date(camp.created_at).toLocaleDateString()}</span>
                                {new Date().getTime() - new Date(camp.created_at).getTime() < 3600000 && (
                                  <span className="bg-red-500 text-white px-2 py-0.5 rounded text-xs font-bold animate-pulse">
                                    NEW
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {/* Load More / Pagination */}
                      {reliefCamps.length < totalCount && (
                        <div className="mt-6 text-center">
                          <button
                            onClick={loadMore}
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 inline-flex items-center space-x-2"
                          >
                            <TrendingUp className="h-5 w-5" />
                            <span>Load More Results</span>
                          </button>
                          <p className="text-sm text-gray-500 mt-2">
                            {totalCount - reliefCamps.length} more locations available
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-xl shadow-lg p-8 text-white mb-8">
            <h2 className="text-2xl font-bold mb-6 text-center">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <div className="text-4xl font-bold mb-2">1</div>
                <h3 className="font-bold text-lg mb-2">Request Help</h3>
                <p className="text-blue-100 text-sm">
                  Affected residents submit help requests with their location and needs through a simple form.
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <div className="text-4xl font-bold mb-2">2</div>
                <h3 className="font-bold text-lg mb-2">Real-Time Map</h3>
                <p className="text-blue-100 text-sm">
                  All requests appear instantly on an interactive map with color-coded urgency levels.
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <div className="text-4xl font-bold mb-2">3</div>
                <h3 className="font-bold text-lg mb-2">Coordinate Response</h3>
                <p className="text-blue-100 text-sm">
                  Volunteers and rescue teams view details, contact victims, and mark requests as resolved.
                </p>
              </div>
            </div>
          </div>

          {/* Map Legend */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="font-bold text-gray-900 mb-4">Map Legend</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-red-500"></div>
                <span className="text-sm text-gray-700">Emergency</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                <span className="text-sm text-gray-700">High</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                <span className="text-sm text-gray-700">Medium</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-700">Low</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-purple-500"></div>
                <span className="text-sm text-gray-700">Offers to Help</span>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-yellow-800 mb-2">Important Disclaimer</h3>
                <p className="text-yellow-800 text-sm">
                  It is the sole responsibility of donors and volunteers to verify the authenticity of help 
                  requests before providing assistance. This platform serves only as a coordination tool and 
                  assumes no responsibility for any damages, losses, or outcomes arising from interactions 
                  facilitated through this service.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReliefTrackerPage;
