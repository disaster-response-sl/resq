import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  MapPin,
  FileText,
  Activity,
  Package,
  TrendingUp,
  RefreshCw,
  BarChart3
} from 'lucide-react';
import { Link } from 'react-router-dom';
import MainLayout from './MainLayout';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface DashboardStats {
  disasters: {
    total: number;
    active: number;
    resolved: number;
    critical: number;
  };
  sos: {
    total: number;
    pending: number;
    acknowledged: number;
    responding: number;
    resolved: number;
  };
  reports: {
    total: number;
    pending: number;
  };
  resources: {
    total: number;
    allocated: number;
    available: number;
  };
}

interface RecentActivity {
  id: string;
  type: 'sos' | 'disaster' | 'report' | 'resource';
  title: string;
  description: string;
  timestamp: string;
  status: 'pending' | 'active' | 'resolved' | 'completed';
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    disasters: { total: 0, active: 0, resolved: 0, critical: 0 },
    sos: { total: 0, pending: 0, acknowledged: 0, responding: 0, resolved: 0 },
    reports: { total: 0, pending: 0 },
    resources: { total: 0, allocated: 0, available: 0 }
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      // Create an AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      // Build SOS query parameters (similar to SOSDashboard)
      const sosQueryParams = new URLSearchParams({
        status: '',
        priority: '',
        timeRange: '7d', // Show signals from last 7 days
        page: '1',
        limit: '10',
        sortBy: 'created_at',
        sortOrder: 'desc'
      });

      // Fetch all data in parallel with error handling
      const [reportsResponse, sosResponse, disasterResponse, resourceResponse] = await Promise.allSettled([
        fetch(`${API_BASE_URL}/api/public/reports`, {
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${API_BASE_URL}/api/admin/sos/dashboard?${sosQueryParams}`, {
          signal: controller.signal,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${API_BASE_URL}/api/admin/disasters/stats`, {
          signal: controller.signal,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${API_BASE_URL}/api/resources/stats`, {
          signal: controller.signal,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      clearTimeout(timeoutId);

      // Update stats
      const newStats: DashboardStats = {
        disasters: { total: 0, active: 0, resolved: 0, critical: 0 },
        sos: { total: 0, pending: 0, acknowledged: 0, responding: 0, resolved: 0 },
        reports: { total: 0, pending: 0 },
        resources: { total: 0, allocated: 0, available: 0 }
      };

      // Extract data from API responses for activity generation
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let sosData: any = null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let disasterData: any = null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let reportsData: any = null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let resourceData: any = null;

      // Handle reports stats
      if (reportsResponse.status === 'fulfilled' && reportsResponse.value.ok) {
        try {
          reportsData = await reportsResponse.value.json();
          if (reportsData.success && reportsData.data) {
            const reports = reportsData.data;
            newStats.reports = {
              total: reports.length,
              pending: reports.filter((r: any) => r.status === 'pending').length
            };
          }
        } catch (error) {
          console.warn('Reports stats parsing error:', error);
        }
      }

      // Handle SOS stats
      if (sosResponse.status === 'fulfilled' && sosResponse.value.ok) {
        try {
          sosData = await sosResponse.value.json();
          console.log('SOS stats received:', sosData);
          console.log('SOS data structure:', sosData.data);
          console.log('SOS stats object:', sosData.data?.stats);
          console.log('SOS stats properties:', Object.keys(sosData.data?.stats || {}));
          console.log('SOS stats values:', JSON.stringify(sosData.data?.stats, null, 2));
          if (sosData.success && sosData.data?.stats) {
            newStats.sos = {
              total: sosData.data.stats.total || sosData.data.stats.Total || 0,
              pending: sosData.data.stats.pending || sosData.data.stats.Pending || sosData.data.stats.PENDING || 0,
              acknowledged: sosData.data.stats.acknowledged || sosData.data.stats.Acknowledged || sosData.data.stats.ACKNOWLEDGED || 0,
              responding: sosData.data.stats.responding || sosData.data.stats.Responding || sosData.data.stats.RESPONDING || 0,
              resolved: sosData.data.stats.resolved || sosData.data.stats.Resolved || sosData.data.stats.RESOLVED || 0
            };
            console.log('Mapped SOS stats:', newStats.sos);
            console.log('SOS stats breakdown:', {
              total: newStats.sos.total,
              pending: newStats.sos.pending,
              acknowledged: newStats.sos.acknowledged,
              responding: newStats.sos.responding,
              resolved: newStats.sos.resolved
            });
          } else {
            console.warn('SOS data structure issue:', { success: sosData.success, hasData: !!sosData.data, hasStats: !!sosData.data?.stats });
          }
        } catch (parseError) {
          console.warn('Failed to parse SOS response:', parseError);
        }
      } else if (sosResponse.status === 'rejected') {
        console.warn('SOS stats failed:', sosResponse.reason);
      }

      // Handle disaster stats
      if (disasterResponse.status === 'fulfilled' && disasterResponse.value.ok) {
        try {
          disasterData = await disasterResponse.value.json();
          console.log('Disaster stats received:', disasterData);
          if (disasterData.success) {
            newStats.disasters = {
              total: disasterData.data?.overview?.total_disasters || 0,
              active: disasterData.data?.overview?.active_disasters || 0,
              resolved: disasterData.data?.overview?.resolved_disasters || 0,
              critical: disasterData.data?.overview?.critical_disasters || 0
            };
          }
        } catch (parseError) {
          console.warn('Failed to parse disaster response:', parseError);
        }
      } else if (disasterResponse.status === 'rejected') {
        console.warn('Disaster stats failed:', disasterResponse.reason);
      }

      // Handle resource stats
      if (resourceResponse.status === 'fulfilled' && resourceResponse.value.ok) {
        try {
          resourceData = await resourceResponse.value.json();
          console.log('Resource stats received:', resourceData);
          console.log('Resource data:', resourceData.data);
          console.log('Resource overview:', resourceData.data?.overview);
          if (resourceData.success) {
            newStats.resources = {
              total: resourceData.data?.overview?.total_resources || resourceData.data?.total || 0,
              allocated: resourceData.data?.overview?.allocated_resources || resourceData.data?.allocated || 0,
              available: resourceData.data?.overview?.available_resources || resourceData.data?.available || 0
            };
            console.log('Mapped resource stats:', newStats.resources);
          } else {
            console.warn('Resource API response not successful:', resourceData);
          }
        } catch (parseError) {
          console.warn('Failed to parse resource response:', parseError);
        }
      } else if (resourceResponse.status === 'rejected') {
        console.warn('Resource stats failed:', resourceResponse.reason);
      }

      setStats(newStats);
      console.log('Final dashboard stats:', newStats);

      // Generate recent activity from API data
      const activities: RecentActivity[] = [];

      // Add SOS activities from actual data
      if (sosData?.data?.signals && Array.isArray(sosData.data.signals)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sosData.data.signals.slice(0, 3).forEach((signal: any, index: number) => {
          activities.push({
            id: `sos-${signal._id || index}`,
            type: 'sos',
            title: `SOS Signal ${signal._id ? signal._id.toString().slice(-4) : `#${index + 1}`}`,
            description: signal.message || `Emergency signal from ${signal.location?.address || 'unknown location'}`,
            timestamp: signal.created_at || new Date(Date.now() - 1000 * 60 * 15 * index).toISOString(),
            status: signal.status || 'pending',
            priority: signal.priority || 'high'
          });
        });
      }

      // Add disaster activities from actual data
      if (disasterData?.data?.overview) {
        // Create activities based on disaster stats
        if (disasterData.data.overview.active_disasters > 0) {
          activities.push({
            id: 'disaster-active',
            type: 'disaster',
            title: 'Active Disaster Alert',
            description: `${disasterData.data.overview.active_disasters} active disasters requiring attention`,
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            status: 'active',
            priority: 'critical'
          });
        }
        if (disasterData.data.overview.critical_disasters > 0) {
          activities.push({
            id: 'disaster-critical',
            type: 'disaster',
            title: 'Critical Disaster Response',
            description: `${disasterData.data.overview.critical_disasters} critical disasters need immediate response`,
            timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
            status: 'active',
            priority: 'critical'
          });
        }
      }



      // Add resource activities from actual data
      if (resourceData?.data?.overview) {
        if (resourceData.data.overview.allocated_resources > 0) {
          activities.push({
            id: 'resource-allocated',
            type: 'resource',
            title: 'Resource Allocation',
            description: `${resourceData.data.overview.allocated_resources} resources currently allocated`,
            timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
            status: 'active'
          });
        }
      }

      // If no activities from APIs, add some default ones based on current stats
      if (activities.length === 0) {
        // Create activities based on the actual stats we have
        if (newStats.sos.total > 0) {
          activities.push({
            id: '1',
            type: 'sos',
            title: 'SOS System Active',
            description: `${newStats.sos.total} SOS signals in system (${newStats.sos.pending} pending)`,
            timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
            status: 'active',
            priority: 'high'
          });
        }

        if (newStats.disasters.active > 0) {
          activities.push({
            id: '2',
            type: 'disaster',
            title: 'Active Disaster Response',
            description: `${newStats.disasters.active} active disasters (${newStats.disasters.critical} critical)`,
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            status: 'active',
            priority: 'critical'
          });
        }

        if (newStats.resources.total > 0) {
          activities.push({
            id: '4',
            type: 'resource',
            title: 'Resource Management',
            description: `${newStats.resources.available} resources available (${newStats.resources.allocated} allocated)`,
            timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
            status: 'active'
          });
        }

        // If still no activities, add generic system status
        if (activities.length === 0) {
          activities.push({
            id: 'system-status',
            type: 'sos',
            title: 'System Operational',
            description: 'All disaster response systems are operational and monitoring',
            timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
            status: 'active',
            priority: 'low'
          });
        }
      }

      // Sort activities by timestamp (most recent first)
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Take only the most recent 10 activities
      setRecentActivity(activities.slice(0, 10));
      setLastUpdated(new Date());

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        toast.error('Request timed out. Please try again.');
      } else {
        toast.error('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    fetchDashboardData();

    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'sos': return <AlertTriangle className="w-4 h-4" />;
      case 'disaster': return <MapPin className="w-4 h-4" />;
      case 'resource': return <Package className="w-4 h-4" />;
      case 'report': return <FileText className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="p-6">
          <div className="flex items-center justify-center h-96">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Loading dashboard...</span>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
            <p className="text-gray-600 mt-1">Comprehensive view of all system activities</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
            <button
              onClick={fetchDashboardData}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Disaster Overview */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Disasters</p>
                <p className="text-2xl font-bold text-red-600">{stats.disasters.active}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.disasters.critical} critical • {stats.disasters.total} total
                </p>
              </div>
              <MapPin className="w-8 h-8 text-red-500" />
            </div>
          </div>

          {/* SOS Overview */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">SOS Signals</p>
                <p className="text-2xl font-bold text-orange-600">{stats.sos.total}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.sos.pending} pending • {stats.sos.acknowledged} acknowledged • {stats.sos.responding} responding
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </div>

          {/* Reports Overview */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Citizen Reports</p>
                <p className="text-2xl font-bold text-blue-600">{formatNumber(stats.reports.total)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.reports.pending} pending review
                </p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          {/* Resource Overview */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resources</p>
                <p className="text-2xl font-bold text-blue-600">{stats.resources.available}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.resources.allocated} allocated • {stats.resources.total} total
                </p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </div>
        </div>

        {/* System Status Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              {user?.role === 'admin' && (
                <Link
                  to="/sos"
                  className="flex items-center gap-3 p-3 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">SOS Monitor</p>
                    <p className="text-xs text-gray-500">View emergency signals</p>
                  </div>
                </Link>
              )}

              <Link
                to="/map/disaster"
                className="flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <MapPin className="w-5 h-5 text-blue-600" />
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">Disaster Map</p>
                  <p className="text-xs text-gray-500">View active disasters</p>
                </div>
              </Link>

              <Link
                to="/resources"
                className="flex items-center gap-3 p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
              >
                <Package className="w-5 h-5 text-purple-600" />
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">Resources</p>
                  <p className="text-xs text-gray-500">Allocate supplies</p>
                </div>
              </Link>
            </div>
          </div>

          {/* System Health */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">SOS Response System</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-green-600">Operational</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Resource Management</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-xs text-yellow-600">Maintenance</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Analytics Engine</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-green-600">Running</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <p className="text-sm text-gray-600 mt-1">Latest updates from all system components</p>
          </div>

          <div className="divide-y divide-gray-200">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${
                    activity.type === 'sos' ? 'bg-red-100' :
                    activity.type === 'disaster' ? 'bg-orange-100' :
                    activity.type === 'report' ? 'bg-blue-100' :
                    'bg-purple-100'
                  }`}>
                    {getActivityIcon(activity.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium text-gray-900">{activity.title}</h4>
                      {activity.priority && (
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityColor(activity.priority)}`}>
                          {activity.priority}
                        </span>
                      )}
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                    <p className="text-xs text-gray-500">{getTimeAgo(activity.timestamp)}</p>
                  </div>

                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>

          {recentActivity.length === 0 && (
            <div className="px-6 py-8 text-center">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No recent activity</p>
            </div>
          )}
        </div>

        {/* Analytics Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Disaster Analytics */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Disaster Analytics</h3>
              <BarChart3 className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Disasters</span>
                <span className="text-sm font-medium text-red-600">{stats.disasters.active}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Resolved This Month</span>
                <span className="text-sm font-medium text-green-600">{stats.disasters.resolved}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Critical Alerts</span>
                <span className="text-sm font-medium text-orange-600">{stats.disasters.critical}</span>
              </div>
            </div>
            <Link
              to="/analytics"
              className="w-full mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium inline-block text-center"
            >
              View Full Analytics
            </Link>
          </div>

          {/* SOS Analytics */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">SOS Analytics</h3>
              <AlertTriangle className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Signals</span>
                <span className="text-sm font-medium text-blue-600">{stats.sos.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pending Signals</span>
                <span className="text-sm font-medium text-yellow-600">{stats.sos.pending}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Acknowledged</span>
                <span className="text-sm font-medium text-orange-600">{stats.sos.acknowledged}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Response Rate</span>
                <span className="text-sm font-medium text-green-600">
                  {stats.sos.total > 0 ? Math.round(((stats.sos.acknowledged + stats.sos.responding + stats.sos.resolved) / stats.sos.total) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Resolution Rate</span>
                <span className="text-sm font-medium text-purple-600">
                  {stats.sos.total > 0 ? Math.round((stats.sos.resolved / stats.sos.total) * 100) : 0}%
                </span>
              </div>
            </div>
            {user?.role === 'admin' ? (
              <Link
                to="/sos"
                className="w-full mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium inline-block text-center"
              >
                View SOS Monitor
              </Link>
            ) : (
              <div className="w-full mt-4 px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm font-medium text-center cursor-not-allowed">
                SOS Monitor (Admin Only)
              </div>
            )}
          </div>

          {/* Emergency Statistics */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Emergency Statistics</h3>
              <TrendingUp className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Disasters</span>
                <span className="text-sm font-medium text-red-600">{stats.disasters.active}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pending SOS</span>
                <span className="text-sm font-medium text-orange-600">{stats.sos.pending}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pending Reports</span>
                <span className="text-sm font-medium text-blue-600">{stats.reports.pending}</span>
              </div>
            </div>
            <Link
              to="/reports"
              className="w-full mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium inline-block text-center"
            >
              View All Reports
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
