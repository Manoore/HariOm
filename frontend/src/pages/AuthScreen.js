import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Phone, Eye, EyeOff, ArrowRight, Loader2, ChevronLeft, Bell, Sparkles, Building2, ShoppingCart, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Toaster, toast } from 'sonner';
import { isFirebaseConfigured } from '../lib/firebase';
import api from '../lib/api';

// Popular country codes for phone auth
const COUNTRY_CODES = [
  { code: '+91', country: 'India', flag: '🇮🇳', maxLength: 10 },
  { code: '+1', country: 'USA/Canada', flag: '🇺🇸', maxLength: 10 },
  { code: '+44', country: 'UK', flag: '🇬🇧', maxLength: 10 },
  { code: '+61', country: 'Australia', flag: '🇦🇺', maxLength: 9 },
  { code: '+971', country: 'UAE', flag: '🇦🇪', maxLength: 9 },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦', maxLength: 9 },
  { code: '+65', country: 'Singapore', flag: '🇸🇬', maxLength: 8 },
  { code: '+60', country: 'Malaysia', flag: '🇲🇾', maxLength: 10 },
  { code: '+977', country: 'Nepal', flag: '🇳🇵', maxLength: 10 },
  { code: '+94', country: 'Sri Lanka', flag: '🇱🇰', maxLength: 9 },
  { code: '+880', country: 'Bangladesh', flag: '🇧🇩', maxLength: 10 },
  { code: '+92', country: 'Pakistan', flag: '🇵🇰', maxLength: 10 },
  { code: '+63', country: 'Philippines', flag: '🇵🇭', maxLength: 10 },
  { code: '+49', country: 'Germany', flag: '🇩🇪', maxLength: 11 },
  { code: '+33', country: 'France', flag: '🇫🇷', maxLength: 9 },
  { code: '+81', country: 'Japan', flag: '🇯🇵', maxLength: 10 },
  { code: '+82', country: 'South Korea', flag: '🇰🇷', maxLength: 10 },
  { code: '+86', country: 'China', flag: '🇨🇳', maxLength: 11 },
  { code: '+27', country: 'South Africa', flag: '🇿🇦', maxLength: 9 },
  { code: '+234', country: 'Nigeria', flag: '🇳🇬', maxLength: 10 },
  { code: '+254', country: 'Kenya', flag: '🇰🇪', maxLength: 9 },
];

// Splash Screen Component
const SplashScreen = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: 'linear-gradient(160deg, #FFF8E7 0%, #FFF1D6 30%, #FFE4B5 70%, #FFDAB0 100%)' }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Floating particles */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 6 + 3,
            height: Math.random() * 6 + 3,
            background: `rgba(255, ${180 + Math.random() * 55}, 0, ${0.15 + Math.random() * 0.2})`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.6, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}

      {/* Glowing ring */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 180,
          height: 180,
          border: '2px solid rgba(255, 165, 0, 0.15)',
          boxShadow: '0 0 40px rgba(255, 165, 0, 0.1)',
        }}
        animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.1, 0.3] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      />

      {/* Om Logo */}
      <motion.div
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, type: 'spring', bounce: 0.4 }}
        className="relative"
      >
        <motion.div
          className="w-28 h-28 rounded-2xl overflow-hidden shadow-2xl"
          style={{ boxShadow: '0 20px 60px rgba(139, 69, 19, 0.3)' }}
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <img src="/temple-logo.png" alt="Divine" className="w-full h-full object-cover" />
        </motion.div>
      </motion.div>

      {/* App Name */}
      <motion.h1
        className="font-cinzel text-4xl font-bold mt-6"
        style={{ color: '#5B1A1A' }}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        DIVINE
      </motion.h1>

      <motion.p
        className="text-sm mt-1"
        style={{ color: '#A0522D' }}
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        Spiritual Services
      </motion.p>

      {/* Loading dots */}
      <motion.div
        className="flex gap-2 mt-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full"
            style={{ background: '#CD853F' }}
            animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
};

// Enhanced Animated Devotional Icons
const BellIcon3D = () => (
  <motion.svg viewBox="0 0 100 100" className="w-12 h-12" animate={{ rotate: [-5, 5, -5] }} transition={{ duration: 0.5, repeat: Infinity }}>
    <defs>
      <linearGradient id="bellGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFD700" />
        <stop offset="50%" stopColor="#FFA500" />
        <stop offset="100%" stopColor="#CD853F" />
      </linearGradient>
      <radialGradient id="bellShine" cx="35%" cy="30%">
        <stop offset="0%" stopColor="#FFFACD" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
      </radialGradient>
      <filter id="bellGlow">
        <feGaussianBlur stdDeviation="2" result="glow" />
        <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
    <ellipse cx="50" cy="12" rx="4" ry="4" fill="#B8860B" />
    <line x1="50" y1="16" x2="50" y2="22" stroke="#B8860B" strokeWidth="3" />
    <path d="M42 22 L42 30 Q28 38 26 58 L74 58 Q72 38 58 30 L58 22" fill="url(#bellGrad)" filter="url(#bellGlow)" />
    <path d="M42 22 L42 30 Q28 38 26 58 L74 58 Q72 38 58 30 L58 22" fill="url(#bellShine)" />
    <ellipse cx="50" cy="58" rx="26" ry="6" fill="#CD853F" />
    <ellipse cx="50" cy="58" rx="26" ry="6" fill="url(#bellShine)" opacity="0.3" />
    <circle cx="50" cy="68" r="5" fill="#B8860B" />
    <circle cx="50" cy="67" r="2" fill="#FFD700" opacity="0.6" />
    {/* Sound waves */}
    <path d="M18 45 Q14 50 18 55" stroke="#FFD700" strokeWidth="1.5" fill="none" opacity="0.5" />
    <path d="M82 45 Q86 50 82 55" stroke="#FFD700" strokeWidth="1.5" fill="none" opacity="0.5" />
  </motion.svg>
);

const ZodiacIcon3D = () => (
  <motion.svg viewBox="0 0 100 100" className="w-12 h-12">
    <defs>
      <linearGradient id="zodiacGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1a0533" />
        <stop offset="50%" stopColor="#4B0082" />
        <stop offset="100%" stopColor="#7B2FBE" />
      </linearGradient>
      <radialGradient id="starGlow" cx="50%" cy="50%">
        <stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
        <stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
      </radialGradient>
      <filter id="zodiacGlow">
        <feGaussianBlur stdDeviation="1.5" result="glow" />
        <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
    <circle cx="50" cy="50" r="40" fill="url(#zodiacGrad)" />
    <motion.circle cx="50" cy="50" r="35" fill="none" stroke="#FFD700" strokeWidth="1" strokeDasharray="6 4" animate={{ rotate: [0, 360] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: '50px 50px' }} />
    <motion.circle cx="50" cy="50" r="25" fill="none" stroke="#9370DB" strokeWidth="0.8" strokeDasharray="3 5" animate={{ rotate: [360, 0] }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: '50px 50px' }} />
    {/* Stars */}
    <circle cx="50" cy="15" r="3.5" fill="#FFD700" filter="url(#zodiacGlow)" />
    <circle cx="85" cy="50" r="3.5" fill="#FFA500" filter="url(#zodiacGlow)" />
    <circle cx="50" cy="85" r="3.5" fill="#FFD700" filter="url(#zodiacGlow)" />
    <circle cx="15" cy="50" r="3.5" fill="#FFA500" filter="url(#zodiacGlow)" />
    {/* Center sun */}
    <circle cx="50" cy="50" r="8" fill="url(#starGlow)" />
    <circle cx="50" cy="50" r="5" fill="#FFD700" />
    <circle cx="48" cy="48" r="2" fill="#FFFACD" opacity="0.7" />
  </motion.svg>
);

const TempleIcon3D = () => (
  <motion.svg viewBox="0 0 100 100" className="w-12 h-12" animate={{ scale: [1, 1.03, 1] }} transition={{ duration: 3, repeat: Infinity }}>
    <defs>
      <linearGradient id="templeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F4E4C1" />
        <stop offset="100%" stopColor="#CD853F" />
      </linearGradient>
      <linearGradient id="roofGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFD700" />
        <stop offset="50%" stopColor="#FFA500" />
        <stop offset="100%" stopColor="#B8860B" />
      </linearGradient>
      <linearGradient id="pillarGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#DEB887" />
        <stop offset="50%" stopColor="#F5DEB3" />
        <stop offset="100%" stopColor="#DEB887" />
      </linearGradient>
      <filter id="templeGlow">
        <feGaussianBlur stdDeviation="1.5" result="glow" />
        <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
    {/* Base */}
    <rect x="15" y="80" width="70" height="8" rx="2" fill="#A0522D" />
    {/* Main body */}
    <rect x="22" y="55" width="56" height="25" fill="url(#templeGrad)" />
    {/* Pillars */}
    <rect x="26" y="55" width="6" height="25" fill="url(#pillarGrad)" />
    <rect x="68" y="55" width="6" height="25" fill="url(#pillarGrad)" />
    {/* Middle tier */}
    <rect x="28" y="42" width="44" height="13" fill="url(#templeGrad)" />
    <path d="M26 42 L74 42 L72 55 L28 55 Z" fill="url(#roofGrad)" opacity="0.5" />
    {/* Main roof/dome */}
    <polygon points="50,8 76,42 24,42" fill="url(#roofGrad)" />
    {/* Kalash on top */}
    <motion.g animate={{ y: [0, -2, 0] }} transition={{ duration: 2, repeat: Infinity }}>
      <circle cx="50" cy="12" r="5" fill="#FFD700" filter="url(#templeGlow)" />
      <path d="M47 12 L50 6 L53 12" fill="#FFD700" />
    </motion.g>
    {/* Door */}
    <path d="M42 80 L42 62 Q50 56 58 62 L58 80 Z" fill="#4A2810" />
    <circle cx="55" cy="72" r="1.5" fill="#FFD700" />
    {/* Window details */}
    <circle cx="35" cy="48" r="3" fill="#4A2810" opacity="0.5" />
    <circle cx="65" cy="48" r="3" fill="#4A2810" opacity="0.5" />
  </motion.svg>
);

const CartIcon3D = () => (
  <motion.svg viewBox="0 0 100 100" className="w-12 h-12" animate={{ y: [0, -4, 0] }} transition={{ duration: 2.5, repeat: Infinity }}>
    <defs>
      <linearGradient id="basketGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#DEB887" />
        <stop offset="50%" stopColor="#CD853F" />
        <stop offset="100%" stopColor="#8B4513" />
      </linearGradient>
      <linearGradient id="flowerGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF6B6B" />
        <stop offset="100%" stopColor="#FF4444" />
      </linearGradient>
      <linearGradient id="flowerGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFB347" />
        <stop offset="100%" stopColor="#FF8C00" />
      </linearGradient>
      <filter id="basketGlow">
        <feGaussianBlur stdDeviation="1" result="glow" />
        <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
    {/* Basket body */}
    <path d="M22 40 L30 78 Q50 82 70 78 L78 40 Z" fill="url(#basketGrad)" />
    {/* Basket weave pattern */}
    <path d="M26 48 L74 48 M28 56 L72 56 M30 64 L70 64 M32 72 L68 72" stroke="#A0522D" strokeWidth="1.5" fill="none" opacity="0.4" />
    <path d="M38 40 L36 78 M50 40 L50 80 M62 40 L64 78" stroke="#A0522D" strokeWidth="1" fill="none" opacity="0.3" />
    {/* Handle */}
    <path d="M32 40 Q50 24 68 40" stroke="#8B4513" strokeWidth="3" fill="none" />
    {/* Flowers and items */}
    <motion.g animate={{ rotate: [-3, 3, -3] }} transition={{ duration: 2, repeat: Infinity }} style={{ transformOrigin: '35px 32px' }}>
      <circle cx="35" cy="32" r="7" fill="url(#flowerGrad1)" filter="url(#basketGlow)" />
      <circle cx="35" cy="32" r="3" fill="#FFD700" />
    </motion.g>
    <motion.g animate={{ rotate: [3, -3, 3] }} transition={{ duration: 2.5, repeat: Infinity }} style={{ transformOrigin: '52px 28px' }}>
      <circle cx="52" cy="28" r="6" fill="url(#flowerGrad2)" filter="url(#basketGlow)" />
      <circle cx="52" cy="28" r="2.5" fill="#FFD700" />
    </motion.g>
    <circle cx="66" cy="33" r="5" fill="#32CD32" opacity="0.8" />
    <path d="M64 30 Q66 24 68 30" stroke="#228B22" strokeWidth="1.5" fill="none" />
    {/* Incense stick */}
    <line x1="42" y1="36" x2="42" y2="18" stroke="#CD853F" strokeWidth="1.5" />
    <motion.circle cx="42" cy="16" r="2" fill="#FF6347" opacity="0.6" animate={{ opacity: [0.3, 0.8, 0.3], scale: [0.8, 1.2, 0.8] }} transition={{ duration: 1.5, repeat: Infinity }} />
  </motion.svg>
);

export default function AuthScreen({ initialMode = 'welcome', onBack, showBackButton = false }) {
  const [showSplash, setShowSplash] = useState(initialMode === 'welcome');
  const [mode, setMode] = useState(initialMode === 'login' ? 'login' : initialMode === 'register' ? 'register' : 'welcome');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login, register, loginWithGoogle, forgotPassword, initPhoneAuth, sendOTP, verifyOTPAndSignIn } = useAuth();

  const [loginData, setLoginData] = useState({ email: '', password: '', phone: '' });
  const [registerData, setRegisterData] = useState({
    name: '', email: '', phone: '', password: '', role: 'devotee'
  });
  
  // Signup settings from admin
  const [signupSettings, setSignupSettings] = useState({
    enable_priest_signup: true,
    enable_astrologer_signup: false,
    enable_shop_owner_signup: false
  });
  
  // Fetch signup settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/api/admin/signup-settings');
        if (res.data.settings) {
          setSignupSettings(res.data.settings);
        }
      } catch (error) {
        console.log('Using default signup settings');
      }
    };
    fetchSettings();
  }, []);
  
  // Phone auth states
  const [authMethod, setAuthMethod] = useState('email'); // 'email' or 'phone'
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  
  // Country code state
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]); // Default to India
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      toast.error('Please enter your email');
      return;
    }
    setForgotLoading(true);
    try {
      await forgotPassword(forgotEmail);
      toast.success('Password reset email sent! Check your inbox.');
      setShowForgotPassword(false);
      setForgotEmail('');
    } catch (error) {
      const errorMessage = error.code === 'auth/user-not-found'
        ? 'No account found with this email'
        : error.message || 'Failed to send reset email';
      toast.error(errorMessage);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(loginData.email, loginData.password);
      toast.success('Welcome back!');
    } catch (error) {
      const errorMessage = error.code === 'auth/invalid-credential' 
        ? 'Invalid email or password'
        : error.response?.data?.detail || error.message || 'Login failed';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(registerData);
      toast.success('Account created!');
    } catch (error) {
      const errorMessage = error.code === 'auth/email-already-in-use'
        ? 'Email already registered. Please login instead.'
        : error.response?.data?.detail || error.message || 'Registration failed';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async (selectedRole = null) => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle(selectedRole);
      toast.success('Welcome!');
    } catch (error) {
      if (error.code !== 'auth/popup-closed-by-user') {
        toast.error('Google sign-in failed. Please try again.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  // Phone authentication handlers
  const handleSendOTP = async (phoneNumber, isRegister = false) => {
    setOtpLoading(true);
    try {
      // Prepend country code to phone number
      const fullPhoneNumber = `${selectedCountry.code}${phoneNumber}`;
      await sendOTP(fullPhoneNumber);
      setOtpSent(true);
      toast.success(`OTP sent to ${selectedCountry.code} ${phoneNumber}!`);
    } catch (error) {
      console.error('Error sending OTP:', error);
      let errorMessage = 'Failed to send OTP. Please try again.';
      
      if (error.code === 'auth/invalid-phone-number') {
        errorMessage = 'Invalid phone number. Please check and try again.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many attempts. Please wait a few minutes before trying again.';
      } else if (error.code === 'auth/quota-exceeded') {
        errorMessage = 'SMS quota exceeded. Please try again later.';
      } else if (error.code === 'auth/captcha-check-failed') {
        errorMessage = 'reCAPTCHA verification failed. Please refresh the page and try again.';
      } else if (error.code === 'auth/missing-phone-number') {
        errorMessage = 'Please enter a valid phone number.';
      } else if (error.message && error.message.includes('reCAPTCHA')) {
        errorMessage = 'reCAPTCHA error. Please refresh the page and try again.';
      }
      
      toast.error(errorMessage);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async (userData = {}) => {
    setOtpLoading(true);
    try {
      await verifyOTPAndSignIn(otp, userData);
      toast.success('Phone verified successfully!');
    } catch (error) {
      console.error('OTP verification error:', error);
      let errorMessage = 'Invalid OTP. Please try again.';
      
      if (error.code === 'auth/invalid-verification-code') {
        errorMessage = 'Invalid OTP. Please check and try again.';
      } else if (error.code === 'auth/code-expired') {
        errorMessage = 'OTP expired. Please request a new one.';
      }
      
      toast.error(errorMessage);
    } finally {
      setOtpLoading(false);
    }
  };

  const resetPhoneAuth = () => {
    setOtpSent(false);
    setOtp('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-parchment flex items-center justify-center relative overflow-hidden">
      <Toaster position="top-center" richColors />
      
      {/* Splash Screen */}
      <AnimatePresence>
        {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      </AnimatePresence>
      
      {/* Hidden reCAPTCHA container */}
      <div id="recaptcha-container"></div>
      
      {/* Falling Rose Petals - Soft Pink - LEFT SIDE ONLY - Hidden on mobile */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`rose-left-${i}`}
          className="absolute pointer-events-none z-0 hidden md:block"
          initial={{ 
            top: -30, 
            left: `${2 + Math.random() * 20}%`,
            rotate: Math.random() * 360,
          }}
          animate={{ 
            top: '110%',
            rotate: [0, 180, 360, 540],
            x: [0, Math.sin(i) * 40, Math.cos(i) * -30, 0],
          }}
          transition={{ 
            duration: 10 + Math.random() * 5,
            repeat: Infinity,
            delay: i * 1.2,
            ease: "linear"
          }}
        >
          <svg viewBox="0 0 30 35" className="w-7 h-8" style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.15))' }}>
            <defs>
              <linearGradient id={`roseGradL${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFB6C1" />
                <stop offset="50%" stopColor="#FF69B4" />
                <stop offset="100%" stopColor="#DB7093" />
              </linearGradient>
            </defs>
            <path d="M15 2 Q22 8 20 18 Q18 28 15 32 Q12 28 10 18 Q8 8 15 2" fill={`url(#roseGradL${i})`} opacity="0.7" />
          </svg>
        </motion.div>
      ))}
      
      {/* Falling Rose Petals - RIGHT SIDE ONLY - Hidden on mobile */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`rose-right-${i}`}
          className="absolute pointer-events-none z-0 hidden md:block"
          initial={{ 
            top: -30, 
            left: `${78 + Math.random() * 20}%`,
            rotate: Math.random() * 360,
          }}
          animate={{ 
            top: '110%',
            rotate: [0, 180, 360, 540],
            x: [0, Math.sin(i) * -40, Math.cos(i) * 30, 0],
          }}
          transition={{ 
            duration: 10 + Math.random() * 5,
            repeat: Infinity,
            delay: i * 1.2 + 0.5,
            ease: "linear"
          }}
        >
          <svg viewBox="0 0 30 35" className="w-7 h-8" style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.15))' }}>
            <defs>
              <linearGradient id={`roseGradR${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFB6C1" />
                <stop offset="50%" stopColor="#FF69B4" />
                <stop offset="100%" stopColor="#DB7093" />
              </linearGradient>
            </defs>
            <path d="M15 2 Q22 8 20 18 Q18 28 15 32 Q12 28 10 18 Q8 8 15 2" fill={`url(#roseGradR${i})`} opacity="0.7" />
          </svg>
        </motion.div>
      ))}
      
      {/* Falling Marigold Flowers - LEFT SIDE - Hidden on mobile */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={`marigold-left-${i}`}
          className="absolute pointer-events-none z-0 hidden md:block"
          initial={{ 
            top: -40, 
            left: `${3 + Math.random() * 18}%`,
            rotate: 0,
            scale: 0.8 + Math.random() * 0.4,
          }}
          animate={{ 
            top: '115%',
            rotate: [0, 120, 240, 360],
            x: [0, 40, -20, 0],
          }}
          transition={{ 
            duration: 14 + Math.random() * 6,
            repeat: Infinity,
            delay: i * 2 + 2,
            ease: "linear"
          }}
        >
          <svg viewBox="0 0 50 50" className="w-10 h-10" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>
            <defs>
              <radialGradient id={`marigoldGradL${i}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FF8C00" />
                <stop offset="100%" stopColor="#FF6600" />
              </radialGradient>
            </defs>
            {[...Array(12)].map((_, j) => (
              <ellipse 
                key={`outer-${j}`}
                cx="25" cy="8" rx="5" ry="10" 
                fill={j % 2 === 0 ? '#FFD700' : '#FFA500'}
                transform={`rotate(${j * 30} 25 25)`}
                opacity="0.85"
              />
            ))}
            {[...Array(8)].map((_, j) => (
              <ellipse 
                key={`inner-${j}`}
                cx="25" cy="14" rx="3" ry="6" 
                fill={j % 2 === 0 ? '#FF8C00' : '#FFD700'}
                transform={`rotate(${j * 45 + 22.5} 25 25)`}
                opacity="0.9"
              />
            ))}
            <circle cx="25" cy="25" r="6" fill={`url(#marigoldGradL${i})`} />
          </svg>
        </motion.div>
      ))}
      
      {/* Falling Marigold Flowers - RIGHT SIDE - Hidden on mobile */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={`marigold-right-${i}`}
          className="absolute pointer-events-none z-0 hidden md:block"
          initial={{ 
            top: -40, 
            left: `${79 + Math.random() * 18}%`,
            rotate: 0,
            scale: 0.8 + Math.random() * 0.4,
          }}
          animate={{ 
            top: '115%',
            rotate: [0, 120, 240, 360],
            x: [0, -40, 20, 0],
          }}
          transition={{ 
            duration: 14 + Math.random() * 6,
            repeat: Infinity,
            delay: i * 2 + 3,
            ease: "linear"
          }}
        >
          <svg viewBox="0 0 50 50" className="w-10 h-10" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>
            <defs>
              <radialGradient id={`marigoldGradR${i}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FF8C00" />
                <stop offset="100%" stopColor="#FF6600" />
              </radialGradient>
            </defs>
            {[...Array(12)].map((_, j) => (
              <ellipse 
                key={`outer-${j}`}
                cx="25" cy="8" rx="5" ry="10" 
                fill={j % 2 === 0 ? '#FFD700' : '#FFA500'}
                transform={`rotate(${j * 30} 25 25)`}
                opacity="0.85"
              />
            ))}
            {[...Array(8)].map((_, j) => (
              <ellipse 
                key={`inner-${j}`}
                cx="25" cy="14" rx="3" ry="6" 
                fill={j % 2 === 0 ? '#FF8C00' : '#FFD700'}
                transform={`rotate(${j * 45 + 22.5} 25 25)`}
                opacity="0.9"
              />
            ))}
            <circle cx="25" cy="25" r="6" fill={`url(#marigoldGradR${i})`} />
          </svg>
        </motion.div>
      ))}
      
      {/* Falling Jasmine Flowers - LEFT SIDE - Hidden on mobile */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`jasmine-left-${i}`}
          className="absolute pointer-events-none z-0 hidden md:block"
          initial={{ 
            top: -25, 
            left: `${5 + Math.random() * 18}%`,
            rotate: Math.random() * 180,
          }}
          animate={{ 
            top: '112%',
            rotate: [0, 90, 180, 270, 360],
            x: [0, 30, -20, 0],
          }}
          transition={{ 
            duration: 11 + Math.random() * 4,
            repeat: Infinity,
            delay: i * 1.5 + 1,
            ease: "linear"
          }}
        >
          <svg viewBox="0 0 30 30" className="w-6 h-6" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' }}>
            {[...Array(5)].map((_, j) => (
              <ellipse 
                key={j}
                cx="15" cy="7" rx="4" ry="7" 
                fill="white"
                stroke="#F5F5DC"
                strokeWidth="0.5"
                transform={`rotate(${j * 72} 15 15)`}
                opacity="0.85"
              />
            ))}
            <circle cx="15" cy="15" r="3" fill="#FFFACD" />
            <circle cx="15" cy="15" r="1.5" fill="#FFD700" />
          </svg>
        </motion.div>
      ))}
      
      {/* Falling Jasmine Flowers - RIGHT SIDE - Hidden on mobile */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`jasmine-right-${i}`}
          className="absolute pointer-events-none z-0 hidden md:block"
          initial={{ 
            top: -25, 
            left: `${77 + Math.random() * 18}%`,
            rotate: Math.random() * 180,
          }}
          animate={{ 
            top: '112%',
            rotate: [0, 90, 180, 270, 360],
            x: [0, -30, 20, 0],
          }}
          transition={{ 
            duration: 11 + Math.random() * 4,
            repeat: Infinity,
            delay: i * 1.5 + 1.5,
            ease: "linear"
          }}
        >
          <svg viewBox="0 0 30 30" className="w-6 h-6" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' }}>
            {[...Array(5)].map((_, j) => (
              <ellipse 
                key={j}
                cx="15" cy="7" rx="4" ry="7" 
                fill="white"
                stroke="#F5F5DC"
                strokeWidth="0.5"
                transform={`rotate(${j * 72} 15 15)`}
                opacity="0.85"
              />
            ))}
            <circle cx="15" cy="15" r="3" fill="#FFFACD" />
            <circle cx="15" cy="15" r="1.5" fill="#FFD700" />
          </svg>
        </motion.div>
      ))}
      
      {/* Falling Hibiscus Petals - LEFT SIDE - Hidden on mobile */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={`hibiscus-left-${i}`}
          className="absolute pointer-events-none z-0 hidden md:block"
          initial={{ 
            top: -35, 
            left: `${4 + Math.random() * 16}%`,
            rotate: Math.random() * 90,
          }}
          animate={{ 
            top: '118%',
            rotate: [0, -180, -360],
            x: [0, 50, 0],
          }}
          transition={{ 
            duration: 13 + Math.random() * 5,
            repeat: Infinity,
            delay: i * 2.5 + 3,
            ease: "linear"
          }}
        >
          <svg viewBox="0 0 35 40" className="w-8 h-9" style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.15))' }}>
            <defs>
              <linearGradient id={`hibiscusGradL${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF4444" />
                <stop offset="50%" stopColor="#DC143C" />
                <stop offset="100%" stopColor="#8B0000" />
              </linearGradient>
            </defs>
            <path d="M17.5 3 Q25 10 23 22 Q20 35 17.5 38 Q15 35 12 22 Q10 10 17.5 3" fill={`url(#hibiscusGradL${i})`} opacity="0.75" />
          </svg>
        </motion.div>
      ))}
      
      {/* Falling Hibiscus Petals - RIGHT SIDE - Hidden on mobile */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={`hibiscus-right-${i}`}
          className="absolute pointer-events-none z-0 hidden md:block"
          initial={{ 
            top: -35, 
            left: `${80 + Math.random() * 16}%`,
            rotate: Math.random() * 90,
          }}
          animate={{ 
            top: '118%',
            rotate: [0, 180, 360],
            x: [0, -50, 0],
          }}
          transition={{ 
            duration: 13 + Math.random() * 5,
            repeat: Infinity,
            delay: i * 2.5 + 4,
            ease: "linear"
          }}
        >
          <svg viewBox="0 0 35 40" className="w-8 h-9" style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.15))' }}>
            <defs>
              <linearGradient id={`hibiscusGradR${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF4444" />
                <stop offset="50%" stopColor="#DC143C" />
                <stop offset="100%" stopColor="#8B0000" />
              </linearGradient>
            </defs>
            <path d="M17.5 3 Q25 10 23 22 Q20 35 17.5 38 Q15 35 12 22 Q10 10 17.5 3" fill={`url(#hibiscusGradR${i})`} opacity="0.75" />
          </svg>
        </motion.div>
      ))}
      
      {/* Floating Devotional Icons - Scattered across screen */}
      
      {/* Om Symbol - Top Left */}
      <motion.div 
        className="absolute top-20 left-16 text-saffron/30"
        animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg viewBox="0 0 100 100" className="w-32 h-32">
          <text x="50" y="75" textAnchor="middle" fontSize="70" fill="currentColor" fontFamily="serif">ॐ</text>
        </svg>
      </motion.div>
      
      {/* Om Symbol - Bottom Right */}
      <motion.div 
        className="absolute bottom-24 right-20 text-maroon/20"
        animate={{ y: [0, 12, 0], rotate: [0, -3, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        <svg viewBox="0 0 100 100" className="w-28 h-28">
          <text x="50" y="75" textAnchor="middle" fontSize="70" fill="currentColor" fontFamily="serif">ॐ</text>
        </svg>
      </motion.div>
      
      {/* Diya - Top Right */}
      <motion.div
        className="absolute top-32 right-24"
        animate={{ y: [0, -10, 0], x: [0, 5, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg viewBox="0 0 100 120" className="w-24 h-28 opacity-40">
          <defs>
            <linearGradient id="diyaGradFloat" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#CD853F" />
              <stop offset="100%" stopColor="#8B4513" />
            </linearGradient>
            <linearGradient id="flameGradFloat" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#FF6600" />
              <stop offset="50%" stopColor="#FFD700" />
              <stop offset="100%" stopColor="#FFFF00" />
            </linearGradient>
          </defs>
          <motion.ellipse 
            cx="50" cy="30" rx="10" ry="25" 
            fill="url(#flameGradFloat)"
            animate={{ scaleY: [1, 1.15, 0.9, 1], scaleX: [1, 0.85, 1.1, 1] }}
            transition={{ duration: 0.6, repeat: Infinity }}
          />
          <ellipse cx="50" cy="70" rx="30" ry="10" fill="url(#diyaGradFloat)" />
          <path d="M20 70 Q20 95 50 100 Q80 95 80 70" fill="url(#diyaGradFloat)" />
        </svg>
      </motion.div>
      
      {/* Diya - Bottom Left */}
      <motion.div
        className="absolute bottom-32 left-20"
        animate={{ y: [0, 8, 0], x: [0, -5, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      >
        <svg viewBox="0 0 100 120" className="w-20 h-24 opacity-35">
          <defs>
            <linearGradient id="diyaGradFloat2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#CD853F" />
              <stop offset="100%" stopColor="#8B4513" />
            </linearGradient>
            <linearGradient id="flameGradFloat2" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#FF6600" />
              <stop offset="50%" stopColor="#FFD700" />
              <stop offset="100%" stopColor="#FFFF00" />
            </linearGradient>
          </defs>
          <motion.ellipse 
            cx="50" cy="30" rx="10" ry="25" 
            fill="url(#flameGradFloat2)"
            animate={{ scaleY: [1, 1.1, 0.95, 1], scaleX: [1, 0.9, 1.05, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
          <ellipse cx="50" cy="70" rx="30" ry="10" fill="url(#diyaGradFloat2)" />
          <path d="M20 70 Q20 95 50 100 Q80 95 80 70" fill="url(#diyaGradFloat2)" />
        </svg>
      </motion.div>
      
      {/* Temple Bell - Left Center */}
      <motion.div
        className="absolute left-12 top-1/2 -translate-y-1/2"
        animate={{ rotate: [-8, 8, -8], y: [0, -5, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg viewBox="0 0 80 100" className="w-24 h-32 opacity-30">
          <defs>
            <linearGradient id="bellGradFloat" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFD700" />
              <stop offset="100%" stopColor="#B8860B" />
            </linearGradient>
          </defs>
          <circle cx="40" cy="10" r="7" fill="#B8860B" />
          <rect x="36" y="10" width="8" height="18" fill="#B8860B" />
          <path d="M15 28 Q15 65 10 82 L70 82 Q65 65 65 28 Q52 18 40 18 Q28 18 15 28" fill="url(#bellGradFloat)" />
          <ellipse cx="40" cy="82" rx="32" ry="10" fill="#CD853F" />
          <circle cx="40" cy="95" r="9" fill="#8B4513" />
        </svg>
      </motion.div>
      
      {/* Temple Bell - Right Center */}
      <motion.div
        className="absolute right-16 top-1/3"
        animate={{ rotate: [6, -6, 6], y: [0, 8, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      >
        <svg viewBox="0 0 80 100" className="w-20 h-28 opacity-25">
          <defs>
            <linearGradient id="bellGradFloat2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFD700" />
              <stop offset="100%" stopColor="#B8860B" />
            </linearGradient>
          </defs>
          <circle cx="40" cy="10" r="7" fill="#B8860B" />
          <rect x="36" y="10" width="8" height="18" fill="#B8860B" />
          <path d="M15 28 Q15 65 10 82 L70 82 Q65 65 65 28 Q52 18 40 18 Q28 18 15 28" fill="url(#bellGradFloat2)" />
          <ellipse cx="40" cy="82" rx="32" ry="10" fill="#CD853F" />
          <circle cx="40" cy="95" r="9" fill="#8B4513" />
        </svg>
      </motion.div>
      
      {/* Lotus - Top Center */}
      <motion.div
        className="absolute top-16 left-1/3"
        animate={{ y: [0, -12, 0], rotate: [0, 3, -3, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg viewBox="0 0 120 90" className="w-28 h-20 opacity-35">
          <defs>
            <linearGradient id="lotusGradFloat" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFB6C1" />
              <stop offset="100%" stopColor="#FF69B4" />
            </linearGradient>
          </defs>
          <ellipse cx="60" cy="70" rx="20" ry="6" fill="#228B22" opacity="0.6" />
          <ellipse cx="60" cy="45" rx="10" ry="28" fill="url(#lotusGradFloat)" />
          <ellipse cx="40" cy="52" rx="10" ry="24" fill="url(#lotusGradFloat)" transform="rotate(-25 40 52)" />
          <ellipse cx="80" cy="52" rx="10" ry="24" fill="url(#lotusGradFloat)" transform="rotate(25 80 52)" />
          <ellipse cx="25" cy="58" rx="9" ry="20" fill="url(#lotusGradFloat)" transform="rotate(-45 25 58)" />
          <ellipse cx="95" cy="58" rx="9" ry="20" fill="url(#lotusGradFloat)" transform="rotate(45 95 58)" />
          <circle cx="60" cy="50" r="8" fill="#FFD700" />
        </svg>
      </motion.div>
      
      {/* Lotus - Bottom Center */}
      <motion.div
        className="absolute bottom-20 right-1/3"
        animate={{ y: [0, 10, 0], rotate: [0, -2, 2, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
      >
        <svg viewBox="0 0 120 90" className="w-24 h-16 opacity-30">
          <defs>
            <linearGradient id="lotusGradFloat2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFB6C1" />
              <stop offset="100%" stopColor="#FF69B4" />
            </linearGradient>
          </defs>
          <ellipse cx="60" cy="70" rx="20" ry="6" fill="#228B22" opacity="0.6" />
          <ellipse cx="60" cy="45" rx="10" ry="28" fill="url(#lotusGradFloat2)" />
          <ellipse cx="40" cy="52" rx="10" ry="24" fill="url(#lotusGradFloat2)" transform="rotate(-25 40 52)" />
          <ellipse cx="80" cy="52" rx="10" ry="24" fill="url(#lotusGradFloat2)" transform="rotate(25 80 52)" />
          <circle cx="60" cy="50" r="8" fill="#FFD700" />
        </svg>
      </motion.div>
      
      {/* Swastika - Various positions */}
      <motion.div
        className="absolute top-1/4 right-12"
        animate={{ rotate: [0, 10, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg viewBox="0 0 100 100" className="w-20 h-20 text-saffron/25">
          <g fill="currentColor">
            <rect x="42" y="15" width="16" height="70" />
            <rect x="15" y="42" width="70" height="16" />
            <rect x="42" y="15" width="35" height="16" />
            <rect x="61" y="15" width="16" height="30" />
            <rect x="23" y="69" width="35" height="16" />
            <rect x="23" y="55" width="16" height="30" />
          </g>
        </svg>
      </motion.div>
      
      <motion.div
        className="absolute bottom-1/4 left-16"
        animate={{ rotate: [0, -8, 0], scale: [1, 1.03, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      >
        <svg viewBox="0 0 100 100" className="w-16 h-16 text-maroon/20">
          <g fill="currentColor">
            <rect x="42" y="15" width="16" height="70" />
            <rect x="15" y="42" width="70" height="16" />
            <rect x="42" y="15" width="35" height="16" />
            <rect x="61" y="15" width="16" height="30" />
            <rect x="23" y="69" width="35" height="16" />
            <rect x="23" y="55" width="16" height="30" />
          </g>
        </svg>
      </motion.div>
      
      {/* Authentic Trishul - Left */}
      <motion.div
        className="absolute left-20 top-1/4"
        animate={{ y: [0, -10, 0], rotate: [0, 3, -3, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg viewBox="0 0 80 140" className="w-20 h-32 opacity-35">
          <defs>
            <linearGradient id="trishulGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFD700" />
              <stop offset="50%" stopColor="#DAA520" />
              <stop offset="100%" stopColor="#B8860B" />
            </linearGradient>
            <linearGradient id="trishulShine" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFF8DC" />
              <stop offset="50%" stopColor="#FFD700" />
              <stop offset="100%" stopColor="#B8860B" />
            </linearGradient>
          </defs>
          {/* Main shaft */}
          <rect x="36" y="55" width="8" height="85" fill="url(#trishulGold)" rx="2" />
          {/* Shaft decorative bands */}
          <rect x="34" y="60" width="12" height="4" fill="#DAA520" rx="1" />
          <rect x="34" y="70" width="12" height="3" fill="#B8860B" rx="1" />
          {/* Center prong (tallest) */}
          <path d="M40 5 C38 5 36 10 36 15 L36 55 L44 55 L44 15 C44 10 42 5 40 5" fill="url(#trishulShine)" />
          <path d="M40 2 L37 12 L40 8 L43 12 Z" fill="#FFD700" />
          {/* Left prong */}
          <path d="M15 25 C12 22 10 25 12 30 L18 45 C20 50 28 55 36 55 L36 50 C30 50 24 47 22 43 L18 32 C17 30 17 27 15 25" fill="url(#trishulGold)" />
          <path d="M12 20 L10 28 L15 24 L18 30 Z" fill="#FFD700" />
          {/* Right prong */}
          <path d="M65 25 C68 22 70 25 68 30 L62 45 C60 50 52 55 44 55 L44 50 C50 50 56 47 58 43 L62 32 C63 30 63 27 65 25" fill="url(#trishulGold)" />
          <path d="M68 20 L70 28 L65 24 L62 30 Z" fill="#FFD700" />
          {/* Decorative crescent moon */}
          <path d="M30 52 Q40 45 50 52" stroke="#DAA520" strokeWidth="3" fill="none" />
          {/* Center jewel */}
          <circle cx="40" cy="58" r="4" fill="#FF6347" />
          <circle cx="40" cy="58" r="2" fill="#FFB6C1" />
        </svg>
      </motion.div>
      
      {/* Authentic Trishul - Right */}
      <motion.div
        className="absolute right-20 bottom-1/3"
        animate={{ y: [0, 8, 0], rotate: [0, -2, 2, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
      >
        <svg viewBox="0 0 80 140" className="w-16 h-28 opacity-25">
          <defs>
            <linearGradient id="trishulGold2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFD700" />
              <stop offset="50%" stopColor="#DAA520" />
              <stop offset="100%" stopColor="#B8860B" />
            </linearGradient>
          </defs>
          {/* Main shaft */}
          <rect x="36" y="55" width="8" height="85" fill="url(#trishulGold2)" rx="2" />
          <rect x="34" y="60" width="12" height="4" fill="#DAA520" rx="1" />
          {/* Center prong */}
          <path d="M40 5 C38 5 36 10 36 15 L36 55 L44 55 L44 15 C44 10 42 5 40 5" fill="url(#trishulGold2)" />
          <path d="M40 2 L37 12 L40 8 L43 12 Z" fill="#FFD700" />
          {/* Left prong */}
          <path d="M15 25 C12 22 10 25 12 30 L18 45 C20 50 28 55 36 55 L36 50 C30 50 24 47 22 43 L18 32 C17 30 17 27 15 25" fill="url(#trishulGold2)" />
          <path d="M12 20 L10 28 L15 24 L18 30 Z" fill="#FFD700" />
          {/* Right prong */}
          <path d="M65 25 C68 22 70 25 68 30 L62 45 C60 50 52 55 44 55 L44 50 C50 50 56 47 58 43 L62 32 C63 30 63 27 65 25" fill="url(#trishulGold2)" />
          <path d="M68 20 L70 28 L65 24 L62 30 Z" fill="#FFD700" />
          {/* Decorative crescent */}
          <path d="M30 52 Q40 45 50 52" stroke="#DAA520" strokeWidth="3" fill="none" />
          <circle cx="40" cy="58" r="4" fill="#FF6347" />
        </svg>
      </motion.div>
      
      {/* Kalash - Right Bottom */}
      <motion.div
        className="absolute right-28 bottom-1/4"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        <svg viewBox="0 0 80 100" className="w-20 h-24 opacity-30">
          <defs>
            <linearGradient id="kalashGradFloat" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFD700" />
              <stop offset="100%" stopColor="#CD853F" />
            </linearGradient>
          </defs>
          <ellipse cx="40" cy="22" rx="14" ry="12" fill="#8B4513" />
          <path d="M28 12 Q20 0 34 5" stroke="#228B22" strokeWidth="4" fill="none" />
          <path d="M40 8 Q40 -5 48 2" stroke="#228B22" strokeWidth="4" fill="none" />
          <path d="M52 12 Q60 0 46 5" stroke="#228B22" strokeWidth="4" fill="none" />
          <ellipse cx="40" cy="38" rx="22" ry="8" fill="url(#kalashGradFloat)" />
          <path d="M18 38 Q12 60 18 82 Q28 94 40 94 Q52 94 62 82 Q68 60 62 38" fill="url(#kalashGradFloat)" />
          <ellipse cx="40" cy="94" rx="22" ry="6" fill="#B8860B" />
        </svg>
      </motion.div>
      
      <AnimatePresence mode="wait">
        {mode === 'welcome' && (
          <WelcomeScreen 
            key="welcome"
            onLogin={() => setMode('login')} 
            onRegister={() => setMode('register')}
            onGoogleSignIn={handleGoogleSignIn}
            googleLoading={googleLoading}
            onBack={onBack}
            showBackButton={showBackButton}
          />
        )}
        
        {mode === 'login' && (
          <LoginScreen
            key="login"
            data={loginData}
            setData={setLoginData}
            onSubmit={handleLogin}
            loading={loading}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            onBack={showBackButton ? onBack : () => setMode('welcome')}
            onSwitch={() => { setMode('register'); resetPhoneAuth(); }}
            onGoogleSignIn={handleGoogleSignIn}
            googleLoading={googleLoading}
            authMethod={authMethod}
            setAuthMethod={setAuthMethod}
            otpSent={otpSent}
            otp={otp}
            setOtp={setOtp}
            otpLoading={otpLoading}
            onSendOTP={handleSendOTP}
            onVerifyOTP={handleVerifyOTP}
            resetPhoneAuth={resetPhoneAuth}
            selectedCountry={selectedCountry}
            setSelectedCountry={setSelectedCountry}
            showCountryDropdown={showCountryDropdown}
            setShowCountryDropdown={setShowCountryDropdown}
            setShowForgotPassword={setShowForgotPassword}
          />
        )}
        
        {mode === 'register' && (
          <RegisterScreen
            key="register"
            data={registerData}
            setData={setRegisterData}
            onSubmit={handleRegister}
            loading={loading}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            onBack={showBackButton ? onBack : () => setMode('welcome')}
            onSwitch={() => { setMode('login'); resetPhoneAuth(); }}
            onGoogleSignIn={handleGoogleSignIn}
            googleLoading={googleLoading}
            authMethod={authMethod}
            setAuthMethod={setAuthMethod}
            otpSent={otpSent}
            otp={otp}
            setOtp={setOtp}
            otpLoading={otpLoading}
            onSendOTP={handleSendOTP}
            onVerifyOTP={handleVerifyOTP}
            resetPhoneAuth={resetPhoneAuth}
            selectedCountry={selectedCountry}
            setSelectedCountry={setSelectedCountry}
            showCountryDropdown={showCountryDropdown}
            setShowCountryDropdown={setShowCountryDropdown}
            signupSettings={signupSettings}
          />
        )}
      </AnimatePresence>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-sm w-full"
          >
            <h2 className="font-cinzel text-xl font-bold text-maroon mb-2">Reset Password</h2>
            <p className="text-sm text-gray-500 mb-4">Enter your email and we'll send you a link to reset your password.</p>
            
            <form onSubmit={handleForgotPassword}>
              <div className="relative mb-4">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full bg-white border border-orange-200 rounded-xl pl-12 pr-4 py-3 focus:border-saffron focus:ring-2 focus:ring-saffron/20 outline-none transition-all"
                  placeholder="Enter your email"
                  required
                  data-testid="forgot-password-email"
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowForgotPassword(false); setForgotEmail(''); }}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="flex-1 py-3 bg-saffron text-white rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  data-testid="forgot-password-submit"
                >
                  {forgotLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Link'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function WelcomeScreen({ onLogin, onRegister, onGoogleSignIn, googleLoading, onBack, showBackButton }) {
  return (
    <motion.div
      className="w-full max-w-md mx-auto bg-white/80 backdrop-blur-sm md:rounded-2xl md:shadow-xl md:border md:border-orange-100 min-h-screen md:min-h-0 md:my-8 flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
    >
      {showBackButton && (
        <div className="px-6 pt-4">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-maroon">
            <ChevronLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </button>
        </div>
      )}
      
      <div className="flex-1 flex flex-col items-center justify-center px-8 pt-16">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className="w-32 h-32 rounded-xl overflow-hidden">
            <img 
              src="/temple-logo.png" 
              alt="Divine App - Om Symbol"
              className="w-full h-full object-cover"
            />
          </div>
        </motion.div>

        <motion.h1 
          className="font-cinzel text-3xl font-bold text-maroon mb-1"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          DIVINE
        </motion.h1>
        
        <motion.p 
          className="text-xs text-gray-500 italic mb-2"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          Spiritual Services
        </motion.p>
        
        <motion.p 
          className="text-gray-600 text-center max-w-xs mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Your complete spiritual ecosystem for rituals, astrology & sacred services
        </motion.p>

        <motion.div 
          className="grid grid-cols-2 gap-4 w-full max-w-sm"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {[
            { Icon: BellIcon3D, label: 'Book Priests', color: 'from-amber-50 to-orange-50', border: 'border-amber-200' },
            { Icon: ZodiacIcon3D, label: 'Horoscope', color: 'from-indigo-50 to-purple-50', border: 'border-indigo-200' },
            { Icon: TempleIcon3D, label: 'Temples', color: 'from-yellow-50 to-amber-50', border: 'border-yellow-200' },
            { Icon: CartIcon3D, label: 'Pooja Store', color: 'from-orange-50 to-red-50', border: 'border-orange-200' },
          ].map((item, i) => (
            <motion.div
              key={i}
              className={`bg-gradient-to-br ${item.color} border ${item.border} backdrop-blur rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm`}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.97 }}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
            >
              <item.Icon />
              <span className="text-sm font-medium text-gray-700 mt-2">{item.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <motion.div 
        className="px-8 pb-12"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <button
          onClick={onRegister}
          className="w-full bg-saffron hover:bg-saffron-dark text-white rounded-full py-4 font-semibold mb-3 flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
          data-testid="welcome-register"
        >
          Get Started <ArrowRight className="w-5 h-5" />
        </button>
        
        <button
          onClick={onLogin}
          className="w-full border-2 border-maroon text-maroon hover:bg-maroon hover:text-white rounded-full py-4 font-semibold transition-all active:scale-95 mb-3"
          data-testid="welcome-login"
        >
          I already have an account
        </button>

        <button
          onClick={() => onGoogleSignIn()}
          disabled={googleLoading}
          className="w-full bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-full py-4 font-semibold flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-70"
          data-testid="google-signin"
        >
          {googleLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </>
          )}
        </button>
        
        <p className="text-center text-xs text-gray-500 mt-6">
          By continuing, you agree to our Terms & Privacy Policy
        </p>
      </motion.div>
    </motion.div>
  );
}

function LoginScreen({ 
  data, setData, onSubmit, loading, showPassword, setShowPassword, 
  onBack, onSwitch, onGoogleSignIn, googleLoading,
  authMethod, setAuthMethod, otpSent, otp, setOtp, otpLoading, onSendOTP, onVerifyOTP, resetPhoneAuth,
  selectedCountry, setSelectedCountry, showCountryDropdown, setShowCountryDropdown,
  setShowForgotPassword
}) {
  return (
    <motion.div
      className="w-full max-w-md mx-auto bg-white/80 backdrop-blur-sm md:rounded-2xl md:shadow-xl md:border md:border-orange-100 min-h-screen md:min-h-0 md:my-8 flex flex-col"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ duration: 0.3 }}
    >
      <div className="px-6 pt-6">
        <button onClick={() => { onBack(); resetPhoneAuth(); }} className="p-2 -ml-2 text-gray-600 hover:text-maroon transition-colors" data-testid="login-back">
          <ChevronLeft className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 px-6 md:px-8 pt-4 pb-6">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-center gap-4 mb-6">
          <img 
            src="/temple-logo.png" 
            alt="Divine"
            className="w-14 h-14 rounded-lg object-cover"
          />
          <div>
            <h1 className="font-cinzel text-2xl font-bold text-maroon">Welcome Back</h1>
            <p className="text-gray-600 text-sm">Sign in to continue your spiritual journey</p>
          </div>
        </motion.div>

        {/* Auth Method Toggle */}
        <motion.div 
          className="flex bg-gray-100 rounded-xl p-1 mb-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.05 }}
        >
          <button
            onClick={() => { setAuthMethod('email'); resetPhoneAuth(); }}
            className={`flex-1 py-3 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
              authMethod === 'email' ? 'bg-white text-maroon shadow-sm' : 'text-gray-500'
            }`}
          >
            <Mail className="w-4 h-4" /> Email
          </button>
          <button
            onClick={() => { setAuthMethod('phone'); resetPhoneAuth(); }}
            className={`flex-1 py-3 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
              authMethod === 'phone' ? 'bg-white text-maroon shadow-sm' : 'text-gray-500'
            }`}
          >
            <Phone className="w-4 h-4" /> Phone
          </button>
        </motion.div>

        {/* Google Sign In */}
        <motion.button
          onClick={() => onGoogleSignIn()}
          disabled={googleLoading}
          className="w-full bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl py-4 font-medium flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-70 mb-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          data-testid="login-google"
        >
          {googleLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </>
          )}
        </motion.button>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="text-sm text-gray-400">or sign in with {authMethod}</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        {authMethod === 'email' ? (
          <form onSubmit={onSubmit} className="space-y-5">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={data.email}
                  onChange={(e) => setData({ ...data, email: e.target.value })}
                  className="w-full bg-white border border-orange-200 rounded-xl pl-12 pr-4 py-4 focus:border-saffron focus:ring-2 focus:ring-saffron/20 outline-none transition-all"
                  placeholder="your@email.com"
                  required
                  data-testid="login-email"
                />
              </div>
            </motion.div>

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={data.password}
                  onChange={(e) => setData({ ...data, password: e.target.value })}
                  className="w-full bg-white border border-orange-200 rounded-xl pl-12 pr-12 py-4 focus:border-saffron focus:ring-2 focus:ring-saffron/20 outline-none transition-all"
                  placeholder="Enter your password"
                  required
                  data-testid="login-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-saffron hover:text-orange-600 mt-2 text-right block w-full"
                data-testid="forgot-password-link"
              >
                Forgot Password?
              </button>
            </motion.div>

            <motion.button
              type="submit"
              disabled={loading}
              className="w-full bg-saffron hover:bg-saffron-dark text-white rounded-full py-4 font-semibold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-70"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25 }}
              data-testid="login-submit"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Sign In <ArrowRight className="w-5 h-5" /></>}
            </motion.button>
          </form>
        ) : (
          // Phone Login
          <div className="space-y-5">
            {!otpSent ? (
              <>
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <div className="relative flex gap-2">
                    {/* Country Code Selector */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                        className="flex items-center gap-1 bg-white border border-orange-200 rounded-xl px-3 py-4 hover:border-saffron transition-all min-w-[100px]"
                      >
                        <span className="text-lg">{selectedCountry.flag}</span>
                        <span className="text-sm font-medium text-gray-700">{selectedCountry.code}</span>
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      </button>
                      
                      {showCountryDropdown && (
                        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-orange-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
                          {COUNTRY_CODES.map((country) => (
                            <button
                              key={country.code}
                              onClick={() => {
                                setSelectedCountry(country);
                                setShowCountryDropdown(false);
                                setData({ ...data, phone: '' }); // Clear phone on country change
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-orange-50 text-left ${
                                selectedCountry.code === country.code ? 'bg-orange-50' : ''
                              }`}
                            >
                              <span className="text-lg">{country.flag}</span>
                              <span className="text-sm font-medium">{country.code}</span>
                              <span className="text-sm text-gray-500">{country.country}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Phone Input */}
                    <input
                      type="tel"
                      value={data.phone}
                      onChange={(e) => setData({ ...data, phone: e.target.value.replace(/\D/g, '').slice(0, selectedCountry.maxLength) })}
                      className="flex-1 bg-white border border-orange-200 rounded-xl px-4 py-4 focus:border-saffron focus:ring-2 focus:ring-saffron/20 outline-none transition-all"
                      placeholder="Enter phone number"
                      maxLength={selectedCountry.maxLength}
                      data-testid="login-phone"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">We'll send a 6-digit OTP to {selectedCountry.code} {data.phone || 'your number'}</p>
                </motion.div>

                <motion.button
                  type="button"
                  onClick={() => onSendOTP(data.phone)}
                  disabled={otpLoading || data.phone.length < 6}
                  className="w-full bg-saffron hover:bg-saffron-dark text-white rounded-full py-4 font-semibold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-70"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  data-testid="send-otp"
                >
                  {otpLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Send OTP <ArrowRight className="w-5 h-5" /></>}
                </motion.button>
              </>
            ) : (
              <>
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">Enter OTP</label>
                    <button 
                      onClick={resetPhoneAuth} 
                      className="text-xs text-saffron hover:underline"
                    >
                      Change number
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">OTP sent to {selectedCountry.code} {data.phone}</p>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full bg-white border border-orange-200 rounded-xl px-4 py-4 text-center text-2xl tracking-[0.5em] focus:border-saffron focus:ring-2 focus:ring-saffron/20 outline-none transition-all"
                    placeholder="------"
                    maxLength={6}
                    data-testid="otp-input"
                  />
                </motion.div>

                <motion.button
                  type="button"
                  onClick={() => onVerifyOTP()}
                  disabled={otpLoading || otp.length !== 6}
                  className="w-full bg-saffron hover:bg-saffron-dark text-white rounded-full py-4 font-semibold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-70"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  data-testid="verify-otp"
                >
                  {otpLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Verify & Sign In <ArrowRight className="w-5 h-5" /></>}
                </motion.button>

                <button
                  onClick={() => onSendOTP(data.phone)}
                  disabled={otpLoading}
                  className="w-full text-saffron text-sm hover:underline disabled:opacity-50"
                >
                  Resend OTP
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="px-6 md:px-8 pb-6 text-center">
        <p className="text-gray-600">
          Don't have an account?{' '}
          <button onClick={onSwitch} className="text-saffron font-semibold hover:underline" data-testid="goto-register">
            Sign up
          </button>
        </p>
      </div>
    </motion.div>
  );
}

function RegisterScreen({ 
  data, setData, onSubmit, loading, showPassword, setShowPassword, 
  onBack, onSwitch, onGoogleSignIn, googleLoading,
  authMethod, setAuthMethod, otpSent, otp, setOtp, otpLoading, onSendOTP, onVerifyOTP, resetPhoneAuth,
  selectedCountry, setSelectedCountry, showCountryDropdown, setShowCountryDropdown,
  signupSettings
}) {
  const [showRoleSelect, setShowRoleSelect] = useState(false);
  
  const handleGoogleClick = () => {
    setShowRoleSelect(true);
  };
  
  const handleRoleSelectGoogle = (role) => {
    setShowRoleSelect(false);
    onGoogleSignIn(role);
  };
  
  return (
    <motion.div
      className="w-full max-w-md mx-auto bg-white/80 backdrop-blur-sm md:rounded-2xl md:shadow-xl md:border md:border-orange-100 min-h-screen md:min-h-0 md:my-8 flex flex-col"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ duration: 0.3 }}
    >
      {/* Role Selection Modal for Google Sign-In */}
      <AnimatePresence>
        {showRoleSelect && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowRoleSelect(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-cinzel text-lg font-bold text-maroon mb-2">Select Your Role</h3>
              <p className="text-sm text-gray-600 mb-4">How will you use Divine App?</p>
              
              <div className="space-y-3">
                {[
                  { value: 'devotee', label: 'Devotee', desc: 'Book poojas & services', icon: '🙏' },
                  { value: 'priest', label: 'Priest', desc: 'Offer spiritual services', icon: '🔔' },
                  { value: 'astrologer', label: 'Astrologer', desc: 'Provide consultations', icon: '⭐' },
                  { value: 'shop_owner', label: 'Shop Owner', desc: 'Sell pooja items', icon: '🛒' },
                ].map((role) => (
                  <button
                    key={role.value}
                    onClick={() => handleRoleSelectGoogle(role.value)}
                    className="w-full flex items-center gap-3 p-4 border border-orange-200 rounded-xl hover:bg-orange-50 hover:border-saffron transition-all text-left"
                  >
                    <span className="text-2xl">{role.icon}</span>
                    <div>
                      <p className="font-medium text-gray-800">{role.label}</p>
                      <p className="text-sm text-gray-500">{role.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => setShowRoleSelect(false)}
                className="w-full mt-4 text-gray-500 text-sm hover:text-gray-700"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-6 pt-6">
        <button onClick={() => { onBack(); resetPhoneAuth(); }} className="p-2 -ml-2 text-gray-600 hover:text-maroon transition-colors" data-testid="register-back">
          <ChevronLeft className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 px-6 md:px-8 pt-4 pb-6 overflow-y-auto">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-center gap-4 mb-6">
          <img 
            src="/temple-logo.png" 
            alt="Divine"
            className="w-14 h-14 rounded-lg object-cover"
          />
          <div>
            <h1 className="font-cinzel text-2xl font-bold text-maroon">Create Account</h1>
            <p className="text-gray-600 text-sm">Join our spiritual community</p>
          </div>
        </motion.div>

        {/* Auth Method Toggle */}
        <motion.div 
          className="flex bg-gray-100 rounded-xl p-1 mb-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.05 }}
        >
          <button
            onClick={() => { setAuthMethod('email'); resetPhoneAuth(); }}
            className={`flex-1 py-3 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
              authMethod === 'email' ? 'bg-white text-maroon shadow-sm' : 'text-gray-500'
            }`}
          >
            <Mail className="w-4 h-4" /> Email
          </button>
          <button
            onClick={() => { setAuthMethod('phone'); resetPhoneAuth(); }}
            className={`flex-1 py-3 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
              authMethod === 'phone' ? 'bg-white text-maroon shadow-sm' : 'text-gray-500'
            }`}
          >
            <Phone className="w-4 h-4" /> Phone
          </button>
        </motion.div>

        {/* Google Sign Up */}
        <motion.button
          onClick={handleGoogleClick}
          disabled={googleLoading}
          className="w-full bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl py-4 font-medium flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-70 mb-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          data-testid="register-google"
        >
          {googleLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </>
          )}
        </motion.button>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="text-sm text-gray-400">or sign up with {authMethod}</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        {authMethod === 'email' ? (
          <form onSubmit={onSubmit} className="space-y-4">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={data.name}
                  onChange={(e) => setData({ ...data, name: e.target.value })}
                  className="w-full bg-white border border-orange-200 rounded-xl pl-12 pr-4 py-4 focus:border-saffron focus:ring-2 focus:ring-saffron/20 outline-none transition-all"
                  placeholder="Your full name"
                  required
                  data-testid="register-name"
                />
              </div>
            </motion.div>

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={data.email}
                  onChange={(e) => setData({ ...data, email: e.target.value })}
                  className="w-full bg-white border border-orange-200 rounded-xl pl-12 pr-4 py-4 focus:border-saffron focus:ring-2 focus:ring-saffron/20 outline-none transition-all"
                  placeholder="your@email.com"
                  required
                  data-testid="register-email"
                />
              </div>
            </motion.div>

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }}>
              <label className="block text-sm font-medium text-gray-700 mb-2">I want to join as</label>
              <select
                value={data.role}
                onChange={(e) => setData({ ...data, role: e.target.value })}
                className="w-full bg-white border border-orange-200 rounded-xl px-4 py-4 focus:border-saffron focus:ring-2 focus:ring-saffron/20 outline-none transition-all"
                data-testid="register-role"
              >
                <option value="devotee">Devotee (Book services)</option>
                {signupSettings.enable_priest_signup && (
                  <option value="priest">Priest (Offer services)</option>
                )}
                {signupSettings.enable_astrologer_signup && (
                  <option value="astrologer">Astrologer (Consultations)</option>
                )}
                {signupSettings.enable_shop_owner_signup && (
                  <option value="shop_owner">Shop Owner (Sell products)</option>
                )}
              </select>
            </motion.div>

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={data.password}
                  onChange={(e) => setData({ ...data, password: e.target.value })}
                  className="w-full bg-white border border-orange-200 rounded-xl pl-12 pr-12 py-4 focus:border-saffron focus:ring-2 focus:ring-saffron/20 outline-none transition-all"
                  placeholder="Create a password"
                  required
                  minLength={6}
                  data-testid="register-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </motion.div>

            <motion.button
              type="submit"
              disabled={loading}
              className="w-full bg-saffron hover:bg-saffron-dark text-white rounded-full py-4 font-semibold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-70 mt-6"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.35 }}
              data-testid="register-submit"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Create Account <ArrowRight className="w-5 h-5" /></>}
            </motion.button>
          </form>
        ) : (
          // Phone Registration
          <div className="space-y-4">
            {!otpSent ? (
              <>
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={data.name}
                      onChange={(e) => setData({ ...data, name: e.target.value })}
                      className="w-full bg-white border border-orange-200 rounded-xl pl-12 pr-4 py-4 focus:border-saffron focus:ring-2 focus:ring-saffron/20 outline-none transition-all"
                      placeholder="Your full name"
                      required
                      data-testid="register-name-phone"
                    />
                  </div>
                </motion.div>

                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <div className="relative flex gap-2">
                    {/* Country Code Selector */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                        className="flex items-center gap-1 bg-white border border-orange-200 rounded-xl px-3 py-4 hover:border-saffron transition-all min-w-[100px]"
                      >
                        <span className="text-lg">{selectedCountry.flag}</span>
                        <span className="text-sm font-medium text-gray-700">{selectedCountry.code}</span>
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      </button>
                      
                      {showCountryDropdown && (
                        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-orange-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
                          {COUNTRY_CODES.map((country) => (
                            <button
                              key={country.code}
                              onClick={() => {
                                setSelectedCountry(country);
                                setShowCountryDropdown(false);
                                setData({ ...data, phone: '' }); // Clear phone on country change
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-orange-50 text-left ${
                                selectedCountry.code === country.code ? 'bg-orange-50' : ''
                              }`}
                            >
                              <span className="text-lg">{country.flag}</span>
                              <span className="text-sm font-medium">{country.code}</span>
                              <span className="text-sm text-gray-500">{country.country}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Phone Input */}
                    <input
                      type="tel"
                      value={data.phone}
                      onChange={(e) => setData({ ...data, phone: e.target.value.replace(/\D/g, '').slice(0, selectedCountry.maxLength) })}
                      className="flex-1 bg-white border border-orange-200 rounded-xl px-4 py-4 focus:border-saffron focus:ring-2 focus:ring-saffron/20 outline-none transition-all"
                      placeholder="Enter phone number"
                      maxLength={selectedCountry.maxLength}
                      data-testid="register-phone"
                    />
                  </div>
                </motion.div>

                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">I want to join as</label>
                  <select
                    value={data.role}
                    onChange={(e) => setData({ ...data, role: e.target.value })}
                    className="w-full bg-white border border-orange-200 rounded-xl px-4 py-4 focus:border-saffron focus:ring-2 focus:ring-saffron/20 outline-none transition-all"
                    data-testid="register-role-phone"
                  >
                    <option value="devotee">Devotee (Book services)</option>
                    <option value="priest">Priest (Offer services)</option>
                    <option value="astrologer">Astrologer (Consultations)</option>
                    <option value="shop_owner">Shop Owner (Sell products)</option>
                  </select>
                </motion.div>

                <motion.button
                  type="button"
                  onClick={() => onSendOTP(data.phone, true)}
                  disabled={otpLoading || data.phone.length < 6 || !data.name}
                  className="w-full bg-saffron hover:bg-saffron-dark text-white rounded-full py-4 font-semibold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-70 mt-6"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  data-testid="send-otp-register"
                >
                  {otpLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Send OTP <ArrowRight className="w-5 h-5" /></>}
                </motion.button>
              </>
            ) : (
              <>
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">Enter OTP</label>
                    <button 
                      onClick={resetPhoneAuth} 
                      className="text-xs text-saffron hover:underline"
                    >
                      Change number
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">OTP sent to {selectedCountry.code} {data.phone}</p>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full bg-white border border-orange-200 rounded-xl px-4 py-4 text-center text-2xl tracking-[0.5em] focus:border-saffron focus:ring-2 focus:ring-saffron/20 outline-none transition-all"
                    placeholder="------"
                    maxLength={6}
                    data-testid="otp-input-register"
                  />
                </motion.div>

                <motion.button
                  type="button"
                  onClick={() => onVerifyOTP({ name: data.name, role: data.role })}
                  disabled={otpLoading || otp.length !== 6}
                  className="w-full bg-saffron hover:bg-saffron-dark text-white rounded-full py-4 font-semibold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-70"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  data-testid="verify-otp-register"
                >
                  {otpLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Verify & Create Account <ArrowRight className="w-5 h-5" /></>}
                </motion.button>

                <button
                  onClick={() => onSendOTP(data.phone, true)}
                  disabled={otpLoading}
                  className="w-full text-saffron text-sm hover:underline disabled:opacity-50"
                >
                  Resend OTP
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="px-6 md:px-8 pb-6 text-center">
        <p className="text-gray-600">
          Already have an account?{' '}
          <button onClick={onSwitch} className="text-saffron font-semibold hover:underline" data-testid="goto-login">
            Sign in
          </button>
        </p>
      </div>
    </motion.div>
  );
}
