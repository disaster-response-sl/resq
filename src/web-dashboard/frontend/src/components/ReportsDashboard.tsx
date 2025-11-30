import { useState } from 'react';
import { reportsService, ReportType, ReportConfig } from '../services/reportsService';
import toast from 'react-hot-toast';
import MainLayout from './MainLayout';

export default function ReportsDashboard() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [config, setConfig] = useState<ReportConfig>({
    report_type: 'sos',
    date_range: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    },
    filters: {},
    include_charts: true,
    include_maps: false,
  });

  const reportTypes: { value: ReportType; label: string; description: string }[] = [
    {
      value: 'sos',
      label: 'SOS Response Report',
      description: 'Response times, resolution rates, geographic distribution',
    },
    {
      value: 'missing_persons',
      label: 'Missing Persons Report',
      description: 'Found rates, average resolution time, sightings analysis',
    },
    {
      value: 'disasters',
      label: 'Disasters Report',
      description: 'By type/severity, affected population, area coverage',
    },
    {
      value: 'resources',
      label: 'Resources Report',
      description: 'Allocation rates, critical resources, depletion tracking',
    },
    {
      value: 'relief_ops',
      label: 'Relief Operations Report',
      description: 'Geographic coverage, resources needed, operational stats',
    },
    {
      value: 'financial',
      label: 'Financial Report',
      description: 'Donations, payment methods, monthly trends',
    },
    {
      value: 'comprehensive',
      label: 'Comprehensive Report',
      description: 'All systems combined with executive summary',
    },
  ];

  const generateReport = async () => {
    setLoading(true);
    try {
      const response = await reportsService.generate(config);
      setReportData(response.data);
      toast.success('Report generated successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const renderChartData = (data: any[]) => {
    if (!data || data.length === 0) return null;
    return (
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Label
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Value
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, idx) => (
              <tr key={idx}>
                <td className="px-4 py-2 text-sm text-gray-900">{item.label || item.month || item.date}</td>
                <td className="px-4 py-2 text-sm font-semibold text-blue-600">
                  {item.value || item.count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderSummary = () => {
    if (!reportData || !reportData.summary) return null;

    const summary = reportData.summary;

    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Report Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(summary).map(([key, value]: [string, any]) => {
            if (typeof value === 'object') return null;
            return (
              <div key={key} className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">
                  {key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
              </div>
            );
          })}
        </div>

        {/* Render grouped data */}
        {summary.by_status && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">By Status</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(summary.by_status).map(([status, count]: [string, any]) => (
                <div key={status} className="bg-blue-50 rounded p-3">
                  <p className="text-xs text-gray-600">{status.replace(/_/g, ' ')}</p>
                  <p className="text-xl font-bold text-blue-600">{count}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {summary.by_priority && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">By Priority</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(summary.by_priority).map(([priority, count]: [string, any]) => (
                <div key={priority} className="bg-orange-50 rounded p-3">
                  <p className="text-xs text-gray-600">{priority}</p>
                  <p className="text-xl font-bold text-orange-600">{count}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCharts = () => {
    if (!reportData || !reportData.charts) return null;

    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Charts & Trends</h2>
        {Object.entries(reportData.charts).map(([key, data]: [string, any]) => (
          <div key={key} className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
            </h3>
            {renderChartData(data)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="p-3 sm:p-4 md:p-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Header - Mobile Responsive */}
          <div className="mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Advanced Reports System</h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-1">Generate comprehensive reports across all systems</p>
          </div>

          {/* Configuration Panel - Mobile Responsive */}
          <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6 mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Report Configuration</h2>

          {/* Report Type Selection - Mobile Responsive */}
          <div className="mb-4 sm:mb-6">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">Report Type</label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
              {reportTypes.map((type) => (
                <div
                  key={type.value}
                  onClick={() => setConfig({ ...config, report_type: type.value })}
                  className={`border-2 rounded-lg p-2 sm:p-4 cursor-pointer transition-all ${
                    config.report_type === type.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1">{type.label}</h3>
                  <p className="text-sm text-gray-600">{type.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={config.date_range?.start || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    date_range: { ...config.date_range, start: e.target.value },
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={config.date_range?.end || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    date_range: { ...config.date_range, end: e.target.value },
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Options */}
          <div className="flex items-center gap-6 mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.include_charts}
                onChange={(e) => setConfig({ ...config, include_charts: e.target.checked })}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Include Charts</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.include_maps}
                onChange={(e) => setConfig({ ...config, include_maps: e.target.checked })}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Include Maps</span>
            </label>
          </div>

          {/* Generate Button */}
          <button
            onClick={generateReport}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating Report...
              </span>
            ) : (
              'Generate Report'
            )}
          </button>
        </div>

        {/* Report Display */}
        {reportData && (
          <>
            {renderSummary()}
            {config.include_charts && renderCharts()}
          </>
        )}
        </div>
      </div>
    </MainLayout>
  );
}
