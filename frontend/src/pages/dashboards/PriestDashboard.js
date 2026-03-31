import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, LogOut, Star, Bell, Loader2, BookOpen,
  Video, Users, Plus, IndianRupee, Image, MessageSquare, Sun,
  AlertCircle, Menu, Send, ChevronLeft, Briefcase, Repeat, Clock
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { Toaster, toast } from 'sonner';
import ChatTab from '../../components/Chat/ChatTab';
import NotificationBell from '../../components/NotificationBell';

import { OmIcon, ROLE_CONFIG } from './priest/components/shared';
import { HomeTab } from './priest/components/HomeTab';
import { PostsTab } from './priest/components/PostsTab';
import { BookingsTab } from './priest/components/BookingsTab';
import { ProfileTab } from './priest/components/ProfileTab';
import { ClassesTab } from './priest/components/ClassesTab';
import { ServicesTab } from './priest/components/ServicesTab';
import { ReviewsTab, PortfolioTab, PanchangTab, EarningsTab } from './priest/components/MiscTabs';
import { StreamsTab } from './priest/components/StreamsTab';
import AvailabilityTab from './priest/components/AvailabilityTab';

// Tab configurations
const mainTabs = [
  { id: 'home', label: 'Home', icon: OmIcon },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'posts', label: 'Posts', icon: Send },
  { id: 'bookings', label: 'Bookings', icon: Calendar },
  { id: 'profile', label: 'Profile', icon: ({ className }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
];

const moreTabs = [
  { id: 'services', label: 'Services', icon: Briefcase },
  { id: 'availability', label: 'Availability', icon: Clock },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'portfolio', label: 'Portfolio', icon: Image },
  { id: 'panchang', label: 'Panchang', icon: Sun },
  { id: 'earnings', label: 'Earnings', icon: IndianRupee },
  { id: 'classes', label: 'Classes', icon: BookOpen },
  { id: 'streams', label: 'Live', icon: Video },
];

const allTabs = [...mainTabs, ...moreTabs];

export default function PriestDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [welcomeShown, setWelcomeShown] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

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

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  useEffect(() => { fetchDashboardData(); }, []);

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
      try {
        const profileRes = await api.get('/api/priest/profile');
        setPriestProfile(profileRes.data);
      } catch {
        setPriestProfile({ specializations: [], languages: ['Hindi', 'Sanskrit'], experience_years: 5, bio: '', work_locations: [], base_price: 1100, profile_photo: null });
      }
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
      } catch (e) { console.error('Error fetching additional data:', e); }
    } catch (error) {
      console.error('Dashboard error:', error);
      toast.error('Failed to load dashboard data');
    } finally { setLoading(false); }
  };

  const silentRefresh = async () => {
    try {
      const [analyticsRes, bookingsRes, classesRes, streamsRes, postsRes] = await Promise.all([
        api.get('/api/priest/analytics').catch(() => ({ data: null })),
        api.get('/api/priest/bookings').catch(() => ({ data: { bookings: [] } })),
        api.get('/api/priest/classes').catch(() => ({ data: { classes: [] } })),
        api.get('/api/priest/streams').catch(() => ({ data: { streams: [] } })),
        api.get('/api/priest/posts').catch(() => ({ data: { posts: [] } })),
      ]);
      setAnalytics(analyticsRes.data); setBookings(bookingsRes.data?.bookings || []);
      setClasses(classesRes.data?.classes || []); setStreams(streamsRes.data?.streams || []);
      setPosts(postsRes.data?.posts || []);
      try { const profileRes = await api.get('/api/priest/profile'); setPriestProfile(profileRes.data); } catch {}
      try {
        const [reviewsRes, portfolioRes, servicesRes, earningsRes] = await Promise.all([
          api.get('/api/priest/reviews').catch(() => ({ data: { reviews: [] } })),
          api.get('/api/priest/portfolio').catch(() => ({ data: { items: [] } })),
          api.get('/api/priest/services').catch(() => ({ data: { services: [] } })),
          api.get('/api/priest/earnings').catch(() => ({ data: null })),
        ]);
        setReviews(reviewsRes.data?.reviews || []); setPortfolio(portfolioRes.data?.items || []);
        setServices(servicesRes.data?.services || []); setEarnings(earningsRes.data || { total_earnings: 0, monthly_earnings: 0 });
      } catch {}
    } catch {}
  };

  const updateBookingStatus = async (bookingId, status) => {
    try {
      await api.put(`/api/bookings/${bookingId}/status?status=${status}`);
      const statusMessages = {
        confirmed: 'Booking accepted successfully!',
        completed: 'Booking marked as completed!',
        cancelled: 'Booking cancelled.',
      };
      toast.success(statusMessages[status] || 'Booking updated!');
      silentRefresh();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update booking');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home': return <HomeTab analytics={analytics} bookings={bookings} panchang={panchang} festivals={festivals} posts={posts} updateStatus={updateBookingStatus} />;
      case 'messages': return <ChatTab isDesktop={isDesktop} />;
      case 'posts': return <PostsTab posts={posts} onRefresh={silentRefresh} />;
      case 'profile': return <ProfileTab profile={priestProfile} user={user} onRefresh={silentRefresh} />;
      case 'bookings': return <BookingsTab bookings={bookings} updateStatus={updateBookingStatus} />;
      case 'services': return <ServicesTab services={services} onRefresh={silentRefresh} />;
      case 'availability': return <AvailabilityTab />;
      case 'reviews': return <ReviewsTab reviews={reviews} />;
      case 'portfolio': return <PortfolioTab portfolio={portfolio} onRefresh={silentRefresh} />;
      case 'panchang': return <PanchangTab panchang={panchang} festivals={festivals} />;
      case 'earnings': return <EarningsTab earnings={earnings} analytics={analytics} />;
      case 'classes': return <ClassesTab classes={classes} onRefresh={silentRefresh} />;
      case 'streams': return <StreamsTab streams={streams} onRefresh={silentRefresh} />;
      default: return null;
    }
  };

  const handleTabChange = (tabId) => { setActiveTab(tabId); setShowMoreMenu(false); };

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
      
      {!priestProfile?.is_verified && priestProfile?.approval_status === 'pending' && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <p className="text-sm text-yellow-800"><strong>Profile Pending Approval:</strong> Your profile is under review.</p>
          </div>
        </div>
      )}
      {!priestProfile?.is_verified && priestProfile?.approval_status === 'rejected' && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800"><strong>Profile Needs Updates:</strong> {priestProfile?.rejection_reason || 'Please update your profile.'}</p>
          </div>
        </div>
      )}
      
      {/* Desktop Layout */}
      <div className="hidden lg:flex">
        <aside className="w-64 min-h-screen bg-white border-r border-orange-100 fixed left-0 top-0 bottom-0 z-20">
          <div className="p-4 border-b border-orange-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/temple-logo.png" alt="Divine Logo" className="w-10 h-10 rounded-lg object-cover" />
                <span className="font-cinzel text-xl font-bold text-maroon">DIVINE</span>
              </div>
              <NotificationBell />
            </div>
          </div>
          <div className="bg-gradient-to-r from-maroon to-maroon-light p-4">
            <button onClick={() => handleTabChange('profile')} className="flex items-center gap-3 w-full text-left hover:opacity-90 cursor-pointer">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-2 border-gold">
                {priestProfile?.profile_photo ? <img src={priestProfile.profile_photo} alt="Profile" className="w-full h-full object-cover" /> : <span className="text-xl font-bold text-white">{user?.name?.charAt(0) || 'P'}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-cinzel text-sm font-bold text-white truncate">{user?.name || 'Pandit Ji'}</h2>
                <div className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full w-fit">
                  <Star className="w-3 h-3 text-gold" /><span className="text-[10px] text-white capitalize">{user?.role || 'Priest'}</span>
                </div>
              </div>
            </button>
          </div>
          <nav className="p-3 space-y-1 overflow-y-auto" style={{ height: 'calc(100vh - 180px)' }}>
            <p className="text-xs font-semibold text-gray-400 uppercase px-3 pt-2 pb-1">Main</p>
            {mainTabs.map((tab) => (
              <button key={tab.id} onClick={() => handleTabChange(tab.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-saffron text-white shadow-md' : 'text-gray-600 hover:bg-orange-50'}`}>
                <tab.icon className="w-5 h-5" />{tab.label}
              </button>
            ))}
            <p className="text-xs font-semibold text-gray-400 uppercase px-3 pt-4 pb-1">Manage</p>
            {moreTabs.map((tab) => (
              <button key={tab.id} onClick={() => handleTabChange(tab.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-saffron text-white shadow-md' : 'text-gray-600 hover:bg-orange-50'}`}>
                <tab.icon className="w-5 h-5" />{tab.label}
              </button>
            ))}
          </nav>
          <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-orange-100 bg-white">
            <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50">
              <LogOut className="w-5 h-5" />Logout
            </button>
          </div>
        </aside>
        <main className="flex-1 ml-64">
          <header className="bg-gradient-to-r from-maroon to-maroon-light px-6 py-4 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div><p className="text-white/70 text-sm">Welcome back,</p><h1 className="font-cinzel text-xl font-bold text-white">{currentTab?.label || 'Dashboard'}</h1></div>
              <div className="flex items-center gap-3">
                {activeTab === 'home' && analytics && (
                  <div className="hidden xl:flex items-center gap-2">
                    <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2"><IndianRupee className="w-4 h-4 text-gold" /><span className="text-sm font-medium text-white">₹{analytics.stats?.monthly_earnings || 0}</span></div>
                    <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2"><Users className="w-4 h-4 text-gold" /><span className="text-sm font-medium text-white">{analytics.stats?.total_students || 0} Students</span></div>
                    <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2"><Star className="w-4 h-4 text-gold fill-gold" /><span className="text-sm font-medium text-white">{analytics.stats?.avg_rating || '4.8'}</span></div>
                  </div>
                )}
              </div>
            </div>
          </header>
          <div className="p-6">
            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }}>
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Tablet Layout */}
      <div className="hidden md:flex lg:hidden">
        <aside className="w-20 min-h-screen bg-white border-r border-orange-100 fixed left-0 top-0 bottom-0 z-20 flex flex-col">
          <button onClick={() => handleTabChange('profile')} className="bg-gradient-to-r from-maroon to-maroon-light p-3 flex justify-center hover:opacity-90 cursor-pointer">
            <img src="/temple-logo.png" alt="Divine Logo" className="w-12 h-12 rounded-lg object-cover" style={{ filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.5))' }} />
          </button>
          <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
            {allTabs.map((tab) => (
              <button key={tab.id} onClick={() => handleTabChange(tab.id)} title={tab.label} className={`w-full flex items-center justify-center p-3 rounded-xl transition-all ${activeTab === tab.id ? 'bg-saffron text-white shadow-md' : 'text-gray-500 hover:bg-orange-50 hover:text-saffron'}`}>
                <tab.icon className="w-5 h-5" />
              </button>
            ))}
          </nav>
          <div className="p-2 border-t border-orange-100">
            <button onClick={logout} title="Logout" className="w-full flex items-center justify-center p-3 rounded-xl text-red-500 hover:bg-red-50"><LogOut className="w-5 h-5" /></button>
          </div>
        </aside>
        <main className="flex-1 ml-20">
          <header className="bg-gradient-to-r from-maroon to-maroon-light px-4 py-4 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div><h1 className="font-cinzel text-lg font-bold text-white">{currentTab?.label || 'Dashboard'}</h1><p className="text-white/70 text-xs">{user?.name}</p></div>
              <NotificationBell />
            </div>
          </header>
          <div className="p-4">
            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }}>{renderContent()}</motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden pb-20">
        <div className="bg-gradient-to-r from-maroon to-maroon-light px-4 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/temple-logo.png" alt="Divine Logo" className="w-10 h-10 rounded-lg object-cover" style={{ filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.5))' }} />
              <div>
                <p className="text-white/70 text-xs">Namaste,</p>
                <h1 className="font-cinzel text-base font-bold text-white">{user?.name || 'Pandit Ji'}</h1>
                <div className="mt-1 inline-flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full"><Star className="w-3 h-3 text-gold" /><span className="text-[10px] font-medium text-white capitalize">{user?.role || 'Priest'}</span></div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <button onClick={logout} className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center"><LogOut className="w-4 h-4 text-white" /></button>
            </div>
          </div>
        </div>
        <div className="sticky top-0 z-20 bg-white shadow-sm px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">{currentTab && <currentTab.icon className="w-5 h-5 text-saffron" />}<span className="font-medium text-gray-800">{currentTab?.label || 'Home'}</span></div>
            <div className="flex items-center gap-2">
              {isMoreTab && <button onClick={() => setActiveTab('home')} className="text-saffron text-sm flex items-center gap-1"><ChevronLeft className="w-4 h-4" /> Back</button>}
            </div>
          </div>
        </div>
        <div className="px-4 py-4">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }}>{renderContent()}</motion.div>
          </AnimatePresence>
        </div>
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
          <div className="flex items-center justify-around py-2 relative">
            {mainTabs.map((tab) => (
              <button key={tab.id} onClick={() => handleTabChange(tab.id)} className={`flex flex-col items-center gap-1 px-3 py-1 ${activeTab === tab.id ? 'text-saffron' : 'text-gray-500'}`}>
                <tab.icon className="w-5 h-5" /><span className="text-[10px]">{tab.label}</span>
              </button>
            ))}
            <button onClick={() => setShowMoreMenu(!showMoreMenu)} className={`flex flex-col items-center gap-1 px-3 py-1 ${showMoreMenu || isMoreTab ? 'text-saffron' : 'text-gray-500'}`}>
              <Menu className="w-5 h-5" /><span className="text-[10px]">More</span>
            </button>
            <AnimatePresence>
              {showMoreMenu && (
                <>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40" onClick={() => setShowMoreMenu(false)} />
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="absolute bottom-full left-0 right-0 bg-white border-t border-gray-200 shadow-lg rounded-t-2xl p-4 z-50">
                    <div className="grid grid-cols-4 gap-4">
                      {moreTabs.map((tab) => (
                        <button key={tab.id} onClick={() => handleTabChange(tab.id)} className={`flex flex-col items-center gap-2 p-3 rounded-xl ${activeTab === tab.id ? 'bg-saffron/10 text-saffron' : 'text-gray-600'}`}>
                          <tab.icon className="w-6 h-6" /><span className="text-xs">{tab.label}</span>
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
