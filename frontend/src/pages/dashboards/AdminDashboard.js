import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Star, ShoppingBag, Calendar, Settings, LogOut,
  ChevronRight, CheckCircle, AlertCircle, Loader2, TrendingUp,
  Home, BarChart3, UserCheck, Package, Bell, Video, Key, MessageSquare, Mail, Trash2, Check, X
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { Toaster, toast } from 'sonner';
import ConsultationSettingsAdmin from '../../components/Admin/ConsultationSettingsAdmin';
import SystemSettingsAdmin from '../../components/Admin/SystemSettingsAdmin';

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
function AdminSidebar({ activeTab, setActiveTab, user }) {
  const { logout } = useAuth();
  
  const tabs = [
    { id: 'overview', icon: Home, label: 'Overview' },
    { id: 'users', icon: Users, label: 'Users' },
    { id: 'priests', icon: UserCheck, label: 'Priests' },
    { id: 'products', icon: Package, label: 'Products' },
    { id: 'bookings', icon: Calendar, label: 'Bookings' },
    { id: 'feedback', icon: MessageSquare, label: 'Feedback & Reviews' },
    { id: 'consultation', icon: Video, label: 'Consultation Settings' },
    { id: 'system', icon: Key, label: 'System Settings' },
  ];

  return (
    <div className="fixed left-0 top-0 bottom-0 w-64 bg-slate-900 border-r border-slate-800 flex flex-col z-40">
      {/* Logo */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <ellipse cx="50" cy="85" rx="30" ry="8" fill="#B8860B" />
              <path d="M30 85 Q30 70 35 60 L65 60 Q70 70 70 85" fill="#FFD700" />
              <ellipse cx="50" cy="60" rx="18" ry="6" fill="#FFD700" />
              <path d="M50 55 Q45 40 50 25 Q55 40 50 55" fill="#FF9933" />
            </svg>
          </div>
          <span className="font-cinzel text-xl font-bold text-white">DIVINE</span>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500/30 rounded-full flex items-center justify-center text-indigo-300 font-cinzel">
            {user?.name?.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-white">{user?.name}</p>
            <p className="text-xs text-slate-400">Administrator</p>
          </div>
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
                ? 'bg-indigo-500 text-white' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
            data-testid={`admin-sidebar-${tab.id}`}
          >
            <tab.icon className="w-5 h-5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-800">
        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
          data-testid="admin-sidebar-logout"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

// Bottom Navigation for Mobile
function AdminBottomNav({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'overview', icon: Home, label: 'Home' },
    { id: 'users', icon: Users, label: 'Users' },
    { id: 'priests', icon: UserCheck, label: 'Priests' },
    { id: 'products', icon: Package, label: 'Products' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 px-2 py-2 z-50 lg:hidden">
      <div className="flex justify-around items-center">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
              activeTab === tab.id ? 'text-indigo-400' : 'text-slate-500'
            }`}
            data-testid={`admin-nav-${tab.id}`}
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

// Overview Tab
function OverviewTab({ stats, users, isDesktop, loading }) {
  return (
    <div className={`pb-24 lg:pb-8 ${isDesktop ? 'px-8' : 'px-4'}`}>
      {/* Stats Grid */}
      <div className="pt-4 mb-6">
        <h2 className="font-cinzel text-lg font-semibold text-white mb-4">Dashboard Overview</h2>
        <div className={`grid ${isDesktop ? 'grid-cols-4' : 'grid-cols-2'} gap-4`}>
          <div className="bg-slate-800/50 rounded-2xl p-4 lg:p-6">
            <Users className="w-8 h-8 text-indigo-400 mb-2" />
            <p className="text-2xl lg:text-3xl font-bold text-white">
              {loading ? <span className="animate-pulse">...</span> : (stats?.total_users || 0)}
            </p>
            <p className="text-slate-400 text-sm">Total Users</p>
          </div>
          <div className="bg-slate-800/50 rounded-2xl p-4 lg:p-6">
            <Star className="w-8 h-8 text-yellow-400 mb-2" />
            <p className="text-2xl lg:text-3xl font-bold text-white">
              {loading ? <span className="animate-pulse">...</span> : (stats?.total_priests || 0)}
            </p>
            <p className="text-slate-400 text-sm">Priests</p>
          </div>
          <div className="bg-slate-800/50 rounded-2xl p-4 lg:p-6">
            <ShoppingBag className="w-8 h-8 text-green-400 mb-2" />
            <p className="text-2xl lg:text-3xl font-bold text-white">
              {loading ? <span className="animate-pulse">...</span> : (stats?.total_products || 0)}
            </p>
            <p className="text-slate-400 text-sm">Products</p>
          </div>
          <div className="bg-slate-800/50 rounded-2xl p-4 lg:p-6">
            <Calendar className="w-8 h-8 text-orange-400 mb-2" />
            <p className="text-2xl lg:text-3xl font-bold text-white">
              {loading ? <span className="animate-pulse">...</span> : (stats?.total_bookings || 0)}
            </p>
            <p className="text-slate-400 text-sm">Bookings</p>
          </div>
        </div>
      </div>

      {/* Pending Verifications */}
      {stats?.pending_verifications > 0 && (
        <div className="mb-6">
          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-2xl p-4 flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-400" />
            <div>
              <p className="text-yellow-200 font-semibold">{stats.pending_verifications} pending verifications</p>
              <p className="text-yellow-200/70 text-sm">Review priest applications</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Users */}
      <div>
        <h2 className="font-cinzel text-lg font-semibold text-white mb-4">Recent Users</h2>
        <div className={`${isDesktop ? 'grid grid-cols-2 gap-4' : 'space-y-3'}`}>
          {users.slice(0, isDesktop ? 8 : 5).map((u) => (
            <div key={u.id} className="bg-slate-800/50 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500/30 rounded-full flex items-center justify-center text-indigo-300 font-semibold">
                  {u.name?.charAt(0)}
                </div>
                <div>
                  <p className="text-white font-medium">{u.name}</p>
                  <p className="text-slate-400 text-xs">{u.email}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs bg-indigo-500/30 text-indigo-300 px-2 py-1 rounded-full">
                  {u.role}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Users Tab
function UsersTab({ users, isDesktop, loading }) {
  return (
    <div className={`pb-24 lg:pb-8 ${isDesktop ? 'px-8' : 'px-4'}`}>
      <div className="pt-4">
        <h2 className="font-cinzel text-xl font-semibold text-white mb-4">All Users</h2>
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
          </div>
        ) : (
        <div className={`${isDesktop ? 'grid grid-cols-2 xl:grid-cols-3 gap-4' : 'space-y-3'}`}>
          {users.map((u) => (
            <div key={u.id} className="bg-slate-800/50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-indigo-500/30 rounded-full flex items-center justify-center text-indigo-300 font-semibold text-lg">
                  {u.name?.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">{u.name}</p>
                  <p className="text-slate-400 text-sm">{u.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  u.role === 'admin' ? 'bg-purple-500/30 text-purple-300' :
                  u.role === 'priest' ? 'bg-yellow-500/30 text-yellow-300' :
                  u.role === 'shop_owner' ? 'bg-green-500/30 text-green-300' :
                  'bg-indigo-500/30 text-indigo-300'
                }`}>
                  {u.role}
                </span>
                <span className="text-xs text-slate-500">
                  {u.is_verified ? '✓ Verified' : 'Unverified'}
                </span>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
    </div>
  );
}

// Priests Tab
function PriestsTab({ priests, isDesktop, loading }) {
  return (
    <div className={`pb-24 lg:pb-8 ${isDesktop ? 'px-8' : 'px-4'}`}>
      <div className="pt-4">
        <h2 className="font-cinzel text-xl font-semibold text-white mb-4">Manage Priests</h2>
        {priests.length === 0 ? (
          <div className="bg-slate-800/50 rounded-xl p-8 text-center">
            <UserCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No priests registered yet</p>
          </div>
        ) : (
          <div className={`${isDesktop ? 'grid grid-cols-2 xl:grid-cols-3 gap-4' : 'space-y-3'}`}>
            {priests.map((priest) => (
              <div key={priest.id} className="bg-slate-800/50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-white font-semibold text-xl">
                    {priest.user_name?.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium">{priest.user_name}</p>
                      {priest.is_verified && <CheckCircle className="w-4 h-4 text-green-400" />}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-slate-400">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      {priest.rating} ({priest.total_reviews} reviews)
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {priest.specializations?.slice(0, 2).map((s, i) => (
                    <span key={i} className="text-xs bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded-full">
                      {s}
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  {!priest.is_verified && (
                    <button className="flex-1 bg-green-500/20 text-green-400 rounded-lg py-2 text-sm hover:bg-green-500/30 transition-colors">
                      Verify
                    </button>
                  )}
                  <button className="flex-1 bg-slate-700 text-slate-300 rounded-lg py-2 text-sm hover:bg-slate-600 transition-colors">
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Products Tab
function ProductsTab({ products, isDesktop, loading }) {
  return (
    <div className={`pb-24 lg:pb-8 ${isDesktop ? 'px-8' : 'px-4'}`}>
      <div className="pt-4">
        <h2 className="font-cinzel text-xl font-semibold text-white mb-4">All Products</h2>
        {products.length === 0 ? (
          <div className="bg-slate-800/50 rounded-xl p-8 text-center">
            <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No products available</p>
          </div>
        ) : (
          <div className={`grid ${isDesktop ? 'grid-cols-3 xl:grid-cols-4' : 'grid-cols-2'} gap-4`}>
            {products.map((product) => (
              <div key={product.id} className="bg-slate-800/50 rounded-xl p-3 lg:p-4">
                <div className="aspect-square bg-slate-700/50 rounded-xl mb-3 flex items-center justify-center overflow-hidden">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <Package className="w-10 h-10 text-slate-600" />
                  )}
                </div>
                <p className="text-white font-medium text-sm line-clamp-2 mb-1">{product.name}</p>
                <div className="flex items-center justify-between">
                  <p className="text-green-400 font-bold">₹{product.price}</p>
                  <span className="text-xs text-slate-400">Stock: {product.stock}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Bookings Tab
function BookingsTab({ bookings, isDesktop, loading }) {
  return (
    <div className={`pb-24 lg:pb-8 ${isDesktop ? 'px-8' : 'px-4'}`}>
      <div className="pt-4">
        <h2 className="font-cinzel text-xl font-semibold text-white mb-4">All Bookings</h2>
        {bookings.length === 0 ? (
          <div className="bg-slate-800/50 rounded-xl p-8 text-center">
            <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No bookings yet</p>
          </div>
        ) : (
          <div className={`${isDesktop ? 'grid grid-cols-2 gap-4' : 'space-y-3'}`}>
            {bookings.map((booking) => (
              <div key={booking.id} className="bg-slate-800/50 rounded-xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-white font-medium">{booking.service_name}</p>
                    <p className="text-sm text-slate-400">{booking.priest_name}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    booking.status === 'confirmed' ? 'bg-blue-500/30 text-blue-300' :
                    booking.status === 'pending' ? 'bg-yellow-500/30 text-yellow-300' :
                    booking.status === 'completed' ? 'bg-green-500/30 text-green-300' :
                    'bg-red-500/30 text-red-300'
                  }`}>
                    {booking.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {new Date(booking.booking_date).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Feedback & Testimonials Tab
function FeedbackTab({ isDesktop }) {
  const [feedback, setFeedback] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('feedback');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [feedbackRes, testimonialsRes] = await Promise.all([
        api.get('/api/feedback').catch(() => ({ data: { feedback: [] } })),
        api.get('/api/testimonials?approved_only=false').catch(() => ({ data: { testimonials: [] } }))
      ]);
      setFeedback(feedbackRes.data.feedback || []);
      setTestimonials(testimonialsRes.data.testimonials || []);
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveTestimonial = async (id) => {
    try {
      await api.put(`/api/testimonials/${id}/approve`);
      toast.success('Testimonial approved!');
      fetchData();
    } catch (error) {
      toast.error('Failed to approve testimonial');
    }
  };

  const handleDeleteTestimonial = async (id) => {
    if (!window.confirm('Are you sure you want to delete this testimonial?')) return;
    try {
      await api.delete(`/api/testimonials/${id}`);
      toast.success('Testimonial deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete testimonial');
    }
  };

  return (
    <div className={`${isDesktop ? 'px-8' : 'px-4'} py-6`}>
      {/* Sub Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveSubTab('feedback')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeSubTab === 'feedback' 
              ? 'bg-indigo-500 text-white' 
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <Mail className="w-4 h-4 inline mr-2" />
          Feedback ({feedback.length})
        </button>
        <button
          onClick={() => setActiveSubTab('testimonials')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeSubTab === 'testimonials' 
              ? 'bg-indigo-500 text-white' 
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <MessageSquare className="w-4 h-4 inline mr-2" />
          Testimonials ({testimonials.length})
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
        </div>
      ) : activeSubTab === 'feedback' ? (
        /* Feedback List */
        <div className="space-y-4">
          {feedback.length === 0 ? (
            <div className="bg-slate-800/50 rounded-xl p-8 text-center">
              <Mail className="w-12 h-12 mx-auto text-slate-600 mb-3" />
              <p className="text-slate-400">No feedback received yet</p>
            </div>
          ) : (
            feedback.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-800/50 rounded-xl p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-white">{item.name}</h4>
                    <p className="text-sm text-slate-400">{item.email}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-4 h-4 ${i < (item.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`} 
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-indigo-400 font-medium mb-2">{item.subject}</p>
                <p className="text-slate-300">{item.message}</p>
                <p className="text-xs text-slate-500 mt-2">
                  {new Date(item.created_at).toLocaleString()}
                </p>
              </motion.div>
            ))
          )}
        </div>
      ) : (
        /* Testimonials List */
        <div className="space-y-4">
          {testimonials.length === 0 ? (
            <div className="bg-slate-800/50 rounded-xl p-8 text-center">
              <MessageSquare className="w-12 h-12 mx-auto text-slate-600 mb-3" />
              <p className="text-slate-400">No testimonials yet</p>
            </div>
          ) : (
            testimonials.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-slate-800/50 rounded-xl p-4 border-l-4 ${
                  item.is_approved ? 'border-green-500' : 'border-yellow-500'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-white">{item.user_name}</h4>
                    <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded capitalize">
                      {item.user_role}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      item.is_approved 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {item.is_approved ? 'Approved' : 'Pending'}
                    </span>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${i < item.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`} 
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-slate-300 mb-3">"{item.content}"</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">
                    {new Date(item.created_at).toLocaleString()}
                  </p>
                  <div className="flex gap-2">
                    {!item.is_approved && (
                      <button
                        onClick={() => handleApproveTestimonial(item.id)}
                        className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30 transition-colors flex items-center gap-1"
                      >
                        <Check className="w-4 h-4" />
                        Approve
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteTestimonial(item.id)}
                      className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [priests, setPriests] = useState([]);
  const [products, setProducts] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const isDesktop = useIsDesktop();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, usersRes, priestsRes, productsRes, bookingsRes] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/admin/users'),
        api.get('/api/priests'),
        api.get('/api/products'),
        api.get('/api/bookings')
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data.users || []);
      setPriests(priestsRes.data.priests || []);
      setProducts(productsRes.data.products || []);
      setBookings(bookingsRes.data.bookings || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-b from-[#0F172A] to-[#1E293B] ${isDesktop ? 'lg:pl-64' : ''}`}>
      <Toaster position="top-center" richColors />
      
      {isDesktop && <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} />}

      {/* Header - Mobile Only */}
      {!isDesktop && (
        <div className="px-4 pt-8 pb-6">
          <p className="text-slate-400 text-sm">Admin Dashboard</p>
          <h1 className="font-cinzel text-2xl font-bold text-white">{user?.name || 'Admin'}</h1>
        </div>
      )}

      {/* Desktop Header */}
      {isDesktop && (
        <div className="px-8 pt-8 pb-4 flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm">Admin Dashboard</p>
            <h1 className="font-cinzel text-2xl font-bold text-white">{user?.name || 'Admin'}</h1>
          </div>
          <button className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <Bell className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Content - show skeleton/loading states inside tabs instead of full page spinner */}
      {activeTab === 'overview' && <OverviewTab stats={stats} users={users} isDesktop={isDesktop} loading={loading} />}
      {activeTab === 'users' && <UsersTab users={users} isDesktop={isDesktop} loading={loading} />}
      {activeTab === 'priests' && <PriestsTab priests={priests} isDesktop={isDesktop} loading={loading} />}
      {activeTab === 'products' && <ProductsTab products={products} isDesktop={isDesktop} loading={loading} />}
      {activeTab === 'bookings' && <BookingsTab bookings={bookings} isDesktop={isDesktop} loading={loading} />}
      {activeTab === 'feedback' && <FeedbackTab isDesktop={isDesktop} />}
      {activeTab === 'consultation' && <ConsultationSettingsAdmin />}
      {activeTab === 'system' && <SystemSettingsAdmin />}

      {/* Mobile Logout - shown only on overview */}
      {!isDesktop && activeTab === 'overview' && (
        <div className="px-4 mt-6 pb-24">
          <button 
            onClick={logout}
            className="w-full bg-red-500/20 rounded-xl p-4 flex items-center justify-center gap-2 text-red-400"
            data-testid="admin-logout"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      )}

      {!isDesktop && <AdminBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />}
    </div>
  );
}
