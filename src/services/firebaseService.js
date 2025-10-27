import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "../firebase/firebaseConfig";


class FirebaseService {
  constructor() {
    this.currentToken = null;
  }

  async requestPermission() {
    try {
      // Check if notifications are supported
      if (!('Notification' in window)) {
        console.log('❌ This browser does not support notifications');
        return false;
      }

      // Check current permission status
      if (Notification.permission === 'granted') {
        console.log('✅ Notification permission already granted');
        return true;
      }

      if (Notification.permission === 'denied') {
        console.log('❌ Notification permission denied by user');
        return false;
      }

      // Request permission
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('✅ Notification permission granted.');
        return true;
      } else {
        console.log('❌ Unable to get permission to notify. Permission:', permission);
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  async generateToken() {
    try {
      console.log('🔄 Checking notification permission...');
      const permissionGranted = await this.requestPermission();
      if (!permissionGranted) {
        throw new Error('Notification permission denied');
      }

      console.log('🔄 Generating FCM token...');

      // Check if service worker is available
      if (!('serviceWorker' in navigator)) {
        throw new Error('Service Worker not supported');
      }

      // Register service worker if not already registered
      try {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('✅ Service Worker registered:', registration);
      } catch (swError) {
        console.log('⚠️ Service Worker registration failed:', swError);
        // Continue anyway, might already be registered
      }

      // Try to get token with VAPID key first, fallback without if needed
      let token;
      try {
        token = await getToken(messaging, {
          vapidKey: "BE3cALPMvuobCzLQeyEwvAVBTDXqt_FOBCUn6pckYGIAwbqW4mIEA_zBxXnrVHZbkG-0zbU5JZxoq4phFKAMwdc"
        });
      } catch (vapidError) {
        console.log('⚠️ VAPID key failed, trying without VAPID key:', vapidError);
        token = await getToken(messaging);
      }

      if (token) {
        console.log('✅ FCM Token generated successfully');
        console.log('Token preview:', token.substring(0, 20) + '...');
        this.currentToken = token;
        return token;
      } else {
        throw new Error('No registration token available - check Firebase config and VAPID key');
      }
    } catch (error) {
      console.error('❌ Error generating FCM token:', error);
      throw error;
    }
  }

  async registerTokenWithBackend(userId, userType) {
    try {
      console.log('🔄 Starting FCM token generation for user:', userId, 'type:', userType);
      const token = await this.generateToken();
      console.log('🔄 FCM token generated, registering with backend...');

      const response = await fetch('http://localhost:8081/api/fcm/register-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          userId: userId.toString(),
          userType: userType
        })
      });

      if (response.ok) {
        console.log('✅ FCM token registered successfully with backend');
        return true;
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to register FCM token with backend:', response.status, errorText);
        return false;
      }
    } catch (error) {
      console.error('❌ Error in FCM token registration process:', error);
      return false;
    }
  }

  setupForegroundMessageListener() {
    if (!messaging) {
      console.warn('⚠️ Firebase messaging not initialized');
      return;
    }

    onMessage(messaging, (payload) => {
      console.log('📱 Message received in foreground:', payload);

      // Dispatch custom event for components to listen to
      const event = new CustomEvent('firebaseNotification', {
        detail: payload
      });
      window.dispatchEvent(event);

      // Also dispatch a more specific event for notification bell
      const bellEvent = new CustomEvent('notificationBellUpdate', {
        detail: { type: 'new_notification', payload }
      });
      window.dispatchEvent(bellEvent);

      // Show toast notification instead of alert
      if (payload.notification) {
        console.log(`📢 ${payload.notification.title}: ${payload.notification.body}`);

        // Show browser notification if permission granted
        if (Notification.permission === 'granted') {
          new Notification(payload.notification.title, {
            body: payload.notification.body,
            icon: '/favicon.ico'
          });
        }
      }

      // Force a global refresh of notification counts
      setTimeout(() => {
        const refreshEvent = new CustomEvent('forceNotificationRefresh');
        window.dispatchEvent(refreshEvent);
      }, 1000);
    });

    console.log('✅ Firebase foreground message listener setup complete');
  }

  async getNotifications(userType, userId) {
    try {
      const response = await fetch(`http://localhost:8081/api/fcm/notifications/${userType}/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const notifications = await response.json();
        return notifications;
      } else {
        console.error('❌ Failed to fetch notifications:', response.statusText);
        return [];
      }
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      return [];
    }
  }

  // Get unread notification count
  async getUnreadCount(userType, userId) {
    try {
      const response = await fetch(`http://localhost:8081/api/fcm/notifications/${userType}/${userId}/unread-count`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const count = await response.json();
        return count;
      } else {
        console.error('❌ Failed to fetch unread count:', response.statusText);
        return 0;
      }
    } catch (error) {
      console.error('❌ Error fetching unread count:', error);
      return 0;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      const response = await fetch(`http://localhost:8081/api/fcm/notifications/${notificationId}/mark-read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        console.log('✅ Notification marked as read');
        return true;
      } else {
        console.error('❌ Failed to mark notification as read:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      return false;
    }
  }

  // Mark all notifications as read
  async markAllAsRead(userType, userId) {
    try {
      const response = await fetch(`http://localhost:8081/api/fcm/notifications/${userType}/${userId}/mark-all-read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ All notifications marked as read:', result);
        return result;
      } else {
        console.error('❌ Failed to mark all notifications as read:', response.statusText);
        return null;
      }
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
      return null;
    }
  }

  // Update notification preferences
  async updateNotificationPreferences(userType, userId, enabled) {
    try {
      const response = await fetch('http://localhost:8081/api/fcm/update-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userType: userType,
          userId: userId,
          notificationsEnabled: enabled
        })
      });

      if (response.ok) {
        console.log('✅ Notification preferences updated');
        return true;
      } else {
        console.error('❌ Failed to update preferences:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('❌ Error updating preferences:', error);
      return false;
    }
  }
}

// Create a single instance
const firebaseService = new FirebaseService();

export default firebaseService;