import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, Calendar, Settings, LogOut, ChevronRight, Clock,
  CheckCircle, XCircle, User, Star, Bell, Loader2, BookOpen,
  Video, FileText, DollarSign, Users, TrendingUp, Plus, Edit,
  Trash2, Play, Square, Eye, Heart, CalendarDays, BarChart3,
  Save, X, AlertCircle, Shield, MapPin, Phone, Mail, Camera,
  Image, Upload, MessageSquare, ThumbsUp, Sun, Moon, Sunrise, Sunset,
  IndianRupee, Filter, Search, ChevronLeft, Award, Briefcase,
  Menu, Send, Repeat, MessageCircle
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

// Tab configurations - split into main and more
const mainTabs = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'posts', label: 'Posts', icon: Send },
  { id: 'bookings', label: 'Bookings', icon: Calendar },
  { id: 'profile', label: 'Profile', icon: User },
];

const moreTabs = [
  { id: 'services', label: 'Services', icon: Briefcase },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'portfolio', label: 'Portfolio', icon: Image },
  { id: 'panchang', label: 'Panchang', icon: Sun },
  { id: 'earnings', label: 'Earnings', icon: IndianRupee },
  { id: 'classes', label: 'Classes', icon: BookOpen },
  { id: 'streams', label: 'Live', icon: Video },
];

const allTabs = [...mainTabs, ...moreTabs];

// Specialization options
const SPECIALIZATIONS = [
  'Vedic Rituals', 'Satyanarayan Pooja', 'Griha Pravesh', 'Navagraha Shanti',
  'Rudrabhishekam', 'Ganesh Pooja', 'Lakshmi Pooja', 'Durga Pooja',
  'Marriage Ceremonies', 'Last Rites', 'Homam/Havan', 'Vastu Shanti',
  'Mundan', 'Naming Ceremony', 'Thread Ceremony', 'Astrology Consultation'
];

// Languages
const LANGUAGES = ['Hindi', 'Sanskrit', 'Telugu', 'Tamil', 'Kannada', 'Malayalam', 'Bengali', 'Marathi', 'Gujarati', 'English'];

// Schedule frequency options
const SCHEDULE_FREQUENCIES = [
  { value: 'once', label: 'One Time' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function PriestDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [welcomeShown, setWelcomeShown] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Data states
  const [analytics, setAnalytics] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [classes, setClasses] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [services, setServices] = useState([]);
  const [panchang, setPanchang] = useState(null);
  const [festivals, setFestivals] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [priestProfile, setPriestProfile] = useState(null);
  const [streams, setStreams] = useState([]);
  const [posts, setPosts] = useState([]);

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
      const [analyticsRes, bookingsRes, classesRes, streamsRes, panchangRes, festivalsRes, postsRes] = await Promise.all([
        api.get('/api/priest/analytics').catch(() => ({ data: null })),
        api.get('/api/priest/bookings').catch(() => ({ data: { bookings: [] } })),
        api.get('/api/priest/classes').catch(() => ({ data: { classes: [] } })),
        api.get('/api/priest/streams').catch(() => ({ data: { streams: [] } })),
        api.get('/api/panchang/today').catch(() => ({ data: null })),
        api.get('/api/festivals/upcoming').catch(() => ({ data: { festivals: [] } })),
        api.get('/api/priest/posts').catch(() => ({ data: { posts: [] } })),
      ]);

      setAnalytics(analyticsRes.data);
      setBookings(bookingsRes.data?.bookings || []);
      setClasses(classesRes.data?.classes || []);
      setStreams(streamsRes.data?.streams || []);
      setPanchang(panchangRes.data);
      setFestivals(festivalsRes.data?.festivals || []);
      setPosts(postsRes.data?.posts || []);
      
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
          base_price: 1100,
          profile_photo: null
        });
      }

      // Fetch reviews, portfolio, services, earnings
      try {
        const [reviewsRes, portfolioRes, servicesRes, earningsRes] = await Promise.all([
          api.get('/api/priest/reviews').catch(() => ({ data: { reviews: [] } })),
          api.get('/api/priest/portfolio').catch(() => ({ data: { items: [] } })),
          api.get('/api/priest/services').catch(() => ({ data: { services: [] } })),
          api.get('/api/priest/earnings').catch(() => ({ data: null })),
        ]);
        setReviews(reviewsRes.data?.reviews || []);
        setPortfolio(portfolioRes.data?.items || []);
        setServices(servicesRes.data?.services || []);
        setEarnings(earningsRes.data || { total_earnings: 0, monthly_earnings: 0 });
      } catch (e) {
        console.error('Error fetching additional data:', e);
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
        return <HomeTab analytics={analytics} bookings={bookings} panchang={panchang} festivals={festivals} posts={posts} updateStatus={updateBookingStatus} />;
      case 'posts':
        return <PostsTab posts={posts} onRefresh={fetchDashboardData} />;
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

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setShowMoreMenu(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cream to-parchment flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-saffron animate-spin" />
      </div>
    );
  }

  const currentTab = allTabs.find(t => t.id === activeTab);
  const isMoreTab = moreTabs.some(t => t.id === activeTab);

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-parchment">
      <Toaster position="top-center" richColors />
      
      {/* Desktop Layout with Sidebar */}
      <div className="hidden lg:flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen bg-white border-r border-orange-100 fixed left-0 top-0 bottom-0 z-20">
          {/* Sidebar Header */}
          <div className="bg-gradient-to-r from-maroon to-maroon-light p-4">
            <button 
              onClick={() => handleTabChange('profile')}
              className="flex items-center gap-3 w-full text-left hover:opacity-90 transition-opacity cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-2 border-gold">
                {priestProfile?.profile_photo ? (
                  <img src={priestProfile.profile_photo} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl font-bold text-white">{user?.name?.charAt(0) || 'P'}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-cinzel text-sm font-bold text-white truncate">{user?.name || 'Pandit Ji'}</h2>
                <div className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full w-fit">
                  <Star className="w-3 h-3 text-gold" />
                  <span className="text-[10px] text-white capitalize">{user?.role || 'Priest'}</span>
                </div>
              </div>
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="p-3 space-y-1 overflow-y-auto" style={{ height: 'calc(100vh - 120px)' }}>
            <p className="text-xs font-semibold text-gray-400 uppercase px-3 pt-2 pb-1">Main</p>
            {mainTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-saffron text-white shadow-md'
                    : 'text-gray-600 hover:bg-orange-50'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}

            <p className="text-xs font-semibold text-gray-400 uppercase px-3 pt-4 pb-1">Manage</p>
            {moreTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-saffron text-white shadow-md'
                    : 'text-gray-600 hover:bg-orange-50'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-orange-100 bg-white">
            <button 
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 ml-64">
          {/* Top Header Bar */}
          <header className="bg-gradient-to-r from-maroon to-maroon-light px-6 py-4 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm">Welcome back,</p>
                <h1 className="font-cinzel text-xl font-bold text-white">{currentTab?.label || 'Dashboard'}</h1>
              </div>
              <div className="flex items-center gap-3">
                {/* Quick Stats Pills */}
                {activeTab === 'home' && analytics && (
                  <div className="hidden xl:flex items-center gap-2">
                    <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2">
                      <IndianRupee className="w-4 h-4 text-gold" />
                      <span className="text-sm font-medium text-white">₹{analytics.stats?.monthly_earnings || 0}</span>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2">
                      <Users className="w-4 h-4 text-gold" />
                      <span className="text-sm font-medium text-white">{analytics.stats?.total_students || 0} Students</span>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2">
                      <Star className="w-4 h-4 text-gold fill-gold" />
                      <span className="text-sm font-medium text-white">{analytics.stats?.avg_rating || '4.8'}</span>
                    </div>
                  </div>
                )}
                <button className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors relative">
                  <Bell className="w-5 h-5 text-white" />
                  {bookings.filter(b => b.status === 'pending').length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                      {bookings.filter(b => b.status === 'pending').length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <div className="p-6">
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
        </main>
      </div>

      {/* Tablet Layout - Compact Sidebar */}
      <div className="hidden md:flex lg:hidden">
        {/* Compact Icon Sidebar */}
        <aside className="w-20 min-h-screen bg-white border-r border-orange-100 fixed left-0 top-0 bottom-0 z-20 flex flex-col">
          {/* Logo/Avatar */}
          <button 
            onClick={() => handleTabChange('profile')}
            className="bg-gradient-to-r from-maroon to-maroon-light p-3 flex justify-center hover:opacity-90 transition-opacity cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-2 border-gold">
              {priestProfile?.profile_photo ? (
                <img src={priestProfile.profile_photo} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg font-bold text-white">{user?.name?.charAt(0) || 'P'}</span>
              )}
            </div>
          </button>

          {/* Icon Navigation */}
          <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
            {allTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                title={tab.label}
                className={`w-full flex items-center justify-center p-3 rounded-xl transition-all ${
                  activeTab === tab.id
                    ? 'bg-saffron text-white shadow-md'
                    : 'text-gray-500 hover:bg-orange-50 hover:text-saffron'
                }`}
              >
                <tab.icon className="w-5 h-5" />
              </button>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-2 border-t border-orange-100">
            <button 
              onClick={logout}
              title="Logout"
              className="w-full flex items-center justify-center p-3 rounded-xl text-red-500 hover:bg-red-50 transition-all"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-20">
          {/* Header */}
          <header className="bg-gradient-to-r from-maroon to-maroon-light px-4 py-4 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-cinzel text-lg font-bold text-white">{currentTab?.label || 'Dashboard'}</h1>
                <p className="text-white/70 text-xs">{user?.name}</p>
              </div>
              <button className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 relative">
                <Bell className="w-5 h-5 text-white" />
                {bookings.filter(b => b.status === 'pending').length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                    {bookings.filter(b => b.status === 'pending').length}
                  </span>
                )}
              </button>
            </div>
          </header>

          {/* Page Content */}
          <div className="p-4">
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
        </main>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden pb-20">
        {/* Mobile Header */}
        <div className="bg-gradient-to-r from-maroon to-maroon-light px-4 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => handleTabChange('profile')}
              className="flex items-center gap-3 text-left hover:opacity-90 transition-opacity cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-2 border-gold">
                {priestProfile?.profile_photo ? (
                  <img src={priestProfile.profile_photo} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl font-bold text-white">{user?.name?.charAt(0) || 'P'}</span>
                )}
              </div>
              <div>
                <p className="text-white/70 text-xs">Namaste,</p>
                <h1 className="font-cinzel text-base font-bold text-white">{user?.name || 'Pandit Ji'}</h1>
                <div className="mt-1 inline-flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full">
                  <Star className="w-3 h-3 text-gold" />
                  <span className="text-[10px] font-medium text-white capitalize">{user?.role || 'Priest'}</span>
                </div>
              </div>
            </button>
            <div className="flex items-center gap-2">
              <button className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center relative">
                <Bell className="w-4 h-4 text-white" />
                {bookings.filter(b => b.status === 'pending').length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                    {bookings.filter(b => b.status === 'pending').length}
                  </span>
                )}
              </button>
              <button onClick={logout} className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                <LogOut className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Current Tab Indicator */}
        <div className="sticky top-0 z-20 bg-white shadow-sm px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {currentTab && <currentTab.icon className="w-5 h-5 text-saffron" />}
              <span className="font-medium text-gray-800">{currentTab?.label || 'Home'}</span>
            </div>
            {isMoreTab && (
              <button onClick={() => setActiveTab('home')} className="text-saffron text-sm flex items-center gap-1">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
          </div>
        </div>

        {/* Mobile Content */}
        <div className="px-4 py-4">
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

        {/* Mobile Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
          <div className="flex items-center justify-around py-2 relative">
            {mainTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex flex-col items-center gap-1 px-3 py-1 ${
                  activeTab === tab.id ? 'text-saffron' : 'text-gray-500'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="text-[10px]">{tab.label}</span>
              </button>
            ))}
            {/* More Menu Button */}
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className={`flex flex-col items-center gap-1 px-3 py-1 ${
                showMoreMenu || isMoreTab ? 'text-saffron' : 'text-gray-500'
              }`}
            >
              <Menu className="w-5 h-5" />
              <span className="text-[10px]">More</span>
            </button>

            {/* More Menu Popup */}
            <AnimatePresence>
              {showMoreMenu && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-40"
                    onClick={() => setShowMoreMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute bottom-full left-0 right-0 bg-white border-t border-gray-200 shadow-lg rounded-t-2xl p-4 z-50"
                  >
                    <div className="grid grid-cols-4 gap-4">
                      {moreTabs.map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => handleTabChange(tab.id)}
                          className={`flex flex-col items-center gap-2 p-3 rounded-xl ${
                            activeTab === tab.id ? 'bg-saffron/10 text-saffron' : 'text-gray-600'
                          }`}
                        >
                          <tab.icon className="w-6 h-6" />
                          <span className="text-xs">{tab.label}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
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
function HomeTab({ analytics, bookings, panchang, festivals, posts, updateStatus }) {
  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const upcomingBookings = bookings.filter(b => b.status === 'confirmed');
  const todayFestivals = festivals.slice(0, 3);
  const recentPosts = posts.slice(0, 3);

  const getPanchangValue = (value, fallback = '') => {
    if (!value) return fallback;
    if (typeof value === 'string') return value;
    if (typeof value === 'object') return value.name || value.value || fallback;
    return String(value);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Mobile Stats */}
      <div className="md:hidden grid grid-cols-4 gap-2">
        <div className="bg-white rounded-xl p-2 text-center shadow-sm">
          <p className="text-lg font-bold text-saffron">₹{analytics?.stats?.monthly_earnings || 0}</p>
          <p className="text-[10px] text-gray-500">Month</p>
        </div>
        <div className="bg-orange-50 rounded-xl p-2 text-center shadow-sm">
          <p className="text-lg font-bold text-orange-600">{pendingBookings.length}</p>
          <p className="text-[10px] text-gray-500">Pending</p>
        </div>
        <div className="bg-white rounded-xl p-2 text-center shadow-sm">
          <p className="text-lg font-bold text-blue-600">{analytics?.stats?.total_students || 0}</p>
          <p className="text-[10px] text-gray-500">Students</p>
        </div>
        <div className="bg-white rounded-xl p-2 text-center shadow-sm">
          <p className="text-lg font-bold text-gold">{analytics?.stats?.avg_rating || '4.8'}</p>
          <p className="text-[10px] text-gray-500">Rating</p>
        </div>
      </div>

      {/* Today's Panchang Quick View */}
      {panchang && (
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-3 md:p-4 border border-orange-100">
          <div className="flex items-center gap-2 mb-2 md:mb-3">
            <Sun className="w-4 h-4 md:w-5 md:h-5 text-saffron" />
            <h3 className="font-cinzel text-sm md:text-base font-semibold text-maroon">Today's Panchang</h3>
          </div>
          <div className="grid grid-cols-4 gap-2 md:gap-3 text-xs md:text-sm">
            <div>
              <p className="text-gray-500 text-[10px] md:text-xs">Tithi</p>
              <p className="font-medium text-gray-800">{getPanchangValue(panchang.tithi, 'Dashami')}</p>
            </div>
            <div>
              <p className="text-gray-500 text-[10px] md:text-xs">Nakshatra</p>
              <p className="font-medium text-gray-800">{getPanchangValue(panchang.nakshatra, 'Rohini')}</p>
            </div>
            <div>
              <p className="text-gray-500 text-[10px] md:text-xs">Sunrise</p>
              <p className="font-medium text-gray-800">{getPanchangValue(panchang.sunrise, '6:15 AM')}</p>
            </div>
            <div>
              <p className="text-gray-500 text-[10px] md:text-xs">Sunset</p>
              <p className="font-medium text-gray-800">{getPanchangValue(panchang.sunset, '6:30 PM')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Posts Preview */}
      {recentPosts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Send className="w-4 h-4 text-saffron" />
            Recent Posts
          </h3>
          <div className="space-y-2">
            {recentPosts.map((post) => (
              <div key={post.id} className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700 line-clamp-2">{post.content}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {post.likes || 0}</span>
                  <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {post.comments || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Festivals */}
      {todayFestivals.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-saffron" />
            Upcoming Festivals
          </h3>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {todayFestivals.map((fest, i) => (
              <div key={i} className="flex-shrink-0 bg-gradient-to-br from-saffron to-gold rounded-xl p-3 text-white min-w-[120px]">
                <p className="font-semibold text-sm">{fest.name}</p>
                <p className="text-xs opacity-80">{fest.date}</p>
                {fest.days_until !== undefined && (
                  <p className="text-[10px] mt-1 bg-white/20 rounded px-2 py-0.5 inline-block">
                    {fest.days_until === 0 ? 'Today!' : `${fest.days_until} days`}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Requests */}
      {pendingBookings.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-500" />
            Pending Requests ({pendingBookings.length})
          </h2>
          <div className="space-y-3">
            {pendingBookings.slice(0, 3).map((booking) => (
              <BookingCard key={booking.id} booking={booking} onUpdateStatus={updateStatus} compact />
            ))}
          </div>
        </div>
      )}

      {/* Dashboard Overview */}
      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
        <h2 className="font-cinzel text-base md:text-lg font-semibold text-maroon mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Overview
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-3 md:p-4">
            <p className="text-xl md:text-2xl font-bold text-saffron">{analytics?.stats?.total_bookings || 0}</p>
            <p className="text-xs md:text-sm text-gray-600">Total Bookings</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 md:p-4">
            <p className="text-xl md:text-2xl font-bold text-green-600">{analytics?.stats?.completed_bookings || 0}</p>
            <p className="text-xs md:text-sm text-gray-600">Completed</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 md:p-4">
            <p className="text-xl md:text-2xl font-bold text-blue-600">{analytics?.stats?.total_classes || 0}</p>
            <p className="text-xs md:text-sm text-gray-600">Classes</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-3 md:p-4">
            <p className="text-xl md:text-2xl font-bold text-purple-600">{posts?.length || 0}</p>
            <p className="text-xs md:text-sm text-gray-600">Posts</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== POSTS TAB (New Feature) ====================
function PostsTab({ posts, onRefresh }) {
  const [showModal, setShowModal] = useState(false);
  const [newPost, setNewPost] = useState({ content: '', image_url: '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid image (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image too large. Maximum size is 5MB.');
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);

    // Upload to server
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/api/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setNewPost({ ...newPost, image_url: response.data.url });
      toast.success('Image uploaded!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
      setImagePreview(null);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setNewPost({ ...newPost, image_url: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const createPost = async () => {
    if (!newPost.content.trim()) {
      toast.error('Please write something');
      return;
    }
    setSaving(true);
    try {
      await api.post('/api/priest/posts', newPost);
      toast.success('Post published!');
      setNewPost({ content: '', image_url: '' });
      setImagePreview(null);
      setShowModal(false);
      onRefresh();
    } catch (error) {
      toast.error('Failed to post');
    } finally {
      setSaving(false);
    }
  };

  const deletePost = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await api.delete(`/api/priest/posts/${postId}`);
      toast.success('Post deleted');
      onRefresh();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setNewPost({ content: '', image_url: '' });
    setImagePreview(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-cinzel text-lg md:text-xl font-semibold text-maroon">Daily Updates</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-saffron text-white px-4 py-2 rounded-lg text-sm"
        >
          <Plus className="w-4 h-4" /> New Post
        </button>
      </div>

      <p className="text-sm text-gray-500">
        Share daily updates, spiritual thoughts, mantras, or announcements with your devotees.
      </p>

      {posts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <Send className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-400 mb-4">No posts yet</p>
          <button onClick={() => setShowModal(true)} className="text-saffron hover:underline">
            Share your first update
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex justify-between items-start mb-3">
                <p className="text-xs text-gray-400">
                  {new Date(post.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
                <button onClick={() => deletePost(post.id)} className="text-gray-400 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
              
              {post.image_url && (
                <img src={post.image_url} alt="Post" className="mt-3 rounded-lg max-h-60 object-cover" />
              )}
              
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
                <span className="flex items-center gap-1 text-sm text-gray-500">
                  <Heart className="w-4 h-4" /> {post.likes || 0} likes
                </span>
                <span className="flex items-center gap-1 text-sm text-gray-500">
                  <MessageCircle className="w-4 h-4" /> {post.comments || 0} comments
                </span>
                <span className="flex items-center gap-1 text-sm text-gray-500">
                  <Eye className="w-4 h-4" /> {post.views || 0} views
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Post Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
                <h2 className="font-cinzel text-lg font-semibold text-maroon">Create Post</h2>
                <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-4 space-y-4">
                <textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  placeholder="Share spiritual thoughts, daily mantras, or announcements..."
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50 resize-none"
                />
                
                {/* Image Upload Section */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Add Image (optional)</label>
                  
                  {/* Hidden file input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                  />
                  
                  {/* Image Preview or Upload Button */}
                  {imagePreview || newPost.image_url ? (
                    <div className="relative">
                      <img 
                        src={imagePreview || newPost.image_url} 
                        alt="Preview" 
                        className="w-full h-48 object-cover rounded-xl border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      {uploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
                          <Loader2 className="w-8 h-8 text-white animate-spin" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-saffron hover:bg-orange-50 transition-colors flex flex-col items-center gap-2 text-gray-500"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-8 h-8 animate-spin text-saffron" />
                          <span className="text-sm">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Camera className="w-8 h-8 text-gray-400" />
                          <span className="text-sm">Click to upload image</span>
                          <span className="text-xs text-gray-400">JPEG, PNG, GIF, WebP (max 5MB)</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
              
              <div className="p-4 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white">
                <button onClick={closeModal} className="px-4 py-2 text-gray-600">
                  Cancel
                </button>
                <button
                  onClick={createPost}
                  disabled={saving || uploading}
                  className="px-6 py-2 bg-saffron text-white rounded-xl disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Post
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ==================== BOOKING CARD ====================
function BookingCard({ booking, onUpdateStatus, compact = false }) {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  return (
    <div className={`border border-orange-100 rounded-xl ${compact ? 'p-3' : 'p-4'}`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className={`font-semibold text-gray-800 ${compact ? 'text-sm' : ''}`}>{booking.service_name}</p>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <User className="w-3 h-3" />
            {booking.user_name}
          </p>
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            {new Date(booking.booking_date).toLocaleDateString('en-IN', { 
              weekday: 'short', day: 'numeric', month: 'short'
            })}
          </div>
          <p className="text-sm font-medium text-saffron mt-1">₹{booking.price}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${statusColors[booking.status]}`}>
          {booking.status}
        </span>
      </div>

      {booking.status === 'pending' && (
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => onUpdateStatus(booking.id, 'confirmed')}
            className="flex-1 bg-green-500 text-white rounded-lg py-1.5 text-xs flex items-center justify-center gap-1"
          >
            <CheckCircle className="w-3 h-3" /> Accept
          </button>
          <button
            onClick={() => onUpdateStatus(booking.id, 'cancelled')}
            className="flex-1 bg-red-500 text-white rounded-lg py-1.5 text-xs flex items-center justify-center gap-1"
          >
            <XCircle className="w-3 h-3" /> Decline
          </button>
        </div>
      )}

      {booking.status === 'confirmed' && (
        <button
          onClick={() => onUpdateStatus(booking.id, 'completed')}
          className="w-full bg-saffron text-white rounded-lg py-1.5 text-xs mt-2"
        >
          Mark Completed
        </button>
      )}
    </div>
  );
}

// ==================== PROFILE TAB with Photo Upload ====================
function ProfileTab({ profile, user, onRefresh }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    bio: profile?.bio || '',
    experience_years: profile?.experience_years || 5,
    specializations: profile?.specializations || [],
    languages: profile?.languages || ['Hindi', 'Sanskrit'],
    base_price: profile?.base_price || 1100,
    work_locations: profile?.work_locations || [],
    phone: user?.phone || '',
    email: user?.email || '',
    profile_photo: profile?.profile_photo || ''
  });
  const [newLocation, setNewLocation] = useState('');

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // For now, we'll use a URL-based approach
    // In production, you'd upload to cloud storage
    const reader = new FileReader();
    reader.onloadend = async () => {
      setUploading(true);
      try {
        // Store as base64 or upload to server
        const base64 = reader.result;
        setFormData({ ...formData, profile_photo: base64 });
        toast.success('Photo updated! Click Save to apply.');
      } catch (error) {
        toast.error('Failed to upload photo');
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

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

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/api/priest/profile', formData);
      toast.success('Profile updated!');
      setEditing(false);
      onRefresh();
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-cinzel text-lg md:text-xl font-semibold text-maroon">My Profile</h2>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 bg-saffron text-white px-3 md:px-4 py-2 rounded-lg text-sm"
          >
            <Edit className="w-4 h-4" /> Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm disabled:opacity-50 flex items-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
          </div>
        )}
      </div>

      {/* Profile Photo Section */}
      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
        <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6">
          <div className="relative">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-saffron to-gold flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
              {formData.profile_photo ? (
                <img src={formData.profile_photo} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl md:text-4xl font-bold text-white">{user?.name?.charAt(0) || 'P'}</span>
              )}
            </div>
            {editing && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-0 right-0 w-8 h-8 md:w-9 md:h-9 bg-saffron rounded-full flex items-center justify-center text-white shadow-md hover:bg-saffron-dark"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                </button>
              </>
            )}
          </div>
          <div className="text-center sm:text-left">
            <h3 className="font-cinzel text-lg md:text-xl font-bold text-maroon">{user?.name}</h3>
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
              <Star className="w-4 h-4 text-gold fill-gold" />
              <span className="text-sm text-gray-600">4.8 rating</span>
              <span className="text-gray-400">•</span>
              <span className="text-sm text-gray-600">{formData.experience_years} years exp.</span>
            </div>
            {profile?.is_verified && (
              <div className="flex items-center justify-center sm:justify-start gap-1 mt-2 text-green-600">
                <Award className="w-4 h-4" />
                <span className="text-sm font-medium">Verified Priest</span>
              </div>
            )}
            {editing && (
              <p className="text-xs text-gray-400 mt-2">Click camera to upload photo</p>
            )}
          </div>
        </div>
      </div>

      {/* Bio */}
      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
        <h3 className="font-semibold text-gray-800 mb-3">About Me</h3>
        {editing ? (
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            placeholder="Write about yourself..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
          />
        ) : (
          <p className="text-gray-600 text-sm md:text-base">{formData.bio || 'No bio added yet.'}</p>
        )}
      </div>

      {/* Specializations */}
      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
        <h3 className="font-semibold text-gray-800 mb-3">Specializations</h3>
        <div className="flex flex-wrap gap-2">
          {SPECIALIZATIONS.map((spec) => (
            <button
              key={spec}
              onClick={() => editing && toggleSpecialization(spec)}
              disabled={!editing}
              className={`px-3 py-1.5 rounded-full text-xs md:text-sm transition-colors ${
                formData.specializations.includes(spec)
                  ? 'bg-saffron text-white'
                  : editing ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-gray-100 text-gray-400'
              }`}
            >
              {spec}
            </button>
          ))}
        </div>
      </div>

      {/* Languages */}
      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
        <h3 className="font-semibold text-gray-800 mb-3">Languages</h3>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang}
              onClick={() => editing && toggleLanguage(lang)}
              disabled={!editing}
              className={`px-3 py-1.5 rounded-full text-xs md:text-sm transition-colors ${
                formData.languages.includes(lang)
                  ? 'bg-blue-500 text-white'
                  : editing ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-gray-100 text-gray-400'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      {/* Work Locations */}
      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
        <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-saffron" />
          Work Locations
        </h3>
        <p className="text-xs text-gray-500 mb-3">Areas where you can provide services</p>
        
        {editing && (
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              placeholder="Add city or area"
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
              onKeyPress={(e) => e.key === 'Enter' && addWorkLocation()}
            />
            <button onClick={addWorkLocation} className="px-3 py-2 bg-saffron text-white rounded-lg">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {formData.work_locations.length === 0 ? (
            <p className="text-gray-400 text-sm">No locations added</p>
          ) : (
            formData.work_locations.map((loc, i) => (
              <div key={i} className="flex items-center gap-1 bg-orange-100 text-orange-700 px-3 py-1.5 rounded-full text-sm">
                <MapPin className="w-3 h-3" />
                {loc}
                {editing && (
                  <button onClick={() => setFormData({ ...formData, work_locations: formData.work_locations.filter(l => l !== loc) })}>
                    <X className="w-3 h-3 ml-1 hover:text-red-500" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Contact & Pricing */}
      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Contact & Pricing</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Phone</label>
            {editing ? (
              <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            ) : (
              <p className="text-sm text-gray-800">{formData.phone || 'Not provided'}</p>
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Experience</label>
            {editing ? (
              <input type="number" value={formData.experience_years} onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            ) : (
              <p className="text-sm text-gray-800">{formData.experience_years} years</p>
            )}
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-gray-500 mb-1">Base Price (₹)</label>
            {editing ? (
              <input type="number" value={formData.base_price} onChange={(e) => setFormData({ ...formData, base_price: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            ) : (
              <p className="text-lg font-bold text-saffron">₹{formData.base_price}</p>
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

  const filteredBookings = bookings.filter(b => filter === 'all' || b.status === filter);
  const stats = {
    all: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
  };

  return (
    <div className="space-y-4">
      <h2 className="font-cinzel text-lg md:text-xl font-semibold text-maroon">Bookings</h2>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {Object.entries(stats).map(([status, count]) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1.5 rounded-full text-xs md:text-sm font-medium whitespace-nowrap ${
              filter === status ? 'bg-saffron text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)} ({count})
          </button>
        ))}
      </div>

      {filteredBookings.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-400">No bookings found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-xl shadow-sm p-4">
              <BookingCard booking={booking} onUpdateStatus={updateStatus} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== CLASSES TAB with Schedule Options ====================
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
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-cinzel text-lg md:text-xl font-semibold text-maroon">Classes</h2>
        <button
          onClick={() => { setEditingClass(null); setShowModal(true); }}
          className="flex items-center gap-2 bg-saffron text-white px-4 py-2 rounded-lg text-sm"
        >
          <Plus className="w-4 h-4" /> Add Class
        </button>
      </div>

      {classes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-400">No classes yet</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {classes.map((cls) => (
            <div key={cls.id} className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-saffron">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-gray-800">{cls.title}</h3>
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{cls.category}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditingClass(cls); setShowModal(true); }} className="p-1.5 hover:bg-gray-100 rounded">
                    <Edit className="w-4 h-4 text-gray-500" />
                  </button>
                  <button onClick={() => deleteClass(cls.id)} className="p-1.5 hover:bg-red-50 rounded">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
              
              <p className="text-sm text-gray-500 mb-2 line-clamp-2">{cls.description}</p>
              
              <div className="flex flex-wrap gap-2 text-xs md:text-sm">
                <span className="flex items-center gap-1 text-gray-600">
                  <Clock className="w-3 h-3" /> {cls.duration_minutes} min
                </span>
                <span className="flex items-center gap-1 text-gray-600">
                  <Users className="w-3 h-3" /> {cls.enrolled_count || 0}/{cls.max_students}
                </span>
                <span className="flex items-center gap-1 text-saffron font-medium">₹{cls.price}</span>
              </div>
              
              {cls.frequency && cls.frequency !== 'once' && (
                <div className="mt-2 flex items-center gap-1 text-xs text-blue-600">
                  <Repeat className="w-3 h-3" />
                  {cls.frequency === 'daily' && 'Daily'}
                  {cls.frequency === 'weekly' && `Every ${cls.schedule_day || 'week'}`}
                  {cls.frequency === 'biweekly' && 'Bi-weekly'}
                  {cls.frequency === 'monthly' && 'Monthly'}
                </div>
              )}
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

// ==================== CLASS MODAL with Schedule Options ====================
function ClassModal({ isOpen, onClose, editData, onSuccess }) {
  const [form, setForm] = useState({
    title: '', description: '', class_type: 'online', duration_minutes: 60,
    price: 500, max_students: 20, category: 'General',
    frequency: 'weekly', schedule_day: 'Monday', schedule_time: '10:00'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editData) {
      setForm({
        ...editData,
        frequency: editData.frequency || 'weekly',
        schedule_day: editData.schedule_day || 'Monday',
        schedule_time: editData.schedule_time || '10:00'
      });
    } else {
      setForm({
        title: '', description: '', class_type: 'online', duration_minutes: 60,
        price: 500, max_students: 20, category: 'General',
        frequency: 'weekly', schedule_day: 'Monday', schedule_time: '10:00'
      });
    }
  }, [editData, isOpen]);

  const handleSubmit = async () => {
    if (!form.title) { toast.error('Enter class title'); return; }
    setSaving(true);
    try {
      if (editData) await api.put(`/api/priest/classes/${editData.id}`, form);
      else await api.post('/api/priest/classes', form);
      toast.success(editData ? 'Updated!' : 'Created!');
      onSuccess(); onClose();
    } catch { toast.error('Failed'); }
    finally { setSaving(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white">
          <h2 className="font-cinzel text-lg font-semibold text-maroon">{editData ? 'Edit Class' : 'New Class'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title*</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl" placeholder="e.g., Sanskrit for Beginners" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-4 py-2 border border-gray-200 rounded-xl" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl">
                <option>General</option>
                <option>Vedic Chanting</option>
                <option>Sanskrit</option>
                <option>Puja Rituals</option>
                <option>Meditation</option>
                <option>Philosophy</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={form.class_type} onChange={(e) => setForm({ ...form, class_type: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl">
                <option value="online">Online</option>
                <option value="offline">In-person</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
              <input type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) })} className="w-full px-4 py-2 border border-gray-200 rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
              <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) })} className="w-full px-4 py-2 border border-gray-200 rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Students</label>
              <input type="number" value={form.max_students} onChange={(e) => setForm({ ...form, max_students: parseInt(e.target.value) })} className="w-full px-4 py-2 border border-gray-200 rounded-xl" />
            </div>
          </div>
          
          {/* Schedule Section */}
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
              <Repeat className="w-4 h-4 text-saffron" /> Schedule
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl">
                  {SCHEDULE_FREQUENCIES.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
              
              {(form.frequency === 'weekly' || form.frequency === 'biweekly') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
                  <select value={form.schedule_day} onChange={(e) => setForm({ ...form, schedule_day: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl">
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              )}
            </div>
            
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <input type="time" value={form.schedule_time} onChange={(e) => setForm({ ...form, schedule_time: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl" />
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t flex justify-end gap-3 sticky bottom-0 bg-white">
          <button onClick={onClose} className="px-4 py-2 text-gray-600">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="px-6 py-2 bg-saffron text-white rounded-xl disabled:opacity-50 flex items-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {editData ? 'Update' : 'Create'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ==================== Simplified remaining tabs ====================
function ServicesTab({ services, onRefresh }) {
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);

  const handleAddClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingService(null);
    setShowModal(true);
  };

  const deleteService = async (serviceId) => {
    if (!window.confirm('Delete this service?')) return;
    try {
      await api.delete(`/api/priest/services/${serviceId}`);
      toast.success('Service deleted');
      onRefresh();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-cinzel text-lg font-semibold text-maroon">Services</h2>
        <button 
          type="button"
          data-testid="add-service-btn"
          onClick={handleAddClick}
          onTouchEnd={handleAddClick}
          style={{ pointerEvents: 'auto', touchAction: 'manipulation' }}
          className="flex items-center gap-2 bg-saffron text-white px-4 py-2 rounded-lg text-sm hover:bg-saffron/90 active:scale-95 transition-all cursor-pointer select-none"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>
      {services.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center"><Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-400">No services yet</p></div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {services.map(s => (
            <div key={s.id} className="bg-white rounded-xl p-4 border-l-4 border-saffron">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{s.name}</h3>
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{s.category}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditingService(s); setShowModal(true); }} className="p-1.5 hover:bg-gray-100 rounded">
                    <Edit className="w-4 h-4 text-gray-500" />
                  </button>
                  <button onClick={() => deleteService(s.id)} className="p-1.5 hover:bg-red-50 rounded">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">{s.description}</p>
              <div className="flex gap-3 mt-2 text-sm">
                <span><Clock className="w-3 h-3 inline" /> {s.duration_minutes}min</span>
                <span className="text-saffron font-medium">₹{s.price}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <ServiceModal 
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingService(null); }}
        editData={editingService}
        onSuccess={onRefresh}
      />
    </div>
  );
}

// Service Modal Component
function ServiceModal({ isOpen, onClose, editData, onSuccess }) {
  const [form, setForm] = useState({
    name: '', description: '', category: 'Pooja', duration_minutes: 60, price: 1100
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editData) {
      setForm({
        name: editData.name || '',
        description: editData.description || '',
        category: editData.category || 'Pooja',
        duration_minutes: editData.duration_minutes || 60,
        price: editData.price || 1100
      });
    } else {
      setForm({ name: '', description: '', category: 'Pooja', duration_minutes: 60, price: 1100 });
    }
  }, [editData, isOpen]);

  const handleSubmit = async () => {
    if (!form.name) { toast.error('Enter service name'); return; }
    setSaving(true);
    try {
      if (editData) {
        await api.put(`/api/priest/services/${editData.id}`, form);
      } else {
        await api.post('/api/priest/services', form);
      }
      toast.success(editData ? 'Service updated!' : 'Service added!');
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
        <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white">
          <h2 className="font-cinzel text-lg font-semibold text-maroon">{editData ? 'Edit Service' : 'Add Service'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service Name*</label>
            <input 
              type="text" 
              value={form.name} 
              onChange={(e) => setForm({ ...form, name: e.target.value })} 
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50" 
              placeholder="e.g., Satyanarayan Pooja" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea 
              value={form.description} 
              onChange={(e) => setForm({ ...form, description: e.target.value })} 
              rows={3} 
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50" 
              placeholder="Describe the service..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select 
              value={form.category} 
              onChange={(e) => setForm({ ...form, category: e.target.value })} 
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
            >
              <option value="Pooja">Pooja</option>
              <option value="Homam">Homam/Havan</option>
              <option value="Ceremony">Ceremony</option>
              <option value="Consultation">Consultation</option>
              <option value="Online">Online Service</option>
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
              <input 
                type="number" 
                value={form.duration_minutes} 
                onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) || 60 })} 
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
              <input 
                type="number" 
                value={form.price} 
                onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })} 
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50" 
              />
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t flex justify-end gap-3 sticky bottom-0 bg-white">
          <button onClick={onClose} className="px-4 py-2 text-gray-600">Cancel</button>
          <button 
            onClick={handleSubmit} 
            disabled={saving} 
            className="px-6 py-2 bg-saffron text-white rounded-xl disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {editData ? 'Update' : 'Add Service'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ReviewsTab({ reviews }) {
  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '0.0';
  return (
    <div className="space-y-4">
      <h2 className="font-cinzel text-lg font-semibold text-maroon">Reviews</h2>
      <div className="bg-white rounded-xl p-6 text-center">
        <p className="text-4xl font-bold text-maroon">{avgRating}</p>
        <div className="flex justify-center gap-1 my-2">{[1,2,3,4,5].map(s => <Star key={s} className={`w-5 h-5 ${s <= Math.round(parseFloat(avgRating)) ? 'text-gold fill-gold' : 'text-gray-300'}`} />)}</div>
        <p className="text-gray-500">{reviews.length} reviews</p>
      </div>
      {reviews.length === 0 ? <p className="text-center text-gray-400 py-8">No reviews yet</p> : (
        <div className="space-y-3">{reviews.map(r => (
          <div key={r.id} className="bg-white rounded-xl p-4">
            <div className="flex justify-between"><span className="font-medium">{r.user_name}</span><div className="flex gap-0.5">{[1,2,3,4,5].map(s => <Star key={s} className={`w-4 h-4 ${s <= r.rating ? 'text-gold fill-gold' : 'text-gray-300'}`} />)}</div></div>
            <p className="text-sm text-gray-600 mt-2">{r.comment}</p>
          </div>
        ))}</div>
      )}
    </div>
  );
}

function PortfolioTab({ portfolio, onRefresh }) {
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newItem, setNewItem] = useState({ title: '', description: '', type: 'image', url: '' });
  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid image or video file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 10MB.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/api/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setNewItem({ 
        ...newItem, 
        url: response.data.url,
        type: file.type.startsWith('video') ? 'video' : 'image'
      });
      toast.success('File uploaded!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItem.url) {
      toast.error('Please upload an image or video');
      return;
    }

    try {
      await api.post('/api/priest/portfolio', {
        title: newItem.title || 'Untitled',
        description: newItem.description,
        type: newItem.type,
        url: newItem.url
      });
      toast.success('Portfolio item added!');
      setNewItem({ title: '', description: '', type: 'image', url: '' });
      setShowModal(false);
      onRefresh();
    } catch (error) {
      toast.error('Failed to add item');
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Delete this portfolio item?')) return;
    try {
      await api.delete(`/api/priest/portfolio/${itemId}`);
      toast.success('Item deleted');
      onRefresh();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleAddClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowModal(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-cinzel text-lg font-semibold text-maroon">Portfolio</h2>
        <button 
          type="button"
          onClick={handleAddClick}
          className="flex items-center gap-2 bg-saffron text-white px-4 py-2 rounded-lg text-sm hover:bg-saffron/90 active:scale-95 transition-all cursor-pointer"
        >
          <Upload className="w-4 h-4" /> Add
        </button>
      </div>
      {portfolio.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center">
          <Image className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-400">No portfolio items</p>
          <p className="text-sm text-gray-300 mt-1">Add photos and videos of your work</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {portfolio.map(p => (
            <div key={p.id} className="aspect-square rounded-xl bg-gray-100 overflow-hidden relative group">
              {p.type === 'video' ? (
                <video src={p.url} className="w-full h-full object-cover" />
              ) : (
                <img src={p.url} alt={p.title} className="w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={() => handleDelete(p.id)}
                  className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {p.title && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                  <p className="text-white text-xs truncate">{p.title}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Portfolio Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-lg w-full"
          >
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-cinzel text-lg font-semibold text-maroon">Add Portfolio Item</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Image/Video*</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm"
                  className="hidden"
                />
                
                {newItem.url ? (
                  <div className="relative">
                    {newItem.type === 'video' ? (
                      <video src={newItem.url} className="w-full h-48 object-cover rounded-xl" controls />
                    ) : (
                      <img src={newItem.url} alt="Preview" className="w-full h-48 object-cover rounded-xl" />
                    )}
                    <button
                      onClick={() => setNewItem({ ...newItem, url: '' })}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full p-8 border-2 border-dashed border-gray-300 rounded-xl hover:border-saffron hover:bg-orange-50 transition-colors flex flex-col items-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-8 h-8 animate-spin text-saffron" />
                        <span className="text-sm text-gray-500">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Camera className="w-8 h-8 text-gray-400" />
                        <span className="text-sm text-gray-500">Click to upload</span>
                        <span className="text-xs text-gray-400">Images or Videos (max 10MB)</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title (optional)</label>
                <input
                  type="text"
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
                  placeholder="e.g., Satyanarayan Pooja at Mumbai"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                <textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
                  placeholder="Add details about this work..."
                />
              </div>
            </div>
            
            <div className="p-4 border-t flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600">Cancel</button>
              <button
                onClick={handleAddItem}
                disabled={!newItem.url || uploading}
                className="px-6 py-2 bg-saffron text-white rounded-xl disabled:opacity-50 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add to Portfolio
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function PanchangTab({ panchang, festivals }) {
  const getPanchangValue = (v, f = '') => { if (!v) return f; if (typeof v === 'string') return v; if (typeof v === 'object') return v.name || v.value || f; return String(v); };
  return (
    <div className="space-y-4">
      <h2 className="font-cinzel text-lg font-semibold text-maroon">Panchang & Calendar</h2>
      <div className="bg-white rounded-xl p-4 md:p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><Sun className="w-5 h-5 text-saffron" /> Today's Panchang</h3>
        {panchang ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[{l:'Tithi',v:panchang.tithi},{l:'Nakshatra',v:panchang.nakshatra},{l:'Yoga',v:panchang.yoga},{l:'Karana',v:panchang.karana},{l:'Sunrise',v:panchang.sunrise},{l:'Sunset',v:panchang.sunset}].map((i,idx) => (
              <div key={idx} className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-500">{i.l}</p><p className="font-medium">{getPanchangValue(i.v, '--')}</p></div>
            ))}
          </div>
        ) : <p className="text-center text-gray-400 py-4">Loading...</p>}
      </div>
      <div className="bg-white rounded-xl p-4 md:p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><CalendarDays className="w-5 h-5 text-saffron" /> Upcoming Festivals</h3>
        <div className="space-y-2">{festivals.slice(0,10).map((f,i) => (
          <div key={i} className="flex justify-between items-center p-3 bg-orange-50 rounded-xl">
            <div><p className="font-medium">{f.name}</p><p className="text-sm text-gray-500">{f.date}</p></div>
            {f.days_until !== undefined && <span className={`px-3 py-1 rounded-full text-sm ${f.days_until === 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{f.days_until === 0 ? 'Today!' : `${f.days_until} days`}</span>}
          </div>
        ))}</div>
      </div>
    </div>
  );
}

function EarningsTab({ earnings, analytics }) {
  return (
    <div className="space-y-4">
      <h2 className="font-cinzel text-lg font-semibold text-maroon">Earnings</h2>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-4 text-white"><p className="text-sm opacity-80">Total</p><p className="text-2xl font-bold">₹{earnings?.total_earnings || analytics?.stats?.total_earnings || 0}</p></div>
        <div className="bg-gradient-to-br from-saffron to-orange-500 rounded-xl p-4 text-white"><p className="text-sm opacity-80">This Month</p><p className="text-2xl font-bold">₹{earnings?.monthly_earnings || analytics?.stats?.monthly_earnings || 0}</p></div>
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-4 text-white"><p className="text-sm opacity-80">Pending</p><p className="text-2xl font-bold">₹{earnings?.pending_payouts || 0}</p></div>
      </div>
      <div className="bg-white rounded-xl p-4"><h3 className="font-semibold mb-4">Recent Transactions</h3>
        {(!earnings?.transactions || earnings.transactions.length === 0) ? <p className="text-center text-gray-400 py-8">No transactions</p> : (
          <div className="space-y-2">{earnings.transactions.slice(0,10).map((t,i) => (
            <div key={i} className="flex justify-between p-3 border border-gray-100 rounded-xl">
              <div><p className="font-medium">{t.description}</p><p className="text-xs text-gray-400">{t.date}</p></div>
              <p className="font-bold text-green-600">+₹{t.amount}</p>
            </div>
          ))}</div>
        )}
      </div>
    </div>
  );
}

function StreamsTab({ streams, onRefresh }) {
  const [showModal, setShowModal] = useState(false);
  const scheduled = streams.filter(s => s.status === 'scheduled');
  const live = streams.filter(s => s.status === 'live');
  const past = streams.filter(s => s.status === 'ended');

  const handleScheduleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowModal(true);
  };

  const startStream = async (streamId) => {
    try {
      await api.put(`/api/priest/streams/${streamId}/start`);
      toast.success('Stream started! You are now live.');
      onRefresh();
    } catch (error) {
      toast.error('Failed to start stream');
    }
  };

  const endStream = async (streamId) => {
    if (!window.confirm('End this stream?')) return;
    try {
      await api.put(`/api/priest/streams/${streamId}/end`);
      toast.success('Stream ended');
      onRefresh();
    } catch (error) {
      toast.error('Failed to end stream');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-cinzel text-lg font-semibold text-maroon">Live Streams</h2>
        <button 
          type="button"
          data-testid="schedule-stream-btn"
          onClick={handleScheduleClick}
          onTouchEnd={handleScheduleClick}
          style={{ pointerEvents: 'auto', touchAction: 'manipulation' }}
          className="flex items-center gap-2 bg-saffron text-white px-4 py-2 rounded-lg text-sm hover:bg-saffron/90 active:scale-95 transition-all cursor-pointer select-none"
        >
          <Plus className="w-4 h-4" /> Schedule
        </button>
      </div>

      {live.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <h3 className="font-semibold text-red-700 flex items-center gap-2 mb-3">
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>Live Now
          </h3>
          {live.map(s => (
            <div key={s.id} className="bg-white rounded-xl p-3 flex justify-between items-center">
              <div>
                <p className="font-medium">{s.title}</p>
                <p className="text-sm text-gray-500">{s.viewer_count || 0} watching</p>
              </div>
              <button onClick={() => endStream(s.id)} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm flex items-center gap-1">
                <Square className="w-4 h-4" /> End
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl p-4">
        <h3 className="font-semibold mb-3">Scheduled ({scheduled.length})</h3>
        {scheduled.length === 0 ? (
          <p className="text-center text-gray-400 py-4">No scheduled streams</p>
        ) : (
          <div className="space-y-2">
            {scheduled.map(s => (
              <div key={s.id} className="flex justify-between items-center p-3 border border-gray-100 rounded-xl">
                <div>
                  <p className="font-medium">{s.title}</p>
                  <p className="text-xs text-gray-400">{new Date(s.scheduled_at).toLocaleString()}</p>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{s.stream_type}</span>
                </div>
                <button onClick={() => startStream(s.id)} className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm flex items-center gap-1">
                  <Play className="w-4 h-4" /> Go Live
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {past.length > 0 && (
        <div className="bg-white rounded-xl p-4">
          <h3 className="font-semibold mb-3">Past Streams ({past.length})</h3>
          <div className="space-y-2">
            {past.slice(0, 5).map(s => (
              <div key={s.id} className="p-3 border border-gray-100 rounded-xl">
                <p className="font-medium">{s.title}</p>
                <div className="flex gap-3 text-xs text-gray-400 mt-1">
                  <span>{new Date(s.ended_at).toLocaleDateString()}</span>
                  <span>{s.max_viewers || 0} max viewers</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <StreamModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={onRefresh}
      />
    </div>
  );
}

// Stream Modal Component
function StreamModal({ isOpen, onClose, onSuccess }) {
  const [form, setForm] = useState({
    title: '', description: '', stream_type: 'puja', scheduled_at: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Set default scheduled time to 1 hour from now
      const defaultTime = new Date();
      defaultTime.setHours(defaultTime.getHours() + 1);
      setForm({
        title: '',
        description: '',
        stream_type: 'puja',
        scheduled_at: defaultTime.toISOString().slice(0, 16)
      });
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!form.title) { toast.error('Enter stream title'); return; }
    if (!form.scheduled_at) { toast.error('Select schedule time'); return; }
    
    setSaving(true);
    try {
      await api.post('/api/priest/streams', {
        ...form,
        scheduled_at: new Date(form.scheduled_at).toISOString()
      });
      toast.success('Stream scheduled!');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('Failed to schedule stream');
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
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-cinzel text-lg font-semibold text-maroon">Schedule Live Stream</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stream Title*</label>
            <input 
              type="text" 
              value={form.title} 
              onChange={(e) => setForm({ ...form, title: e.target.value })} 
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50" 
              placeholder="e.g., Morning Aarti Live" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea 
              value={form.description} 
              onChange={(e) => setForm({ ...form, description: e.target.value })} 
              rows={2} 
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50" 
              placeholder="What will you stream?"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stream Type</label>
              <select 
                value={form.stream_type} 
                onChange={(e) => setForm({ ...form, stream_type: e.target.value })} 
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
              >
                <option value="puja">Pooja</option>
                <option value="aarti">Aarti</option>
                <option value="discourse">Discourse</option>
                <option value="class">Class</option>
                <option value="qa">Q&A Session</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Time*</label>
              <input 
                type="datetime-local" 
                value={form.scheduled_at} 
                onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} 
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50" 
              />
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-600">Cancel</button>
          <button 
            onClick={handleSubmit} 
            disabled={saving} 
            className="px-6 py-2 bg-saffron text-white rounded-xl disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
            Schedule Stream
          </button>
        </div>
      </motion.div>
    </div>
  );
}
