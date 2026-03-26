import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, Calendar, ShoppingBag, User, Star, Menu, X, 
  LogOut, Settings, ShoppingCart, Sun, Moon as MoonIcon
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

export function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false);
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-orange-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2" data-testid="logo-link">
            <img src="/temple-logo.png" alt="Divine Logo" className="w-9 h-9 rounded-lg object-cover" />
            <span className="font-cinzel text-xl font-bold text-maroon">Divine</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/priests" className="text-gray-700 hover:text-saffron transition-colors font-medium" data-testid="nav-priests">
              Book Priests
            </Link>
            <Link to="/astrology" className="text-gray-700 hover:text-saffron transition-colors font-medium" data-testid="nav-astrology">
              Astrology
            </Link>
            <Link to="/marketplace" className="text-gray-700 hover:text-saffron transition-colors font-medium" data-testid="nav-marketplace">
              Marketplace
            </Link>
            <Link to="/festivals" className="text-gray-700 hover:text-saffron transition-colors font-medium" data-testid="nav-festivals">
              Festivals
            </Link>
            <Link to="/temples" className="text-gray-700 hover:text-saffron transition-colors font-medium" data-testid="nav-temples">
              Temples
            </Link>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {user && (
              <Link to="/cart" className="relative p-2 hover:bg-orange-50 rounded-full transition-colors" data-testid="cart-button">
                <ShoppingCart className="w-5 h-5 text-gray-700" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-saffron text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}

            {user ? (
              <div className="relative group">
                <button className="flex items-center gap-2 px-3 py-2 rounded-full bg-orange-50 hover:bg-orange-100 transition-colors" data-testid="user-menu-button">
                  <div className="w-8 h-8 bg-saffron rounded-full flex items-center justify-center text-white font-medium">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:block font-medium text-gray-700">{user.name?.split(' ')[0]}</span>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-orange-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="p-2">
                    <Link to="/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-orange-50 text-gray-700" data-testid="dashboard-link">
                      <User className="w-4 h-4" />
                      Dashboard
                    </Link>
                    <Link to="/profile" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-orange-50 text-gray-700" data-testid="profile-link">
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                    <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 text-red-600" data-testid="logout-button">
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="px-4 py-2 text-gray-700 hover:text-saffron font-medium" data-testid="login-link">
                  Login
                </Link>
                <Link to="/register" className="btn-primary text-sm px-4 py-2" data-testid="register-link">
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2 hover:bg-orange-50 rounded-lg" data-testid="mobile-menu-toggle">
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-white border-b border-orange-100"
        >
          <div className="px-4 py-4 space-y-2">
            <Link to="/priests" onClick={() => setIsOpen(false)} className="block px-4 py-3 rounded-lg hover:bg-orange-50 font-medium">
              Book Priests
            </Link>
            <Link to="/astrology" onClick={() => setIsOpen(false)} className="block px-4 py-3 rounded-lg hover:bg-orange-50 font-medium">
              Astrology
            </Link>
            <Link to="/marketplace" onClick={() => setIsOpen(false)} className="block px-4 py-3 rounded-lg hover:bg-orange-50 font-medium">
              Marketplace
            </Link>
            <Link to="/festivals" onClick={() => setIsOpen(false)} className="block px-4 py-3 rounded-lg hover:bg-orange-50 font-medium">
              Festivals
            </Link>
            <Link to="/temples" onClick={() => setIsOpen(false)} className="block px-4 py-3 rounded-lg hover:bg-orange-50 font-medium">
              Temples
            </Link>
          </div>
        </motion.div>
      )}
    </nav>
  );
}

export function BottomNav() {
  const { user } = useAuth();
  const { cartCount } = useCart();

  return (
    <div className="bottom-nav">
      <div className="flex justify-around items-center">
        <Link to="/" className="flex flex-col items-center gap-1 text-gray-600 hover:text-saffron" data-testid="bottom-nav-home">
          <Home className="w-5 h-5" />
          <span className="text-xs">Home</span>
        </Link>
        <Link to="/priests" className="flex flex-col items-center gap-1 text-gray-600 hover:text-saffron" data-testid="bottom-nav-priests">
          <Star className="w-5 h-5" />
          <span className="text-xs">Priests</span>
        </Link>
        <Link to="/astrology" className="flex flex-col items-center gap-1 text-gray-600 hover:text-saffron" data-testid="bottom-nav-astrology">
          <Sun className="w-5 h-5" />
          <span className="text-xs">Astrology</span>
        </Link>
        <Link to="/marketplace" className="relative flex flex-col items-center gap-1 text-gray-600 hover:text-saffron" data-testid="bottom-nav-marketplace">
          <ShoppingBag className="w-5 h-5" />
          <span className="text-xs">Shop</span>
          {cartCount > 0 && (
            <span className="absolute -top-1 right-2 bg-saffron text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </Link>
        <Link to={user ? "/dashboard" : "/login"} className="flex flex-col items-center gap-1 text-gray-600 hover:text-saffron" data-testid="bottom-nav-profile">
          <User className="w-5 h-5" />
          <span className="text-xs">{user ? 'Profile' : 'Login'}</span>
        </Link>
      </div>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="bg-maroon text-white py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-3xl">🙏</span>
              <span className="font-cinzel text-xl font-bold">Divine</span>
            </div>
            <p className="text-gray-300 text-sm">
              Your complete spiritual ecosystem for Hindu rituals, astrology, and sacred services.
            </p>
          </div>
          
          <div>
            <h4 className="font-cinzel font-semibold mb-4">Services</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><Link to="/priests" className="hover:text-gold transition-colors">Book Priests</Link></li>
              <li><Link to="/astrology" className="hover:text-gold transition-colors">Horoscope</Link></li>
              <li><Link to="/marketplace" className="hover:text-gold transition-colors">Pooja Store</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-cinzel font-semibold mb-4">Explore</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><Link to="/festivals" className="hover:text-gold transition-colors">Festival Calendar</Link></li>
              <li><Link to="/temples" className="hover:text-gold transition-colors">Temple Directory</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-cinzel font-semibold mb-4">Contact</h4>
            <p className="text-sm text-gray-300">
              support@divineapp.com<br />
              +91 98765 43210
            </p>
          </div>
        </div>
        
        <div className="border-t border-white/20 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>© 2025 Divine App. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
