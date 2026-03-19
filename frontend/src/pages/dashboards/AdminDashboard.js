import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Star, ShoppingBag, Calendar, Settings, LogOut,
  ChevronRight, CheckCircle, AlertCircle, Loader2, TrendingUp,
  Home, BarChart3, UserCheck, Package, Bell, Video, Key, MessageSquare, Mail, Trash2, Check, X, BookOpen, Plus, Edit2, Search, User, Shield, Music, Play, Pause, Volume2, Menu, FileText
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
  const isSuperAdmin = user?.role === 'super_admin';
  
  const tabs = [
    { id: 'overview', icon: Home, label: 'Overview' },
    { id: 'users', icon: Users, label: 'Users' },
    { id: 'priests', icon: UserCheck, label: 'Priests' },
    { id: 'products', icon: Package, label: 'Products' },
    { id: 'bookings', icon: Calendar, label: 'Bookings' },
    { id: 'puja-types', icon: BookOpen, label: 'Puja Types' },
    { id: 'audio-library', icon: Music, label: 'Audio Library' },
    { id: 'feedback', icon: MessageSquare, label: 'Feedback & Reviews' },
    ...(isSuperAdmin ? [{ id: 'admin-management', icon: Key, label: 'Admin Management' }] : []),
    { id: 'consultation', icon: Video, label: 'Consultation Settings' },
    { id: 'system', icon: Settings, label: 'System Settings' },
    { id: 'profile', icon: User, label: 'My Profile' },
  ];

  return (
    <div className="fixed left-0 top-0 bottom-0 w-64 bg-gradient-to-b from-orange-50 to-amber-100 border-r border-orange-200 flex flex-col z-40">
      {/* Logo */}
      <div className="p-6 border-b border-orange-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <ellipse cx="50" cy="85" rx="30" ry="8" fill="#B8860B" />
              <path d="M30 85 Q30 70 35 60 L65 60 Q70 70 70 85" fill="#FFD700" />
              <ellipse cx="50" cy="60" rx="18" ry="6" fill="#FFD700" />
              <path d="M50 55 Q45 40 50 25 Q55 40 50 55" fill="#FF9933" />
            </svg>
          </div>
          <span className="font-cinzel text-xl font-bold text-gray-800">DIVINE</span>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-orange-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-saffron/20 rounded-full flex items-center justify-center text-saffron-dark font-cinzel">
            {user?.name?.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-gray-800">{user?.name}</p>
            <p className="text-xs text-gray-500">Administrator</p>
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
                ? 'bg-saffron text-gray-800 shadow-md' 
                : 'text-gray-600 hover:bg-orange-100 hover:text-saffron-dark'
            }`}
            data-testid={`admin-sidebar-${tab.id}`}
          >
            <tab.icon className="w-5 h-5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-orange-200">
        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
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
  const [showMore, setShowMore] = useState(false);
  
  const mainTabs = [
    { id: 'overview', icon: Home, label: 'Home' },
    { id: 'users', icon: Users, label: 'Users' },
    { id: 'priests', icon: UserCheck, label: 'Priests' },
    { id: 'more', icon: Menu, label: 'More', isMore: true },
  ];

  const moreTabs = [
    { id: 'products', icon: Package, label: 'Products' },
    { id: 'bookings', icon: Calendar, label: 'Bookings' },
    { id: 'orders', icon: ShoppingBag, label: 'Orders' },
    { id: 'content', icon: FileText, label: 'Content' },
    { id: 'system', icon: Settings, label: 'Settings' },
  ];

  return (
    <>
      {/* More Menu Overlay */}
      {showMore && (
        <div className="fixed inset-0 z-40" onClick={() => setShowMore(false)}>
          <div className="absolute bottom-20 left-4 right-4 bg-white rounded-2xl shadow-2xl border border-orange-200 p-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-cinzel font-semibold text-maroon">More Options</h3>
              <button onClick={() => setShowMore(false)} className="p-1">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {moreTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setShowMore(false);
                  }}
                  className="flex flex-col items-center p-2 rounded-xl hover:bg-orange-50 transition-colors"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-saffron/10 to-gold/10 rounded-xl flex items-center justify-center mb-1">
                    <tab.icon className="w-6 h-6 text-saffron" />
                  </div>
                  <span className="text-xs text-gray-600 text-center leading-tight">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-orange-200 px-2 py-2 z-50 lg:hidden shadow-lg">
        <div className="flex justify-around items-center">
          {mainTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => tab.isMore ? setShowMore(!showMore) : setActiveTab(tab.id)}
              className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
                tab.isMore && showMore ? 'text-saffron' :
                activeTab === tab.id && !tab.isMore ? 'text-saffron' : 'text-gray-500'
              }`}
              data-testid={`admin-nav-${tab.id}`}
            >
              <tab.icon className={`w-6 h-6 ${(activeTab === tab.id || (tab.isMore && showMore)) ? 'stroke-[2.5]' : ''}`} />
              <span className={`text-xs mt-1 ${(activeTab === tab.id || (tab.isMore && showMore)) ? 'font-semibold' : ''}`}>
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

// Overview Tab
function OverviewTab({ stats, users, isDesktop, loading }) {
  return (
    <div className={`pb-24 lg:pb-8 ${isDesktop ? 'px-8' : 'px-4'}`}>
      {/* Stats Grid */}
      <div className="pt-4 mb-6">
        <h2 className="font-cinzel text-lg font-semibold text-gray-800 mb-4">Dashboard Overview</h2>
        <div className={`grid ${isDesktop ? 'grid-cols-4' : 'grid-cols-2'} gap-4`}>
          <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-orange-100">
            <Users className="w-8 h-8 text-saffron mb-2" />
            <p className="text-2xl lg:text-3xl font-bold text-gray-800">
              {loading ? <span className="animate-pulse">...</span> : (stats?.total_users || 0)}
            </p>
            <p className="text-gray-500 text-sm">Total Users</p>
          </div>
          <div className="bg-white shadow-sm border border-orange-100 rounded-2xl p-4 lg:p-6">
            <Star className="w-8 h-8 text-yellow-400 mb-2" />
            <p className="text-2xl lg:text-3xl font-bold text-gray-800">
              {loading ? <span className="animate-pulse">...</span> : (stats?.total_priests || 0)}
            </p>
            <p className="text-gray-500 text-sm">Priests</p>
          </div>
          <div className="bg-white shadow-sm border border-orange-100 rounded-2xl p-4 lg:p-6">
            <ShoppingBag className="w-8 h-8 text-green-400 mb-2" />
            <p className="text-2xl lg:text-3xl font-bold text-gray-800">
              {loading ? <span className="animate-pulse">...</span> : (stats?.total_products || 0)}
            </p>
            <p className="text-gray-500 text-sm">Products</p>
          </div>
          <div className="bg-white shadow-sm border border-orange-100 rounded-2xl p-4 lg:p-6">
            <Calendar className="w-8 h-8 text-orange-400 mb-2" />
            <p className="text-2xl lg:text-3xl font-bold text-gray-800">
              {loading ? <span className="animate-pulse">...</span> : (stats?.total_bookings || 0)}
            </p>
            <p className="text-gray-500 text-sm">Bookings</p>
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
        <h2 className="font-cinzel text-lg font-semibold text-gray-800 mb-4">Recent Users</h2>
        <div className={`${isDesktop ? 'grid grid-cols-2 gap-4' : 'space-y-3'}`}>
          {users.slice(0, isDesktop ? 8 : 5).map((u) => (
            <div key={u.id} className="bg-white shadow-sm border border-orange-100 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-saffron/30 rounded-full flex items-center justify-center text-indigo-300 font-semibold">
                  {u.name?.charAt(0)}
                </div>
                <div>
                  <p className="text-gray-800 font-medium">{u.name}</p>
                  <p className="text-gray-500 text-xs">{u.email}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs bg-saffron/30 text-indigo-300 px-2 py-1 rounded-full">
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
function UsersTab({ users, isDesktop, loading, onRefresh }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [processing, setProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const handleToggleStatus = async (userId, currentStatus) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this user?`)) return;
    
    setProcessing(true);
    try {
      await api.put(`/api/admin/users/${userId}/status`, { is_active: !currentStatus });
      toast.success(`User ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      onRefresh?.();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update user status');
    } finally {
      setProcessing(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setProcessing(true);
    try {
      await api.post(`/api/admin/users/${selectedUser.id}/reset-password`, { new_password: newPassword });
      toast.success('Password reset successfully');
      setShowResetModal(false);
      setNewPassword('');
      setSelectedUser(null);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to reset password');
    } finally {
      setProcessing(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className={`pb-24 lg:pb-8 ${isDesktop ? 'px-8' : 'px-4'}`}>
      <div className="pt-4">
        <h2 className="font-cinzel text-xl font-semibold text-gray-800 mb-4">All Users</h2>
        
        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50 bg-white"
          >
            <option value="">All Roles</option>
            <option value="devotee">Devotee</option>
            <option value="priest">Priest</option>
            <option value="shop_owner">Shop Owner</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 text-saffron animate-spin" />
          </div>
        ) : (
        <div className={`${isDesktop ? 'grid grid-cols-2 xl:grid-cols-3 gap-4' : 'space-y-3'}`}>
          {filteredUsers.map((u) => (
            <div key={u.id} className={`bg-white shadow-sm border rounded-xl p-4 ${!u.is_active ? 'border-red-200 bg-red-50/30' : 'border-orange-100'}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-lg ${
                  u.is_active ? 'bg-saffron/30 text-saffron-dark' : 'bg-gray-200 text-gray-400'
                }`}>
                  {u.name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${u.is_active ? 'text-gray-800' : 'text-gray-400'}`}>{u.name}</p>
                  <p className="text-gray-500 text-sm truncate">{u.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                  u.role === 'priest' ? 'bg-yellow-100 text-yellow-700' :
                  u.role === 'shop_owner' ? 'bg-green-100 text-green-700' :
                  'bg-orange-100 text-orange-700'
                }`}>
                  {u.role}
                </span>
                <div className="flex items-center gap-2">
                  {u.is_verified && <span className="text-xs text-green-600">✓ Verified</span>}
                  {!u.is_active && <span className="text-xs text-red-500">Inactive</span>}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 border-t border-orange-100">
                <button
                  onClick={() => { setSelectedUser(u); setShowResetModal(true); }}
                  className="flex-1 text-xs px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
                  disabled={processing}
                >
                  <Key className="w-3 h-3" />
                  Reset Password
                </button>
                <button
                  onClick={() => handleToggleStatus(u.id, u.is_active)}
                  className={`flex-1 text-xs px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-1 ${
                    u.is_active 
                      ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                      : 'bg-green-50 text-green-600 hover:bg-green-100'
                  }`}
                  disabled={processing || u.role === 'admin'}
                >
                  {u.is_active ? (
                    <><X className="w-3 h-3" /> Deactivate</>
                  ) : (
                    <><Check className="w-3 h-3" /> Activate</>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>

      {/* Reset Password Modal */}
      {showResetModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-md w-full shadow-xl"
          >
            <div className="p-4 border-b border-orange-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Reset Password</h2>
              <button onClick={() => { setShowResetModal(false); setNewPassword(''); }} className="p-2 hover:bg-orange-50 rounded-lg text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4">
              <div className="bg-orange-50 rounded-xl p-3 mb-4">
                <p className="font-medium text-gray-800">{selectedUser.name}</p>
                <p className="text-sm text-gray-500">{selectedUser.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
                  placeholder="Enter new password (min 6 characters)"
                />
              </div>
            </div>

            <div className="p-4 border-t border-orange-100 flex justify-end gap-3">
              <button onClick={() => { setShowResetModal(false); setNewPassword(''); }} className="px-4 py-2 text-gray-500 hover:text-gray-700">
                Cancel
              </button>
              <button
                onClick={handleResetPassword}
                disabled={processing || newPassword.length < 6}
                className="px-6 py-2 bg-saffron text-white rounded-xl disabled:opacity-50 flex items-center gap-2 hover:bg-saffron-dark transition-colors"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                Reset Password
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// Priests Tab
function PriestsTab({ priests, isDesktop, loading }) {
  return (
    <div className={`pb-24 lg:pb-8 ${isDesktop ? 'px-8' : 'px-4'}`}>
      <div className="pt-4">
        <h2 className="font-cinzel text-xl font-semibold text-gray-800 mb-4">Manage Priests</h2>
        {priests.length === 0 ? (
          <div className="bg-white shadow-sm border border-orange-100 rounded-xl p-8 text-center">
            <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No priests registered yet</p>
          </div>
        ) : (
          <div className={`${isDesktop ? 'grid grid-cols-2 xl:grid-cols-3 gap-4' : 'space-y-3'}`}>
            {priests.map((priest) => (
              <div key={priest.id} className="bg-white shadow-sm border border-orange-100 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-gray-800 font-semibold text-xl">
                    {priest.user_name?.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-gray-800 font-medium">{priest.user_name}</p>
                      {priest.is_verified && <CheckCircle className="w-4 h-4 text-green-400" />}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
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
                  <button className="flex-1 bg-gray-100 text-gray-600 rounded-lg py-2 text-sm hover:bg-orange-100 transition-colors">
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
        <h2 className="font-cinzel text-xl font-semibold text-gray-800 mb-4">All Products</h2>
        {products.length === 0 ? (
          <div className="bg-white shadow-sm border border-orange-100 rounded-xl p-8 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No products available</p>
          </div>
        ) : (
          <div className={`grid ${isDesktop ? 'grid-cols-3 xl:grid-cols-4' : 'grid-cols-2'} gap-4`}>
            {products.map((product) => (
              <div key={product.id} className="bg-white shadow-sm border border-orange-100 rounded-xl p-3 lg:p-4">
                <div className="aspect-square bg-gray-100 rounded-xl mb-3 flex items-center justify-center overflow-hidden">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <Package className="w-10 h-10 text-gray-400" />
                  )}
                </div>
                <p className="text-gray-800 font-medium text-sm line-clamp-2 mb-1">{product.name}</p>
                <div className="flex items-center justify-between">
                  <p className="text-green-400 font-bold">₹{product.price}</p>
                  <span className="text-xs text-gray-500">Stock: {product.stock}</span>
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
        <h2 className="font-cinzel text-xl font-semibold text-gray-800 mb-4">All Bookings</h2>
        {bookings.length === 0 ? (
          <div className="bg-white shadow-sm border border-orange-100 rounded-xl p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No bookings yet</p>
          </div>
        ) : (
          <div className={`${isDesktop ? 'grid grid-cols-2 gap-4' : 'space-y-3'}`}>
            {bookings.map((booking) => (
              <div key={booking.id} className="bg-white shadow-sm border border-orange-100 rounded-xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-gray-800 font-medium">{booking.service_name}</p>
                    <p className="text-sm text-gray-500">{booking.priest_name}</p>
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
                <p className="text-xs text-gray-500">
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

// Puja Types Management Tab
function PujaTypesTab({ isDesktop }) {
  const [pujaTypes, setPujaTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPuja, setEditingPuja] = useState(null);
  const [form, setForm] = useState({ name: '', category: 'Deity Puja' });
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const categories = [
    'Deity Puja', 'Festival Puja', 'Samskara', 'Griha Puja', 'Graha Puja',
    'Homa & Yajna', 'Vrat Puja', 'Prosperity Puja', 'Marriage Puja',
    'Pitru Puja', 'Nature Puja', 'Protection Puja', 'Daily Puja', 'Education Puja', 'General'
  ];

  useEffect(() => {
    fetchPujaTypes();
  }, []);

  const fetchPujaTypes = async () => {
    try {
      const res = await api.get('/api/admin/puja-types');
      setPujaTypes(res.data.puja_types || []);
    } catch (error) {
      toast.error('Failed to load puja types');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('Enter puja name');
      return;
    }
    setSaving(true);
    try {
      if (editingPuja) {
        await api.put(`/api/admin/puja-types/${editingPuja.id}`, form);
        toast.success('Puja type updated!');
      } else {
        await api.post('/api/admin/puja-types', form);
        toast.success('Puja type added!');
      }
      fetchPujaTypes();
      setShowModal(false);
      setEditingPuja(null);
      setForm({ name: '', category: 'Deity Puja' });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this puja type?')) return;
    try {
      await api.delete(`/api/admin/puja-types/${id}`);
      toast.success('Puja type deleted!');
      fetchPujaTypes();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleEdit = (puja) => {
    setEditingPuja(puja);
    setForm({ name: puja.name, category: puja.category });
    setShowModal(true);
  };

  const filteredPujas = pujaTypes.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Group by category for display
  const groupedPujas = filteredPujas.reduce((acc, puja) => {
    const cat = puja.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(puja);
    return acc;
  }, {});

  return (
    <div className={`${isDesktop ? 'px-8 pb-8' : 'px-4 pb-24'}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Puja Types Management</h2>
          <p className="text-gray-500 text-sm">Manage the dropdown options for puja services</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setEditingPuja(null); setForm({ name: '', category: 'Deity Puja' }); }}
          className="flex items-center gap-2 px-4 py-2 bg-saffron text-gray-800 rounded-xl hover:bg-indigo-600 transition-colors"
          data-testid="add-puja-type-btn"
        >
          <Plus className="w-4 h-4" />
          Add Puja Type
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search puja types..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 bg-white shadow-sm border border-orange-200 rounded-xl text-gray-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-saffron"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 bg-white shadow-sm border border-orange-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-saffron"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white shadow-sm rounded-xl p-4">
          <p className="text-gray-500 text-sm">Total Pujas</p>
          <p className="text-2xl font-bold text-gray-800">{pujaTypes.length}</p>
        </div>
        <div className="bg-white shadow-sm rounded-xl p-4">
          <p className="text-gray-500 text-sm">Categories</p>
          <p className="text-2xl font-bold text-gray-800">{Object.keys(groupedPujas).length}</p>
        </div>
        <div className="bg-white shadow-sm rounded-xl p-4">
          <p className="text-gray-500 text-sm">Active</p>
          <p className="text-2xl font-bold text-green-400">{pujaTypes.filter(p => p.is_active).length}</p>
        </div>
        <div className="bg-white shadow-sm rounded-xl p-4">
          <p className="text-gray-500 text-sm">Inactive</p>
          <p className="text-2xl font-bold text-red-400">{pujaTypes.filter(p => !p.is_active).length}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-saffron" />
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedPujas).sort().map(([category, pujas]) => (
            <div key={category} className="bg-white shadow-sm border border-orange-100 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-saffron" />
                {category} ({pujas.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {pujas.map(puja => (
                  <div
                    key={puja.id}
                    className={`flex items-center justify-between p-3 rounded-xl ${
                      puja.is_active ? 'bg-gray-100' : 'bg-red-100'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${puja.is_active ? 'text-gray-800' : 'text-red-400'}`}>
                        {puja.name}
                      </p>
                      {!puja.is_active && <span className="text-xs text-red-400">Inactive</span>}
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <button
                        onClick={() => handleEdit(puja)}
                        className="p-1.5 hover:bg-orange-100 rounded-lg text-gray-500 hover:text-gray-800 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(puja.id)}
                        className="p-1.5 hover:bg-red-500/20 rounded-lg text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white shadow-sm rounded-2xl max-w-md w-full"
          >
            <div className="p-4 border-b border-orange-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                {editingPuja ? 'Edit Puja Type' : 'Add Puja Type'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-orange-50 rounded-lg text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Puja Name*</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-saffron"
                  placeholder="e.g., Ganesh Puja"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-saffron"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {editingPuja && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={form.is_active !== false}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="is_active" className="text-sm text-gray-600">Active (visible in dropdown)</label>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-orange-200 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-500 hover:text-gray-800">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-6 py-2 bg-saffron text-gray-800 rounded-xl disabled:opacity-50 flex items-center gap-2 hover:bg-indigo-600"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {editingPuja ? 'Update' : 'Add'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// Audio Library Management Tab
function AudioLibraryTab({ isDesktop }) {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({ title: '', search_query: '', category: 'ESSENTIAL DAILY MANTRAS' });
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  
  // Audio player state
  const [playingItem, setPlayingItem] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = React.useRef(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await api.get('/api/admin/audio-library');
      setItems(res.data.items || []);
      setCategories(res.data.categories || []);
    } catch (error) {
      toast.error('Failed to load audio library');
    } finally {
      setLoading(false);
    }
  };

  // Effect to auto-play when audioUrl is set
  React.useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((e) => {
          console.error('Auto-play failed:', e);
          // Don't show error toast for auto-play policy blocks
        });
    }
  }, [audioUrl]);

  const handlePlayAudio = async (item) => {
    // If same item, toggle play/pause
    if (playingItem?.id === item.id && audioUrl) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
      return;
    }

    // Stop current audio
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    setPlayingItem(item);
    setAudioLoading(true);
    setAudioUrl(null);
    setIsPlaying(false);

    try {
      const res = await api.get(`/api/archive/play/${item.item_id}`);
      if (res.data.audio_url) {
        setAudioUrl(res.data.audio_url);
        // Auto-play will be handled by useEffect
      } else {
        toast.error('No audio found for this item');
        setPlayingItem(null);
      }
    } catch (error) {
      toast.error('Failed to load audio');
      setPlayingItem(null);
    } finally {
      setAudioLoading(false);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setPlayingItem(null);
    setAudioUrl(null);
    setIsPlaying(false);
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.search_query.trim()) {
      toast.error('Title and search query are required');
      return;
    }
    setSaving(true);
    try {
      if (editingItem) {
        await api.put(`/api/admin/audio-library/${editingItem.id}`, form);
        toast.success('Audio item updated!');
      } else {
        await api.post('/api/admin/audio-library', form);
        toast.success('Audio item added!');
      }
      fetchItems();
      setShowModal(false);
      setEditingItem(null);
      setForm({ title: '', search_query: '', category: 'ESSENTIAL DAILY MANTRAS' });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this audio item?')) return;
    try {
      await api.delete(`/api/admin/audio-library/${id}`);
      toast.success('Audio item deleted!');
      fetchItems();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setForm({ title: item.title, search_query: item.search_query, category: item.category });
    setShowModal(true);
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.search_query.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Group by category
  const groupedItems = filteredItems.reduce((acc, item) => {
    const cat = item.category || 'UNCATEGORIZED';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <div className={`${isDesktop ? 'px-8 pb-8' : 'px-4 pb-24'}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pt-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Audio Library Management</h2>
          <p className="text-gray-500 text-sm">Manage mantras and shlokas for the music player</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setEditingItem(null); setForm({ title: '', search_query: '', category: 'ESSENTIAL DAILY MANTRAS' }); }}
          className="flex items-center gap-2 px-4 py-2 bg-saffron text-white rounded-xl hover:bg-saffron-dark transition-colors"
          data-testid="add-audio-btn"
        >
          <Plus className="w-4 h-4" />
          Add Audio Item
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by title or query..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50 bg-white"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-orange-100">
          <p className="text-gray-500 text-sm">Total Items</p>
          <p className="text-2xl font-bold text-gray-800">{items.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-orange-100">
          <p className="text-gray-500 text-sm">Categories</p>
          <p className="text-2xl font-bold text-gray-800">{Object.keys(groupedItems).length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-orange-100">
          <p className="text-gray-500 text-sm">Active</p>
          <p className="text-2xl font-bold text-green-600">{items.filter(i => i.is_active).length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-orange-100">
          <p className="text-gray-500 text-sm">Inactive</p>
          <p className="text-2xl font-bold text-red-500">{items.filter(i => !i.is_active).length}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-saffron" />
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedItems).sort().map(([category, categoryItems]) => (
            <div key={category} className="bg-white rounded-2xl shadow-sm border border-orange-100 p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Music className="w-5 h-5 text-saffron" />
                {category} ({categoryItems.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {categoryItems.map(item => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-3 rounded-xl ${
                      item.is_active ? 'bg-orange-50' : 'bg-red-50'
                    } ${playingItem?.id === item.id ? 'ring-2 ring-saffron' : ''}`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Play Button */}
                      <button
                        onClick={() => handlePlayAudio(item)}
                        disabled={audioLoading && playingItem?.id === item.id}
                        className={`p-2 rounded-full transition-all ${
                          playingItem?.id === item.id && isPlaying
                            ? 'bg-saffron text-white'
                            : 'bg-white text-saffron hover:bg-saffron hover:text-white'
                        } shadow-sm`}
                      >
                        {audioLoading && playingItem?.id === item.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : playingItem?.id === item.id && isPlaying ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate ${item.is_active ? 'text-gray-800' : 'text-red-400'}`}>
                          {item.title}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{item.search_query}</p>
                        {!item.is_active && <span className="text-xs text-red-500">Inactive</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-1.5 hover:bg-orange-100 rounded-lg text-gray-500 hover:text-saffron-dark transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 hover:bg-red-100 rounded-lg text-gray-500 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hidden Audio Element for Playback */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          onError={(e) => {
            console.error('Audio error:', e);
            toast.error('Failed to play audio');
            setIsPlaying(false);
          }}
          data-testid="audio-player"
        />
      )}

      {/* Now Playing Bar */}
      {playingItem && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-xl border border-orange-200 p-3 flex items-center gap-4 z-40 max-w-md w-[90%]">
          <button
            onClick={() => {
              if (isPlaying) {
                audioRef.current?.pause();
                setIsPlaying(false);
              } else {
                audioRef.current?.play();
                setIsPlaying(true);
              }
            }}
            className="p-3 bg-saffron text-white rounded-full"
            data-testid="audio-player-toggle"
          >
            {audioLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-800 truncate">{playingItem.title}</p>
            <p className="text-xs text-gray-500 truncate">{playingItem.category}</p>
          </div>
          <button
            onClick={stopAudio}
            className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-colors"
            data-testid="audio-player-stop"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-md w-full shadow-xl"
          >
            <div className="p-4 border-b border-orange-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                {editingItem ? 'Edit Audio Item' : 'Add Audio Item'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-orange-50 rounded-lg text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title*</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-2 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
                  placeholder="e.g., Gayatri Mantra"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search Query*</label>
                <input
                  type="text"
                  value={form.search_query}
                  onChange={(e) => setForm({ ...form, search_query: e.target.value })}
                  className="w-full px-4 py-2 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
                  placeholder="e.g., gayatri mantra chanting"
                />
                <p className="text-xs text-gray-500 mt-1">Used to search Internet Archive for audio</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-4 py-2 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50 bg-white"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {editingItem && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={form.is_active !== false}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="is_active" className="text-sm text-gray-600">Active (visible in library)</label>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-orange-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-500 hover:text-gray-700">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-6 py-2 bg-saffron text-white rounded-xl disabled:opacity-50 flex items-center gap-2 hover:bg-saffron-dark transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {editingItem ? 'Update' : 'Add'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// Admin Profile Tab
function ProfileTab({ isDesktop, user, onRefresh }) {
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  useEffect(() => {
    setForm({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || ''
    });
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!form.name || !form.email) {
      toast.error('Name and email are required');
      return;
    }
    setSaving(true);
    try {
      await api.put('/api/admin/profile', form);
      toast.success('Profile updated successfully');
      onRefresh?.();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.current_password || !passwordForm.new_password) {
      toast.error('Please fill all password fields');
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordForm.new_password.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    
    setChangingPassword(true);
    try {
      await api.post('/api/admin/change-password', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password
      });
      toast.success('Password changed successfully');
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      setShowPasswordSection(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className={`pb-24 lg:pb-8 ${isDesktop ? 'px-8' : 'px-4'}`}>
      <div className="pt-4 max-w-2xl">
        <h2 className="font-cinzel text-xl font-semibold text-gray-800 mb-6">My Profile</h2>
        
        {/* Profile Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 bg-saffron/20 rounded-full flex items-center justify-center text-saffron-dark font-cinzel text-3xl">
              {form.name?.charAt(0)}
            </div>
            <div>
              <p className="text-xl font-semibold text-gray-800">{form.name}</p>
              <span className={`text-xs px-3 py-1 rounded-full ${user?.role === 'super_admin' ? 'bg-purple-100 text-purple-700' : 'bg-saffron/20 text-saffron-dark'}`}>
                {user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
              </span>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-2 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
                placeholder="Optional"
              />
            </div>
            <button
              onClick={handleUpdateProfile}
              disabled={saving}
              className="w-full py-2.5 bg-saffron text-white rounded-xl hover:bg-saffron-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6">
          <button
            onClick={() => setShowPasswordSection(!showPasswordSection)}
            className="w-full flex items-center justify-between text-gray-800 font-medium"
          >
            <span className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Change Password
            </span>
            <ChevronRight className={`w-5 h-5 transition-transform ${showPasswordSection ? 'rotate-90' : ''}`} />
          </button>
          
          {showPasswordSection && (
            <div className="mt-4 space-y-4 pt-4 border-t border-orange-100">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input
                  type="password"
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                  className="w-full px-4 py-2 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                  className="w-full px-4 py-2 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordForm.confirm_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                  className="w-full px-4 py-2 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
                />
              </div>
              <button
                onClick={handleChangePassword}
                disabled={changingPassword}
                className="w-full py-2.5 bg-gray-800 text-white rounded-xl hover:bg-gray-900 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                Change Password
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Admin Management Tab (Super Admin Only)
function AdminManagementTab({ isDesktop }) {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', is_super_admin: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const res = await api.get('/api/admin/admins');
      setAdmins(res.data.admins || []);
    } catch (error) {
      toast.error('Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email) {
      toast.error('Name and email are required');
      return;
    }
    if (!editingAdmin && (!form.password || form.password.length < 6)) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setSaving(true);
    try {
      if (editingAdmin) {
        await api.put(`/api/admin/admins/${editingAdmin.id}`, {
          name: form.name,
          is_super_admin: form.is_super_admin
        });
        toast.success('Admin updated');
      } else {
        await api.post('/api/admin/admins', form);
        toast.success('Admin created');
      }
      fetchAdmins();
      setShowAddModal(false);
      setEditingAdmin(null);
      setForm({ name: '', email: '', password: '', is_super_admin: false });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save admin');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (adminId, isActive) => {
    if (!window.confirm(`Are you sure you want to ${isActive ? 'deactivate' : 'activate'} this admin?`)) return;
    try {
      await api.put(`/api/admin/admins/${adminId}`, { is_active: !isActive });
      toast.success(`Admin ${isActive ? 'deactivated' : 'activated'}`);
      fetchAdmins();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update status');
    }
  };

  const handleDelete = async (adminId) => {
    if (!window.confirm('Are you sure you want to delete this admin? This action cannot be undone.')) return;
    try {
      await api.delete(`/api/admin/admins/${adminId}`);
      toast.success('Admin deleted');
      fetchAdmins();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete admin');
    }
  };

  return (
    <div className={`pb-24 lg:pb-8 ${isDesktop ? 'px-8' : 'px-4'}`}>
      <div className="pt-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-cinzel text-xl font-semibold text-gray-800">Admin Management</h2>
            <p className="text-sm text-gray-500">Manage administrators and their permissions</p>
          </div>
          <button
            onClick={() => { setShowAddModal(true); setEditingAdmin(null); setForm({ name: '', email: '', password: '', is_super_admin: false }); }}
            className="flex items-center gap-2 px-4 py-2 bg-saffron text-white rounded-xl hover:bg-saffron-dark transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Admin
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 text-saffron animate-spin" />
          </div>
        ) : (
          <div className={`${isDesktop ? 'grid grid-cols-2 xl:grid-cols-3 gap-4' : 'space-y-3'}`}>
            {admins.map((admin) => (
              <div key={admin.id} className={`bg-white shadow-sm border rounded-2xl p-4 ${!admin.is_active ? 'border-red-200 bg-red-50/30' : 'border-orange-100'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-lg ${
                    admin.role === 'super_admin' ? 'bg-purple-100 text-purple-700' : 'bg-saffron/20 text-saffron-dark'
                  }`}>
                    {admin.role === 'super_admin' ? <Shield className="w-6 h-6" /> : admin.name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${admin.is_active ? 'text-gray-800' : 'text-gray-400'}`}>{admin.name}</p>
                    <p className="text-gray-500 text-sm truncate">{admin.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    admin.role === 'super_admin' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                  </span>
                  {!admin.is_active && <span className="text-xs text-red-500">Inactive</span>}
                </div>
                
                <div className="flex gap-2 pt-2 border-t border-orange-100">
                  <button
                    onClick={() => { setEditingAdmin(admin); setForm({ name: admin.name, email: admin.email, password: '', is_super_admin: admin.role === 'super_admin' }); setShowAddModal(true); }}
                    className="flex-1 text-xs px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleStatus(admin.id, admin.is_active)}
                    className={`flex-1 text-xs px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-1 ${
                      admin.is_active ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100' : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                  >
                    {admin.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDelete(admin.id)}
                    className="text-xs px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Admin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-md w-full shadow-xl"
          >
            <div className="p-4 border-b border-orange-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                {editingAdmin ? 'Edit Admin' : 'Add New Admin'}
              </h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-orange-50 rounded-lg text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name*</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email*</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-2 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
                  disabled={!!editingAdmin}
                />
              </div>
              {!editingAdmin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password*</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-4 py-2 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
                    placeholder="Minimum 6 characters"
                  />
                </div>
              )}
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
                <input
                  type="checkbox"
                  id="is_super_admin"
                  checked={form.is_super_admin}
                  onChange={(e) => setForm({ ...form, is_super_admin: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="is_super_admin" className="flex-1">
                  <p className="text-sm font-medium text-gray-700">Super Admin</p>
                  <p className="text-xs text-gray-500">Can manage other admins and all settings</p>
                </label>
                <Shield className="w-5 h-5 text-purple-500" />
              </div>
            </div>

            <div className="p-4 border-t border-orange-100 flex justify-end gap-3">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-500 hover:text-gray-700">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-6 py-2 bg-saffron text-white rounded-xl disabled:opacity-50 flex items-center gap-2 hover:bg-saffron-dark transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {editingAdmin ? 'Update' : 'Create Admin'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
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
              ? 'bg-saffron text-gray-800' 
              : 'bg-white shadow-sm text-gray-600 hover:bg-orange-50'
          }`}
        >
          <Mail className="w-4 h-4 inline mr-2" />
          Feedback ({feedback.length})
        </button>
        <button
          onClick={() => setActiveSubTab('testimonials')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeSubTab === 'testimonials' 
              ? 'bg-saffron text-gray-800' 
              : 'bg-white shadow-sm text-gray-600 hover:bg-orange-50'
          }`}
        >
          <MessageSquare className="w-4 h-4 inline mr-2" />
          Testimonials ({testimonials.length})
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-saffron" />
        </div>
      ) : activeSubTab === 'feedback' ? (
        /* Feedback List */
        <div className="space-y-4">
          {feedback.length === 0 ? (
            <div className="bg-white shadow-sm border border-orange-100 rounded-xl p-8 text-center">
              <Mail className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500">No feedback received yet</p>
            </div>
          ) : (
            feedback.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white shadow-sm border border-orange-100 rounded-xl p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-800">{item.name}</h4>
                    <p className="text-sm text-gray-500">{item.email}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-4 h-4 ${i < (item.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'}`} 
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-saffron font-medium mb-2">{item.subject}</p>
                <p className="text-gray-600">{item.message}</p>
                <p className="text-xs text-gray-500 mt-2">
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
            <div className="bg-white shadow-sm border border-orange-100 rounded-xl p-8 text-center">
              <MessageSquare className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500">No testimonials yet</p>
            </div>
          ) : (
            testimonials.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white shadow-sm border border-orange-100 rounded-xl p-4 border-l-4 ${
                  item.is_approved ? 'border-green-500' : 'border-yellow-500'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-800">{item.user_name}</h4>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded capitalize">
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
                          className={`w-4 h-4 ${i < item.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'}`} 
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 mb-3">"{item.content}"</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
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
    <div className={`min-h-screen bg-gradient-to-b from-orange-50 to-amber-50 ${isDesktop ? 'lg:pl-64' : ''}`}>
      <Toaster position="top-center" richColors />
      
      {isDesktop && <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} />}

      {/* Header - Mobile Only */}
      {!isDesktop && (
        <div className="px-4 pt-8 pb-6">
          <p className="text-saffron-dark text-sm">Admin Dashboard</p>
          <h1 className="font-cinzel text-2xl font-bold text-gray-800">{user?.name || 'Admin'}</h1>
        </div>
      )}

      {/* Desktop Header */}
      {isDesktop && (
        <div className="px-8 pt-8 pb-4 flex items-center justify-between">
          <div>
            <p className="text-saffron-dark text-sm">Admin Dashboard</p>
            <h1 className="font-cinzel text-2xl font-bold text-gray-800">{user?.name || 'Admin'}</h1>
          </div>
          <button className="w-10 h-10 bg-white shadow-md rounded-full flex items-center justify-center text-saffron hover:text-saffron-dark transition-colors">
            <Bell className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Content - show skeleton/loading states inside tabs instead of full page spinner */}
      {activeTab === 'overview' && <OverviewTab stats={stats} users={users} isDesktop={isDesktop} loading={loading} />}
      {activeTab === 'users' && <UsersTab users={users} isDesktop={isDesktop} loading={loading} onRefresh={fetchData} />}
      {activeTab === 'priests' && <PriestsTab priests={priests} isDesktop={isDesktop} loading={loading} />}
      {activeTab === 'products' && <ProductsTab products={products} isDesktop={isDesktop} loading={loading} />}
      {activeTab === 'bookings' && <BookingsTab bookings={bookings} isDesktop={isDesktop} loading={loading} />}
      {activeTab === 'puja-types' && <PujaTypesTab isDesktop={isDesktop} />}
      {activeTab === 'audio-library' && <AudioLibraryTab isDesktop={isDesktop} />}
      {activeTab === 'feedback' && <FeedbackTab isDesktop={isDesktop} />}
      {activeTab === 'admin-management' && user?.role === 'super_admin' && <AdminManagementTab isDesktop={isDesktop} />}
      {activeTab === 'consultation' && <ConsultationSettingsAdmin />}
      {activeTab === 'system' && <SystemSettingsAdmin />}
      {activeTab === 'profile' && <ProfileTab isDesktop={isDesktop} user={user} onRefresh={fetchData} />}

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
