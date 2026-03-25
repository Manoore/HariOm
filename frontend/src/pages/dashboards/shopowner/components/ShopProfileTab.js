import React, { useState, useEffect } from 'react';
import { Store, Loader2, Save, LogOut } from 'lucide-react';
import api from '../../../../lib/api';
import { toast } from 'sonner';
import { useAuth } from '../../../../contexts/AuthContext';

export function ShopProfileTab({ isDesktop }) {
  const { logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/api/shop/profile');
      setProfile(res.data);
      setFormData(res.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/api/shop/profile', formData);
      toast.success('Profile updated');
      setProfile(formData);
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 text-saffron animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-4 lg:p-8 text-center py-12">
        <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="font-semibold text-gray-700 mb-2">Shop Not Registered</h3>
        <p className="text-gray-500">Please register your shop first.</p>
      </div>
    );
  }

  return (
    <div className={`p-4 lg:p-8 pb-24 lg:pb-8`}>
      <div className="mb-6">
        <h1 className="font-cinzel text-2xl font-bold text-maroon">Shop Profile</h1>
        <p className="text-gray-500 text-sm">Manage your shop information and settings</p>
      </div>

      <div className={`${isDesktop ? 'max-w-2xl' : ''}`}>
        <div className="bg-white rounded-2xl border border-orange-50 p-6 space-y-6">
          {/* Shop Name */}
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Shop Name</label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-orange-100 focus:ring-2 focus:ring-saffron/50 focus:border-saffron outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Description</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-orange-100 focus:ring-2 focus:ring-saffron/50 focus:border-saffron outline-none resize-none"
            />
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Phone</label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-orange-100 focus:ring-2 focus:ring-saffron/50 focus:border-saffron outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Email</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-orange-100 focus:ring-2 focus:ring-saffron/50 focus:border-saffron outline-none"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Address</label>
            <input
              type="text"
              value={formData.address || ''}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-orange-100 focus:ring-2 focus:ring-saffron/50 focus:border-saffron outline-none"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-1 block">City</label>
            <input
              type="text"
              value={formData.city || ''}
              onChange={(e) => setFormData({...formData, city: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-orange-100 focus:ring-2 focus:ring-saffron/50 focus:border-saffron outline-none"
            />
          </div>

          {/* Shipping Settings */}
          <div className="pt-4 border-t border-orange-100">
            <h3 className="font-medium text-maroon mb-4">Shipping Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Shipping Cost (₹)</label>
                <input
                  type="number"
                  value={formData.shipping_cost || 50}
                  onChange={(e) => setFormData({...formData, shipping_cost: parseInt(e.target.value)})}
                  className="w-full px-4 py-3 rounded-xl border border-orange-100 focus:ring-2 focus:ring-saffron/50 focus:border-saffron outline-none"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Free Shipping Above (₹)</label>
                <input
                  type="number"
                  value={formData.free_shipping_above || 0}
                  onChange={(e) => setFormData({...formData, free_shipping_above: parseInt(e.target.value)})}
                  placeholder="0 = No free shipping"
                  className="w-full px-4 py-3 rounded-xl border border-orange-100 focus:ring-2 focus:ring-saffron/50 focus:border-saffron outline-none"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Set "Free Shipping Above" to 0 to disable free shipping
            </p>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 rounded-xl bg-saffron text-white hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Save Changes
          </button>
        </div>

        {/* Logout - visible on mobile */}
        {!isDesktop && (
          <button
            onClick={logout}
            className="w-full mt-6 flex items-center justify-center gap-2 py-3 bg-red-50 text-red-500 rounded-xl font-medium hover:bg-red-100 transition-colors"
            data-testid="mobile-logout-btn"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        )}
      </div>
    </div>
  );
}
