import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "../firebase/firebaseconfig";


class FirebaseService {
  constructor() {
    this.currentToken = null;
  }

  async requestPermission() {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('✅ Notification permission granted.');
        return true;
      } else {
        console.log('❌ Unable to get permission to notify.');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  async generateToken() {
    try {
      const permissionGranted = await this.requestPermission();
      if (!permissionGranted) {
        throw new Error('Notification permission denied');
      }
      const token = await getToken(messaging, {
        vapidKey: "BE3cALPMvuobCzLQeyEwvAVBTDXqt_FOBCUn6pckYGIAwbqW4mIEA_zBxXnrVHZbkG-0zbU5JZxoq4phFKAMwdc"   });

      if (token) {
        console.log('✅ FCM Token generated:', token);
        this.currentToken = token;
        return token;
      } else {
        throw new Error('No registration token available');
      }
    } catch (error) {
      console.error('❌ Error generating FCM token:', error);
      throw error;
    }
  }

  async registerTokenWithBackend(userId, userType) {
    try {
      const token = await this.generateToken();
      
      const response = await fetch('http://localhost:8282/api/fcm/register-token', {
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
        console.log('✅ FCM token registered successfully');
        return true;
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to register FCM token:', errorText);
        return false;
      }
    } catch (error) {
      console.error('❌ Error registering FCM token:', error);
      return false;
    }
  }

  setupForegroundMessageListener() {
    onMessage(messaging, (payload) => {
      console.log('📱 Message received in foreground:', payload);
      
      // Dispatch custom event for components to listen to
      const event = new CustomEvent('firebaseNotification', {
        detail: payload
      });
      window.dispatchEvent(event);
      
      // Show toast notification instead of alert
      if (payload.notification) {
        // You can integrate with react-toastify here
        console.log(`📢 ${payload.notification.title}: ${payload.notification.body}`);
      }
    });
  }

  async getNotifications(userType, userId) {
    try {
      const response = await fetch(`http://localhost:8282/api/fcm/notifications/${userType}/${userId}`, {
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
      const response = await fetch(`http://localhost:8282/api/fcm/notifications/${userType}/${userId}/unread-count`, {
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
      const response = await fetch(`http://localhost:8282/api/fcm/notifications/${notificationId}/mark-read`, {
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

  // Update notification preferences
  async updateNotificationPreferences(userType, userId, enabled) {
    try {
      const response = await fetch('http://localhost:8282/api/fcm/update-preferences', {
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