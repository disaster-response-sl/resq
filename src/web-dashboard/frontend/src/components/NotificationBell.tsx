import React, { useState, useEffect } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import ResponderNotifications from './ResponderNotifications';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  // Fetch unread notification count
  const fetchUnreadCount = async () => {
    if (!user || user.role !== 'responder') return;
    
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/api/responder/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setUnreadCount(result.unreadCount);
        }
      }
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  };

  // Fetch count on mount and periodically
  useEffect(() => {
    if (user && user.role === 'responder') {
      fetchUnreadCount();
      
      // Check for new notifications every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user]);

  // Only show for responders
  if (!user || user.role !== 'responder') {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setShowNotifications(true)}
        className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors"
        title="Notifications"
      >
        {unreadCount > 0 ? (
          <BellRing className="w-6 h-6" />
        ) : (
          <Bell className="w-6 h-6" />
        )}
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <ResponderNotifications
        isOpen={showNotifications}
        onClose={() => {
          setShowNotifications(false);
          fetchUnreadCount(); // Refresh count when closing
        }}
      />
    </>
  );
};

export default NotificationBell;
