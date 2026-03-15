import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Phone, Eye, EyeOff, ArrowRight, Loader2, ChevronLeft, Bell, Sparkles, Building2, ShoppingCart, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Toaster, toast } from 'sonner';
import { isFirebaseConfigured } from '../lib/firebase';

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

// 3D Animated Devotional Icons
const BellIcon3D = () => (
  <motion.svg viewBox="0 0 100 100" className="w-8 h-8" animate={{ rotate: [-3, 3, -3] }} transition={{ duration: 0.4, repeat: Infinity }}>
    <defs>
      <linearGradient id="bellGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFD700" />
        <stop offset="100%" stopColor="#CD853F" />
      </linearGradient>
    </defs>
    <ellipse cx="50" cy="15" rx="5" ry="5" fill="#B8860B" />
    <path d="M45 15 L45 25 Q30 35 30 60 L70 60 Q70 35 55 25 L55 15" fill="url(#bellGrad)" />
    <ellipse cx="50" cy="60" rx="22" ry="8" fill="#CD853F" />
    <circle cx="50" cy="70" r="6" fill="#B8860B" />
  </motion.svg>
);

const ZodiacIcon3D = () => (
  <motion.svg viewBox="0 0 100 100" className="w-8 h-8" animate={{ rotate: [0, 360] }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }}>
    <defs>
      <linearGradient id="zodiacGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4B0082" />
        <stop offset="100%" stopColor="#9400D3" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="35" fill="none" stroke="url(#zodiacGrad)" strokeWidth="3" />
    <circle cx="50" cy="50" r="25" fill="none" stroke="#FFD700" strokeWidth="1" strokeDasharray="4 4" />
    <circle cx="50" cy="18" r="4" fill="#FFD700" />
    <circle cx="82" cy="50" r="4" fill="#FFD700" />
    <circle cx="50" cy="82" r="4" fill="#FFD700" />
    <circle cx="18" cy="50" r="4" fill="#FFD700" />
    <circle cx="50" cy="50" r="6" fill="#4B0082" />
  </motion.svg>
);

const TempleIcon3D = () => (
  <motion.svg viewBox="0 0 100 100" className="w-8 h-8" animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity }}>
    <defs>
      <linearGradient id="templeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#DEB887" />
        <stop offset="100%" stopColor="#CD853F" />
      </linearGradient>
      <linearGradient id="roofGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFD700" />
        <stop offset="100%" stopColor="#B8860B" />
      </linearGradient>
    </defs>
    <rect x="20" y="65" width="60" height="30" fill="url(#templeGrad)" />
    <rect x="28" y="45" width="44" height="20" fill="url(#templeGrad)" />
    <polygon points="50,10 78,45 22,45" fill="url(#roofGrad)" />
    <circle cx="50" cy="28" r="5" fill="#FFD700" />
    <rect x="40" y="70" width="20" height="25" fill="#4A3728" />
  </motion.svg>
);

const CartIcon3D = () => (
  <motion.svg viewBox="0 0 100 100" className="w-8 h-8" animate={{ y: [0, -3, 0] }} transition={{ duration: 2, repeat: Infinity }}>
    <defs>
      <linearGradient id="cartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#DEB887" />
        <stop offset="100%" stopColor="#8B4513" />
      </linearGradient>
    </defs>
    <path d="M20 35 L30 75 L70 75 L80 35 Z" fill="url(#cartGrad)" stroke="#8B4513" strokeWidth="2" />
    <path d="M25 45 L75 45 M27 55 L73 55 M29 65 L71 65" stroke="#A0522D" strokeWidth="2" fill="none" />
    <ellipse cx="35" cy="28" rx="6" ry="8" fill="#FF6347" />
    <ellipse cx="50" cy="26" rx="5" ry="7" fill="#FFD700" />
    <ellipse cx="65" cy="28" rx="6" ry="8" fill="#32CD32" />
  </motion.svg>
);

export default function AuthScreen({ initialMode = 'welcome', onBack, showBackButton = false }) {
  const [mode, setMode] = useState(initialMode === 'login' ? 'login' : initialMode === 'register' ? 'register' : 'welcome');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login, register, loginWithGoogle, initPhoneAuth, sendOTP, verifyOTPAndSignIn } = useAuth();

  const [loginData, setLoginData] = useState({ email: '', password: '', phone: '' });
  const [registerData, setRegisterData] = useState({
    name: '', email: '', phone: '', password: '', role: 'devotee'
  });
  
  // Phone auth states
  const [authMethod, setAuthMethod] = useState('email'); // 'email' or 'phone'
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  
  // Country code state
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]); // Default to India
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

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
        errorMessage = 'Too many attempts. Please try again later.';
      } else if (error.code === 'auth/quota-exceeded') {
        errorMessage = 'SMS quota exceeded. Please try again later.';
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
    recaptchaInitialized.current = false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-parchment flex items-center justify-center">
      <Toaster position="top-center" richColors />
      
      {/* Hidden reCAPTCHA container */}
      <div id="recaptcha-container"></div>
      
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
          />
        )}
      </AnimatePresence>
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
          className="mb-8"
        >
          <div className="w-28 h-28 relative">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <ellipse cx="50" cy="85" rx="30" ry="8" fill="#B8860B" />
              <path d="M30 85 Q30 70 35 60 L65 60 Q70 70 70 85" fill="#FFD700" />
              <ellipse cx="50" cy="60" rx="18" ry="6" fill="#FFD700" />
              <path d="M50 55 Q45 40 50 25 Q55 40 50 55" fill="#FF9933" />
              <ellipse cx="50" cy="30" rx="4" ry="6" fill="#FFEB3B" />
            </svg>
          </div>
        </motion.div>

        <motion.h1 
          className="font-cinzel text-3xl font-bold text-maroon mb-2"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          DIVINE
        </motion.h1>
        
        <motion.p 
          className="text-gray-600 text-center max-w-xs mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Your complete spiritual ecosystem for rituals, astrology & sacred services
        </motion.p>

        <motion.div 
          className="grid grid-cols-2 gap-4 w-full max-w-xs"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {[
            { Icon: BellIcon3D, label: 'Book Priests' },
            { Icon: ZodiacIcon3D, label: 'Horoscope' },
            { Icon: TempleIcon3D, label: 'Temples' },
            { Icon: CartIcon3D, label: 'Pooja Store' },
          ].map((item, i) => (
            <div key={i} className="bg-white/60 backdrop-blur rounded-xl p-3 flex flex-col items-center justify-center">
              <item.Icon />
              <span className="text-xs text-gray-600 mt-1">{item.label}</span>
            </div>
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
  selectedCountry, setSelectedCountry, showCountryDropdown, setShowCountryDropdown
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
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <h1 className="font-cinzel text-2xl font-bold text-maroon mb-2">Welcome Back</h1>
          <p className="text-gray-600 mb-6">Sign in to continue your spiritual journey</p>
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

        {/* Demo Credentials */}
        {authMethod === 'email' && (
          <motion.div 
            className="mt-6 p-4 bg-orange-50 rounded-xl"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-sm font-medium text-gray-700 mb-2">Demo Credentials:</p>
            <p className="text-xs text-gray-500">Admin: admin@divineapp.com / admin123</p>
          </motion.div>
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
  selectedCountry, setSelectedCountry, showCountryDropdown, setShowCountryDropdown
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
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <h1 className="font-cinzel text-2xl font-bold text-maroon mb-2">Create Account</h1>
          <p className="text-gray-600 mb-6">Join our spiritual community</p>
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
                <option value="priest">Priest (Offer services)</option>
                <option value="astrologer">Astrologer (Consultations)</option>
                <option value="shop_owner">Shop Owner (Sell products)</option>
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
