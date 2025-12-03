import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { 
  AlertTriangle, MapPin, Phone, Users, Clock, Activity,
  Filter, RefreshCw, Droplets, Home, Heart,
  Search
} from 'lucide-react';
import { externalDataService, SOSEmergencyRequest } from '../services/externalDataService';
import toast from 'react-hot-toast';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Map center updater component
const MapCenterUpdater: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

const SOSEmergencyTrackerPage: React.FC = () => {
  const [requests, setRequests] = useState<SOSEmergencyRequest[]>([]);
  const [allRequests, setAllRequests] = useState<SOSEmergencyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([7.8731, 80.7718]); // Sri Lanka center

  // Filters
  const [districtFilter, setDistrictFilter] = useState('');
  const [emergencyTypeFilter, setEmergencyTypeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchText, setSearchText] = useState('');

  // Pagination
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Stats
  const [stats, setStats] = useState<any>(null);

  // Auto refresh
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    fetchSOSRequests();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchSOSRequests, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchSOSRequests = async (loadMore = false) => {
    try {
      setLoading(true);
      
      const params: any = {
        limit: 50,
        page: loadMore ? Math.floor(offset / 50) + 2 : 1,
      };

      if (districtFilter) params.district = districtFilter;
      if (emergencyTypeFilter) params.emergencyType = emergencyTypeFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (statusFilter) params.status = statusFilter;
      if (searchText) params.search = searchText;

      const response = await externalDataService.getPublicSOSEmergencyRequests(params);

      if (response.success) {
        const newRequests = response.data || [];
        
        if (loadMore) {
          setRequests(prev => [...prev, ...newRequests]);
          setAllRequests(prev => [...prev, ...newRequests]);
          setOffset(prev => prev + newRequests.length);
        } else {
          setRequests(newRequests);
          setAllRequests(newRequests);
          setOffset(newRequests.length);
        }

        setStats(response.stats);
        setHasMore(response.pagination?.hasNextPage || false);
        setLastUpdated(new Date());
        
        if (!loadMore) {
          toast.success(`Loaded ${newRequests.length} emergency requests`);
        }
      }
    } catch (error) {
      console.error('Failed to fetch SOS emergency requests:', error);
      toast.error('Failed to load emergency requests');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = () => {
    setOffset(0);
    setHasMore(true);
    fetchSOSRequests(false);
  };

  const getAnalytics = () => {
    if (!stats) return null;

    return {
      total: stats.total || 0,
      totalPeople: stats.totalPeople || 0,
      missingPeople: stats.missingPeopleCount || 0,
      byStatus: stats.byStatus || {},
      byPriority: stats.byPriority || {},
    };
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'HIGHLY_CRITICAL':
      case 'CRITICAL':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'HIGH':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'LOW':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-50';
      case 'ACKNOWLEDGED':
        return 'text-blue-600 bg-blue-50';
      case 'IN_PROGRESS':
        return 'text-purple-600 bg-purple-50';
      case 'RESCUED':
        return 'text-green-600 bg-green-50';
      case 'COMPLETED':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getEmergencyIcon = (type: string) => {
    switch (type) {
      case 'TRAPPED':
        return <AlertTriangle className="h-4 w-4" />;
      case 'MEDICAL':
      case 'MEDICAL_ASSISTANCE_H':
        return <Heart className="h-4 w-4" />;
      case 'FOOD_WATER':
      case 'COOKED_FOOD_H':
      case 'DRINKING_WATER_H':
        return <Droplets className="h-4 w-4" />;
      case 'SHELTER_NEEDED':
      case 'SHELTER_H':
        return <Home className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const createCustomIcon = (priority?: string) => {
    const color = priority === 'HIGHLY_CRITICAL' || priority === 'CRITICAL' ? '#dc2626' :
                  priority === 'HIGH' ? '#ea580c' :
                  priority === 'MEDIUM' ? '#ca8a04' : '#16a34a';

    return L.divIcon({
      html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      className: '',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15],
    });
  };

  const analytics = getAnalytics();

  const districts = Array.from(new Set(allRequests.map(r => r.district).filter(Boolean)));
  const emergencyTypes = [
    'TRAPPED', 'MEDICAL', 'FOOD_WATER', 'RESCUE_NEEDED', 'SHELTER_NEEDED',
    'MISSING_PERSON', 'RESCUE_ASSISTANCE_H', 'MEDICAL_ASSISTANCE_H',
    'COOKED_FOOD_H', 'DRINKING_WATER_H', 'DRY_FOOD_H', 'SHELTER_H',
    'CLOTHING_H', 'SANITARY_MATERIALS_H', 'OTHER'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-blue-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
                <AlertTriangle className="h-7 w-7 md:h-8 md:w-8 text-red-500" />
                SOS Emergency Tracker
              </h1>
              <p className="text-sm md:text-base text-gray-600 mt-2">
                Real-time emergency requests from FloodSupport.org API
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => fetchSOSRequests(false)}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium">Auto-refresh (30s)</span>
              </label>
            </div>
          </div>
          {lastUpdated && (
            <p className="text-xs text-gray-500 mt-4">
              Last updated: {lastUpdated.toLocaleString()}
            </p>
          )}
        </div>

        {/* Analytics Dashboard */}
        {analytics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Requests</p>
                  <p className="text-3xl font-bold mt-1">{analytics.total}</p>
                </div>
                <AlertTriangle className="h-10 w-10 text-blue-200" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">People Affected</p>
                  <p className="text-3xl font-bold mt-1">{analytics.totalPeople}</p>
                </div>
                <Users className="h-10 w-10 text-purple-200" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Missing Persons</p>
                  <p className="text-3xl font-bold mt-1">{analytics.missingPeople}</p>
                </div>
                <Search className="h-10 w-10 text-orange-200" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Rescued</p>
                  <p className="text-3xl font-bold mt-1">
                    {analytics.byStatus?.RESCUED || 0}
                  </p>
                </div>
                <Activity className="h-10 w-10 text-green-200" />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
              <select
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Districts</option>
                {districts.map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Type</label>
              <select
                value={emergencyTypeFilter}
                onChange={(e) => setEmergencyTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                {emergencyTypes.map(type => (
                  <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Priorities</option>
                <option value="HIGHLY_CRITICAL">Highly Critical</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="ACKNOWLEDGED">Acknowledged</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESCUED">Rescued</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Name or phone..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-4">
            <button
              onClick={handleFilterChange}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Apply Filters
            </button>
          </div>
        </div>

        {/* Map */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            Emergency Locations Map
          </h2>
          
          <div className="h-96 rounded-xl overflow-hidden border-2 border-gray-200">
            <MapContainer
              center={mapCenter}
              zoom={8}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
            >
              <MapCenterUpdater center={mapCenter} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              <MarkerClusterGroup
                chunkedLoading
                maxClusterRadius={60}
                spiderfyOnMaxZoom={true}
                showCoverageOnHover={false}
                disableClusteringAtZoom={15}
              >
                {allRequests
                  .filter(req => req.latitude && req.longitude)
                  .map((req, index) => (
                    <Marker
                      key={`${req.id || req.referenceNumber}-${index}`}
                      position={[req.latitude!, req.longitude!]}
                      icon={createCustomIcon(req.priority)}
                    >
                      <Popup>
                        <div className="p-2 min-w-[250px]">
                          <div className="flex items-center justify-between mb-2">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityColor(req.priority)}`}>
                              {req.priority || 'N/A'}
                            </span>
                            {req.emergencyType && (
                              <span className="flex items-center gap-1 text-xs text-gray-600">
                                {getEmergencyIcon(req.emergencyType)}
                                {req.emergencyType.replace(/_/g, ' ')}
                              </span>
                            )}
                          </div>
                          
                          <h3 className="font-bold text-gray-800 mb-1">{req.fullName}</h3>
                          
                          <div className="space-y-1 text-sm text-gray-600">
                            <p className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {req.phoneNumber}
                            </p>
                            {req.district && (
                              <p className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {req.district}
                              </p>
                            )}
                            {req.numberOfPeople && (
                              <p className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {req.numberOfPeople} people
                              </p>
                            )}
                            {req.waterLevel && (
                              <p className="flex items-center gap-1">
                                <Droplets className="h-3 w-3" />
                                Water: {req.waterLevel}
                              </p>
                            )}
                            {req.status && (
                              <p>
                                <span className={`px-2 py-1 rounded text-xs ${getStatusColor(req.status)}`}>
                                  {req.status}
                                </span>
                              </p>
                            )}
                          </div>
                          
                          {req.description && (
                            <p className="mt-2 text-sm text-gray-700 border-t pt-2">
                              {req.description}
                            </p>
                          )}
                          
                          {req.referenceNumber && (
                            <p className="mt-2 text-xs text-gray-500">
                              Ref: {req.referenceNumber}
                            </p>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  ))}
              </MarkerClusterGroup>
            </MapContainer>
          </div>
        </div>

        {/* Emergency List */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Emergency Requests</h2>
          
          {loading && requests.length === 0 ? (
            <div className="text-center py-12">
              <RefreshCw className="h-12 w-12 text-gray-400 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Loading emergency requests...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No emergency requests found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((req, index) => (
                <div
                  key={`${req.id || req.referenceNumber}-${index}`}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-bold text-gray-800">{req.fullName}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-semibold border ${getPriorityColor(req.priority)}`}>
                          {req.priority || 'N/A'}
                        </span>
                        {req.status && (
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(req.status)}`}>
                            {req.status}
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600 mb-2">
                        <p className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {req.phoneNumber}
                        </p>
                        {req.emergencyType && (
                          <p className="flex items-center gap-1">
                            {getEmergencyIcon(req.emergencyType)}
                            {req.emergencyType.replace(/_/g, ' ')}
                          </p>
                        )}
                        {req.district && (
                          <p className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {req.district}
                          </p>
                        )}
                        {req.numberOfPeople && (
                          <p className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {req.numberOfPeople} people affected
                          </p>
                        )}
                        {req.waterLevel && (
                          <p className="flex items-center gap-1">
                            <Droplets className="h-4 w-4" />
                            Water: {req.waterLevel}
                          </p>
                        )}
                        {req.createdAt && (
                          <p className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {new Date(req.createdAt).toLocaleString()}
                          </p>
                        )}
                      </div>

                      {req.description && (
                        <p className="text-sm text-gray-700 mt-2">{req.description}</p>
                      )}
                      
                      {req.address && (
                        <p className="text-xs text-gray-500 mt-2">📍 {req.address}</p>
                      )}
                      
                      {req.referenceNumber && (
                        <p className="text-xs text-gray-400 mt-1">Ref: {req.referenceNumber}</p>
                      )}
                    </div>

                    {req.latitude && req.longitude && (
                      <button
                        onClick={() => setMapCenter([req.latitude!, req.longitude!])}
                        className="px-3 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors text-sm flex items-center gap-1"
                      >
                        <MapPin className="h-4 w-4" />
                        View on Map
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {hasMore && (
                <div className="text-center pt-4">
                  <button
                    onClick={() => fetchSOSRequests(true)}
                    disabled={loading}
                    className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SOSEmergencyTrackerPage;
