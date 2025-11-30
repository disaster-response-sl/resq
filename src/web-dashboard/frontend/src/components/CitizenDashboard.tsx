import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Cloud, AlertTriangle, Package, Phone, Navigation } from 'lucide-react';
import axios from 'axios';
import CitizenNavbar from './CitizenNavbar';

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
    
    // Auto-refresh alerts every 5 minutes (300000 ms)
    const alertInterval = setInterval(() => {
      fetchRecentAlerts();
    }, 300000);
    
    return () => clearInterval(alertInterval);
  }, []); // Only run once on mount

  useEffect(() => {
    if (location) {
      fetchWeather();
      fetchRiskStatus();
      reverseGeocode();
    }
  }, [location]); // Run when location changes

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
    
    // Create abort controller with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}`,
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
        if (data && data.display_name) {
          const parts = data.display_name.split(',');
          setLocationName(parts.slice(0, 3).join(','));
          return;
        }
      }
      
      // Fallback to coordinates if geocoding fails
      setLocationName(`${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`);
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error('Reverse geocoding error:', error);
      // Fallback to coordinates display
      setLocationName(`${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`);
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
      <CitizenNavbar />

      <div className="container mx-auto px-4 py-8">
        {/* Quick Actions - Mobile Optimized */}
        <div className="mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-3">Emergency Actions</h2>
          <div className="grid grid-cols-4 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
            <button
              onClick={() => navigate('/citizen/emergency-contacts')}
              className="bg-red-600 hover:bg-red-700 text-white p-3 md:p-6 rounded-xl shadow-lg transition-all transform hover:scale-105 relative"
            >
              <Phone className="h-6 w-6 md:h-12 md:w-12 mx-auto mb-1 md:mb-3" />
              <h3 className="text-xs md:text-xl font-bold">Emergency Contacts</h3>
              <p className="text-[10px] md:text-sm text-red-100 mt-0.5 md:mt-1 hidden md:block">117, 119, 110, 108 & DDMCU</p>
            </button>

            <button
              onClick={() => navigate('/citizen/route-watch')}
              className="bg-blue-600 hover:bg-blue-700 text-white p-3 md:p-6 rounded-xl shadow-lg transition-all transform hover:scale-105 relative"
            >
              <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 bg-yellow-400 text-blue-900 text-[8px] md:text-xs font-bold px-1.5 md:px-3 py-0.5 md:py-1 rounded-full shadow-lg animate-pulse">
                NEW
              </div>
              <Navigation className="h-6 w-6 md:h-12 md:w-12 mx-auto mb-1 md:mb-3" />
              <h3 className="text-xs md:text-xl font-bold leading-tight">LankaRoute<br className="md:hidden" />Watch</h3>
              <p className="text-[10px] md:text-sm text-blue-100 mt-0.5 md:mt-1 hidden md:block">Road conditions & safe routes</p>
            </button>

            <button
              onClick={() => navigate('/citizen/sos')}
              className="bg-red-500 hover:bg-red-600 text-white p-3 md:p-6 rounded-xl shadow-lg transition-all transform hover:scale-105"
            >
              <AlertTriangle className="h-6 w-6 md:h-12 md:w-12 mx-auto mb-1 md:mb-3" />
              <h3 className="text-xs md:text-xl font-bold">SOS Emergency</h3>
              <p className="text-[10px] md:text-sm text-red-100 mt-0.5 md:mt-1 hidden md:block">Send distress signal</p>
            </button>

            <button
              onClick={() => navigate('/citizen/relief-tracker')}
              className="bg-purple-600 hover:bg-purple-700 text-white p-3 md:p-6 rounded-xl shadow-lg transition-all transform hover:scale-105"
            >
              <Package className="h-6 w-6 md:h-12 md:w-12 mx-auto mb-1 md:mb-3" />
              <h3 className="text-xs md:text-xl font-bold">Relief Tracker</h3>
              <p className="text-[10px] md:text-sm text-purple-100 mt-0.5 md:mt-1 hidden md:block">Find help or volunteer</p>
            </button>
          </div>
        </div>

        {/* Risk Assessment Card - Full Width Main Card */}
        <div className="relative mb-6">
          <div className={`rounded-2xl shadow-lg p-8 border relative overflow-hidden ${
            riskStatus.toLowerCase() === 'high' 
              ? 'bg-gradient-to-br from-red-50 via-red-50 to-red-100 border-red-100' 
              : riskStatus.toLowerCase() === 'medium'
              ? 'bg-gradient-to-br from-orange-50 via-orange-50 to-orange-100 border-orange-100'
              : 'bg-gradient-to-br from-green-50 via-green-50 to-green-100 border-green-100'
          }`}>
            {/* Decorative Pattern */}
            <div className={`absolute top-0 right-0 w-40 h-40 rounded-full opacity-20 -mr-20 -mt-20 ${
              riskStatus.toLowerCase() === 'high' ? 'bg-red-200' :
              riskStatus.toLowerCase() === 'medium' ? 'bg-orange-200' : 'bg-green-200'
            }`}></div>
            <div className={`absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-20 -ml-16 -mb-16 ${
              riskStatus.toLowerCase() === 'high' ? 'bg-red-200' :
              riskStatus.toLowerCase() === 'medium' ? 'bg-orange-200' : 'bg-green-200'
            }`}></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs text-gray-500">Update • {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                <button className={`px-5 py-2 rounded-full text-sm font-medium shadow-sm ${
                  riskStatus.toLowerCase() === 'high' 
                    ? 'bg-red-500 text-white' 
                    : riskStatus.toLowerCase() === 'medium'
                    ? 'bg-orange-400 text-white'
                    : 'bg-green-500 text-white'
                }`}>
                  {riskStatus.toLowerCase() === 'high' ? 'High Risk ⚠️' :
                   riskStatus.toLowerCase() === 'medium' ? 'Medium Risk ⚡' :
                   'Normal 😊'}
                </button>
              </div>

              {loading ? (
                <p className="text-sm text-gray-500">Calculating risk...</p>
              ) : (
                <div className="flex items-center justify-between gap-6 pb-20">
                  <div className="flex-1">
                    <h3 className="text-2xl md:text-3xl font-bold text-gray-900 leading-snug">
                      {riskStatus.toLowerCase() === 'high' 
                        ? 'High risk detected. Please take necessary precautions!' 
                        : riskStatus.toLowerCase() === 'medium'
                        ? 'Some conditions need attention. Stay cautious!'
                        : 'Everything looks normal. Have a great day!'}
                    </h3>
                  </div>
                  <img 
                    src={`/images/${
                      riskStatus.toLowerCase() === 'high' ? 'highRisk' :
                      riskStatus.toLowerCase() === 'medium' ? 'mediumRisk' :
                      'lowRisk'
                    }.png`}
                    alt={`${riskStatus} Risk`}
                    className="w-40 md:w-48 h-auto rounded-lg flex-shrink-0"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            {/* Overlapping Small Cards at Bottom */}
            <div className="absolute bottom-4 left-4 right-4 flex gap-3 z-20">
              {/* Location Card - Small Overlay */}
              <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-3 border border-gray-200 flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <MapPin className="h-3 w-3 text-purple-600" />
                  <span className="text-[10px] text-gray-500 font-medium">Your Location</span>
                </div>
                {location ? (
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">
                        {locationName || 'Location Unknown'}
                      </p>
                    </div>
                    <button
                      onClick={getCurrentLocation}
                      className="ml-2 px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-full text-[10px] font-medium transition-colors flex-shrink-0"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-400">Getting location...</p>
                )}
              </div>

              {/* Weather Card - Small Overlay */}
              <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-3 border border-gray-200 flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <Cloud className="h-3 w-3 text-blue-600" />
                  <span className="text-[10px] text-gray-500 font-medium">Weather</span>
                </div>
                {weather ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-gray-900 leading-none">{weather.temperature}</p>
                      <p className="text-[10px] text-gray-600">{weather.condition}</p>
                    </div>
                    <div className="text-[10px] text-gray-500 text-right">
                      <p>💧 {weather.humidity}</p>
                      <p>🌬️ {weather.windSpeed}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-400">Loading...</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="mt-8 bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800">Recent Alerts</h3>
            {recentAlerts.length > 0 && recentAlerts[0].timestamp && (
              <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                Last DMC Update: {new Date(recentAlerts[0].timestamp).toLocaleString()}
              </span>
            )}
          </div>
          {recentAlerts.length > 0 ? (
            <div className="space-y-3">
              {recentAlerts.map((alert) => (
                <div
                  key={alert._id}
                  className="border-l-4 border-orange-500 bg-orange-50 p-4 rounded"
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getSeverityColor(alert.severity)}`}>
                      {alert.severity}
                    </span>
                    <span className="text-sm font-semibold text-gray-700">{alert.type}</span>
                  </div>
                  <p className="text-gray-700 mb-1">{alert.message}</p>
                  <p className="text-sm text-gray-500">{alert.location}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No recent alerts</p>
          )}
        </div>

        {/* Emergency Contacts */}
        <div className="mt-8 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800">General Emergency Numbers</h3>
            <span className="text-xs font-semibold text-gray-600">🇱🇰 Sri Lanka</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a
              href="tel:117"
              className="bg-white hover:bg-red-50 rounded-lg p-4 transition-all transform hover:scale-105 cursor-pointer shadow-sm border-2 border-transparent hover:border-red-200"
            >
              <div className="text-center">
                <p className="text-3xl mb-2">🚨</p>
                <p className="text-2xl font-bold text-red-600 mb-1">117</p>
                <p className="text-sm font-semibold text-gray-800">Emergency</p>
                <p className="text-xs text-gray-500 mt-1">Tap to call</p>
              </div>
            </a>
            <a
              href="tel:119"
              className="bg-white hover:bg-blue-50 rounded-lg p-4 transition-all transform hover:scale-105 cursor-pointer shadow-sm border-2 border-transparent hover:border-blue-200"
            >
              <div className="text-center">
                <p className="text-3xl mb-2">👮</p>
                <p className="text-2xl font-bold text-blue-600 mb-1">119</p>
                <p className="text-sm font-semibold text-gray-800">Police</p>
                <p className="text-xs text-gray-500 mt-1">Tap to call</p>
              </div>
            </a>
            <a
              href="tel:110"
              className="bg-white hover:bg-orange-50 rounded-lg p-4 transition-all transform hover:scale-105 cursor-pointer shadow-sm border-2 border-transparent hover:border-orange-200"
            >
              <div className="text-center">
                <p className="text-3xl mb-2">🚒</p>
                <p className="text-2xl font-bold text-orange-600 mb-1">110</p>
                <p className="text-sm font-semibold text-gray-800">Fire Brigade</p>
                <p className="text-xs text-gray-500 mt-1">Tap to call</p>
              </div>
            </a>
            <a
              href="tel:108"
              className="bg-white hover:bg-green-50 rounded-lg p-4 transition-all transform hover:scale-105 cursor-pointer shadow-sm border-2 border-transparent hover:border-green-200"
            >
              <div className="text-center">
                <p className="text-3xl mb-2">🚑</p>
                <p className="text-2xl font-bold text-green-600 mb-1">108</p>
                <p className="text-sm font-semibold text-gray-800">Ambulance</p>
                <p className="text-xs text-gray-500 mt-1">Tap to call</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitizenDashboard;
