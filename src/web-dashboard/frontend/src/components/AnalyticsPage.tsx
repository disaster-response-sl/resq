import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  MapPin,
  RefreshCw,
  Download,
  Settings
} from 'lucide-react';
import {
  BarChart as RechartsBarChart,
  Bar as RechartsBar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';
import MainLayout from './MainLayout';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

interface DisasterStats {
  overview: {
    total_disasters: number;
    total_affected_population: number;
    total_area_km2: number;
    average_duration_hours: number;
    total_personnel_required: number;
    total_vehicles_required: number;
    total_food_supplies: number;
    total_temporary_shelters: number;
  };
  by_priority: Array<{ _id: string; count: number }>;
  by_status: Array<{ _id: string; count: number }>;
  recent_activity: Array<{
    disaster_code: string;
    title: string;
    priority_level: string;
    updatedAt: string;
  }>;
}

interface SosStats {
  summary: {
    totalSignals: number;
    resolutionRate: string;
    averageResponseTime: number;
    escalatedCount: number;
  };
  priorityDistribution: { [key: string]: number };
  statusDistribution: { [key: string]: number };
}

interface AnalyticsData {
  disasterStats: DisasterStats | null;
  sosStats: SosStats | null;
  loading: boolean;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
}

const AnalyticsPage: React.FC = () => {
  // Force recompile to fix hot reload issue
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    disasterStats: null,
    sosStats: null,
    loading: true
  });
  const [timeRange, setTimeRange] = useState('7d');

  const fetchAnalyticsData = useCallback(async () => {
    const getStartDate = () => {
      const now = new Date();
      const startDate = new Date();

      switch (timeRange) {
        case '24h':
          startDate.setDate(now.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case '90d':
          startDate.setMonth(now.getMonth() - 3);
          break;
        default:
          startDate.setDate(now.getDate() - 7);
      }

      return startDate.toISOString().split('T')[0];
    };

    try {
      setAnalyticsData(prev => ({ ...prev, loading: true }));

      // Fetch disaster analytics
      const disasterResponse = await fetch(`${API_BASE_URL}/api/admin/analytics/statistics?startDate=${getStartDate()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const disasterData = await disasterResponse.json();

      // Fetch SOS analytics
      const sosResponse = await fetch(`${API_BASE_URL}/api/admin/sos/analytics?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const sosData = await sosResponse.json();

      setAnalyticsData({
        disasterStats: disasterData.success ? disasterData.data : null,
        sosStats: sosData.success ? sosData.data : null,
        loading: false
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
      setAnalyticsData(prev => ({ ...prev, loading: false }));
    }
  }, [timeRange]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange, fetchAnalyticsData]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return `${hours}h ${remainingMinutes}m`;
  };

  const StatCard = ({ title, value, subtitle }: StatCardProps) => (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mb-2">{value}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  // Chart color schemes
  const PRIORITY_COLORS = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#22c55e'
  };

  const STATUS_COLORS = {
    active: '#3b82f6',
    monitoring: '#8b5cf6',
    resolved: '#10b981',
    pending: '#f59e0b',
    acknowledged: '#06b6d4',
    responding: '#8b5cf6',
    APPROVED: '#10b981',
    PENDING_APPROVAL: '#f59e0b',
    REJECTED: '#ef4444',
    EXPIRED: '#6b7280'
  };

  // Transform data for charts
  const getPriorityChartData = () => {
    if (!analyticsData.disasterStats?.by_priority) return [];
    return analyticsData.disasterStats.by_priority.map(item => ({
      name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
      value: item.count,
      color: PRIORITY_COLORS[item._id as keyof typeof PRIORITY_COLORS] || '#6b7280'
    }));
  };

  const getStatusChartData = () => {
    if (!analyticsData.disasterStats?.by_status) return [];
    return analyticsData.disasterStats.by_status.map(item => ({
      name: item._id.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: item.count,
      color: STATUS_COLORS[item._id as keyof typeof STATUS_COLORS] || '#6b7280'
    }));
  };

  const getSosPriorityChartData = () => {
    if (!analyticsData.sosStats?.priorityDistribution) return [];
    return Object.entries(analyticsData.sosStats.priorityDistribution).map(([priority, count]) => ({
      name: priority.charAt(0).toUpperCase() + priority.slice(1),
      value: count,
      color: PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS] || '#6b7280'
    }));
  };

  const getSosStatusChartData = () => {
    if (!analyticsData.sosStats?.statusDistribution) return [];
    return Object.entries(analyticsData.sosStats.statusDistribution).map(([status, count]) => ({
      name: status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: count,
      color: STATUS_COLORS[status as keyof typeof STATUS_COLORS] || '#6b7280'
    }));
  };

  const getResourceChartData = () => {
    if (!analyticsData.disasterStats?.overview) return [];
    return [
      { name: 'Personnel', value: analyticsData.disasterStats.overview.total_personnel_required || 0 },
      { name: 'Vehicles', value: analyticsData.disasterStats.overview.total_vehicles_required || 0 },
      { name: 'Food Supplies', value: analyticsData.disasterStats.overview.total_food_supplies || 0 },
      { name: 'Shelters', value: analyticsData.disasterStats.overview.total_temporary_shelters || 0 }
    ];
  };

  if (analyticsData.loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50">
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-2 text-gray-600">Loading analytics...</span>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Top Navigation Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
              <span className="text-sm text-gray-500">Real-time disaster response insights</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleString()}
              </span>
              <button className="p-2 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-primary-50">
                <RefreshCw className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-primary-50">
                <Download className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-primary-50">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Time Range Selector */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">Time Range:</span>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 90 Days</option>
                </select>
              </div>
            </div>

            {/* Disaster Analytics */}
            {analyticsData.disasterStats && (
              <div className="space-y-6">
                {/* Section Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary-50 rounded-lg">
                      <MapPin className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Disaster Response Analytics</h2>
                      <p className="text-sm text-gray-600">Real-time disaster management insights</p>
                    </div>
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard
                    title="Total Disasters"
                    value={formatNumber(analyticsData.disasterStats.overview?.total_disasters || 0)}
                    subtitle="+12% from last month"
                  />
                  <StatCard
                    title="Affected Population"
                    value={formatNumber(analyticsData.disasterStats.overview?.total_affected_population || 0)}
                    subtitle="2.3M people impacted"
                  />
                  <StatCard
                    title="Area Affected"
                    value={formatNumber(analyticsData.disasterStats.overview?.total_area_km2 || 0)}
                    subtitle="km² coverage"
                  />
                  <StatCard
                    title="Avg Response Time"
                    value={formatDuration(analyticsData.disasterStats.overview?.average_duration_hours * 60 || 0)}
                    subtitle="Target: < 2 hours"
                  />
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Priority Distribution */}
                  <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Priority Distribution</h3>
                      <div className="text-sm text-gray-600">
                        Disaster priority levels
                      </div>
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart data={getPriorityChartData()}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                          <XAxis
                            dataKey="name"
                            fontSize={12}
                            tick={{ fill: '#6b7280' }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            fontSize={12}
                            tick={{ fill: '#6b7280' }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#ffffff',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                          <RechartsBar
                            dataKey="value"
                            fill="#3b82f6"
                            radius={[2, 2, 0, 0]}
                            maxBarSize={50}
                          />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Status Distribution */}
                  <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Status Distribution</h3>
                      <div className="text-sm text-gray-600">
                        {analyticsData.disasterStats.by_status?.length || 0} active disasters
                      </div>
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={getStatusChartData()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {getStatusChartData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#ffffff',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Resource Requirements */}
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Resource Requirements</h3>
                    <div className="text-sm text-gray-600">
                      Total allocation needed
                    </div>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart data={getResourceChartData()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis
                          dataKey="name"
                          fontSize={12}
                          tick={{ fill: '#6b7280' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          fontSize={12}
                          tick={{ fill: '#6b7280' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#ffffff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <RechartsBar
                          dataKey="value"
                          fill="#3b82f6"
                          radius={[2, 2, 0, 0]}
                          maxBarSize={50}
                        />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* SOS Analytics */}
            {analyticsData.sosStats && (
              <div className="space-y-6">
                {/* Section Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-danger-50 rounded-lg">
                      <AlertTriangle className="w-6 h-6 text-danger-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">SOS Response Analytics</h2>
                      <p className="text-sm text-gray-600">Emergency signal processing and response metrics</p>
                    </div>
                  </div>
                </div>

                {/* SOS Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard
                    title="Total Signals"
                    value={formatNumber(analyticsData.sosStats.summary?.totalSignals || 0)}
                    subtitle="Emergency alerts received"
                  />
                  <StatCard
                    title="Resolution Rate"
                    value={`${analyticsData.sosStats.summary?.resolutionRate || 0}%`}
                    subtitle="Successfully resolved"
                  />
                  <StatCard
                    title="Avg Response Time"
                    value={formatDuration(analyticsData.sosStats.summary?.averageResponseTime || 0)}
                    subtitle="Time to first response"
                  />
                  <StatCard
                    title="Escalated Cases"
                    value={formatNumber(analyticsData.sosStats.summary?.escalatedCount || 0)}
                    subtitle="Require immediate attention"
                  />
                </div>

                {/* SOS Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* SOS Priority Distribution */}
                  <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">SOS Priority Distribution</h3>
                      <div className="text-sm text-gray-600">
                        Signal urgency levels
                      </div>
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart data={getSosPriorityChartData()}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                          <XAxis
                            dataKey="name"
                            fontSize={12}
                            tick={{ fill: '#6b7280' }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            fontSize={12}
                            tick={{ fill: '#6b7280' }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#ffffff',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                          <RechartsBar
                            dataKey="value"
                            fill="#3b82f6"
                            radius={[2, 2, 0, 0]}
                            maxBarSize={50}
                          />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* SOS Status Distribution */}
                  <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">SOS Status Distribution</h3>
                      <div className="text-sm text-gray-600">
                        Processing status overview
                      </div>
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={getSosStatusChartData()}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {getSosStatusChartData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#ffffff',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Activity Summary */}
            {analyticsData.disasterStats?.recent_activity && (
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Disaster Activity</h3>
                  <div className="text-sm text-gray-600">
                    Latest updates and status changes
                  </div>
                </div>
                <div className="space-y-4">
                  {analyticsData.disasterStats.recent_activity.slice(0, 5).map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`w-3 h-3 rounded-full ${
                          activity.priority_level === 'critical' ? 'bg-red-500' :
                          activity.priority_level === 'high' ? 'bg-orange-500' :
                          'bg-blue-500'
                        }`}></div>
                        <div>
                          <div className="font-semibold text-gray-900 text-sm">{activity.title}</div>
                          <div className="text-xs text-gray-600">Code: {activity.disaster_code}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          activity.priority_level === 'critical' ? 'bg-red-100 text-red-800' :
                          activity.priority_level === 'high' ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {activity.priority_level}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(activity.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default AnalyticsPage;
