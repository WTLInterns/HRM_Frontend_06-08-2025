import React, { useState, useEffect } from 'react';
import { FaBell, FaTimes, FaUser, FaFileAlt, FaBriefcase, FaCalendarAlt, FaSync } from 'react-icons/fa';
import firebaseService from '../services/firebaseService';
import './NotificationBell.css';

const NotificationBell = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  // Get user data
  const getUserData = () => {
    try {
      const userData = localStorage.getItem('user');
      if (userData && userData !== 'null') {
        return JSON.parse(userData);
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
    return null;
  };

  const user = getUserData();
  const userType = user?.role === 'SUB_ADMIN' ? 'SUBADMIN' : 'EMPLOYEE';

  // Helper functions for better UI
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'LEAVE_APPLIED': return '📅';
      case 'LEAVE_APPROVED': return '✅';
      case 'LEAVE_REJECTED': return '❌';
      case 'RESUME_SUBMITTED': return '📄';
      case 'JOB_OPENING': return '🎯';
      default: return '🔔';
    }
  };

  const getNotificationTypeName = (type) => {
    switch (type) {
      case 'LEAVE_APPLIED': return 'Leave Request';
      case 'LEAVE_APPROVED': return 'Leave Approved';
      case 'LEAVE_REJECTED': return 'Leave Rejected';
      case 'RESUME_SUBMITTED': return 'Resume';
      case 'JOB_OPENING': return 'Job Opening';
      default: return 'Notification';
    }
  };

  const formatNotificationTime = (sentAt) => {
    const date = new Date(sentAt);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const fetchUnreadCount = async () => {
    if (!user) return;
    try {
      const count = await firebaseService.getUnreadCount(userType, user.id);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const notifs = await firebaseService.getNotifications(userType, user.id);
      setNotifications(notifs.slice(0, 10)); // Show latest 10
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      // Set up Firebase listener on initial load
      firebaseService.setupForegroundMessageListener();
    }
  }, [user]);

  // Listen for new notifications
  useEffect(() => {
    const handleNewNotification = (event) => {
      console.log('🔔 New notification received in bell:', event.detail);
      const payload = event.detail;

      // Check if this is a notification for the current user
      if (payload.data && payload.data.type) {
        console.log('📱 Notification type:', payload.data.type);

        // For subadmins, only process RESUME_SUBMITTED and LEAVE_APPLIED notifications
        if (userType === 'SUBADMIN' &&
            (payload.data.type === 'RESUME_SUBMITTED' || payload.data.type === 'LEAVE_APPLIED')) {
          console.log('✅ Processing notification for subadmin');
          fetchUnreadCount();
          if (showDropdown) {
            fetchNotifications();
          }
        }
        // For employees, process all notifications
        else if (userType === 'EMPLOYEE') {
          console.log('✅ Processing notification for employee');
          fetchUnreadCount();
          if (showDropdown) {
            fetchNotifications();
          }
        }
      }
    };

    // Set up Firebase foreground message listener
    firebaseService.setupForegroundMessageListener();

    window.addEventListener('firebaseNotification', handleNewNotification);
    return () => window.removeEventListener('firebaseNotification', handleNewNotification);
  }, [showDropdown, userType]);

  // Periodic refresh of unread count (every 10 seconds for better real-time feel)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      console.log('🔄 Periodic refresh of unread count');
      fetchUnreadCount();
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [user]);

  // Refresh when window gains focus
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        console.log('👁️ Window focused - refreshing notifications');
        fetchUnreadCount();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.notification-bell-container')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  // Handle dropdown toggle
  const handleBellClick = () => {
    if (!showDropdown) {
      fetchNotifications();
      // Also refresh unread count when opening
      fetchUnreadCount();
    }
    setShowDropdown(!showDropdown);
  };

  // Manual refresh function
  const handleRefresh = () => {
    fetchUnreadCount();
    if (showDropdown) {
      fetchNotifications();
    }
  };



  // Mark notification as read
  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await firebaseService.markAsRead(notification.id);
      setUnreadCount(prev => Math.max(0, prev - 1));
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? {...n, isRead: true} : n)
      );
    }
  };

  if (!user) return null;

  return (
    <div className="notification-bell-container">
      <div className={`notification-bell ${unreadCount > 0 ? 'has-unread' : ''}`} onClick={handleBellClick}>
        <FaBell size={20} />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </div>

      {showDropdown && (
        <>
          <div className="notification-overlay" onClick={() => setShowDropdown(false)}></div>
          <div className="notification-dropdown">
          <div className="notification-header">
            <div className="notification-header-left">
              <h4>Notifications</h4>
              <span className="notification-count">{unreadCount} unread</span>
            </div>
            <div className="notification-header-actions">
              <button className="notification-refresh-btn" onClick={handleRefresh} title="Refresh notifications">
                <FaSync />
              </button>
              <button className="notification-close-btn" onClick={() => setShowDropdown(false)} title="Close">
                <FaTimes />
              </button>
            </div>
          </div>
          
          <div className="notification-list">
            {loading ? (
              <div className="notification-loading">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">No notifications</div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-item-header">
                    <div className="notification-title">
                      {getNotificationIcon(notification.notificationType)} {notification.title}
                    </div>
                    <div className="notification-type-badge">
                      {getNotificationTypeName(notification.notificationType)}
                    </div>
                  </div>
                  <div className="notification-body">{notification.body}</div>
                  <div className="notification-time">
                    {formatNotificationTime(notification.sentAt)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;