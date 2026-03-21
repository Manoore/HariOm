import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, DollarSign, Clock, Users, Star, Settings,
  TrendingUp, Calendar, BarChart3, Wallet, Video, VideoOff,
  ChevronRight, Loader2, Bell, MessageSquare, LogOut, Menu,
  CheckCircle, XCircle, Play, Pause, IndianRupee, Award,
  User, Edit, Save, X, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { Toaster, toast } from 'sonner';
import ChatTab from '../../components/Chat/ChatTab';

// Custom hook for responsive design
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return isDesktop;
}

// Custom Om Icon component (uses temple logo)
const OmIcon = ({ className }) => (
  <img 
    src="/temple-logo.png" 
    alt="Om" 
    className={`${className} object-contain`}
    style={{ filter: 'drop-shadow(0 0 2px rgba(255,153,51,0.5))' }}
  />
);

// Sidebar Navigation
function Sidebar({ activeTab, setActiveTab, user, isAvailable, onToggleAvailability }) {
  const { logout } = useAuth();
  
  const tabs = [
    { id: 'home', icon: OmIcon, label: 'Dashboard' },
    { id: 'calls', icon: Phone, label: 'Call History' },
    { id: 'earnings', icon: IndianRupee, label: 'Earnings' },
    { id: 'messages', icon: MessageSquare, label: 'Messages' },
    { id: 'profile', icon: User, label: 'My Profile' },
  ];

  return (
    <div className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-purple-100 flex flex-col z-40">
      {/* Logo */}
      <div className="p-6 border-b border-purple-100">
        <div className="flex items-center gap-2">
          <img 
            src="/temple-logo.png" 
            alt="Divine Logo" 
            className="w-10 h-10 rounded-lg object-cover"
          />
          <div>
            <h1 className="font-cinzel text-xl font-bold text-purple-900">DIVINE</h1>
            <p className="text-xs text-purple-500">Astrologer Portal</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-purple-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden">
            {user?.profile_photo ? (
              <img src={user.profile_photo} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg font-bold text-purple-600">{user?.name?.charAt(0) || 'A'}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-800 truncate">{user?.name || 'Astrologer'}</p>
            <p className="text-xs text-gray-500">Astrologer</p>
          </div>
        </div>
        
        {/* Availability Toggle */}
        <div className="mt-4 flex items-center justify-between bg-gray-50 rounded-xl p-3">
          <div className="flex items-center gap-2">
            {isAvailable ? (
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            ) : (
              <div className="w-3 h-3 bg-gray-300 rounded-full" />
            )}
            <span className={`text-sm font-medium ${isAvailable ? 'text-green-600' : 'text-gray-500'}`}>
              {isAvailable ? 'Online' : 'Offline'}
            </span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isAvailable}
              onChange={onToggleAvailability}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
          </label>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === tab.id 
                ? 'bg-purple-600 text-white' 
                : 'text-gray-600 hover:bg-purple-50'
            }`}
            data-testid={`sidebar-${tab.id}`}
          >
            <tab.icon className="w-5 h-5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-purple-100">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

// Bottom Navigation for Mobile
function BottomNav({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'home', icon: OmIcon, label: 'Home' },
    { id: 'calls', icon: Phone, label: 'Calls' },
    { id: 'earnings', icon: IndianRupee, label: 'Earnings' },
    { id: 'messages', icon: MessageSquare, label: 'Messages' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-purple-100 px-2 py-2 z-50 lg:hidden">
      <div className="flex justify-around items-center">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
              activeTab === tab.id ? 'text-purple-600' : 'text-gray-400'
            }`}
            data-testid={`nav-${tab.id}`}
          >
            <tab.icon className={`w-6 h-6 ${activeTab === tab.id ? 'stroke-[2.5]' : ''}`} />
            <span className={`text-xs mt-1 ${activeTab === tab.id ? 'font-semibold' : ''}`}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Dashboard Home Tab
function DashboardTab({ stats, isDesktop }) {
  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  const statCards = [
    { label: "Today's Earnings", value: `₹${stats.today_earnings}`, icon: IndianRupee, color: 'green', subtext: `${stats.today_calls} calls` },
    { label: "Today's Minutes", value: `${stats.today_minutes}m`, icon: Clock, color: 'blue', subtext: `Avg ${stats.avg_call_duration}m/call` },
    { label: "This Week", value: `₹${stats.week_earnings}`, icon: TrendingUp, color: 'purple', subtext: `${stats.week_calls} calls` },
    { label: "This Month", value: `₹${stats.month_earnings}`, icon: Calendar, color: 'orange', subtext: `${stats.month_calls} calls` },
  ];

  const colorClasses = {
    green: 'from-green-400 to-emerald-500',
    blue: 'from-blue-400 to-indigo-500',
    purple: 'from-purple-400 to-violet-500',
    orange: 'from-orange-400 to-amber-500'
  };

  return (
    <div className={`p-4 lg:p-8 pb-24 lg:pb-8 ${isDesktop ? '' : ''}`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Welcome back!</h1>
        <p className="text-gray-500">Here's your performance overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorClasses[stat.color]} flex items-center justify-center mb-3`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-xs text-gray-400 mt-1">{stat.subtext}</p>
          </motion.div>
        ))}
      </div>

      {/* Total Earnings Card */}
      <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-6 text-white mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-purple-200 text-sm">Total Earnings</p>
            <p className="text-4xl font-bold">₹{stats.total_earnings}</p>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <Wallet className="w-8 h-8" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
          <div>
            <p className="text-purple-200 text-xs">Total Consultations</p>
            <p className="text-xl font-semibold">{stats.total_calls}</p>
          </div>
          <div>
            <p className="text-purple-200 text-xs">Total Minutes</p>
            <p className="text-xl font-semibold">{stats.total_minutes}m</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 hover:border-purple-200 transition-colors">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-purple-600" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-gray-800">View Reports</p>
            <p className="text-xs text-gray-500">Detailed analytics</p>
          </div>
        </button>
        <button className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 hover:border-purple-200 transition-colors">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <IndianRupee className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-gray-800">Withdraw</p>
            <p className="text-xs text-gray-500">₹{stats.pending_balance} available</p>
          </div>
        </button>
      </div>
    </div>
  );
}

// Call History Tab
function CallsTab({ isDesktop }) {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCalls();
  }, []);

  const loadCalls = async () => {
    try {
      const res = await api.get('/api/astrologer/calls');
      setCalls(res.data.calls || []);
    } catch (error) {
      toast.error('Failed to load call history');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className={`p-4 lg:p-8 pb-24 lg:pb-8`}>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Call History</h1>

      {calls.length === 0 ? (
        <div className="text-center py-12">
          <Phone className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600">No calls yet</h3>
          <p className="text-gray-400">Your consultation history will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {calls.map((call) => (
            <div 
              key={call.id}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  {call.other_party?.profile_photo ? (
                    <img src={call.other_party.profile_photo} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User className="w-6 h-6 text-purple-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800">{call.other_party?.name || 'User'}</h3>
                  <p className="text-sm text-gray-500">{formatDate(call.started_at)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">+₹{call.astrologer_earning || 0}</p>
                  <p className="text-sm text-gray-500">{formatDuration(call.duration_seconds)}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>{Math.ceil(call.duration_seconds / 60)} min</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <IndianRupee className="w-4 h-4" />
                  <span>₹{call.rate_per_minute}/min</span>
                </div>
                <span className={`ml-auto text-xs px-2 py-1 rounded-full ${
                  call.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {call.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Earnings Tab
function EarningsTab({ isDesktop }) {
  const [period, setPeriod] = useState('week');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, [period]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/astrologer/earnings?period=${period}`);
      setReport(res.data);
    } catch (error) {
      toast.error('Failed to load earnings report');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className={`p-4 lg:p-8 pb-24 lg:pb-8`}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Earnings Report</h1>
        <div className="flex gap-2">
          {['day', 'week', 'month'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                period === p
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {report && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Total Earnings</p>
              <p className="text-2xl font-bold text-green-600">₹{report.summary.total_earnings}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Total Calls</p>
              <p className="text-2xl font-bold text-purple-600">{report.summary.total_calls}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Total Minutes</p>
              <p className="text-2xl font-bold text-blue-600">{report.summary.total_minutes}m</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Avg per Call</p>
              <p className="text-2xl font-bold text-orange-600">₹{Math.round(report.summary.avg_earning_per_call)}</p>
            </div>
          </div>

          {/* Chart Data */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4">Earnings Breakdown</h3>
            
            {report.chart_data.length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500">No data for this period</p>
              </div>
            ) : (
              <div className="space-y-3">
                {report.chart_data.map((item) => (
                  <div key={item.period} className="flex items-center gap-4">
                    <div className="w-20 text-sm text-gray-500">{item.period}</div>
                    <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full"
                        style={{ 
                          width: `${Math.min(100, (item.earnings / (report.summary.total_earnings || 1)) * 100)}%` 
                        }}
                      />
                    </div>
                    <div className="w-24 text-right">
                      <span className="font-semibold text-gray-800">₹{item.earnings}</span>
                      <span className="text-xs text-gray-400 ml-1">({item.calls} calls)</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Profile Tab
function ProfileTab({ profile, user, isDesktop, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    rate_per_minute: profile?.rate_per_minute || 10,
    specializations: profile?.specializations || [],
    experience_years: profile?.experience_years || 0,
    languages: profile?.languages || ['Hindi', 'English']
  });
  const [saving, setSaving] = useState(false);
  const [newSpec, setNewSpec] = useState('');
  const [newLang, setNewLang] = useState('');

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/api/astrologer/profile', formData);
      toast.success('Profile updated!');
      setEditing(false);
      onUpdate?.();
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const addSpecialization = () => {
    if (newSpec.trim() && !formData.specializations.includes(newSpec.trim())) {
      setFormData(prev => ({
        ...prev,
        specializations: [...prev.specializations, newSpec.trim()]
      }));
      setNewSpec('');
    }
  };

  const removeSpecialization = (spec) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.filter(s => s !== spec)
    }));
  };

  const addLanguage = () => {
    if (newLang.trim() && !formData.languages.includes(newLang.trim())) {
      setFormData(prev => ({
        ...prev,
        languages: [...prev.languages, newLang.trim()]
      }));
      setNewLang('');
    }
  };

  const removeLanguage = (lang) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.filter(l => l !== lang)
    }));
  };

  return (
    <div className={`p-4 lg:p-8 pb-24 lg:pb-8`}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-full text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
          </div>
        )}
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden">
            {user?.profile_photo ? (
              <img src={user.profile_photo} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-purple-600">{user?.name?.charAt(0) || 'A'}</span>
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">{user?.name || 'Astrologer'}</h2>
            <p className="text-gray-500">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm text-gray-600">{profile?.avg_rating || '4.8'} rating</span>
              <span className="text-gray-300">•</span>
              <span className="text-sm text-gray-600">{profile?.total_consultations || 0} consultations</span>
            </div>
          </div>
        </div>

        {/* Rate Per Minute */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Rate Per Minute (₹)</label>
          {editing ? (
            <input
              type="number"
              value={formData.rate_per_minute}
              onChange={e => setFormData(prev => ({ ...prev, rate_per_minute: parseInt(e.target.value) || 0 }))}
              min={1}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          ) : (
            <p className="text-2xl font-bold text-green-600">₹{profile?.rate_per_minute || formData.rate_per_minute}</p>
          )}
        </div>

        {/* Experience */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
          {editing ? (
            <input
              type="number"
              value={formData.experience_years}
              onChange={e => setFormData(prev => ({ ...prev, experience_years: parseInt(e.target.value) || 0 }))}
              min={0}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          ) : (
            <p className="text-lg text-gray-800">{profile?.experience_years || formData.experience_years} years</p>
          )}
        </div>

        {/* Specializations */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Specializations</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.specializations.map(spec => (
              <span 
                key={spec}
                className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm flex items-center gap-1"
              >
                {spec}
                {editing && (
                  <button onClick={() => removeSpecialization(spec)} className="hover:text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </span>
            ))}
          </div>
          {editing && (
            <div className="flex gap-2">
              <input
                type="text"
                value={newSpec}
                onChange={e => setNewSpec(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && addSpecialization()}
                placeholder="Add specialization"
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              />
              <button
                onClick={addSpecialization}
                className="px-4 py-2 bg-purple-100 text-purple-600 rounded-xl hover:bg-purple-200 transition-colors"
              >
                Add
              </button>
            </div>
          )}
        </div>

        {/* Languages */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Languages</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.languages.map(lang => (
              <span 
                key={lang}
                className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center gap-1"
              >
                {lang}
                {editing && (
                  <button onClick={() => removeLanguage(lang)} className="hover:text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </span>
            ))}
          </div>
          {editing && (
            <div className="flex gap-2">
              <input
                type="text"
                value={newLang}
                onChange={e => setNewLang(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && addLanguage()}
                placeholder="Add language"
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              />
              <button
                onClick={addLanguage}
                className="px-4 py-2 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition-colors"
              >
                Add
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Main Astrologer Dashboard
export default function AstrologerDashboard() {
  const [activeTab, setActiveTab] = useState('home');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(false);
  const { user } = useAuth();
  const isDesktop = useIsDesktop();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await api.get('/api/astrologer/dashboard');
      setDashboardData(res.data);
      setIsAvailable(res.data.profile?.is_available || false);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async () => {
    try {
      const res = await api.put('/api/astrologer/availability', {
        is_available: !isAvailable
      });
      setIsAvailable(res.data.is_available);
      toast.success(res.data.is_available ? 'You are now online!' : 'You are now offline');
    } catch (error) {
      toast.error('Failed to update availability');
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-b from-purple-50 to-white ${isDesktop ? 'lg:pl-64' : ''}`}>
      <Toaster position="top-center" richColors />
      
      {isDesktop && (
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          user={user}
          isAvailable={isAvailable}
          onToggleAvailability={toggleAvailability}
        />
      )}
      
      {/* Mobile Header */}
      {!isDesktop && (
        <div className="sticky top-0 bg-white border-b border-purple-100 px-4 py-3 z-40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Star className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-purple-900">DIVINE</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1">
                <div className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                <span className={`text-xs font-medium ${isAvailable ? 'text-green-600' : 'text-gray-500'}`}>
                  {isAvailable ? 'Online' : 'Offline'}
                </span>
                <label className="relative inline-flex items-center cursor-pointer ml-1">
                  <input
                    type="checkbox"
                    checked={isAvailable}
                    onChange={toggleAvailability}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-gray-200 rounded-full peer peer-checked:bg-green-500 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-4"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : (
        <>
          {activeTab === 'home' && <DashboardTab stats={dashboardData?.stats} isDesktop={isDesktop} />}
          {activeTab === 'calls' && <CallsTab isDesktop={isDesktop} />}
          {activeTab === 'earnings' && <EarningsTab isDesktop={isDesktop} />}
          {activeTab === 'messages' && <ChatTab isDesktop={isDesktop} />}
          {activeTab === 'profile' && (
            <ProfileTab 
              profile={dashboardData?.profile} 
              user={user} 
              isDesktop={isDesktop}
              onUpdate={loadDashboard}
            />
          )}
        </>
      )}
      
      {!isDesktop && <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />}
    </div>
  );
}
