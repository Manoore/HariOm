import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save, Loader2, Users, Shield, Clock, IndianRupee, Plus, Trash2 } from 'lucide-react';
import api from '../../../../lib/api';
import { toast } from 'sonner';

export function SettingsTab({ isDesktop }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [settings, setSettings] = useState({
    enable_priest_signup: true,
    enable_astrologer_signup: false,
    enable_shop_owner_signup: false
  });
  const [policyRules, setPolicyRules] = useState([
    { min_hours: 24, max_hours: null, refund_percent: 100, label: 'More than 24 hours before' },
    { min_hours: 0, max_hours: 24, refund_percent: 50, label: 'Within 24 hours' },
    { min_hours: null, max_hours: 0, refund_percent: 0, label: 'After booking time' },
  ]);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [settingsRes, policyRes] = await Promise.all([
        api.get('/api/admin/signup-settings').catch(() => null),
        api.get('/api/admin/cancellation-policy').catch(() => null),
      ]);
      if (settingsRes?.data?.settings) {
        setSettings(settingsRes.data.settings);
      }
      if (policyRes?.data?.rules) {
        setPolicyRules(policyRes.data.rules);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveSignup = async () => {
    setSaving(true);
    try {
      await api.put('/api/admin/signup-settings', settings);
      toast.success('Signup settings saved!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePolicy = async () => {
    setSavingPolicy(true);
    try {
      await api.put('/api/admin/cancellation-policy', { rules: policyRules });
      toast.success('Cancellation policy saved!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save policy');
    } finally {
      setSavingPolicy(false);
    }
  };

  const updateRule = (index, field, value) => {
    const updated = [...policyRules];
    updated[index] = { ...updated[index], [field]: value };
    setPolicyRules(updated);
  };

  const addRule = () => {
    setPolicyRules([
      ...policyRules.slice(0, -1),
      { min_hours: 0, max_hours: policyRules.length > 1 ? policyRules[policyRules.length - 2]?.min_hours || 12 : 12, refund_percent: 25, label: '' },
      policyRules[policyRules.length - 1],
    ]);
  };

  const removeRule = (index) => {
    if (policyRules.length <= 2) {
      toast.error('Need at least 2 rules');
      return;
    }
    setPolicyRules(policyRules.filter((_, i) => i !== index));
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
            <p className="text-sm text-gray-500">Manage signup options, cancellation policy & app configuration</p>
          </div>
        </div>

        {/* ==================== SIGNUP SETTINGS ==================== */}
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

          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800">Admin-Only Roles</h4>
                <p className="text-sm text-blue-700 mt-1">
                  When a role is disabled, only admins can create accounts for that role.
                </p>
              </div>
            </div>
          </div>

          <motion.button
            onClick={handleSaveSignup}
            disabled={saving}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full mt-4 py-3 bg-saffron text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-orange-600 transition-colors"
            data-testid="save-signup-settings-btn"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? 'Saving...' : 'Save Signup Settings'}
          </motion.button>
        </div>

        {/* ==================== CANCELLATION POLICY ==================== */}
        <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold text-gray-800">Booking Cancellation Policy</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Configure refund rules based on how many hours before the booking a cancellation occurs. Rules are matched top-to-bottom.
          </p>

          <div className="space-y-3 mb-4">
            {policyRules.map((rule, index) => {
              const isLast = index === policyRules.length - 1;
              const isFirst = index === 0;
              return (
                <div key={index} className="bg-white rounded-xl p-4 border border-orange-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">
                      Rule {index + 1}
                    </span>
                    {!isFirst && !isLast && (
                      <button
                        onClick={() => removeRule(index)}
                        className="text-red-400 hover:text-red-600 p-1"
                        data-testid={`remove-rule-${index}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {/* Hours threshold */}
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">
                        {isFirst ? 'More than (hours)' : isLast ? 'Condition' : 'From (hours)'}
                      </label>
                      {isLast ? (
                        <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-600">
                          After booking time
                        </div>
                      ) : (
                        <input
                          type="number"
                          value={rule.min_hours ?? ''}
                          onChange={(e) => updateRule(index, 'min_hours', e.target.value === '' ? null : parseInt(e.target.value))}
                          min={0}
                          className="w-full px-3 py-2 rounded-lg border border-orange-100 focus:ring-2 focus:ring-saffron/50 focus:border-saffron outline-none text-sm"
                          placeholder="hrs"
                        />
                      )}
                    </div>

                    {/* Max hours (for middle rules) */}
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">
                        {isFirst ? 'Condition' : isLast ? '' : 'To (hours)'}
                      </label>
                      {isFirst ? (
                        <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-600">
                          No upper limit
                        </div>
                      ) : isLast ? (
                        <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-400">
                          —
                        </div>
                      ) : (
                        <input
                          type="number"
                          value={rule.max_hours ?? ''}
                          onChange={(e) => updateRule(index, 'max_hours', e.target.value === '' ? null : parseInt(e.target.value))}
                          min={0}
                          className="w-full px-3 py-2 rounded-lg border border-orange-100 focus:ring-2 focus:ring-saffron/50 focus:border-saffron outline-none text-sm"
                          placeholder="hrs"
                        />
                      )}
                    </div>

                    {/* Refund Percentage */}
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Refund %</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={rule.refund_percent}
                          onChange={(e) => updateRule(index, 'refund_percent', Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                          min={0}
                          max={100}
                          className="w-full px-3 py-2 rounded-lg border border-orange-100 focus:ring-2 focus:ring-saffron/50 focus:border-saffron outline-none text-sm pr-8"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Visual summary */}
                  <div className={`mt-2 text-xs px-2 py-1 rounded-full inline-block ${
                    rule.refund_percent === 100 ? 'bg-green-100 text-green-700' :
                    rule.refund_percent > 0 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {isFirst && `Cancel >${rule.min_hours}h before → ${rule.refund_percent}% refund`}
                    {!isFirst && !isLast && `Cancel ${rule.min_hours}-${rule.max_hours}h before → ${rule.refund_percent}% refund`}
                    {isLast && `Cancel after booking time → ${rule.refund_percent}% refund`}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Rule Button */}
          <button
            onClick={addRule}
            className="w-full py-2.5 border-2 border-dashed border-orange-200 rounded-xl text-sm text-saffron font-medium hover:border-saffron hover:bg-orange-50 transition-colors flex items-center justify-center gap-2 mb-4"
            data-testid="add-rule-btn"
          >
            <Plus className="w-4 h-4" /> Add Time Bracket
          </button>

          {/* Policy Preview */}
          <div className="bg-white rounded-xl p-4 border border-orange-100 mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-saffron" /> Policy Preview
            </h4>
            <div className="space-y-2">
              {policyRules.map((rule, i) => {
                const isFirst = i === 0;
                const isLast = i === policyRules.length - 1;
                return (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <div className={`w-2 h-2 rounded-full ${
                      rule.refund_percent === 100 ? 'bg-green-500' :
                      rule.refund_percent > 0 ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <span className="text-gray-600">
                      {isFirst && `More than ${rule.min_hours} hours before booking`}
                      {!isFirst && !isLast && `${rule.min_hours} to ${rule.max_hours} hours before booking`}
                      {isLast && 'After booking time has passed'}
                    </span>
                    <span className="ml-auto font-semibold">
                      <span className={
                        rule.refund_percent === 100 ? 'text-green-600' :
                        rule.refund_percent > 0 ? 'text-yellow-600' : 'text-red-600'
                      }>{rule.refund_percent}%</span> refund
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <motion.button
            onClick={handleSavePolicy}
            disabled={savingPolicy}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 bg-red-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-red-600 transition-colors"
            data-testid="save-policy-btn"
          >
            {savingPolicy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {savingPolicy ? 'Saving...' : 'Save Cancellation Policy'}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
