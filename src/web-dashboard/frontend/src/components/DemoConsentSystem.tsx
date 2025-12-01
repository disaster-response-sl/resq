import React, { useState, useEffect, useCallback } from 'react';
import { ndxService } from '../services/ndxService';
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Eye,
  CheckSquare,
  Square,
  User,
  Target,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Consent {
  _id: string;
  dataProvider: string;
  dataType: string;
  purpose: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'REVOKED' | 'EXPIRED';
  consentDuration: number;
  location?: { lat: number; lng: number };
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  requester: string;
  approver?: string;
  exchangedData?: { _id?: string; severity?: string; type?: string; description?: string; location?: { lat: number; lng: number }; timestamp?: string }[];
  lastExchangeAt?: string;
}

const DemoConsentSystem: React.FC = () => {
  const [filteredConsents, setFilteredConsents] = useState<Consent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConsents, setSelectedConsents] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});

  const loadConsents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await ndxService.getConsents();
      if (response.success) {
        setFilteredConsents(response.consents || []);
      }
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to load consents';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConsents();
  }, [loadConsents]);

  const handleStatusChange = async (consentId: string, newStatus: 'APPROVED' | 'REJECTED') => {
    setActionLoading(prev => ({ ...prev, [consentId]: true }));
    try {
      let response;
      if (newStatus === 'APPROVED') {
        response = await ndxService.approveConsent(consentId);
      } else {
        response = await ndxService.rejectConsent(consentId);
      }

      if (response.success) {
        toast.success(`Consent ${newStatus.toLowerCase()} successfully`);
        loadConsents();
      } else {
        toast.error(`Failed to ${newStatus.toLowerCase()} consent`);
      }
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || `Failed to ${newStatus.toLowerCase()} consent`;
      toast.error(errorMessage);
    } finally {
      setActionLoading(prev => ({ ...prev, [consentId]: false }));
    }
  };

  const handleBulkAction = async (action: 'APPROVE' | 'REJECT') => {
    if (selectedConsents.size === 0) {
      toast.error('Please select consents to perform bulk action');
      return;
    }

    const actionPromises = Array.from(selectedConsents).map(consentId =>
      handleStatusChange(consentId, action === 'APPROVE' ? 'APPROVED' : 'REJECTED')
    );

    await Promise.all(actionPromises);
    setSelectedConsents(new Set());
  };

  const toggleConsentSelection = (consentId: string) => {
    const newSelection = new Set(selectedConsents);
    if (newSelection.has(consentId)) {
      newSelection.delete(consentId);
    } else {
      newSelection.add(consentId);
    }
    setSelectedConsents(newSelection);
  };

  const selectAllConsents = () => {
    const pendingConsents = filteredConsents.filter(c => c.status === 'PENDING_APPROVAL');
    if (selectedConsents.size === pendingConsents.length) {
      setSelectedConsents(new Set());
    } else {
      setSelectedConsents(new Set(pendingConsents.map(c => c._id)));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'REJECTED':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'PENDING_APPROVAL':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'REVOKED':
        return <AlertTriangle className="w-4 h-4 text-gray-600" />;
      case 'EXPIRED':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'PENDING_APPROVAL':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'REVOKED':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'EXPIRED':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const pendingConsents = filteredConsents.filter(consent => consent.status === 'PENDING_APPROVAL');

  return (
    <div className="space-y-6">
      {/* Header with Refresh Button */}
      <div className="flex items-center justify-end">
        <button
          onClick={loadConsents}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Bulk Actions */}
      {pendingConsents.length > 0 && (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={selectAllConsents}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                {selectedConsents.size === pendingConsents.length && pendingConsents.length > 0 ? (
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                ) : (
                  <Square className="w-4 h-4 text-gray-400" />
                )}
                Select All Pending ({pendingConsents.length})
              </button>
              {selectedConsents.size > 0 && (
                <span className="text-sm text-gray-600">
                  {selectedConsents.size} selected
                </span>
              )}
            </div>

            {selectedConsents.size > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkAction('APPROVE')}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve ({selectedConsents.size})
                </button>
                <button
                  onClick={() => handleBulkAction('REJECT')}
                  className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  <XCircle className="w-4 h-4" />
                  Reject ({selectedConsents.size})
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Consents Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-4" />
            <p className="text-gray-600">Loading consents...</p>
          </div>
        ) : filteredConsents.length === 0 ? (
          <div className="p-8 text-center">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No consents found</h3>
            <p className="text-gray-600">
              No consent requests have been created yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <span className="text-sm font-medium text-gray-700">Select</span>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Requester</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Provider</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Data Type</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Purpose</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Created</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredConsents.map((consent) => (
                  <tr key={consent._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {consent.status === 'PENDING_APPROVAL' && (
                        <button
                          onClick={() => toggleConsentSelection(consent._id)}
                          className="flex items-center"
                        >
                          {selectedConsents.has(consent._id) ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {consent.requester || 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {consent.dataProvider.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">{consent.dataType}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-900">{consent.purpose}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(consent.status)}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(consent.status)}`}>
                          {consent.status.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {formatDate(consent.createdAt)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {consent.status === 'PENDING_APPROVAL' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(consent._id, 'APPROVED')}
                              disabled={actionLoading[consent._id]}
                              className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 border border-green-300 rounded-md hover:bg-green-200 transition-colors text-sm font-medium"
                              title="Approve Consent"
                            >
                              {actionLoading[consent._id] ? (
                                <div className="w-4 h-4 border border-green-600 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <CheckCircle className="w-4 h-4" />
                              )}
                              Approve
                            </button>
                            <button
                              onClick={() => handleStatusChange(consent._id, 'REJECTED')}
                              disabled={actionLoading[consent._id]}
                              className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 border border-red-300 rounded-md hover:bg-red-200 transition-colors text-sm font-medium"
                              title="Reject Consent"
                            >
                              {actionLoading[consent._id] ? (
                                <div className="w-4 h-4 border border-red-600 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <XCircle className="w-4 h-4" />
                              )}
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DemoConsentSystem;
