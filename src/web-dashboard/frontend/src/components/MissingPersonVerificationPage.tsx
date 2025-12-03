import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, Loader2, AlertTriangle, User, MapPin, Phone, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { getPendingReports, verifyReport } from '../services/missingPersonService';
import { MissingPerson } from '../types/missingPerson';
import MainLayout from './MainLayout';

const MissingPersonVerificationPage: React.FC = () => {
  const { token } = useAuth();
  const [pendingReports, setPendingReports] = useState<MissingPerson[]>([]);
  const [selectedReport, setSelectedReport] = useState<MissingPerson | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);

  useEffect(() => {
    loadPendingReports();
  }, []);

  const loadPendingReports = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await getPendingReports(token);
      setPendingReports(response.data);
    } catch (error: any) {
      console.error('Error loading pending reports:', error);
      toast.error('Failed to load pending reports');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!token) return;
    
    setActionLoading(id);
    try {
      await verifyReport(token, id, { action: 'approve' });
      toast.success('Report approved and published!');
      setPendingReports(prev => prev.filter(r => r._id !== id));
      setSelectedReport(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve report');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!token || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    
    setActionLoading(id);
    try {
      await verifyReport(token, id, { action: 'reject', rejection_reason: rejectionReason });
      toast.success('Report rejected');
      setPendingReports(prev => prev.filter(r => r._id !== id));
      setSelectedReport(null);
      setShowRejectionModal(false);
      setRejectionReason('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject report');
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectionModal = (report: MissingPerson) => {
    setSelectedReport(report);
    setShowRejectionModal(true);
  };

  return (
    <MainLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Missing Person Report Verification</h1>
          <p className="text-gray-600 mt-1">Review unverified and spam-flagged reports</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : pendingReports.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">All Caught Up!</h3>
            <p className="text-gray-600">No unverified or spam-flagged reports to review.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Reports List */}
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-900 font-medium">
                  📋 {pendingReports.length} report{pendingReports.length !== 1 ? 's' : ''} to review (unverified + spam-flagged)
                </p>
              </div>

              {pendingReports.map((report) => (
                <div
                  key={report._id}
                  className={`bg-white rounded-lg shadow-md p-6 cursor-pointer border-2 transition-all ${
                    selectedReport?._id === report._id ? 'border-blue-500' : 'border-transparent hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedReport(report)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{report.full_name}</h3>
                      <p className="text-sm text-gray-500">Case: {report.case_number}</p>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        report.data_source === 'ai_extracted' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {report.data_source === 'ai_extracted' ? '✨ AI Extracted' : '📝 Manual'}
                      </span>
                      {report.verification_status === 'pending' && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                          Pending Verification
                        </span>
                      )}
                      {report.auto_hidden && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          Auto-Hidden ({report.spam_reports?.length || 0} spam reports)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <User className="w-4 h-4" />
                      <span>{report.gender}, Age: {report.age || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate">{report.last_seen_location.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(report.last_seen_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{report.reporter_phone} ({report.reporter_relationship})</span>
                    </div>
                  </div>

                  {report.extracted_data && (
                    <div className="mt-3 bg-purple-50 border border-purple-200 rounded p-2">
                      <p className="text-xs text-purple-700">
                        <strong>AI Confidence:</strong> {(report.extracted_data.confidence * 100).toFixed(0)}%
                      </p>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApprove(report._id);
                      }}
                      disabled={actionLoading === report._id}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center gap-2 text-sm"
                    >
                      {actionLoading === report._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </>
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openRejectionModal(report);
                      }}
                      disabled={actionLoading === report._id}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400 flex items-center justify-center gap-2 text-sm"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Detailed View */}
            <div className="lg:sticky lg:top-6 lg:h-fit">
              {selectedReport ? (
                <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Full Report Details</h2>
                    <p className="text-sm text-gray-500">Case: {selectedReport.case_number}</p>
                  </div>

                  {/* Photo */}
                  {selectedReport.photo_urls.length > 0 && (
                    <div>
                      <img
                        src={selectedReport.photo_urls[0]}
                        alt={selectedReport.full_name}
                        className="w-full rounded-lg shadow-md"
                      />
                    </div>
                  )}

                  {/* AI Extraction Info */}
                  {selectedReport.extracted_data && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <h3 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                        ✨ AI-Extracted Information
                      </h3>
                      <div className="space-y-2 text-sm text-purple-800">
                        <p><strong>Confidence:</strong> {(selectedReport.extracted_data.confidence * 100).toFixed(0)}%</p>
                        <p><strong>Extracted Name:</strong> {selectedReport.extracted_data.name}</p>
                        <p><strong>Extracted Age:</strong> {selectedReport.extracted_data.age}</p>
                        <p><strong>Extracted Location:</strong> {selectedReport.extracted_data.lastSeenLocation}</p>
                        {selectedReport.extracted_data.extractedContacts.length > 0 && (
                          <div>
                            <strong>Extracted Contacts:</strong>
                            {selectedReport.extracted_data.extractedContacts.map((c, i) => (
                              <div key={i} className="ml-4">• {c.phone} ({c.relation})</div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Basic Info */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Person Information
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-gray-500">Name:</span>
                          <p className="font-medium">{selectedReport.full_name}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Age:</span>
                          <p className="font-medium">{selectedReport.age || 'Unknown'}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Gender:</span>
                          <p className="font-medium capitalize">{selectedReport.gender}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Priority:</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            selectedReport.priority === 'critical' ? 'bg-red-100 text-red-700' :
                            selectedReport.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                            selectedReport.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {selectedReport.priority.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Description:</span>
                        <p className="font-medium mt-1">{selectedReport.description}</p>
                      </div>
                    </div>
                  </div>

                  {/* Last Seen */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Last Seen
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-500">Date:</span>
                        <p className="font-medium">{new Date(selectedReport.last_seen_date).toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Location:</span>
                        <p className="font-medium">{selectedReport.last_seen_location.address}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Circumstances:</span>
                        <p className="font-medium">{selectedReport.circumstances}</p>
                      </div>
                    </div>
                  </div>

                  {/* Reporter Info */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Phone className="w-5 h-5" />
                      Reporter Information
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-500">Name:</span>
                        <p className="font-medium">{selectedReport.reporter_name}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Relationship:</span>
                        <p className="font-medium">{selectedReport.reporter_relationship}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Phone:</span>
                        <p className="font-medium">{selectedReport.reporter_phone}</p>
                      </div>
                      {selectedReport.reporter_email && (
                        <div>
                          <span className="text-gray-500">Email:</span>
                          <p className="font-medium">{selectedReport.reporter_email}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Vulnerable Info */}
                  {selectedReport.is_vulnerable && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h3 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        Vulnerable Person
                      </h3>
                      {selectedReport.medical_conditions && (
                        <p className="text-sm text-red-800 mb-1">
                          <strong>Medical:</strong> {selectedReport.medical_conditions}
                        </p>
                      )}
                      {selectedReport.medication_required && (
                        <p className="text-sm text-red-800">
                          <strong>Medication:</strong> {selectedReport.medication_required}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Community Policing - Spam Reports */}
                  {selectedReport.spam_reports && selectedReport.spam_reports.length > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <h3 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        Community Spam Reports ({selectedReport.spam_reports.length})
                      </h3>
                      <div className="space-y-2">
                        {selectedReport.spam_reports.map((spam, idx) => (
                          <div key={idx} className="text-sm text-orange-800 bg-white p-2 rounded">
                            <p><strong>Reason:</strong> {spam.reason}</p>
                            <p className="text-xs text-orange-600 mt-1">
                              Reported: {new Date(spam.timestamp).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                      {selectedReport.auto_hidden && (
                        <p className="text-xs text-orange-900 mt-2 font-medium">
                          ⚠️ This report has been auto-hidden from public view due to multiple spam reports.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t">
                    <button
                      onClick={() => handleApprove(selectedReport._id)}
                      disabled={actionLoading === selectedReport._id}
                      className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center gap-2 font-medium"
                    >
                      {actionLoading === selectedReport._id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          Verify Report
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => openRejectionModal(selectedReport)}
                      disabled={actionLoading === selectedReport._id}
                      className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 disabled:bg-gray-400 flex items-center justify-center gap-2 font-medium"
                    >
                      <XCircle className="w-5 h-5" />
                      Reject
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                  <Eye className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Select a report to view details</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rejection Modal */}
        {showRejectionModal && selectedReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Reject Report</h3>
              <p className="text-sm text-gray-600 mb-4">
                Please provide a reason for rejecting this missing person report.
              </p>
              
              <textarea
                rows={4}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4"
                placeholder="Enter rejection reason..."
              />

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRejectionModal(false);
                    setRejectionReason('');
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(selectedReport._id)}
                  disabled={!rejectionReason.trim() || actionLoading === selectedReport._id}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
                >
                  {actionLoading === selectedReport._id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      Confirm Rejection
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default MissingPersonVerificationPage;
