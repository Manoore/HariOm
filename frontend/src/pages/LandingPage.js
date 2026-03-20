import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Star, Calendar, ShoppingBag, Sun, ChevronRight, Users, Award, Clock, 
  ArrowRight, Check, Play, Quote, MapPin, Phone, Mail, Send, MessageSquare,
  Facebook, Twitter, Instagram, Youtube, ChevronDown, Menu, X, ChevronLeft
} from 'lucide-react';
import api from '../lib/api';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../components/LanguageSelector';

// Scroll to top function
const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Divine/Spiritual images for carousel
const CAROUSEL_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1750405704388-1416715c359c?w=1920&q=80',
    title: 'Sacred Temple Shrine',
    subtitle: 'Experience divine blessings'
  },
  {
    url: 'https://images.unsplash.com/photo-1765873042338-5276f5eb54d0?w=1920&q=80',
    title: 'Traditional Puja Ceremony',
    subtitle: 'Connect with ancient rituals'
  },
  {
    url: 'https://images.unsplash.com/photo-1757308530438-4e2340a6475f?w=1920&q=80',
    title: 'Sacred Aarti Flames',
    subtitle: 'Illuminate your spiritual path'
  },
  {
    url: 'https://images.unsplash.com/photo-1734455937991-01f528d6b633?w=1920&q=80',
    title: 'Golden Temple Architecture',
    subtitle: 'Discover sacred places'
  },
  {
    url: 'https://images.unsplash.com/photo-1761658883717-2e8e1f0ff66b?w=1920&q=80',
    title: 'Devotional Offerings',
    subtitle: 'Embrace Hindu traditions'
  }
];

// Temple Logo Component with Image
const TempleLogo = ({ className = "", onClick, size = "medium" }) => {
  const sizeClasses = {
    small: "w-10 h-10",
    medium: "w-14 h-14",
    large: "w-20 h-20",
    xlarge: "w-28 h-28"
  };
  
  return (
    <motion.div 
      className={`cursor-pointer ${className}`}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <img 
        src="/temple-logo.png" 
        alt="Divine App - Om Symbol"
        className={`${sizeClasses[size]} rounded-lg object-cover`}
      />
    </motion.div>
  );
};

// Image Carousel Component - Smooth crossfade without flash
const ImageCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsTransitioning(true);
      setNextIndex((currentIndex + 1) % CAROUSEL_IMAGES.length);
      
      // After transition completes, update current index
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
        setIsTransitioning(false);
      }, 1000);
    }, 5000);
    return () => clearInterval(timer);
  }, [currentIndex]);

  const goToSlide = (index) => {
    if (index !== currentIndex) {
      setIsTransitioning(true);
      setNextIndex(index);
      setTimeout(() => {
        setCurrentIndex(index);
        setIsTransitioning(false);
      }, 1000);
    }
  };
  
  const goPrev = () => {
    const newIndex = (currentIndex - 1 + CAROUSEL_IMAGES.length) % CAROUSEL_IMAGES.length;
    goToSlide(newIndex);
  };
  
  const goNext = () => {
    const newIndex = (currentIndex + 1) % CAROUSEL_IMAGES.length;
    goToSlide(newIndex);
  };

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Current image - always visible */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
          style={{ 
            backgroundImage: `url(${CAROUSEL_IMAGES[currentIndex].url})`,
            opacity: isTransitioning ? 0 : 1
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-maroon/90 via-maroon/70 to-maroon/50" />
      </div>
      
      {/* Next image - fades in during transition */}
      <div 
        className="absolute inset-0 transition-opacity duration-1000"
        style={{ opacity: isTransitioning ? 1 : 0 }}
      >
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${CAROUSEL_IMAGES[nextIndex].url})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-maroon/90 via-maroon/70 to-maroon/50" />
      </div>

      {/* Navigation Arrows */}
      <button 
        onClick={goPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center transition-all"
      >
        <ChevronLeft className="w-6 h-6 text-white" />
      </button>
      <button 
        onClick={goNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center transition-all"
      >
        <ChevronRight className="w-6 h-6 text-white" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {CAROUSEL_IMAGES.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentIndex 
                ? 'bg-gold w-8' 
                : 'bg-white/50 hover:bg-white/70'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

// Animated Aarti/Harathi Component
const AartiAnimation = ({ className = "" }) => (
  <motion.div 
    className={`fixed bottom-8 right-8 z-40 ${className}`}
    initial={{ opacity: 0, scale: 0 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: 2, duration: 0.5 }}
  >
    <motion.div
      animate={{ rotate: [0, 15, 0, -15, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      className="relative"
    >
      <svg viewBox="0 0 150 180" className="w-24 h-28 drop-shadow-2xl">
        <defs>
          <linearGradient id="aartiPlate" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="50%" stopColor="#FFA500" />
            <stop offset="100%" stopColor="#CD853F" />
          </linearGradient>
          <linearGradient id="aartiFlame1" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#FF4500" />
            <stop offset="40%" stopColor="#FF8C00" />
            <stop offset="70%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#FFFACD" />
          </linearGradient>
          <linearGradient id="aartiFlame2" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#FF6347" />
            <stop offset="50%" stopColor="#FFA500" />
            <stop offset="100%" stopColor="#FFFFE0" />
          </linearGradient>
          <filter id="aartiGlow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <radialGradient id="glowEffect" cx="50%" cy="30%" r="60%">
            <stop offset="0%" stopColor="#FFD700" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
          </radialGradient>
        </defs>
        
        {/* Glow effect behind flames */}
        <ellipse cx="75" cy="50" rx="50" ry="40" fill="url(#glowEffect)" />
        
        {/* Aarti plate (thali) */}
        <ellipse cx="75" cy="140" rx="55" ry="12" fill="#8B4513" />
        <ellipse cx="75" cy="135" rx="50" ry="10" fill="url(#aartiPlate)" />
        <ellipse cx="75" cy="132" rx="45" ry="8" fill="#FFE4B5" opacity="0.3" />
        
        {/* Small diyas on the plate */}
        {[30, 55, 75, 95, 120].map((x, i) => (
          <g key={i}>
            {/* Diya base */}
            <ellipse cx={x} cy="130" rx="8" ry="3" fill="#CD853F" />
            <path d={`M${x-6} 130 Q${x-6} 122 ${x} 122 Q${x+6} 122 ${x+6} 130`} fill="#FFD700" />
            
            {/* Animated flame */}
            <motion.path
              d={`M${x} 120 Q${x-4} 108 ${x} ${95 - i*2} Q${x+4} 108 ${x} 120`}
              fill="url(#aartiFlame1)"
              filter="url(#aartiGlow)"
              animate={{
                d: [
                  `M${x} 120 Q${x-4} 108 ${x} ${95 - i*2} Q${x+4} 108 ${x} 120`,
                  `M${x} 120 Q${x-5} 106 ${x} ${92 - i*2} Q${x+3} 106 ${x} 120`,
                  `M${x} 120 Q${x-3} 110 ${x} ${97 - i*2} Q${x+5} 110 ${x} 120`,
                  `M${x} 120 Q${x-4} 108 ${x} ${95 - i*2} Q${x+4} 108 ${x} 120`,
                ]
              }}
              transition={{ duration: 0.3 + i * 0.1, repeat: Infinity }}
            />
            {/* Inner flame */}
            <motion.ellipse
              cx={x}
              cy={105 - i*2}
              rx="3"
              ry="5"
              fill="#FFFACD"
              opacity="0.9"
              animate={{ ry: [5, 6, 4, 5], opacity: [0.9, 1, 0.8, 0.9] }}
              transition={{ duration: 0.4, repeat: Infinity }}
            />
          </g>
        ))}
        
        {/* Handle */}
        <path d="M75 145 L75 170" stroke="#8B4513" strokeWidth="8" strokeLinecap="round" />
        <ellipse cx="75" cy="172" rx="10" ry="6" fill="#8B4513" />
      </svg>
    </motion.div>
    
    {/* Label */}
    <motion.p 
      className="text-center text-xs text-maroon font-cinzel mt-1 opacity-80"
      animate={{ opacity: [0.6, 1, 0.6] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      Aarti
    </motion.p>
  </motion.div>
);

// 3D Animated Devotional Icons
const DiyaIcon = ({ className = "", animate = true }) => (
  <motion.div 
    className={`relative ${className}`}
    animate={animate ? { 
      rotateY: [0, 10, 0, -10, 0],
      scale: [1, 1.02, 1, 1.02, 1]
    } : {}}
    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
  >
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
      <defs>
        <linearGradient id="diyaGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="100%" stopColor="#B8860B" />
        </linearGradient>
        <linearGradient id="flame" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#FF6B00" />
          <stop offset="50%" stopColor="#FFD700" />
          <stop offset="100%" stopColor="#FFF5CC" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <ellipse cx="50" cy="85" rx="30" ry="8" fill="#8B4513" />
      <path d="M25 85 Q25 65 35 55 L65 55 Q75 65 75 85" fill="url(#diyaGold)" />
      <ellipse cx="50" cy="55" rx="22" ry="7" fill="#FFD700" />
      <motion.path 
        d="M50 50 Q42 35 50 15 Q58 35 50 50" 
        fill="url(#flame)" 
        filter="url(#glow)"
        animate={{ d: ["M50 50 Q42 35 50 15 Q58 35 50 50", "M50 50 Q44 32 50 12 Q56 32 50 50", "M50 50 Q42 35 50 15 Q58 35 50 50"] }}
        transition={{ duration: 0.5, repeat: Infinity }}
      />
      <ellipse cx="50" cy="20" rx="5" ry="8" fill="#FFF5CC" opacity="0.8" />
    </svg>
  </motion.div>
);

const OmIcon = ({ className = "", animate = true }) => (
  <motion.div 
    className={`relative ${className}`}
    animate={animate ? { 
      rotateZ: [0, 5, 0, -5, 0],
      scale: [1, 1.05, 1]
    } : {}}
    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    style={{ transformStyle: 'preserve-3d' }}
  >
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
      <defs>
        <linearGradient id="omGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF9933" />
          <stop offset="100%" stopColor="#722F37" />
        </linearGradient>
      </defs>
      <text x="50" y="70" textAnchor="middle" fontSize="60" fill="url(#omGradient)" fontFamily="serif" fontWeight="bold">ॐ</text>
    </svg>
  </motion.div>
);

const KalashIcon = ({ className = "", animate = true }) => (
  <motion.div 
    className={`relative ${className}`}
    animate={animate ? { 
      y: [0, -5, 0],
      rotateY: [0, 15, 0, -15, 0]
    } : {}}
    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
  >
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
      <defs>
        <linearGradient id="kalashCopper" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#CD7F32" />
          <stop offset="50%" stopColor="#FFD700" />
          <stop offset="100%" stopColor="#CD7F32" />
        </linearGradient>
        <linearGradient id="leaves" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#228B22" />
          <stop offset="100%" stopColor="#32CD32" />
        </linearGradient>
      </defs>
      <ellipse cx="50" cy="88" rx="25" ry="6" fill="#8B4513" />
      <path d="M30 85 L35 50 Q35 45 50 45 Q65 45 65 50 L70 85 Q50 90 30 85" fill="url(#kalashCopper)" />
      <ellipse cx="50" cy="45" rx="15" ry="5" fill="#FFD700" />
      <ellipse cx="50" cy="32" rx="8" ry="12" fill="#2E8B57" />
      <path d="M42 35 Q50 20 50 10 Q50 20 58 35" fill="url(#leaves)" />
      <path d="M38 38 Q45 25 50 15" stroke="#228B22" strokeWidth="2" fill="none" />
      <path d="M62 38 Q55 25 50 15" stroke="#228B22" strokeWidth="2" fill="none" />
    </svg>
  </motion.div>
);

const TempleIcon = ({ className = "", animate = true }) => (
  <motion.div 
    className={`relative ${className}`}
    animate={animate ? { 
      scale: [1, 1.03, 1],
      rotateX: [0, 5, 0]
    } : {}}
    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
    style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
  >
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
      <defs>
        <linearGradient id="templeStone" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#DEB887" />
          <stop offset="100%" stopColor="#D2691E" />
        </linearGradient>
        <linearGradient id="templeGold" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="100%" stopColor="#B8860B" />
        </linearGradient>
      </defs>
      <rect x="20" y="70" width="60" height="25" fill="url(#templeStone)" />
      <rect x="25" y="45" width="50" height="25" fill="url(#templeStone)" />
      <polygon points="50,10 75,45 25,45" fill="url(#templeGold)" />
      <circle cx="50" cy="30" r="5" fill="#FFD700" />
      <rect x="40" y="75" width="20" height="20" fill="#4A3728" />
      <rect x="43" y="78" width="14" height="14" fill="#2E1810" />
    </svg>
  </motion.div>
);

const BellIcon = ({ className = "", animate = true }) => (
  <motion.div 
    className={`relative ${className}`}
    animate={animate ? { 
      rotate: [-5, 5, -5],
      y: [0, -2, 0]
    } : {}}
    transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
    style={{ transformOrigin: 'top center' }}
  >
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
      <defs>
        <linearGradient id="bellBrass" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="50%" stopColor="#CD853F" />
          <stop offset="100%" stopColor="#B8860B" />
        </linearGradient>
      </defs>
      <ellipse cx="50" cy="15" rx="5" ry="5" fill="#B8860B" />
      <path d="M45 15 L45 25 Q30 35 30 60 L70 60 Q70 35 55 25 L55 15" fill="url(#bellBrass)" />
      <ellipse cx="50" cy="60" rx="22" ry="8" fill="#CD853F" />
      <circle cx="50" cy="70" r="6" fill="#B8860B" />
    </svg>
  </motion.div>
);

const ConchIcon = ({ className = "", animate = true }) => (
  <motion.div 
    className={`relative ${className}`}
    animate={animate ? { 
      rotateZ: [0, 10, 0, -10, 0],
      scale: [1, 1.05, 1]
    } : {}}
    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
  >
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
      <defs>
        <linearGradient id="conchShell" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF5EE" />
          <stop offset="50%" stopColor="#FFE4E1" />
          <stop offset="100%" stopColor="#FFDAB9" />
        </linearGradient>
      </defs>
      <path d="M70 50 Q75 30 60 20 Q40 15 30 35 Q20 55 35 75 Q50 90 70 80 Q85 70 70 50" fill="url(#conchShell)" stroke="#DEB887" strokeWidth="2" />
      <path d="M55 45 Q50 50 55 60" stroke="#CD853F" strokeWidth="2" fill="none" />
      <path d="M60 40 Q52 50 60 65" stroke="#CD853F" strokeWidth="2" fill="none" />
      <ellipse cx="40" cy="50" rx="8" ry="15" fill="#2F1810" />
    </svg>
  </motion.div>
);

const ZodiacIcon = ({ className = "", animate = true }) => (
  <motion.div 
    className={`relative ${className}`}
    animate={animate ? { 
      rotate: [0, 360]
    } : {}}
    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
  >
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
      <defs>
        <linearGradient id="cosmicPurple" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4B0082" />
          <stop offset="100%" stopColor="#9400D3" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="40" fill="none" stroke="url(#cosmicPurple)" strokeWidth="3" />
      <circle cx="50" cy="50" r="30" fill="none" stroke="#FFD700" strokeWidth="1" strokeDasharray="5 5" />
      <circle cx="50" cy="15" r="4" fill="#FFD700" />
      <circle cx="85" cy="50" r="4" fill="#FFD700" />
      <circle cx="50" cy="85" r="4" fill="#FFD700" />
      <circle cx="15" cy="50" r="4" fill="#FFD700" />
      <circle cx="50" cy="50" r="8" fill="#4B0082" />
      <circle cx="50" cy="50" r="4" fill="#FFD700" />
    </svg>
  </motion.div>
);

const CartIcon = ({ className = "", animate = true }) => (
  <motion.div 
    className={`relative ${className}`}
    animate={animate ? { 
      y: [0, -3, 0],
      rotate: [0, 2, 0, -2, 0]
    } : {}}
    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
  >
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
      <defs>
        <linearGradient id="basketWood" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#DEB887" />
          <stop offset="100%" stopColor="#8B4513" />
        </linearGradient>
      </defs>
      <path d="M20 35 L30 75 L70 75 L80 35 Z" fill="url(#basketWood)" stroke="#8B4513" strokeWidth="2" />
      <path d="M25 45 L75 45" stroke="#A0522D" strokeWidth="2" />
      <path d="M27 55 L73 55" stroke="#A0522D" strokeWidth="2" />
      <path d="M29 65 L71 65" stroke="#A0522D" strokeWidth="2" />
      <ellipse cx="35" cy="30" rx="6" ry="8" fill="#FF6347" />
      <ellipse cx="50" cy="28" rx="5" ry="7" fill="#FFD700" />
      <ellipse cx="65" cy="30" rx="6" ry="8" fill="#32CD32" />
      <path d="M35 20 L35 25" stroke="#228B22" strokeWidth="2" />
    </svg>
  </motion.div>
);

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

export default function LandingPage({ onGetStarted }) {
  const { t } = useTranslation();
  const [priests, setPriests] = useState([]);
  const [products, setProducts] = useState([]);
  const [festivals, setFestivals] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [contactInfo, setContactInfo] = useState({
    email: 'support@divineapp.com',
    phone: '+91 98765 43210',
    address: 'Hyderabad, Telangana, India'
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Feedback form state
  const [feedbackForm, setFeedbackForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    rating: 0
  });
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [priestsRes, productsRes, festivalsRes, testimonialsRes, contactRes] = await Promise.all([
        api.get('/api/priests?limit=3'),
        api.get('/api/products?limit=4'),
        api.get('/api/festivals'),
        api.get('/api/testimonials').catch(() => ({ data: { testimonials: [] } })),
        api.get('/api/contact-info').catch(() => ({ data: contactInfo }))
      ]);
      setPriests(priestsRes.data.priests || []);
      setProducts(productsRes.data.products || []);
      setFestivals((festivalsRes.data.festivals || []).slice(0, 4));
      setTestimonials(testimonialsRes.data.testimonials || []);
      if (contactRes.data) {
        setContactInfo(contactRes.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setFeedbackSubmitting(true);
    try {
      await api.post('/api/feedback', feedbackForm);
      toast.success('Thank you for your feedback! We will get back to you soon.');
      setFeedbackForm({ name: '', email: '', subject: '', message: '', rating: 0 });
    } catch (error) {
      toast.error('Failed to send feedback. Please try again.');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream overflow-x-hidden">
      {/* Animated Aarti */}
      <AartiAnimation />
      
      {/* Navigation - Full Width */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-orange-100">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 lg:h-20 max-w-[1920px] mx-auto">
            {/* Logo - Temple Symbol - Clickable to scroll to top */}
            <button 
              onClick={scrollToTop}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
              data-testid="logo-scroll-top"
            >
              <TempleLogo size="small" onClick={scrollToTop} />
              <div className="flex flex-col">
                <span className="font-cinzel text-xl font-bold text-maroon">DIVINE</span>
                <span className="text-[10px] text-gray-500 -mt-1">Spiritual Services</span>
              </div>
            </button>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              <a href="#features" className="text-gray-700 hover:text-saffron transition-colors font-medium">Features</a>
              <a href="#services" className="text-gray-700 hover:text-saffron transition-colors font-medium">Services</a>
              <a href="#priests" className="text-gray-700 hover:text-saffron transition-colors font-medium">Priests</a>
              <a href="#marketplace" className="text-gray-700 hover:text-saffron transition-colors font-medium">Marketplace</a>
              <a href="#contact" className="text-gray-700 hover:text-saffron transition-colors font-medium">Contact</a>
            </div>

            {/* CTA Buttons */}
            <div className="hidden lg:flex items-center gap-4">
              <LanguageSelector className="text-gray-700" />
              <button onClick={() => onGetStarted('login')} className="text-maroon font-medium hover:text-saffron transition-colors">
                {t('auth.login')}
              </button>
              <button onClick={() => onGetStarted('register')} className="bg-saffron hover:bg-saffron-dark text-white px-6 py-2.5 rounded-full font-medium transition-colors">
                {t('landing.hero.cta')}
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:hidden bg-white border-t border-orange-100 px-4 py-6"
          >
            <div className="space-y-4">
              <a href="#features" className="block text-gray-700 font-medium">{t('nav.home')}</a>
              <a href="#services" className="block text-gray-700 font-medium">{t('priest.profile.services')}</a>
              <a href="#priests" className="block text-gray-700 font-medium">{t('nav.priests')}</a>
              <a href="#marketplace" className="block text-gray-700 font-medium">{t('nav.store')}</a>
              <div className="py-3 border-t border-gray-100">
                <LanguageSelector className="text-gray-700 w-full" />
              </div>
              <div className="pt-2 space-y-3">
                <button onClick={() => onGetStarted('login')} className="w-full border-2 border-maroon text-maroon py-3 rounded-full font-medium">
                  {t('auth.login')}
                </button>
                <button onClick={() => onGetStarted('register')} className="w-full bg-saffron text-white py-3 rounded-full font-medium">
                  {t('landing.hero.cta')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Falling Flowers Animation - Sides Only */}
      {/* Rose Petals - Left Side */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`rose-left-${i}`}
          className="fixed pointer-events-none z-20"
          initial={{ 
            top: -30, 
            left: `${2 + Math.random() * 15}%`,
            rotate: Math.random() * 360,
          }}
          animate={{ 
            top: '110%',
            rotate: [0, 180, 360, 540],
            x: [0, Math.sin(i) * 40, Math.cos(i) * -30, 0],
          }}
          transition={{ 
            duration: 12 + Math.random() * 6,
            repeat: Infinity,
            delay: i * 1.5,
            ease: "linear"
          }}
        >
          <svg viewBox="0 0 30 35" className="w-6 h-7" style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.15))' }}>
            <defs>
              <linearGradient id={`lpRoseL${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFB6C1" />
                <stop offset="50%" stopColor="#FF69B4" />
                <stop offset="100%" stopColor="#DB7093" />
              </linearGradient>
            </defs>
            <path d="M15 2 Q22 8 20 18 Q18 28 15 32 Q12 28 10 18 Q8 8 15 2" fill={`url(#lpRoseL${i})`} opacity="0.65" />
          </svg>
        </motion.div>
      ))}
      
      {/* Rose Petals - Right Side */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`rose-right-${i}`}
          className="fixed pointer-events-none z-20"
          initial={{ 
            top: -30, 
            left: `${83 + Math.random() * 15}%`,
            rotate: Math.random() * 360,
          }}
          animate={{ 
            top: '110%',
            rotate: [0, 180, 360, 540],
            x: [0, Math.sin(i) * -40, Math.cos(i) * 30, 0],
          }}
          transition={{ 
            duration: 12 + Math.random() * 6,
            repeat: Infinity,
            delay: i * 1.5 + 0.5,
            ease: "linear"
          }}
        >
          <svg viewBox="0 0 30 35" className="w-6 h-7" style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.15))' }}>
            <defs>
              <linearGradient id={`lpRoseR${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFB6C1" />
                <stop offset="50%" stopColor="#FF69B4" />
                <stop offset="100%" stopColor="#DB7093" />
              </linearGradient>
            </defs>
            <path d="M15 2 Q22 8 20 18 Q18 28 15 32 Q12 28 10 18 Q8 8 15 2" fill={`url(#lpRoseR${i})`} opacity="0.65" />
          </svg>
        </motion.div>
      ))}
      
      {/* Marigold Flowers - Left Side */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={`marigold-left-${i}`}
          className="fixed pointer-events-none z-20"
          initial={{ 
            top: -40, 
            left: `${3 + Math.random() * 14}%`,
            rotate: 0,
            scale: 0.7 + Math.random() * 0.3,
          }}
          animate={{ 
            top: '115%',
            rotate: [0, 120, 240, 360],
            x: [0, 30, -15, 0],
          }}
          transition={{ 
            duration: 16 + Math.random() * 6,
            repeat: Infinity,
            delay: i * 2.5 + 2,
            ease: "linear"
          }}
        >
          <svg viewBox="0 0 50 50" className="w-9 h-9" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>
            {[...Array(12)].map((_, j) => (
              <ellipse 
                key={j}
                cx="25" cy="8" rx="5" ry="9" 
                fill={j % 2 === 0 ? '#FFD700' : '#FFA500'}
                transform={`rotate(${j * 30} 25 25)`}
                opacity="0.8"
              />
            ))}
            <circle cx="25" cy="25" r="6" fill="#FF8C00" />
          </svg>
        </motion.div>
      ))}
      
      {/* Marigold Flowers - Right Side */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={`marigold-right-${i}`}
          className="fixed pointer-events-none z-20"
          initial={{ 
            top: -40, 
            left: `${83 + Math.random() * 14}%`,
            rotate: 0,
            scale: 0.7 + Math.random() * 0.3,
          }}
          animate={{ 
            top: '115%',
            rotate: [0, 120, 240, 360],
            x: [0, -30, 15, 0],
          }}
          transition={{ 
            duration: 16 + Math.random() * 6,
            repeat: Infinity,
            delay: i * 2.5 + 3,
            ease: "linear"
          }}
        >
          <svg viewBox="0 0 50 50" className="w-9 h-9" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>
            {[...Array(12)].map((_, j) => (
              <ellipse 
                key={j}
                cx="25" cy="8" rx="5" ry="9" 
                fill={j % 2 === 0 ? '#FFD700' : '#FFA500'}
                transform={`rotate(${j * 30} 25 25)`}
                opacity="0.8"
              />
            ))}
            <circle cx="25" cy="25" r="6" fill="#FF8C00" />
          </svg>
        </motion.div>
      ))}
      
      {/* Jasmine Flowers - Left Side */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={`jasmine-left-${i}`}
          className="fixed pointer-events-none z-20"
          initial={{ 
            top: -25, 
            left: `${4 + Math.random() * 13}%`,
            rotate: Math.random() * 180,
          }}
          animate={{ 
            top: '112%',
            rotate: [0, 90, 180, 270, 360],
            x: [0, 25, -15, 0],
          }}
          transition={{ 
            duration: 14 + Math.random() * 5,
            repeat: Infinity,
            delay: i * 2 + 1,
            ease: "linear"
          }}
        >
          <svg viewBox="0 0 30 30" className="w-5 h-5" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' }}>
            {[...Array(5)].map((_, j) => (
              <ellipse 
                key={j}
                cx="15" cy="7" rx="4" ry="6" 
                fill="white"
                stroke="#F5F5DC"
                strokeWidth="0.5"
                transform={`rotate(${j * 72} 15 15)`}
                opacity="0.85"
              />
            ))}
            <circle cx="15" cy="15" r="3" fill="#FFFACD" />
            <circle cx="15" cy="15" r="1.5" fill="#FFD700" />
          </svg>
        </motion.div>
      ))}
      
      {/* Jasmine Flowers - Right Side */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={`jasmine-right-${i}`}
          className="fixed pointer-events-none z-20"
          initial={{ 
            top: -25, 
            left: `${83 + Math.random() * 13}%`,
            rotate: Math.random() * 180,
          }}
          animate={{ 
            top: '112%',
            rotate: [0, 90, 180, 270, 360],
            x: [0, -25, 15, 0],
          }}
          transition={{ 
            duration: 14 + Math.random() * 5,
            repeat: Infinity,
            delay: i * 2 + 1.5,
            ease: "linear"
          }}
        >
          <svg viewBox="0 0 30 30" className="w-5 h-5" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' }}>
            {[...Array(5)].map((_, j) => (
              <ellipse 
                key={j}
                cx="15" cy="7" rx="4" ry="6" 
                fill="white"
                stroke="#F5F5DC"
                strokeWidth="0.5"
                transform={`rotate(${j * 72} 15 15)`}
                opacity="0.85"
              />
            ))}
            <circle cx="15" cy="15" r="3" fill="#FFFACD" />
            <circle cx="15" cy="15" r="1.5" fill="#FFD700" />
          </svg>
        </motion.div>
      ))}

      {/* Hero Section - Full Width with Image Carousel */}
      <section className="relative min-h-screen flex items-center pt-20 w-full">
        {/* Image Carousel Background */}
        <ImageCarousel />
        
        <div className="relative z-10 w-full px-4 sm:px-8 lg:px-16 py-20">
          <div className="max-w-[1920px] mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
                  <OmIcon className="w-5 h-5" animate={false} />
                  <span className="text-white/90 text-sm">Your Complete Spiritual Ecosystem</span>
                </div>
                
                <h1 className="font-cinzel text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                  Connect with the <span className="text-gold">Divine</span> from Anywhere
                </h1>
                
                <p className="text-lg text-white/80 mb-8 max-w-xl">
                  Book verified priests for poojas, explore your horoscope, shop for sacred items, 
                  and embrace Hindu traditions — all in one platform designed for the modern devotee.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={() => onGetStarted('register')}
                    className="bg-gold hover:bg-gold-dark text-maroon px-8 py-4 rounded-full font-semibold inline-flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl"
                  >
                    Start Your Journey <ArrowRight className="w-5 h-5" />
                  </button>
                  <a 
                    href="#how-it-works"
                    className="border-2 border-white/50 text-white hover:bg-white/10 px-8 py-4 rounded-full font-medium inline-flex items-center justify-center gap-2 transition-all"
                  >
                    <Play className="w-5 h-5" /> See How It Works
                  </a>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-white/20">
                  <div>
                    <p className="text-3xl font-bold text-gold">500+</p>
                    <p className="text-white/70 text-sm">Verified Priests</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gold">10K+</p>
                    <p className="text-white/70 text-sm">Poojas Completed</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gold">50K+</p>
                    <p className="text-white/70 text-sm">Happy Devotees</p>
                  </div>
                </div>
              </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="hidden lg:block"
            >
              {/* App Preview Mockup */}
              <div className="relative flex items-center justify-center">
                {/* Left floating badges */}
                <div className="flex flex-col gap-6 mr-6">
                  <motion.div 
                    className="bg-white rounded-2xl px-4 py-3 shadow-xl border border-saffron/20"
                    animate={{ y: [0, -10, 0], x: [0, 3, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-saffron/20 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-saffron" />
                      </div>
                      <span className="font-semibold text-gray-800">Devotee</span>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    className="bg-white rounded-2xl px-4 py-3 shadow-xl border border-purple-200"
                    animate={{ y: [0, -8, 0], x: [0, -2, 0] }}
                    transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Sun className="w-5 h-5 text-purple-600" />
                      </div>
                      <span className="font-semibold text-gray-800">Astrologer</span>
                    </div>
                  </motion.div>
                </div>

                {/* Phone Mockup */}
                <div className="w-72 h-[580px] bg-gray-900 rounded-[3rem] p-3 shadow-2xl flex-shrink-0">
                  <div className="w-full h-full bg-cream rounded-[2.5rem] overflow-hidden">
                    <div className="p-4">
                      <p className="text-gray-500 text-xs">Namaste,</p>
                      <p className="font-cinzel text-lg font-bold text-maroon">Welcome to Divine</p>
                      
                      {/* Service Icons */}
                      <div className="grid grid-cols-4 gap-2 mt-4">
                        <div className="bg-white rounded-xl p-2.5 text-center shadow-sm">
                          <BellIcon className="w-5 h-5 mx-auto" animate={false} />
                          <span className="text-[9px] text-gray-500">Pooja</span>
                        </div>
                        <div className="bg-white rounded-xl p-2.5 text-center shadow-sm">
                          <ZodiacIcon className="w-5 h-5 mx-auto" animate={false} />
                          <span className="text-[9px] text-gray-500">Astro</span>
                        </div>
                        <div className="bg-white rounded-xl p-2.5 text-center shadow-sm">
                          <CartIcon className="w-5 h-5 mx-auto" animate={false} />
                          <span className="text-[9px] text-gray-500">Shop</span>
                        </div>
                        <div className="bg-white rounded-xl p-2.5 text-center shadow-sm">
                          <TempleIcon className="w-5 h-5 mx-auto" animate={false} />
                          <span className="text-[9px] text-gray-500">Temple</span>
                        </div>
                      </div>
                      
                      <div className="mt-3 bg-gradient-to-r from-saffron to-gold rounded-xl p-3 text-white">
                        <p className="text-xs opacity-80">Next Festival</p>
                        <p className="font-semibold text-sm">Maha Shivaratri</p>
                      </div>
                      <div className="mt-2 bg-white rounded-xl p-3 shadow-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 bg-saffron rounded-full flex items-center justify-center text-white font-bold">P</div>
                          <div>
                            <p className="font-semibold text-sm text-gray-800">Pandit Sharma</p>
                            <p className="text-xs text-gray-500">Vedic Rituals • 4.9★</p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 bg-white rounded-xl p-3 shadow-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">A</div>
                          <div>
                            <p className="font-semibold text-sm text-gray-800">Astrologer Raj</p>
                            <p className="text-xs text-gray-500">Vedic Astrology • Online</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Right floating badges */}
                <div className="flex flex-col gap-6 ml-6">
                  <motion.div 
                    className="bg-white rounded-2xl px-4 py-3 shadow-xl border border-maroon/20"
                    animate={{ y: [0, 8, 0], x: [0, -3, 0] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-maroon/20 rounded-full flex items-center justify-center">
                        <Star className="w-5 h-5 text-maroon" />
                      </div>
                      <span className="font-semibold text-gray-800">Priest</span>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    className="bg-white rounded-2xl px-4 py-3 shadow-xl border border-green-200"
                    animate={{ y: [0, 10, 0], x: [0, 2, 0] }}
                    transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <ShoppingBag className="w-5 h-5 text-green-600" />
                      </div>
                      <span className="font-semibold text-gray-800">Shop</span>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div 
          className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <ChevronDown className="w-8 h-8 text-white/50" />
        </motion.div>
      </section>

      {/* Features Section - Full Width */}
      <section id="features" className="py-24 bg-white w-full">
        <div className="w-full px-4 sm:px-8 lg:px-16">
          <div className="max-w-[1920px] mx-auto">
            <motion.div 
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-saffron font-medium">WHY CHOOSE DIVINE</span>
              <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-maroon mt-2 mb-4">
                Everything You Need for Your Spiritual Journey
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                From booking priests to checking your daily horoscope, we've brought all spiritual services together in one beautiful, easy-to-use platform.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { 
                  icon: BellIcon, 
                  title: 'Verified Priests', 
                  desc: 'All priests are thoroughly verified with experience validation and background checks.',
                  color: 'bg-gradient-to-br from-saffron to-orange-400'
                },
                { 
                  icon: ZodiacIcon, 
                  title: 'Personalized Astrology', 
                  desc: 'Get daily horoscopes, birth chart analysis, and personalized cosmic insights.',
                  color: 'bg-gradient-to-br from-indigo-500 to-purple-500'
                },
                { 
                  icon: CartIcon, 
                  title: 'Authentic Products', 
                  desc: 'Shop quality pooja items, idols, and spiritual products from trusted sellers.',
                  color: 'bg-gradient-to-br from-gold to-amber-500'
                },
                { 
                  icon: TempleIcon, 
                  title: 'Temple Directory', 
                  desc: 'Discover temples near you and plan your spiritual pilgrimages.',
                  color: 'bg-gradient-to-br from-maroon to-red-700'
                },
              ].map((feature, index) => (
                <motion.div 
                  key={index}
                  className="text-center p-6 rounded-2xl hover:bg-cream/50 transition-colors"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className={`${feature.color} w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                    <feature.icon className="w-10 h-10" animate={true} />
                  </div>
                  <h3 className="font-cinzel text-xl font-semibold text-maroon mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services Section - Full Width */}
      <section id="services" className="py-24 bg-gradient-to-b from-cream to-parchment w-full">
        <div className="w-full px-4 sm:px-8 lg:px-16">
          <div className="max-w-[1920px] mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <span className="text-saffron font-medium">OUR SERVICES</span>
                <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-maroon mt-2 mb-6">
                  Complete Spiritual Services at Your Fingertips
                </h2>
                <p className="text-gray-600 mb-8">
                Whether you're performing a Griha Pravesh, Satyanarayana Pooja, or seeking astrological guidance, 
                our platform connects you with the right services and experts.
              </p>

              <div className="space-y-4">
                {[
                  { title: 'Pooja Services', desc: 'Book priests for all types of Hindu rituals and ceremonies' },
                  { title: 'Online Consultations', desc: 'Connect with priests and astrologers via video call' },
                  { title: 'Vedic Learning', desc: 'Learn mantras, shlokas, and spiritual practices' },
                  { title: 'Pooja Kit Delivery', desc: 'Get all required items delivered to your doorstep' },
                ].map((service, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-6 h-6 bg-saffron/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Check className="w-4 h-4 text-saffron" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{service.title}</h4>
                      <p className="text-gray-600 text-sm">{service.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => onGetStarted('register')}
                className="mt-8 bg-saffron hover:bg-saffron-dark text-white px-8 py-4 rounded-full font-semibold inline-flex items-center gap-2 transition-all"
              >
                Explore All Services <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-4"
            >
              {[
                { title: 'Satyanarayana Pooja', price: '2,100', duration: '2 hours', Icon: KalashIcon },
                { title: 'Griha Pravesh', price: '5,100', duration: '3 hours', Icon: TempleIcon },
                { title: 'Navagraha Shanti', price: '4,500', duration: '2.5 hours', Icon: ZodiacIcon },
                { title: 'Rudrabhishekam', price: '3,100', duration: '1.5 hours', Icon: ConchIcon },
              ].map((service, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-orange-100 hover:shadow-md transition-shadow">
                  <service.Icon className="w-12 h-12 mb-3" animate={true} />
                  <h4 className="font-semibold text-gray-800 mb-1">{service.title}</h4>
                  <p className="text-saffron font-bold text-lg mb-1">₹{service.price}</p>
                  <p className="text-gray-500 text-sm flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {service.duration}
                  </p>
                </div>
              ))}
            </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Full Width */}
      <section id="how-it-works" className="py-24 bg-maroon w-full">
        <div className="w-full px-4 sm:px-8 lg:px-16">
          <div className="max-w-[1920px] mx-auto">
            <motion.div 
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-gold font-medium">HOW IT WORKS</span>
              <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-white mt-2 mb-4">
                Simple Steps to Spiritual Services
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-4 gap-8">
              {[
                { step: '01', title: 'Create Account', desc: 'Sign up in seconds with your email or phone number', Icon: Users },
                { step: '02', title: 'Choose Service', desc: 'Browse priests, select pooja type, or shop products', Icon: BellIcon },
                { step: '03', title: 'Book & Pay', desc: 'Select date, time and complete secure payment', Icon: Calendar },
                { step: '04', title: 'Get Blessed', desc: 'Attend pooja in person or join online video session', Icon: DiyaIcon },
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  className="text-center relative"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-2xl flex items-center justify-center">
                    {typeof item.Icon === 'function' && item.Icon.name.includes('Icon') ? 
                      <item.Icon className="w-8 h-8" animate={false} /> : 
                      <item.Icon className="w-8 h-8 text-gold" />
                    }
                  </div>
                  <div className="text-6xl font-bold text-white/10 font-cinzel mb-2">{item.step}</div>
                  <h4 className="font-cinzel text-xl font-semibold text-white mb-2">{item.title}</h4>
                  <p className="text-white/70 text-sm">{item.desc}</p>
                  {i < 3 && (
                  <div className="hidden md:block absolute top-8 right-0 translate-x-1/2">
                    <ArrowRight className="w-6 h-6 text-white/30" />
                  </div>
                )}
              </motion.div>
            ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Priests - Full Width */}
      <section id="priests" className="py-24 bg-white w-full">
        <div className="w-full px-4 sm:px-8 lg:px-16">
          <div className="max-w-[1920px] mx-auto">
            <motion.div 
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-saffron font-medium">MEET OUR PRIESTS</span>
              <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-maroon mt-2 mb-4">
                Verified & Experienced Pandits
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Our priests are carefully verified with years of experience in Vedic rituals, ensuring authentic and meaningful ceremonies.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {priests.map((priest, index) => (
                <motion.div 
                  key={priest.id}
                  className="bg-cream rounded-2xl p-6 border border-orange-100"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-saffron to-gold rounded-full flex items-center justify-center text-white text-3xl font-cinzel">
                      {priest.user_name?.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-cinzel font-semibold text-maroon">{priest.user_name}</h4>
                        {priest.is_verified && <Award className="w-4 h-4 text-green-500" />}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                        <Star className="w-4 h-4 text-gold fill-gold" />
                        <span>{priest.rating} ({priest.total_reviews} reviews)</span>
                      </div>
                      <p className="text-sm text-gray-500">{priest.experience_years} years experience</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {priest.specializations?.slice(0, 3).map((spec, i) => (
                      <span key={i} className="bg-orange-100 text-saffron-dark text-xs px-3 py-1 rounded-full">
                        {spec}
                      </span>
                    ))}
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{priest.bio}</p>
                  
                  <button 
                    onClick={() => onGetStarted('register')}
                    className="w-full bg-saffron hover:bg-saffron-dark text-white py-3 rounded-full font-medium transition-colors"
                >
                  Book Now
                </button>
              </motion.div>
            ))}
            </div>

            <div className="text-center mt-12">
              <button 
                onClick={() => onGetStarted('register')}
                className="border-2 border-maroon text-maroon hover:bg-maroon hover:text-white px-8 py-3 rounded-full font-medium transition-colors inline-flex items-center gap-2"
              >
                View All Priests <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Marketplace Preview - Full Width */}
      <section id="marketplace" className="py-24 bg-gradient-to-b from-cream to-parchment w-full">
        <div className="w-full px-4 sm:px-8 lg:px-16">
          <div className="max-w-[1920px] mx-auto">
            <motion.div 
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-saffron font-medium">POOJA MARKETPLACE</span>
              <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-maroon mt-2 mb-4">
                Authentic Pooja Essentials
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Shop quality pooja items, idols, incense, and spiritual products from verified sellers.
              </p>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {products.map((product, index) => (
                <motion.div 
                  key={product.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-orange-100 hover:shadow-md transition-shadow"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="aspect-square bg-orange-50 rounded-xl mb-3 flex items-center justify-center overflow-hidden">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <CartIcon className="w-12 h-12" animate={false} />
                    )}
                  </div>
                  <h4 className="font-medium text-gray-800 text-sm mb-1 line-clamp-2">{product.name}</h4>
                  <div className="flex items-center gap-1 mb-2">
                    <Star className="w-3 h-3 text-gold fill-gold" />
                    <span className="text-xs text-gray-500">{product.rating}</span>
                  </div>
                  <p className="text-saffron font-bold">₹{product.price}</p>
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-12">
              <button 
                onClick={() => onGetStarted('register')}
                className="bg-saffron hover:bg-saffron-dark text-white px-8 py-3 rounded-full font-medium transition-colors inline-flex items-center gap-2"
              >
                Browse All Products <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Festivals - Full Width */}
      <section className="py-24 bg-white w-full">
        <div className="w-full px-4 sm:px-8 lg:px-16">
          <div className="max-w-[1920px] mx-auto">
            <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-saffron font-medium">FESTIVAL CALENDAR</span>
            <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-maroon mt-2 mb-4">
              Upcoming Hindu Festivals
            </h2>
          </motion.div>

            <div className="grid md:grid-cols-4 gap-6">
              {festivals.map((festival, index) => (
                <motion.div 
                  key={festival.id}
                  className="bg-gradient-to-br from-saffron to-gold rounded-2xl p-6 text-white relative overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="absolute top-2 right-2 opacity-20">
                    <DiyaIcon className="w-16 h-16" animate={false} />
                  </div>
                  <Calendar className="w-8 h-8 mb-4 opacity-80" />
                  <h4 className="font-cinzel text-lg font-semibold mb-1">{festival.name}</h4>
                  <p className="text-white/80 text-sm mb-2">{festival.date}</p>
                  <p className="text-white/70 text-xs line-clamp-2">{festival.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Full Width */}
      <section className="py-24 bg-maroon relative overflow-hidden w-full">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10"><OmIcon className="w-32 h-32" animate={false} /></div>
          <div className="absolute bottom-10 right-10"><DiyaIcon className="w-32 h-32" animate={false} /></div>
        </div>
        <div className="w-full px-4 sm:px-8 lg:px-16 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-white mb-4">
              Begin Your Spiritual Journey Today
            </h2>
            <p className="text-white/80 mb-8 max-w-2xl mx-auto">
              Join thousands of devotees who trust Divine App for their spiritual needs. 
              Create your free account and experience the divine difference.
            </p>
            <button 
              onClick={() => onGetStarted('register')}
              className="bg-gold hover:bg-gold-dark text-maroon px-10 py-4 rounded-full font-semibold inline-flex items-center gap-2 transition-all shadow-lg hover:shadow-xl text-lg"
            >
              Create Free Account <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-cream w-full">
        <div className="w-full px-4 sm:px-8 lg:px-16">
          <div className="max-w-[1920px] mx-auto">
            <motion.div 
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-saffron font-medium">TESTIMONIALS</span>
              <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-maroon mt-2 mb-4">
                What Our Devotees Say
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Hear from thousands of satisfied users who have transformed their spiritual journey with Divine App
              </p>
            </motion.div>

            {/* Testimonials Grid */}
            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.length > 0 ? testimonials.slice(0, 6).map((testimonial, index) => (
                <motion.div
                  key={testimonial.id}
                  className="bg-white rounded-2xl p-6 shadow-lg"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-4 h-4 ${i < testimonial.rating ? 'text-gold fill-gold' : 'text-gray-300'}`} 
                      />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4 italic">"{testimonial.content}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-saffron rounded-full flex items-center justify-center text-white font-bold">
                      {testimonial.user_name?.charAt(0) || 'D'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{testimonial.user_name || 'Devotee'}</p>
                      <p className="text-xs text-gray-500 capitalize">{testimonial.user_role || 'User'}</p>
                    </div>
                  </div>
                </motion.div>
              )) : (
                // Default testimonials when none from DB
                [
                  { name: 'Priya Sharma', role: 'Devotee', content: 'Divine App has transformed my daily spiritual practice. The priests are authentic and knowledgeable.', rating: 5 },
                  { name: 'Rajesh Kumar', role: 'Business Owner', content: 'Booking priests for our office puja was so easy. Highly recommend!', rating: 5 },
                  { name: 'Anita Patel', role: 'Homemaker', content: 'The astrology readings are incredibly accurate. I check my horoscope daily!', rating: 4 },
                ].map((testimonial, index) => (
                  <motion.div
                    key={index}
                    className="bg-white rounded-2xl p-6 shadow-lg"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${i < testimonial.rating ? 'text-gold fill-gold' : 'text-gray-300'}`} 
                        />
                      ))}
                    </div>
                    <p className="text-gray-600 mb-4 italic">"{testimonial.content}"</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-saffron rounded-full flex items-center justify-center text-white font-bold">
                        {testimonial.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{testimonial.name}</p>
                        <p className="text-xs text-gray-500">{testimonial.role}</p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Contact & Feedback Section */}
      <section id="contact-form" className="py-24 bg-gradient-to-b from-parchment to-cream w-full">
        <div className="w-full px-4 sm:px-8 lg:px-16">
          <div className="max-w-[1920px] mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-start">
              {/* Contact Info */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <span className="text-saffron font-medium">GET IN TOUCH</span>
                <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-maroon mt-2 mb-6">
                  We'd Love to Hear From You
                </h2>
                <p className="text-gray-600 mb-8">
                  Have questions, feedback, or suggestions? We're here to help! Reach out to us and we'll get back to you as soon as possible.
                </p>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-saffron/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Mail className="w-6 h-6 text-saffron" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Email Us</h4>
                      <p className="text-gray-600">{contactInfo.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-saffron/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Phone className="w-6 h-6 text-saffron" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Call Us</h4>
                      <p className="text-gray-600">{contactInfo.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-saffron/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-saffron" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Visit Us</h4>
                      <p className="text-gray-600">{contactInfo.address}</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Contact Form */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl p-8 shadow-xl"
              >
                <h3 className="font-cinzel text-xl font-semibold text-maroon mb-6">Send us a Message</h3>
                <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Your Name</label>
                      <input
                        type="text"
                        value={feedbackForm.name}
                        onChange={(e) => setFeedbackForm({...feedbackForm, name: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-saffron focus:border-transparent"
                        placeholder="Enter your name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Email Address</label>
                      <input
                        type="email"
                        value={feedbackForm.email}
                        onChange={(e) => setFeedbackForm({...feedbackForm, email: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-saffron focus:border-transparent"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Subject</label>
                    <input
                      type="text"
                      value={feedbackForm.subject}
                      onChange={(e) => setFeedbackForm({...feedbackForm, subject: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-saffron focus:border-transparent"
                      placeholder="What's this about?"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Message</label>
                    <textarea
                      value={feedbackForm.message}
                      onChange={(e) => setFeedbackForm({...feedbackForm, message: e.target.value})}
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-saffron focus:border-transparent resize-none"
                      placeholder="Tell us what's on your mind..."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">How would you rate your experience?</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => setFeedbackForm({...feedbackForm, rating})}
                          className="p-2 transition-transform hover:scale-110"
                        >
                          <Star 
                            className={`w-6 h-6 ${feedbackForm.rating >= rating ? 'text-gold fill-gold' : 'text-gray-300'}`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={feedbackSubmitting}
                    className="w-full bg-saffron hover:bg-saffron-dark text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {feedbackSubmitting ? (
                      <>Sending...</>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Full Width */}
      <footer id="contact" className="bg-gray-900 text-white py-16 w-full">
        <div className="w-full px-4 sm:px-8 lg:px-16">
          <div className="max-w-[1920px] mx-auto">
            <div className="grid md:grid-cols-4 gap-12">
              <div>
                <button 
                  onClick={scrollToTop}
                  className="flex items-center gap-3 mb-4 hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <TempleLogo size="medium" onClick={scrollToTop} />
                  <div className="flex flex-col">
                    <span className="font-cinzel text-xl font-bold">DIVINE</span>
                    <span className="text-[10px] text-gray-400">Spiritual Services</span>
                  </div>
                </button>
                <p className="text-gray-400 text-sm mb-4">
                  Your complete spiritual ecosystem for Hindu rituals, astrology, and sacred services.
                </p>
                <div className="flex gap-4">
                  <a href="#" className="text-gray-400 hover:text-white"><Facebook className="w-5 h-5" /></a>
                  <a href="#" className="text-gray-400 hover:text-white"><Twitter className="w-5 h-5" /></a>
                  <a href="#" className="text-gray-400 hover:text-white"><Instagram className="w-5 h-5" /></a>
                  <a href="#" className="text-gray-400 hover:text-white"><Youtube className="w-5 h-5" /></a>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-4">Services</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="#" className="hover:text-white">Book Priests</a></li>
                  <li><a href="#" className="hover:text-white">Astrology</a></li>
                  <li><a href="#" className="hover:text-white">Pooja Store</a></li>
                  <li><a href="#" className="hover:text-white">Festival Calendar</a></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-4">Company</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="#" className="hover:text-white">About Us</a></li>
                  <li><a href="#" className="hover:text-white">Careers</a></li>
                  <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-4">Contact</h4>
                <ul className="space-y-3 text-sm text-gray-400">
                  <li className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {contactInfo.email}
                  </li>
                  <li className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {contactInfo.phone}
                  </li>
                  <li className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5" />
                    {contactInfo.address}
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm text-gray-500">
              <p>© 2025 Divine App. All rights reserved. Made with devotion in India</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
