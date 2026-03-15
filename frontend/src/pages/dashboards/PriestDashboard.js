import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, Calendar, Settings, LogOut, ChevronRight, Clock,
  CheckCircle, XCircle, User, Star, Bell, Loader2, BookOpen,
  Video, FileText, DollarSign, Users, TrendingUp, Plus, Edit,
  Trash2, Play, Square, Eye, Heart, CalendarDays, BarChart3,
  Mic, Save, X, ChevronDown, AlertCircle, Shield
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

// Tab Components
const tabs = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'classes', label: 'Classes', icon: BookOpen },
  { id: 'availability', label: 'Availability', icon: Calendar },
  { id: 'content', label: 'Content', icon: FileText },
  { id: 'streams', label: 'Live', icon: Video },
];

// Days of week
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Class categories
const CLASS_CATEGORIES = ['Vedic Chanting', 'Sanskrit', 'Puja Rituals', 'Astrology', 'Meditation', 'Philosophy', 'General'];

// Content categories
const CONTENT_CATEGORIES = ['Mantra', 'Shloka', 'Stotra', 'Bhajan', 'Discourse', 'General'];

// Stream types
const STREAM_TYPES = ['puja', 'class', 'discourse', 'aarti', 'bhajan'];

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
  const [content, setContent] = useState([]);
  const [streams, setStreams] = useState([]);

  // Modal states
  const [showClassModal, setShowClassModal] = useState(false);
  const [showContentModal, setShowContentModal] = useState(false);
  const [showStreamModal, setShowStreamModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);

  // Show welcome toast on first load
  useEffect(() => {
    if (user && !welcomeShown) {
      const roleConfig = ROLE_CONFIG[user.role] || ROLE_CONFIG.devotee;
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
      const [analyticsRes, bookingsRes, classesRes, availabilityRes, contentRes, streamsRes] = await Promise.all([
        api.get('/api/priest/analytics').catch(() => ({ data: null })),
        api.get('/api/priest/bookings').catch(() => ({ data: { bookings: [] } })),
        api.get('/api/priest/classes').catch(() => ({ data: { classes: [] } })),
        api.get('/api/priest/availability').catch(() => ({ data: null })),
        api.get('/api/priest/content').catch(() => ({ data: { content: [] } })),
        api.get('/api/priest/streams').catch(() => ({ data: { streams: [] } })),
      ]);

      setAnalytics(analyticsRes.data);
      setBookings(bookingsRes.data?.bookings || []);
      setClasses(classesRes.data?.classes || []);
      setAvailability(availabilityRes.data);
      setContent(contentRes.data?.content || []);
      setStreams(streamsRes.data?.streams || []);
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
        return <HomeTab analytics={analytics} bookings={bookings} updateStatus={updateBookingStatus} />;
      case 'classes':
        return <ClassesTab classes={classes} onAdd={() => { setEditingClass(null); setShowClassModal(true); }} onEdit={(c) => { setEditingClass(c); setShowClassModal(true); }} onRefresh={fetchDashboardData} />;
      case 'availability':
        return <AvailabilityTab availability={availability} onRefresh={fetchDashboardData} />;
      case 'content':
        return <ContentTab content={content} onAdd={() => setShowContentModal(true)} onRefresh={fetchDashboardData} />;
      case 'streams':
        return <StreamsTab streams={streams} onAdd={() => setShowStreamModal(true)} onRefresh={fetchDashboardData} />;
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
            <div>
              <p className="text-white/70 text-sm">Namaste,</p>
              <h1 className="font-cinzel text-xl font-bold text-white">{user?.name || 'Pandit Ji'}</h1>
              {/* Role Badge */}
              {user?.role && (
                <div className="mt-2 inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                  <Star className="w-3.5 h-3.5 text-gold" />
                  <span className="text-xs font-medium text-white capitalize">
                    {ROLE_CONFIG[user.role]?.label || user.role}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                <Bell className="w-5 h-5 text-white" />
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
              <StatCard icon={DollarSign} value={`₹${analytics.stats?.monthly_earnings || 0}`} label="This Month" />
              <StatCard icon={Calendar} value={analytics.stats?.pending_bookings || 0} label="Pending" highlight />
              <StatCard icon={Users} value={analytics.stats?.total_students || 0} label="Students" />
              <StatCard icon={Star} value={analytics.stats?.avg_rating || 0} label="Rating" />
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
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

      {/* Modals */}
      <ClassModal 
        isOpen={showClassModal} 
        onClose={() => { setShowClassModal(false); setEditingClass(null); }} 
        editData={editingClass}
        onSuccess={fetchDashboardData} 
      />
      <ContentModal 
        isOpen={showContentModal} 
        onClose={() => setShowContentModal(false)} 
        onSuccess={fetchDashboardData} 
      />
      <StreamModal 
        isOpen={showStreamModal} 
        onClose={() => setShowStreamModal(false)} 
        onSuccess={fetchDashboardData} 
      />
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
function HomeTab({ analytics, bookings, updateStatus }) {
  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const upcomingBookings = bookings.filter(b => b.status === 'confirmed');

  return (
    <div className="space-y-6">
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
            {pendingBookings.map((booking) => (
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

// ==================== CLASSES TAB ====================
function ClassesTab({ classes, onAdd, onEdit, onRefresh }) {
  const deleteClass = async (classId) => {
    if (!window.confirm('Are you sure you want to delete this class?')) return;
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
        <h2 className="font-cinzel text-xl font-semibold text-maroon">Your Classes</h2>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 bg-saffron text-white px-4 py-2 rounded-lg hover:bg-saffron-dark transition-colors"
          data-testid="add-class-btn"
        >
          <Plus className="w-4 h-4" />
          Add Class
        </button>
      </div>

      {classes.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-400 mb-4">No classes created yet</p>
          <button
            onClick={onAdd}
            className="text-saffron hover:underline"
          >
            Create your first class
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {classes.map((cls) => (
            <motion.div
              key={cls.id}
              className="bg-white rounded-xl shadow-lg p-5 border-l-4 border-saffron"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800">{cls.title}</h3>
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                    {cls.category}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => onEdit(cls)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    data-testid={`edit-class-${cls.id}`}
                  >
                    <Edit className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() => deleteClass(cls.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    data-testid={`delete-class-${cls.id}`}
                  >
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
                  {cls.enrolled_count}/{cls.max_students}
                </span>
                <span className="flex items-center gap-1 text-saffron font-medium">
                  <DollarSign className="w-4 h-4" />
                  ₹{cls.price}
                </span>
              </div>

              {cls.schedule && cls.schedule.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-400 mb-1">Schedule:</p>
                  <div className="flex flex-wrap gap-1">
                    {cls.schedule.map((s, i) => (
                      <span key={i} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                        {s.day} {s.time}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== AVAILABILITY TAB ====================
function AvailabilityTab({ availability, onRefresh }) {
  const [editing, setEditing] = useState(false);
  const [onlineSlots, setOnlineSlots] = useState(availability?.online_slots || []);
  const [offlineSlots, setOfflineSlots] = useState(availability?.offline_slots || []);
  const [blockedDates, setBlockedDates] = useState(availability?.blocked_dates || []);
  const [saving, setSaving] = useState(false);

  const addSlot = (type) => {
    const newSlot = { day: 'Monday', start: '09:00', end: '17:00' };
    if (type === 'online') {
      setOnlineSlots([...onlineSlots, newSlot]);
    } else {
      setOfflineSlots([...offlineSlots, newSlot]);
    }
  };

  const removeSlot = (type, index) => {
    if (type === 'online') {
      setOnlineSlots(onlineSlots.filter((_, i) => i !== index));
    } else {
      setOfflineSlots(offlineSlots.filter((_, i) => i !== index));
    }
  };

  const updateSlot = (type, index, field, value) => {
    if (type === 'online') {
      const updated = [...onlineSlots];
      updated[index] = { ...updated[index], [field]: value };
      setOnlineSlots(updated);
    } else {
      const updated = [...offlineSlots];
      updated[index] = { ...updated[index], [field]: value };
      setOfflineSlots(updated);
    }
  };

  const saveAvailability = async () => {
    setSaving(true);
    try {
      await api.post('/api/priest/availability', {
        online_slots: onlineSlots,
        offline_slots: offlineSlots,
        blocked_dates: blockedDates,
        default_duration: 60
      });
      toast.success('Availability saved!');
      setEditing(false);
      onRefresh();
    } catch (error) {
      toast.error('Failed to save availability');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-cinzel text-xl font-semibold text-maroon">Your Availability</h2>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 bg-saffron text-white px-4 py-2 rounded-lg hover:bg-saffron-dark transition-colors"
            data-testid="edit-availability-btn"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(false)}
              className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              onClick={saveAvailability}
              disabled={saving}
              className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
              data-testid="save-availability-btn"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
          </div>
        )}
      </div>

      {/* Online Slots */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Video className="w-5 h-5 text-blue-500" />
            Online Consultation Slots
          </h3>
          {editing && (
            <button
              onClick={() => addSlot('online')}
              className="text-sm text-saffron hover:underline flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add Slot
            </button>
          )}
        </div>
        
        {onlineSlots.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No online slots configured</p>
        ) : (
          <div className="space-y-3">
            {onlineSlots.map((slot, index) => (
              <SlotRow
                key={index}
                slot={slot}
                editing={editing}
                onUpdate={(field, value) => updateSlot('online', index, field, value)}
                onRemove={() => removeSlot('online', index)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Offline Slots */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Home className="w-5 h-5 text-green-500" />
            Home Visit Slots
          </h3>
          {editing && (
            <button
              onClick={() => addSlot('offline')}
              className="text-sm text-saffron hover:underline flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add Slot
            </button>
          )}
        </div>
        
        {offlineSlots.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No home visit slots configured</p>
        ) : (
          <div className="space-y-3">
            {offlineSlots.map((slot, index) => (
              <SlotRow
                key={index}
                slot={slot}
                editing={editing}
                onUpdate={(field, value) => updateSlot('offline', index, field, value)}
                onRemove={() => removeSlot('offline', index)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Blocked Dates */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500" />
            Blocked Dates
          </h3>
          {editing && (
            <button
              onClick={() => setBlockedDates([...blockedDates, new Date().toISOString().split('T')[0]])}
              className="text-sm text-saffron hover:underline flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add Date
            </button>
          )}
        </div>
        
        {blockedDates.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No blocked dates</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {blockedDates.map((date, index) => (
              <div key={index} className="flex items-center gap-2 bg-red-50 text-red-700 px-3 py-1 rounded-full">
                {editing ? (
                  <>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => {
                        const updated = [...blockedDates];
                        updated[index] = e.target.value;
                        setBlockedDates(updated);
                      }}
                      className="bg-transparent border-none text-sm"
                    />
                    <button onClick={() => setBlockedDates(blockedDates.filter((_, i) => i !== index))}>
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <span className="text-sm">{new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== SLOT ROW ====================
function SlotRow({ slot, editing, onUpdate, onRemove }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      {editing ? (
        <>
          <select
            value={slot.day}
            onChange={(e) => onUpdate('day', e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-saffron/50"
          >
            {DAYS.map(day => (
              <option key={day} value={day}>{day}</option>
            ))}
          </select>
          <input
            type="time"
            value={slot.start}
            onChange={(e) => onUpdate('start', e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-saffron/50"
          />
          <span className="text-gray-400">to</span>
          <input
            type="time"
            value={slot.end}
            onChange={(e) => onUpdate('end', e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-saffron/50"
          />
          <button onClick={onRemove} className="p-2 hover:bg-red-100 rounded-lg">
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        </>
      ) : (
        <>
          <span className="flex-1 font-medium text-gray-700">{slot.day}</span>
          <span className="text-gray-500">{slot.start} - {slot.end}</span>
        </>
      )}
    </div>
  );
}

// ==================== CONTENT TAB ====================
function ContentTab({ content, onAdd, onRefresh }) {
  const deleteContent = async (contentId) => {
    if (!window.confirm('Are you sure you want to delete this content?')) return;
    try {
      await api.delete(`/api/priest/content/${contentId}`);
      toast.success('Content deleted');
      onRefresh();
    } catch (error) {
      toast.error('Failed to delete content');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-cinzel text-xl font-semibold text-maroon">Your Content</h2>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 bg-saffron text-white px-4 py-2 rounded-lg hover:bg-saffron-dark transition-colors"
          data-testid="add-content-btn"
        >
          <Plus className="w-4 h-4" />
          Post Content
        </button>
      </div>

      {content.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-400 mb-4">No content posted yet</p>
          <button
            onClick={onAdd}
            className="text-saffron hover:underline"
          >
            Share your first mantra or teaching
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {content.map((item) => (
            <motion.div
              key={item.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-800">{item.title}</h3>
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                      {item.category}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteContent(item.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
                
                <p className="text-sm text-gray-500 mb-3 line-clamp-3">{item.description || item.text_content}</p>
                
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {item.views}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      {item.likes}
                    </span>
                  </div>
                  <span className="text-xs">
                    {new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== STREAMS TAB ====================
function StreamsTab({ streams, onAdd, onRefresh }) {
  const startStream = async (streamId) => {
    try {
      await api.put(`/api/priest/streams/${streamId}/start`);
      toast.success('Stream started!');
      onRefresh();
    } catch (error) {
      toast.error('Failed to start stream');
    }
  };

  const endStream = async (streamId) => {
    try {
      await api.put(`/api/priest/streams/${streamId}/end`);
      toast.success('Stream ended');
      onRefresh();
    } catch (error) {
      toast.error('Failed to end stream');
    }
  };

  const scheduledStreams = streams.filter(s => s.status === 'scheduled');
  const liveStreams = streams.filter(s => s.status === 'live');
  const pastStreams = streams.filter(s => s.status === 'ended');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-cinzel text-xl font-semibold text-maroon">Live Streams</h2>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 bg-saffron text-white px-4 py-2 rounded-lg hover:bg-saffron-dark transition-colors"
          data-testid="schedule-stream-btn"
        >
          <Plus className="w-4 h-4" />
          Schedule Stream
        </button>
      </div>

      {/* Live Now */}
      {liveStreams.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <h3 className="font-semibold text-red-700 flex items-center gap-2 mb-4">
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
            Live Now
          </h3>
          {liveStreams.map((stream) => (
            <div key={stream.id} className="bg-white rounded-xl p-4 border border-red-200">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-gray-800">{stream.title}</h4>
                  <p className="text-sm text-gray-500">{stream.description}</p>
                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-400">
                    <Eye className="w-4 h-4" />
                    {stream.viewer_count} watching
                  </div>
                </div>
                <button
                  onClick={() => endStream(stream.id)}
                  className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                  data-testid="end-stream-btn"
                >
                  <Square className="w-4 h-4" />
                  End Stream
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Scheduled */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Scheduled Streams ({scheduledStreams.length})</h3>
        {scheduledStreams.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No scheduled streams</p>
        ) : (
          <div className="space-y-3">
            {scheduledStreams.map((stream) => (
              <div key={stream.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl">
                <div>
                  <h4 className="font-medium text-gray-800">{stream.title}</h4>
                  <p className="text-sm text-gray-500 capitalize">{stream.stream_type}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(stream.scheduled_at).toLocaleString('en-IN', {
                      weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
                <button
                  onClick={() => startStream(stream.id)}
                  className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                  data-testid="start-stream-btn"
                >
                  <Play className="w-4 h-4" />
                  Go Live
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Streams */}
      {pastStreams.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Past Streams</h3>
          <div className="space-y-3">
            {pastStreams.slice(0, 5).map((stream) => (
              <div key={stream.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <h4 className="font-medium text-gray-700">{stream.title}</h4>
                  <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                    <span>{new Date(stream.ended_at).toLocaleDateString('en-IN')}</span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      Max: {stream.max_viewers}
                    </span>
                  </div>
                </div>
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">Ended</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== CLASS MODAL ====================
function ClassModal({ isOpen, onClose, editData, onSuccess }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    class_type: 'online',
    duration_minutes: 60,
    price: 500,
    max_students: 20,
    category: 'General',
    schedule: []
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editData) {
      setForm(editData);
    } else {
      setForm({
        title: '',
        description: '',
        class_type: 'online',
        duration_minutes: 60,
        price: 500,
        max_students: 20,
        category: 'General',
        schedule: []
      });
    }
  }, [editData, isOpen]);

  const handleSubmit = async () => {
    if (!form.title) {
      toast.error('Please enter a class title');
      return;
    }
    
    setSaving(true);
    try {
      if (editData) {
        await api.put(`/api/priest/classes/${editData.id}`, form);
        toast.success('Class updated!');
      } else {
        await api.post('/api/priest/classes', form);
        toast.success('Class created!');
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('Failed to save class');
    } finally {
      setSaving(false);
    }
  };

  const addSchedule = () => {
    setForm(f => ({
      ...f,
      schedule: [...f.schedule, { day: 'Monday', time: '10:00' }]
    }));
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
              {editData ? 'Edit Class' : 'Create New Class'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title*</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g., Beginner Sanskrit Class"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
              data-testid="class-title-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="What will students learn..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
              >
                {CLASS_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={form.class_type}
                onChange={(e) => setForm(f => ({ ...f, class_type: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
              >
                <option value="online">Online</option>
                <option value="offline">In-person</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
              <input
                type="number"
                value={form.duration_minutes}
                onChange={(e) => setForm(f => ({ ...f, duration_minutes: parseInt(e.target.value) }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm(f => ({ ...f, price: parseInt(e.target.value) }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
                data-testid="class-price-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Students</label>
              <input
                type="number"
                value={form.max_students}
                onChange={(e) => setForm(f => ({ ...f, max_students: parseInt(e.target.value) }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
              />
            </div>
          </div>

          {/* Schedule */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Schedule</label>
              <button
                type="button"
                onClick={addSchedule}
                className="text-sm text-saffron hover:underline flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
            {form.schedule.length === 0 ? (
              <p className="text-sm text-gray-400">No schedule set</p>
            ) : (
              <div className="space-y-2">
                {form.schedule.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <select
                      value={s.day}
                      onChange={(e) => {
                        const updated = [...form.schedule];
                        updated[i] = { ...updated[i], day: e.target.value };
                        setForm(f => ({ ...f, schedule: updated }));
                      }}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    >
                      {DAYS.map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                    <input
                      type="time"
                      value={s.time}
                      onChange={(e) => {
                        const updated = [...form.schedule];
                        updated[i] = { ...updated[i], time: e.target.value };
                        setForm(f => ({ ...f, schedule: updated }));
                      }}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                    <button
                      onClick={() => setForm(f => ({ ...f, schedule: f.schedule.filter((_, idx) => idx !== i) }))}
                      className="p-2 hover:bg-red-50 rounded-lg"
                    >
                      <X className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-2 bg-saffron text-white rounded-xl hover:bg-saffron-dark transition-colors disabled:opacity-50 flex items-center gap-2"
            data-testid="save-class-btn"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {editData ? 'Update' : 'Create'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ==================== CONTENT MODAL ====================
function ContentModal({ isOpen, onClose, onSuccess }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    content_type: 'text',
    category: 'Mantra',
    text_content: '',
    media_url: '',
    is_published: true
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.title) {
      toast.error('Please enter a title');
      return;
    }
    
    setSaving(true);
    try {
      await api.post('/api/priest/content', form);
      toast.success('Content posted!');
      onSuccess();
      onClose();
      setForm({
        title: '',
        description: '',
        content_type: 'text',
        category: 'Mantra',
        text_content: '',
        media_url: '',
        is_published: true
      });
    } catch (error) {
      toast.error('Failed to post content');
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
            <h2 className="font-cinzel text-xl font-semibold text-maroon">Post New Content</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title*</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g., Gayatri Mantra"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
              data-testid="content-title-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
              >
                {CONTENT_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={form.content_type}
                onChange={(e) => setForm(f => ({ ...f, content_type: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
              >
                <option value="text">Text</option>
                <option value="audio">Audio</option>
                <option value="video">Video</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Brief description..."
              rows={2}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {form.content_type === 'text' ? 'Content (Sanskrit/Text)' : 'Media URL'}
            </label>
            {form.content_type === 'text' ? (
              <textarea
                value={form.text_content}
                onChange={(e) => setForm(f => ({ ...f, text_content: e.target.value }))}
                placeholder="Enter the mantra or shloka text..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50 font-mono"
                data-testid="content-text-input"
              />
            ) : (
              <input
                type="url"
                value={form.media_url}
                onChange={(e) => setForm(f => ({ ...f, media_url: e.target.value }))}
                placeholder="https://..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
              />
            )}
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => setForm(f => ({ ...f, is_published: e.target.checked }))}
              className="w-4 h-4 text-saffron"
            />
            <span className="text-sm text-gray-600">Publish immediately</span>
          </label>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-2 bg-saffron text-white rounded-xl hover:bg-saffron-dark transition-colors disabled:opacity-50 flex items-center gap-2"
            data-testid="post-content-btn"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            Post
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ==================== STREAM MODAL ====================
function StreamModal({ isOpen, onClose, onSuccess }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    stream_type: 'puja',
    scheduled_at: ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.title) {
      toast.error('Please enter a stream title');
      return;
    }
    if (!form.scheduled_at) {
      toast.error('Please select a date and time');
      return;
    }
    
    setSaving(true);
    try {
      await api.post('/api/priest/streams', form);
      toast.success('Stream scheduled!');
      onSuccess();
      onClose();
      setForm({
        title: '',
        description: '',
        stream_type: 'puja',
        scheduled_at: ''
      });
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
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="font-cinzel text-xl font-semibold text-maroon">Schedule Live Stream</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title*</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g., Morning Aarti - Shri Ganesh Temple"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
              data-testid="stream-title-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stream Type</label>
            <select
              value={form.stream_type}
              onChange={(e) => setForm(f => ({ ...f, stream_type: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
            >
              {STREAM_TYPES.map(type => (
                <option key={type} value={type} className="capitalize">{type.charAt(0).toUpperCase() + type.slice(1)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="What will be streamed..."
              rows={2}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date & Time*</label>
            <input
              type="datetime-local"
              value={form.scheduled_at}
              onChange={(e) => setForm(f => ({ ...f, scheduled_at: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
              data-testid="stream-datetime-input"
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-2 bg-saffron text-white rounded-xl hover:bg-saffron-dark transition-colors disabled:opacity-50 flex items-center gap-2"
            data-testid="schedule-stream-submit-btn"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
            Schedule
          </button>
        </div>
      </motion.div>
    </div>
  );
}
