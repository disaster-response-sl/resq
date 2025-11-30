import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { MapPin, ArrowLeft, AlertTriangle, Layers, Info } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

interface RoadReport {
  _id: string;
  road_name: string;
  location_name: string;
  district: string;
  condition: string;
  severity: string;
  description: string;
  reporter_name: string;
  location: {
    coordinates: [number, number]; // [longitude, latitude]
  };
  createdAt: string;
  status: string;
}

// Custom icon creator
const createCustomIcon = (condition: string, severity: string) => {
  const colors: any = {
    blocked: '#dc2626',
    flooded: '#2563eb',
    damaged: '#f97316',
    landslide: '#ca8a04',
    hazardous: '#9333ea',
    accident: '#dc2626',
    debris: '#78716c',
    closed: '#991b1b'
  };

  const color = colors[condition] || '#6b7280';
  
  const svgIcon = `
    <svg width="32" height="42" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C9.4 0 4 5.4 4 12c0 8 12 30 12 30s12-22 12-30c0-6.6-5.4-12-12-12z" 
            fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="16" cy="12" r="6" fill="white" opacity="0.9"/>
      <text x="16" y="16" text-anchor="middle" font-size="14" fill="${color}" font-weight="bold">
        ${severity === 'critical' ? '!' : severity === 'high' ? '⚠' : '•'}
      </text>
    </svg>
  `;

  return L.divIcon({
    html: svgIcon,
    className: 'custom-marker',
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -42]
  });
};

const RouteMapPage: React.FC = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<RoadReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapCenter] = useState<[number, number]>([7.8731, 80.7718]); // Center of Sri Lanka

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/public/road-reports?limit=500`);
      const reportsData = Array.isArray(response.data) ? response.data : [];
      
      // Filter reports with valid coordinates
      const validReports = reportsData.filter((report: RoadReport) => 
        report.location?.coordinates && 
        Array.isArray(report.location.coordinates) &&
        report.location.coordinates.length === 2
      );
      
      setReports(validReports);
      if (validReports.length === 0) {
        toast('No reports with GPS coordinates yet. Submit the first one!', { icon: '📍' });
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load road reports');
    } finally {
      setLoading(false);
    }
  };

  const getConditionColor = (condition: string) => {
    const colors: any = {
      blocked: '#dc2626',
      flooded: '#2563eb',
      damaged: '#f97316',
      landslide: '#ca8a04',
      hazardous: '#9333ea',
      accident: '#dc2626',
      debris: '#78716c',
      closed: '#991b1b'
    };
    return colors[condition] || '#6b7280';
  };

  const getSeverityRadius = (severity: string) => {
    switch (severity) {
      case 'critical': return 500;
      case 'high': return 300;
      case 'medium': return 200;
      case 'low': return 100;
      default: return 150;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
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
                <h1 className="text-3xl font-bold">Interactive Road Status Map</h1>
                <p className="text-blue-100 mt-1">Crowdsourced road conditions across Sri Lanka</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-2 bg-blue-800 bg-opacity-50 px-4 py-2 rounded-lg">
              <span className="text-sm">{reports.length} Reports</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-96 bg-white rounded-xl">
            <div>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading map...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Map Legend */}
            <div className="bg-white rounded-xl shadow-md p-4 mb-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center">
                  <Layers className="h-4 w-4 mr-2" />
                  Condition Legend
                </h3>
                <span className="text-xs text-gray-500">Click markers for details</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 mt-3">
                <div className="flex items-center text-xs">
                  <div className="w-3 h-3 rounded-full bg-red-600 mr-1"></div>
                  <span>Blocked</span>
                </div>
                <div className="flex items-center text-xs">
                  <div className="w-3 h-3 rounded-full bg-blue-600 mr-1"></div>
                  <span>Flooded</span>
                </div>
                <div className="flex items-center text-xs">
                  <div className="w-3 h-3 rounded-full bg-orange-600 mr-1"></div>
                  <span>Damaged</span>
                </div>
                <div className="flex items-center text-xs">
                  <div className="w-3 h-3 rounded-full bg-yellow-600 mr-1"></div>
                  <span>Landslide</span>
                </div>
                <div className="flex items-center text-xs">
                  <div className="w-3 h-3 rounded-full bg-purple-600 mr-1"></div>
                  <span>Hazardous</span>
                </div>
                <div className="flex items-center text-xs">
                  <div className="w-3 h-3 rounded-full bg-red-600 mr-1"></div>
                  <span>Accident</span>
                </div>
                <div className="flex items-center text-xs">
                  <div className="w-3 h-3 rounded-full bg-stone-600 mr-1"></div>
                  <span>Debris</span>
                </div>
                <div className="flex items-center text-xs">
                  <div className="w-3 h-3 rounded-full bg-red-800 mr-1"></div>
                  <span>Closed</span>
                </div>
              </div>
            </div>

            {/* Interactive Map */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden" style={{ height: '600px' }}>
              {reports.length === 0 ? (
                <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-50 to-green-50">
                  <div className="text-center p-8">
                    <MapPin className="h-20 w-20 text-blue-400 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">No Reports on Map Yet</h3>
                    <p className="text-gray-600 mb-6 max-w-md">
                      Be the first to report a road condition with GPS location enabled!
                    </p>
                    <button
                      onClick={() => navigate('/citizen/report-road')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors inline-flex items-center space-x-2"
                    >
                      <AlertTriangle className="h-5 w-5" />
                      <span>Report Road Condition</span>
                    </button>
                  </div>
                </div>
              ) : (
                <MapContainer
                  center={mapCenter}
                  zoom={8}
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  
                  {reports.map((report) => {
                    const [lng, lat] = report.location.coordinates;
                    const position: [number, number] = [lat, lng];
                    
                    return (
                      <React.Fragment key={report._id}>
                        <Marker 
                          position={position}
                          icon={createCustomIcon(report.condition, report.severity)}
                        >
                          <Popup maxWidth={300}>
                            <div className="p-2">
                              <h3 className="font-bold text-lg mb-2 flex items-center">
                                <AlertTriangle className="h-5 w-5 mr-2" style={{ color: getConditionColor(report.condition) }} />
                                {report.road_name}
                              </h3>
                              
                              <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-600">Condition:</span>
                                  <span 
                                    className="px-2 py-1 rounded text-xs font-semibold text-white capitalize"
                                    style={{ backgroundColor: getConditionColor(report.condition) }}
                                  >
                                    {report.condition}
                                  </span>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-600">Severity:</span>
                                  <span className={`px-2 py-1 rounded text-xs font-semibold capitalize ${
                                    report.severity === 'critical' ? 'bg-red-600 text-white' :
                                    report.severity === 'high' ? 'bg-orange-600 text-white' :
                                    report.severity === 'medium' ? 'bg-yellow-600 text-white' :
                                    'bg-green-600 text-white'
                                  }`}>
                                    {report.severity}
                                  </span>
                                </div>
                                
                                <div>
                                  <span className="text-gray-600">Location:</span>
                                  <p className="mt-1">{report.location_name}, {report.district}</p>
                                </div>
                                
                                <div>
                                  <span className="text-gray-600">Description:</span>
                                  <p className="mt-1">{report.description}</p>
                                </div>
                                
                                <div className="pt-2 border-t border-gray-200">
                                  <span className="text-xs text-gray-500">
                                    Reported by {report.reporter_name} • {formatTimestamp(report.createdAt)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </Popup>
                        </Marker>
                        
                        <Circle
                          center={position}
                          radius={getSeverityRadius(report.severity)}
                          pathOptions={{
                            color: getConditionColor(report.condition),
                            fillColor: getConditionColor(report.condition),
                            fillOpacity: 0.15,
                            weight: 2,
                            opacity: 0.5
                          }}
                        />
                      </React.Fragment>
                    );
                  })}
                </MapContainer>
              )}
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-4">
              <div className="flex items-start">
                <Info className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-semibold mb-1">How to use this map:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-800">
                    <li>Click on markers to see detailed road condition reports</li>
                    <li>Colored circles show the affected area radius based on severity</li>
                    <li>Zoom in/out and drag to explore different areas</li>
                    <li>Report new conditions to help your community</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RouteMapPage;
