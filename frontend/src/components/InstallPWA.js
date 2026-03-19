import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

export default function InstallPWA() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if dismissed recently
    const dismissed = localStorage.getItem('pwa_install_dismissed');
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) {
      return; // Don't show for 7 days after dismissal
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIOSDevice);

    // Show prompt for iOS after delay
    if (isIOSDevice) {
      setTimeout(() => setShowPrompt(true), 3000);
      return;
    }

    // Listen for beforeinstallprompt (Android/Chrome)
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa_install_dismissed', Date.now().toString());
  };

  if (isInstalled || !showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-slide-up">
      <div className="bg-gradient-to-r from-maroon to-saffron rounded-2xl p-4 shadow-2xl text-white max-w-md mx-auto">
        <button 
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="flex items-start gap-3">
          <div className="bg-white/20 rounded-xl p-2">
            <Smartphone className="w-8 h-8" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-bold text-lg">Install Divine App</h3>
            <p className="text-white/80 text-sm mt-1">
              Add to your home screen for quick access & offline support
            </p>
            
            {isIOS ? (
              <div className="mt-3 bg-white/10 rounded-lg p-3 text-sm">
                <p className="font-medium mb-1">How to install:</p>
                <ol className="list-decimal list-inside text-white/90 space-y-1">
                  <li>Tap the <strong>Share</strong> button below</li>
                  <li>Scroll and tap <strong>"Add to Home Screen"</strong></li>
                  <li>Tap <strong>"Add"</strong></li>
                </ol>
              </div>
            ) : (
              <button
                onClick={handleInstall}
                className="mt-3 bg-white text-maroon px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-cream transition-colors"
              >
                <Download className="w-4 h-4" />
                Install Now
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
