import React, { useState } from 'react';
import { Star, Loader2, Edit, Save, X, User } from 'lucide-react';
import api from '../../../../lib/api';
import { toast } from 'sonner';

export function ProfileTab({ profile, user, isDesktop, onUpdate }) {
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
              <span className="text-gray-300">|</span>
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
