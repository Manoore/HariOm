import { Star, Shield, User, Users } from 'lucide-react';

export const ROLE_CONFIG = {
  priest: { label: 'Priest', color: 'bg-maroon', icon: Star },
  admin: { label: 'Admin', color: 'bg-purple-600', icon: Shield },
  devotee: { label: 'Devotee', color: 'bg-saffron', icon: User },
  astrologer: { label: 'Astrologer', color: 'bg-indigo-600', icon: Star },
  shop_owner: { label: 'Shop Owner', color: 'bg-green-600', icon: Users },
};

export const OmIcon = ({ className }) => (
  <img 
    src="/temple-logo.png" 
    alt="Om" 
    className={`${className} object-contain`}
    style={{ filter: 'drop-shadow(0 0 2px rgba(255,153,51,0.5))' }}
  />
);

export const SPECIALIZATIONS = [
  'Vedic Rituals', 'Satyanarayan Pooja', 'Griha Pravesh', 'Navagraha Shanti',
  'Rudrabhishekam', 'Ganesh Pooja', 'Lakshmi Pooja', 'Durga Pooja',
  'Marriage Ceremonies', 'Last Rites', 'Homam/Havan', 'Vastu Shanti',
  'Mundan', 'Naming Ceremony', 'Thread Ceremony', 'Astrology Consultation'
];

export const LANGUAGES = ['Hindi', 'Sanskrit', 'Telugu', 'Tamil', 'Kannada', 'Malayalam', 'Bengali', 'Marathi', 'Gujarati', 'English'];

export const SCHEDULE_FREQUENCIES = [
  { value: 'once', label: 'One Time' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
