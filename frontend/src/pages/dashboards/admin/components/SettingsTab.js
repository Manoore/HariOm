import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save, Loader2, ToggleLeft, ToggleRight, Users, Shield } from 'lucide-react';
import api from '../../../../lib/api';
import { toast } from 'sonner';

export function SettingsTab({ isDesktop }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    enable_priest_signup: true,
    enable_astrologer_signup: false,
    enable_shop_owner_signup: false
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/api/admin/signup-settings');
      setSettings(res.data.settings || {
        enable_priest_signup: true,
        enable_astrologer_signup: false,
        enable_shop_owner_signup: false
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
      // Use defaults if API fails
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/api/admin/signup-settings', settings);
      toast.success('Settings saved successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const ToggleSwitch = ({ enabled, onToggle, label, description }) => (
    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-orange-100 hover:border-orange-200 transition-colors">
      <div className="flex-1">
        <h3 className="font-medium text-gray-800">{label}</h3>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
      <button
        onClick={onToggle}
        className={`relative w-14 h-8 rounded-full transition-colors ${enabled ? 'bg-green-500' : 'bg-gray-300'}`}
        data-testid={`toggle-${label.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <motion.div
          className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md"
          animate={{ left: enabled ? '28px' : '4px' }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-saffron" />
      </div>
    );
  }

  return (
    <div className={`pb-24 lg:pb-8 ${isDesktop ? 'px-8' : 'px-4'}`}>
      <div className="pt-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-saffron/10 rounded-xl">
            <Settings className="w-6 h-6 text-saffron" />
          </div>
          <div>
            <h2 className="font-cinzel text-xl font-semibold text-gray-800">App Settings</h2>
            <p className="text-sm text-gray-500">Manage signup options and app configuration</p>
          </div>
        </div>

        {/* Signup Role Settings */}
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-saffron" />
            <h3 className="font-semibold text-gray-800">Public Signup Options</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Control which roles users can select when signing up. Disabled roles can only be created by admin.
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-white/80 rounded-xl border border-orange-100">
              <div className="flex-1">
                <h3 className="font-medium text-gray-800">Devotee Signup</h3>
                <p className="text-sm text-gray-500 mt-1">Always enabled - users can sign up as devotees</p>
              </div>
              <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                Always On
              </div>
            </div>

            <ToggleSwitch
              enabled={settings.enable_priest_signup}
              onToggle={() => handleToggle('enable_priest_signup')}
              label="Priest Signup"
              description="Allow users to register as priests offering services"
            />

            <ToggleSwitch
              enabled={settings.enable_astrologer_signup}
              onToggle={() => handleToggle('enable_astrologer_signup')}
              label="Astrologer Signup"
              description="Allow users to register as astrologers for consultations"
            />

            <ToggleSwitch
              enabled={settings.enable_shop_owner_signup}
              onToggle={() => handleToggle('enable_shop_owner_signup')}
              label="Shop Owner Signup"
              description="Allow users to register as shop owners to sell products"
            />
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800">Admin-Only Roles</h4>
              <p className="text-sm text-blue-700 mt-1">
                When a role is disabled, only admins can create accounts for that role using the 
                "Create User" button in the Users tab. This gives you full control over who joins as a provider.
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <motion.button
          onClick={handleSave}
          disabled={saving}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3 bg-saffron text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-saffron-dark transition-colors"
          data-testid="save-settings-btn"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Settings
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
