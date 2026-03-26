import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import AuthScreen from './AuthScreen';
import LandingPage from './LandingPage';
import DevoteeDashboard from './dashboards/DevoteeDashboard';
import AstrologerDashboard from './dashboards/AstrologerDashboard';
import PriestDashboard from './dashboards/PriestDashboard';
import AdminDashboard from './dashboards/AdminDashboard';
import ShopOwnerDashboard from './dashboards/ShopOwnerDashboard';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Loader2, User, Phone, MapPin, Calendar, Star, ChevronRight } from 'lucide-react';
import api from '../lib/api';
import { Toaster, toast } from 'sonner';

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

// Profile Completion Screen for first-time Google users
function ProfileCompletionScreen({ user, onComplete, onSkip }) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: '',
    city: '',
    pincode: '',
    date_of_birth: '',
    gotra: '',
    nakshatra: ''
  });
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);

  const handleSubmit = async () => {
    if (!formData.phone || !formData.city) {
      toast.error('Please fill in required fields');
      return;
    }
    
    setSaving(true);
    try {
      const res = await api.put('/api/users/profile', formData);
      toast.success('Profile completed successfully!');
      onComplete(res.data.user);
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-parchment flex items-center justify-center p-4">
      <Toaster position="top-center" richColors />
      
      <motion.div 
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-orange-100 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-saffron to-gold p-6 text-white text-center">
          <motion.div 
            className="w-16 h-16 bg-white/20 rounded-full mx-auto mb-3 flex items-center justify-center"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <User className="w-8 h-8" />
          </motion.div>
          <h1 className="font-cinzel text-xl font-bold">Complete Your Profile</h1>
          <p className="text-white/80 text-sm mt-1">Help us personalize your spiritual journey</p>
        </div>

        {/* Progress */}
        <div className="px-6 pt-4">
          <div className="flex gap-2 mb-6">
            <div className={`flex-1 h-1 rounded-full ${step >= 1 ? 'bg-saffron' : 'bg-gray-200'}`} />
            <div className={`flex-1 h-1 rounded-full ${step >= 2 ? 'bg-saffron' : 'bg-gray-200'}`} />
          </div>
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <motion.div 
            className="px-6 pb-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2 className="font-cinzel text-lg font-semibold text-maroon mb-4">Basic Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User className="w-4 h-4 inline mr-1" />
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-saffron focus:border-transparent"
                  placeholder="Your full name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-saffron focus:border-transparent"
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-saffron focus:border-transparent"
                    placeholder="Your city"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-saffron focus:border-transparent"
                    placeholder="XXXXXX"
                  />
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setStep(2)}
              className="w-full mt-6 py-3 bg-saffron text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-saffron-dark transition-colors"
            >
              Next <ChevronRight className="w-5 h-5" />
            </button>
            
            <button
              onClick={onSkip}
              className="w-full mt-3 py-2 text-gray-500 text-sm hover:text-gray-700"
            >
              Skip for now
            </button>
          </motion.div>
        )}

        {/* Step 2: Spiritual Info */}
        {step === 2 && (
          <motion.div 
            className="px-6 pb-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2 className="font-cinzel text-lg font-semibold text-maroon mb-4">Spiritual Details</h2>
            <p className="text-sm text-gray-500 mb-4">These help priests perform personalized poojas for you</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-saffron focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Star className="w-4 h-4 inline mr-1" />
                  Gotra
                </label>
                <input
                  type="text"
                  value={formData.gotra}
                  onChange={(e) => setFormData({ ...formData, gotra: e.target.value })}
                  className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-saffron focus:border-transparent"
                  placeholder="E.g., Bharadwaja, Kashyapa"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nakshatra</label>
                <select
                  value={formData.nakshatra}
                  onChange={(e) => setFormData({ ...formData, nakshatra: e.target.value })}
                  className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-saffron focus:border-transparent"
                >
                  <option value="">Select your Nakshatra</option>
                  <option value="Ashwini">Ashwini</option>
                  <option value="Bharani">Bharani</option>
                  <option value="Krittika">Krittika</option>
                  <option value="Rohini">Rohini</option>
                  <option value="Mrigashira">Mrigashira</option>
                  <option value="Ardra">Ardra</option>
                  <option value="Punarvasu">Punarvasu</option>
                  <option value="Pushya">Pushya</option>
                  <option value="Ashlesha">Ashlesha</option>
                  <option value="Magha">Magha</option>
                  <option value="Purva Phalguni">Purva Phalguni</option>
                  <option value="Uttara Phalguni">Uttara Phalguni</option>
                  <option value="Hasta">Hasta</option>
                  <option value="Chitra">Chitra</option>
                  <option value="Swati">Swati</option>
                  <option value="Vishakha">Vishakha</option>
                  <option value="Anuradha">Anuradha</option>
                  <option value="Jyeshtha">Jyeshtha</option>
                  <option value="Mula">Mula</option>
                  <option value="Purva Ashadha">Purva Ashadha</option>
                  <option value="Uttara Ashadha">Uttara Ashadha</option>
                  <option value="Shravana">Shravana</option>
                  <option value="Dhanishta">Dhanishta</option>
                  <option value="Shatabhisha">Shatabhisha</option>
                  <option value="Purva Bhadrapada">Purva Bhadrapada</option>
                  <option value="Uttara Bhadrapada">Uttara Bhadrapada</option>
                  <option value="Revati">Revati</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 py-3 bg-saffron text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-saffron-dark transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Complete'}
              </button>
            </div>
            
            <button
              onClick={onSkip}
              className="w-full mt-3 py-2 text-gray-500 text-sm hover:text-gray-700"
            >
              Skip for now
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

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
  // Check URL params on initial load to set initial state
  const getInitialPaymentState = () => {
    if (typeof window === 'undefined') return { showDashboard: false, paymentRedirect: false };
    const path = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    const paymentParam = searchParams.get('payment');
    const sessionId = searchParams.get('session_id');
    
    const isPaymentRedirect = path === '/payment/success' || 
                              path === '/payment/cancel' || 
                              sessionId || 
                              paymentParam === 'success' || 
                              paymentParam === 'cancelled';
    
    return {
      showDashboard: isPaymentRedirect,
      paymentRedirect: isPaymentRedirect
    };
  };

  const initialState = getInitialPaymentState();
  
  const [showSplash, setShowSplash] = useState(false); // Disabled splash screen
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [showDashboard, setShowDashboard] = useState(initialState.showDashboard);
  const [paymentRedirect, setPaymentRedirect] = useState(initialState.paymentRedirect);
  const { user, loading, updateUser } = useAuth();
  const isMobile = useIsMobile();

  // Memoize the user role to prevent unnecessary re-renders
  const userRole = useMemo(() => user?.role, [user?.role]);
  const isLoggedIn = useMemo(() => !!user, [!!user]);

  // Handle payment redirect - check if coming from Stripe payment
  useEffect(() => {
    const path = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    
    // Check for payment success redirect (multiple formats)
    const paymentParam = searchParams.get('payment');
    const sessionId = searchParams.get('session_id');
    const orderId = searchParams.get('order_id');
    
    // Check if user has a token (even if auth context hasn't loaded yet)
    const hasToken = localStorage.getItem('divine_token');
    
    if (path === '/payment/success' || sessionId || paymentParam === 'success') {
      // User is returning from Stripe payment - mark for redirect
      setPaymentRedirect(true);
      setShowDashboard(true);
      
      // If user has a token, they should see dashboard
      // If not, they'll need to log in first
      if (hasToken) {
        toast.success('Payment successful! Your order has been confirmed.', {
          duration: 5000,
        });
      } else {
        toast.info('Payment successful! Please log in to view your order.', {
          duration: 5000,
        });
      }
      // Clear the URL parameters but keep on main page
      window.history.replaceState({}, document.title, '/');
    } else if (path === '/payment/cancel' || paymentParam === 'cancelled') {
      // User cancelled payment - mark for redirect
      setPaymentRedirect(true);
      setShowDashboard(true);
      toast.error('Payment was cancelled. Your cart items are still saved.', {
        duration: 5000,
      });
      // Clear the URL
      window.history.replaceState({}, document.title, '/');
    }
  }, []);

  // Auto-show dashboard when user is logged in and returning from payment
  useEffect(() => {
    if (!loading && isLoggedIn && paymentRedirect) {
      setShowDashboard(true);
    }
  }, [loading, isLoggedIn, paymentRedirect]);

  // Handle get started from landing page
  const handleGetStarted = (mode = 'register') => {
    setAuthMode(mode);
    setShowAuth(true);
    setShowDashboard(true); // User wants to access dashboard after login
  };

  // Handle going back to landing page
  const handleBackToLanding = () => {
    setShowAuth(false);
    setShowDashboard(false);
  };

  // Memoize dashboard component based on role
  const DashboardComponent = useMemo(() => {
    switch (userRole) {
      case 'admin':
      case 'super_admin':
        return AdminDashboard;
      case 'priest':
        return PriestDashboard;
      case 'shop_owner':
        return ShopOwnerDashboard;
      case 'astrologer':
        return AstrologerDashboard;
      default:
        return DevoteeDashboard;
    }
  }, [userRole]);

  // Determine what to render
  const renderContent = () => {
    // Mobile flow: Splash → Auth/Welcome → Dashboard
    if (isMobile) {
      if (showSplash) {
        return <SplashScreen key="splash" onComplete={() => setShowSplash(false)} />;
      }

      if (loading && !isLoggedIn) {
        return (
          <div key="loading" className="fixed inset-0 bg-cream flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-saffron border-t-transparent rounded-full animate-spin" />
          </div>
        );
      }

      if (!isLoggedIn) {
        return <AuthScreen key="auth" />;
      }

      return (
        <ErrorBoundary key={`eb-${userRole}`}>
          <DashboardComponent key={`dashboard-${userRole}`} />
        </ErrorBoundary>
      );
    }

    // Desktop/Web flow - Always show landing page first unless user explicitly wants dashboard
    if (loading) {
      return (
        <div key="loading" className="fixed inset-0 bg-cream flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-saffron border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    // IMPORTANT: Check if user is logged in AND wants dashboard FIRST
    // This ensures navigation to dashboard after successful login
    if (isLoggedIn && showDashboard && DashboardComponent) {
      return (
        <ErrorBoundary key={`eb-${userRole}`}>
          <DashboardComponent key={`dashboard-${userRole}`} />
        </ErrorBoundary>
      );
    }

    // If returning from payment but not logged in, show auth screen
    if (paymentRedirect && !isLoggedIn) {
      return (
        <AuthScreen 
          key="auth"
          initialMode="login" 
          onBack={handleBackToLanding} 
          showBackButton={true}
        />
      );
    }

    // Show auth screen if user clicked login/register (and not yet logged in)
    if (showAuth && !isLoggedIn) {
      return (
        <AuthScreen 
          key="auth"
          initialMode={authMode} 
          onBack={handleBackToLanding} 
          showBackButton={true}
        />
      );
    }

    // Default: Show landing page
    return <LandingPage key="landing" onGetStarted={handleGetStarted} />;
  };

  return (
    <div className="min-h-screen">
      {renderContent()}
    </div>
  );
}
