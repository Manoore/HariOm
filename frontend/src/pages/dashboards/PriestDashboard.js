import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, Calendar, Settings, LogOut, ChevronRight, Clock,
  CheckCircle, XCircle, User, Star, Bell, Loader2, BookOpen,
  Video, FileText, DollarSign, Users, TrendingUp, Plus, Edit,
  Trash2, Play, Square, Eye, Heart, CalendarDays, BarChart3,
  Save, X, AlertCircle, Shield, MapPin, Phone, Mail, Camera,
  Image, Upload, MessageSquare, ThumbsUp, Sun, Moon, Sunrise, Sunset,
  IndianRupee, Filter, Search, ChevronLeft, Award, Briefcase
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { Toaster, toast } from 'sonner';

// Role display configuration
const ROLE_CONFIG = {
  priest: { label: 'Priest', color: 'bg-maroon', icon: Star },
  admin: { label: 'Admin', color: 'bg-purple-600', icon: Shield },
  devotee: { label: 'Devotee', color: 'bg-saffron', icon: User },
  astrologer: { label: 'Astrologer', color: 'bg-indigo-600', icon: Star },
  shop_owner: { label: 'Shop Owner', color: 'bg-green-600', icon: Users },
};

// Extended Tab Components
const tabs = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'bookings', label: 'Bookings', icon: Calendar },
  { id: 'services', label: 'Services', icon: Briefcase },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'portfolio', label: 'Portfolio', icon: Image },
  { id: 'panchang', label: 'Panchang', icon: Sun },
  { id: 'earnings', label: 'Earnings', icon: IndianRupee },
  { id: 'classes', label: 'Classes', icon: BookOpen },
  { id: 'streams', label: 'Live', icon: Video },
];

// Days of week
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Specialization options
const SPECIALIZATIONS = [
  'Vedic Rituals', 'Satyanarayan Pooja', 'Griha Pravesh', 'Navagraha Shanti',
  'Rudrabhishekam', 'Ganesh Pooja', 'Lakshmi Pooja', 'Durga Pooja',
  'Marriage Ceremonies', 'Last Rites', 'Homam/Havan', 'Vastu Shanti',
  'Mundan', 'Naming Ceremony', 'Thread Ceremony', 'Astrology Consultation'
];

// Languages
const LANGUAGES = ['Hindi', 'Sanskrit', 'Telugu', 'Tamil', 'Kannada', 'Malayalam', 'Bengali', 'Marathi', 'Gujarati', 'English'];

export default function PriestDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [welcomeShown, setWelcomeShown] = useState(false);

  // Data states
  const [analytics, setAnalytics] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [classes, setClasses] = useState([]);
  const [availability, setAvailability] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [services, setServices] = useState([]);
  const [panchang, setPanchang] = useState(null);
  const [festivals, setFestivals] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [priestProfile, setPriestProfile] = useState(null);
  const [streams, setStreams] = useState([]);

  // Show welcome toast on first load
  useEffect(() => {
    if (user && !welcomeShown) {
      const roleConfig = ROLE_CONFIG[user.role] || ROLE_CONFIG.priest;
      toast.success(`Welcome, ${user.name}!`, {
        description: `You're logged in as ${roleConfig.label}`,
        duration: 4000,
      });
      setWelcomeShown(true);
    }
  }, [user, welcomeShown]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, bookingsRes, classesRes, availabilityRes, streamsRes, panchangRes, festivalsRes] = await Promise.all([
        api.get('/api/priest/analytics').catch(() => ({ data: null })),
        api.get('/api/priest/bookings').catch(() => ({ data: { bookings: [] } })),
        api.get('/api/priest/classes').catch(() => ({ data: { classes: [] } })),
        api.get('/api/priest/availability').catch(() => ({ data: null })),
        api.get('/api/priest/streams').catch(() => ({ data: { streams: [] } })),
        api.get('/api/panchang/today').catch(() => ({ data: null })),
        api.get('/api/festivals/upcoming').catch(() => ({ data: { festivals: [] } })),
      ]);

      setAnalytics(analyticsRes.data);
      setBookings(bookingsRes.data?.bookings || []);
      setClasses(classesRes.data?.classes || []);
      setAvailability(availabilityRes.data);
      setStreams(streamsRes.data?.streams || []);
      setPanchang(panchangRes.data);
      setFestivals(festivalsRes.data?.festivals || []);
      
      // Fetch priest profile
      try {
        const profileRes = await api.get('/api/priest/profile');
        setPriestProfile(profileRes.data);
      } catch {
        setPriestProfile({
          specializations: [],
          languages: ['Hindi', 'Sanskrit'],
          experience_years: 5,
          bio: '',
          work_locations: [],
          service_areas: [],
          base_price: 1100,
          profile_photo: null
        });
      }

      // Fetch reviews
      try {
        const reviewsRes = await api.get('/api/priest/reviews');
        setReviews(reviewsRes.data?.reviews || []);
      } catch {
        setReviews([]);
      }

      // Fetch portfolio
      try {
        const portfolioRes = await api.get('/api/priest/portfolio');
        setPortfolio(portfolioRes.data?.items || []);
      } catch {
        setPortfolio([]);
      }

      // Fetch services
      try {
        const servicesRes = await api.get('/api/priest/services');
        setServices(servicesRes.data?.services || []);
      } catch {
        setServices([]);
      }

      // Fetch earnings
      try {
        const earningsRes = await api.get('/api/priest/earnings');
        setEarnings(earningsRes.data);
      } catch {
        setEarnings({
          total_earnings: analyticsRes.data?.stats?.total_earnings || 0,
          monthly_earnings: analyticsRes.data?.stats?.monthly_earnings || 0,
          pending_payouts: 0,
          transactions: []
        });
      }

    } catch (error) {
      console.error('Dashboard error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId, status) => {
    try {
      await api.put(`/api/bookings/${bookingId}/status?status=${status}`);
      toast.success('Booking updated!');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to update booking');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeTab analytics={analytics} bookings={bookings} panchang={panchang} festivals={festivals} updateStatus={updateBookingStatus} />;
      case 'profile':
        return <ProfileTab profile={priestProfile} user={user} onRefresh={fetchDashboardData} />;
      case 'bookings':
        return <BookingsTab bookings={bookings} updateStatus={updateBookingStatus} />;
      case 'services':
        return <ServicesTab services={services} onRefresh={fetchDashboardData} />;
      case 'reviews':
        return <ReviewsTab reviews={reviews} />;
      case 'portfolio':
        return <PortfolioTab portfolio={portfolio} onRefresh={fetchDashboardData} />;
      case 'panchang':
        return <PanchangTab panchang={panchang} festivals={festivals} />;
      case 'earnings':
        return <EarningsTab earnings={earnings} analytics={analytics} />;
      case 'classes':
        return <ClassesTab classes={classes} onRefresh={fetchDashboardData} />;
      case 'streams':
        return <StreamsTab streams={streams} onRefresh={fetchDashboardData} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cream to-parchment flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-saffron animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-parchment pb-24">
      <Toaster position="top-center" richColors />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-maroon to-maroon-light px-4 pt-8 pb-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {/* Profile Photo */}
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-2 border-gold">
                {priestProfile?.profile_photo ? (
                  <img src={priestProfile.profile_photo} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-white">{user?.name?.charAt(0) || 'P'}</span>
                )}
              </div>
              <div>
                <p className="text-white/70 text-sm">Namaste,</p>
                <h1 className="font-cinzel text-xl font-bold text-white">{user?.name || 'Pandit Ji'}</h1>
                {/* Role Badge */}
                <div className="mt-1 inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                  <Star className="w-3.5 h-3.5 text-gold" />
                  <span className="text-xs font-medium text-white capitalize">
                    {ROLE_CONFIG[user?.role]?.label || 'Priest'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors relative">
                <Bell className="w-5 h-5 text-white" />
                {bookings.filter(b => b.status === 'pending').length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                    {bookings.filter(b => b.status === 'pending').length}
                  </span>
                )}
              </button>
              <button 
                onClick={logout}
                className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-red-500/50 transition-colors"
                data-testid="logout-btn"
              >
                <LogOut className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Quick Stats - Only on Home */}
          {activeTab === 'home' && analytics && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              <StatCard icon={IndianRupee} value={`₹${analytics.stats?.monthly_earnings || 0}`} label="This Month" />
              <StatCard icon={Calendar} value={bookings.filter(b => b.status === 'pending').length} label="Pending" highlight />
              <StatCard icon={Users} value={analytics.stats?.total_students || 0} label="Students" />
              <StatCard icon={Star} value={analytics.stats?.avg_rating || '4.8'} label="Rating" />
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation - Scrollable */}
      <div className="sticky top-0 z-20 bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-saffron text-white shadow-md'
                    : 'text-gray-600 hover:bg-orange-50'
                }`}
                data-testid={`tab-${tab.id}`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ==================== STAT CARD ====================
function StatCard({ icon: Icon, value, label, highlight }) {
  return (
    <div className={`rounded-xl p-3 text-center ${highlight ? 'bg-saffron/30' : 'bg-white/20'} backdrop-blur`}>
      <div className="flex items-center justify-center gap-1 mb-1">
        <Icon className="w-4 h-4 text-white/80" />
        <p className="text-xl font-bold text-white">{value}</p>
      </div>
      <p className="text-xs text-white/70">{label}</p>
    </div>
  );
}

// ==================== HOME TAB ====================
function HomeTab({ analytics, bookings, panchang, festivals, updateStatus }) {
  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const upcomingBookings = bookings.filter(b => b.status === 'confirmed');
  const todayFestivals = festivals.slice(0, 3);

  // Helper function to safely extract panchang values
  const getPanchangValue = (value, fallback = '') => {
    if (!value) return fallback;
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      // Handle objects like {name: "Dashami", number: 10}
      return value.name || value.value || String(value) || fallback;
    }
    return String(value);
  };

  return (
    <div className="space-y-6">
      {/* Today's Panchang Quick View */}
      {panchang && (
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl p-4 border border-orange-100">
          <div className="flex items-center gap-2 mb-3">
            <Sun className="w-5 h-5 text-saffron" />
            <h3 className="font-cinzel font-semibold text-maroon">Today's Panchang</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-gray-500">Tithi</p>
              <p className="font-medium text-gray-800">{getPanchangValue(panchang.tithi, 'Dashami')}</p>
            </div>
            <div>
              <p className="text-gray-500">Nakshatra</p>
              <p className="font-medium text-gray-800">{getPanchangValue(panchang.nakshatra, 'Rohini')}</p>
            </div>
            <div>
              <p className="text-gray-500">Sunrise</p>
              <p className="font-medium text-gray-800">{getPanchangValue(panchang.sunrise, '6:15 AM')}</p>
            </div>
            <div>
              <p className="text-gray-500">Sunset</p>
              <p className="font-medium text-gray-800">{getPanchangValue(panchang.sunset, '6:30 PM')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Festivals */}
      {todayFestivals.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <h3 className="font-cinzel font-semibold text-maroon mb-3 flex items-center gap-2">
            <CalendarDays className="w-5 h-5" />
            Upcoming Festivals
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {todayFestivals.map((fest, i) => (
              <div key={i} className="flex-shrink-0 bg-gradient-to-br from-saffron to-gold rounded-xl p-3 text-white min-w-[140px]">
                <p className="font-semibold text-sm">{fest.name}</p>
                <p className="text-xs opacity-80">{fest.date}</p>
                {fest.days_until !== undefined && (
                  <p className="text-xs mt-1 bg-white/20 rounded px-2 py-0.5 inline-block">
                    {fest.days_until === 0 ? 'Today!' : `${fest.days_until} days`}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Overview */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="font-cinzel text-lg font-semibold text-maroon mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Dashboard Overview
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4">
            <p className="text-2xl font-bold text-saffron">{analytics?.stats?.total_bookings || 0}</p>
            <p className="text-sm text-gray-600">Total Bookings</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
            <p className="text-2xl font-bold text-green-600">{analytics?.stats?.completed_bookings || 0}</p>
            <p className="text-sm text-gray-600">Completed</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
            <p className="text-2xl font-bold text-blue-600">{analytics?.stats?.total_classes || 0}</p>
            <p className="text-sm text-gray-600">Classes</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
            <p className="text-2xl font-bold text-purple-600">{analytics?.stats?.content_count || 0}</p>
            <p className="text-sm text-gray-600">Content Posts</p>
          </div>
        </div>

        {/* Earnings Summary */}
        <div className="mt-6 p-4 bg-gradient-to-r from-saffron/10 to-gold/10 rounded-xl border border-saffron/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Earnings</p>
              <p className="text-3xl font-bold text-maroon">₹{analytics?.stats?.total_earnings || 0}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-saffron">₹{analytics?.stats?.monthly_earnings || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Requests */}
      {pendingBookings.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="font-cinzel text-lg font-semibold text-maroon mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            Pending Requests ({pendingBookings.length})
          </h2>
          <div className="space-y-3">
            {pendingBookings.slice(0, 3).map((booking) => (
              <BookingCard key={booking.id} booking={booking} onUpdateStatus={updateStatus} />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Bookings */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="font-cinzel text-lg font-semibold text-maroon mb-4 flex items-center gap-2">
          <CalendarDays className="w-5 h-5" />
          Upcoming Bookings ({upcomingBookings.length})
        </h2>
        {upcomingBookings.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No upcoming bookings</p>
        ) : (
          <div className="space-y-3">
            {upcomingBookings.slice(0, 5).map((booking) => (
              <BookingCard key={booking.id} booking={booking} onUpdateStatus={updateStatus} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== BOOKING CARD ====================
function BookingCard({ booking, onUpdateStatus }) {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  return (
    <motion.div
      className="border border-orange-100 rounded-xl p-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="font-semibold text-gray-800">{booking.service_name}</p>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <User className="w-3 h-3" />
            {booking.user_name}
          </p>
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            {new Date(booking.booking_date).toLocaleDateString('en-IN', { 
              weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' 
            })}
          </div>
          {booking.location && (
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3" />
              {booking.location}
            </p>
          )}
          <p className="text-sm font-medium text-saffron mt-1">₹{booking.price}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${statusColors[booking.status]}`}>
          {booking.status}
        </span>
      </div>

      {booking.status === 'pending' && (
        <div className="flex gap-2">
          <button
            onClick={() => onUpdateStatus(booking.id, 'confirmed')}
            className="flex-1 bg-green-500 text-white rounded-lg py-2 text-sm flex items-center justify-center gap-1 hover:bg-green-600 transition-colors"
            data-testid="accept-booking-btn"
          >
            <CheckCircle className="w-4 h-4" /> Accept
          </button>
          <button
            onClick={() => onUpdateStatus(booking.id, 'cancelled')}
            className="flex-1 bg-red-500 text-white rounded-lg py-2 text-sm flex items-center justify-center gap-1 hover:bg-red-600 transition-colors"
            data-testid="decline-booking-btn"
          >
            <XCircle className="w-4 h-4" /> Decline
          </button>
        </div>
      )}

      {booking.status === 'confirmed' && (
        <button
          onClick={() => onUpdateStatus(booking.id, 'completed')}
          className="w-full bg-saffron text-white rounded-lg py-2 text-sm hover:bg-saffron-dark transition-colors"
          data-testid="complete-booking-btn"
        >
          Mark as Completed
        </button>
      )}
    </motion.div>
  );
}

// ==================== PROFILE TAB ====================
function ProfileTab({ profile, user, onRefresh }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    bio: profile?.bio || '',
    experience_years: profile?.experience_years || 5,
    specializations: profile?.specializations || [],
    languages: profile?.languages || ['Hindi', 'Sanskrit'],
    base_price: profile?.base_price || 1100,
    work_locations: profile?.work_locations || [],
    service_areas: profile?.service_areas || [],
    phone: user?.phone || '',
    email: user?.email || '',
    address: profile?.address || '',
    city: profile?.city || '',
    state: profile?.state || '',
    pincode: profile?.pincode || ''
  });
  const [newLocation, setNewLocation] = useState('');

  const toggleSpecialization = (spec) => {
    if (formData.specializations.includes(spec)) {
      setFormData({ ...formData, specializations: formData.specializations.filter(s => s !== spec) });
    } else {
      setFormData({ ...formData, specializations: [...formData.specializations, spec] });
    }
  };

  const toggleLanguage = (lang) => {
    if (formData.languages.includes(lang)) {
      setFormData({ ...formData, languages: formData.languages.filter(l => l !== lang) });
    } else {
      setFormData({ ...formData, languages: [...formData.languages, lang] });
    }
  };

  const addWorkLocation = () => {
    if (newLocation.trim() && !formData.work_locations.includes(newLocation.trim())) {
      setFormData({ ...formData, work_locations: [...formData.work_locations, newLocation.trim()] });
      setNewLocation('');
    }
  };

  const removeWorkLocation = (loc) => {
    setFormData({ ...formData, work_locations: formData.work_locations.filter(l => l !== loc) });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/api/priest/profile', formData);
      toast.success('Profile updated successfully!');
      setEditing(false);
      onRefresh();
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-cinzel text-xl font-semibold text-maroon">My Profile</h2>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 bg-saffron text-white px-4 py-2 rounded-lg hover:bg-saffron-dark transition-colors"
            data-testid="edit-profile-btn"
          >
            <Edit className="w-4 h-4" /> Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(false)}
              className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              data-testid="save-profile-btn"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
          </div>
        )}
      </div>

      {/* Profile Photo Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-saffron to-gold flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
              {profile?.profile_photo ? (
                <img src={profile.profile_photo} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-white">{user?.name?.charAt(0) || 'P'}</span>
              )}
            </div>
            {editing && (
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-saffron rounded-full flex items-center justify-center text-white shadow-md">
                <Camera className="w-4 h-4" />
              </button>
            )}
          </div>
          <div>
            <h3 className="font-cinzel text-xl font-bold text-maroon">{user?.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Star className="w-4 h-4 text-gold fill-gold" />
              <span className="text-sm text-gray-600">4.8 rating</span>
              <span className="text-gray-400">•</span>
              <span className="text-sm text-gray-600">{formData.experience_years} years experience</span>
            </div>
            {profile?.is_verified && (
              <div className="flex items-center gap-1 mt-2 text-green-600">
                <Award className="w-4 h-4" />
                <span className="text-sm font-medium">Verified Priest</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bio */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="font-semibold text-gray-800 mb-3">About Me</h3>
        {editing ? (
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            placeholder="Write a brief introduction about yourself, your experience, and what makes you unique..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
          />
        ) : (
          <p className="text-gray-600">{formData.bio || 'No bio added yet. Click Edit to add your introduction.'}</p>
        )}
      </div>

      {/* Specializations */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="font-semibold text-gray-800 mb-3">Specializations</h3>
        <div className="flex flex-wrap gap-2">
          {SPECIALIZATIONS.map((spec) => (
            <button
              key={spec}
              onClick={() => editing && toggleSpecialization(spec)}
              disabled={!editing}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                formData.specializations.includes(spec)
                  ? 'bg-saffron text-white'
                  : editing
                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    : 'bg-gray-100 text-gray-400'
              }`}
            >
              {spec}
            </button>
          ))}
        </div>
      </div>

      {/* Languages */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="font-semibold text-gray-800 mb-3">Languages</h3>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang}
              onClick={() => editing && toggleLanguage(lang)}
              disabled={!editing}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                formData.languages.includes(lang)
                  ? 'bg-blue-500 text-white'
                  : editing
                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    : 'bg-gray-100 text-gray-400'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      {/* Work Locations */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-saffron" />
          Work Locations
        </h3>
        <p className="text-sm text-gray-500 mb-3">Areas where you can provide services</p>
        
        {editing && (
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              placeholder="Add a city or area (e.g., Mumbai, Andheri)"
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-saffron/50"
              onKeyPress={(e) => e.key === 'Enter' && addWorkLocation()}
            />
            <button
              onClick={addWorkLocation}
              className="px-4 py-2 bg-saffron text-white rounded-lg hover:bg-saffron-dark"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {formData.work_locations.length === 0 ? (
            <p className="text-gray-400 text-sm">No work locations added</p>
          ) : (
            formData.work_locations.map((loc, i) => (
              <div key={i} className="flex items-center gap-1 bg-orange-100 text-orange-700 px-3 py-1.5 rounded-full">
                <MapPin className="w-3 h-3" />
                <span className="text-sm">{loc}</span>
                {editing && (
                  <button onClick={() => removeWorkLocation(loc)} className="ml-1 hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Contact & Pricing */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Contact & Pricing</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Phone</label>
            {editing ? (
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-saffron/50"
              />
            ) : (
              <p className="flex items-center gap-2 text-gray-800">
                <Phone className="w-4 h-4 text-gray-400" />
                {formData.phone || 'Not provided'}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Email</label>
            {editing ? (
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-saffron/50"
              />
            ) : (
              <p className="flex items-center gap-2 text-gray-800">
                <Mail className="w-4 h-4 text-gray-400" />
                {formData.email || 'Not provided'}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Experience (Years)</label>
            {editing ? (
              <input
                type="number"
                value={formData.experience_years}
                onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-saffron/50"
              />
            ) : (
              <p className="text-gray-800">{formData.experience_years} years</p>
            )}
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Base Price (₹)</label>
            {editing ? (
              <input
                type="number"
                value={formData.base_price}
                onChange={(e) => setFormData({ ...formData, base_price: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-saffron/50"
              />
            ) : (
              <p className="text-saffron font-bold text-lg">₹{formData.base_price}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== BOOKINGS TAB ====================
function BookingsTab({ bookings, updateStatus }) {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBookings = bookings.filter(b => {
    const matchesFilter = filter === 'all' || b.status === filter;
    const matchesSearch = b.service_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         b.user_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    all: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  };

  return (
    <div className="space-y-6">
      <h2 className="font-cinzel text-xl font-semibold text-maroon">All Bookings</h2>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search bookings..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-saffron/50"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {Object.entries(stats).map(([status, count]) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  filter === status
                    ? 'bg-saffron text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)} ({count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400">No bookings found</p>
          </div>
        ) : (
          filteredBookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-2xl shadow-lg p-6">
              <BookingCard booking={booking} onUpdateStatus={updateStatus} />
              
              {/* Additional booking details */}
              {booking.notes && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500">Notes:</p>
                  <p className="text-sm text-gray-700">{booking.notes}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ==================== SERVICES TAB ====================
function ServicesTab({ services, onRefresh }) {
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);

  const deleteService = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;
    try {
      await api.delete(`/api/priest/services/${serviceId}`);
      toast.success('Service deleted');
      onRefresh();
    } catch (error) {
      toast.error('Failed to delete service');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-cinzel text-xl font-semibold text-maroon">My Services</h2>
        <button
          onClick={() => { setEditingService(null); setShowModal(true); }}
          className="flex items-center gap-2 bg-saffron text-white px-4 py-2 rounded-lg hover:bg-saffron-dark transition-colors"
          data-testid="add-service-btn"
        >
          <Plus className="w-4 h-4" /> Add Service
        </button>
      </div>

      {services.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-400 mb-4">No services added yet</p>
          <button
            onClick={() => setShowModal(true)}
            className="text-saffron hover:underline"
          >
            Add your first service
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {services.map((service) => (
            <div key={service.id} className="bg-white rounded-xl shadow-lg p-5 border-l-4 border-saffron">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800">{service.name}</h3>
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                    {service.category}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => { setEditingService(service); setShowModal(true); }}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <Edit className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() => deleteService(service.id)}
                    className="p-2 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
              
              <p className="text-sm text-gray-500 mb-3">{service.description}</p>
              
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="flex items-center gap-1 text-gray-600">
                  <Clock className="w-4 h-4" />
                  {service.duration_minutes} min
                </span>
                <span className="flex items-center gap-1 text-saffron font-bold">
                  <IndianRupee className="w-4 h-4" />
                  ₹{service.price}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Service Modal */}
      <ServiceModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingService(null); }}
        editData={editingService}
        onSuccess={onRefresh}
      />
    </div>
  );
}

// ==================== SERVICE MODAL ====================
function ServiceModal({ isOpen, onClose, editData, onSuccess }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'Pooja',
    duration_minutes: 60,
    price: 1100,
    is_available: true
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editData) {
      setForm(editData);
    } else {
      setForm({
        name: '',
        description: '',
        category: 'Pooja',
        duration_minutes: 60,
        price: 1100,
        is_available: true
      });
    }
  }, [editData, isOpen]);

  const handleSubmit = async () => {
    if (!form.name) {
      toast.error('Please enter service name');
      return;
    }
    
    setSaving(true);
    try {
      if (editData) {
        await api.put(`/api/priest/services/${editData.id}`, form);
        toast.success('Service updated!');
      } else {
        await api.post('/api/priest/services', form);
        toast.success('Service added!');
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('Failed to save service');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="font-cinzel text-xl font-semibold text-maroon">
              {editData ? 'Edit Service' : 'Add New Service'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service Name*</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Satyanarayan Pooja"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe what's included..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
              >
                <option value="Pooja">Pooja</option>
                <option value="Homam">Homam/Havan</option>
                <option value="Ceremony">Ceremony</option>
                <option value="Consultation">Consultation</option>
                <option value="Online">Online Service</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
              <input
                type="number"
                value={form.duration_minutes}
                onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
            />
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_available}
              onChange={(e) => setForm({ ...form, is_available: e.target.checked })}
              className="w-4 h-4 text-saffron"
            />
            <span className="text-sm text-gray-600">Available for booking</span>
          </label>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-xl">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-2 bg-saffron text-white rounded-xl hover:bg-saffron-dark disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {editData ? 'Update' : 'Add Service'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ==================== REVIEWS TAB ====================
function ReviewsTab({ reviews }) {
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  const ratingCounts = [5, 4, 3, 2, 1].map(stars => ({
    stars,
    count: reviews.filter(r => r.rating === stars).length,
    percentage: reviews.length > 0 
      ? ((reviews.filter(r => r.rating === stars).length / reviews.length) * 100).toFixed(0)
      : 0
  }));

  return (
    <div className="space-y-6">
      <h2 className="font-cinzel text-xl font-semibold text-maroon">Reviews & Ratings</h2>

      {/* Rating Summary */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="text-center">
            <p className="text-5xl font-bold text-maroon">{avgRating}</p>
            <div className="flex items-center justify-center gap-1 my-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-6 h-6 ${star <= Math.round(parseFloat(avgRating)) ? 'text-gold fill-gold' : 'text-gray-300'}`}
                />
              ))}
            </div>
            <p className="text-gray-500">Based on {reviews.length} reviews</p>
          </div>

          <div className="space-y-2">
            {ratingCounts.map(({ stars, count, percentage }) => (
              <div key={stars} className="flex items-center gap-3">
                <span className="text-sm w-8">{stars} ★</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gold h-2 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm text-gray-500 w-8">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-400">No reviews yet</p>
          <p className="text-sm text-gray-400 mt-2">Reviews will appear here once devotees rate your services</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-saffron to-gold rounded-full flex items-center justify-center text-white font-bold">
                  {review.user_name?.charAt(0) || 'U'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-800">{review.user_name}</p>
                      <p className="text-xs text-gray-400">{review.service_name}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${star <= review.rating ? 'text-gold fill-gold' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm">{review.comment}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(review.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== PORTFOLIO TAB ====================
function PortfolioTab({ portfolio, onRefresh }) {
  const [showModal, setShowModal] = useState(false);

  const deleteItem = async (itemId) => {
    if (!window.confirm('Delete this portfolio item?')) return;
    try {
      await api.delete(`/api/priest/portfolio/${itemId}`);
      toast.success('Item deleted');
      onRefresh();
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-cinzel text-xl font-semibold text-maroon">Portfolio</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-saffron text-white px-4 py-2 rounded-lg hover:bg-saffron-dark"
          data-testid="add-portfolio-btn"
        >
          <Upload className="w-4 h-4" /> Add Media
        </button>
      </div>

      <p className="text-sm text-gray-500">
        Showcase your work - photos and videos of ceremonies, poojas, and events you've conducted.
      </p>

      {portfolio.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <Image className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-400 mb-4">No portfolio items yet</p>
          <button
            onClick={() => setShowModal(true)}
            className="text-saffron hover:underline"
          >
            Add your first photo or video
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {portfolio.map((item) => (
            <div key={item.id} className="relative group">
              <div className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                {item.type === 'video' ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <Play className="w-12 h-12 text-white" />
                  </div>
                ) : (
                  <img
                    src={item.url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
                <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <Eye className="w-5 h-5 text-gray-700" />
                </button>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center"
                >
                  <Trash2 className="w-5 h-5 text-white" />
                </button>
              </div>
              {item.title && (
                <p className="text-sm text-gray-600 mt-2 truncate">{item.title}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Portfolio Modal */}
      <PortfolioModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={onRefresh}
      />
    </div>
  );
}

// ==================== PORTFOLIO MODAL ====================
function PortfolioModal({ isOpen, onClose, onSuccess }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'image',
    url: ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.url) {
      toast.error('Please enter media URL');
      return;
    }
    
    setSaving(true);
    try {
      await api.post('/api/priest/portfolio', form);
      toast.success('Portfolio item added!');
      onSuccess();
      onClose();
      setForm({ title: '', description: '', type: 'image', url: '' });
    } catch (error) {
      toast.error('Failed to add item');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl max-w-lg w-full"
      >
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="font-cinzel text-xl font-semibold text-maroon">Add Portfolio Item</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g., Griha Pravesh Ceremony"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={form.type === 'image'}
                  onChange={() => setForm({ ...form, type: 'image' })}
                  className="text-saffron"
                />
                <span className="text-sm">Image</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={form.type === 'video'}
                  onChange={() => setForm({ ...form, type: 'video' })}
                  className="text-saffron"
                />
                <span className="text-sm">Video</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {form.type === 'image' ? 'Image URL' : 'Video URL (YouTube/Vimeo)'}
            </label>
            <input
              type="url"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description..."
              rows={2}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-xl">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-2 bg-saffron text-white rounded-xl hover:bg-saffron-dark disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Add
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ==================== PANCHANG TAB ====================
function PanchangTab({ panchang, festivals }) {
  // Helper function to safely extract panchang values
  const getPanchangValue = (value, fallback = '') => {
    if (!value) return fallback;
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      return value.name || value.value || String(value) || fallback;
    }
    return String(value);
  };

  return (
    <div className="space-y-6">
      <h2 className="font-cinzel text-xl font-semibold text-maroon">Panchang & Calendar</h2>

      {/* Today's Panchang */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="font-cinzel text-lg font-semibold text-maroon mb-4 flex items-center gap-2">
          <Sun className="w-5 h-5 text-saffron" />
          Today's Panchang
        </h3>
        
        {panchang ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-orange-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase">Tithi</p>
              <p className="font-semibold text-gray-800">{getPanchangValue(panchang.tithi, 'Loading...')}</p>
            </div>
            <div className="bg-yellow-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase">Nakshatra</p>
              <p className="font-semibold text-gray-800">{getPanchangValue(panchang.nakshatra, 'Loading...')}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase">Yoga</p>
              <p className="font-semibold text-gray-800">{getPanchangValue(panchang.yoga, 'Siddhi')}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase">Karana</p>
              <p className="font-semibold text-gray-800">{getPanchangValue(panchang.karana, 'Bava')}</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Sunrise className="w-4 h-4 text-orange-500" />
                <p className="text-xs text-gray-500 uppercase">Sunrise</p>
              </div>
              <p className="font-semibold text-gray-800">{getPanchangValue(panchang.sunrise, '6:15 AM')}</p>
            </div>
            <div className="bg-indigo-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Sunset className="w-4 h-4 text-orange-600" />
                <p className="text-xs text-gray-500 uppercase">Sunset</p>
              </div>
              <p className="font-semibold text-gray-800">{getPanchangValue(panchang.sunset, '6:30 PM')}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 text-saffron animate-spin mx-auto" />
            <p className="text-gray-400 mt-2">Loading panchang...</p>
          </div>
        )}
      </div>

      {/* Upcoming Festivals */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="font-cinzel text-lg font-semibold text-maroon mb-4 flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-saffron" />
          Upcoming Festivals
        </h3>
        
        {festivals.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No upcoming festivals data</p>
        ) : (
          <div className="space-y-3">
            {festivals.slice(0, 10).map((festival, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-saffron to-gold rounded-xl flex items-center justify-center text-white font-bold">
                    {festival.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{festival.name}</p>
                    <p className="text-sm text-gray-500">{festival.date}</p>
                  </div>
                </div>
                {festival.days_until !== undefined && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    festival.days_until === 0 
                      ? 'bg-green-100 text-green-700' 
                      : festival.days_until <= 7 
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-gray-100 text-gray-600'
                  }`}>
                    {festival.days_until === 0 ? 'Today!' : `${festival.days_until} days`}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== EARNINGS TAB ====================
function EarningsTab({ earnings, analytics }) {
  const transactions = earnings?.transactions || [];

  return (
    <div className="space-y-6">
      <h2 className="font-cinzel text-xl font-semibold text-maroon">Earnings & Payouts</h2>

      {/* Earnings Summary */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
          <p className="text-sm opacity-80">Total Earnings</p>
          <p className="text-3xl font-bold mt-1">₹{earnings?.total_earnings || analytics?.stats?.total_earnings || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-saffron to-orange-500 rounded-2xl p-6 text-white">
          <p className="text-sm opacity-80">This Month</p>
          <p className="text-3xl font-bold mt-1">₹{earnings?.monthly_earnings || analytics?.stats?.monthly_earnings || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
          <p className="text-sm opacity-80">Pending Payout</p>
          <p className="text-3xl font-bold mt-1">₹{earnings?.pending_payouts || 0}</p>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Recent Transactions</h3>
        
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <IndianRupee className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((txn, i) => (
              <div key={i} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    txn.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {txn.type === 'credit' ? (
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    ) : (
                      <IndianRupee className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{txn.description}</p>
                    <p className="text-xs text-gray-400">{txn.date}</p>
                  </div>
                </div>
                <p className={`font-bold ${txn.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                  {txn.type === 'credit' ? '+' : '-'}₹{txn.amount}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== CLASSES TAB ====================
function ClassesTab({ classes, onRefresh }) {
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);

  const deleteClass = async (classId) => {
    if (!window.confirm('Delete this class?')) return;
    try {
      await api.delete(`/api/priest/classes/${classId}`);
      toast.success('Class deleted');
      onRefresh();
    } catch (error) {
      toast.error('Failed to delete class');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-cinzel text-xl font-semibold text-maroon">My Classes</h2>
        <button
          onClick={() => { setEditingClass(null); setShowModal(true); }}
          className="flex items-center gap-2 bg-saffron text-white px-4 py-2 rounded-lg hover:bg-saffron-dark"
          data-testid="add-class-btn"
        >
          <Plus className="w-4 h-4" /> Add Class
        </button>
      </div>

      {classes.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-400 mb-4">No classes created yet</p>
          <button onClick={() => setShowModal(true)} className="text-saffron hover:underline">
            Create your first class
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {classes.map((cls) => (
            <div key={cls.id} className="bg-white rounded-xl shadow-lg p-5 border-l-4 border-saffron">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800">{cls.title}</h3>
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                    {cls.category}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditingClass(cls); setShowModal(true); }} className="p-2 hover:bg-gray-100 rounded-lg">
                    <Edit className="w-4 h-4 text-gray-500" />
                  </button>
                  <button onClick={() => deleteClass(cls.id)} className="p-2 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
              
              <p className="text-sm text-gray-500 mb-3 line-clamp-2">{cls.description}</p>
              
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="flex items-center gap-1 text-gray-600">
                  <Clock className="w-4 h-4" />
                  {cls.duration_minutes} min
                </span>
                <span className="flex items-center gap-1 text-gray-600">
                  <Users className="w-4 h-4" />
                  {cls.enrolled_count || 0}/{cls.max_students}
                </span>
                <span className="flex items-center gap-1 text-saffron font-medium">
                  ₹{cls.price}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <ClassModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingClass(null); }}
        editData={editingClass}
        onSuccess={onRefresh}
      />
    </div>
  );
}

// ==================== CLASS MODAL (simplified) ====================
function ClassModal({ isOpen, onClose, editData, onSuccess }) {
  const [form, setForm] = useState({
    title: '', description: '', class_type: 'online', duration_minutes: 60,
    price: 500, max_students: 20, category: 'General', schedule: []
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editData) setForm(editData);
    else setForm({ title: '', description: '', class_type: 'online', duration_minutes: 60, price: 500, max_students: 20, category: 'General', schedule: [] });
  }, [editData, isOpen]);

  const handleSubmit = async () => {
    if (!form.title) { toast.error('Please enter a class title'); return; }
    setSaving(true);
    try {
      if (editData) await api.put(`/api/priest/classes/${editData.id}`, form);
      else await api.post('/api/priest/classes', form);
      toast.success(editData ? 'Class updated!' : 'Class created!');
      onSuccess(); onClose();
    } catch { toast.error('Failed to save class'); }
    finally { setSaving(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-cinzel text-xl font-semibold text-maroon">{editData ? 'Edit Class' : 'Create Class'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Title*</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-xl" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
              <input type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) })} className="w-full px-4 py-3 border border-gray-200 rounded-xl" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
              <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) })} className="w-full px-4 py-3 border border-gray-200 rounded-xl" /></div>
          </div>
        </div>
        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="px-6 py-2 bg-saffron text-white rounded-xl disabled:opacity-50 flex items-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{editData ? 'Update' : 'Create'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ==================== STREAMS TAB ====================
function StreamsTab({ streams, onRefresh }) {
  const [showModal, setShowModal] = useState(false);

  const startStream = async (streamId) => {
    try { await api.put(`/api/priest/streams/${streamId}/start`); toast.success('Stream started!'); onRefresh(); }
    catch { toast.error('Failed to start stream'); }
  };

  const endStream = async (streamId) => {
    try { await api.put(`/api/priest/streams/${streamId}/end`); toast.success('Stream ended'); onRefresh(); }
    catch { toast.error('Failed to end stream'); }
  };

  const scheduledStreams = streams.filter(s => s.status === 'scheduled');
  const liveStreams = streams.filter(s => s.status === 'live');
  const pastStreams = streams.filter(s => s.status === 'ended');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-cinzel text-xl font-semibold text-maroon">Live Streams</h2>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-saffron text-white px-4 py-2 rounded-lg hover:bg-saffron-dark">
          <Plus className="w-4 h-4" /> Schedule Stream
        </button>
      </div>

      {liveStreams.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <h3 className="font-semibold text-red-700 flex items-center gap-2 mb-4">
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>Live Now
          </h3>
          {liveStreams.map((stream) => (
            <div key={stream.id} className="bg-white rounded-xl p-4 border border-red-200 flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-gray-800">{stream.title}</h4>
                <p className="text-sm text-gray-500">{stream.description}</p>
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-400"><Eye className="w-4 h-4" />{stream.viewer_count} watching</div>
              </div>
              <button onClick={() => endStream(stream.id)} className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">
                <Square className="w-4 h-4" />End
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Scheduled ({scheduledStreams.length})</h3>
        {scheduledStreams.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No scheduled streams</p>
        ) : (
          <div className="space-y-3">
            {scheduledStreams.map((stream) => (
              <div key={stream.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl">
                <div>
                  <h4 className="font-medium text-gray-800">{stream.title}</h4>
                  <p className="text-xs text-gray-400 mt-1">{new Date(stream.scheduled_at).toLocaleString()}</p>
                </div>
                <button onClick={() => startStream(stream.id)} className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">
                  <Play className="w-4 h-4" />Go Live
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {pastStreams.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Past Streams</h3>
          <div className="space-y-3">
            {pastStreams.slice(0, 5).map((stream) => (
              <div key={stream.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <h4 className="font-medium text-gray-700">{stream.title}</h4>
                  <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                    <span>{new Date(stream.ended_at).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" />Max: {stream.max_viewers}</span>
                  </div>
                </div>
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">Ended</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <StreamModal isOpen={showModal} onClose={() => setShowModal(false)} onSuccess={onRefresh} />
    </div>
  );
}

// ==================== STREAM MODAL ====================
function StreamModal({ isOpen, onClose, onSuccess }) {
  const [form, setForm] = useState({ title: '', description: '', stream_type: 'puja', scheduled_at: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.title || !form.scheduled_at) { toast.error('Please fill required fields'); return; }
    setSaving(true);
    try { await api.post('/api/priest/streams', form); toast.success('Stream scheduled!'); onSuccess(); onClose(); setForm({ title: '', description: '', stream_type: 'puja', scheduled_at: '' }); }
    catch { toast.error('Failed to schedule stream'); }
    finally { setSaving(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl max-w-lg w-full">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-cinzel text-xl font-semibold text-maroon">Schedule Live Stream</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Title*</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Stream Type</label>
            <select value={form.stream_type} onChange={(e) => setForm({ ...form, stream_type: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl">
              <option value="puja">Puja</option><option value="class">Class</option><option value="discourse">Discourse</option><option value="aarti">Aarti</option><option value="bhajan">Bhajan</option>
            </select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-4 py-3 border border-gray-200 rounded-xl" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date & Time*</label>
            <input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl" /></div>
        </div>
        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="px-6 py-2 bg-saffron text-white rounded-xl disabled:opacity-50 flex items-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}Schedule
          </button>
        </div>
      </motion.div>
    </div>
  );
}
