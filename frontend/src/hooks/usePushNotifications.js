import { useState, useEffect, useCallback } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app, isFirebaseConfigured } from '../lib/firebase';
import api from '../lib/api';
import { toast } from 'sonner';

const VAPID_KEY = process.env.REACT_APP_FIREBASE_VAPID_KEY;

export function usePushNotifications() {
  // Use window.Notification to safely access — iOS Safari doesn't have Notification global
  const getNotificationPermission = () => {
    try {
      return (typeof window !== 'undefined' && 'Notification' in window) 
        ? window.Notification.permission 
        : 'default';
    } catch { return 'default'; }
  };
  
  const [permission, setPermission] = useState(getNotificationPermission);
  const [fcmToken, setFcmToken] = useState(null);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    // Check if push is supported (Safari on iOS does not support FCM)
    const checkSupport = () => {
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const hasNotification = typeof window !== 'undefined' && 'Notification' in window;
      const hasSW = 'serviceWorker' in navigator;
      const hasPushManager = 'PushManager' in window;
      
      return hasNotification && hasSW && hasPushManager && isFirebaseConfigured && VAPID_KEY && !(isIOS && isSafari);
    };
    
    setSupported(checkSupport());
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(window.Notification.permission);
    }
  }, []);

  // Listen for foreground messages
  useEffect(() => {
    if (!supported || !app) return;

    try {
      const messaging = getMessaging(app);
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('Foreground push received:', payload);
        const title = payload.notification?.title || payload.data?.title || 'Divine App';
        const body = payload.notification?.body || payload.data?.message || '';
        
        toast(title, {
          description: body,
          duration: 6000,
        });
      });
      return unsubscribe;
    } catch (err) {
      console.error('Error setting up foreground messages:', err);
    }
  }, [supported]);

  const requestPermission = useCallback(async () => {
    if (!supported || !('Notification' in window)) return null;

    try {
      const result = await window.Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        // Register service worker
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        await navigator.serviceWorker.ready;

        // Get FCM token
        const messaging = getMessaging(app);
        const token = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: registration,
        });

        if (token) {
          setFcmToken(token);
          // Send token to backend
          try {
            await api.post('/api/notifications/register-push-token', { token });
            console.log('FCM token registered with backend');
          } catch (err) {
            console.error('Failed to register token with backend:', err);
          }
          return token;
        }
      }
      return null;
    } catch (err) {
      console.error('Push notification setup error:', err);
      return null;
    }
  }, [supported]);

  return {
    permission,
    fcmToken,
    supported,
    requestPermission,
    isGranted: permission === 'granted',
    isDenied: permission === 'denied',
  };
}
