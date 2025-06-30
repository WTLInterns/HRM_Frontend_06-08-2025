import React, { useState, useEffect } from 'react';
import { FaBell } from 'react-icons/fa';
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
    }
  }, [user]);

  // Listen for new notifications
  useEffect(() => {
    const handleNewNotification = () => {
      fetchUnreadCount();
      if (showDropdown) {
        fetchNotifications();
      }
    };

    window.addEventListener('firebaseNotification', handleNewNotification);
    return () => window.removeEventListener('firebaseNotification', handleNewNotification);
  }, [showDropdown]);

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
    }
    setShowDropdown(!showDropdown);
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
      <div className="notification-bell" onClick={handleBellClick}>
        <FaBell size={20} />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </div>

      {showDropdown && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h4>Notifications</h4>
            <span className="notification-count">{unreadCount} unread</span>
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
                  <div className="notification-title">{notification.title}</div>
                  <div className="notification-body">{notification.body}</div>
                  <div className="notification-time">
                    {new Date(notification.sentAt).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;