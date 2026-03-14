import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import AuthScreen from './AuthScreen';
import LandingPage from './LandingPage';
import DevoteeDashboard from './dashboards/DevoteeDashboard';
import PriestDashboard from './dashboards/PriestDashboard';
import AdminDashboard from './dashboards/AdminDashboard';
import ShopOwnerDashboard from './dashboards/ShopOwnerDashboard';

// Check if mobile device
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isMobile;
};

// Splash Screen Component for Mobile
function SplashScreen({ onComplete }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div 
      className="fixed inset-0 bg-gradient-to-b from-maroon via-maroon-dark to-[#2D0A0A] flex flex-col items-center justify-center z-50"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Decorative mandala background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-gold/30 rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-gold/30 rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] border border-gold/30 rounded-full"></div>
      </div>

      {/* Logo */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10"
      >
        {/* Diya/Lamp Icon */}
        <div className="w-32 h-32 mx-auto mb-6 relative">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {/* Lamp base */}
            <ellipse cx="50" cy="85" rx="30" ry="8" fill="#B8860B" />
            <path d="M30 85 Q30 70 35 60 L65 60 Q70 70 70 85" fill="#FFD700" />
            {/* Lamp body */}
            <ellipse cx="50" cy="60" rx="18" ry="6" fill="#FFD700" />
            {/* Flame */}
            <motion.path 
              d="M50 55 Q45 40 50 25 Q55 40 50 55" 
              fill="#FF9933"
              animate={{ 
                d: [
                  "M50 55 Q45 40 50 25 Q55 40 50 55",
                  "M50 55 Q44 38 50 22 Q56 38 50 55",
                  "M50 55 Q45 40 50 25 Q55 40 50 55"
                ]
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <motion.ellipse 
              cx="50" cy="30" rx="4" ry="6" 
              fill="#FFEB3B"
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
          </svg>
          
          {/* Glow effect */}
          <motion.div 
            className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-20 bg-orange-400/30 rounded-full blur-xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>

        {/* App Name */}
        <motion.h1 
          className="font-cinzel text-4xl font-bold text-gold text-center tracking-wider"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          DIVINE
        </motion.h1>
        
        <motion.p 
          className="text-gold/60 text-center mt-2 tracking-widest text-sm"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          SPIRITUAL SERVICES
        </motion.p>
      </motion.div>

      {/* Loading indicator */}
      <motion.div 
        className="absolute bottom-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-gold rounded-full"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </motion.div>

      {/* Sanskrit text */}
      <motion.p 
        className="absolute bottom-8 text-gold/40 font-rozha text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        ॐ असतो मा सद्गमय
      </motion.p>
    </motion.div>
  );
}

// Main App Entry Point
export default function MobileApp() {
  const [showSplash, setShowSplash] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const { user, loading } = useAuth();
  const isMobile = useIsMobile();

  // Handle get started from landing page
  const handleGetStarted = (mode = 'register') => {
    setAuthMode(mode);
    setShowAuth(true);
  };

  // Mobile flow: Splash → Auth/Welcome → Dashboard
  if (isMobile) {
    if (showSplash) {
      return (
        <AnimatePresence>
          <SplashScreen onComplete={() => setShowSplash(false)} />
        </AnimatePresence>
      );
    }

    if (loading) {
      return (
        <div className="fixed inset-0 bg-cream flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-saffron border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    // Not logged in - show auth screen
    if (!user) {
      return <AuthScreen />;
    }

    // Logged in - show appropriate dashboard based on role
    return renderDashboard(user.role);
  }

  // Desktop/Web flow: Landing Page → Auth → Dashboard
  if (loading) {
    return (
      <div className="fixed inset-0 bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-saffron border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Logged in user on web - show dashboard
  if (user) {
    return renderDashboard(user.role);
  }

  // Not logged in on web
  if (showAuth) {
    return (
      <AuthScreen 
        initialMode={authMode} 
        onBack={() => setShowAuth(false)} 
        showBackButton={true}
      />
    );
  }

  // Show landing page
  return <LandingPage onGetStarted={handleGetStarted} />;
}

// Helper function to render dashboard based on role
function renderDashboard(role) {
  switch (role) {
    case 'admin':
      return <AdminDashboard />;
    case 'priest':
      return <PriestDashboard />;
    case 'shop_owner':
      return <ShopOwnerDashboard />;
    case 'astrologer':
      return <DevoteeDashboard />; // TODO: Create AstrologerDashboard
    default:
      return <DevoteeDashboard />;
  }
}
