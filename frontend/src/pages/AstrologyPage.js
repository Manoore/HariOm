import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Sun, Moon, Star, Sparkles, Calendar, Clock, 
  ChevronRight, Loader2, ArrowRight
} from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Toaster, toast } from 'sonner';

const ZODIAC_ICONS = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋',
  Leo: '♌', Virgo: '♍', Libra: '♎', Scorpio: '♏',
  Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓'
};

export default function AstrologyPage() {
  const [activeTab, setActiveTab] = useState('horoscope');
  const [zodiacSigns, setZodiacSigns] = useState([]);
  const [selectedSign, setSelectedSign] = useState(null);
  const [horoscope, setHoroscope] = useState(null);
  const [birthChart, setBirthChart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [birthDetails, setBirthDetails] = useState({
    name: '',
    date_of_birth: '',
    time_of_birth: '',
    place_of_birth: ''
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchZodiacSigns();
  }, []);

  const fetchZodiacSigns = async () => {
    try {
      const res = await api.get('/api/horoscope/zodiac-signs');
      setZodiacSigns(res.data.signs || []);
    } catch (error) {
      console.error('Error fetching zodiac signs:', error);
    }
  };

  const fetchHoroscope = async (sign) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/horoscope/daily/${sign.toLowerCase()}`);
      setHoroscope(res.data);
      setSelectedSign(sign);
    } catch (error) {
      toast.error('Error fetching horoscope');
    } finally {
      setLoading(false);
    }
  };

  const generateBirthChart = async () => {
    if (!birthDetails.date_of_birth || !birthDetails.time_of_birth || !birthDetails.place_of_birth) {
      toast.error('Please fill all birth details');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/api/horoscope/birth-chart', birthDetails);
      setBirthChart(res.data);
      toast.success('Birth chart generated!');
    } catch (error) {
      toast.error('Error generating birth chart');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-12 cosmic-mode">
      <Toaster position="top-center" richColors />
      
      {/* Header */}
      <div className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1920)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-cosmic-bg/50 to-cosmic-bg" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center gap-2 bg-cosmic-accent/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4 text-cosmic-accent" />
              <span className="text-cosmic-text/80 text-sm">Cosmic Insights</span>
            </div>
            <h1 className="font-cinzel text-4xl md:text-5xl font-bold text-white mb-4">
              Astrology & Horoscope
            </h1>
            <p className="text-cosmic-text/70 max-w-2xl mx-auto">
              Discover your daily predictions, generate your birth chart, and explore the cosmic influences on your life
            </p>
          </motion.div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 -mt-6">
        <div className="flex justify-center gap-2 mb-8">
          <button
            onClick={() => setActiveTab('horoscope')}
            className={`px-6 py-3 rounded-full font-medium transition-all ${
              activeTab === 'horoscope' 
                ? 'bg-cosmic-accent text-white' 
                : 'bg-cosmic-surface text-cosmic-text/70 hover:bg-cosmic-surface/80'
            }`}
            data-testid="tab-horoscope"
          >
            Daily Horoscope
          </button>
          <button
            onClick={() => setActiveTab('birthchart')}
            className={`px-6 py-3 rounded-full font-medium transition-all ${
              activeTab === 'birthchart' 
                ? 'bg-cosmic-accent text-white' 
                : 'bg-cosmic-surface text-cosmic-text/70 hover:bg-cosmic-surface/80'
            }`}
            data-testid="tab-birthchart"
          >
            Birth Chart
          </button>
        </div>

        {/* Daily Horoscope Tab */}
        {activeTab === 'horoscope' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Zodiac Signs Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 mb-8">
              {zodiacSigns.map((sign) => (
                <button
                  key={sign.name}
                  onClick={() => fetchHoroscope(sign.name)}
                  className={`cosmic-card p-4 text-center hover:scale-105 transition-transform ${
                    selectedSign === sign.name ? 'ring-2 ring-cosmic-accent' : ''
                  }`}
                  data-testid={`zodiac-${sign.name.toLowerCase()}`}
                >
                  <span className="text-4xl mb-2 block">{ZODIAC_ICONS[sign.name]}</span>
                  <span className="font-cinzel text-sm text-white">{sign.name}</span>
                  <span className="text-xs text-cosmic-text/50 block">{sign.dates}</span>
                </button>
              ))}
            </div>

            {/* Horoscope Display */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-cosmic-accent animate-spin" />
              </div>
            ) : horoscope && (
              <motion.div 
                className="cosmic-card p-8 max-w-3xl mx-auto"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="text-center mb-6">
                  <span className="text-6xl mb-4 block">{ZODIAC_ICONS[selectedSign]}</span>
                  <h2 className="font-cinzel text-2xl font-bold text-white">{horoscope.zodiac_sign}</h2>
                  <p className="text-cosmic-accent">Today's Prediction</p>
                </div>

                <p className="text-cosmic-text/80 text-lg text-center mb-8 leading-relaxed">
                  {horoscope.daily_prediction}
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-cosmic-bg/50 rounded-xl p-4 text-center">
                    <span className="text-cosmic-accent text-sm">Lucky Number</span>
                    <p className="font-cinzel text-2xl text-white">{horoscope.lucky_number}</p>
                  </div>
                  <div className="bg-cosmic-bg/50 rounded-xl p-4 text-center">
                    <span className="text-cosmic-accent text-sm">Lucky Color</span>
                    <p className="font-cinzel text-lg text-white">{horoscope.lucky_color}</p>
                  </div>
                  <div className="bg-cosmic-bg/50 rounded-xl p-4 text-center">
                    <span className="text-cosmic-accent text-sm">Mood</span>
                    <p className="font-cinzel text-lg text-white">{horoscope.mood}</p>
                  </div>
                  <div className="bg-cosmic-bg/50 rounded-xl p-4 text-center">
                    <span className="text-cosmic-accent text-sm">Compatibility</span>
                    <p className="font-cinzel text-lg text-white">{horoscope.compatibility}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {!horoscope && !loading && (
              <div className="text-center py-16">
                <Star className="w-16 h-16 text-cosmic-accent/30 mx-auto mb-4" />
                <p className="text-cosmic-text/50">Select your zodiac sign to see your daily horoscope</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Birth Chart Tab */}
        {activeTab === 'birthchart' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="cosmic-card p-8">
              <h2 className="font-cinzel text-2xl font-bold text-white mb-6 text-center">
                Generate Your Birth Chart (Kundli)
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm text-cosmic-text/70 mb-2">Your Name</label>
                  <input
                    type="text"
                    value={birthDetails.name}
                    onChange={(e) => setBirthDetails({ ...birthDetails, name: e.target.value })}
                    className="w-full bg-cosmic-bg border border-cosmic-accent/30 rounded-lg px-4 py-3 text-white focus:border-cosmic-accent outline-none"
                    placeholder="Enter your name"
                    data-testid="birth-name"
                  />
                </div>
                <div>
                  <label className="block text-sm text-cosmic-text/70 mb-2">Date of Birth</label>
                  <input
                    type="date"
                    value={birthDetails.date_of_birth}
                    onChange={(e) => setBirthDetails({ ...birthDetails, date_of_birth: e.target.value })}
                    className="w-full bg-cosmic-bg border border-cosmic-accent/30 rounded-lg px-4 py-3 text-white focus:border-cosmic-accent outline-none"
                    data-testid="birth-date"
                  />
                </div>
                <div>
                  <label className="block text-sm text-cosmic-text/70 mb-2">Time of Birth</label>
                  <input
                    type="time"
                    value={birthDetails.time_of_birth}
                    onChange={(e) => setBirthDetails({ ...birthDetails, time_of_birth: e.target.value })}
                    className="w-full bg-cosmic-bg border border-cosmic-accent/30 rounded-lg px-4 py-3 text-white focus:border-cosmic-accent outline-none"
                    data-testid="birth-time"
                  />
                </div>
                <div>
                  <label className="block text-sm text-cosmic-text/70 mb-2">Place of Birth</label>
                  <input
                    type="text"
                    value={birthDetails.place_of_birth}
                    onChange={(e) => setBirthDetails({ ...birthDetails, place_of_birth: e.target.value })}
                    className="w-full bg-cosmic-bg border border-cosmic-accent/30 rounded-lg px-4 py-3 text-white focus:border-cosmic-accent outline-none"
                    placeholder="City, Country"
                    data-testid="birth-place"
                  />
                </div>
              </div>

              <button
                onClick={generateBirthChart}
                disabled={loading}
                className="w-full bg-cosmic-accent hover:bg-cosmic-accent/80 text-white rounded-full py-4 font-medium flex items-center justify-center gap-2 transition-colors"
                data-testid="generate-chart"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Generate Birth Chart <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>

            {/* Birth Chart Results */}
            {birthChart && (
              <motion.div 
                className="cosmic-card p-8 mt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h3 className="font-cinzel text-2xl font-bold text-white mb-6 text-center">
                  Your Birth Chart
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-cosmic-bg/50 rounded-xl p-6 text-center">
                    <Sun className="w-10 h-10 text-yellow-400 mx-auto mb-2" />
                    <span className="text-cosmic-text/70 text-sm">Sun Sign</span>
                    <p className="font-cinzel text-xl text-white">{birthChart.sun_sign}</p>
                  </div>
                  <div className="bg-cosmic-bg/50 rounded-xl p-6 text-center">
                    <Moon className="w-10 h-10 text-blue-300 mx-auto mb-2" />
                    <span className="text-cosmic-text/70 text-sm">Moon Sign</span>
                    <p className="font-cinzel text-xl text-white">{birthChart.moon_sign}</p>
                  </div>
                  <div className="bg-cosmic-bg/50 rounded-xl p-6 text-center">
                    <Star className="w-10 h-10 text-cosmic-accent mx-auto mb-2" />
                    <span className="text-cosmic-text/70 text-sm">Ascendant</span>
                    <p className="font-cinzel text-xl text-white">{birthChart.ascendant}</p>
                  </div>
                </div>

                {/* Nakshatra */}
                <div className="bg-cosmic-bg/50 rounded-xl p-6 mb-6">
                  <h4 className="font-cinzel text-lg text-white mb-4">Nakshatra</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-cosmic-text/70">Name</span>
                      <p className="text-white font-medium">{birthChart.nakshatra?.name}</p>
                    </div>
                    <div>
                      <span className="text-cosmic-text/70">Deity</span>
                      <p className="text-white font-medium">{birthChart.nakshatra?.deity}</p>
                    </div>
                    <div>
                      <span className="text-cosmic-text/70">Symbol</span>
                      <p className="text-white font-medium">{birthChart.nakshatra?.symbol}</p>
                    </div>
                    <div>
                      <span className="text-cosmic-text/70">Element</span>
                      <p className="text-white font-medium">{birthChart.nakshatra?.element}</p>
                    </div>
                  </div>
                </div>

                {/* Planetary Positions */}
                <div className="bg-cosmic-bg/50 rounded-xl p-6">
                  <h4 className="font-cinzel text-lg text-white mb-4">Planetary Positions</h4>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                    {Object.entries(birthChart.planetary_positions || {}).map(([planet, sign]) => (
                      <div key={planet} className="text-center">
                        <span className="text-cosmic-text/70 text-xs">{planet}</span>
                        <p className="text-white font-medium text-sm">{sign}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
