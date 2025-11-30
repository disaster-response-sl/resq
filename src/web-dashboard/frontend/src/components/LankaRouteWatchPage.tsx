import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, MapPin, Navigation, Clock, TrendingUp, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import CitizenNavbar from './CitizenNavbar';

interface RoadReport {
  _id: string;
  road_name: string;
  location_name: string;
  district: string;
  condition: string;
  severity: string;
  description: string;
  traffic_status: string;
  emergency_vehicles_accessible: boolean;
  createdAt: string;
  status: string;
}

interface RouteStatus {
  _id: string;
  route_id: string;
  route_name: string;
  route_type: string;
  start_location: { name: string };
  end_location: { name: string };
  distance_km: number;
  status: string;
  severity: string;
  description: string;
  traffic_density: string;
  emergency_vehicles_accessible: boolean;
  alternative_routes_available: boolean;
}

interface RouteStats {
  total_reports: number;
  active_reports: number;
  resolved_reports: number;
  total_routes_monitored: number;
  affected_routes: number;
  safe_routes: number;
  affected_districts: number;
  by_severity: {
    critical?: number;
    high?: number;
    medium?: number;
    low?: number;
  };
  by_condition: {
    blocked?: number;
    flooded?: number;
    damaged?: number;
    landslide?: number;
    hazardous?: number;
  };
}

const LankaRouteWatchPage: React.FC = () => {
  const navigate = useNavigate();
  const [roadReports, setRoadReports] = useState<RoadReport[]>([]);
  const [routeStatuses, setRouteStatuses] = useState<RouteStatus[]>([]);
  const [stats, setStats] = useState<RouteStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedCondition, setSelectedCondition] = useState<string>('');
  const [view, setView] = useState<'reports' | 'routes' | 'stats'>('stats');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  const SRI_LANKA_DISTRICTS = [
    'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
    'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
    'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
    'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
    'Moneragala', 'Ratnapura', 'Kegalle'
  ];

  useEffect(() => {
    fetchData();
  }, [selectedDistrict, selectedCondition]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reportsRes, routesRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/public/road-reports`, {
          params: {
            district: selectedDistrict || undefined,
            condition: selectedCondition || undefined,
            limit: 50
          }
        }),
        axios.get(`${API_BASE_URL}/api/public/route-status`, {
          params: {
            district: selectedDistrict || undefined,
            limit: 30
          }
        }),
        axios.get(`${API_BASE_URL}/api/public/route-stats`)
      ]);

      if (reportsRes.data.success) {
        setRoadReports(reportsRes.data.data);
      }
      if (routesRes.data.success) {
        setRouteStatuses(routesRes.data.data);
      }
      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching route data:', error);
      toast.error('Failed to load route information');
    } finally {
      setLoading(false);
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'blocked': return 'bg-red-100 text-red-800 border-red-300';
      case 'flooded': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'damaged': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'landslide': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'hazardous': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'accident': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getSeverityBadge = (severity: string) => {
    const colors = {
      critical: 'bg-red-600 text-white',
      high: 'bg-orange-600 text-white',
      medium: 'bg-yellow-600 text-white',
      low: 'bg-green-600 text-white'
    };
    return colors[severity as keyof typeof colors] || 'bg-gray-600 text-white';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'blocked':
      case 'closed': return <XCircle className="h-5 w-5 text-red-600" />;
      default: return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <CitizenNavbar />

      {/* Page Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-6 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center space-x-3">
            <Navigation className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">LankaRouteWatch</h1>
              <p className="text-blue-100 text-sm">Real-time Road Condition & Route Safety Monitoring</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Statistics Dashboard */}
        {stats && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <TrendingUp className="h-7 w-7 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">National Road Network Status</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">🛣️ Routes Monitored</p>
                <p className="text-3xl font-bold text-blue-600">{stats.total_routes_monitored}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">✅ Safe Routes</p>
                <p className="text-3xl font-bold text-green-600">{stats.safe_routes}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">⚠️ Affected Routes</p>
                <p className="text-3xl font-bold text-red-600">{stats.affected_routes}</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">📊 Active Reports</p>
                <p className="text-3xl font-bold text-orange-600">{stats.active_reports}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">📍 Affected Districts</p>
                <p className="text-3xl font-bold text-purple-600">{stats.affected_districts}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">✔️ Resolved</p>
                <p className="text-3xl font-bold text-gray-600">{stats.resolved_reports}</p>
              </div>
            </div>

            {/* Condition Breakdown */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-red-50 rounded p-3">
                <p className="text-xs text-gray-600">🚧 Blocked</p>
                <p className="text-xl font-bold text-red-600">{stats.by_condition.blocked || 0}</p>
              </div>
              <div className="bg-blue-50 rounded p-3">
                <p className="text-xs text-gray-600">🌊 Flooded</p>
                <p className="text-xl font-bold text-blue-600">{stats.by_condition.flooded || 0}</p>
              </div>
              <div className="bg-orange-50 rounded p-3">
                <p className="text-xs text-gray-600">🔨 Damaged</p>
                <p className="text-xl font-bold text-orange-600">{stats.by_condition.damaged || 0}</p>
              </div>
              <div className="bg-yellow-50 rounded p-3">
                <p className="text-xs text-gray-600">⛰️ Landslide</p>
                <p className="text-xl font-bold text-yellow-600">{stats.by_condition.landslide || 0}</p>
              </div>
              <div className="bg-purple-50 rounded p-3">
                <p className="text-xs text-gray-600">⚠️ Hazardous</p>
                <p className="text-xl font-bold text-purple-600">{stats.by_condition.hazardous || 0}</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => navigate('/citizen/report-road')}
            className="bg-red-600 hover:bg-red-700 text-white p-6 rounded-xl shadow-lg transition-all transform hover:scale-105"
          >
            <AlertTriangle className="h-12 w-12 mx-auto mb-3" />
            <h3 className="text-xl font-bold">Report Road Issue</h3>
            <p className="text-sm text-red-100 mt-1">Submit road condition report</p>
          </button>

          <button
            onClick={() => navigate('/citizen/safe-routes')}
            className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-xl shadow-lg transition-all transform hover:scale-105"
          >
            <Navigation className="h-12 w-12 mx-auto mb-3" />
            <h3 className="text-xl font-bold">Find Safe Routes</h3>
            <p className="text-sm text-green-100 mt-1">Get route recommendations</p>
          </button>

          <button
            onClick={() => navigate('/citizen/route-map')}
            className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-xl shadow-lg transition-all transform hover:scale-105"
          >
            <MapPin className="h-12 w-12 mx-auto mb-3" />
            <h3 className="text-xl font-bold">View Route Map</h3>
            <p className="text-sm text-blue-100 mt-1">Interactive road status map</p>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">View</label>
              <select
                value={view}
                onChange={(e) => setView(e.target.value as 'reports' | 'routes' | 'stats')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="stats">Statistics</option>
                <option value="reports">Road Reports</option>
                <option value="routes">Route Status</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Districts</option>
                {SRI_LANKA_DISTRICTS.map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
              <select
                value={selectedCondition}
                onChange={(e) => setSelectedCondition(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Conditions</option>
                <option value="blocked">Blocked</option>
                <option value="flooded">Flooded</option>
                <option value="damaged">Damaged</option>
                <option value="landslide">Landslide</option>
                <option value="hazardous">Hazardous</option>
                <option value="accident">Accident</option>
              </select>
            </div>
          </div>
        </div>

        {/* Road Reports View */}
        {view === 'reports' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Active Road Reports ({roadReports.length})
            </h2>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading road reports...</p>
              </div>
            ) : roadReports.length === 0 ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">All Clear!</h3>
                <p className="text-gray-600">No active road reports in the selected area.</p>
              </div>
            ) : (
              roadReports.map(report => (
                <div key={report._id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{report.road_name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getSeverityBadge(report.severity)}`}>
                          {report.severity.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {report.location_name}, {report.district}
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {formatTimestamp(report.createdAt)}
                        </span>
                      </div>
                    </div>
                    <span className={`px-4 py-2 rounded-lg border-2 text-sm font-semibold ${getConditionColor(report.condition)}`}>
                      {report.condition.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-gray-700 mb-4">{report.description}</p>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <div className="bg-gray-50 rounded p-3">
                      <p className="text-gray-600">Traffic Status</p>
                      <p className="font-semibold">{report.traffic_status.replace('_', ' ')}</p>
                    </div>
                    <div className="bg-gray-50 rounded p-3">
                      <p className="text-gray-600">Emergency Access</p>
                      <p className={`font-semibold ${report.emergency_vehicles_accessible ? 'text-green-600' : 'text-red-600'}`}>
                        {report.emergency_vehicles_accessible ? 'Yes' : 'No'}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded p-3">
                      <p className="text-gray-600">Status</p>
                      <p className="font-semibold capitalize">{report.status}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Route Status View */}
        {view === 'routes' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Major Routes Status ({routeStatuses.length})
            </h2>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading route statuses...</p>
              </div>
            ) : (
              routeStatuses.map(route => (
                <div key={route._id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getStatusIcon(route.status)}
                        <h3 className="text-xl font-bold text-gray-900">{route.route_name}</h3>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                          {route.route_type.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {route.start_location.name} → {route.end_location.name} ({route.distance_km} km)
                      </p>
                    </div>
                    <span className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                      route.status === 'open' ? 'bg-green-100 text-green-800' :
                      route.status === 'blocked' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {route.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  {route.description && (
                    <p className="text-gray-700 mb-4">{route.description}</p>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="bg-gray-50 rounded p-3">
                      <p className="text-gray-600">Traffic</p>
                      <p className="font-semibold capitalize">{route.traffic_density}</p>
                    </div>
                    <div className="bg-gray-50 rounded p-3">
                      <p className="text-gray-600">Emergency Access</p>
                      <p className={`font-semibold ${route.emergency_vehicles_accessible ? 'text-green-600' : 'text-red-600'}`}>
                        {route.emergency_vehicles_accessible ? 'Yes' : 'No'}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded p-3">
                      <p className="text-gray-600">Alternative</p>
                      <p className={`font-semibold ${route.alternative_routes_available ? 'text-green-600' : 'text-gray-600'}`}>
                        {route.alternative_routes_available ? 'Available' : 'None'}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded p-3">
                      <p className="text-gray-600">Severity</p>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getSeverityBadge(route.severity)}`}>
                        {route.severity.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LankaRouteWatchPage;
