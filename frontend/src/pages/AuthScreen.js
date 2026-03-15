import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Phone, Eye, EyeOff, ArrowRight, Loader2, ChevronLeft, Bell, Sparkles, Building2, ShoppingCart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Toaster, toast } from 'sonner';

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
  const [mode, setMode] = useState(initialMode === 'login' ? 'login' : initialMode === 'register' ? 'register' : 'welcome'); // welcome, login, register
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    name: '', email: '', phone: '', password: '', role: 'devotee'
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(loginData.email, loginData.password);
      toast.success('Welcome back!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid credentials');
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
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-parchment">
      <Toaster position="top-center" richColors />
      
      <AnimatePresence mode="wait">
        {mode === 'welcome' && (
          <WelcomeScreen 
            key="welcome"
            onLogin={() => setMode('login')} 
            onRegister={() => setMode('register')}
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
            onSwitch={() => setMode('register')}
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
            onSwitch={() => setMode('login')}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function WelcomeScreen({ onLogin, onRegister, onBack, showBackButton }) {
  return (
    <motion.div
      className="min-h-screen flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
    >
      {/* Back button for web */}
      {showBackButton && (
        <div className="px-4 pt-4">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-maroon">
            <ChevronLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </button>
        </div>
      )}
      
      {/* Top Section with Logo */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pt-16">
        {/* Logo */}
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

        {/* Features with 3D Icons */}
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

      {/* Bottom Section with Buttons */}
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
          className="w-full border-2 border-maroon text-maroon hover:bg-maroon hover:text-white rounded-full py-4 font-semibold transition-all active:scale-95"
          data-testid="welcome-login"
        >
          I already have an account
        </button>
        
        <p className="text-center text-xs text-gray-500 mt-6">
          By continuing, you agree to our Terms & Privacy Policy
        </p>
      </motion.div>
    </motion.div>
  );
}

function LoginScreen({ data, setData, onSubmit, loading, showPassword, setShowPassword, onBack, onSwitch }) {
  return (
    <motion.div
      className="min-h-screen flex flex-col"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="px-4 pt-4">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-600" data-testid="login-back">
          <ChevronLeft className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 px-8 pt-8">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <h1 className="font-cinzel text-2xl font-bold text-maroon mb-2">Welcome Back</h1>
          <p className="text-gray-600 mb-8">Sign in to continue your spiritual journey</p>
        </motion.div>

        <form onSubmit={onSubmit} className="space-y-5">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
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
                placeholder="••••••••"
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
            transition={{ delay: 0.3 }}
            data-testid="login-submit"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Sign In <ArrowRight className="w-5 h-5" /></>}
          </motion.button>
        </form>

        {/* Demo Credentials */}
        <motion.div 
          className="mt-6 p-4 bg-orange-50 rounded-xl"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-sm font-medium text-gray-700 mb-2">Demo Credentials:</p>
          <p className="text-xs text-gray-500">Admin: admin@divineapp.com / admin123</p>
          <p className="text-xs text-gray-500">Priest: pandit.sharma@divineapp.com / priest123</p>
        </motion.div>
      </div>

      <div className="px-8 pb-8 text-center">
        <p className="text-gray-600">
          Don't have an account?{' '}
          <button onClick={onSwitch} className="text-saffron font-semibold" data-testid="goto-register">
            Sign up
          </button>
        </p>
      </div>
    </motion.div>
  );
}

function RegisterScreen({ data, setData, onSubmit, loading, showPassword, setShowPassword, onBack, onSwitch }) {
  return (
    <motion.div
      className="min-h-screen flex flex-col"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="px-4 pt-4">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-600" data-testid="register-back">
          <ChevronLeft className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 px-8 pt-4 pb-8 overflow-y-auto">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <h1 className="font-cinzel text-2xl font-bold text-maroon mb-2">Create Account</h1>
          <p className="text-gray-600 mb-6">Join our spiritual community</p>
        </motion.div>

        <form onSubmit={onSubmit} className="space-y-4">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
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
                data-testid="register-email"
              />
            </div>
          </motion.div>

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone (Optional)</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                value={data.phone}
                onChange={(e) => setData({ ...data, phone: e.target.value })}
                className="w-full bg-white border border-orange-200 rounded-xl pl-12 pr-4 py-4 focus:border-saffron focus:ring-2 focus:ring-saffron/20 outline-none transition-all"
                placeholder="+91 98765 43210"
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
                placeholder="••••••••"
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
      </div>

      <div className="px-8 pb-8 text-center">
        <p className="text-gray-600">
          Already have an account?{' '}
          <button onClick={onSwitch} className="text-saffron font-semibold" data-testid="goto-login">
            Sign in
          </button>
        </p>
      </div>
    </motion.div>
  );
}
