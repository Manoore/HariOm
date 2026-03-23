import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Key, X, Check, Loader2, UserPlus, Mail, Lock, Phone, User } from 'lucide-react';
import api from '../../../../lib/api';
import { toast } from 'sonner';

export function UsersTab({ users, isDesktop, loading, onRefresh }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [processing, setProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'shop_owner'
  });

  const handleToggleStatus = async (userId, currentStatus) => {
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

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (newUser.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setProcessing(true);
    try {
      await api.post('/api/admin/users/create', newUser);
      toast.success(`${newUser.role.replace('_', ' ')} account created successfully!`);
      setShowCreateModal(false);
      setNewUser({ name: '', email: '', phone: '', password: '', role: 'shop_owner' });
      onRefresh?.();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create user');
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
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-cinzel text-xl font-semibold text-gray-800">All Users</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-saffron text-white rounded-xl hover:bg-saffron/90 transition-colors"
            data-testid="create-user-btn"
          >
            <UserPlus className="w-4 h-4" />
            Create User
          </button>
        </div>
        
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

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-md w-full shadow-xl"
          >
            <div className="p-4 border-b border-orange-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Create New User</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-orange-50 rounded-lg text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  className="w-full px-4 py-2 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50 bg-white"
                  data-testid="create-user-role"
                >
                  <option value="devotee">Devotee</option>
                  <option value="priest">Priest</option>
                  <option value="astrologer">Astrologer</option>
                  <option value="shop_owner">Shop Owner</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    className="w-full pl-10 pr-4 py-2 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
                    placeholder="Enter full name"
                    data-testid="create-user-name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    className="w-full pl-10 pr-4 py-2 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
                    placeholder="Enter email address"
                    data-testid="create-user-email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                    className="w-full pl-10 pr-4 py-2 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
                    placeholder="Enter phone number"
                    data-testid="create-user-phone"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    className="w-full pl-10 pr-4 py-2 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
                    placeholder="Min 6 characters"
                    data-testid="create-user-password"
                  />
                </div>
              </div>

              <div className="bg-orange-50 rounded-xl p-3 text-sm text-gray-600">
                <p>The user will be able to login with the email and password you set here.</p>
              </div>
            </div>

            <div className="p-4 border-t border-orange-100 flex justify-end gap-3">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-gray-500 hover:text-gray-700">
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                disabled={processing || !newUser.name || !newUser.email || newUser.password.length < 6}
                className="px-6 py-2 bg-saffron text-white rounded-xl disabled:opacity-50 flex items-center gap-2 hover:bg-saffron-dark transition-colors"
                data-testid="create-user-submit"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Create User
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
