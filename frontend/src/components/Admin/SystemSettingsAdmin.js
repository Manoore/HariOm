import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, Save, Loader2, Key, CreditCard, Video, Bell, 
  Palette, Wrench, Shield, Eye, EyeOff, CheckCircle, AlertCircle,
  RefreshCw, ChevronDown, ChevronRight, Flame, Phone, Mail
} from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';

// Category icon mapping
const CategoryIcons = {
  video: Video,
  payment: CreditCard,
  payment_settings: Settings,
  firebase: Flame,
  branding: Palette,
  maintenance: Wrench,
  notifications: Bell,
};

// Single Config Item Component
function ConfigItem({ configKey, config, value, onChange, showValue, onToggleShow }) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (newValue) => {
    setLocalValue(newValue);
    onChange(configKey, newValue);
  };

  // Render different input types
  const renderInput = () => {
    const type = config.type || 'string';
    const options = config.options;

    if (type === 'boolean') {
      return (
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={localValue === true || localValue === 'true'}
            onChange={(e) => handleChange(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
          <span className="ml-3 text-sm text-gray-600">
            {localValue ? 'Enabled' : 'Disabled'}
          </span>
        </label>
      );
    }

    if (options && options.length > 0) {
      return (
        <select
          value={localValue || ''}
          onChange={(e) => handleChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }

    // Text/Password input
    const isMasked = config.sensitive && localValue?.startsWith('****');
    
    return (
      <div className="relative">
        <input
          type={config.sensitive && !showValue ? 'password' : 'text'}
          value={localValue || ''}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={config.sensitive ? '••••••••' : `Enter ${config.label}`}
          className={`w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm ${
            isMasked ? 'text-gray-400 italic' : ''
          }`}
        />
        {config.sensitive && (
          <button
            type="button"
            onClick={() => onToggleShow(configKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showValue ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="py-4 border-b border-gray-100 last:border-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <label className="font-medium text-gray-800 text-sm">{config.label}</label>
            {config.required && <span className="text-red-500 text-xs">*</span>}
            {config.sensitive && (
              <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded">Sensitive</span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">{config.description}</p>
        </div>
        <div className="w-64 flex-shrink-0">
          {renderInput()}
        </div>
      </div>
    </div>
  );
}

// Category Section Component
function CategorySection({ category, categoryInfo, configs, changes, onConfigChange, showValues, onToggleShow }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const Icon = CategoryIcons[category] || Settings;
  
  const configEntries = Object.entries(configs);
  const hasChanges = configEntries.some(([key]) => changes[key] !== undefined);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 mb-4 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <Icon className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-800">{categoryInfo.label}</h3>
            <p className="text-xs text-gray-500">{categoryInfo.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <span className="bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full">Modified</span>
          )}
          {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
        </div>
      </button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-6 pb-4">
              {configEntries.map(([key, config]) => (
                <ConfigItem
                  key={key}
                  configKey={key}
                  config={config}
                  value={changes[key] !== undefined ? changes[key] : config.value}
                  onChange={onConfigChange}
                  showValue={showValues[key]}
                  onToggleShow={onToggleShow}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Main System Settings Admin Component
export default function SystemSettingsAdmin() {
  const [config, setConfig] = useState(null);
  const [categories, setCategories] = useState(null);
  const [changes, setChanges] = useState({});
  const [showValues, setShowValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const res = await api.get('/api/admin/system-config');
      setConfig(res.data.config);
      setCategories(res.data.categories);
      setChanges({});
    } catch (error) {
      toast.error('Failed to load system configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (key, value) => {
    setChanges(prev => ({ ...prev, [key]: value }));
  };

  const toggleShowValue = (key) => {
    setShowValues(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    if (Object.keys(changes).length === 0) {
      toast.info('No changes to save');
      return;
    }

    setSaving(true);
    try {
      await api.put('/api/admin/system-config', changes);
      toast.success('Configuration saved successfully!');
      await loadConfig(); // Reload to get updated values
    } catch (error) {
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setChanges({});
    toast.info('Changes discarded');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  // Group configs by category
  const configsByCategory = {};
  if (config) {
    Object.entries(config).forEach(([key, cfg]) => {
      const cat = cfg.category || 'general';
      if (!configsByCategory[cat]) {
        configsByCategory[cat] = {};
      }
      configsByCategory[cat][key] = cfg;
    });
  }

  const hasChanges = Object.keys(changes).length > 0;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <Key className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">System Settings</h1>
            <p className="text-gray-500 text-sm">Manage API keys, app settings, and configurations</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={loadConfig}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          
          {hasChanges && (
            <button
              onClick={handleReset}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl text-sm font-medium transition-colors"
            >
              Discard
            </button>
          )}
          
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
              hasChanges
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            data-testid="save-config-btn"
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

      {/* Unsaved Changes Warning */}
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
          <p className="text-yellow-700 text-sm">
            You have <strong>{Object.keys(changes).length}</strong> unsaved change(s). Click "Save Changes" to apply.
          </p>
        </motion.div>
      )}

      {/* Security Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-center gap-3">
        <Shield className="w-5 h-5 text-blue-600 flex-shrink-0" />
        <p className="text-blue-700 text-sm">
          Sensitive values (API keys, secrets) are encrypted before storage. Values shown with **** have not been changed.
        </p>
      </div>

      {/* Config Sections */}
      {categories && Object.entries(categories).map(([category, categoryInfo]) => {
        const categoryConfigs = configsByCategory[category];
        if (!categoryConfigs || Object.keys(categoryConfigs).length === 0) return null;
        
        return (
          <CategorySection
            key={category}
            category={category}
            categoryInfo={categoryInfo}
            configs={categoryConfigs}
            changes={changes}
            onConfigChange={handleConfigChange}
            showValues={showValues}
            onToggleShow={toggleShowValue}
          />
        );
      })}
    </div>
  );
}
