import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Home, Star, Sun, ShoppingBag, User, Calendar, MapPin,
  Bell, ChevronRight, Clock, Package, Search, Filter,
  Plus, Minus, ShoppingCart, Heart, Settings, LogOut,
  CheckCircle, ArrowRight, Loader2, X, Menu
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { Toaster, toast } from 'sonner';

// 3D Animated Devotional SVG Icons
const BellIcon3D = ({ size = "w-8 h-8" }) => (
  <motion.svg viewBox="0 0 100 100" className={size} animate={{ rotate: [-3, 3, -3] }} transition={{ duration: 0.4, repeat: Infinity }}>
    <defs>
      <linearGradient id="bellGradD" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFD700" />
        <stop offset="100%" stopColor="#CD853F" />
      </linearGradient>
    </defs>
    <ellipse cx="50" cy="15" rx="5" ry="5" fill="#B8860B" />
    <path d="M45 15 L45 25 Q30 35 30 60 L70 60 Q70 35 55 25 L55 15" fill="url(#bellGradD)" />
    <ellipse cx="50" cy="60" rx="22" ry="8" fill="#CD853F" />
    <circle cx="50" cy="70" r="6" fill="#B8860B" />
  </motion.svg>
);

const ZodiacIcon3D = ({ size = "w-8 h-8" }) => (
  <motion.svg viewBox="0 0 100 100" className={size} animate={{ rotate: [0, 360] }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }}>
    <defs>
      <linearGradient id="zodiacGradD" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4B0082" />
        <stop offset="100%" stopColor="#9400D3" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="35" fill="none" stroke="url(#zodiacGradD)" strokeWidth="3" />
    <circle cx="50" cy="50" r="25" fill="none" stroke="#FFD700" strokeWidth="1" strokeDasharray="4 4" />
    <circle cx="50" cy="18" r="4" fill="#FFD700" />
    <circle cx="82" cy="50" r="4" fill="#FFD700" />
    <circle cx="50" cy="82" r="4" fill="#FFD700" />
    <circle cx="18" cy="50" r="4" fill="#FFD700" />
    <circle cx="50" cy="50" r="6" fill="#4B0082" />
  </motion.svg>
);

const TempleIcon3D = ({ size = "w-8 h-8" }) => (
  <motion.svg viewBox="0 0 100 100" className={size} animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity }}>
    <defs>
      <linearGradient id="templeGradD" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#DEB887" />
        <stop offset="100%" stopColor="#CD853F" />
      </linearGradient>
      <linearGradient id="roofGradD" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFD700" />
        <stop offset="100%" stopColor="#B8860B" />
      </linearGradient>
    </defs>
    <rect x="20" y="65" width="60" height="30" fill="url(#templeGradD)" />
    <rect x="28" y="45" width="44" height="20" fill="url(#templeGradD)" />
    <polygon points="50,10 78,45 22,45" fill="url(#roofGradD)" />
    <circle cx="50" cy="28" r="5" fill="#FFD700" />
    <rect x="40" y="70" width="20" height="25" fill="#4A3728" />
  </motion.svg>
);

const CartIcon3D = ({ size = "w-8 h-8" }) => (
  <motion.svg viewBox="0 0 100 100" className={size} animate={{ y: [0, -3, 0] }} transition={{ duration: 2, repeat: Infinity }}>
    <defs>
      <linearGradient id="cartGradD" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#DEB887" />
        <stop offset="100%" stopColor="#8B4513" />
      </linearGradient>
    </defs>
    <path d="M20 35 L30 75 L70 75 L80 35 Z" fill="url(#cartGradD)" stroke="#8B4513" strokeWidth="2" />
    <path d="M25 45 L75 45 M27 55 L73 55 M29 65 L71 65" stroke="#A0522D" strokeWidth="2" fill="none" />
    <ellipse cx="35" cy="28" rx="6" ry="8" fill="#FF6347" />
    <ellipse cx="50" cy="26" rx="5" ry="7" fill="#FFD700" />
    <ellipse cx="65" cy="28" rx="6" ry="8" fill="#32CD32" />
  </motion.svg>
);

// Check if desktop
const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isDesktop;
};

// Sidebar Navigation for Desktop
function Sidebar({ activeTab, setActiveTab, user }) {
  const { cartCount } = useCart();
  const { logout } = useAuth();
  
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'priests', icon: Star, label: 'Book Priests' },
    { id: 'astrology', icon: Sun, label: 'Astrology' },
    { id: 'shop', icon: ShoppingBag, label: 'Pooja Store' },
    { id: 'profile', icon: User, label: 'My Account' },
  ];

  return (
    <div className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-orange-100 flex flex-col z-40">
      {/* Logo */}
      <div className="p-6 border-b border-orange-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <ellipse cx="50" cy="85" rx="30" ry="8" fill="#B8860B" />
              <path d="M30 85 Q30 70 35 60 L65 60 Q70 70 70 85" fill="#FFD700" />
              <ellipse cx="50" cy="60" rx="18" ry="6" fill="#FFD700" />
              <path d="M50 55 Q45 40 50 25 Q55 40 50 55" fill="#FF9933" />
            </svg>
          </div>
          <span className="font-cinzel text-xl font-bold text-maroon">DIVINE</span>
        </div>
      </div>

      {/* User Info - Clickable to go to profile */}
      <button 
        onClick={() => setActiveTab('profile')}
        className="p-4 border-b border-orange-100 w-full text-left hover:bg-orange-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-saffron to-gold rounded-full flex items-center justify-center text-white font-cinzel">
            {user?.name?.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-gray-800 hover:text-saffron transition-colors">{user?.name}</p>
            <p className="text-xs text-gray-500">{user?.role}</p>
          </div>
        </div>
      </button>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === tab.id 
                ? 'bg-saffron text-white' 
                : 'text-gray-600 hover:bg-orange-50'
            }`}
            data-testid={`sidebar-${tab.id}`}
          >
            <div className="relative">
              <tab.icon className="w-5 h-5" />
              {tab.id === 'shop' && cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </div>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-orange-100">
        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
          data-testid="sidebar-logout"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

// Bottom Navigation Component for Mobile
function BottomNav({ activeTab, setActiveTab }) {
  const { cartCount } = useCart();
  
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'priests', icon: Star, label: 'Priests' },
    { id: 'astrology', icon: Sun, label: 'Astrology' },
    { id: 'shop', icon: ShoppingBag, label: 'Shop' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-orange-100 px-2 py-2 z-50 lg:hidden">
      <div className="flex justify-around items-center">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
              activeTab === tab.id ? 'text-saffron' : 'text-gray-400'
            }`}
            data-testid={`nav-${tab.id}`}
          >
            <div className="relative">
              <tab.icon className={`w-6 h-6 ${activeTab === tab.id ? 'stroke-[2.5]' : ''}`} />
              {tab.id === 'shop' && cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-saffron text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </div>
            <span className={`text-xs mt-1 ${activeTab === tab.id ? 'font-semibold' : ''}`}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Home Tab Content
function HomeTab({ setActiveTab, setSelectedPriest, isDesktop }) {
  const { user } = useAuth();
  const [priests, setPriests] = useState([]);
  const [festivals, setFestivals] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [priestsRes, festivalsRes, bookingsRes, ordersRes] = await Promise.all([
        api.get('/api/priests?limit=3'),
        api.get('/api/festivals'),
        api.get('/api/bookings'),
        api.get('/api/orders')
      ]);
      setPriests(priestsRes.data.priests || []);
      setFestivals((festivalsRes.data.festivals || []).slice(0, 3));
      setBookings((bookingsRes.data.bookings || []).slice(0, 3));
      setOrders((ordersRes.data.orders || []).slice(0, 3));
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`pb-24 lg:pb-8 ${isDesktop ? 'px-8' : 'px-4'}`}>
      {/* Header - Name is clickable */}
      <div className="pt-4 pb-6">
        <p className="text-gray-500 text-sm">Namaste,</p>
        <button 
          onClick={() => setActiveTab('profile')}
          className="text-left hover:opacity-80 transition-opacity"
          data-testid="home-user-name"
        >
          <h1 className="font-cinzel text-2xl lg:text-3xl font-bold text-maroon hover:text-saffron transition-colors">
            {user?.name || 'Devotee'}
          </h1>
        </button>
      </div>

      {/* Quick Actions with 3D Icons */}
      <div className={`grid ${isDesktop ? 'grid-cols-4 gap-6' : 'grid-cols-4 gap-3'} mb-8`}>
        {[
          { Icon: BellIcon3D, label: 'Priests', tab: 'priests' },
          { Icon: ZodiacIcon3D, label: 'Horoscope', tab: 'astrology' },
          { Icon: CartIcon3D, label: 'Shop', tab: 'shop' },
          { Icon: TempleIcon3D, label: 'Temples', tab: 'temples' },
        ].map((item) => (
          <button
            key={item.label}
            onClick={() => setActiveTab(item.tab)}
            className={`bg-white rounded-2xl ${isDesktop ? 'p-6' : 'p-4'} shadow-sm border border-orange-50 active:scale-95 transition-transform hover:shadow-md flex flex-col items-center justify-center`}
            data-testid={`quick-${item.tab}`}
          >
            <item.Icon size={isDesktop ? "w-12 h-12" : "w-8 h-8"} />
            <span className={`${isDesktop ? 'text-base mt-2' : 'text-xs mt-1'} text-gray-600`}>{item.label}</span>
          </button>
        ))}
      </div>

      <div className={`${isDesktop ? 'grid grid-cols-2 gap-8' : ''}`}>
        {/* Upcoming Festivals */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-cinzel text-lg font-semibold text-maroon">Upcoming Festivals</h2>
          </div>
          <div className={`${isDesktop ? 'grid grid-cols-1 gap-4' : 'flex gap-3 overflow-x-auto pb-2 -mx-4 px-4'} scrollbar-hide`}>
            {festivals.map((festival) => (
              <div 
                key={festival.id}
                className={`${isDesktop ? '' : 'flex-shrink-0 w-40'} bg-gradient-to-br from-saffron to-gold rounded-2xl p-4 text-white`}
              >
                <Calendar className="w-5 h-5 mb-2 opacity-80" />
                <p className="font-semibold text-sm">{festival.name}</p>
                <p className="text-xs opacity-80">{festival.date}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Featured Priests */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-cinzel text-lg font-semibold text-maroon">Featured Priests</h2>
            <button onClick={() => setActiveTab('priests')} className="text-saffron text-sm">
              See all
            </button>
          </div>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-saffron animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              {priests.map((priest) => (
                <button
                  key={priest.id}
                  onClick={() => { setSelectedPriest(priest); setActiveTab('priest-detail'); }}
                  className="w-full bg-white rounded-2xl p-4 shadow-sm border border-orange-50 flex items-center gap-4 active:scale-[0.98] transition-transform text-left hover:shadow-md"
                  data-testid={`priest-${priest.id}`}
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-saffron to-gold rounded-full flex items-center justify-center text-white text-xl font-cinzel flex-shrink-0">
                    {priest.user_name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{priest.user_name}</p>
                    <p className="text-sm text-gray-500 truncate">{priest.specializations?.slice(0, 2).join(', ')}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Star className="w-3 h-3 text-gold fill-gold" />
                      <span className="text-xs text-gray-600">{priest.rating} ({priest.total_reviews})</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* My Bookings & My Orders Row - At Bottom */}
      <div className={`${isDesktop ? 'grid grid-cols-2 gap-8' : ''} mt-4`}>
        {/* My Bookings */}
        <div className="mb-6 lg:mb-0">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-cinzel text-lg font-semibold text-maroon">My Bookings</h2>
          </div>
          {bookings.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center border border-orange-50">
              <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No bookings yet</p>
              <button 
                onClick={() => setActiveTab('priests')}
                className="mt-3 text-saffron text-sm font-medium hover:underline"
              >
                Book a Priest
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {bookings.map((booking) => (
                <div key={booking.id} className="bg-white rounded-xl p-4 border border-orange-50 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-800">{booking.service_name}</p>
                      <p className="text-sm text-gray-500">{booking.priest_name}</p>
                      {booking.scheduled_date && (
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(booking.scheduled_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      booking.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Orders */}
        <div className="mb-6 lg:mb-0">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-cinzel text-lg font-semibold text-maroon">My Orders</h2>
          </div>
          {orders.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center border border-orange-50">
              <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No orders yet</p>
              <button 
                onClick={() => setActiveTab('shop')}
                className="mt-3 text-saffron text-sm font-medium hover:underline"
              >
                Visit Pooja Store
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {orders.map((order) => (
                <div key={order.id} className="bg-white rounded-xl p-4 border border-orange-50 shadow-sm">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <Package className="w-5 h-5 text-saffron" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">Order #{order.id?.slice(-6)}</p>
                        <p className="text-sm text-gray-500">₹{order.total_amount}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                      order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                      order.status === 'processing' ? 'bg-purple-100 text-purple-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Priests Tab Content
function PriestsTab({ setActiveTab, setSelectedPriest, isDesktop }) {
  const [priests, setPriests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchPriests();
  }, [filter]);

  const fetchPriests = async () => {
    try {
      const params = filter ? `?specialization=${filter}` : '';
      const res = await api.get(`/api/priests${params}`);
      setPriests(res.data.priests || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`pb-24 lg:pb-8 ${isDesktop ? 'px-8' : 'px-4'}`}>
      <div className="pt-4 pb-4">
        <h1 className="font-cinzel text-2xl lg:text-3xl font-bold text-maroon mb-4">Book a Priest</h1>
        
        {/* Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {['All', 'Vedic Rituals', 'Homam', 'Pooja', 'Ceremony'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f === 'All' ? '' : f)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                (f === 'All' && !filter) || filter === f
                  ? 'bg-saffron text-white'
                  : 'bg-white text-gray-600 border border-orange-100 hover:bg-orange-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-saffron animate-spin" />
        </div>
      ) : (
        <div className={`${isDesktop ? 'grid grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-3'}`}>
          {priests.map((priest) => (
            <motion.button
              key={priest.id}
              onClick={() => { setSelectedPriest(priest); setActiveTab('priest-detail'); }}
              className="w-full bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-orange-50 text-left hover:shadow-md transition-shadow"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-start gap-4">
                <div className={`${isDesktop ? 'w-20 h-20' : 'w-16 h-16'} bg-gradient-to-br from-saffron to-gold rounded-2xl flex items-center justify-center text-white text-2xl font-cinzel flex-shrink-0`}>
                  {priest.user_name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-800">{priest.user_name}</p>
                    {priest.is_verified && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mb-2">{priest.experience_years} years experience</p>
                  <div className="flex flex-wrap gap-1">
                    {priest.specializations?.slice(0, 2).map((s, i) => (
                      <span key={i} className="text-xs bg-orange-50 text-saffron-dark px-2 py-0.5 rounded-full">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 mb-1">
                    <Star className="w-4 h-4 text-gold fill-gold" />
                    <span className="font-semibold">{priest.rating}</span>
                  </div>
                  <p className="text-xs text-gray-400">{priest.total_reviews} reviews</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}

// Priest Detail View
function PriestDetailView({ priest, onBack, isDesktop }) {
  const { user } = useAuth();
  const [selectedService, setSelectedService] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBook = async () => {
    if (!selectedService || !bookingDate) {
      toast.error('Please select service and date');
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/bookings', {
        priest_id: priest.id,
        service_name: selectedService.name,
        booking_date: new Date(bookingDate).toISOString(),
        booking_type: 'online'
      });
      toast.success('Booking created successfully!');
      onBack();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`pb-24 lg:pb-8 ${isDesktop ? 'px-8' : ''}`}>
      {/* Header with back button */}
      <div className="sticky top-0 bg-white/90 backdrop-blur-sm z-10 px-4 py-3 border-b border-orange-50">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-maroon">
          <ChevronRight className="w-5 h-5 rotate-180" />
          <span>Back to Priests</span>
        </button>
      </div>

      <div className={`${isDesktop ? 'grid grid-cols-3 gap-8 pt-6' : 'px-4 pt-4'}`}>
        {/* Priest Info */}
        <div className={`${isDesktop ? 'col-span-2' : ''}`}>
          <div className={`${isDesktop ? 'flex items-start gap-6' : 'text-center'} mb-6`}>
            <div className={`${isDesktop ? 'w-32 h-32' : 'w-24 h-24 mx-auto'} bg-gradient-to-br from-saffron to-gold rounded-full flex items-center justify-center text-white text-4xl font-cinzel mb-4`}>
              {priest.user_name?.charAt(0)}
            </div>
            <div className={`${isDesktop ? 'text-left' : ''}`}>
              <h1 className="font-cinzel text-xl lg:text-2xl font-bold text-maroon">{priest.user_name}</h1>
              <div className={`flex items-center ${isDesktop ? '' : 'justify-center'} gap-2 mt-2`}>
                <Star className="w-4 h-4 text-gold fill-gold" />
                <span className="text-gray-600">{priest.rating} ({priest.total_reviews} reviews)</span>
              </div>
              <p className="text-gray-500 text-sm mt-2">{priest.experience_years} years experience</p>
              <div className={`flex flex-wrap ${isDesktop ? '' : 'justify-center'} gap-2 mt-3`}>
                {priest.specializations?.map((s, i) => (
                  <span key={i} className="text-xs bg-orange-100 text-saffron-dark px-3 py-1 rounded-full">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="bg-orange-50 rounded-2xl p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">About</h3>
            <p className="text-gray-600 text-sm">{priest.bio}</p>
          </div>

          {/* Services */}
          <h2 className="font-cinzel text-lg font-semibold text-maroon mb-3">Services</h2>
          <div className={`${isDesktop ? 'grid grid-cols-2 gap-4' : 'space-y-3'} mb-6`}>
            {priest.services?.map((service, i) => (
              <button
                key={i}
                onClick={() => setSelectedService(service)}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                  selectedService?.name === service.name
                    ? 'border-saffron bg-orange-50'
                    : 'border-gray-100 bg-white hover:border-orange-200'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <p className="font-semibold text-gray-800">{service.name}</p>
                  <p className="text-saffron font-bold">₹{service.price}</p>
                </div>
                <p className="text-gray-500 text-sm mb-2">{service.description}</p>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  {service.duration_minutes} mins
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Booking Form - Sidebar on Desktop */}
        <div className={`${isDesktop ? 'col-span-1' : ''}`}>
          {selectedService && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white rounded-2xl p-6 border border-orange-100 ${isDesktop ? 'sticky top-20' : 'mb-6'}`}
            >
              <h3 className="font-cinzel text-lg font-semibold text-maroon mb-4">Book Service</h3>
              <div className="bg-orange-50 rounded-xl p-4 mb-4">
                <p className="text-sm text-gray-600">Selected Service</p>
                <p className="font-semibold text-gray-800">{selectedService.name}</p>
                <p className="text-saffron font-bold text-xl">₹{selectedService.price}</p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Date & Time</label>
                <input
                  type="datetime-local"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full border border-orange-200 rounded-xl px-4 py-3 focus:border-saffron focus:ring-2 focus:ring-saffron/20 outline-none"
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
              <button
                onClick={handleBook}
                disabled={loading}
                className="w-full bg-saffron hover:bg-saffron-dark text-white rounded-full py-4 font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Confirm Booking</>}
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

// Astrology Tab
function AstrologyTab({ isDesktop }) {
  const [signs] = useState([
    { name: 'Aries', symbol: '♈', dates: 'Mar 21 - Apr 19' },
    { name: 'Taurus', symbol: '♉', dates: 'Apr 20 - May 20' },
    { name: 'Gemini', symbol: '♊', dates: 'May 21 - Jun 20' },
    { name: 'Cancer', symbol: '♋', dates: 'Jun 21 - Jul 22' },
    { name: 'Leo', symbol: '♌', dates: 'Jul 23 - Aug 22' },
    { name: 'Virgo', symbol: '♍', dates: 'Aug 23 - Sep 22' },
    { name: 'Libra', symbol: '♎', dates: 'Sep 23 - Oct 22' },
    { name: 'Scorpio', symbol: '♏', dates: 'Oct 23 - Nov 21' },
    { name: 'Sagittarius', symbol: '♐', dates: 'Nov 22 - Dec 21' },
    { name: 'Capricorn', symbol: '♑', dates: 'Dec 22 - Jan 19' },
    { name: 'Aquarius', symbol: '♒', dates: 'Jan 20 - Feb 18' },
    { name: 'Pisces', symbol: '♓', dates: 'Feb 19 - Mar 20' },
  ]);
  const [selectedSign, setSelectedSign] = useState(null);
  const [horoscope, setHoroscope] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchHoroscope = async (sign) => {
    setSelectedSign(sign);
    setLoading(true);
    try {
      const res = await api.get(`/api/horoscope/daily/${sign.name.toLowerCase()}`);
      setHoroscope(res.data);
    } catch (error) {
      toast.error('Failed to fetch horoscope');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`pb-24 lg:pb-8 min-h-screen bg-gradient-to-b from-[#0F172A] to-[#1E293B] ${isDesktop ? 'px-8' : 'px-4'}`}>
      <div className="pt-6">
        <h1 className="font-cinzel text-2xl lg:text-3xl font-bold text-white mb-2">Daily Horoscope</h1>
        <p className="text-gray-400 text-sm mb-6">Select your zodiac sign</p>

        <div className={`${isDesktop ? 'grid grid-cols-2 gap-8' : ''}`}>
          {/* Zodiac Grid */}
          <div className={`grid ${isDesktop ? 'grid-cols-4' : 'grid-cols-4'} gap-3 mb-6`}>
            {signs.map((sign) => (
              <button
                key={sign.name}
                onClick={() => fetchHoroscope(sign)}
                className={`p-3 lg:p-4 rounded-2xl text-center transition-all hover:scale-105 ${
                  selectedSign?.name === sign.name
                    ? 'bg-indigo-500 ring-2 ring-indigo-400'
                    : 'bg-slate-800/50 hover:bg-slate-700/50'
                }`}
              >
                <span className={`${isDesktop ? 'text-3xl' : 'text-2xl'} block mb-1`}>{sign.symbol}</span>
                <span className="text-xs text-gray-300">{sign.name}</span>
              </button>
            ))}
          </div>

          {/* Horoscope Result */}
          <div>
            {loading && (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              </div>
            )}

            {horoscope && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-800/50 rounded-2xl p-6"
              >
                <div className="text-center mb-4">
                  <span className="text-5xl">{selectedSign?.symbol}</span>
                  <h2 className="font-cinzel text-xl text-white mt-2">{horoscope.zodiac_sign}</h2>
                </div>
                <p className="text-gray-300 text-center mb-6">{horoscope.daily_prediction}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-700/50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400">Lucky Number</p>
                    <p className="text-xl text-white font-bold">{horoscope.lucky_number}</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400">Lucky Color</p>
                    <p className="text-lg text-white">{horoscope.lucky_color}</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400">Mood</p>
                    <p className="text-lg text-white">{horoscope.mood}</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400">Compatibility</p>
                    <p className="text-lg text-white">{horoscope.compatibility}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {!horoscope && !loading && (
              <div className="text-center py-12">
                <Sun className="w-16 h-16 text-indigo-400/30 mx-auto mb-4" />
                <p className="text-gray-400">Select a sign to see your horoscope</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Shop Tab
function ShopTab({ isDesktop }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { addToCart } = useCart();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/api/products');
      setProducts(res.data.products || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (productId) => {
    const success = await addToCart(productId, 1);
    if (success) {
      toast.success('Added to cart!');
    } else {
      toast.error('Failed to add');
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`pb-24 lg:pb-8 ${isDesktop ? 'px-8' : 'px-4'}`}>
      <div className="pt-4 pb-4">
        <h1 className="font-cinzel text-2xl lg:text-3xl font-bold text-maroon mb-4">Pooja Store</h1>
        
        {/* Search */}
        <div className={`relative ${isDesktop ? 'max-w-md' : ''}`}>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full bg-white border border-orange-100 rounded-xl pl-12 pr-4 py-3 focus:border-saffron focus:ring-2 focus:ring-saffron/20 outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-saffron animate-spin" />
        </div>
      ) : (
        <div className={`grid ${isDesktop ? 'grid-cols-4 xl:grid-cols-5 gap-6' : 'grid-cols-2 gap-3'}`}>
          {filteredProducts.map((product) => (
            <motion.div
              key={product.id}
              className="bg-white rounded-2xl p-3 lg:p-4 shadow-sm border border-orange-50 hover:shadow-md transition-shadow"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className={`aspect-square bg-orange-50 rounded-xl mb-3 flex items-center justify-center overflow-hidden`}>
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <ShoppingBag className="w-10 h-10 text-saffron/30" />
                )}
              </div>
              <p className={`font-medium ${isDesktop ? 'text-base' : 'text-sm'} text-gray-800 line-clamp-2 mb-1`}>{product.name}</p>
              <div className="flex items-center gap-1 mb-2">
                <Star className="w-3 h-3 text-gold fill-gold" />
                <span className="text-xs text-gray-500">{product.rating}</span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-saffron font-bold">₹{product.price}</p>
                <button
                  onClick={() => handleAddToCart(product.id)}
                  className="w-8 h-8 lg:w-10 lg:h-10 bg-saffron hover:bg-saffron-dark text-white rounded-full flex items-center justify-center transition-colors"
                >
                  <Plus className="w-4 h-4 lg:w-5 lg:h-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// Profile Tab
function ProfileTab({ isDesktop }) {
  const { user, logout, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    pincode: user?.pincode || '',
    date_of_birth: user?.date_of_birth || '',
    gotra: user?.gotra || '',
    nakshatra: user?.nakshatra || ''
  });

  useEffect(() => {
    if (user) {
      setEditForm({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        pincode: user.pincode || '',
        date_of_birth: user.date_of_birth || '',
        gotra: user.gotra || '',
        nakshatra: user.nakshatra || ''
      });
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await api.put('/api/users/profile', editForm);
      updateUser({ ...user, ...res.data.user });
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`pb-24 lg:pb-8 ${isDesktop ? 'px-8' : 'px-4'}`}>
      <div className="pt-4 pb-6">
        {/* Profile Header */}
        <div className={`${isDesktop ? 'flex items-center justify-between' : ''} mb-6`}>
          <div className={`${isDesktop ? 'flex items-center gap-6' : 'flex items-center gap-4'}`}>
            <div className={`${isDesktop ? 'w-20 h-20' : 'w-16 h-16'} bg-gradient-to-br from-saffron to-gold rounded-full flex items-center justify-center text-white text-2xl lg:text-3xl font-cinzel`}>
              {user?.name?.charAt(0)}
            </div>
            <div>
              <h1 className="font-cinzel text-xl lg:text-2xl font-bold text-maroon">{user?.name}</h1>
              <p className="text-gray-500 text-sm">{user?.email}</p>
              <span className="text-xs bg-orange-100 text-saffron-dark px-2 py-0.5 rounded-full">
                {user?.role}
              </span>
            </div>
          </div>
          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              className={`${isDesktop ? '' : 'mt-4 w-full'} flex items-center justify-center gap-2 px-4 py-2 bg-saffron text-white rounded-xl hover:bg-saffron-dark transition-colors`}
              data-testid="edit-profile-btn"
            >
              <Settings className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>

        {/* Edit Profile Form */}
        {isEditing && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-orange-100 p-6 mb-6"
          >
            <h2 className="font-cinzel text-lg font-semibold text-maroon mb-4">Edit Profile</h2>
            
            <div className={`grid ${isDesktop ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-saffron focus:border-transparent"
                  placeholder="Your full name"
                  data-testid="profile-name-input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-saffron focus:border-transparent"
                  placeholder="+91 XXXXX XXXXX"
                  data-testid="profile-phone-input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={editForm.date_of_birth}
                  onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })}
                  className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-saffron focus:border-transparent"
                  data-testid="profile-dob-input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gotra</label>
                <input
                  type="text"
                  value={editForm.gotra}
                  onChange={(e) => setEditForm({ ...editForm, gotra: e.target.value })}
                  className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-saffron focus:border-transparent"
                  placeholder="E.g., Bharadwaja, Kashyapa"
                  data-testid="profile-gotra-input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nakshatra</label>
                <select
                  value={editForm.nakshatra}
                  onChange={(e) => setEditForm({ ...editForm, nakshatra: e.target.value })}
                  className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-saffron focus:border-transparent"
                  data-testid="profile-nakshatra-input"
                >
                  <option value="">Select Nakshatra</option>
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
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  value={editForm.city}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                  className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-saffron focus:border-transparent"
                  placeholder="Your city"
                  data-testid="profile-city-input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                <input
                  type="text"
                  value={editForm.pincode}
                  onChange={(e) => setEditForm({ ...editForm, pincode: e.target.value })}
                  className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-saffron focus:border-transparent"
                  placeholder="XXXXXX"
                  data-testid="profile-pincode-input"
                />
              </div>
              
              <div className={isDesktop ? 'col-span-2' : ''}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
                <textarea
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-saffron focus:border-transparent resize-none"
                  placeholder="Your complete address"
                  data-testid="profile-address-input"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-saffron text-white rounded-xl hover:bg-saffron-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                data-testid="save-profile-btn"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* Profile Details Card (when not editing) */}
        {!isEditing && (user?.phone || user?.gotra || user?.nakshatra || user?.city) && (
          <div className="bg-white rounded-2xl border border-orange-100 p-6 mb-6">
            <h2 className="font-cinzel text-lg font-semibold text-maroon mb-4">Profile Details</h2>
            <div className={`grid ${isDesktop ? 'grid-cols-3' : 'grid-cols-2'} gap-4`}>
              {user?.phone && (
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-gray-800 font-medium">{user.phone}</p>
                </div>
              )}
              {user?.date_of_birth && (
                <div>
                  <p className="text-xs text-gray-500">Date of Birth</p>
                  <p className="text-gray-800 font-medium">{new Date(user.date_of_birth).toLocaleDateString()}</p>
                </div>
              )}
              {user?.gotra && (
                <div>
                  <p className="text-xs text-gray-500">Gotra</p>
                  <p className="text-gray-800 font-medium">{user.gotra}</p>
                </div>
              )}
              {user?.nakshatra && (
                <div>
                  <p className="text-xs text-gray-500">Nakshatra</p>
                  <p className="text-gray-800 font-medium">{user.nakshatra}</p>
                </div>
              )}
              {user?.city && (
                <div>
                  <p className="text-xs text-gray-500">City</p>
                  <p className="text-gray-800 font-medium">{user.city}</p>
                </div>
              )}
              {user?.pincode && (
                <div>
                  <p className="text-xs text-gray-500">Pincode</p>
                  <p className="text-gray-800 font-medium">{user.pincode}</p>
                </div>
              )}
            </div>
            {user?.address && (
              <div className="mt-4">
                <p className="text-xs text-gray-500">Address</p>
                <p className="text-gray-800">{user.address}</p>
              </div>
            )}
          </div>
        )}

        {/* Actions - Only show on mobile */}
        {!isDesktop && (
          <div className="space-y-3">
            <button 
              onClick={logout}
              className="w-full bg-red-50 rounded-xl p-4 flex items-center justify-center gap-2 text-red-600"
              data-testid="logout-button"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Main Dashboard Component
export default function DevoteeDashboard() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedPriest, setSelectedPriest] = useState(null);
  const { user } = useAuth();
  const isDesktop = useIsDesktop();

  // Handle priest detail view
  if (activeTab === 'priest-detail' && selectedPriest) {
    return (
      <div className={`min-h-screen bg-gradient-to-b from-cream to-parchment ${isDesktop ? 'lg:pl-64' : ''}`}>
        <Toaster position="top-center" richColors />
        {isDesktop && <Sidebar activeTab="priests" setActiveTab={setActiveTab} user={user} />}
        <PriestDetailView 
          priest={selectedPriest} 
          onBack={() => { setSelectedPriest(null); setActiveTab('priests'); }}
          isDesktop={isDesktop}
        />
        {!isDesktop && <BottomNav activeTab="priests" setActiveTab={setActiveTab} />}
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-b from-cream to-parchment ${isDesktop ? 'lg:pl-64' : ''}`}>
      <Toaster position="top-center" richColors />
      
      {isDesktop && <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} />}
      
      <div className={activeTab === 'astrology' ? '' : ''}>
        {activeTab === 'home' && (
          <HomeTab setActiveTab={setActiveTab} setSelectedPriest={setSelectedPriest} isDesktop={isDesktop} />
        )}
        {activeTab === 'priests' && (
          <PriestsTab setActiveTab={setActiveTab} setSelectedPriest={setSelectedPriest} isDesktop={isDesktop} />
        )}
        {activeTab === 'astrology' && <AstrologyTab isDesktop={isDesktop} />}
        {activeTab === 'shop' && <ShopTab isDesktop={isDesktop} />}
        {activeTab === 'profile' && <ProfileTab isDesktop={isDesktop} />}
      </div>
      
      {!isDesktop && <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />}
    </div>
  );
}
