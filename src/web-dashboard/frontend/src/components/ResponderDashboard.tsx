import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Clock, MapPin, User, RotateCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import MainLayout from './MainLayout';
import ResponderNotifications from './ResponderNotifications';
import toast from 'react-hot-toast';

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
  emergency_type?: string;
  response_time?: string;
  resolution_time?: string;
  notes?: Array<{
    responder_id: string;
    note: string;
    timestamp: string;
  }>;
}

interface DashboardStats {
  assignedSignals: number;
  activeSignals: number;
  resolvedToday: number;
  averageResponseTime: number;
}

const ResponderDashboard: React.FC = () => {
  const { user } = useAuth();
  const [assignedSignals, setAssignedSignals] = useState<SOSSignal[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    assignedSignals: 0,
    activeSignals: 0,
    resolvedToday: 0,
    averageResponseTime: 0
  });
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

  // Fetch assigned SOS signals
  const fetchAssignedSignals = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const url = `${API_BASE_URL}/api/responder/notifications/assignments`;
      console.log('Fetching assignments from:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('API Response:', data);
        
        if (data.success) {
          setAssignedSignals(data.data.signals);
          
          // Use stats from backend
          setStats({
            assignedSignals: data.data.stats.totalAssigned,
            activeSignals: data.data.stats.active,
            resolvedToday: data.data.stats.resolvedToday,
            averageResponseTime: 0 // Could be calculated from response_time field
          });
        }
      } else {
        const errorText = await response.text();
        console.error('API Error:', errorText);
      }
    } catch (error) {
      console.error('Error fetching assigned signals:', error);
    }
  }, [API_BASE_URL]);

  // Fetch notification count
  const fetchNotificationCount = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/api/responder/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUnreadNotifications(data.unreadCount);
        }
      }
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  }, [API_BASE_URL]);

  // Update SOS signal status
  const updateSignalStatus = async (signalId: string, status: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const url = `${API_BASE_URL}/api/responder/notifications/assignments/${signalId}/status`;
      console.log('Updating status at:', url, 'with status:', status);

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, notes: `Status updated by responder ${user?.individualId}` })
      });

      console.log('Update response status:', response.status);

      if (response.ok) {
        toast.success('Status updated successfully');
        fetchAssignedSignals(); // Refresh data
      } else {
        const errorText = await response.text();
        console.error('Update error:', errorText);
        toast.error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating signal status:', error);
      toast.error('Failed to update status');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchAssignedSignals(), fetchNotificationCount()]);
      setLoading(false);
    };

    loadData();

    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      fetchAssignedSignals();
      fetchNotificationCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchAssignedSignals, fetchNotificationCount]);

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
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
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

  if (loading) {
    return (
      <MainLayout>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header with Notifications */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Responder Dashboard</h1>
            <p className="text-sm sm:text-base text-gray-600">Manage your emergency response assignments</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => {
                fetchAssignedSignals();
                fetchNotificationCount();
                toast.success('Dashboard refreshed');
              }}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
            >
              <RotateCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={() => setShowNotifications(true)}
              className="relative flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <Bell className="w-4 sm:w-5 h-4 sm:h-5" />
              <span className="hidden sm:inline">Notifications</span>
              {unreadNotifications > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadNotifications}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        {assignedSignals.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Quick Actions</h3>
            <div className="flex flex-wrap gap-2">
              {assignedSignals
                .filter(signal => signal.status === 'acknowledged')
                .slice(0, 3)
                .map(signal => (
                  <button
                    key={signal._id}
                    onClick={() => updateSignalStatus(signal._id, 'responding')}
                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded-full hover:bg-blue-700 transition-colors"
                  >
                    Respond to SOS #{signal._id.slice(-4)}
                  </button>
                ))}
            </div>
            {assignedSignals.filter(signal => signal.status === 'acknowledged').length === 0 && (
              <p className="text-xs text-blue-700">No pending assignments to respond to</p>
            )}
          </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-lg shadow p-3 sm:p-6">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Assigned Signals</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-600">{stats.assignedSignals}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-3 sm:p-6">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Active Assignments</p>
              <p className="text-xl sm:text-2xl font-bold text-orange-600">{stats.activeSignals}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-3 sm:p-6">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Resolved Today</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.resolvedToday}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div>
              <p className="text-sm font-medium text-gray-600">Unread Notifications</p>
              <p className="text-2xl font-bold text-red-600">{unreadNotifications}</p>
            </div>
          </div>
        </div>

        {/* Assigned SOS Signals */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Your Assignments</h2>
            <p className="text-sm text-gray-600 mt-1">Emergency signals assigned to you for response</p>
          </div>

          {assignedSignals.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <User className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-lg font-medium">No assignments yet</p>
              <p className="text-sm">You'll see your emergency assignments here when admins assign them to you</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {assignedSignals.map((signal) => (
                <div key={signal._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getPriorityColor(signal.priority)}`}>
                          {signal.priority.toUpperCase()}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(signal.status)}`}>
                          {signal.status.replace('_', ' ').toUpperCase()}
                        </span>
                        {signal.emergency_type && (
                          <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full capitalize">
                            {signal.emergency_type.replace('_', ' ')}
                          </span>
                        )}
                        {signal.escalation_level && signal.escalation_level > 0 && (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                            Escalated ×{signal.escalation_level}
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        SOS #{signal._id.slice(-8)}
                      </h3>

                      <p className="text-sm text-gray-700 mb-3 leading-relaxed">{signal.message}</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <div className="flex items-center text-xs text-gray-500 gap-1">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">
                            {signal.location.address || `${signal.location.lat.toFixed(4)}, ${signal.location.lng.toFixed(4)}`}
                          </span>
                        </div>
                        <div className="flex items-center text-xs text-gray-500 gap-1">
                          <Clock className="w-3 h-3 flex-shrink-0" />
                          <span>{getTimeAgo(signal.created_at)}</span>
                        </div>
                      </div>

                      {signal.response_time && (
                        <div className="text-xs text-green-600 mb-2">
                          Response started: {new Date(signal.response_time).toLocaleString()}
                        </div>
                      )}

                      {signal.notes && signal.notes.length > 0 && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs font-medium text-gray-700 mb-1">Recent Notes:</p>
                          <p className="text-xs text-gray-600">
                            {signal.notes[signal.notes.length - 1].note}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="ml-6 flex flex-col gap-2 min-w-[140px]">
                      {signal.status === 'acknowledged' && (
                        <button
                          onClick={() => updateSignalStatus(signal._id, 'responding')}
                          className="px-3 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                        >
                          Start Responding
                        </button>
                      )}

                      {signal.status === 'responding' && (
                        <button
                          onClick={() => updateSignalStatus(signal._id, 'resolved')}
                          className="px-3 py-2 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                        >
                          Mark Resolved
                        </button>
                      )}

                      {['acknowledged', 'responding'].includes(signal.status) && (
                        <button
                          onClick={() => updateSignalStatus(signal._id, 'false_alarm')}
                          className="px-3 py-2 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors"
                        >
                          False Alarm
                        </button>
                      )}

                      <button
                        onClick={() => {
                          // Open location in maps (could integrate with map service)
                          const url = `https://www.google.com/maps?q=${signal.location.lat},${signal.location.lng}`;
                          window.open(url, '_blank');
                        }}
                        className="px-3 py-2 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 transition-colors"
                      >
                        View Location
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notifications Panel */}
      <ResponderNotifications
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </MainLayout>
  );
};

export default ResponderDashboard;
