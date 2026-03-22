import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// Custom Om Icon component for Home tab in sidebar (uses temple logo)
export const OmIcon = ({ className }) => (
  <img 
    src="/temple-logo.png" 
    alt="Om" 
    className={`${className} object-contain`}
    style={{ filter: 'drop-shadow(0 0 2px rgba(255,153,51,0.5))' }}
  />
);

// 3D Animated Devotional SVG Icons
export const BellIcon3D = ({ size = "w-8 h-8" }) => (
  <motion.svg viewBox="0 0 100 100" className={size} animate={{ rotate: [-3, 3, -3] }} transition={{ duration: 0.4, repeat: Infinity }}>
    <defs>
      <linearGradient id="bellGradD" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFD700" />
        <stop offset="100%" stopColor="#CD853F" />
      </linearGradient>
    </defs>
    <ellipse cx="50" cy="15" rx="5" ry="5" fill="#B8860B" />
    <path d="M45 15 L45 25 Q30 35 30 60 L70 60 Q70 35 55 25 L55 15" fill="url(#bellGradD)" />
    <ellipse cx="50" cy="60" rx="22" ry="8" fill="#CD853F" />
    <circle cx="50" cy="70" r="6" fill="#B8860B" />
  </motion.svg>
);

export const ZodiacIcon3D = ({ size = "w-8 h-8" }) => (
  <motion.svg viewBox="0 0 100 100" className={size} animate={{ rotate: [0, 360] }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }}>
    <defs>
      <linearGradient id="zodiacGradD" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4B0082" />
        <stop offset="100%" stopColor="#9400D3" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="35" fill="none" stroke="url(#zodiacGradD)" strokeWidth="3" />
    <circle cx="50" cy="50" r="25" fill="none" stroke="#FFD700" strokeWidth="1" strokeDasharray="4 4" />
    <circle cx="50" cy="18" r="4" fill="#FFD700" />
    <circle cx="82" cy="50" r="4" fill="#FFD700" />
    <circle cx="50" cy="82" r="4" fill="#FFD700" />
    <circle cx="18" cy="50" r="4" fill="#FFD700" />
    <circle cx="50" cy="50" r="6" fill="#4B0082" />
  </motion.svg>
);

export const TempleIcon3D = ({ size = "w-8 h-8" }) => (
  <motion.svg viewBox="0 0 100 100" className={size} animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity }}>
    <defs>
      <linearGradient id="templeGradD" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#DEB887" />
        <stop offset="100%" stopColor="#CD853F" />
      </linearGradient>
      <linearGradient id="roofGradD" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFD700" />
        <stop offset="100%" stopColor="#B8860B" />
      </linearGradient>
    </defs>
    <rect x="20" y="65" width="60" height="30" fill="url(#templeGradD)" />
    <rect x="28" y="45" width="44" height="20" fill="url(#templeGradD)" />
    <polygon points="50,10 78,45 22,45" fill="url(#roofGradD)" />
    <circle cx="50" cy="28" r="5" fill="#FFD700" />
    <rect x="40" y="70" width="20" height="25" fill="#4A3728" />
  </motion.svg>
);

export const CartIcon3D = ({ size = "w-8 h-8" }) => (
  <motion.svg viewBox="0 0 100 100" className={size} animate={{ y: [0, -3, 0] }} transition={{ duration: 2, repeat: Infinity }}>
    <defs>
      <linearGradient id="cartGradD" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#DEB887" />
        <stop offset="100%" stopColor="#8B4513" />
      </linearGradient>
    </defs>
    <path d="M20 35 L30 75 L70 75 L80 35 Z" fill="url(#cartGradD)" stroke="#8B4513" strokeWidth="2" />
    <path d="M25 45 L75 45 M27 55 L73 55 M29 65 L71 65" stroke="#A0522D" strokeWidth="2" fill="none" />
    <ellipse cx="35" cy="28" rx="6" ry="8" fill="#FF6347" />
    <ellipse cx="50" cy="26" rx="5" ry="7" fill="#FFD700" />
    <ellipse cx="65" cy="28" rx="6" ry="8" fill="#32CD32" />
  </motion.svg>
);

// Check if desktop hook
export const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isDesktop;
};
