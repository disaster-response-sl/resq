import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Navigation, ArrowLeft, AlertTriangle, MapPin, Clock, TrendingUp, Search, X } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

interface SafeRoute {
  _id: string;
  route_id: string;
  route_name: string;
  route_type: string;
  start_location: {
    name: string;
    coordinates: [number, number];
  };
  end_location: {
    name: string;
    coordinates: [number, number];
  };
  distance_km: number;
  typical_travel_time_minutes: number;
  current_travel_time_minutes: number;
  status: string;
  severity: string;
  traffic_density: string;
  risk_level: string;
  alternative_routes_available: boolean;
}

const AVOID_CONDITIONS = [
  { value: 'blocked', label: 'Blocked Roads' },
  { value: 'flooded', label: 'Flooded Areas' },
  { value: 'landslide', label: 'Landslide Zones' },
  { value: 'hazardous', label: 'Hazardous Conditions' },
  { value: 'damaged', label: 'Damaged Roads' }
];

interface LocationSuggestion {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  address?: {
    road?: string;
    suburb?: string;
    city?: string;
    county?: string;
    state?: string;
  };
}

const SafeRoutesPage: React.FC = () => {
  const navigate = useNavigate();
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [fromCoords, setFromCoords] = useState<[number, number] | null>(null);
  const [toCoords, setToCoords] = useState<[number, number] | null>(null);
  const [fromSuggestions, setFromSuggestions] = useState<LocationSuggestion[]>([]);
  const [toSuggestions, setToSuggestions] = useState<LocationSuggestion[]>([]);
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const [searchingFrom, setSearchingFrom] = useState(false);
  const [searchingTo, setSearchingTo] = useState(false);
  const fromInputRef = useRef<HTMLInputElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);
  const [avoidConditions, setAvoidConditions] = useState<string[]>(['blocked', 'flooded']);
  const [safeRoutes, setSafeRoutes] = useState<SafeRoute[]>([]);
  const [roadIssues, setRoadIssues] = useState<any[]>([]);
  const [disasterZones, setDisasterZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Debounce location search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (fromLocation.length > 2) {
        searchLocation(fromLocation, 'from');
      } else {
        setFromSuggestions([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [fromLocation]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (toLocation.length > 2) {
        searchLocation(toLocation, 'to');
      } else {
        setToSuggestions([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [toLocation]);

  const searchLocation = async (query: string, type: 'from' | 'to') => {
    if (query.length < 3) return;
    
    if (type === 'from') setSearchingFrom(true);
    else setSearchingTo(true);

    // Create abort controller with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)},Sri Lanka&limit=5&addressdetails=1`,
        { 
          signal: controller.signal,
          headers: { 
            'Accept': 'application/json',
            'User-Agent': 'ResQ-Disaster-Platform/1.0'
          } 
        }
      );
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        if (type === 'from') {
          setFromSuggestions(data);
          setShowFromSuggestions(true);
        } else {
          setToSuggestions(data);
          setShowToSuggestions(true);
        }
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error('Location search error:', error);
      // Don't show error to user, just log it
    } finally {
      if (type === 'from') setSearchingFrom(false);
      else setSearchingTo(false);
    }
  };

  const selectLocation = (suggestion: LocationSuggestion, type: 'from' | 'to') => {
    const displayName = suggestion.address?.road || suggestion.address?.suburb || 
                       suggestion.address?.city || suggestion.display_name.split(',')[0];
    
    if (type === 'from') {
      setFromLocation(displayName);
      setFromCoords([parseFloat(suggestion.lat), parseFloat(suggestion.lon)]);
      setShowFromSuggestions(false);
    } else {
      setToLocation(displayName);
      setToCoords([parseFloat(suggestion.lat), parseFloat(suggestion.lon)]);
      setShowToSuggestions(false);
    }
  };

  const clearLocation = (type: 'from' | 'to') => {
    if (type === 'from') {
      setFromLocation('');
      setFromCoords(null);
      setFromSuggestions([]);
      fromInputRef.current?.focus();
    } else {
      setToLocation('');
      setToCoords(null);
      setToSuggestions([]);
      toInputRef.current?.focus();
    }
  };

  // Calculate distance between two coordinates in km (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const toggleCondition = (condition: string) => {
    if (avoidConditions.includes(condition)) {
      setAvoidConditions(avoidConditions.filter(c => c !== condition));
    } else {
      setAvoidConditions([...avoidConditions, condition]);
    }
  };

  const handleSearch = async () => {
    if (!fromLocation || !toLocation) {
      toast.error('Please enter both origin and destination locations');
      return;
    }

    if (!fromCoords || !toCoords) {
      toast.error('Please select locations from the suggestions');
      return;
    }

    if (fromLocation === toLocation) {
      toast.error('Origin and destination must be different');
      return;
    }

    setLoading(true);
    setSearched(true);
    
    try {
      // Get all road reports to identify problem areas
      const roadReportsResponse = await axios.get(`${API_BASE_URL}/api/public/road-reports?limit=1000`);
      const allRoadReports = Array.isArray(roadReportsResponse.data?.data) ? roadReportsResponse.data.data : 
                            Array.isArray(roadReportsResponse.data) ? roadReportsResponse.data : [];
      
      // Get SOS reports to check for disaster zones
      let sosReports: any[] = [];
      try {
        const sosResponse = await axios.get(`${API_BASE_URL}/api/public/sos-reports?limit=1000`);
        sosReports = Array.isArray(sosResponse.data) ? sosResponse.data : [];
      } catch (sosError) {
        console.log('SOS reports endpoint not available:', sosError);
      }
      
      // Filter road reports within 50km radius of the route
      const relevantRoadReports = allRoadReports.filter((report: any) => {
        if (!report.location?.coordinates) return false;
        if (!avoidConditions.includes(report.condition)) return false;
        if (report.status !== 'pending' && report.status !== 'verified') return false;
        
        const [reportLon, reportLat] = report.location.coordinates;
        
        // Check if report is near the route (within 50km of either endpoint)
        const distanceFromStart = calculateDistance(
          fromCoords![0], fromCoords![1], reportLat, reportLon
        );
        const distanceFromEnd = calculateDistance(
          toCoords![0], toCoords![1], reportLat, reportLon
        );
        
        return distanceFromStart < 50 || distanceFromEnd < 50;
      });
      
      // Filter SOS reports near the route (within 50km of either endpoint)
      const relevantSosReports = sosReports.filter((report: any) => {
        if (!report.location?.coordinates) return false;
        if (report.status !== 'pending' && report.status !== 'in_progress') return false;
        
        const [reportLon, reportLat] = report.location.coordinates;
        const distanceFromStart = calculateDistance(
          fromCoords![0], fromCoords![1], reportLat, reportLon
        );
        const distanceFromEnd = calculateDistance(
          toCoords![0], toCoords![1], reportLat, reportLon
        );
        
        return distanceFromStart < 50 || distanceFromEnd < 50;
      });
      
      const totalIssues = relevantRoadReports.length + relevantSosReports.length;
      
      // Store the issues for display
      setRoadIssues(relevantRoadReports);
      setDisasterZones(relevantSosReports);
      
      if (totalIssues === 0) {
        toast.success(`✅ No reported hazards near your route from ${fromLocation} to ${toLocation}`);
      } else {
        const messages: string[] = [];
        if (relevantRoadReports.length > 0) {
          messages.push(`${relevantRoadReports.length} road issue(s)`);
        }
        if (relevantSosReports.length > 0) {
          messages.push(`${relevantSosReports.length} disaster zone(s)`);
        }
        toast(`⚠️ Found ${messages.join(' and ')} near your route`, { icon: '⚠️', duration: 5000 });
      }
      
      // For now, we'll show a message about crowdsourced data
      setSafeRoutes([]);
    } catch (error) {
      console.error('Error checking road conditions:', error);
      toast.error('Failed to check road conditions');
      setSafeRoutes([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'partially_blocked': return 'bg-yellow-100 text-yellow-800';
      case 'hazardous': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      case 'extreme': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getDelayPercentage = (route: SafeRoute) => {
    if (!route.typical_travel_time_minutes || !route.current_travel_time_minutes) return 0;
    return ((route.current_travel_time_minutes - route.typical_travel_time_minutes) / route.typical_travel_time_minutes * 100);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate('/citizen/route-watch')}
            className="flex items-center text-white hover:text-green-100 mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to RouteWatch
          </button>
          <div className="flex items-center">
            <Navigation className="h-8 w-8 mr-3" />
            <div>
              <h1 className="text-3xl font-bold">Check Road Conditions</h1>
              <p className="text-green-100 mt-1">Search any location in Sri Lanka - like PickMe or Google Maps</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search Form */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Plan Your Route</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* From Location */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="h-4 w-4 inline mr-1" />
                From Location
              </label>
              <div className="relative">
                <input
                  ref={fromInputRef}
                  type="text"
                  value={fromLocation}
                  onChange={(e) => setFromLocation(e.target.value)}
                  onFocus={() => setShowFromSuggestions(true)}
                  placeholder="Search for a place (e.g., Galle Fort, Colombo Airport)"
                  className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                  {searchingFrom && (
                    <div className="animate-spin h-4 w-4 border-2 border-green-500 border-t-transparent rounded-full"></div>
                  )}
                  {fromLocation && (
                    <button
                      onClick={() => clearLocation('from')}
                      className="p-1 hover:bg-gray-100 rounded"
                      type="button"
                    >
                      <X className="h-4 w-4 text-gray-500" />
                    </button>
                  )}
                </div>
              </div>
              
              {/* From Suggestions Dropdown */}
              {showFromSuggestions && fromSuggestions.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {fromSuggestions.map((suggestion) => (
                    <button
                      key={suggestion.place_id}
                      onClick={() => selectLocation(suggestion, 'from')}
                      className="w-full text-left px-4 py-3 hover:bg-green-50 border-b last:border-b-0 transition-colors"
                      type="button"
                    >
                      <div className="flex items-start">
                        <MapPin className="h-4 w-4 text-green-600 mr-2 mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {suggestion.address?.road || suggestion.address?.suburb || suggestion.address?.city || suggestion.display_name.split(',')[0]}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {suggestion.display_name}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {fromCoords && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Location selected: {fromCoords[0].toFixed(4)}, {fromCoords[1].toFixed(4)}
                </p>
              )}
            </div>

            {/* To Location */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="h-4 w-4 inline mr-1" />
                To Location
              </label>
              <div className="relative">
                <input
                  ref={toInputRef}
                  type="text"
                  value={toLocation}
                  onChange={(e) => setToLocation(e.target.value)}
                  onFocus={() => setShowToSuggestions(true)}
                  placeholder="Search for a destination (e.g., Kandy Temple, Sigiriya)"
                  className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                  {searchingTo && (
                    <div className="animate-spin h-4 w-4 border-2 border-green-500 border-t-transparent rounded-full"></div>
                  )}
                  {toLocation && (
                    <button
                      onClick={() => clearLocation('to')}
                      className="p-1 hover:bg-gray-100 rounded"
                      type="button"
                    >
                      <X className="h-4 w-4 text-gray-500" />
                    </button>
                  )}
                </div>
              </div>
              
              {/* To Suggestions Dropdown */}
              {showToSuggestions && toSuggestions.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {toSuggestions.map((suggestion) => (
                    <button
                      key={suggestion.place_id}
                      onClick={() => selectLocation(suggestion, 'to')}
                      className="w-full text-left px-4 py-3 hover:bg-green-50 border-b last:border-b-0 transition-colors"
                      type="button"
                    >
                      <div className="flex items-start">
                        <MapPin className="h-4 w-4 text-green-600 mr-2 mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {suggestion.address?.road || suggestion.address?.suburb || suggestion.address?.city || suggestion.display_name.split(',')[0]}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {suggestion.display_name}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {toCoords && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Location selected: {toCoords[0].toFixed(4)}, {toCoords[1].toFixed(4)}
                </p>
              )}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Avoid Conditions (select all that apply)
            </label>
            <div className="flex flex-wrap gap-2">
              {AVOID_CONDITIONS.map(condition => (
                <button
                  key={condition.value}
                  onClick={() => toggleCondition(condition.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    avoidConditions.includes(condition.value)
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {condition.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSearch}
            disabled={loading || !fromLocation || !toLocation || !fromCoords || !toCoords}
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {loading ? 'Checking Road Conditions...' : 'Check Road Safety'}
          </button>
        </div>

        {/* Results */}
        {searched && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {safeRoutes.length > 0 ? 'Recommended Routes' : 'No Routes Found'}
            </h2>

            {safeRoutes.length === 0 ? (
              <div className="space-y-6">
                {/* Warning Summary */}
                <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl shadow-lg p-6 text-white">
                  <div className="flex items-start">
                    <AlertTriangle className="h-8 w-8 mr-4 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-2xl font-bold mb-2">⚠️ Travel Not Recommended</h3>
                      <p className="text-orange-50 text-lg">
                        Found {roadIssues.length + disasterZones.length} hazard(s) near your route from <strong>{fromLocation}</strong> to <strong>{toLocation}</strong>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Road Issues */}
                {roadIssues.length > 0 && (
                  <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="bg-red-50 px-6 py-4 border-b border-red-100">
                      <h4 className="text-lg font-bold text-red-900 flex items-center">
                        🚧 Road Issues ({roadIssues.length})
                      </h4>
                    </div>
                    <div className="divide-y divide-gray-200">
                      {roadIssues.map((issue, index) => {
                        const [reportLon, reportLat] = issue.location.coordinates;
                        const distanceFromStart = calculateDistance(
                          fromCoords![0], fromCoords![1], reportLat, reportLon
                        );
                        const distanceFromEnd = calculateDistance(
                          toCoords![0], toCoords![1], reportLat, reportLon
                        );
                        const nearestPoint = distanceFromStart < distanceFromEnd ? fromLocation : toLocation;
                        const distance = Math.min(distanceFromStart, distanceFromEnd).toFixed(1);
                        
                        return (
                          <div key={issue._id || index} className="p-6 hover:bg-gray-50 transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                    issue.severity === 'critical' ? 'bg-red-100 text-red-800' :
                                    issue.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                                    issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-blue-100 text-blue-800'
                                  }`}>
                                    {issue.severity?.toUpperCase() || 'MEDIUM'}
                                  </span>
                                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                    issue.condition === 'blocked' ? 'bg-red-100 text-red-800' :
                                    issue.condition === 'flooded' ? 'bg-blue-100 text-blue-800' :
                                    issue.condition === 'landslide' ? 'bg-yellow-100 text-yellow-800' :
                                    issue.condition === 'damaged' ? 'bg-orange-100 text-orange-800' :
                                    'bg-purple-100 text-purple-800'
                                  }`}>
                                    {issue.condition === 'blocked' ? '🚧 BLOCKED' :
                                     issue.condition === 'flooded' ? '🌊 FLOODED' :
                                     issue.condition === 'landslide' ? '⛰️ LANDSLIDE' :
                                     issue.condition === 'damaged' ? '🔨 DAMAGED' :
                                     '⚠️ HAZARDOUS'}
                                  </span>
                                </div>
                                <h5 className="text-lg font-semibold text-gray-900 mb-2">
                                  {issue.road_name || issue.location_name || 'Unnamed Road'}
                                </h5>
                                {issue.description && (
                                  <p className="text-gray-700 mb-2">{issue.description}</p>
                                )}
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <span className="flex items-center">
                                    <MapPin className="h-4 w-4 mr-1" />
                                    {distance} km from {nearestPoint}
                                  </span>
                                  {issue.district && (
                                    <span>📍 {issue.district}</span>
                                  )}
                                  {issue.traffic_status && (
                                    <span className="capitalize">🚦 {issue.traffic_status}</span>
                                  )}
                                </div>
                                {issue.emergency_vehicles_accessible === false && (
                                  <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-2 text-sm text-red-700">
                                    ⚠️ Emergency vehicles cannot access this area
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Disaster Zones */}
                {disasterZones.length > 0 && (
                  <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="bg-red-600 px-6 py-4 border-b">
                      <h4 className="text-lg font-bold text-white flex items-center">
                        🚨 Active Disaster Zones ({disasterZones.length})
                      </h4>
                    </div>
                    <div className="divide-y divide-gray-200">
                      {disasterZones.map((zone, index) => {
                        const [reportLon, reportLat] = zone.location.coordinates;
                        const distanceFromStart = calculateDistance(
                          fromCoords![0], fromCoords![1], reportLat, reportLon
                        );
                        const distanceFromEnd = calculateDistance(
                          toCoords![0], toCoords![1], reportLat, reportLon
                        );
                        const nearestPoint = distanceFromStart < distanceFromEnd ? fromLocation : toLocation;
                        const distance = Math.min(distanceFromStart, distanceFromEnd).toFixed(1);
                        
                        return (
                          <div key={zone._id || index} className="p-6 hover:bg-gray-50 transition-colors">
                            <div className="flex items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                                    🚨 EMERGENCY
                                  </span>
                                  {zone.disaster_type && (
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800">
                                      {zone.disaster_type.toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <h5 className="text-lg font-semibold text-gray-900 mb-2">
                                  {zone.location_name || 'Emergency Zone'}
                                </h5>
                                {zone.message && (
                                  <p className="text-gray-700 mb-2">{zone.message}</p>
                                )}
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <span className="flex items-center">
                                    <MapPin className="h-4 w-4 mr-1" />
                                    {distance} km from {nearestPoint}
                                  </span>
                                  {zone.district && (
                                    <span>📍 {zone.district}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Safety Recommendations */}
                <div className="bg-blue-50 rounded-xl shadow-md p-6 border border-blue-200">
                  <h4 className="text-lg font-bold text-blue-900 mb-3 flex items-center">
                    💡 Safety Recommendations
                  </h4>
                  <ul className="space-y-2 text-blue-800">
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Consider postponing your travel until conditions improve</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Try selecting different locations to find safer routes</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Monitor real-time updates and check conditions before departure</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Keep emergency contacts handy: 117 (Emergency), 119 (Police), 110 (Fire), 108 (Ambulance)</span>
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {safeRoutes.map((route, index) => {
                  const delay = getDelayPercentage(route);
                  return (
                    <div key={route._id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start">
                          <div className="bg-green-100 text-green-600 rounded-full w-10 h-10 flex items-center justify-center font-bold mr-4">
                            {index + 1}
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">{route.route_name}</h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {route.start_location.name} → {route.end_location.name}
                            </p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(route.status)}`}>
                          {route.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center">
                          <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                          <div>
                            <p className="text-xs text-gray-500">Distance</p>
                            <p className="font-semibold">{route.distance_km} km</p>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <Clock className="h-5 w-5 text-gray-400 mr-2" />
                          <div>
                            <p className="text-xs text-gray-500">Travel Time</p>
                            <p className="font-semibold">
                              {Math.floor((route.current_travel_time_minutes || route.typical_travel_time_minutes) / 60)}h{' '}
                              {(route.current_travel_time_minutes || route.typical_travel_time_minutes) % 60}m
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <TrendingUp className="h-5 w-5 text-gray-400 mr-2" />
                          <div>
                            <p className="text-xs text-gray-500">Traffic</p>
                            <p className="font-semibold capitalize">{route.traffic_density}</p>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <AlertTriangle className="h-5 w-5 text-gray-400 mr-2" />
                          <div>
                            <p className="text-xs text-gray-500">Risk Level</p>
                            <p className={`font-semibold capitalize ${getRiskColor(route.risk_level)}`}>
                              {route.risk_level}
                            </p>
                          </div>
                        </div>
                      </div>

                      {delay > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                          <p className="text-sm text-yellow-800">
                            ⚠️ Current delay: {delay.toFixed(0)}% longer than usual
                            ({Math.floor((route.current_travel_time_minutes - route.typical_travel_time_minutes) / 60)}h{' '}
                            {(route.current_travel_time_minutes - route.typical_travel_time_minutes) % 60}m extra)
                          </p>
                        </div>
                      )}

                      {route.alternative_routes_available && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-sm text-blue-800">
                            ℹ️ Alternative routes available for this path
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SafeRoutesPage;
