import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  CreditCard,
  TrendingUp,
  Users,
  RefreshCw,
  Download
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import MainLayout from './MainLayout';
import { getDonationStats, getDonations } from '../services/donationService';
import { DonationStats, Donation } from '../types/donation';
import toast from 'react-hot-toast';

interface PaymentStatsData {
  stats: DonationStats | null;
  donations: Donation[];
  loading: boolean;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: string;
}

const PaymentStatistics: React.FC = () => {
  const [statsData, setStatsData] = useState<PaymentStatsData>({
    stats: null,
    donations: [],
    loading: true
  });
  const [timeRange, setTimeRange] = useState('30d');

  const fetchPaymentData = useCallback(async () => {
    try {
      setStatsData(prev => ({ ...prev, loading: true }));

      // Fetch donation statistics
      const statsResponse = await getDonationStats();

      // Fetch recent donations
      const donationsResponse = await getDonations(localStorage.getItem('token') || '', {
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      setStatsData({
        stats: statsResponse.success ? statsResponse.data : null,
        donations: donationsResponse.success ? donationsResponse.data : [],
        loading: false
      });
    } catch (error) {
      console.error('Error fetching payment data:', error);
      toast.error('Failed to load payment statistics');
      setStatsData(prev => ({ ...prev, loading: false }));
    }
  }, [timeRange]);

  useEffect(() => {
    fetchPaymentData();
  }, [timeRange, fetchPaymentData]);

  const formatCurrency = (amount: number, currency: string = 'LKR') => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const StatCard = ({ title, value, subtitle, icon, trend }: StatCardProps) => (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            {icon && <div className="text-gray-400">{icon}</div>}
            <p className="text-sm font-medium text-gray-600">{title}</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          {trend && (
            <p className="text-xs text-green-600 font-medium mt-1">{trend}</p>
          )}
        </div>
      </div>
    </div>
  );

  // Chart color schemes
  const STATUS_COLORS = {
    completed: '#10b981',
    pending: '#f59e0b',
    failed: '#ef4444',
    cancelled: '#6b7280',
    refunded: '#8b5cf6'
  };

  // Transform data for charts
  const getStatusChartData = () => {
    if (!statsData.stats?.statusBreakdown) return [];
    return Object.entries(statsData.stats.statusBreakdown).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      color: STATUS_COLORS[status.toLowerCase() as keyof typeof STATUS_COLORS] || '#6b7280'
    }));
  };

  const getTimeSeriesChartData = () => {
    if (!statsData.stats?.recentActivity) return [];
    return statsData.stats.recentActivity.map(item => ({
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      donations: item.count,
      amount: item.amount
    }));
  };

  if (statsData.loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50">
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-2 text-gray-600">Loading payment statistics...</span>
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
              <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
              <span className="text-sm text-gray-500">Manage donations and payment tracking</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleString()}
              </span>
              <button
                onClick={fetchPaymentData}
                className="p-2 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-primary-50"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-primary-50">
                <Download className="w-5 h-5" />
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
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 90 Days</option>
                  <option value="1y">Last Year</option>
                </select>
              </div>
            </div>

            {/* Key Metrics Grid */}
            {statsData.stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  key="total-donations"
                  title="Total Donations"
                  value={formatNumber(statsData.stats.summary.totalDonations)}
                  subtitle="All time donations"
                  icon={<DollarSign className="w-5 h-5" />}
                  trend="+12% from last month"
                />
                <StatCard
                  key="total-amount"
                  title="Total Amount"
                  value={formatCurrency(statsData.stats.summary.totalAmount)}
                  subtitle="Funds collected"
                  icon={<CreditCard className="w-5 h-5" />}
                  trend="+8% from last month"
                />
                <StatCard
                  key="average-donation"
                  title="Average Donation"
                  value={formatCurrency(statsData.stats.summary.averageDonation)}
                  subtitle="Per donation"
                  icon={<TrendingUp className="w-5 h-5" />}
                />
                <StatCard
                  key="unique-donors"
                  title="Unique Donors"
                  value={formatNumber(statsData.stats.summary.uniqueDonors)}
                  subtitle="Individual contributors"
                  icon={<Users className="w-5 h-5" />}
                  trend="+15% from last month"
                />
              </div>
            )}

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Status Distribution */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Payment Status Distribution</h3>
                  <div className="text-sm text-gray-600">
                    Transaction status breakdown
                  </div>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={getStatusChartData()}
                        cx="50%"
                        cy="45%"
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {getStatusChartData().map((entry, index) => (
                          <Cell key={`pie-cell-${entry.name}-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        formatter={(value, name) => [`${value} donations`, name]}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend */}
                <div className="flex flex-wrap justify-center gap-4 mt-4">
                  {getStatusChartData().map((entry, index) => (
                    <div key={`legend-${entry.name}-${index}`} className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      ></div>
                      <span className="text-sm text-gray-600">
                        {entry.name}: {entry.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Donation Trends */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Donation Trends</h3>
                  <div className="text-sm text-gray-600">
                    Daily donation activity
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={getTimeSeriesChartData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis
                        dataKey="date"
                        fontSize={11}
                        tick={{ fill: '#6b7280' }}
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        yAxisId="amount"
                        orientation="left"
                        fontSize={11}
                        tick={{ fill: '#6b7280' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => formatCurrency(value)}
                      />
                      <YAxis
                        yAxisId="donations"
                        orientation="right"
                        fontSize={11}
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
                        formatter={(value, name) => [
                          name === 'donations' ? `${value} donations` : formatCurrency(value as number),
                          name === 'donations' ? 'Donations' : 'Amount'
                        ]}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Area
                        yAxisId="amount"
                        type="monotone"
                        dataKey="amount"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                      <Area
                        yAxisId="donations"
                        type="monotone"
                        dataKey="donations"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Recent Donations Table */}
            {statsData.donations && statsData.donations.length > 0 && (
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Donations</h3>
                  <div className="text-sm text-gray-600">
                    Latest donation transactions
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Donor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Purpose
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {statsData.donations.map((donation, index) => (
                        <tr key={donation._id || `donation-${index}`} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                  <span className="text-sm font-medium text-blue-600">
                                    {donation.donor.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {donation.donor.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {donation.donor.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">
                              {formatCurrency(donation.amount, donation.currency)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {donation.paymentMethod}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              Disaster Relief Fund
                            </div>
                            <div className="text-sm text-gray-500">
                              Order: {donation.orderId}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              donation.status === 'SUCCESS' ? 'bg-green-100 text-green-800' :
                              donation.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              donation.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {donation.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(donation.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {statsData.donations.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No donations found</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default PaymentStatistics;
