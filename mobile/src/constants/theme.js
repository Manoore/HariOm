// Divine App Theme - Matching Web App Colors
export const COLORS = {
  // Primary Colors
  saffron: '#FF9933',
  saffronLight: '#FFB366',
  saffronDark: '#CC7000',
  
  // Secondary Colors
  maroon: '#800000',
  maroonLight: '#A52A2A',
  maroonDark: '#500000',
  
  // Accent Colors
  gold: '#FFD700',
  goldLight: '#FFE44D',
  goldDark: '#B8860B',
  
  // Background Colors
  cream: '#FFFDD0',
  parchment: '#FFFAF0',
  
  // Cosmic Theme (for Astrology)
  cosmicBg: '#0F172A',
  cosmicSurface: '#1E293B',
  cosmicText: '#F8FAFC',
  cosmicAccent: '#818CF8',
  
  // Neutral Colors
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  
  // Status Colors
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  
  // Transparent
  transparent: 'transparent',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(255, 255, 255, 0.5)',
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  semiBold: 'System',
  bold: 'System',
  // Will be replaced with custom fonts
  cinzel: 'System', // Serif font for headings
  manrope: 'System', // Sans-serif for body
};

export const SIZES = {
  // Global sizes
  base: 8,
  font: 14,
  radius: 12,
  padding: 16,
  
  // Font sizes
  largeTitle: 40,
  h1: 32,
  h2: 24,
  h3: 20,
  h4: 18,
  h5: 16,
  body: 14,
  caption: 12,
  small: 10,
  
  // App dimensions
  width: null,
  height: null,
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const GRADIENTS = {
  saffron: ['#FF9933', '#CC7000'],
  gold: ['#FFD700', '#B8860B'],
  maroon: ['#800000', '#500000'],
  cosmic: ['#0F172A', '#1E293B'],
  sunrise: ['#FF9933', '#FFD700'],
  divine: ['#FF9933', '#FFD700', '#FF9933'],
};

export default {
  COLORS,
  FONTS,
  SIZES,
  SHADOWS,
  GRADIENTS,
};
