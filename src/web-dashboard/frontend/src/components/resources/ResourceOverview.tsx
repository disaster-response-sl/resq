import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getDashboardMetrics } from '../../services/resourceService';
import { DashboardMetricsResponse } from '../../types/resource';
import { canCreateResources, canAllocateResources } from '../../utils/permissions';
import {
  Package,
  Activity,
  AlertCircle,
  Plus,
  Truck,
  BarChart3,
  RefreshCw,
  Clock,
  CheckCircle
} from 'lucide-react';
import ResourceModal from './ResourceModal';
import QuickAllocationModal from './QuickAllocationModal';
import GenerateReportModal from './GenerateReportModal';
import toast from 'react-hot-toast';

const ResourceOverview: React.FC = () => {
  const { user, token } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetricsResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [showQuickAllocationModal, setShowQuickAllocationModal] = useState(false);
  const [showGenerateReportModal, setShowGenerateReportModal] = useState(false);

  const handleRefresh = () => {
    fetchMetrics();
  };

  const fetchMetrics = useCallback(async () => {
    if (!token) {
      setError('Authentication required');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const response = await getDashboardMetrics(token, { timeframe: '30d' });
      setMetrics(response.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load metrics';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [token]);  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading resource overview...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="p-4 bg-red-50 rounded-full">
          <AlertCircle className="w-12 h-12 text-red-600" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Failed to Load Data</h3>
          <p className="text-sm text-gray-600 mt-1">{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const overview = metrics?.overview;
  const performance = metrics?.performance;
  const breakdown = metrics?.breakdown;

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      {/* Header Section - Mobile Responsive */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 truncate">Resource Management</h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-0.5 sm:mt-1">Monitor and manage resources</p>
        </div>
        <button
          onClick={handleRefresh}
          className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors flex-shrink-0"
          title="Refresh data"
        >
          <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Key Metrics - Mobile Responsive */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
        <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900 mt-0.5 sm:mt-1">
                {overview?.total_resources || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Available</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900 mt-0.5 sm:mt-1">
                {overview?.available_resources || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Allocated</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900 mt-0.5 sm:mt-1">
                {overview?.allocated_resources || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Utilization</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900 mt-0.5 sm:mt-1">
                {overview?.utilization_rate ? `${Math.round(overview.utilization_rate)}%` : '0%'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {canCreateResources(user) && (
          <button
            onClick={() => setShowResourceModal(true)}
            className="flex items-center p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all"
          >
            <div className="p-2 bg-blue-50 rounded-lg mr-4">
              <Plus className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Add Resource</p>
              <p className="text-sm text-gray-600">Register new equipment</p>
            </div>
          </button>
        )}

        {canAllocateResources(user) && (
          <button
            onClick={() => setShowQuickAllocationModal(true)}
            className="flex items-center p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all"
          >
            <div className="p-2 bg-green-50 rounded-lg mr-4">
              <Truck className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Quick Allocation</p>
              <p className="text-sm text-gray-600">Deploy to incidents</p>
            </div>
          </button>
        )}

        <button
          onClick={() => setShowGenerateReportModal(true)}
          className="flex items-center p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all"
        >
          <div className="p-2 bg-purple-50 rounded-lg mr-4">
            <BarChart3 className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-left">
            <p className="font-medium text-gray-900">Generate Report</p>
            <p className="text-sm text-gray-600">Analytics & insights</p>
          </div>
        </button>
      </div>

      {/* Performance Metrics */}
      {performance && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>
            <span className="text-sm text-gray-500">Last 30 days</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="relative inline-block mb-3">
                <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#f3f4f6"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    strokeDasharray={`${performance.allocation_efficiency}, 100`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-semibold text-gray-900">
                    {Math.round(performance.allocation_efficiency)}%
                  </span>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-900">Allocation Efficiency</p>
              <p className="text-xs text-gray-600 mt-1">Resource utilization rate</p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-50 rounded-full mb-3">
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
              <div className="text-2xl font-semibold text-gray-900">
                {Math.round(performance.response_time)}
              </div>
              <p className="text-sm font-medium text-gray-900 mt-1">Response Time</p>
              <p className="text-xs text-gray-600">Average hours</p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-50 rounded-full mb-3">
                <RefreshCw className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-2xl font-semibold text-gray-900">
                {Math.round(performance.resource_turnover)}%
              </div>
              <p className="text-sm font-medium text-gray-900 mt-1">Resource Turnover</p>
              <p className="text-xs text-gray-600">Monthly rotation</p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-50 rounded-full mb-3">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <div className="text-2xl font-semibold text-emerald-600">
                {Math.round(performance.deployment_success_rate)}%
              </div>
              <p className="text-sm font-medium text-gray-900 mt-1">Success Rate</p>
              <p className="text-xs text-gray-600">Successful deployments</p>
            </div>
          </div>
        </div>
      )}

      {/* Resource Breakdown */}
      {breakdown && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* By Type */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Package className="w-5 h-5 mr-2 text-gray-400" />
              Resources by Type
            </h4>
            <div className="space-y-3">
              {breakdown.by_type.map((item, index) => (
                <div key={index} className="flex items-center justify-between py-2">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    <span className="text-sm font-medium text-gray-900 capitalize">{item.type}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-gray-900">{item.count}</span>
                    <span className="text-xs text-gray-500 ml-2">({item.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* By Status */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-gray-400" />
              Resources by Status
            </h4>
            <div className="space-y-3">
              {breakdown.by_status.map((item, index) => {
                const getStatusColor = (status: string) => {
                  switch (status.toLowerCase()) {
                    case 'available': return 'bg-green-500';
                    case 'allocated': return 'bg-yellow-500';
                    case 'maintenance': return 'bg-red-500';
                    case 'retired': return 'bg-gray-500';
                    default: return 'bg-blue-500';
                  }
                };

                return (
                  <div key={index} className="flex items-center justify-between py-2">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-3 ${getStatusColor(item.status)}`}></div>
                      <span className="text-sm font-medium text-gray-900 capitalize">{item.status}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-gray-900">{item.count}</span>
                      <span className="text-xs text-gray-500 ml-2">({item.percentage}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <ResourceModal
        isOpen={showResourceModal}
        onClose={() => setShowResourceModal(false)}
        onSuccess={handleRefresh}
        mode="create"
      />

      <QuickAllocationModal
        isOpen={showQuickAllocationModal}
        onClose={() => setShowQuickAllocationModal(false)}
        onSuccess={handleRefresh}
      />

      <GenerateReportModal
        isOpen={showGenerateReportModal}
        onClose={() => setShowGenerateReportModal(false)}
      />
    </div>
  );
};

export default ResourceOverview;
