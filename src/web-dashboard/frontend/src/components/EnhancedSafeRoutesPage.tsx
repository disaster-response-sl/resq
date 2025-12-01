import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ArrowLeft, AlertTriangle, MapPin, X, Locate } from 'lucide-react';
import * as turf from '@turf/turf';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

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

interface RouteSegment {
  geometry: [number, number][];
  distance: number;
  duration: number;
  steps: any[];
}

interface DangerZone {
  id: string;
  type: 'road_report' | 'sos' | 'disaster';
  severity: 'low' | 'medium' | 'high' | 'critical';
  condition: string;
  location: [number, number];
  radius: number;
  description: string;
  road_name?: string;
  district?: string;
}

interface SafetyAnalysis {
  isSafe: boolean;
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  dangerZones: DangerZone[];
  intersections: {
    zone: DangerZone;
    distanceKm: number;
  }[];
  totalDistance: number;
  estimatedDuration: number;
}

const EnhancedSafeRoutesPage: React.FC = () => {
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
  const [route, setRoute] = useState<RouteSegment | null>(null);
  const [safetyAnalysis, setSafetyAnalysis] = useState<SafetyAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  
  const fromInputRef = useRef<HTMLInputElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Debounced location search with Nominatim
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    if (fromLocation.length > 2) {
      searchTimeoutRef.current = setTimeout(() => {
        searchLocation(fromLocation, 'from');
      }, 300); // 300ms debounce
    } else {
      setFromSuggestions([]);
    }
    
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [fromLocation]);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    if (toLocation.length > 2) {
      searchTimeoutRef.current = setTimeout(() => {
        searchLocation(toLocation, 'to');
      }, 300);
    } else {
      setToSuggestions([]);
    }
    
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [toLocation]);

  // Search location using Nominatim (OpenStreetMap)
  const searchLocation = async (query: string, type: 'from' | 'to') => {
    if (query.length < 3) return;
    
    if (type === 'from') setSearchingFrom(true);
    else setSearchingTo(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `format=json` +
        `&q=${encodeURIComponent(query)}, Sri Lanka` +
        `&limit=8` +
        `&addressdetails=1` +
        `&bounded=1` +
        `&viewbox=79.5,5.9,81.9,9.9`, // Sri Lanka bounding box
        { 
          headers: { 
            'Accept': 'application/json',
            'User-Agent': 'ResQ-Disaster-Platform/2.0'
          } 
        }
      );
      
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
    } catch (error) {
      console.error('Location search error:', error);
    } finally {
      if (type === 'from') setSearchingFrom(false);
      else setSearchingTo(false);
    }
  };

  // Select location from suggestions
  const selectLocation = (suggestion: LocationSuggestion, type: 'from' | 'to') => {
    const displayName = suggestion.address?.road || 
                       suggestion.address?.suburb || 
                       suggestion.address?.city || 
                       suggestion.display_name.split(',')[0];
    
    const coords: [number, number] = [parseFloat(suggestion.lat), parseFloat(suggestion.lon)];
    
    if (type === 'from') {
      setFromLocation(displayName);
      setFromCoords(coords);
      setShowFromSuggestions(false);
    } else {
      setToLocation(displayName);
      setToCoords(coords);
      setShowToSuggestions(false);
    }
  };

  // Get current location
  const getCurrentLocation = (type: 'from' | 'to') => {
    setLoadingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
        
        // Reverse geocode to get address
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?` +
            `format=json` +
            `&lat=${coords[0]}` +
            `&lon=${coords[1]}` +
            `&addressdetails=1`,
            { 
              headers: { 
                'User-Agent': 'ResQ-Disaster-Platform/2.0'
              } 
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            const displayName = data.address?.road || 
                               data.address?.suburb || 
                               data.address?.city || 
                               'Current Location';
            
            if (type === 'from') {
              setFromLocation(displayName);
              setFromCoords(coords);
            } else {
              setToLocation(displayName);
              setToCoords(coords);
            }
            
            toast.success('📍 Location detected');
          }
        } catch (error) {
          console.error('Reverse geocode error:', error);
          if (type === 'from') {
            setFromLocation('Current Location');
            setFromCoords(coords);
          } else {
            setToLocation('Current Location');
            setToCoords(coords);
          }
        } finally {
          setLoadingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Could not get your location');
        setLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Fetch route from OSRM
  const fetchRoute = async (from: [number, number], to: [number, number]): Promise<RouteSegment | null> => {
    try {
      // OSRM uses lon,lat format (opposite of leaflet)
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/` +
        `${from[1]},${from[0]};${to[1]},${to[0]}?` +
        `overview=full&geometries=geojson&steps=true`
      );
      
      if (!response.ok) throw new Error('Route not found');
      
      const data = await response.json();
      
      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        throw new Error('No route found');
      }
      
      const route = data.routes[0];
      const geometry = route.geometry.coordinates.map((coord: number[]) => 
        [coord[1], coord[0]] as [number, number] // Convert lon,lat to lat,lon
      );
      
      return {
        geometry,
        distance: route.distance / 1000, // Convert to km
        duration: route.duration / 60, // Convert to minutes
        steps: route.legs[0].steps
      };
    } catch (error) {
      console.error('OSRM routing error:', error);
      return null;
    }
  };

  // Fetch danger zones from backend
  const fetchDangerZones = async (): Promise<DangerZone[]> => {
    const dangerZones: DangerZone[] = [];
    
    try {
      // Fetch road reports
      const roadReportsRes = await axios.get(`${API_BASE_URL}/api/public/road-reports?limit=1000`);
      const roadReports = Array.isArray(roadReportsRes.data?.data) ? roadReportsRes.data.data : 
                         Array.isArray(roadReportsRes.data) ? roadReportsRes.data : [];
      
      roadReports.forEach((report: any) => {
        if (!report.location?.coordinates) return;
        if (report.status !== 'pending' && report.status !== 'verified') return;
        
        const [lon, lat] = report.location.coordinates;
        
        // Determine radius based on condition
        let radius = 1; // Default 1km
        if (report.condition === 'blocked') radius = 2;
        if (report.condition === 'flooded') radius = 3;
        if (report.condition === 'landslide') radius = 2.5;
        
        dangerZones.push({
          id: report._id,
          type: 'road_report',
          severity: report.severity || 'medium',
          condition: report.condition,
          location: [lat, lon],
          radius,
          description: report.description || 'Road hazard reported',
          road_name: report.road_name,
          district: report.district
        });
      });
      
      // Fetch SOS reports (active disasters)
      try {
        const sosRes = await axios.get(`${API_BASE_URL}/api/public/sos-reports?limit=1000`);
        const sosReports = Array.isArray(sosRes.data) ? sosRes.data : [];
        
        sosReports.forEach((report: any) => {
          if (!report.location?.coordinates) return;
          if (report.status !== 'pending' && report.status !== 'in_progress') return;
          
          const [lon, lat] = report.location.coordinates;
          
          dangerZones.push({
            id: report._id,
            type: 'sos',
            severity: 'high',
            condition: 'emergency',
            location: [lat, lon],
            radius: 1.5,
            description: 'Active emergency zone'
          });
        });
      } catch (error) {
        console.log('SOS reports not available:', error);
      }
      
    } catch (error) {
      console.error('Error fetching danger zones:', error);
    }
    
    return dangerZones;
  };

  // Analyze route safety using Turf.js
  const analyzeRouteSafety = (routeGeometry: [number, number][], dangerZones: DangerZone[]): SafetyAnalysis => {
    // Create a LineString from route geometry
    const routeLine = turf.lineString(routeGeometry.map(coord => [coord[1], coord[0]]));
    
    const intersections: { zone: DangerZone; distanceKm: number }[] = [];
    let highestRisk: 'safe' | 'low' | 'medium' | 'high' | 'critical' = 'safe';
    
    dangerZones.forEach(zone => {
      // Create a circle around the danger zone
      const zoneCircle = turf.circle([zone.location[1], zone.location[0]], zone.radius, {
        steps: 64,
        units: 'kilometers'
      });
      
      // Check if route intersects with danger zone
      try {
        const intersects = turf.booleanIntersects(routeLine, zoneCircle);
        
        if (intersects) {
          // Calculate closest point on route to danger zone
          const zonePoint = turf.point([zone.location[1], zone.location[0]]);
          const nearestPoint = turf.nearestPointOnLine(routeLine, zonePoint);
          const distance = turf.distance(zonePoint, nearestPoint, { units: 'kilometers' });
          
          intersections.push({ zone, distanceKm: distance });
          
          // Update risk level
          if (zone.severity === 'critical' || zone.condition === 'blocked') {
            highestRisk = 'critical';
          } else if (zone.severity === 'high' && highestRisk !== 'critical') {
            highestRisk = 'high';
          } else if (zone.severity === 'medium' && highestRisk !== 'critical' && highestRisk !== 'high') {
            highestRisk = 'medium';
          } else if (zone.severity === 'low' && highestRisk === 'safe') {
            highestRisk = 'low';
          }
        }
      } catch (error) {
        console.error('Error checking intersection:', error);
      }
    });
    
    // Sort intersections by distance (closest first)
    intersections.sort((a, b) => a.distanceKm - b.distanceKm);
    
    return {
      isSafe: intersections.length === 0,
      riskLevel: highestRisk,
      dangerZones,
      intersections,
      totalDistance: turf.length(routeLine, { units: 'kilometers' }),
      estimatedDuration: 0 // Will be set from OSRM
    };
  };

  // Main route check function
  const handleCheckRoute = async () => {
    if (!fromCoords || !toCoords) {
      toast.error('Please select both locations');
      return;
    }
    
    if (fromLocation === toLocation) {
      toast.error('Please select different locations');
      return;
    }
    
    setLoading(true);
    setSafetyAnalysis(null);
    setRoute(null);
    
    try {
      // Step 1: Fetch route from OSRM
      toast.loading('🗺️ Fetching route...', { id: 'route-fetch' });
      const routeData = await fetchRoute(fromCoords, toCoords);
      
      if (!routeData) {
        toast.error('Could not find a route between these locations', { id: 'route-fetch' });
        return;
      }
      
      setRoute(routeData);
      toast.success('✓ Route found', { id: 'route-fetch' });
      
      // Step 2: Fetch danger zones
      toast.loading('🔍 Checking for hazards...', { id: 'hazard-check' });
      const dangerZones = await fetchDangerZones();
      
      // Step 3: Analyze safety with Turf.js
      const analysis = analyzeRouteSafety(routeData.geometry, dangerZones);
      analysis.estimatedDuration = routeData.duration;
      
      setSafetyAnalysis(analysis);
      
      if (analysis.isSafe) {
        toast.success(`✅ Route is safe! ${routeData.distance.toFixed(1)} km, ~${Math.round(routeData.duration)} min`, { 
          id: 'hazard-check',
          duration: 5000 
        });
      } else {
        toast.error(`⚠️ ${analysis.intersections.length} hazard(s) detected on route`, { 
          id: 'hazard-check',
          duration: 5000 
        });
      }
      
    } catch (error) {
      console.error('Route check error:', error);
      toast.error('Failed to check route safety', { id: 'route-fetch' });
    } finally {
      setLoading(false);
    }
  };

  // Clear location
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

  // Swap locations
  const swapLocations = () => {
    const tempLocation = fromLocation;
    const tempCoords = fromCoords;
    
    setFromLocation(toLocation);
    setFromCoords(toCoords);
    setToLocation(tempLocation);
    setToCoords(tempCoords);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate('/citizen/route-watch')}
            className="flex items-center text-white hover:text-blue-100 mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to RouteWatch
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <MapPin className="h-8 w-8 mr-3" />
              <div>
                <h1 className="text-3xl font-bold">Smart Route Planner</h1>
                <p className="text-blue-100 mt-1">Google Maps-like search • Real-time hazard detection • Powered by OSRM + Turf.js</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">🗺️ Plan Your Safe Route</h2>
          
          <div className="space-y-4">
            {/* From Location */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📍 Starting Point
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    ref={fromInputRef}
                    type="text"
                    value={fromLocation}
                    onChange={(e) => setFromLocation(e.target.value)}
                    onFocus={() => fromSuggestions.length > 0 && setShowFromSuggestions(true)}
                    placeholder="Type any location (e.g., Galle Fort, Colombo Airport, Kandy Temple)"
                    className="w-full px-4 py-3 pr-24 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                    {searchingFrom && (
                      <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    )}
                    {fromLocation && (
                      <button
                        onClick={() => clearLocation('from')}
                        className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                        type="button"
                      >
                        <X className="h-4 w-4 text-gray-500" />
                      </button>
                    )}
                  </div>
                  
                  {/* From Suggestions Dropdown */}
                  {showFromSuggestions && fromSuggestions.length > 0 && (
                    <div className="absolute z-50 mt-2 w-full bg-white border-2 border-blue-200 rounded-xl shadow-2xl max-h-80 overflow-y-auto">
                      {fromSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.place_id}
                          onClick={() => selectLocation(suggestion, 'from')}
                          className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b last:border-b-0 transition-colors"
                          type="button"
                        >
                          <div className="flex items-start">
                            <MapPin className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {suggestion.address?.road || suggestion.address?.suburb || suggestion.address?.city || suggestion.display_name.split(',')[0]}
                              </p>
                              <p className="text-xs text-gray-500 truncate mt-0.5">
                                {suggestion.display_name}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => getCurrentLocation('from')}
                  disabled={loadingLocation}
                  className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:bg-gray-300 flex items-center gap-2"
                  title="Use current location"
                >
                  <Locate className="h-5 w-5" />
                </button>
              </div>
              
              {fromCoords && (
                <p className="text-xs text-green-600 mt-2 font-medium">
                  ✓ Location locked: {fromCoords[0].toFixed(5)}, {fromCoords[1].toFixed(5)}
                </p>
              )}
            </div>

            {/* Swap Button */}
            <div className="flex justify-center">
              <button
                onClick={swapLocations}
                disabled={!fromLocation || !toLocation}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-30"
                title="Swap locations"
              >
                <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </button>
            </div>

            {/* To Location */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🎯 Destination
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    ref={toInputRef}
                    type="text"
                    value={toLocation}
                    onChange={(e) => setToLocation(e.target.value)}
                    onFocus={() => toSuggestions.length > 0 && setShowToSuggestions(true)}
                    placeholder="Type any destination (e.g., Sigiriya Rock, Ella Railway Station)"
                    className="w-full px-4 py-3 pr-24 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                    {searchingTo && (
                      <div className="animate-spin h-5 w-5 border-2 border-green-500 border-t-transparent rounded-full"></div>
                    )}
                    {toLocation && (
                      <button
                        onClick={() => clearLocation('to')}
                        className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                        type="button"
                      >
                        <X className="h-4 w-4 text-gray-500" />
                      </button>
                    )}
                  </div>
                  
                  {/* To Suggestions Dropdown */}
                  {showToSuggestions && toSuggestions.length > 0 && (
                    <div className="absolute z-50 mt-2 w-full bg-white border-2 border-green-200 rounded-xl shadow-2xl max-h-80 overflow-y-auto">
                      {toSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.place_id}
                          onClick={() => selectLocation(suggestion, 'to')}
                          className="w-full text-left px-4 py-3 hover:bg-green-50 border-b last:border-b-0 transition-colors"
                          type="button"
                        >
                          <div className="flex items-start">
                            <MapPin className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {suggestion.address?.road || suggestion.address?.suburb || suggestion.address?.city || suggestion.display_name.split(',')[0]}
                              </p>
                              <p className="text-xs text-gray-500 truncate mt-0.5">
                                {suggestion.display_name}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => getCurrentLocation('to')}
                  disabled={loadingLocation}
                  className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors disabled:bg-gray-300 flex items-center gap-2"
                  title="Use current location"
                >
                  <Locate className="h-5 w-5" />
                </button>
              </div>
              
              {toCoords && (
                <p className="text-xs text-green-600 mt-2 font-medium">
                  ✓ Location locked: {toCoords[0].toFixed(5)}, {toCoords[1].toFixed(5)}
                </p>
              )}
            </div>

            {/* Check Route Button */}
            <button
              onClick={handleCheckRoute}
              disabled={loading || !fromCoords || !toCoords}
              className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white py-4 rounded-xl hover:from-blue-700 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed font-bold text-lg transition-all transform hover:scale-[1.02] disabled:scale-100 shadow-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  Analyzing Route Safety...
                </span>
              ) : (
                '🔍 Check Route Safety'
              )}
            </button>
          </div>
        </div>

        {/* Route Info */}
        {route && safetyAnalysis && (
          <div className="space-y-6">
            {/* Safety Overview Card */}
            <div className={`rounded-2xl shadow-xl p-8 ${
              safetyAnalysis.isSafe 
                ? 'bg-gradient-to-r from-green-500 to-green-600' 
                : 'bg-gradient-to-r from-orange-500 to-red-500'
            } text-white`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {safetyAnalysis.isSafe ? (
                    <>
                      <h3 className="text-3xl font-bold mb-2">✅ Route is Safe!</h3>
                      <p className="text-green-50 text-lg">
                        No hazards detected on your route from <strong>{fromLocation}</strong> to <strong>{toLocation}</strong>
                      </p>
                    </>
                  ) : (
                    <>
                      <h3 className="text-3xl font-bold mb-2">⚠️ Hazards Detected</h3>
                      <p className="text-orange-50 text-lg">
                        Found <strong>{safetyAnalysis.intersections.length}</strong> hazard(s) along your route
                      </p>
                    </>
                  )}
                </div>
                <div className={`px-6 py-3 rounded-xl text-sm font-bold border-2 ${
                  safetyAnalysis.isSafe ? 'bg-white/20 border-white/40' : 'bg-white/20 border-white/40'
                }`}>
                  RISK: {safetyAnalysis.riskLevel.toUpperCase()}
                </div>
              </div>
              
              {/* Route Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-white/20 backdrop-blur rounded-xl p-4">
                  <p className="text-sm opacity-90">Distance</p>
                  <p className="text-2xl font-bold">{route.distance.toFixed(1)} km</p>
                </div>
                <div className="bg-white/20 backdrop-blur rounded-xl p-4">
                  <p className="text-sm opacity-90">Duration</p>
                  <p className="text-2xl font-bold">~{Math.round(route.duration)} min</p>
                </div>
                <div className="bg-white/20 backdrop-blur rounded-xl p-4">
                  <p className="text-sm opacity-90">Avg Speed</p>
                  <p className="text-2xl font-bold">{Math.round((route.distance / route.duration) * 60)} km/h</p>
                </div>
                <div className="bg-white/20 backdrop-blur rounded-xl p-4">
                  <p className="text-sm opacity-90">Hazards</p>
                  <p className="text-2xl font-bold">{safetyAnalysis.intersections.length}</p>
                </div>
              </div>
            </div>

            {/* Hazards List */}
            {safetyAnalysis.intersections.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                  Hazards Along Your Route
                </h3>
                
                <div className="space-y-4">
                  {safetyAnalysis.intersections.map((intersection, index) => {
                    const zone = intersection.zone;
                    return (
                      <div key={zone.id} className="bg-red-50 border-2 border-red-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-2xl">{index + 1}</span>
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                zone.severity === 'critical' ? 'bg-red-600 text-white' :
                                zone.severity === 'high' ? 'bg-orange-600 text-white' :
                                zone.severity === 'medium' ? 'bg-yellow-600 text-white' :
                                'bg-blue-600 text-white'
                              }`}>
                                {zone.severity.toUpperCase()}
                              </span>
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                                {zone.condition.toUpperCase()}
                              </span>
                            </div>
                            <h4 className="text-lg font-bold text-gray-900">
                              {zone.road_name || 'Road Hazard'}
                            </h4>
                            <p className="text-gray-700 mt-1">{zone.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                              {zone.district && (
                                <span>📍 {zone.district}</span>
                              )}
                              <span>📏 {intersection.distanceKm.toFixed(2)} km from route</span>
                              <span>⚠️ {zone.radius} km danger zone</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* View on Map Button */}
            <div className="flex justify-center">
              <button
                onClick={() => {
                  navigate('/citizen/route-map', {
                    state: {
                      fromCoords,
                      toCoords,
                      fromLocation,
                      toLocation,
                      route: route.geometry,
                      safetyAnalysis
                    }
                  });
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-colors shadow-lg flex items-center gap-2"
              >
                <MapPin className="h-6 w-6" />
                View Interactive Map
              </button>
            </div>
          </div>
        )}

        {/* Instructions */}
        {!route && !safetyAnalysis && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">🎯 How It Works</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6">
                <div className="text-4xl mb-3">🔍</div>
                <h4 className="font-bold text-lg mb-2">Smart Search</h4>
                <p className="text-gray-600">Type any location - streets, landmarks, cities. Powered by OpenStreetMap Nominatim.</p>
              </div>
              <div className="bg-white rounded-xl p-6">
                <div className="text-4xl mb-3">🛣️</div>
                <h4 className="font-bold text-lg mb-2">OSRM Routing</h4>
                <p className="text-gray-600">Get accurate driving routes with real distance and duration estimates.</p>
              </div>
              <div className="bg-white rounded-xl p-6">
                <div className="text-4xl mb-3">🛡️</div>
                <h4 className="font-bold text-lg mb-2">Turf.js Safety</h4>
                <p className="text-gray-600">Advanced geospatial analysis checks if your route crosses any reported hazards.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedSafeRoutesPage;
