import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, Sun, ShoppingBag, User, Calendar, MapPin,
  Bell, BellRing, ChevronRight, Clock, Package, Search, Filter,
  Plus, Minus, ShoppingCart, Heart, Settings, LogOut,
  CheckCircle, ArrowRight, ArrowLeft, Loader2, X, Menu, BookOpen, Play, Volume2, Music, Pause, SkipForward, SkipBack,
  Camera, MessageCircle, Send, Image as ImageIcon, Rss, MessageSquare, Video, Wallet, Edit, Globe, Check,
  Mail, Phone, UserRoundCheck, Flame, ScrollText, Mic, MicOff, VideoOff, PhoneOff, Users, AlertCircle
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { Toaster, toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import ChatTab from '../../components/Chat/ChatTab';
import { WalletCard, RechargeModal, TransactionHistory } from '../../components/Wallet/WalletComponents';
import { AstrologerList, PreCallCheck, VideoCallScreen } from '../../components/VideoConsultation/VideoConsultation';
import AddressAutocomplete from '../../components/AddressAutocomplete';
import { PriestDetailView, AstrologyTab } from '../../components/DevoteeDashboard';
import ScripturesTab from '../../components/DevoteeDashboard/ScripturesTab';
import SmartPayment from '../../components/PaymentComponents';
import NotificationBell from '../../components/NotificationBell';
import LanguageSelector from '../../components/LanguageSelector';
// 100ms SDK imports for Class Video Room
import {
  useHMSActions,
  useHMSStore,
  selectIsConnectedToRoom,
  selectLocalPeer,
  selectPeers,
  selectIsLocalAudioEnabled,
  selectIsLocalVideoEnabled,
  selectPeerScreenSharing,
  selectVideoTrackByPeerID,
  selectScreenShareByPeerID,
  useVideo,
  useAVToggle,
  HMSRoomProvider
} from '@100mslive/react-sdk';

// Import shared components from modular files
import { OmIcon, BellIcon3D, ZodiacIcon3D, TempleIcon3D, CartIcon3D, useIsDesktop } from './devotee/components/shared';
import { MobileHeader } from './devotee/components/MobileHeader';
import { Sidebar, BottomNav } from './devotee/components/Navigation';
import { PostCard, FeedTab } from './devotee/components/FeedTab';
import { ConsultationTab } from './devotee/components/ConsultationTab';
import { HomeTab } from './devotee/components/HomeTab';
import { ReviewModal } from './devotee/components/ReviewModal';
import { PriestsTab } from './devotee/components/PriestsTab';
import { LiveEventsTab } from './devotee/components/LiveEventsTab';
import { CalendarTab } from './devotee/components/CalendarTab';
import { ShopTab } from './devotee/components/ShopTab';
import { ProfileTab } from './devotee/components/ProfileTab';
import { ClassesTab, TestimonialSection } from './devotee/components/ClassesTab';

// Mantras & Shlokas Tab Content
function MantrasTab({ isDesktop }) {
  const { i18n } = useTranslation();
  
  // Map i18n language codes to our language codes
  const langCodeMap = {
    'en': 'english',
    'hi': 'hindi',
    'te': 'telugu',
    'ta': 'tamil',
    'kn': 'kannada',
    'ml': 'malayalam',
    'sa': 'sa'
  };
  
  // Sync with global language
  useEffect(() => {
    const i18nLang = i18n.language || 'en';
    const mappedLang = langCodeMap[i18nLang] || 'english';
    setSelectedLanguage(mappedLang);
  }, [i18n.language]);

  const [deities, setDeities] = useState([]);
  const [selectedDeity, setSelectedDeity] = useState(null);
  const [mantras, setMantras] = useState([]);
  const [stotras, setStotras] = useState([]);
  const [todayDevotional, setTodayDevotional] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('today');
  const [expandedMantra, setExpandedMantra] = useState(null);
  
  // Translation states
  const [selectedLanguage, setSelectedLanguage] = useState('english');
  const [translations, setTranslations] = useState({});
  const [translating, setTranslating] = useState(false);
  
  const languages = [
    { code: 'english', name: 'English', native: 'English' },
    { code: 'hindi', name: 'Hindi', native: 'हिंदी' },
    { code: 'telugu', name: 'Telugu', native: 'తెలుగు' },
    { code: 'kannada', name: 'Kannada', native: 'ಕನ್ನಡ' },
    { code: 'tamil', name: 'Tamil', native: 'தமிழ்' },
    { code: 'malayalam', name: 'Malayalam', native: 'മലയാളം' },
  ];

  useEffect(() => {
    fetchData();
  }, []);
  
  // Translate text
  const translateText = async (text, mantraKey) => {
    if (!text || selectedLanguage === 'english') {
      return text; // No translation needed for English
    }
    
    // Check cache first
    const cacheKey = `${mantraKey}_${selectedLanguage}`;
    if (translations[cacheKey]) {
      return translations[cacheKey];
    }
    
    try {
      const res = await api.post('/api/translate', {
        text: text,
        target_lang: selectedLanguage
      });
      
      if (res.data.status === 'ok') {
        // Cache the translation
        setTranslations(prev => ({
          ...prev,
          [cacheKey]: res.data.translated
        }));
        return res.data.translated;
      }
    } catch (error) {
      console.error('Translation error:', error);
    }
    return text;
  };
  
  // Translate all visible mantras when language changes
  useEffect(() => {
    if (selectedLanguage !== 'english' && todayDevotional?.mantras) {
      translateMantras(todayDevotional.mantras);
    }
  }, [selectedLanguage, todayDevotional]);
  
  const translateMantras = async (mantrasToTranslate) => {
    if (selectedLanguage === 'english') return;
    
    setTranslating(true);
    for (const mantra of mantrasToTranslate) {
      if (mantra.meaning_english) {
        await translateText(mantra.meaning_english, mantra.name);
      }
    }
    setTranslating(false);
  };
  
  // Get translation for a mantra
  const getTranslation = (mantra) => {
    if (selectedLanguage === 'english') {
      return mantra.meaning_english;
    }
    if (selectedLanguage === 'hindi' && mantra.meaning_hindi) {
      return mantra.meaning_hindi;
    }
    const cacheKey = `${mantra.name}_${selectedLanguage}`;
    return translations[cacheKey] || mantra.meaning_english;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [deitiesRes, todayRes] = await Promise.all([
        api.get('/api/devotional/deities'),
        api.get('/api/devotional/today')
      ]);
      setDeities(deitiesRes.data.data || []);
      setTodayDevotional(todayRes.data.data);
    } catch (error) {
      console.error('Error fetching devotional content:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeityContent = async (deityId) => {
    try {
      const res = await api.get(`/api/devotional/deities/${deityId}`);
      setSelectedDeity(res.data.data);
      const deityMantras = res.data.data.mantras || [];
      setMantras(deityMantras);
      setStotras(res.data.data.stotras || []);
      
      // Translate mantras if not English
      if (selectedLanguage !== 'english' && deityMantras.length > 0) {
        for (const mantra of deityMantras) {
          if (mantra.meaning_english) {
            translateText(mantra.meaning_english, mantra.name);
          }
        }
      }
    } catch (error) {
      toast.error('Failed to load content');
    }
  };

  // Translate deity mantras when language changes
  useEffect(() => {
    if (selectedLanguage !== 'english' && mantras.length > 0 && activeSection === 'deities') {
      mantras.forEach(mantra => {
        if (mantra.meaning_english) {
          translateText(mantra.meaning_english, mantra.name);
        }
      });
    }
  }, [selectedLanguage, mantras, activeSection]);

  const sections = [
    { id: 'today', name: "Today's Worship", icon: Calendar },
    { id: 'deities', name: 'By Deity', icon: Star },
    { id: 'all', name: 'All Mantras', icon: BookOpen },
    { id: 'audio', name: 'Audio Library', icon: Music },
    { id: 'video', name: 'Video Library', icon: Play },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 text-saffron animate-spin" />
      </div>
    );
  }

  return (
    <div className={`pb-24 lg:pb-8 ${isDesktop ? 'px-8' : 'px-4'}`}>
      <div className="pt-4 pb-6">
        <h1 className="font-cinzel text-2xl lg:text-3xl font-bold text-maroon">Mantras & Shlokas</h1>
        <p className="text-gray-500 text-sm">Sacred texts for daily worship</p>
      </div>

      {/* Section Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 pb-2">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => {
              setActiveSection(section.id);
              setSelectedDeity(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
              activeSection === section.id
                ? 'bg-saffron text-white'
                : 'bg-cream text-maroon hover:bg-saffron/20'
            }`}
          >
            <section.icon className="w-4 h-4" />
            <span className="text-sm">{section.name}</span>
          </button>
        ))}
        
        <div className="flex gap-2 ml-auto">
          {/* Language Selector */}
          <div className="relative">
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="appearance-none bg-cream text-maroon px-4 py-2 pr-8 rounded-full text-sm focus:ring-2 focus:ring-saffron outline-none cursor-pointer"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.native}
                </option>
              ))}
            </select>
            <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-maroon rotate-90 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Today's Worship Section */}
      {activeSection === 'today' && todayDevotional && (
        <div className="space-y-6">
          {/* Today's Deity Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-saffron to-gold rounded-2xl p-6 text-white"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white/80 text-sm">{todayDevotional.day} • {todayDevotional.day_hindi}</p>
                <h2 className="font-cinzel text-2xl">{todayDevotional.deity?.name}</h2>
                <p className="text-white/70 text-sm">{todayDevotional.deity?.name_hindi}</p>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-3xl">🙏</span>
              </div>
            </div>
            <p className="text-white/90 text-sm">{todayDevotional.deity?.description}</p>
            <div className="flex gap-2 mt-4">
              <span className="bg-white/20 px-3 py-1 rounded-full text-xs">
                Planet: {todayDevotional.planet}
              </span>
              <span className="bg-white/20 px-3 py-1 rounded-full text-xs">
                {todayDevotional.deity?.mantra_count} Mantras
              </span>
            </div>
          </motion.div>

          {/* Today's Mantras */}
          <div>
            <h3 className="font-cinzel text-lg text-maroon mb-4">Today's Mantras</h3>
            <div className="space-y-4">
              {todayDevotional.mantras?.map((mantra, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-cream rounded-2xl p-5 border border-saffron/20"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-maroon">{mantra.name}</h4>
                      <p className="text-gray-500 text-xs">{mantra.name_hindi}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      mantra.tier === 'free' ? 'bg-green-100 text-green-700' : 'bg-gold/20 text-gold'
                    }`}>
                      {mantra.tier === 'free' ? 'Free' : 'Premium'}
                    </span>
                  </div>
                  
                  {/* Sanskrit Text */}
                  <div className="bg-white rounded-xl p-4 mb-3">
                    <p className="text-lg text-maroon font-sanskrit text-center leading-relaxed">
                      {mantra.sanskrit}
                    </p>
                  </div>
                  
                  {/* Transliteration */}
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">Transliteration:</p>
                    <p className="text-sm text-gray-700 italic">{mantra.transliteration}</p>
                  </div>
                  
                  {/* Translation in selected language */}
                  <div className="bg-saffron/5 rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-gray-500">
                        Translation ({languages.find(l => l.code === selectedLanguage)?.native}):
                      </p>
                      {translating && (
                        <Loader2 className="w-3 h-3 text-saffron animate-spin" />
                      )}
                    </div>
                    <p className="text-sm text-gray-800">{getTranslation(mantra)}</p>
                  </div>
                  
                  <button
                    onClick={() => setExpandedMantra(expandedMantra === mantra.name ? null : mantra.name)}
                    className="text-saffron text-sm mt-2 flex items-center gap-1"
                  >
                    {expandedMantra === mantra.name ? 'Show less' : 'Show benefits & instructions'}
                    <ChevronRight className={`w-4 h-4 transition-transform ${expandedMantra === mantra.name ? 'rotate-90' : ''}`} />
                  </button>
                  
                  {expandedMantra === mantra.name && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="mt-3 pt-3 border-t border-saffron/10"
                    >
                      <p className="text-xs text-gray-500 mb-2">Benefits:</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {mantra.benefits?.map((benefit, i) => (
                          <span key={i} className="text-xs bg-saffron/10 text-maroon px-2 py-1 rounded-full">
                            {benefit}
                          </span>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-saffron" />
                          Best time: {mantra.best_time}
                        </div>
                        <div>
                          Chant: {mantra.chant_count} times
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* By Deity Section */}
      {activeSection === 'deities' && (
        <div className={`${isDesktop ? 'grid grid-cols-2 gap-8' : ''}`}>
          {/* Deity List */}
          <div className={`grid ${isDesktop ? 'grid-cols-2' : 'grid-cols-3'} gap-3 mb-6`}>
            {deities.map((deity) => (
              <button
                key={deity.id}
                onClick={() => fetchDeityContent(deity.id)}
                className={`p-3 rounded-2xl text-center transition-all ${
                  selectedDeity?.id === deity.id
                    ? 'bg-saffron text-white ring-2 ring-gold'
                    : 'bg-cream text-maroon hover:bg-saffron/20'
                }`}
                style={{ borderLeft: `4px solid ${deity.color}` }}
              >
                <p className="font-semibold text-sm">{deity.name.replace('Lord ', '')}</p>
                <p className="text-xs opacity-70">{deity.name_hindi}</p>
                <p className="text-xs mt-1">{deity.mantra_count} mantras</p>
              </button>
            ))}
          </div>

          {/* Selected Deity Content */}
          {selectedDeity && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="bg-cream rounded-2xl p-5 border border-saffron/20 mb-4">
                <h3 className="font-cinzel text-xl text-maroon">{selectedDeity.name}</h3>
                <p className="text-gray-500 text-sm">{selectedDeity.name_sanskrit}</p>
                <p className="text-gray-600 text-sm mt-2">{selectedDeity.description}</p>
                <div className="flex gap-2 mt-3">
                  <span className="text-xs bg-saffron/10 text-maroon px-2 py-1 rounded-full">
                    {selectedDeity.associated_day}
                  </span>
                  <span className="text-xs bg-saffron/10 text-maroon px-2 py-1 rounded-full">
                    Planet: {selectedDeity.associated_planet}
                  </span>
                </div>
              </div>

              {/* Mantras for selected deity */}
              <h4 className="font-cinzel text-lg text-maroon mb-3">Mantras</h4>
              <div className="space-y-3">
                {mantras.map((mantra, idx) => (
                  <div key={idx} className="bg-white rounded-xl p-4 border border-saffron/10">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-maroon">{mantra.name}</p>
                        <p className="text-xs text-gray-500">{mantra.type?.replace('_', ' ')}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        mantra.tier === 'free' ? 'bg-green-100 text-green-700' : 'bg-gold/20 text-gold'
                      }`}>
                        {mantra.tier}
                      </span>
                    </div>
                    <div className="bg-cream rounded-lg p-3 my-2">
                      <p className="text-maroon text-center">{mantra.sanskrit}</p>
                    </div>
                    <p className="text-xs text-gray-600 italic mb-2">{mantra.transliteration}</p>
                    
                    {/* Translation */}
                    <div className="bg-saffron/5 rounded-lg p-2 mt-2">
                      <p className="text-xs text-gray-500 mb-1">
                        Translation ({languages.find(l => l.code === selectedLanguage)?.native}):
                      </p>
                      <p className="text-xs text-gray-700">{getTranslation(mantra)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Stotras for selected deity */}
              {stotras.length > 0 && (
                <>
                  <h4 className="font-cinzel text-lg text-maroon mb-3 mt-6">Stotras & Prayers</h4>
                  <div className="space-y-3">
                    {stotras.map((stotra, idx) => (
                      <div key={idx} className="bg-white rounded-xl p-4 border border-saffron/10">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-maroon">{stotra.name}</p>
                            <p className="text-xs text-gray-500">{stotra.name_hindi}</p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            stotra.tier === 'free' ? 'bg-green-100 text-green-700' : 'bg-gold/20 text-gold'
                          }`}>
                            {stotra.tier}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">{stotra.description}</p>
                        <div className="flex gap-2 mt-2">
                          <span className="text-xs text-gray-500">{stotra.verse_count} verses</span>
                          {stotra.audio_available && (
                            <span className="text-xs text-saffron flex items-center gap-1">
                              <Volume2 className="w-3 h-3" /> Audio
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </div>
      )}

      {/* All Mantras Section */}
      {activeSection === 'all' && (
        <AllMantrasSection 
          isDesktop={isDesktop} 
          selectedLanguage={selectedLanguage}
          languages={languages}
          translations={translations}
          translateText={translateText}
        />
      )}

      {/* Audio Library Section - Internet Archive */}
      {activeSection === 'audio' && (
        <AudioLibrarySection isDesktop={isDesktop} />
      )}
      
      {activeSection === 'video' && (
        <VideoLibrarySection isDesktop={isDesktop} />
      )}
    </div>
  );
}

// All Mantras Sub-component
function AllMantrasSection({ isDesktop, selectedLanguage, languages, translations, translateText }) {
  const [mantras, setMantras] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedMantra, setSelectedMantra] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [skip, setSkip] = useState(0);
  const [mantraTranslations, setMantraTranslations] = useState({});
  const [translatingMantra, setTranslatingMantra] = useState(null);
  const limit = 20;

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    setSkip(0);
    fetchAllMantras(true);
  }, [categoryFilter, filter]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/api/devotional/mantras/categories');
      setCategories(res.data.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchAllMantras = async (reset = false) => {
    try {
      setLoading(true);
      const currentSkip = reset ? 0 : skip;
      const params = new URLSearchParams({
        limit: limit.toString(),
        skip: currentSkip.toString(),
      });
      
      if (categoryFilter !== 'all') {
        params.append('category', categoryFilter);
      }
      if (filter) {
        params.append('search', filter);
      }
      
      const res = await api.get(`/api/devotional/mantras/all?${params}`);
      const newMantras = res.data.data || [];
      
      if (reset) {
        setMantras(newMantras);
      } else {
        setMantras(prev => [...prev, ...newMantras]);
      }
      
      setHasMore(res.data.has_more);
      if (!reset) {
        setSkip(currentSkip + limit);
      }
    } catch (error) {
      console.error('Error fetching mantras:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    setSkip(prev => prev + limit);
    fetchAllMantras(false);
  };

  // Translate a mantra's verses
  const translateMantraVerses = async (mantra) => {
    const cacheKey = `${mantra.title}_${selectedLanguage}`;
    
    // Check if already translated
    if (mantraTranslations[cacheKey]) {
      return;
    }
    
    // Don't translate if already in selected language
    if (selectedLanguage === 'english' || selectedLanguage === 'sa') {
      return;
    }
    
    setTranslatingMantra(mantra.title);
    
    try {
      // Translate the verses
      const res = await api.post('/api/translate', {
        text: mantra.verses,
        target_lang: selectedLanguage
      });
      
      if (res.data.status === 'ok') {
        setMantraTranslations(prev => ({
          ...prev,
          [cacheKey]: res.data.translated
        }));
      }
    } catch (error) {
      console.error('Translation error:', error);
      toast.error('Translation failed. Please try again.');
    } finally {
      setTranslatingMantra(null);
    }
  };

  // Get translated text for a mantra
  const getTranslatedVerses = (mantra) => {
    const cacheKey = `${mantra.title}_${selectedLanguage}`;
    return mantraTranslations[cacheKey];
  };

  // Get language display name
  const getLanguageName = () => {
    const lang = languages?.find(l => l.code === selectedLanguage);
    return lang?.native || lang?.name || selectedLanguage;
  };

  if (loading && mantras.length === 0) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-6 h-6 text-saffron animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Category Pills */}
      <div className="flex flex-wrap gap-2 mb-4 pb-2 overflow-x-auto">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
            categoryFilter === 'all'
              ? 'bg-saffron text-white'
              : 'bg-cream text-maroon hover:bg-saffron/20'
          }`}
        >
          All ({categories.reduce((sum, c) => sum + c.count, 0)})
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategoryFilter(cat.id)}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
              categoryFilter === cat.id
                ? 'bg-saffron text-white'
                : 'bg-cream text-maroon hover:bg-saffron/20'
            }`}
          >
            {cat.name} ({cat.count})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search mantras..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-cream rounded-xl text-maroon focus:ring-2 focus:ring-saffron outline-none"
          />
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-4">{mantras.length} mantras loaded</p>

      {/* Mantras Grid */}
      <div className={`grid ${isDesktop ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
        {mantras.map((mantra, idx) => (
          <motion.div
            key={`${mantra.title}-${idx}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(idx * 0.03, 0.3) }}
            className="bg-cream rounded-xl p-4 border border-saffron/10 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedMantra(selectedMantra?.title === mantra.title ? null : mantra)}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-semibold text-maroon">{mantra.title}</p>
                <p className="text-xs text-gray-500">{mantra.title_english}</p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-saffron/20 text-saffron">
                {mantra.deity || mantra.category}
              </span>
            </div>
            
            {/* Show deity in Hindi if available */}
            {mantra.deity_hindi && (
              <p className="text-xs text-maroon/70 mb-2">{mantra.deity_hindi}</p>
            )}
            
            {/* Expanded view with verses */}
            {selectedMantra?.title === mantra.title && mantra.verses && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 pt-3 border-t border-saffron/20"
              >
                {/* Original Sanskrit */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-gray-600">Original (Sanskrit)</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 max-h-48 overflow-y-auto">
                    <pre className="text-maroon text-sm whitespace-pre-wrap font-sanskrit leading-relaxed">
                      {mantra.verses}
                    </pre>
                  </div>
                </div>
                
                {/* Translation Section */}
                {selectedLanguage !== 'english' && selectedLanguage !== 'sa' && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-gray-600">
                        Translation ({getLanguageName()})
                      </p>
                      {!getTranslatedVerses(mantra) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            translateMantraVerses(mantra);
                          }}
                          disabled={translatingMantra === mantra.title}
                          className="flex items-center gap-1 text-xs px-3 py-1 bg-saffron text-white rounded-full hover:bg-saffron/90 disabled:opacity-50"
                        >
                          {translatingMantra === mantra.title ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Translating...
                            </>
                          ) : (
                            <>
                              <Globe className="w-3 h-3" />
                              Translate
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    
                    {getTranslatedVerses(mantra) ? (
                      <div className="bg-saffron/5 rounded-lg p-3 max-h-48 overflow-y-auto">
                        <pre className="text-maroon text-sm whitespace-pre-wrap leading-relaxed">
                          {getTranslatedVerses(mantra)}
                        </pre>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">
                        Click "Translate" to see this mantra in {getLanguageName()}
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            )}
            
            {selectedMantra?.title !== mantra.title && (
              <p className="text-xs text-gray-500 mt-2">Tap to view full text</p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="text-center mt-6">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-2 bg-saffron text-white rounded-full hover:bg-saffron/90 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin inline" />
            ) : (
              'Load More Mantras'
            )}
          </button>
        </div>
      )}

      {mantras.length === 0 && !loading && (
        <div className="text-center py-10 text-gray-500">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No mantras found</p>
        </div>
      )}
    </div>
  );
}

// Audio Library Section - Vedic Audio Library
function AudioLibrarySection({ isDesktop }) {
  const [library, setLibrary] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingItem, setLoadingItem] = useState(null);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState(null);
  const [expandedCategory, setExpandedCategory] = useState('ESSENTIAL DAILY MANTRAS');

  useEffect(() => {
    fetchLibrary();
    return () => {
      if (audioElement) {
        audioElement.pause();
      }
    };
  }, []);

  const fetchLibrary = async () => {
    try {
      const res = await api.get('/api/archive/library');
      setLibrary(res.data.data || {});
    } catch (error) {
      toast.error('Failed to load audio library');
    } finally {
      setLoading(false);
    }
  };

  const playItem = async (itemId, title) => {
    setLoadingItem(itemId);
    try {
      const res = await api.get(`/api/archive/play/${itemId}`);
      if (res.data.audio_url) {
        playAudio(res.data.audio_url, title);
      } else {
        toast.error('No audio found for this item');
      }
    } catch (error) {
      toast.error('Failed to load audio');
    } finally {
      setLoadingItem(null);
    }
  };

  const playAudio = (url, title) => {
    if (audioElement) {
      audioElement.pause();
    }
    
    const audio = new Audio(url);
    setAudioElement(audio);
    setCurrentAudio({ url, title });
    setIsPlaying(true);
    
    audio.play().catch(() => {
      toast.error('Failed to play audio');
      setIsPlaying(false);
    });
    
    audio.onended = () => {
      setIsPlaying(false);
    };
    
    audio.onerror = () => {
      toast.error('Audio playback error');
      setIsPlaying(false);
    };
  };

  const togglePlayPause = () => {
    if (audioElement) {
      if (isPlaying) {
        audioElement.pause();
        setIsPlaying(false);
      } else {
        audioElement.play();
        setIsPlaying(true);
      }
    }
  };

  const stopAudio = () => {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
      setIsPlaying(false);
      setCurrentAudio(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 text-saffron animate-spin" />
      </div>
    );
  }

  const categories = Object.keys(library);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-maroon to-maroon/80 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3">
          <Music className="w-8 h-8" />
          <div>
            <h2 className="font-cinzel text-xl font-bold">Vedic Audio Library</h2>
            <p className="text-white/80 text-sm">98 sacred texts • Vedas, Upanishads, Mantras & Stotras</p>
          </div>
        </div>
      </div>

      {/* Now Playing Bar */}
      {currentAudio && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-saffron/20 to-gold/20 rounded-xl p-4 flex items-center gap-4"
        >
          <div className="w-10 h-10 bg-saffron rounded-full flex items-center justify-center flex-shrink-0">
            <Music className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-maroon text-sm truncate">{currentAudio.title}</p>
            <p className="text-xs text-gray-500">Now Playing</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlayPause}
              className="p-2 bg-saffron text-white rounded-full hover:bg-saffron/90 transition-all"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={stopAudio}
              className="p-2 bg-maroon/10 text-maroon rounded-full hover:bg-maroon/20 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Categories Accordion */}
      <div className="space-y-2">
        {categories.map((category) => (
          <div key={category} className="bg-white rounded-lg border border-saffron/10 overflow-hidden">
            {/* Category Header */}
            <button
              onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
              className="w-full flex items-center justify-between p-3 hover:bg-saffron/5 transition-all"
            >
              <div className="flex items-center gap-2">
                <span className="text-saffron font-bold text-sm">{library[category]?.length || 0}</span>
                <span className="font-medium text-maroon text-sm">{category}</span>
              </div>
              <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${expandedCategory === category ? 'rotate-90' : ''}`} />
            </button>
            
            {/* Category Items */}
            {expandedCategory === category && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="border-t border-saffron/10"
              >
                {library[category]?.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 p-3 hover:bg-saffron/5 transition-all ${idx !== 0 ? 'border-t border-gray-100' : ''}`}
                  >
                    <button
                      onClick={() => playItem(item.id, item.title)}
                      disabled={loadingItem === item.id}
                      className="p-2 bg-saffron text-white rounded-full hover:bg-saffron/90 transition-all flex-shrink-0 disabled:opacity-50"
                    >
                      {loadingItem === item.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Play className="w-3 h-3" />
                      )}
                    </button>
                    <span className="text-sm text-maroon flex-1">{item.title}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Video Library Section - Devotional YouTube Videos
function VideoLibrarySection({ isDesktop }) {
  const [library, setLibrary] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [activeCategory, setActiveCategory] = useState('bhajans');

  const categoryLabels = {
    bhajans: { name: 'Bhajans', icon: Music, color: 'from-orange-500 to-red-500' },
    aarti: { name: 'Aarti', icon: Flame, color: 'from-yellow-500 to-orange-500' },
    mantras: { name: 'Mantras', icon: BookOpen, color: 'from-purple-500 to-pink-500' },
    kirtans: { name: 'Kirtans', icon: Music, color: 'from-green-500 to-teal-500' },
    spiritual_talks: { name: 'Spiritual Talks', icon: MessageSquare, color: 'from-blue-500 to-indigo-500' },
    chalisas: { name: 'Chalisas', icon: ScrollText, color: 'from-saffron to-gold' },
  };

  useEffect(() => {
    fetchLibrary();
  }, []);

  const fetchLibrary = async () => {
    try {
      const res = await api.get('/api/video-library');
      setLibrary(res.data.data || {});
      // Set first available category as active
      const categories = Object.keys(res.data.data || {});
      if (categories.length > 0 && !categories.includes(activeCategory)) {
        setActiveCategory(categories[0]);
      }
    } catch (error) {
      console.error('Failed to load video library:', error);
      toast.error('Failed to load video library');
    } finally {
      setLoading(false);
    }
  };

  const categories = Object.keys(library);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 text-saffron animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center">
          <Play className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-cinzel font-semibold text-lg text-maroon">Devotional Videos</h2>
          <p className="text-xs text-gray-500">Curated bhajans, aartis & spiritual content</p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat) => {
          const catInfo = categoryLabels[cat] || { name: cat, icon: Play, color: 'from-gray-500 to-gray-600' };
          const IconComponent = catInfo.icon;
          return (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                setSelectedVideo(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? `bg-gradient-to-r ${catInfo.color} text-white`
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              data-testid={`video-cat-${cat}`}
            >
              <IconComponent className="w-4 h-4" />
              <span className="text-sm font-medium">{catInfo.name}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeCategory === cat ? 'bg-white/20' : 'bg-gray-200'
              }`}>
                {library[cat]?.length || 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Video Player */}
      {selectedVideo && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black rounded-xl overflow-hidden"
        >
          <div className="relative pt-[56.25%]">
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube.com/embed/${selectedVideo.video_id}?autoplay=1&rel=0`}
              title={selectedVideo.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className="p-4 bg-gradient-to-r from-gray-900 to-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-white">{selectedVideo.title}</h3>
                <p className="text-sm text-gray-400">{selectedVideo.artist}</p>
              </div>
              <button
                onClick={() => setSelectedVideo(null)}
                className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Video Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {library[activeCategory]?.map((video) => (
          <motion.button
            key={video.video_id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedVideo(video)}
            className={`bg-white rounded-xl overflow-hidden shadow-sm border transition-all text-left ${
              selectedVideo?.video_id === video.video_id
                ? 'border-saffron ring-2 ring-saffron/20'
                : 'border-gray-100 hover:border-saffron/50'
            }`}
            data-testid={`video-${video.video_id}`}
          >
            {/* Thumbnail */}
            <div className="relative">
              <img
                src={video.thumbnail || `https://img.youtube.com/vi/${video.video_id}/mqdefault.jpg`}
                alt={video.title}
                className="w-full aspect-video object-cover"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center">
                  <Play className="w-6 h-6 text-white ml-1" fill="white" />
                </div>
              </div>
              {video.duration && (
                <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-0.5 rounded">
                  {video.duration}
                </span>
              )}
            </div>
            
            {/* Info */}
            <div className="p-3">
              <h4 className="font-medium text-gray-800 text-sm line-clamp-2">{video.title}</h4>
              <p className="text-xs text-gray-500 mt-1">{video.artist}</p>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Empty State */}
      {(!library[activeCategory] || library[activeCategory].length === 0) && (
        <div className="text-center py-10">
          <Play className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No videos in this category yet</p>
        </div>
      )}
    </div>
  );
}


// CalendarTab imported from ./devotee/components/CalendarTab

// PriestsTab imported from ./devotee/components/PriestsTab

// PriestDetailView and AstrologyTab have been moved to components/DevoteeDashboard/

function ProductDetailView({ product, productId, isDesktop, onBack, onAddToCart, ReviewComponents, cartCount, onOpenCart }) {
  const [productDetail, setProductDetail] = useState(product);
  const [loading, setLoading] = useState(!product);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    if (!product) {
      fetchProductDetail();
    }
  }, [productId]);

  const fetchProductDetail = async () => {
    try {
      const res = await api.get(`/api/products/${productId}`);
      setProductDetail(res.data);
    } catch (error) {
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    for (let i = 0; i < quantity; i++) {
      await onAddToCart(productId);
    }
  };

  if (loading) {
    return (
      <div className={`pb-24 lg:pb-8 ${isDesktop ? 'px-8' : 'px-4'} flex justify-center items-center py-20`}>
        <Loader2 className="w-8 h-8 text-saffron animate-spin" />
      </div>
    );
  }

  if (!productDetail) {
    return (
      <div className={`pb-24 lg:pb-8 ${isDesktop ? 'px-8' : 'px-4'} text-center py-20`}>
        <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Product not found</p>
        <button onClick={onBack} className="mt-4 text-saffron hover:underline">
          Back to Shop
        </button>
      </div>
    );
  }

  const images = productDetail.images || [];
  const hasVideo = productDetail.video_url;

  return (
    <div className={`pb-24 lg:pb-8 ${isDesktop ? 'px-8' : 'px-4'}`}>
      {/* Header */}
      <div className="flex items-center justify-between py-4 mb-4">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-saffron transition-colors"
          data-testid="back-to-shop"
        >
          <ArrowRight className="w-5 h-5 rotate-180" />
          <span>Back to Shop</span>
        </button>
        <button 
          onClick={onOpenCart}
          className="relative p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow"
        >
          <ShoppingCart className="w-6 h-6 text-saffron" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      <div className={`${isDesktop ? 'grid grid-cols-2 gap-12' : ''}`}>
        {/* Product Images */}
        <div className="mb-6 lg:mb-0">
          {/* Main Image/Video */}
          <div className="aspect-square bg-orange-50 rounded-2xl overflow-hidden mb-4 relative">
            {showVideo && hasVideo ? (
              <video 
                src={productDetail.video_url} 
                controls 
                autoPlay
                className="w-full h-full object-cover"
              />
            ) : images[selectedImage] ? (
              <img 
                src={images[selectedImage]} 
                alt={productDetail.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ShoppingBag className="w-20 h-20 text-saffron/30" />
              </div>
            )}
            
            {/* Video Toggle */}
            {hasVideo && (
              <button
                onClick={() => setShowVideo(!showVideo)}
                className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2 hover:bg-white transition-colors"
              >
                {showVideo ? (
                  <>
                    <Camera className="w-4 h-4 text-saffron" />
                    <span className="text-sm">Photos</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 text-saffron" />
                    <span className="text-sm">Video</span>
                  </>
                )}
              </button>
            )}
          </div>
          
          {/* Thumbnail Images */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => { setSelectedImage(idx); setShowVideo(false); }}
                  className={`w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${
                    selectedImage === idx && !showVideo ? 'border-saffron' : 'border-transparent'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <p className="text-sm text-saffron mb-1">{productDetail.category}</p>
          <h1 className="font-cinzel text-2xl lg:text-3xl font-bold text-maroon mb-2">
            {productDetail.name}
          </h1>
          
          {/* Rating */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star}
                  className={`w-5 h-5 ${
                    star <= Math.round(productDetail.rating || 0)
                      ? 'fill-gold text-gold'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-500">
              {productDetail.rating?.toFixed(1) || '0.0'} ({productDetail.total_reviews || 0} reviews)
            </span>
          </div>
          
          {/* Shop */}
          <p className="text-sm text-gray-500 mb-4">
            Sold by <span className="font-medium text-gray-700">{productDetail.shop_name}</span>
          </p>
          
          {/* Price */}
          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-3xl font-bold text-saffron">₹{productDetail.price}</span>
            {productDetail.stock > 0 ? (
              <span className="text-sm text-green-600">In Stock ({productDetail.stock} available)</span>
            ) : (
              <span className="text-sm text-red-500">Out of Stock</span>
            )}
          </div>
          
          {/* Description */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-800 mb-2">Description</h3>
            <p className="text-gray-600 leading-relaxed">{productDetail.description}</p>
          </div>
          
          {/* Quantity & Add to Cart */}
          {productDetail.stock > 0 && (
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-2 bg-orange-50 rounded-full p-1">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-gray-50"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(productDetail.stock, quantity + 1))}
                  className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-gray-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              <button
                onClick={handleAddToCart}
                className="flex-1 py-4 bg-saffron text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                data-testid="add-to-cart-detail"
              >
                <ShoppingCart className="w-5 h-5" />
                Add to Cart
              </button>
            </div>
          )}
          
          {/* Stock Warning */}
          {productDetail.stock > 0 && productDetail.stock < 10 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6">
              <p className="text-amber-700 text-sm flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Only {productDetail.stock} items left - order soon!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      {ReviewComponents && (
        <div className="mt-12 pt-8 border-t border-orange-100">
          <ReviewComponents.default 
            productId={productId} 
            productName={productDetail.name}
          />
        </div>
      )}
    </div>
  );
}



// TestimonialSection, ClassVideoRoom, VideoTileClass, ClassesTab imported from ./devotee/components/ClassesTab

export default function DevoteeDashboard() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedPriest, setSelectedPriest] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const { user } = useAuth();
  const isDesktop = useIsDesktop();

  // Load unread message count
  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadUnreadCount = async () => {
    try {
      const res = await api.get('/api/chat/unread-count');
      setUnreadMessages(res.data.unread_count || 0);
    } catch (error) {
      // Silently fail - user might not be logged in yet
    }
  };

  // Handle priest detail view
  if (activeTab === 'priest-detail' && selectedPriest) {
    return (
      <div className={`min-h-screen bg-gradient-to-b from-cream to-parchment ${isDesktop ? 'lg:pl-64' : ''}`}>
        <Toaster position="top-center" richColors />
        {isDesktop && <Sidebar activeTab="priests" setActiveTab={setActiveTab} user={user} unreadMessages={unreadMessages} />}
        <PriestDetailView 
          priest={selectedPriest} 
          onBack={() => { setSelectedPriest(null); setActiveTab('priests'); }}
          isDesktop={isDesktop}
        />
        {!isDesktop && <BottomNav activeTab="priests" setActiveTab={setActiveTab} unreadMessages={unreadMessages} />}
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-b from-cream to-parchment ${isDesktop ? 'lg:pl-64' : ''}`}>
      <Toaster position="top-center" richColors />
      
      {isDesktop && <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} unreadMessages={unreadMessages} />}
      
      <div className={activeTab === 'astrology' ? '' : ''}>
        {activeTab === 'home' && (
          <HomeTab setActiveTab={setActiveTab} setSelectedPriest={setSelectedPriest} isDesktop={isDesktop} />
        )}
        {activeTab === 'messages' && (
          <>
            {!isDesktop && <MobileHeader title="Messages" onBack={() => setActiveTab('home')} />}
            <ChatTab isDesktop={isDesktop} />
          </>
        )}
        {activeTab === 'consultation' && (
          <>
            {!isDesktop && <MobileHeader title="Call Astrologer" onBack={() => setActiveTab('home')} />}
            <ConsultationTab isDesktop={isDesktop} />
          </>
        )}
        {activeTab === 'classes' && (
          <>
            {!isDesktop && <MobileHeader title="Vedic Classes" onBack={() => setActiveTab('home')} />}
            <ClassesTab isDesktop={isDesktop} />
          </>
        )}
        {activeTab === 'live' && (
          <>
            {!isDesktop && <MobileHeader title="Live Events" onBack={() => setActiveTab('home')} />}
            <LiveEventsTab isDesktop={isDesktop} />
          </>
        )}
        {activeTab === 'feed' && (
          <>
            {!isDesktop && <MobileHeader title="Spiritual Feed" onBack={() => setActiveTab('home')} />}
            <FeedTab isDesktop={isDesktop} />
          </>
        )}
        {activeTab === 'mantras' && (
          <>
            {!isDesktop && <MobileHeader title="Mantras & Music" onBack={() => setActiveTab('home')} />}
            <MantrasTab isDesktop={isDesktop} />
          </>
        )}
        {activeTab === 'calendar' && (
          <>
            {!isDesktop && <MobileHeader title="Panchang Calendar" onBack={() => setActiveTab('home')} />}
            <CalendarTab isDesktop={isDesktop} />
          </>
        )}
        {activeTab === 'scriptures' && (
          <>
            {!isDesktop && <MobileHeader title="Sacred Scriptures" onBack={() => setActiveTab('home')} />}
            <ScripturesTab isDesktop={isDesktop} />
          </>
        )}
        {activeTab === 'priests' && (
          <>
            {!isDesktop && <MobileHeader title="Find Priests" onBack={() => setActiveTab('home')} />}
            <PriestsTab setActiveTab={setActiveTab} setSelectedPriest={setSelectedPriest} isDesktop={isDesktop} />
          </>
        )}
        {activeTab === 'astrology' && (
          <>
            {!isDesktop && <MobileHeader title="Astrology" onBack={() => setActiveTab('home')} />}
            <AstrologyTab isDesktop={isDesktop} />
          </>
        )}
        {activeTab === 'shop' && (
          <>
            {!isDesktop && <MobileHeader title="Pooja Store" onBack={() => setActiveTab('home')} />}
            <ShopTab isDesktop={isDesktop} ProductDetailView={ProductDetailView} />
          </>
        )}
        {activeTab === 'profile' && (
          <>
            {!isDesktop && <MobileHeader title="My Profile" onBack={() => setActiveTab('home')} />}
            <ProfileTab isDesktop={isDesktop} />
          </>
        )}
      </div>
      
      {!isDesktop && <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} unreadMessages={unreadMessages} />}
    </div>
  );
}
