import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  MapPin,
  User,
  XCircle,
  AlertCircle,
  RefreshCw,
  Filter,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  TrendingUp,
  Activity,
  CheckCircle,
  X
} from 'lucide-react';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';
import MainLayout from './MainLayout';

interface SOSSignal {
  _id: string;
  user_id: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  message: string;
  status: 'pending' | 'acknowledged' | 'responding' | 'resolved' | 'false_alarm';
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  updated_at: string;
  assigned_responder?: string;
  escalation_level?: number;
  notes?: Array<{
    responder_id: string;
    note: string;
    timestamp: string;
  }>;
  emergency_type?: 'medical' | 'fire' | 'accident' | 'crime' | 'natural_disaster' | 'other';
}

interface SOSStats {
  total: number;
  pending: number;
  acknowledged: number;
  responding: number;
  resolved: number;
  false_alarm?: number; // Made optional as backend doesn't always include it
  critical: number;
  high: number;
  medium?: number; // Made optional as backend doesn't always include it
  low?: number; // Made optional as backend doesn't always include it
  escalated?: number; // Added from backend
}

interface SOSCluster {
  id: string;
  center: {
    lat: number;
    lng: number;
  };
  signals: SOSSignal[];
  priority: string;
  status: string;
  radius: number;
}

interface SOSDashboardProps {
  standalone?: boolean; // Whether this is used as a standalone page or sub-component
}

const SOSDashboard: React.FC<SOSDashboardProps> = ({ standalone = true }) => {
  const [signals, setSignals] = useState<SOSSignal[]>([]);
  const [stats, setStats] = useState<SOSStats | null>(null);
  const [clusters, setClusters] = useState<SOSCluster[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filters and pagination
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    timeRange: '7d'  // Changed from '24h' to '7d' to show existing signals
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });
  const sortBy = 'created_at';
  const sortOrder = 'desc';
  
  // Selected signal for details
  const [selectedSignal, setSelectedSignal] = useState<SOSSignal | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedResponder, setSelectedResponder] = useState('');
  const [assignNotes, setAssignNotes] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

  // Fetch SOS dashboard data
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const user = authService.getCurrentUser();
      const isAdmin = user?.role === 'admin';
      
      let apiUrl: string;
      let response: Response;

      if (isAdmin) {
        // Admin endpoint - has full features and dashboard stats
        const queryParams = new URLSearchParams({
          status: filters.status !== 'all' ? filters.status : '',
          priority: filters.priority !== 'all' ? filters.priority : '',
          timeRange: filters.timeRange,
          page: pagination.page.toString(),
          limit: pagination.limit.toString(),
          sortBy,
          sortOrder
        });

        apiUrl = `${API_BASE_URL}/api/admin/sos/dashboard?${queryParams}`;
      } else {
        // Responder endpoint - public nearby SOS
        apiUrl = `${API_BASE_URL}/api/sos/public/nearby`;
      }

      response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        if (isAdmin) {
          // Admin response structure
          setSignals(data.data.signals || []);
          setStats(data.data.stats || null);
          setPagination(prev => ({
            ...prev,
            total: data.data.pagination?.total || 0,
            totalPages: data.data.pagination?.totalPages || 0
          }));
        } else {
          // Responder response structure - all SOS in data array
          setSignals(data.data || []);
          // Create basic stats from signals
          const signals = data.data || [];
          const basicStats = {
            total: signals.length,
            pending: signals.filter((s: SOSSignal) => s.status === 'pending').length,
            acknowledged: signals.filter((s: SOSSignal) => s.status === 'acknowledged').length,
            responding: signals.filter((s: SOSSignal) => s.status === 'responding').length,
            resolved: signals.filter((s: SOSSignal) => s.status === 'resolved').length,
            critical: signals.filter((s: SOSSignal) => s.priority === 'critical').length,
            high: signals.filter((s: SOSSignal) => s.priority === 'high').length
          };
          setStats(basicStats);
          setPagination(prev => ({
            ...prev,
            total: signals.length,
            totalPages: Math.ceil(signals.length / prev.limit)
          }));
        }
      } else {
        throw new Error(data.message || 'Failed to fetch SOS dashboard data');
      }
    } catch (err) {
      console.error('Error fetching SOS dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch SOS dashboard data');
      toast.error('Failed to load SOS dashboard data');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit, sortBy, sortOrder, API_BASE_URL]);

  // Fetch SOS clusters
  const fetchClusters = useCallback(async () => {
    try {
      const token = authService.getToken();
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/api/admin/sos/clusters`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setClusters(data.data.clusters || []);
        }
      }
    } catch (err) {
      console.error('Error fetching clusters:', err);
    }
  }, [API_BASE_URL]);

  // Fetch SOS analytics
  const fetchAnalytics = useCallback(async () => {
    try {
      const token = authService.getToken();
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/api/admin/sos/analytics?timeRange=${filters.timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Analytics data received
        }
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  }, [API_BASE_URL, filters.timeRange]);

  // Update SOS signal status
  const updateSignalStatus = async (signalId: string, status: string, notes?: string) => {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/sos/${signalId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, notes })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        toast.success('SOS signal status updated successfully');
        fetchDashboardData(); // Refresh data
      } else {
        throw new Error(data.message || 'Failed to update status');
      }
    } catch (err) {
      console.error('Error updating signal status:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  // Assign responder to SOS signal
  const assignResponder = async (signalId: string, responderId: string, notes?: string) => {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/sos/${signalId}/assign`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ responder_id: responderId, notes })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        toast.success('Responder assigned successfully');
        fetchDashboardData(); // Refresh data
      } else {
        throw new Error(data.message || 'Failed to assign responder');
      }
    } catch (err) {
      console.error('Error assigning responder:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to assign responder');
    }
  };

  // Escalate SOS signal
  const escalateSignal = async (signalId: string, escalationLevel: number, reason?: string) => {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/sos/${signalId}/escalate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ escalation_level: escalationLevel, reason })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        toast.success('SOS signal escalated successfully');
        fetchDashboardData(); // Refresh data
      } else {
        throw new Error(data.message || 'Failed to escalate signal');
      }
    } catch (err) {
      console.error('Error escalating signal:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to escalate signal');
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchClusters();
    fetchAnalytics();
  }, [filters, pagination.page, sortBy, sortOrder, fetchDashboardData, fetchClusters, fetchAnalytics]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData();
      fetchClusters();
      fetchAnalytics();
    }, 30000);

    return () => clearInterval(interval);
  }, [filters, pagination.page, sortBy, sortOrder, fetchDashboardData, fetchClusters, fetchAnalytics]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'acknowledged': return 'bg-blue-100 text-blue-800';
      case 'responding': return 'bg-orange-100 text-orange-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'false_alarm': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return standalone ? (
    <MainLayout>
      <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
        {/* Header - Mobile Responsive */}
        <div className="flex justify-between items-center gap-2">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-1 sm:gap-2">
            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-red-600" />
            <span className="hidden sm:inline">SOS Emergency Dashboard</span>
            <span className="sm:hidden">SOS Dashboard</span>
          </h1>
          <button
            onClick={() => {
              fetchDashboardData();
              fetchClusters();
              fetchAnalytics();
            }}
            disabled={loading}
            className="flex items-center gap-1 sm:gap-2 px-2 py-1.5 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm sm:text-base"
          >
            <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Statistics Cards - Mobile Responsive */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            <div className="bg-white rounded-lg shadow p-2 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-2 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Pending</p>
                  <p className="text-lg sm:text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-2 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Responding</p>
                  <p className="text-lg sm:text-2xl font-bold text-orange-600">{stats.responding}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-2 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Critical</p>
                  <p className="text-lg sm:text-2xl font-bold text-red-600">{stats.critical || 0}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters - Mobile Responsive */}
        <div className="bg-white rounded-lg shadow p-2 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 items-start sm:items-center">
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <Filter className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
              <span className="text-xs sm:text-sm font-medium text-gray-700">Filters:</span>
            </div>
            
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="border border-gray-300 rounded-md px-2 py-1 sm:px-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-0 flex-1 sm:flex-none"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="responding">Responding</option>
              <option value="resolved">Resolved</option>
              <option value="false_alarm">False Alarm</option>
            </select>
            
            <select
              value={filters.priority}
              onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-0 flex-1 sm:flex-none"
            >
              <option value="all">All Priority</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            
            <select
              value={filters.timeRange}
              onChange={(e) => setFilters(prev => ({ ...prev, timeRange: e.target.value }))}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-0 flex-1 sm:flex-none"
            >
              <option value="1h">Last Hour</option>
              <option value="6h">Last 6 Hours</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>

        {/* SOS Signals Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">SOS Signals</h2>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
              <p className="mt-2 text-gray-500">Loading SOS signals...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-600">
              <AlertCircle className="w-8 h-8 mx-auto mb-2" />
              <p>{error}</p>
            </div>
          ) : signals.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
              <p>No SOS signals found</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-w-full">
              <table className="w-full divide-y divide-gray-200 table-fixed">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Signal Info
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                      Message
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40 hidden sm:table-cell">
                      Location
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      Status
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                      Priority
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28 hidden md:table-cell">
                      Time
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {signals.map((signal) => (
                    <tr key={signal._id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mr-2 flex-shrink-0" />
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                              {signal.user_id}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              ID: {signal._id.slice(-8)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 min-w-0">
                        <div className="text-xs sm:text-sm text-gray-900 max-w-full truncate">
                          {signal.message}
                        </div>
                        {signal.emergency_type && (
                          <div className="text-xs text-gray-500 capitalize truncate">
                            {signal.emergency_type.replace('_', ' ')}
                          </div>
                        )}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                        <div className="flex items-center text-xs sm:text-sm text-gray-900">
                          <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 mr-1 flex-shrink-0" />
                          <div className="truncate max-w-32">
                            <div className="truncate">{signal.location.lat.toFixed(4)}, {signal.location.lng.toFixed(4)}</div>
                            {signal.location.address && (
                              <div className="text-xs text-gray-500 truncate">{signal.location.address}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-1.5 sm:px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(signal.status)}`}>
                          <span className="hidden sm:inline">{signal.status.replace('_', ' ').toUpperCase()}</span>
                          <span className="sm:hidden">{signal.status.charAt(0).toUpperCase()}</span>
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-1.5 sm:px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(signal.priority)}`}>
                          {signal.priority.charAt(0).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                        <div className="text-xs sm:text-sm text-gray-900">
                          <div className="truncate">{getTimeAgo(signal.created_at)}</div>
                          <div className="text-xs text-gray-500 truncate">{formatTime(signal.created_at)}</div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                        <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                          <button
                            onClick={() => {
                              setSelectedSignal(signal);
                              setShowDetails(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 truncate"
                          >
                            View
                          </button>
                          <select
                            value={signal.status}
                            onChange={(e) => updateSignalStatus(signal._id, e.target.value)}
                            className="text-xs border border-gray-300 rounded px-1 sm:px-2 py-1 w-full sm:w-auto"
                          >
                            <option value="pending">Pending</option>
                            <option value="acknowledged">Ack</option>
                            <option value="responding">Resp</option>
                            <option value="resolved">Res</option>
                            <option value="false_alarm">False</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-700">
                <span>
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Clusters Information */}
        {clusters.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Signal Clusters</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clusters.map((cluster, index) => (
                <div key={cluster.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">Cluster {index + 1}</span>
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                      {cluster.signals.length} signals
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {cluster.center.lat.toFixed(4)}, {cluster.center.lng.toFixed(4)}
                    </div>
                    <div className="mt-1">
                      Radius: {cluster.radius.toFixed(2)} km
                    </div>
                    <div className="mt-1">
                      Priority: <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(cluster.priority)}`}>
                        {cluster.priority.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Signal Details Modal */}
        {showDetails && selectedSignal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">SOS Signal Details</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="px-6 py-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Signal ID</label>
                    <p className="text-sm text-gray-900">{selectedSignal._id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Individual ID</label>
                    <p className="text-sm text-gray-900">{selectedSignal.user_id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedSignal.status)}`}>
                        {selectedSignal.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <select
                        value={selectedSignal.status}
                        onChange={(e) => updateSignalStatus(selectedSignal._id, e.target.value as 'pending' | 'acknowledged' | 'responding' | 'resolved' | 'false_alarm', 'Status updated via dashboard')}
                        className="text-xs border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="pending">Pending</option>
                        <option value="acknowledged">Acknowledged</option>
                        <option value="responding">Responding</option>
                        <option value="resolved">Resolved</option>
                        <option value="false_alarm">False Alarm</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Priority</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(selectedSignal.priority)}`}>
                      {selectedSignal.priority.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Created</label>
                    <p className="text-sm text-gray-900">{formatTime(selectedSignal.created_at)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Updated</label>
                    <p className="text-sm text-gray-900">{formatTime(selectedSignal.updated_at)}</p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Location</label>
                  <div className="text-sm text-gray-900">
                    <div>Latitude: {selectedSignal.location.lat}</div>
                    <div>Longitude: {selectedSignal.location.lng}</div>
                    {selectedSignal.location.address && (
                      <div>Address: {selectedSignal.location.address}</div>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Message</label>
                  <p className="text-sm text-gray-900">{selectedSignal.message}</p>
                </div>
                
                {selectedSignal.emergency_type && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Emergency Type</label>
                    <p className="text-sm text-gray-900 capitalize">{selectedSignal.emergency_type.replace('_', ' ')}</p>
                  </div>
                )}
                
                {selectedSignal.assigned_responder && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Assigned Responder</label>
                    <p className="text-sm text-gray-900">{selectedSignal.assigned_responder}</p>
                  </div>
                )}
                
                {selectedSignal.escalation_level !== undefined && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Escalation Level</label>
                    <p className="text-sm text-gray-900">{selectedSignal.escalation_level}</p>
                  </div>
                )}
                
                {selectedSignal.notes && selectedSignal.notes.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Notes</label>
                    <div className="space-y-2">
                      {selectedSignal.notes.map((note, index) => (
                        <div key={index} className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                          <div className="font-medium">{note.responder_id}</div>
                          <div>{note.note}</div>
                          <div className="text-xs text-gray-500">{formatTime(note.timestamp)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="px-6 py-4 border-t border-gray-200 flex gap-2">
                <button
                  onClick={() => {
                    setSelectedResponder('');
                    setAssignNotes('');
                    setShowAssignModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  disabled={!!selectedSignal.assigned_responder}
                >
                  <UserCheck className="w-4 h-4" />
                  {selectedSignal.assigned_responder ? 'Already Assigned' : 'Assign Responder'}
                </button>
                <button
                  onClick={() => escalateSignal(selectedSignal._id, (selectedSignal.escalation_level || 0) + 1, 'Manual escalation')}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  <TrendingUp className="w-4 h-4" />
                  Escalate
                </button>
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Assign Responder Modal */}
        {showAssignModal && selectedSignal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Assign Responder</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Responder
                  </label>
                  <select
                    value={selectedResponder}
                    onChange={(e) => setSelectedResponder(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Choose a responder...</option>
                    <option value="admin_seed">Admin Seed (Emergency Coordinator)</option>
                    <option value="responder001">Responder 001 (Field Team Alpha)</option>
                    <option value="responder002">Responder 002 (Medical Team)</option>
                    <option value="responder003">Responder 003 (Fire Department)</option>
                    <option value="responder004">Responder 004 (Police Unit)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assignment Notes
                  </label>
                  <textarea
                    value={assignNotes}
                    onChange={(e) => setAssignNotes(e.target.value)}
                    placeholder="Add any notes for this assignment..."
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={async () => {
                    if (selectedResponder) {
                      await assignResponder(selectedSignal._id, selectedResponder, assignNotes || 'Assigned via dashboard');
                      setShowAssignModal(false);
                      setSelectedResponder('');
                      setAssignNotes('');
                    }
                  }}
                  disabled={!selectedResponder}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Assign Responder
                </button>
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedResponder('');
                    setAssignNotes('');
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  ) : (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <AlertTriangle className="w-8 h-8 text-red-600" />
          SOS Emergency Dashboard
        </h1>
        <button
          onClick={() => {
            fetchDashboardData();
            fetchClusters();
            fetchAnalytics();
          }}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Signals</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Responding</p>
                <p className="text-2xl font-bold text-orange-600">{stats.responding}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Critical</p>
                <p className="text-2xl font-bold text-red-600">{stats.critical || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="responding">Responding</option>
            <option value="resolved">Resolved</option>
            <option value="false_alarm">False Alarm</option>
          </select>
          
          <select
            value={filters.priority}
            onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Priority</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          
          <select
            value={filters.timeRange}
            onChange={(e) => setFilters(prev => ({ ...prev, timeRange: e.target.value }))}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1h">Last Hour</option>
            <option value="6h">Last 6 Hours</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* SOS Signals Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">SOS Signals</h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
            <p className="mt-2 text-gray-500">Loading SOS signals...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p>{error}</p>
          </div>
        ) : signals.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
            <p>No SOS signals found</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-w-full">
            <table className="w-full divide-y divide-gray-200 table-fixed">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Signal Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                    Message
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {signals.map((signal) => (
                  <tr key={signal._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-5 h-5 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {signal.user_id}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {signal._id.slice(-8)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 min-w-0">
                      <div className="text-sm text-gray-900 max-w-full truncate">
                        {signal.message}
                      </div>
                      {signal.emergency_type && (
                        <div className="text-xs text-gray-500 capitalize truncate">
                          {signal.emergency_type.replace('_', ' ')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <MapPin className="w-4 h-4 text-gray-400 mr-1" />
                        <div className="max-w-32 truncate">
                          <div className="truncate">{signal.location.lat.toFixed(6)}, {signal.location.lng.toFixed(6)}</div>
                          {signal.location.address && (
                            <div className="text-xs text-gray-500 truncate">{signal.location.address}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(signal.status)}`}>
                        {signal.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(signal.priority)}`}>
                        {signal.priority.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="truncate">{getTimeAgo(signal.created_at)}</div>
                      <div className="text-xs text-gray-500 truncate">{formatTime(signal.created_at)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedSignal(signal);
                            setShowDetails(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 text-sm"
                        >
                          View
                        </button>
                        
                        {/* Status Action Buttons */}
                        <div className="flex items-center gap-1">
                          {signal.status === 'pending' && (
                            <>
                              <button
                                onClick={() => updateSignalStatus(signal._id, 'acknowledged', 'Signal acknowledged')}
                                className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full hover:bg-yellow-200 transition-colors"
                                title="Acknowledge signal"
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Ack
                              </button>
                              <button
                                onClick={() => updateSignalStatus(signal._id, 'false_alarm', 'Marked as false alarm')}
                                className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full hover:bg-gray-200 transition-colors"
                                title="Mark as false alarm"
                              >
                                <X className="w-3 h-3 mr-1" />
                                False
                              </button>
                            </>
                          )}
                          
                          {signal.status === 'acknowledged' && (
                            <>
                              <button
                                onClick={() => updateSignalStatus(signal._id, 'responding', 'Started responding')}
                                className="inline-flex items-center px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full hover:bg-orange-200 transition-colors"
                                title="Start responding"
                              >
                                <Activity className="w-3 h-3 mr-1" />
                                Respond
                              </button>
                              <button
                                onClick={() => updateSignalStatus(signal._id, 'false_alarm', 'Marked as false alarm')}
                                className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full hover:bg-gray-200 transition-colors"
                                title="Mark as false alarm"
                              >
                                <X className="w-3 h-3 mr-1" />
                                False
                              </button>
                            </>
                          )}
                          
                          {signal.status === 'responding' && (
                            <button
                              onClick={() => updateSignalStatus(signal._id, 'resolved', 'Signal resolved')}
                              className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full hover:bg-green-200 transition-colors"
                              title="Mark as resolved"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Resolve
                            </button>
                          )}
                          
                          {(signal.status === 'resolved' || signal.status === 'false_alarm') && (
                            <button
                              onClick={() => updateSignalStatus(signal._id, 'pending', 'Signal reopened')}
                              className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 transition-colors"
                              title="Reopen signal"
                            >
                              <RefreshCw className="w-3 h-3 mr-1" />
                              Reopen
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-700">
              <span>
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                disabled={pagination.page === pagination.totalPages}
                className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Clusters Information */}
      {clusters.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Signal Clusters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clusters.map((cluster, index) => (
              <div key={cluster.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">Cluster {index + 1}</span>
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                    {cluster.signals.length} signals
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {cluster.center.lat.toFixed(4)}, {cluster.center.lng.toFixed(4)}
                  </div>
                  <div className="mt-1">
                    Radius: {cluster.radius.toFixed(2)} km
                  </div>
                  <div className="mt-1">
                    Priority: <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(cluster.priority)}`}>
                      {cluster.priority.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Signal Details Modal */}
      {showDetails && selectedSignal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">SOS Signal Details</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Signal ID</label>
                  <p className="text-sm text-gray-900">{selectedSignal._id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Individual ID</label>
                  <p className="text-sm text-gray-900">{selectedSignal.user_id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedSignal.status)}`}>
                      {selectedSignal.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <select
                      value={selectedSignal.status}
                      onChange={(e) => updateSignalStatus(selectedSignal._id, e.target.value, 'Status updated via dashboard')}
                      className="text-xs border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="pending">Pending</option>
                      <option value="acknowledged">Acknowledged</option>
                      <option value="responding">Responding</option>
                      <option value="resolved">Resolved</option>
                      <option value="false_alarm">False Alarm</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Priority</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(selectedSignal.priority)}`}>
                    {selectedSignal.priority.toUpperCase()}
                  </span>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <p className="text-sm text-gray-900">{formatTime(selectedSignal.created_at)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Updated</label>
                  <p className="text-sm text-gray-900">{formatTime(selectedSignal.updated_at)}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Location</label>
                <div className="text-sm text-gray-900">
                  <div>Latitude: {selectedSignal.location.lat}</div>
                  <div>Longitude: {selectedSignal.location.lng}</div>
                  {selectedSignal.location.address && (
                    <div>Address: {selectedSignal.location.address}</div>
                  )}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Message</label>
                <p className="text-sm text-gray-900">{selectedSignal.message}</p>
              </div>
              
              {selectedSignal.emergency_type && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Emergency Type</label>
                  <p className="text-sm text-gray-900 capitalize">{selectedSignal.emergency_type.replace('_', ' ')}</p>
                </div>
              )}
              
              {selectedSignal.assigned_responder && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Assigned Responder</label>
                  <p className="text-sm text-gray-900">{selectedSignal.assigned_responder}</p>
                </div>
              )}
              
              {selectedSignal.escalation_level !== undefined && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Escalation Level</label>
                  <p className="text-sm text-gray-900">{selectedSignal.escalation_level}</p>
                </div>
              )}
              
              {selectedSignal.notes && selectedSignal.notes.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Notes</label>
                  <div className="space-y-2">
                    {selectedSignal.notes.map((note, index) => (
                      <div key={index} className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                        <div className="font-medium">{note.responder_id}</div>
                        <div>{note.note}</div>
                        <div className="text-xs text-gray-500">{formatTime(note.timestamp)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex gap-2">
              <button
                onClick={() => {
                  setSelectedResponder('');
                  setAssignNotes('');
                  setShowAssignModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                disabled={!!selectedSignal.assigned_responder}
              >
                <UserCheck className="w-4 h-4" />
                {selectedSignal.assigned_responder ? 'Already Assigned' : 'Assign Responder'}
              </button>
              <button
                onClick={() => escalateSignal(selectedSignal._id, (selectedSignal.escalation_level || 0) + 1, 'Manual escalation')}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                <TrendingUp className="w-4 h-4" />
                Escalate
              </button>
              <button
                onClick={() => setShowDetails(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Responder Modal */}
      {showAssignModal && selectedSignal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Assign Responder</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Responder
                </label>
                <select
                  value={selectedResponder}
                  onChange={(e) => setSelectedResponder(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Choose a responder...</option>
                  <option value="admin_seed">Admin Seed (Emergency Coordinator)</option>
                  <option value="responder001">Responder 001 (Field Team Alpha)</option>
                  <option value="responder002">Responder 002 (Medical Team)</option>
                  <option value="responder003">Responder 003 (Fire Department)</option>
                  <option value="responder004">Responder 004 (Police Unit)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assignment Notes
                </label>
                <textarea
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  placeholder="Add any notes for this assignment..."
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={async () => {
                  if (selectedResponder) {
                    await assignResponder(selectedSignal._id, selectedResponder, assignNotes || 'Assigned via dashboard');
                    setShowAssignModal(false);
                    setSelectedResponder('');
                    setAssignNotes('');
                  }
                }}
                disabled={!selectedResponder}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Assign Responder
              </button>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedResponder('');
                  setAssignNotes('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SOSDashboard;
