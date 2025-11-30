import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, MapPin, Navigation, Clock, TrendingUp } from 'lucide-react';
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
  const [stats, setStats] = useState<RouteStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedCondition, setSelectedCondition] = useState<string>('');
  const [view, setView] = useState<'reports' | 'stats'>('stats');

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
      // Fetch crowdsourced data from citizen reports
      const params: any = {
        limit: 100
      };
      
      if (selectedDistrict) params.district = selectedDistrict;
      if (selectedCondition) params.condition = selectedCondition;

      const [reportsRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/public/road-reports`, { params }),
        axios.get(`${API_BASE_URL}/api/public/route-stats`)
      ]);

      // Process crowdsourced reports - API returns data in response.data.data structure
      const reports = Array.isArray(reportsRes.data?.data) ? reportsRes.data.data : 
                     Array.isArray(reportsRes.data) ? reportsRes.data : [];
      setRoadReports(reports);

      // Set statistics from aggregated crowdsourced data
      const statsData = statsRes.data || {
        total_reports: 0,
        active_reports: 0,
        resolved_reports: 0,
        by_severity: {},
        by_condition: {},
        affected_districts: 0
      };
      
      setStats({
        total_reports: statsData.total_reports || 0,
        active_reports: statsData.active_reports || 0,
        resolved_reports: statsData.resolved_reports || 0,
        total_routes_monitored: statsData.total_reports || 0, // Based on report coverage
        affected_routes: statsData.active_reports || 0,
        safe_routes: 0, // Will be calculated based on areas with no reports
        affected_districts: statsData.affected_districts || 0,
        by_severity: statsData.by_severity || {},
        by_condition: statsData.by_condition || {}
      });

      if (reports.length === 0) {
        toast.success('No reports yet. Be the first to report road conditions!');
      } else {
        toast.success(`Loaded ${reports.length} crowdsourced reports`);
      }
    } catch (error) {
      console.error('Error fetching route data:', error);
      toast.error('Failed to load road reports');
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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Navigation className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">LankaRouteWatch</h1>
                <p className="text-blue-100 text-sm">Crowdsourced Road Condition Monitoring</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-2 bg-blue-800 bg-opacity-50 px-4 py-2 rounded-lg">
              <span className="text-sm">👥 Community Powered</span>
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

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">📊 Total Reports</p>
                <p className="text-3xl font-bold text-blue-600">{stats.total_reports}</p>
                <p className="text-xs text-gray-500 mt-1">Crowdsourced</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">⚠️ Active Issues</p>
                <p className="text-3xl font-bold text-orange-600">{stats.active_reports}</p>
                <p className="text-xs text-gray-500 mt-1">Needs attention</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">📍 Districts Affected</p>
                <p className="text-3xl font-bold text-purple-600">{stats.affected_districts}</p>
                <p className="text-xs text-gray-500 mt-1">Nationwide</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">✔️ Resolved</p>
                <p className="text-3xl font-bold text-green-600">{stats.resolved_reports}</p>
                <p className="text-xs text-gray-500 mt-1">Fixed issues</p>
              </div>
              <div className="bg-indigo-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">👥 Contributors</p>
                <p className="text-3xl font-bold text-indigo-600">{stats.total_reports}</p>
                <p className="text-xs text-gray-500 mt-1">Community driven</p>
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
                onChange={(e) => setView(e.target.value as 'reports' | 'stats')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="stats">Statistics</option>
                <option value="reports">Crowdsourced Reports</option>
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
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-12 text-center">
                <Navigation className="h-20 w-20 text-blue-400 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Be the First to Report!</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  No road condition reports yet in this area. Help your community by sharing real-time road conditions.
                </p>
                <button
                  onClick={() => navigate('/citizen/report-road')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors inline-flex items-center space-x-2"
                >
                  <AlertTriangle className="h-5 w-5" />
                  <span>Report Road Condition</span>
                </button>
                <p className="text-sm text-gray-500 mt-4">
                  Your report helps others plan safer routes and assists authorities in prioritizing road repairs.
                </p>
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
      </div>
    </div>
  );
};

export default LankaRouteWatchPage;
