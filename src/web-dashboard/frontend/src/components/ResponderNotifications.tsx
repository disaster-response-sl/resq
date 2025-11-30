import React, { useState, useEffect } from 'react';
import { Bell, BellRing, X, CheckCircle, Clock, AlertTriangle, MapPin } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  sosId: string;
  timestamp: string;
  read: boolean;
  data: {
    location: {
      lat: number;
      lng: number;
      address?: string;
    };
    emergencyType: string;
    citizenMessage: string;
    assignedBy: string;
    notes?: string;
    assignmentTime: string;
  };
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const ResponderNotifications: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch notifications from the backend
  const fetchNotifications = async () => {
    if (!user || user.role !== 'responder') return;
    
    setLoading(true);
    setError(null);
    
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/api/responder/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const result = await response.json();
      if (result.success) {
        setNotifications(result.data);
        setUnreadCount(result.unreadCount);
      } else {
        throw new Error(result.message || 'Failed to fetch notifications');
      }
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/api/responder/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/api/responder/notifications/read-all`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
        toast.success('All notifications marked as read');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark notifications as read');
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/api/responder/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        const notification = notifications.find(n => n.id === notificationId);
        if (notification && !notification.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        toast.success('Notification deleted');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  // Fetch notifications when component mounts or user changes
  useEffect(() => {
    if (user && user.role === 'responder') {
      fetchNotifications();
    }
  }, [user]);

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Get priority icon
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'high': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'medium': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'low': return <CheckCircle className="w-4 h-4 text-green-600" />;
      default: return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
      <div className="bg-white w-full max-w-md h-full shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BellRing className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Notifications</h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Actions */}
        {notifications.length > 0 && unreadCount > 0 && (
          <div className="p-3 border-b border-gray-200">
            <button
              onClick={markAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              Mark all as read
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="p-4 text-center text-gray-500">
              Loading notifications...
            </div>
          )}

          {error && (
            <div className="p-4 text-center text-red-600">
              Error: {error}
              <button
                onClick={fetchNotifications}
                className="block mx-auto mt-2 text-blue-600 hover:text-blue-800"
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && notifications.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No notifications yet</p>
              <p className="text-sm">You'll see emergency assignments here</p>
            </div>
          )}

          {!loading && !error && notifications.length > 0 && (
            <div className="space-y-3 p-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    notification.read 
                      ? 'bg-gray-50 border-gray-200' 
                      : 'bg-white border-blue-200 shadow-md'
                  }`}
                >
                  {/* Notification Header */}
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      {getPriorityIcon(notification.priority)}
                      <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(notification.priority)}`}>
                        {notification.priority.toUpperCase()}
                      </span>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-blue-600 hover:text-blue-800 text-xs"
                          title="Mark as read"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="text-red-600 hover:text-red-800 text-xs"
                        title="Delete"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Notification Content */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                    <p className="text-sm text-gray-700">{notification.message}</p>
                    
                    {/* Emergency Details */}
                    <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-2">
                      <div className="flex items-center gap-1 text-gray-600">
                        <MapPin className="w-3 h-3" />
                        <span>Location: {notification.data.location.address || `${notification.data.location.lat}, ${notification.data.location.lng}`}</span>
                      </div>
                      <div className="text-gray-600">
                        <strong>Type:</strong> {notification.data.emergencyType || 'Unknown'}
                      </div>
                      <div className="text-gray-600">
                        <strong>Message:</strong> {notification.data.citizenMessage}
                      </div>
                      <div className="text-gray-600">
                        <strong>Assigned by:</strong> {notification.data.assignedBy}
                      </div>
                      {notification.data.notes && (
                        <div className="text-gray-600">
                          <strong>Notes:</strong> {notification.data.notes}
                        </div>
                      )}
                    </div>

                    {/* Timestamp */}
                    <div className="text-xs text-gray-500">
                      {new Date(notification.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResponderNotifications;
