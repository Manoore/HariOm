/* eslint-disable no-restricted-globals */
/* eslint-disable no-undef */

// Firebase Messaging Service Worker for Push Notifications
// Safari/iOS does not support Firebase Cloud Messaging — guard all FCM calls

try {
  importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

  firebase.initializeApp({
    apiKey: 'AIzaSyAIw0SvgcTAelMSgrsKXE62UWrUlb8KeGs',
    authDomain: 'divine-104d4.firebaseapp.com',
    projectId: 'divine-104d4',
    storageBucket: 'divine-104d4.firebasestorage.app',
    messagingSenderId: '149993395431',
    appId: '1:149993395431:web:a17beaeb0c1aad80f8be42',
  });

  // Only initialize messaging if supported (not Safari/iOS)
  if (typeof firebase.messaging === 'function' && firebase.messaging.isSupported()) {
    const messaging = firebase.messaging();

    // Handle background messages
    messaging.onBackgroundMessage((payload) => {
      console.log('[SW] Background message received:', payload);

      const notificationTitle = payload.notification?.title || payload.data?.title || 'Divine App';
      const notificationOptions = {
        body: payload.notification?.body || payload.data?.message || 'You have a new notification',
        icon: '/temple-logo.png',
        badge: '/logo192.png',
        tag: payload.data?.type || 'divine-notification',
        data: payload.data || {},
        actions: [
          { action: 'open', title: 'Open App' }
        ],
        vibrate: [200, 100, 200],
      };

      self.registration.showNotification(notificationTitle, notificationOptions);
    });
  }
} catch (e) {
  console.warn('[SW] Firebase messaging not supported in this browser:', e.message);
}

// Handle notification click — works in all browsers
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
