import React, { useState, useEffect } from 'react';
import { FaBell, FaTimes, FaUser, FaFileAlt, FaBriefcase, FaCalendarAlt, FaSync } from 'react-icons/fa';
import firebaseService from '../services/firebaseService';
import './NotificationBell.css';

const NotificationBell = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Get user data
  const getUserData = () => {
    try {
      const userData = localStorage.getItem('user');
      console.log('🔍 Raw user data from localStorage:', userData);
      if (userData && userData !== 'null') {
        const parsed = JSON.parse(userData);
        console.log('👤 Parsed user data:', parsed);
        console.log('🆔 User ID for notifications:', parsed.id);
        console.log('👥 User type for notifications:', parsed.role);

        // Show a prominent alert with user info
        console.log('🚨 NOTIFICATION BELL USER INFO:');
        console.log('   User ID:', parsed.id);
        console.log('   User Role:', parsed.role);
        console.log('   User Name:', parsed.name || parsed.fullName);

        return parsed;
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
    return null;
  };

  const user = getUserData();

  // Fix user type mapping - check both 'role' and 'roll' properties
  const getUserType = () => {
    if (!user) return null;
    const role = user.role || user.roll;
    console.log('🔍 Raw role from user:', role);

    if (role === 'EMPLOYEE') return 'EMPLOYEE';
    if (role === 'SUBADMIN' || role === 'SUB_ADMIN') return 'SUBADMIN';

    // Default fallback based on user data structure
    if (user.registercompanyname || user.companylogo) {
      console.log('🏢 Detected subadmin based on company data');
      return 'SUBADMIN';
    }

    console.warn('⚠️ Unknown role:', role, 'defaulting to EMPLOYEE');
    return 'EMPLOYEE';
  };

  const userType = getUserType();
  console.log('🏷️ Final userType for API calls:', userType);

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
      console.log('🔔 Fetching unread count for:', userType, user.id);
      const count = await firebaseService.getUnreadCount(userType, user.id);
      console.log('📊 Unread count received:', count);
      setUnreadCount(count);
    } catch (error) {
      console.error('❌ Error fetching unread count:', error);
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

      // More frequent checks for the first minute after component mounts
      const quickInterval = setInterval(() => {
        console.log('⚡ Quick refresh check');
        fetchUnreadCount();
      }, 3000); // Every 3 seconds

      // Stop quick checks after 1 minute
      setTimeout(() => {
        clearInterval(quickInterval);
        console.log('⏰ Stopping quick refresh checks');
      }, 60000);

      return () => clearInterval(quickInterval);
    }
  }, [user]);

  // Listen for new notifications and setup FCM
  useEffect(() => {
    const handleNewNotification = (event) => {
      console.log('🔔 New notification received in bell:', event.detail);
      const payload = event.detail;

      // Show browser notification if permission granted
      if (Notification.permission === 'granted' && payload.notification) {
        new Notification(payload.notification.title || 'New Notification', {
          body: payload.notification.body || 'You have a new notification',
          icon: '/favicon.ico',
          badge: '/favicon.ico'
        });
      }

      // Always refresh unread count when any notification arrives
      console.log('🔄 Refreshing unread count due to new notification');
      fetchUnreadCount();

      // If dropdown is open, refresh notifications list
      if (showDropdown) {
        console.log('🔄 Refreshing notifications list');
        fetchNotifications();
      }
    };

    // Set up Firebase foreground message listener
    console.log('🔧 Setting up Firebase listener in NotificationBell');
    firebaseService.setupForegroundMessageListener();
    setIsListening(true);

    // Register FCM token if user is available
    if (user && user.id && userType) {
      console.log('🔄 Registering FCM token for user:', user.id, 'type:', userType);
      firebaseService.registerTokenWithBackend(user.id, userType)
        .then(() => {
          console.log('✅ FCM token registered successfully');
        })
        .catch(error => {
          console.error('❌ FCM registration failed:', error);
          // Continue without FCM - database notifications still work
        });
    }

    window.addEventListener('firebaseNotification', handleNewNotification);

    // Listen for specific bell update events
    const handleBellUpdate = (event) => {
      console.log('🔔 Bell update event received:', event.detail);
      fetchUnreadCount();
      if (showDropdown) {
        fetchNotifications();
      }
    };

    // Listen for forced refresh events
    const handleForceRefresh = () => {
      console.log('🔄 Force refresh event received');
      fetchUnreadCount();
      if (showDropdown) {
        fetchNotifications();
      }
    };

    window.addEventListener('notificationBellUpdate', handleBellUpdate);
    window.addEventListener('forceNotificationRefresh', handleForceRefresh);

    return () => {
      window.removeEventListener('firebaseNotification', handleNewNotification);
      window.removeEventListener('notificationBellUpdate', handleBellUpdate);
      window.removeEventListener('forceNotificationRefresh', handleForceRefresh);
    };
  }, [showDropdown]);

  // Periodic refresh of unread count (every 5 seconds for better real-time feel)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      console.log('🔄 Periodic refresh of unread count');
      fetchUnreadCount();
    }, 5000); // 5 seconds for better responsiveness

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

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    if (!user || unreadCount === 0) return;

    try {
      const result = await firebaseService.markAllAsRead(userType, user.id);
      if (result) {
        console.log('✅ All notifications marked as read:', result);
        // Update local state
        setUnreadCount(0);
        setNotifications(prev =>
          prev.map(n => ({...n, isRead: true}))
        );
      }
    } catch (error) {
      console.error('❌ Error marking all as read:', error);
    }
  };

  // Expose refresh function globally for debugging
  useEffect(() => {
    window.refreshNotificationBell = () => {
      console.log('🔧 Manual notification bell refresh triggered');
      fetchUnreadCount();
      if (showDropdown) {
        fetchNotifications();
      }
    };

    return () => {
      delete window.refreshNotificationBell;
    };
  }, [showDropdown]);

  if (!user) return null;

  return (
    <div className="notification-bell-container">
      <div className={`notification-bell ${unreadCount > 0 ? 'has-unread' : ''} ${isListening ? 'listening' : ''}`} onClick={handleBellClick}>
        <FaBell size={20} />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
        {isListening && (
          <span className="listening-indicator" title="Listening for notifications">🟢</span>
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
              {unreadCount > 0 && (
                <button
                  className="notification-mark-all-btn"
                  onClick={handleMarkAllRead}
                  title="Mark all as read"
                >
                  Mark All Read
                </button>
              )}
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