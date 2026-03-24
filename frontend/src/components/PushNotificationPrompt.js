import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { usePushNotifications } from '../hooks/usePushNotifications';

function PushNotificationPrompt() {
  const { permission, supported, requestPermission, isGranted, isDenied } = usePushNotifications();
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Show prompt after 3 seconds if permission not yet granted and not dismissed
    if (!supported || isGranted || isDenied) return;
    
    const wasDismissed = localStorage.getItem('push-prompt-dismissed');
    if (wasDismissed) return;

    const timer = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(timer);
  }, [supported, isGranted, isDenied]);

  // Auto-register if permission already granted (returning user)
  useEffect(() => {
    if (supported && isGranted) {
      requestPermission();
    }
  }, [supported, isGranted, requestPermission]);

  const handleAllow = async () => {
    await requestPermission();
    setShow(false);
  };

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    localStorage.setItem('push-prompt-dismissed', 'true');
  };

  if (!show || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-24 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:w-96 z-50"
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-orange-100 p-5 relative">
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 text-gray-400"
            data-testid="push-dismiss"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-saffron to-gold rounded-xl flex items-center justify-center flex-shrink-0">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-cinzel font-semibold text-maroon text-base">
                Stay Connected
              </h3>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                Get notified about bookings, class reminders, and spiritual updates even when the app is closed.
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleAllow}
                  className="px-4 py-2 bg-saffron text-white text-sm font-medium rounded-full hover:bg-saffron-dark transition-colors"
                  data-testid="push-allow"
                >
                  Allow Notifications
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-4 py-2 text-gray-500 text-sm hover:text-gray-700 transition-colors"
                  data-testid="push-later"
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default PushNotificationPrompt;
