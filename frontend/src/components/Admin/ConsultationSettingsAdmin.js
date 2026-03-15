import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, Save, Loader2, Wallet, Clock, Gift, 
  Percent, AlertCircle, CheckCircle, RefreshCw
} from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';

export default function ConsultationSettingsAdmin() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await api.get('/api/admin/consultation-settings');
      setSettings(res.data);
      setHasChanges(false);
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put('/api/admin/consultation-settings', settings);
      setSettings(res.data);
      setHasChanges(false);
      toast.success('Settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <Settings className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Consultation Settings</h1>
            <p className="text-gray-500 text-sm">Manage video consultation and wallet settings</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={loadSettings}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
              hasChanges
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            data-testid="save-settings-btn"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            Save Changes
          </button>
        </div>
      </div>

      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <p className="text-yellow-700 text-sm">You have unsaved changes. Click "Save Changes" to apply.</p>
        </motion.div>
      )}

      {/* Wallet Settings */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Wallet className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-semibold text-gray-800">Wallet Settings</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Minimum Recharge */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Recharge Amount (₹)
            </label>
            <input
              type="number"
              value={settings?.min_recharge_amount || 100}
              onChange={e => handleChange('min_recharge_amount', parseInt(e.target.value) || 0)}
              min={1}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              data-testid="min-recharge-input"
            />
            <p className="text-xs text-gray-500 mt-1">Minimum amount users must recharge</p>
          </div>

          {/* Low Balance Warning */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Low Balance Warning (₹)
            </label>
            <input
              type="number"
              value={settings?.low_balance_warning || 20}
              onChange={e => handleChange('low_balance_warning', parseInt(e.target.value) || 0)}
              min={1}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              data-testid="low-balance-input"
            />
            <p className="text-xs text-gray-500 mt-1">Show warning when balance drops below this</p>
          </div>
        </div>
      </div>

      {/* Call Settings */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-semibold text-gray-800">Call Settings</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Grace Period */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grace Period (seconds)
            </label>
            <input
              type="number"
              value={settings?.grace_period_seconds || 30}
              onChange={e => handleChange('grace_period_seconds', parseInt(e.target.value) || 0)}
              min={0}
              max={120}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              data-testid="grace-period-input"
            />
            <p className="text-xs text-gray-500 mt-1">Time to recharge before call disconnects (0 = instant)</p>
          </div>

          {/* Platform Commission */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Platform Commission (%)
            </label>
            <div className="relative">
              <input
                type="number"
                value={settings?.platform_commission_percent || 20}
                onChange={e => handleChange('platform_commission_percent', Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                min={0}
                max={100}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                data-testid="commission-input"
              />
              <Percent className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Astrologer gets {100 - (settings?.platform_commission_percent || 20)}% of consultation fees
            </p>
          </div>
        </div>
      </div>

      {/* Promotional Settings */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Gift className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-semibold text-gray-800">Promotional Settings</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Free Minutes Enabled */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Free Minutes for New Users
            </label>
            <div className="flex items-center gap-4">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings?.free_minutes_enabled || false}
                  onChange={e => handleChange('free_minutes_enabled', e.target.checked)}
                  className="sr-only peer"
                  data-testid="free-minutes-toggle"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
              <span className={`text-sm ${settings?.free_minutes_enabled ? 'text-green-600' : 'text-gray-500'}`}>
                {settings?.free_minutes_enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>

          {/* Free Minutes Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Free Minutes Amount
            </label>
            <input
              type="number"
              value={settings?.free_minutes_new_users || 5}
              onChange={e => handleChange('free_minutes_new_users', parseInt(e.target.value) || 0)}
              min={0}
              disabled={!settings?.free_minutes_enabled}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-50 disabled:text-gray-400"
              data-testid="free-minutes-input"
            />
            <p className="text-xs text-gray-500 mt-1">Free minutes given to new users on signup</p>
          </div>

          {/* Referral Bonus */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Referral Bonus Minutes
            </label>
            <input
              type="number"
              value={settings?.referral_bonus_minutes || 2}
              onChange={e => handleChange('referral_bonus_minutes', parseInt(e.target.value) || 0)}
              min={0}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              data-testid="referral-bonus-input"
            />
            <p className="text-xs text-gray-500 mt-1">Free minutes for successful referrals (future feature)</p>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="mt-6 bg-purple-50 border border-purple-100 rounded-2xl p-6">
        <h3 className="font-semibold text-purple-800 mb-3">Current Configuration Summary</h3>
        <div className="grid gap-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-purple-700">Min. Recharge:</span>
            <span className="font-medium text-purple-900">₹{settings?.min_recharge_amount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-purple-700">Low Balance Warning:</span>
            <span className="font-medium text-purple-900">₹{settings?.low_balance_warning}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-purple-700">Grace Period:</span>
            <span className="font-medium text-purple-900">{settings?.grace_period_seconds}s</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-purple-700">Platform Commission:</span>
            <span className="font-medium text-purple-900">{settings?.platform_commission_percent}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-purple-700">Free Minutes (New Users):</span>
            <span className="font-medium text-purple-900">
              {settings?.free_minutes_enabled ? `${settings?.free_minutes_new_users} mins` : 'Disabled'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
