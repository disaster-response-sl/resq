import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Map as MapIcon, ArrowLeft, AlertTriangle, Droplets, Zap, AlertCircle } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
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

interface Location {
  lat: number;
  lng: number;
}

interface Disaster {
  _id: string;
  name: string;
  type: string;
  severity: string;
  location: {
    lat: number;
    lng: number;
  };
  affected_radius: number;
  status: string;
}

interface FloodData {
  id: string;
  location: string;
  severity: string;
  water_level: number;
  lat: number;
  lng: number;
  timestamp: string;
  alert_status?: string;
  rising_or_falling?: string;
  remarks?: string;
}

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
}

interface SOSSignal {
  _id: string;
  location: {
    lat: number;
    lng: number;
  };
  message: string;
  priority: string;
  status: string;
  timestamp: string;
}

// Component to update map view
const ChangeView: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  map.setView(center, zoom);
  return null;
};

const CitizenMapPage: React.FC = () => {
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [disasters, setDisasters] = useState<Disaster[]>([]);
  const [floodData, setFloodData] = useState<FloodData[]>([]);
  const [reliefCamps, setReliefCamps] = useState<ReliefCamp[]>([]);
  const [sosSignals, setSOSSignals] = useState<SOSSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFloods, setShowFloods] = useState(true);
  const [showDisasters, setShowDisasters] = useState(true);
  const [showReliefCamps, setShowReliefCamps] = useState(true);
  const [showSOSSignals, setShowSOSSignals] = useState(true);

  useEffect(() => {
    getCurrentLocation();
    fetchDisasters();
    fetchFloodData();
    fetchReliefCamps();
    fetchSOSSignals();
  }, []);

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
        }
      );
    } else {
      setUserLocation({ lat: 6.9271, lng: 79.8612 });
    }
  };

  const fetchDisasters = async () => {
    try {
      // HYBRID DATA MODEL: Fetch from MongoDB disasters
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/public/disasters`
      );

      if (response.data.success) {
        const mongoDisasters = response.data.data.filter((d: Disaster) => d.status === 'active');
        setDisasters(mongoDisasters);
        console.log(`✅ Loaded ${mongoDisasters.length} disasters from MongoDB`);
      }
    } catch (error) {
      console.error('Disasters fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFloodData = async () => {
    try {
      // Use the real Sri Lanka Flood Data API
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/public/flood-alerts`
      );

      if (response.data.success && response.data.data) {
        // Transform the data to our format
        const floods = response.data.data.map((item: any) => ({
          id: item.id || item.station_name,
          location: `${item.station_name} - ${item.river_name}`,
          severity: item.severity,
          water_level: item.water_level || 0,
          lat: item.lat,
          lng: item.lng,
          timestamp: item.timestamp,
          alert_status: item.alert_status,
          rising_or_falling: item.rising_or_falling,
          remarks: item.remarks
        }));
        setFloodData(floods);
        console.log(`Loaded ${floods.length} real-time flood alerts from DMC`);
      }
    } catch (error) {
      console.error('Flood data fetch error:', error);
      toast.error('Unable to fetch real-time flood data');
    }
  };

  const fetchSOSSignals = async () => {
    try {
      // HYBRID DATA MODEL: Fetch MongoDB SOS signals from user submissions
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/public/sos-signals?status=pending&limit=100`
      );
      if (response.data.success) {
        setSOSSignals(response.data.data);
        console.log(`✅ Loaded ${response.data.data.length} SOS signals from MongoDB`);
      }
    } catch (error) {
      console.error('SOS signals fetch error:', error);
    }
  };

  const fetchReliefCamps = async () => {
    try {
      // Fetch real relief camp data from Supabase Public API
      const params = new URLSearchParams();
      params.append('type', 'requests'); // Get help requests (relief camps)
      params.append('status', 'pending'); // Only active camps
      params.append('limit', '100');
      
      if (userLocation) {
        params.append('lat', userLocation.lat.toString());
        params.append('lng', userLocation.lng.toString());
        params.append('radius_km', '100'); // 100km radius
        params.append('sort', 'distance');
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/public/relief-camps?${params.toString()}`
      );

      if (response.data.success && response.data.data) {
        const camps = (response.data.data.requests || []).map((item: any) => ({
          id: item.id,
          full_name: item.full_name,
          address: item.address,
          latitude: item.latitude,
          longitude: item.longitude,
          establishment_type: item.establishment_type,
          num_men: item.num_men,
          num_women: item.num_women,
          num_children: item.num_children,
          urgency: item.urgency,
          status: item.status,
          assistance_types: item.assistance_types || [],
          distance_km: item.distance_km
        }));
        setReliefCamps(camps);
        console.log(`Loaded ${camps.length} relief camps from Supabase`);
      }
    } catch (error) {
      console.error('Relief camps fetch error:', error);
      // Don't show error toast - relief camps are optional
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity.toLowerCase()) {
      case 'critical':
      case 'high':
        return '#dc2626'; // red-600
      case 'medium':
        return '#f59e0b'; // amber-500
      case 'low':
        return '#3b82f6'; // blue-600
      default:
        return '#6b7280'; // gray-500
    }
  };

  const getRadiusMultiplier = (severity: string): number => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 3000;
      case 'high':
        return 2000;
      case 'medium':
        return 1000;
      default:
        return 500;
    }
  };

  // Custom icons
  const createCustomIcon = (color: string, icon: string) => {
    return L.divIcon({
      html: `<div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); font-size: 18px;">${icon}</div>`,
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
    });
  };

  const userIcon = createCustomIcon('#3b82f6', '📍');
  const floodIcon = (severity: string) => createCustomIcon(getSeverityColor(severity), '🌊');
  const reliefIcon = (urgency: string) => {
    const color = urgency === 'emergency' ? '#dc2626' : 
                  urgency === 'high' ? '#f59e0b' : 
                  urgency === 'medium' ? '#3b82f6' : '#10b981';
    return createCustomIcon(color, '⛺');
  };
  const disasterIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      flood: '🌊',
      earthquake: '🌍',
      cyclone: '🌪️',
      landslide: '⛰️',
      fire: '🔥',
    };
    return createCustomIcon('#dc2626', icons[type.toLowerCase()] || '⚠️');
  };

  const defaultCenter: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : [6.9271, 79.8612];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/citizen')}
                className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div className="flex items-center space-x-3">
                <MapIcon className="h-8 w-8" />
                <div>
                  <h1 className="text-2xl font-bold">Risk Map</h1>
                  <p className="text-blue-100 text-sm">Real-time disaster zones and flood alerts</p>
                </div>
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

      {/* Controls */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showDisasters}
                onChange={(e) => setShowDisasters(e.target.checked)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm font-medium text-gray-700">Disasters</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showFloods}
                onChange={(e) => setShowFloods(e.target.checked)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm font-medium text-gray-700">Floods (DMC)</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showSOSSignals}
                onChange={(e) => setShowSOSSignals(e.target.checked)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm font-medium text-gray-700">SOS Signals</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showReliefCamps}
                onChange={(e) => setShowReliefCamps(e.target.checked)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm font-medium text-gray-700">Relief Camps</span>
            </label>
            <button
              onClick={() => {
                fetchDisasters();
                fetchFloodData();
                fetchReliefCamps();
                toast.success('Map data refreshed');
              }}
              className="ml-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Refresh Data
            </button>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative" style={{ minHeight: '600px' }}>
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading map data...</p>
            </div>
          </div>
        ) : (
          <MapContainer
            center={defaultCenter}
            zoom={10}
            style={{ height: '100%', width: '100%', minHeight: '600px' }}
          >
            <ChangeView center={defaultCenter} zoom={10} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* User Location */}
            {userLocation && (
              <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
                <Popup>
                  <div className="text-center">
                    <p className="font-bold text-blue-600">Your Location</p>
                    <p className="text-xs text-gray-600">
                      {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                    </p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Disasters */}
            {showDisasters &&
              disasters.map((disaster) => (
                <React.Fragment key={disaster._id}>
                  <Circle
                    center={[disaster.location.lat, disaster.location.lng]}
                    radius={disaster.affected_radius || getRadiusMultiplier(disaster.severity)}
                    pathOptions={{
                      color: getSeverityColor(disaster.severity),
                      fillColor: getSeverityColor(disaster.severity),
                      fillOpacity: 0.2,
                    }}
                  />
                  <Marker
                    position={[disaster.location.lat, disaster.location.lng]}
                    icon={disasterIcon(disaster.type)}
                  >
                    <Popup>
                      <div className="min-w-[200px]">
                        <h3 className="font-bold text-red-600 mb-2">{disaster.name}</h3>
                        <div className="space-y-1 text-sm">
                          <p>
                            <span className="font-semibold">Type:</span> {disaster.type}
                          </p>
                          <p>
                            <span className="font-semibold">Severity:</span>{' '}
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-bold ${
                                disaster.severity === 'critical'
                                  ? 'bg-red-100 text-red-800'
                                  : disaster.severity === 'high'
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {disaster.severity}
                            </span>
                          </p>
                          <p>
                            <span className="font-semibold">Radius:</span>{' '}
                            {((disaster.affected_radius || 1000) / 1000).toFixed(1)} km
                          </p>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                </React.Fragment>
              ))}

            {/* Flood Data */}
            {showFloods &&
              floodData.map((flood) => (
                <Marker
                  key={flood.id}
                  position={[flood.lat, flood.lng]}
                  icon={floodIcon(flood.severity)}
                >
                  <Popup>
                    <div className="min-w-[200px]">
                      <h3 className="font-bold text-blue-600 mb-2 flex items-center">
                        <Droplets className="h-4 w-4 mr-2" />
                        Flood Alert - DMC
                      </h3>
                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="font-semibold">Station:</span> {flood.location}
                        </p>
                        <p>
                          <span className="font-semibold">Status:</span>{' '}
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold ${
                              flood.severity === 'critical'
                                ? 'bg-red-100 text-red-800'
                                : flood.severity === 'high'
                                ? 'bg-orange-100 text-orange-800'
                                : flood.severity === 'medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {flood.alert_status || flood.severity}
                          </span>
                        </p>
                        <p>
                          <span className="font-semibold">Water Level:</span> {flood.water_level}m
                          {flood.rising_or_falling && <span className="ml-1 text-gray-600">({flood.rising_or_falling})</span>}
                        </p>
                        {flood.remarks && (
                          <p className="text-xs italic text-gray-600">{flood.remarks}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(flood.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

            {/* SOS Signals - HYBRID DATA MODEL: MongoDB user submissions */}
            {showSOSSignals &&
              sosSignals.map((sos) => (
                <Marker
                  key={sos._id}
                  position={[sos.location.lat, sos.location.lng]}
                  icon={createCustomIcon('#ef4444', '🚨')}
                >
                  <Popup>
                    <div className="min-w-[200px]">
                      <h3 className="font-bold text-red-600 mb-2 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        SOS Signal
                      </h3>
                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="font-semibold">Priority:</span>{' '}
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold ${
                              sos.priority === 'critical'
                                ? 'bg-red-100 text-red-800'
                                : sos.priority === 'high'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {sos.priority}
                          </span>
                        </p>
                        <p>
                          <span className="font-semibold">Status:</span>{' '}
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800">
                            {sos.status}
                          </span>
                        </p>
                        <p>
                          <span className="font-semibold">Message:</span> {sos.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(sos.timestamp).toLocaleString()}
                        </p>
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <span className="text-xs text-blue-600 font-medium">📡 User Submitted</span>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

            {/* Relief Camps */}
            {showReliefCamps &&
              reliefCamps.map((camp) => (
                <Marker
                  key={camp.id}
                  position={[camp.latitude, camp.longitude]}
                  icon={reliefIcon(camp.urgency)}
                >
                  <Popup>
                    <div className="min-w-[200px]">
                      <h3 className="font-bold text-green-600 mb-2">⛺ Relief Camp</h3>
                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="font-semibold">Contact:</span> {camp.full_name}
                        </p>
                        <p>
                          <span className="font-semibold">Type:</span> {camp.establishment_type}
                        </p>
                        <p className="text-xs text-gray-600">{camp.address}</p>
                        <p>
                          <span className="font-semibold">Urgency:</span>{' '}
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold ${
                              camp.urgency === 'emergency'
                                ? 'bg-red-100 text-red-800'
                                : camp.urgency === 'high'
                                ? 'bg-orange-100 text-orange-800'
                                : camp.urgency === 'medium'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {camp.urgency}
                          </span>
                        </p>
                        {(camp.num_men || camp.num_women || camp.num_children) && (
                          <p>
                            <span className="font-semibold">People:</span>{' '}
                            {camp.num_men || 0} men, {camp.num_women || 0} women, {camp.num_children || 0} children
                          </p>
                        )}
                        {camp.assistance_types && camp.assistance_types.length > 0 && (
                          <p>
                            <span className="font-semibold">Needs:</span>{' '}
                            <span className="text-xs">{camp.assistance_types.join(', ')}</span>
                          </p>
                        )}
                        {camp.distance_km && (
                          <p className="text-xs text-blue-600 font-medium mt-2">
                            📍 {camp.distance_km.toFixed(1)} km away
                          </p>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
          </MapContainer>
        )}
      </div>

      {/* Legend */}
      <div className="bg-white border-t shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-800">Map Legend</h3>
            <div className="text-xs text-gray-600">
              <span className="font-medium">Data Sources:</span> DMC Flood API • Supabase Relief Data
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-blue-600"></div>
              <span>Your Location</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-red-600"></div>
              <span>🌊 Critical Flood</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-amber-500"></div>
              <span>⚠️ Medium Risk</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-green-600"></div>
              <span>⛺ Relief Camp</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-xs bg-gray-100 px-2 py-1 rounded">
                Real-time Updates
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitizenMapPage;
