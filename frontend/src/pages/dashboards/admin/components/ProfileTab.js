import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Key, ChevronRight, Loader2, Check } from 'lucide-react';
import api from '../../../../lib/api';
import { toast } from 'sonner';

export function ProfileTab({ isDesktop, user, onRefresh }) {
  const [profile, setProfile] = useState({ name: '', email: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile({ name: user.name || '', email: user.email || '', phone: user.phone || '' });
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!profile.name.trim()) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);
    try {
      await api.put('/api/users/profile', { name: profile.name, phone: profile.phone });
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
      toast.error('Please fill in all password fields');
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwordForm.new_password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setChangingPassword(true);
    try {
      await api.put('/api/users/change-password', {
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
    <div className={`${isDesktop ? 'px-8' : 'px-4'} py-6 max-w-2xl`}>
      <h2 className="font-cinzel text-xl font-semibold text-gray-800 mb-6">My Profile</h2>
      
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-saffron/20 rounded-full flex items-center justify-center text-saffron-dark font-cinzel text-2xl">
              {user?.name?.charAt(0)}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{user?.name}</h3>
              <p className="text-sm text-gray-500">{user?.role === 'super_admin' ? 'Super Administrator' : 'Administrator'}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <User className="w-4 h-4" /> Full Name
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-4 py-2 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Mail className="w-4 h-4" /> Email
              </label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full px-4 py-2 border border-orange-200 rounded-xl bg-gray-50 text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Phone className="w-4 h-4" /> Phone
              </label>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
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
