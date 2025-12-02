import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { authService } from '../services/authService';
import MainLayout from './MainLayout';
import '../styles/AdminReviewDashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface MissingPerson {
  _id: string;
  case_number: string;
  full_name: string;
  age: number;
  gender: string;
  last_seen_location: {
    address: string;
    lat: number;
    lng: number;
  };
  last_seen_date: string;
  photo_url?: string;
  description: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  public_visibility: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'missing' | 'found' | 'deceased';
  created_at: string;
  submitted_from_ip?: string;
  approval_history: ApprovalHistoryEntry[];
  reporter_name?: string;
  reporter_phone?: string;
}

interface ApprovalHistoryEntry {
  action: string;
  performed_by: {
    user_id: string;
    username: string;
    role: string;
  };
  reason: string;
  timestamp: string;
}

const AdminReviewDashboard: React.FC = () => {
  const [reports, setReports] = useState<MissingPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<MissingPerson | null>(null);
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set());
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<'pending' | 'verified' | 'rejected' | 'all'>('pending');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [limit] = useState(20);

  useEffect(() => {
    fetchReports();
  }, [statusFilter, priorityFilter, currentPage]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const token = authService.getToken();
      const skip = (currentPage - 1) * limit;
      
      const params: any = {
        limit,
        skip,
      };
      
      if (statusFilter !== 'all') {
        params.verification_status = statusFilter;
      }
      
      if (priorityFilter !== 'all') {
        params.priority = priorityFilter;
      }

      const response = await axios.get(`${API_URL}/api/missing-persons`, {
        params,
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setReports(response.data.data);
        setTotalCount(response.data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reportId: string, notes: string = '') => {
    setActionLoading(true);
    try {
      const token = authService.getToken();
      const response = await axios.post(
        `${API_URL}/api/missing-persons/${reportId}/approve`,
        { notes },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        alert('Report approved successfully!');
        fetchReports();
        setShowDetailModal(false);
        setSelectedReport(null);
      }
    } catch (error: any) {
      console.error('Error approving report:', error);
      alert(error.response?.data?.message || 'Failed to approve report');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (reportId: string, reason: string) => {
    if (!reason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setActionLoading(true);
    try {
      const token = authService.getToken();
      const response = await axios.post(
        `${API_URL}/api/missing-persons/${reportId}/reject`,
        { reason },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        alert('Report rejected successfully!');
        fetchReports();
        setShowDetailModal(false);
        setSelectedReport(null);
      }
    } catch (error: any) {
      console.error('Error rejecting report:', error);
      alert(error.response?.data?.message || 'Failed to reject report');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedReports.size === 0) {
      alert('Please select reports to approve');
      return;
    }

    if (!confirm(`Are you sure you want to approve ${selectedReports.size} reports?`)) {
      return;
    }

    setActionLoading(true);
    const errors: string[] = [];

    for (const reportId of Array.from(selectedReports)) {
      try {
        await handleApprove(reportId, 'Bulk approved by admin');
      } catch (error) {
        errors.push(reportId);
      }
    }

    if (errors.length > 0) {
      alert(`Failed to approve ${errors.length} reports`);
    } else {
      alert(`Successfully approved ${selectedReports.size} reports`);
    }

    setSelectedReports(new Set());
    setActionLoading(false);
    fetchReports();
  };

  const handleBulkReject = async () => {
    if (selectedReports.size === 0) {
      alert('Please select reports to reject');
      return;
    }

    const reason = prompt('Enter rejection reason:');
    if (!reason || !reason.trim()) {
      return;
    }

    if (!confirm(`Are you sure you want to reject ${selectedReports.size} reports?`)) {
      return;
    }

    setActionLoading(true);
    const errors: string[] = [];

    for (const reportId of Array.from(selectedReports)) {
      try {
        await handleReject(reportId, reason);
      } catch (error) {
        errors.push(reportId);
      }
    }

    if (errors.length > 0) {
      alert(`Failed to reject ${errors.length} reports`);
    } else {
      alert(`Successfully rejected ${selectedReports.size} reports`);
    }

    setSelectedReports(new Set());
    setActionLoading(false);
    fetchReports();
  };

  const toggleReportSelection = (reportId: string) => {
    const newSelection = new Set(selectedReports);
    if (newSelection.has(reportId)) {
      newSelection.delete(reportId);
    } else {
      newSelection.add(reportId);
    }
    setSelectedReports(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedReports.size === reports.length) {
      setSelectedReports(new Set());
    } else {
      setSelectedReports(new Set(reports.map(r => r._id)));
    }
  };

  const filteredReports = reports.filter(report => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        report.full_name.toLowerCase().includes(query) ||
        report.case_number.toLowerCase().includes(query) ||
        report.last_seen_location.address.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <MainLayout>
      <div className="admin-review-dashboard">
      <div className="dashboard-header">
        <h1>Missing Person Reports Review</h1>
        <div className="header-stats">
          <div className="stat-card">
            <span className="stat-number">{totalCount}</span>
            <span className="stat-label">Total Reports</span>
          </div>
          <div className="stat-card pending">
            <span className="stat-number">{reports.filter(r => r.verification_status === 'pending').length}</span>
            <span className="stat-label">Pending</span>
          </div>
        </div>
      </div>

      <div className="dashboard-controls">
        <div className="filters">
          <div className="filter-group">
            <label>Status:</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
              <option value="all">All</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Priority:</label>
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="filter-group search">
            <label>Search:</label>
            <input
              type="text"
              placeholder="Name, case number, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {selectedReports.size > 0 && (
          <div className="bulk-actions">
            <span className="selection-count">{selectedReports.size} selected</span>
            <button 
              className="btn-bulk-approve" 
              onClick={handleBulkApprove}
              disabled={actionLoading}
            >
              Approve Selected
            </button>
            <button 
              className="btn-bulk-reject" 
              onClick={handleBulkReject}
              disabled={actionLoading}
            >
              Reject Selected
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading reports...</p>
        </div>
      ) : (
        <>
          <div className="reports-table-container">
            <table className="reports-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={selectedReports.size === reports.length && reports.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th>Case #</th>
                  <th>Photo</th>
                  <th>Name</th>
                  <th>Age/Gender</th>
                  <th>Last Seen</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map(report => (
                  <tr key={report._id} className={`status-${report.verification_status}`}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedReports.has(report._id)}
                        onChange={() => toggleReportSelection(report._id)}
                      />
                    </td>
                    <td className="case-number">{report.case_number}</td>
                    <td className="photo-cell">
                      {report.photo_url ? (
                        <img src={report.photo_url} alt={report.full_name} className="report-thumbnail" />
                      ) : (
                        <div className="no-photo">No Photo</div>
                      )}
                    </td>
                    <td className="name-cell">{report.full_name}</td>
                    <td>{report.age} / {report.gender}</td>
                    <td className="location-cell">
                      <div>{report.last_seen_location.address}</div>
                      <small>{new Date(report.last_seen_date).toLocaleDateString()}</small>
                    </td>
                    <td>
                      <span className={`status-badge status-${report.verification_status}`}>
                        {report.verification_status}
                      </span>
                    </td>
                    <td>
                      <span className={`priority-badge priority-${report.priority}`}>
                        {report.priority}
                      </span>
                    </td>
                    <td className="date-cell">
                      {new Date(report.created_at).toLocaleDateString()}
                      <br />
                      <small>{new Date(report.created_at).toLocaleTimeString()}</small>
                    </td>
                    <td className="actions-cell">
                      <button
                        className="btn-view-details"
                        onClick={() => {
                          setSelectedReport(report);
                          setShowDetailModal(true);
                        }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className="page-info">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {showDetailModal && selectedReport && (
        <MissingPersonDetailModal
          report={selectedReport}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedReport(null);
          }}
          onApprove={handleApprove}
          onReject={handleReject}
          actionLoading={actionLoading}
        />
      )}
      </div>
    </MainLayout>
  );
};

interface DetailModalProps {
  report: MissingPerson;
  onClose: () => void;
  onApprove: (id: string, notes: string) => void;
  onReject: (id: string, reason: string) => void;
  actionLoading: boolean;
}

const MissingPersonDetailModal: React.FC<DetailModalProps> = ({
  report,
  onClose,
  onApprove,
  onReject,
  actionLoading
}) => {
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content detail-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        
        <h2>Missing Person Report Details</h2>
        
        <div className="detail-grid">
          <div className="detail-main">
            <div className="detail-section">
              <h3>Personal Information</h3>
              <div className="info-row">
                <label>Case Number:</label>
                <span className="case-number-large">{report.case_number}</span>
              </div>
              <div className="info-row">
                <label>Full Name:</label>
                <span>{report.full_name}</span>
              </div>
              <div className="info-row">
                <label>Age / Gender:</label>
                <span>{report.age} years / {report.gender}</span>
              </div>
              <div className="info-row">
                <label>Description:</label>
                <p className="description-text">{report.description}</p>
              </div>
            </div>

            <div className="detail-section">
              <h3>Last Seen Information</h3>
              <div className="info-row">
                <label>Location:</label>
                <span>{report.last_seen_location.address}</span>
              </div>
              <div className="info-row">
                <label>Date:</label>
                <span>{new Date(report.last_seen_date).toLocaleString()}</span>
              </div>
              <div className="info-row">
                <label>Coordinates:</label>
                <span>{report.last_seen_location.lat.toFixed(6)}, {report.last_seen_location.lng.toFixed(6)}</span>
              </div>
            </div>

            <div className="detail-section">
              <h3>Report Status</h3>
              <div className="info-row">
                <label>Verification Status:</label>
                <span className={`status-badge status-${report.verification_status}`}>
                  {report.verification_status}
                </span>
              </div>
              <div className="info-row">
                <label>Priority:</label>
                <span className={`priority-badge priority-${report.priority}`}>
                  {report.priority}
                </span>
              </div>
              <div className="info-row">
                <label>Public Visibility:</label>
                <span>{report.public_visibility ? 'Yes' : 'No'}</span>
              </div>
              <div className="info-row">
                <label>Submitted From IP:</label>
                <span>{report.submitted_from_ip || 'N/A'}</span>
              </div>
            </div>

            <div className="detail-section">
              <h3>Reporter Information</h3>
              <div className="info-row">
                <label>Name:</label>
                <span>{report.reporter_name || 'Anonymous'}</span>
              </div>
              <div className="info-row">
                <label>Phone:</label>
                <span>{report.reporter_phone || 'Not provided'}</span>
              </div>
            </div>
          </div>

          <div className="detail-sidebar">
            {report.photo_url && (
              <div className="detail-section">
                <h3>Photo</h3>
                <img src={report.photo_url} alt={report.full_name} className="detail-photo" />
              </div>
            )}

            <div className="detail-section">
              <h3>Approval History</h3>
              <div className="approval-timeline">
                {report.approval_history && report.approval_history.length > 0 ? (
                  report.approval_history.map((entry, index) => (
                    <div key={index} className={`timeline-entry action-${entry.action}`}>
                      <div className="timeline-marker"></div>
                      <div className="timeline-content">
                        <div className="timeline-action">{entry.action}</div>
                        <div className="timeline-user">
                          By: {entry.performed_by.username} ({entry.performed_by.role})
                        </div>
                        <div className="timeline-reason">{entry.reason}</div>
                        <div className="timeline-date">
                          {new Date(entry.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-history">No approval history yet</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {report.verification_status === 'pending' && (
          <div className="modal-actions">
            {!showRejectForm ? (
              <>
                <div className="approve-section">
                  <label>Approval Notes (optional):</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes about this approval..."
                    rows={3}
                  />
                </div>
                <div className="action-buttons">
                  <button
                    className="btn-approve-large"
                    onClick={() => onApprove(report._id, notes)}
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Processing...' : '✓ Approve Report'}
                  </button>
                  <button
                    className="btn-reject-large"
                    onClick={() => setShowRejectForm(true)}
                    disabled={actionLoading}
                  >
                    ✗ Reject Report
                  </button>
                </div>
              </>
            ) : (
              <div className="reject-section">
                <label>Rejection Reason (required):</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this report is being rejected..."
                  rows={4}
                  required
                />
                <div className="action-buttons">
                  <button
                    className="btn-confirm-reject"
                    onClick={() => onReject(report._id, rejectionReason)}
                    disabled={actionLoading || !rejectionReason.trim()}
                  >
                    {actionLoading ? 'Processing...' : 'Confirm Rejection'}
                  </button>
                  <button
                    className="btn-cancel"
                    onClick={() => {
                      setShowRejectForm(false);
                      setRejectionReason('');
                    }}
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReviewDashboard;
