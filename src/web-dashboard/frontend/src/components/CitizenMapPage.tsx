import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Map as MapIcon, ArrowLeft, AlertTriangle, Droplets, Zap } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [showFloods, setShowFloods] = useState(true);
  const [showDisasters, setShowDisasters] = useState(true);

  useEffect(() => {
    getCurrentLocation();
    fetchDisasters();
    fetchFloodData();
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
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/public/disasters`
      );

      if (response.data.success) {
        setDisasters(response.data.data.filter((d: Disaster) => d.status === 'active'));
      }
    } catch (error) {
      console.error('Disasters fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFloodData = async () => {
    try {
      // Use the external data service for real-time flood data
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/external/flood-support`
      );

      if (response.data.success && response.data.data) {
        // Transform the data to our format
        const floods = response.data.data.map((item: any, index: number) => ({
          id: item.id || `flood-${index}`,
          location: item.location || 'Unknown',
          severity: item.severity || 'medium',
          water_level: item.waterLevel || 0,
          lat: item.location?.lat || item.lat || 6.9271,
          lng: item.location?.lng || item.lng || 79.8612,
          timestamp: item.timestamp || new Date().toISOString(),
        }));
        setFloodData(floods);
      }
    } catch (error) {
      console.error('Flood data fetch error:', error);
      toast.error('Unable to fetch real-time flood data');
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
        </div>
      </header>

      {/* Controls */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showDisasters}
                onChange={(e) => setShowDisasters(e.target.checked)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm font-medium text-gray-700">Show Disasters</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showFloods}
                onChange={(e) => setShowFloods(e.target.checked)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm font-medium text-gray-700">Show Floods (Real-time)</span>
            </label>
            <button
              onClick={() => {
                fetchDisasters();
                fetchFloodData();
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
      <div className="flex-1 relative">
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
            style={{ height: '100%', width: '100%' }}
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
                        Flood Alert
                      </h3>
                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="font-semibold">Location:</span> {flood.location}
                        </p>
                        <p>
                          <span className="font-semibold">Severity:</span>{' '}
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold ${
                              flood.severity === 'high'
                                ? 'bg-red-100 text-red-800'
                                : flood.severity === 'medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {flood.severity}
                          </span>
                        </p>
                        {flood.water_level > 0 && (
                          <p>
                            <span className="font-semibold">Water Level:</span> {flood.water_level}m
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          {new Date(flood.timestamp).toLocaleString()}
                        </p>
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
          <h3 className="text-sm font-bold text-gray-800 mb-3">Map Legend</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-blue-600"></div>
              <span>Your Location</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-red-600"></div>
              <span>Critical/High Risk</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-amber-500"></div>
              <span>Medium Risk</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-blue-500"></div>
              <span>Low Risk/Floods</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitizenMapPage;
