import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Cloud, AlertTriangle, Package, MessageSquare, Map, Phone, Shield } from 'lucide-react';
import axios from 'axios';

interface Location {
  lat: number;
  lng: number;
}

interface Weather {
  temperature: string;
  condition: string;
  humidity: string;
  windSpeed: string;
}

interface Alert {
  _id: string;
  type: string;
  location: string;
  severity: string;
  timestamp: string;
  message: string;
}

const CitizenDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [location, setLocation] = useState<Location | null>(null);
  const [locationName, setLocationName] = useState<string>('Getting location...');
  const [weather, setWeather] = useState<Weather | null>(null);
  const [riskStatus, setRiskStatus] = useState<string>('Low');
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentLocation();
    fetchRecentAlerts();
  }, []);

  useEffect(() => {
    if (location) {
      fetchWeather();
      fetchRiskStatus();
      reverseGeocode();
    }
  }, [location]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Location error:', error);
          // Default to Colombo, Sri Lanka
          setLocation({ lat: 6.9271, lng: 79.8612 });
          setLocationName('Colombo, Sri Lanka (Default)');
        }
      );
    } else {
      setLocation({ lat: 6.9271, lng: 79.8612 });
      setLocationName('Colombo, Sri Lanka (Default)');
    }
  };

  const reverseGeocode = async () => {
    if (!location) return;
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}`
      );
      if (response.data && response.data.display_name) {
        const parts = response.data.display_name.split(',');
        setLocationName(parts.slice(0, 3).join(','));
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      setLocationName('Location Unknown');
    }
  };

  const fetchWeather = async () => {
    if (!location) return;
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/public/weather`, {
        params: {
          lat: location.lat,
          lng: location.lng,
        },
      });

      if (response.data.success) {
        setWeather(response.data.data);
      }
    } catch (error) {
      console.error('Weather fetch error:', error);
      setWeather({
        temperature: '28°C',
        condition: 'Partly Cloudy',
        humidity: '75%',
        windSpeed: '12 km/h',
      });
    }
  };

  const fetchRiskStatus = async () => {
    if (!location) return;
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/public/risk-assessment`, {
        params: {
          lat: location.lat,
          lng: location.lng,
        },
      });

      if (response.data.success) {
        setRiskStatus(response.data.data.risk_level);
      }
    } catch (error) {
      console.error('Risk assessment error:', error);
      setRiskStatus('Low');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentAlerts = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/public/recent-alerts`);

      if (response.data.success) {
        setRecentAlerts(response.data.data.slice(0, 5));
      }
    } catch (error) {
      console.error('Alerts fetch error:', error);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      default:
        return 'bg-green-500';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'text-red-600 bg-red-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-blue-600 bg-blue-50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src="/favicon.png" 
                alt="ResQ Hub Logo" 
                className="h-10 w-10"
              />
              <div>
                <h1 className="text-2xl font-bold">ResQ Hub</h1>
                <p className="text-blue-100 text-sm">Sri Lanka Emergency Response System</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Admin/Responder Login
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Quick Actions - Emergency First */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Emergency Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <button
              onClick={() => navigate('/citizen/sos')}
              className="bg-red-600 hover:bg-red-700 text-white p-6 rounded-xl shadow-lg transition-all transform hover:scale-105"
            >
              <Phone className="h-12 w-12 mx-auto mb-3" />
              <h3 className="text-xl font-bold">SOS Emergency</h3>
              <p className="text-sm text-red-100 mt-1">Send distress signal</p>
            </button>

            <button
              onClick={() => navigate('/citizen/report')}
              className="bg-orange-600 hover:bg-orange-700 text-white p-6 rounded-xl shadow-lg transition-all transform hover:scale-105"
            >
              <AlertTriangle className="h-12 w-12 mx-auto mb-3" />
              <h3 className="text-xl font-bold">Report Incident</h3>
              <p className="text-sm text-orange-100 mt-1">Food, shelter, medical</p>
            </button>

            <button
              onClick={() => navigate('/citizen/relief-tracker')}
              className="bg-purple-600 hover:bg-purple-700 text-white p-6 rounded-xl shadow-lg transition-all transform hover:scale-105"
            >
              <Package className="h-12 w-12 mx-auto mb-3" />
              <h3 className="text-xl font-bold">Relief Tracker</h3>
              <p className="text-sm text-purple-100 mt-1">Find help or volunteer</p>
            </button>

            <button
              onClick={() => navigate('/citizen/map')}
              className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-xl shadow-lg transition-all transform hover:scale-105"
            >
              <Map className="h-12 w-12 mx-auto mb-3" />
              <h3 className="text-xl font-bold">Risk Map</h3>
              <p className="text-sm text-blue-100 mt-1">View disaster zones</p>
            </button>

            <button
              onClick={() => navigate('/citizen/chat')}
              className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-xl shadow-lg transition-all transform hover:scale-105"
            >
              <MessageSquare className="h-12 w-12 mx-auto mb-3" />
              <h3 className="text-xl font-bold">AI Assistant</h3>
              <p className="text-sm text-green-100 mt-1">Safety guidance</p>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Location */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center space-x-2 mb-4">
              <MapPin className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800">Your Location</h3>
            </div>
            {location ? (
              <div>
                <p className="text-gray-600 mb-2">{locationName}</p>
                <div className="text-sm text-gray-500 space-y-1">
                  <p>Latitude: {location.lat.toFixed(6)}</p>
                  <p>Longitude: {location.lng.toFixed(6)}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Getting location...</p>
            )}
          </div>

          {/* Weather */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Cloud className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800">Weather</h3>
            </div>
            {weather ? (
              <div>
                <p className="text-3xl font-bold text-gray-800 mb-2">{weather.temperature}</p>
                <p className="text-gray-600 mb-3">{weather.condition}</p>
                <div className="text-sm text-gray-500 space-y-1">
                  <p>💧 Humidity: {weather.humidity}</p>
                  <p>🌬️ Wind: {weather.windSpeed}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Loading weather...</p>
            )}
          </div>

          {/* Risk Status */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center space-x-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800">Risk Assessment</h3>
            </div>
            {loading ? (
              <p className="text-gray-500">Calculating risk...</p>
            ) : (
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <div className={`h-4 w-4 rounded-full ${getRiskColor(riskStatus)}`}></div>
                  <span className="text-2xl font-bold text-gray-800">{riskStatus} Risk</span>
                </div>
                <p className="text-sm text-gray-600">
                  {riskStatus === 'High' && 'Stay alert and follow safety guidelines'}
                  {riskStatus === 'Medium' && 'Be prepared for possible emergencies'}
                  {riskStatus === 'Low' && 'No immediate threats detected'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="mt-8 bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Alerts</h3>
          {recentAlerts.length > 0 ? (
            <div className="space-y-3">
              {recentAlerts.map((alert) => (
                <div
                  key={alert._id}
                  className="border-l-4 border-orange-500 bg-orange-50 p-4 rounded"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getSeverityColor(alert.severity)}`}>
                          {alert.severity}
                        </span>
                        <span className="text-sm font-semibold text-gray-700">{alert.type}</span>
                      </div>
                      <p className="text-gray-700 mb-1">{alert.message}</p>
                      <p className="text-sm text-gray-500">{alert.location}</p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(alert.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No recent alerts</p>
          )}
        </div>

        {/* Emergency Contacts */}
        <div className="mt-8 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Emergency Contacts</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4">
              <p className="font-semibold text-gray-800">🚨 Emergency Services</p>
              <p className="text-2xl font-bold text-red-600">119</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="font-semibold text-gray-800">🚑 Ambulance</p>
              <p className="text-2xl font-bold text-red-600">1990</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="font-semibold text-gray-800">🚒 Fire & Rescue</p>
              <p className="text-2xl font-bold text-red-600">110</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitizenDashboard;
