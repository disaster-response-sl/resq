import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { MapPin, ArrowLeft, Navigation } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

interface RouteStatus {
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
  status: string;
  severity: string;
  traffic_density: string;
  risk_level: string;
  description?: string;
}

const RouteMapPage: React.FC = () => {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState<RouteStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState<RouteStatus | null>(null);

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/public/route-status`);
      setRoutes(response.data.routes || []);
    } catch (error) {
      console.error('Error fetching routes:', error);
      toast.error('Failed to load route data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#22c55e';
      case 'partially_blocked': return '#eab308';
      case 'blocked': return '#ef4444';
      case 'hazardous': return '#f97316';
      case 'closed': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getMarkerColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-500';
      case 'partially_blocked': return 'bg-yellow-500';
      case 'blocked': return 'bg-red-500';
      case 'hazardous': return 'bg-orange-500';
      case 'closed': return 'bg-red-600';
      default: return 'bg-gray-500';
    }
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
          <div className="flex items-center">
            <MapPin className="h-8 w-8 mr-3" />
            <div>
              <h1 className="text-3xl font-bold">Route Status Map</h1>
              <p className="text-blue-100 mt-1">Interactive road status visualization</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map Placeholder - Can be replaced with actual map library */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Sri Lanka Road Network</h2>
                
                {/* Map Legend */}
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Status Legend</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
                      <span className="text-xs">Open</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded-full bg-yellow-500 mr-2"></div>
                      <span className="text-xs">Partial</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded-full bg-orange-500 mr-2"></div>
                      <span className="text-xs">Hazardous</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
                      <span className="text-xs">Blocked</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded-full bg-red-600 mr-2"></div>
                      <span className="text-xs">Closed</span>
                    </div>
                  </div>
                </div>

                {/* Map Visualization */}
                <div className="relative bg-gradient-to-br from-blue-50 to-green-50 rounded-lg p-8 min-h-[600px] border-2 border-gray-200">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="h-16 w-16 text-blue-400 mx-auto mb-4" />
                      <p className="text-gray-600 font-medium mb-2">Interactive Map Visualization</p>
                      <p className="text-sm text-gray-500 max-w-md">
                        Map integration with Leaflet/Google Maps can be added here to show routes visually.
                        Click on routes in the sidebar to view details.
                      </p>
                    </div>
                  </div>

                  {/* Route Markers */}
                  <div className="absolute inset-0 pointer-events-none">
                    {routes.slice(0, 8).map((route, index) => (
                      <div
                        key={route._id}
                        className="absolute pointer-events-auto cursor-pointer"
                        style={{
                          left: `${15 + (index % 4) * 20}%`,
                          top: `${20 + Math.floor(index / 4) * 40}%`,
                        }}
                        onClick={() => setSelectedRoute(route)}
                      >
                        <div className={`w-8 h-8 ${getMarkerColor(route.status)} rounded-full flex items-center justify-center text-white font-bold shadow-lg hover:scale-110 transition-transform`}>
                          {index + 1}
                        </div>
                        <div className="absolute left-10 top-0 bg-white px-2 py-1 rounded shadow-md text-xs whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity">
                          {route.route_name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Route List Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Major Routes</h2>
                <div className="space-y-3 max-h-[700px] overflow-y-auto">
                  {routes.map((route, index) => (
                    <div
                      key={route._id}
                      onClick={() => setSelectedRoute(route)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedRoute?._id === route._id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center">
                          <div className={`w-6 h-6 ${getMarkerColor(route.status)} rounded-full flex items-center justify-center text-white text-xs font-bold mr-2`}>
                            {index + 1}
                          </div>
                          <h3 className="font-bold text-sm">{route.route_name}</h3>
                        </div>
                      </div>
                      
                      <div className="flex items-center text-xs text-gray-600 mb-2">
                        <Navigation className="h-3 w-3 mr-1" />
                        {route.distance_km} km
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs px-2 py-1 rounded-full capitalize" style={{ 
                          backgroundColor: `${getStatusColor(route.status)}20`,
                          color: getStatusColor(route.status)
                        }}>
                          {route.status.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-gray-500 capitalize">{route.traffic_density}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selected Route Details */}
              {selectedRoute && (
                <div className="bg-white rounded-xl shadow-md p-6 mt-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Route Details</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500">Route Name</p>
                      <p className="font-semibold">{selectedRoute.route_name}</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">Route ID</p>
                      <p className="font-semibold">{selectedRoute.route_id}</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">From → To</p>
                      <p className="font-semibold text-sm">
                        {selectedRoute.start_location.name} → {selectedRoute.end_location.name}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">Distance</p>
                      <p className="font-semibold">{selectedRoute.distance_km} km</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">Current Status</p>
                      <span className="inline-block mt-1 text-sm px-3 py-1 rounded-full capitalize font-semibold" style={{ 
                        backgroundColor: `${getStatusColor(selectedRoute.status)}20`,
                        color: getStatusColor(selectedRoute.status)
                      }}>
                        {selectedRoute.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">Traffic Density</p>
                      <p className="font-semibold capitalize">{selectedRoute.traffic_density}</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">Risk Level</p>
                      <p className="font-semibold capitalize">{selectedRoute.risk_level}</p>
                    </div>

                    {selectedRoute.description && (
                      <div>
                        <p className="text-xs text-gray-500">Description</p>
                        <p className="text-sm mt-1">{selectedRoute.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RouteMapPage;
