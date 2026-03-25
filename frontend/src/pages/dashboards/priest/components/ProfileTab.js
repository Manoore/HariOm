import React, { useState, useEffect, useRef } from 'react';
import { User, Edit, Save, X, Camera, Loader2, MapPin, Phone, Mail, Award, Building2, ChevronDown } from 'lucide-react';
import api from '../../../../lib/api';
import { toast } from 'sonner';
import AddressAutocomplete from '../../../../components/AddressAutocomplete';
import { SPECIALIZATIONS, LANGUAGES } from './shared';

function ProfileTab({ profile, user, onRefresh }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [specializations, setSpecializations] = useState([]);
  const [mathMuttOptions, setMathMuttOptions] = useState([]);
  const [mathMuttCategories, setMathMuttCategories] = useState({});
  const [formData, setFormData] = useState({
    bio: profile?.bio || '',
    experience_years: profile?.experience_years || 5,
    specializations: profile?.specializations || [],
    languages: profile?.languages || ['Hindi', 'Sanskrit'],
    base_price: profile?.base_price || 1100,
    work_locations: profile?.work_locations || [],
    phone: user?.phone || '',
    email: user?.email || '',
    profile_photo: profile?.profile_photo || '',
    temple_affiliation: profile?.temple_affiliation || '',
    math_mutt: profile?.math_mutt || '',
    math_mutt_other: profile?.math_mutt_other || '',
    subcaste: profile?.subcaste || ''
  });
  const [subcasteOptions, setSubcasteOptions] = useState([]);
  const [newLocation, setNewLocation] = useState('');

  // Fetch specializations (puja types) from API
  useEffect(() => {
    const fetchSpecializations = async () => {
      try {
        const res = await api.get('/api/puja-types');
        const pujaNames = (res.data.puja_types || []).map(p => p.name);
        setSpecializations(pujaNames.length > 0 ? pujaNames : SPECIALIZATIONS);
      } catch (error) {
        // Fallback to hardcoded if API fails
        setSpecializations(SPECIALIZATIONS);
      }
    };
    fetchSpecializations();
  }, []);

  // Fetch Math/Mutt options from API
  useEffect(() => {
    const fetchMathMutt = async () => {
      try {
        const res = await api.get('/api/math-mutt');
        setMathMuttOptions(res.data.math_mutts || []);
        setMathMuttCategories(res.data.categories || {});
      } catch (error) {
        console.error('Failed to load Math/Mutt options:', error);
      }
    };
    fetchMathMutt();
  }, []);

  // Fetch Subcaste options from API
  useEffect(() => {
    const fetchSubcastes = async () => {
      try {
        const res = await api.get('/api/subcastes');
        setSubcasteOptions(res.data.subcastes || []);
      } catch (error) {
        console.error('Failed to load subcaste options:', error);
      }
    };
    fetchSubcastes();
  }, []);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // For now, we'll use a URL-based approach
    // In production, you'd upload to cloud storage
    const reader = new FileReader();
    reader.onloadend = async () => {
      setUploading(true);
      try {
        // Store as base64 or upload to server
        const base64 = reader.result;
        setFormData({ ...formData, profile_photo: base64 });
        toast.success('Photo updated! Click Save to apply.');
      } catch (error) {
        toast.error('Failed to upload photo');
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleSpecialization = (spec) => {
    if (formData.specializations.includes(spec)) {
      setFormData({ ...formData, specializations: formData.specializations.filter(s => s !== spec) });
    } else {
      setFormData({ ...formData, specializations: [...formData.specializations, spec] });
    }
  };

  const toggleLanguage = (lang) => {
    if (formData.languages.includes(lang)) {
      setFormData({ ...formData, languages: formData.languages.filter(l => l !== lang) });
    } else {
      setFormData({ ...formData, languages: [...formData.languages, lang] });
    }
  };

  const addWorkLocation = () => {
    if (newLocation.trim() && !formData.work_locations.includes(newLocation.trim())) {
      setFormData({ ...formData, work_locations: [...formData.work_locations, newLocation.trim()] });
      setNewLocation('');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/api/priest/profile', formData);
      toast.success('Profile updated!');
      setEditing(false);
      onRefresh();
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-cinzel text-lg md:text-xl font-semibold text-maroon">My Profile</h2>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 bg-saffron text-white px-3 md:px-4 py-2 rounded-lg text-sm"
          >
            <Edit className="w-4 h-4" /> Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm disabled:opacity-50 flex items-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
          </div>
        )}
      </div>

      {/* Profile Photo Section */}
      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
        <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6">
          <div className="relative">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-saffron to-gold flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
              {formData.profile_photo ? (
                <img src={formData.profile_photo} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl md:text-4xl font-bold text-white">{user?.name?.charAt(0) || 'P'}</span>
              )}
            </div>
            {editing && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-0 right-0 w-8 h-8 md:w-9 md:h-9 bg-saffron rounded-full flex items-center justify-center text-white shadow-md hover:bg-saffron-dark"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                </button>
              </>
            )}
          </div>
          <div className="text-center sm:text-left">
            <h3 className="font-cinzel text-lg md:text-xl font-bold text-maroon">{user?.name}</h3>
            <div className="flex flex-col gap-1 mt-1">
              {user?.email && (
                <div className="flex items-center justify-center sm:justify-start gap-2 text-gray-500 text-sm">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{user.email}</span>
                </div>
              )}
              {user?.phone && (
                <div className="flex items-center justify-center sm:justify-start gap-2 text-gray-500 text-sm">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{user.phone}</span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
              <Star className="w-4 h-4 text-gold fill-gold" />
              <span className="text-sm text-gray-600">4.8 rating</span>
              <span className="text-gray-400">•</span>
              <span className="text-sm text-gray-600">{formData.experience_years} years exp.</span>
            </div>
            {profile?.is_verified && (
              <div className="flex items-center justify-center sm:justify-start gap-1 mt-2 text-green-600">
                <Award className="w-4 h-4" />
                <span className="text-sm font-medium">Verified Priest</span>
              </div>
            )}
            {editing && (
              <p className="text-xs text-gray-400 mt-2">Click camera to upload photo</p>
            )}
          </div>
        </div>
      </div>

      {/* Bio */}
      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
        <h3 className="font-semibold text-gray-800 mb-3">About Me</h3>
        {editing ? (
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            placeholder="Write about yourself..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
          />
        ) : (
          <p className="text-gray-600 text-sm md:text-base">{formData.bio || 'No bio added yet.'}</p>
        )}
      </div>

      {/* Specializations - Dropdown Multi-Select */}
      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
        <h3 className="font-semibold text-gray-800 mb-3">Specializations</h3>
        
        {editing ? (
          <div className="space-y-3">
            {/* Dropdown Select */}
            <div className="relative">
              <select
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron text-sm appearance-none bg-white"
                onChange={(e) => {
                  if (e.target.value && !formData.specializations.includes(e.target.value)) {
                    setFormData({ ...formData, specializations: [...formData.specializations, e.target.value] });
                  }
                  e.target.value = '';
                }}
                defaultValue=""
              >
                <option value="" disabled>+ Add a specialization...</option>
                {specializations
                  .filter(spec => !formData.specializations.includes(spec))
                  .map((spec) => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
            
            {/* Selected Specializations */}
            {formData.specializations.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.specializations.map((spec) => (
                  <span
                    key={spec}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-saffron text-white rounded-full text-xs md:text-sm"
                  >
                    {spec}
                    <button
                      onClick={() => toggleSpecialization(spec)}
                      className="hover:bg-white/20 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            
            <p className="text-xs text-gray-500">
              {formData.specializations.length} selected • Select from dropdown to add more
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {formData.specializations.length > 0 ? (
              formData.specializations.map((spec) => (
                <span
                  key={spec}
                  className="px-3 py-1.5 bg-saffron/10 text-saffron rounded-full text-xs md:text-sm font-medium"
                >
                  {spec}
                </span>
              ))
            ) : (
              <p className="text-gray-400 text-sm">No specializations added yet</p>
            )}
          </div>
        )}
      </div>

      {/* Languages */}
      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
        <h3 className="font-semibold text-gray-800 mb-3">Languages</h3>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang}
              onClick={() => editing && toggleLanguage(lang)}
              disabled={!editing}
              className={`px-3 py-1.5 rounded-full text-xs md:text-sm transition-colors ${
                formData.languages.includes(lang)
                  ? 'bg-blue-500 text-white'
                  : editing ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-gray-100 text-gray-400'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      {/* Work Locations */}
      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
        <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-saffron" />
          Work Locations
        </h3>
        <p className="text-xs text-gray-500 mb-3">Areas where you can provide services</p>
        
        {editing && (
          <div className="flex gap-2 mb-3">
            <div className="flex-1">
              <AddressAutocomplete
                value={newLocation}
                onChange={(value) => setNewLocation(value)}
                onSelect={(placeDetails) => {
                  const locationName = placeDetails.main_text || placeDetails.city || placeDetails.address;
                  if (locationName && !formData.work_locations.includes(locationName)) {
                    setFormData({ ...formData, work_locations: [...formData.work_locations, locationName] });
                    setNewLocation('');
                  }
                }}
                placeholder="Search for city or area..."
                inputClassName="!py-2 text-sm"
                testId="priest-work-location"
              />
            </div>
            <button onClick={addWorkLocation} className="px-3 py-2 bg-saffron text-white rounded-lg h-fit mt-auto">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {formData.work_locations.length === 0 ? (
            <p className="text-gray-400 text-sm">No locations added</p>
          ) : (
            formData.work_locations.map((loc, i) => (
              <div key={i} className="flex items-center gap-1 bg-orange-100 text-orange-700 px-3 py-1.5 rounded-full text-sm">
                <MapPin className="w-3 h-3" />
                {loc}
                {editing && (
                  <button onClick={() => setFormData({ ...formData, work_locations: formData.work_locations.filter(l => l !== loc) })}>
                    <X className="w-3 h-3 ml-1 hover:text-red-500" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Temple Affiliation */}
      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
        <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-saffron" />
          Temple Affiliation
        </h3>
        <p className="text-xs text-gray-500 mb-3">If you work at or are affiliated with a temple, mention it here</p>
        
        {editing ? (
          <input
            type="text"
            value={formData.temple_affiliation}
            onChange={(e) => setFormData({ ...formData, temple_affiliation: e.target.value })}
            placeholder="e.g., ISKCON Temple, Tirupati, Sri Venkateswara Temple"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
            data-testid="priest-temple-affiliation"
          />
        ) : (
          <p className="text-gray-600 text-sm md:text-base">
            {formData.temple_affiliation || 'No temple affiliation added'}
          </p>
        )}
      </div>

      {/* Math/Mutt Affiliation */}
      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
        <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
          <Award className="w-5 h-5 text-saffron" />
          Math/Mutt Affiliation
        </h3>
        <p className="text-xs text-gray-500 mb-3">Select the Math/Mutt you belong to (if applicable)</p>
        
        {editing ? (
          <div className="space-y-3">
            <select
              value={formData.math_mutt}
              onChange={(e) => setFormData({ ...formData, math_mutt: e.target.value, math_mutt_other: e.target.value === 'Other' ? formData.math_mutt_other : '' })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
              data-testid="priest-math-mutt"
            >
              <option value="">-- Select Math/Mutt --</option>
              {Object.entries(mathMuttCategories).map(([category, mutts]) => (
                <optgroup key={category} label={category}>
                  {mutts.map((mutt, idx) => (
                    <option key={idx} value={typeof mutt === 'string' ? mutt : mutt.name}>{typeof mutt === 'string' ? mutt : mutt.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            
            {formData.math_mutt === 'Other' && (
              <input
                type="text"
                value={formData.math_mutt_other}
                onChange={(e) => setFormData({ ...formData, math_mutt_other: e.target.value })}
                placeholder="Enter your Math/Mutt name"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
                data-testid="priest-math-mutt-other"
              />
            )}
          </div>
        ) : (
          <p className="text-gray-600 text-sm md:text-base">
            {formData.math_mutt === 'Other' && formData.math_mutt_other 
              ? formData.math_mutt_other 
              : formData.math_mutt || 'No Math/Mutt affiliation added'}
          </p>
        )}
      </div>

      {/* Subcaste */}
      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
        <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
          <Award className="w-5 h-5 text-saffron" />
          Subcaste
        </h3>
        <p className="text-xs text-gray-500 mb-3">Select your subcaste (if applicable)</p>
        
        {editing ? (
          <select
            value={formData.subcaste}
            onChange={(e) => setFormData({ ...formData, subcaste: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
            data-testid="priest-subcaste"
          >
            <option value="">-- Select Subcaste --</option>
            {subcasteOptions.map((sc, idx) => (
              <option key={idx} value={sc}>{sc}</option>
            ))}
          </select>
        ) : (
          <p className="text-gray-600 text-sm md:text-base">
            {formData.subcaste || 'No subcaste selected'}
          </p>
        )}
      </div>

      {/* Contact & Pricing */}
      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Contact & Pricing</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Phone</label>
            {editing ? (
              <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            ) : (
              <p className="text-sm text-gray-800">{formData.phone || 'Not provided'}</p>
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Experience</label>
            {editing ? (
              <input type="number" value={formData.experience_years} onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            ) : (
              <p className="text-sm text-gray-800">{formData.experience_years} years</p>
            )}
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-gray-500 mb-1">Base Price (₹)</label>
            {editing ? (
              <input type="number" value={formData.base_price} onChange={(e) => setFormData({ ...formData, base_price: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            ) : (
              <p className="text-lg font-bold text-saffron">₹{formData.base_price}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


export { ProfileTab };
