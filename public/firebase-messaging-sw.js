// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize Firebase
firebase.initializeApp({
  apiKey: "AIzaSyC9FK8jpCUzJvqO2LMEpSG5CN6c3-jKQNo",
  authDomain: "notification-bb346.firebaseapp.com",
  projectId: "notification-bb346",
  storageBucket: "notification-bb346.firebasestorage.app",
  messagingSenderId: "1070936523268",
  appId: "1:1070936523268:web:b44e17ad41edddb5bfab51"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: 'public/firebase-logo.png', 
    badge: 'public/firebase-logo.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();
  
  // Navigate to specific page based on notification data
  event.waitUntil(
    clients.openWindow('/dashboard') // or specific route based on notification type
  );
});