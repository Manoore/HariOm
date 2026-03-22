import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Edit2, Save, X, Camera, Loader2, Star, MessageSquare, LogOut,
  Phone, MapPin, Calendar, ChevronRight, Plus, Mail, Settings, CheckCircle
} from 'lucide-react';
import { useAuth } from '../../../../contexts/AuthContext';
import api from '../../../../lib/api';
import { toast } from 'sonner';
import { TestimonialSection } from './ClassesTab';

// AddressAutocomplete placeholder (would need Google Places API)
const AddressAutocomplete = ({ value, onChange, onPlaceSelect, placeholder }) => (
  <input
    type="text"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className="w-full px-4 py-2 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
  />
);

// Nakshatra options
const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu',
  'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta',
  'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula', 'Purva Ashadha',
  'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada',
  'Uttara Bhadrapada', 'Revati'
];

// Gotra options
const GOTRAS = [
  'Bharadwaj', 'Kashyap', 'Vashishtha', 'Vishwamitra', 'Gautam', 'Jamadagni',
  'Atri', 'Agastya', 'Angiras', 'Bhrigu', 'Kanva', 'Kaushik', 'Kaundinya',
  'Parashar', 'Sandilya', 'Shandilya', 'Vatsa', 'Other'
];

function ProfileTab({ isDesktop }) {
  const { user, logout, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    pincode: user?.pincode || '',
    date_of_birth: user?.date_of_birth || '',
    gotra: user?.gotra || '',
    nakshatra: user?.nakshatra || '',
    profile_photo: user?.profile_photo || ''
  });

  useEffect(() => {
    if (user) {
      setEditForm({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        pincode: user.pincode || '',
        date_of_birth: user.date_of_birth || '',
        gotra: user.gotra || '',
        nakshatra: user.nakshatra || '',
        profile_photo: user.profile_photo || ''
      });
    }
  }, [user]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid image (JPEG, PNG, GIF, or WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image too large. Maximum size is 5MB.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/api/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setEditForm({ ...editForm, profile_photo: response.data.url });
      toast.success('Photo uploaded!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await api.put('/api/users/profile', editForm);
      updateUser({ ...user, ...res.data.user });
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`pb-24 lg:pb-8 ${isDesktop ? 'px-8' : 'px-4'}`}>
      <div className="pt-4 pb-6">
        {/* Profile Header */}
        <div className={`${isDesktop ? 'flex items-center justify-between' : ''} mb-6`}>
          <div className={`${isDesktop ? 'flex items-center gap-6' : 'flex items-center gap-4'}`}>
            {/* Profile Photo with Upload */}
            <div className="relative">
              {user?.profile_photo || editForm.profile_photo ? (
                <img 
                  src={editForm.profile_photo || user?.profile_photo} 
                  alt="Profile" 
                  className={`${isDesktop ? 'w-20 h-20' : 'w-16 h-16'} rounded-full object-cover border-2 border-saffron`}
                />
              ) : (
                <div className={`${isDesktop ? 'w-20 h-20' : 'w-16 h-16'} bg-gradient-to-br from-saffron to-gold rounded-full flex items-center justify-center text-white text-2xl lg:text-3xl font-cinzel`}>
                  {user?.name?.charAt(0)}
                </div>
              )}
              {isEditing && (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute -bottom-1 -right-1 w-8 h-8 bg-saffron text-white rounded-full flex items-center justify-center shadow-lg hover:bg-saffron-dark transition-colors"
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                  </button>
                </>
              )}
            </div>
            <div>
              <h1 className="font-cinzel text-xl lg:text-2xl font-bold text-maroon">{user?.name}</h1>
              <div className="flex flex-col gap-1 mt-1">
                {user?.email && (
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Mail className="w-3.5 h-3.5" />
                    <span>{user.email}</span>
                  </div>
                )}
                {user?.phone && (
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{user.phone}</span>
                  </div>
                )}
              </div>
              <span className="inline-block mt-2 text-xs bg-orange-100 text-saffron-dark px-2 py-0.5 rounded-full capitalize">
                {user?.role?.replace('_', ' ')}
              </span>
            </div>
          </div>
          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              className={`${isDesktop ? '' : 'mt-4 w-full'} flex items-center justify-center gap-2 px-4 py-2 bg-saffron text-white rounded-xl hover:bg-saffron-dark transition-colors`}
              data-testid="edit-profile-btn"
            >
              <Settings className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>

        {/* Edit Profile Form */}
        {isEditing && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-orange-100 p-6 mb-6"
          >
            <h2 className="font-cinzel text-lg font-semibold text-maroon mb-4">Edit Profile</h2>
            
            <div className={`grid ${isDesktop ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-saffron focus:border-transparent"
                  placeholder="Your full name"
                  data-testid="profile-name-input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-saffron focus:border-transparent"
                  placeholder="+91 XXXXX XXXXX"
                  data-testid="profile-phone-input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={editForm.date_of_birth}
                  onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })}
                  className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-saffron focus:border-transparent"
                  data-testid="profile-dob-input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gotra</label>
                <input
                  type="text"
                  value={editForm.gotra}
                  onChange={(e) => setEditForm({ ...editForm, gotra: e.target.value })}
                  className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-saffron focus:border-transparent"
                  placeholder="E.g., Bharadwaja, Kashyapa"
                  data-testid="profile-gotra-input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nakshatra</label>
                <select
                  value={editForm.nakshatra}
                  onChange={(e) => setEditForm({ ...editForm, nakshatra: e.target.value })}
                  className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-saffron focus:border-transparent"
                  data-testid="profile-nakshatra-input"
                >
                  <option value="">Select Nakshatra</option>
                  <option value="Ashwini">Ashwini</option>
                  <option value="Bharani">Bharani</option>
                  <option value="Krittika">Krittika</option>
                  <option value="Rohini">Rohini</option>
                  <option value="Mrigashira">Mrigashira</option>
                  <option value="Ardra">Ardra</option>
                  <option value="Punarvasu">Punarvasu</option>
                  <option value="Pushya">Pushya</option>
                  <option value="Ashlesha">Ashlesha</option>
                  <option value="Magha">Magha</option>
                  <option value="Purva Phalguni">Purva Phalguni</option>
                  <option value="Uttara Phalguni">Uttara Phalguni</option>
                  <option value="Hasta">Hasta</option>
                  <option value="Chitra">Chitra</option>
                  <option value="Swati">Swati</option>
                  <option value="Vishakha">Vishakha</option>
                  <option value="Anuradha">Anuradha</option>
                  <option value="Jyeshtha">Jyeshtha</option>
                  <option value="Mula">Mula</option>
                  <option value="Purva Ashadha">Purva Ashadha</option>
                  <option value="Uttara Ashadha">Uttara Ashadha</option>
                  <option value="Shravana">Shravana</option>
                  <option value="Dhanishta">Dhanishta</option>
                  <option value="Shatabhisha">Shatabhisha</option>
                  <option value="Purva Bhadrapada">Purva Bhadrapada</option>
                  <option value="Uttara Bhadrapada">Uttara Bhadrapada</option>
                  <option value="Revati">Revati</option>
                </select>
              </div>
              
              <div className={isDesktop ? 'col-span-2' : ''}>
                <AddressAutocomplete
                  label="City / Location"
                  value={editForm.city}
                  onChange={(value) => setEditForm({ ...editForm, city: value })}
                  onSelect={(placeDetails) => {
                    // Auto-fill city, pincode, and address from selected place
                    setEditForm(prev => ({
                      ...prev,
                      city: placeDetails.city || placeDetails.main_text || prev.city,
                      address: placeDetails.formatted_address || placeDetails.address || prev.address,
                      pincode: prev.pincode // Keep existing pincode as Google doesn't always provide it
                    }));
                  }}
                  placeholder="Search for your city..."
                  testId="profile-city-input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                <input
                  type="text"
                  value={editForm.pincode}
                  onChange={(e) => setEditForm({ ...editForm, pincode: e.target.value })}
                  className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-saffron focus:border-transparent"
                  placeholder="XXXXXX"
                  data-testid="profile-pincode-input"
                />
              </div>
              
              <div className={isDesktop ? 'col-span-2' : ''}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
                <textarea
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-saffron focus:border-transparent resize-none"
                  placeholder="Your complete address (auto-filled from city selection)"
                  data-testid="profile-address-input"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-saffron text-white rounded-xl hover:bg-saffron-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                data-testid="save-profile-btn"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* Profile Details Card (when not editing) */}
        {!isEditing && (user?.phone || user?.gotra || user?.nakshatra || user?.city) && (
          <div className="bg-white rounded-2xl border border-orange-100 p-6 mb-6">
            <h2 className="font-cinzel text-lg font-semibold text-maroon mb-4">Profile Details</h2>
            <div className={`grid ${isDesktop ? 'grid-cols-3' : 'grid-cols-2'} gap-4`}>
              {user?.phone && (
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-gray-800 font-medium">{user.phone}</p>
                </div>
              )}
              {user?.date_of_birth && (
                <div>
                  <p className="text-xs text-gray-500">Date of Birth</p>
                  <p className="text-gray-800 font-medium">{new Date(user.date_of_birth).toLocaleDateString()}</p>
                </div>
              )}
              {user?.gotra && (
                <div>
                  <p className="text-xs text-gray-500">Gotra</p>
                  <p className="text-gray-800 font-medium">{user.gotra}</p>
                </div>
              )}
              {user?.nakshatra && (
                <div>
                  <p className="text-xs text-gray-500">Nakshatra</p>
                  <p className="text-gray-800 font-medium">{user.nakshatra}</p>
                </div>
              )}
              {user?.city && (
                <div>
                  <p className="text-xs text-gray-500">City</p>
                  <p className="text-gray-800 font-medium">{user.city}</p>
                </div>
              )}
              {user?.pincode && (
                <div>
                  <p className="text-xs text-gray-500">Pincode</p>
                  <p className="text-gray-800 font-medium">{user.pincode}</p>
                </div>
              )}
            </div>
            {user?.address && (
              <div className="mt-4">
                <p className="text-xs text-gray-500">Address</p>
                <p className="text-gray-800">{user.address}</p>
              </div>
            )}
          </div>
        )}

        {/* Write a Testimonial Section */}
        <TestimonialSection />

        {/* Actions - Only show on mobile */}
        {!isDesktop && (
          <div className="space-y-3">
            <button 
              onClick={logout}
              className="w-full bg-red-50 rounded-xl p-4 flex items-center justify-center gap-2 text-red-600"
              data-testid="logout-button"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export { ProfileTab };
