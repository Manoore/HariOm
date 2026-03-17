import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Sun, Search, Loader2, ChevronRight, MapPin, Calendar } from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

function AstrologyTab({ isDesktop }) {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('horoscope');
  const [signs] = useState([
    { name: 'Aries', symbol: '♈', dates: 'Mar 21 - Apr 19' },
    { name: 'Taurus', symbol: '♉', dates: 'Apr 20 - May 20' },
    { name: 'Gemini', symbol: '♊', dates: 'May 21 - Jun 20' },
    { name: 'Cancer', symbol: '♋', dates: 'Jun 21 - Jul 22' },
    { name: 'Leo', symbol: '♌', dates: 'Jul 23 - Aug 22' },
    { name: 'Virgo', symbol: '♍', dates: 'Aug 23 - Sep 22' },
    { name: 'Libra', symbol: '♎', dates: 'Sep 23 - Oct 22' },
    { name: 'Scorpio', symbol: '♏', dates: 'Oct 23 - Nov 21' },
    { name: 'Sagittarius', symbol: '♐', dates: 'Nov 22 - Dec 21' },
    { name: 'Capricorn', symbol: '♑', dates: 'Dec 22 - Jan 19' },
    { name: 'Aquarius', symbol: '♒', dates: 'Jan 20 - Feb 18' },
    { name: 'Pisces', symbol: '♓', dates: 'Feb 19 - Mar 20' },
  ]);
  const [selectedSign, setSelectedSign] = useState(null);
  const [horoscope, setHoroscope] = useState(null);
  const [personalHoroscope, setPersonalHoroscope] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Location search states
  const [locationSearch, setLocationSearch] = useState('');
  const [locationResults, setLocationResults] = useState([]);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [brideLocationSearch, setBrideLocationSearch] = useState('');
  const [brideLocationResults, setBrideLocationResults] = useState([]);
  const [groomLocationSearch, setGroomLocationSearch] = useState('');
  const [groomLocationResults, setGroomLocationResults] = useState([]);
  
  // Kundali states
  const [kundaliForm, setKundaliForm] = useState({
    datetime: '',
    latitude: null,
    longitude: null,
    location: ''
  });
  const [kundaliResult, setKundaliResult] = useState(null);
  
  // Kundali Matching states
  const [matchingForm, setMatchingForm] = useState({
    bride_datetime: '',
    bride_location: '',
    bride_latitude: null,
    bride_longitude: null,
    groom_datetime: '',
    groom_location: '',
    groom_latitude: null,
    groom_longitude: null
  });
  const [matchingResult, setMatchingResult] = useState(null);

  const sections = [
    { id: 'horoscope', label: 'Daily Horoscope', icon: Sun },
    { id: 'kundali', label: 'Birth Chart', icon: Star },
    { id: 'matching', label: 'Kundali Matching', icon: Calendar }
  ];

  // Location search function
  const searchLocation = async (query, setResults, setSearching) => {
    if (!query || query.length < 3) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await api.get(`/api/places/autocomplete?query=${encodeURIComponent(query)}`);
      setResults(res.data.predictions || []);
    } catch (error) {
      console.error('Location search failed:', error);
    } finally {
      setSearching(false);
    }
  };

  // Get place details
  const getPlaceDetails = async (placeId, setForm, formKey) => {
    try {
      const res = await api.get(`/api/places/details/${placeId}`);
      const { lat, lng, formatted_address } = res.data;
      
      if (formKey === 'kundali') {
        setKundaliForm(prev => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          location: formatted_address
        }));
        setLocationSearch(formatted_address);
        setLocationResults([]);
      } else if (formKey === 'bride') {
        setMatchingForm(prev => ({
          ...prev,
          bride_latitude: lat,
          bride_longitude: lng,
          bride_location: formatted_address
        }));
        setBrideLocationSearch(formatted_address);
        setBrideLocationResults([]);
      } else if (formKey === 'groom') {
        setMatchingForm(prev => ({
          ...prev,
          groom_latitude: lat,
          groom_longitude: lng,
          groom_location: formatted_address
        }));
        setGroomLocationSearch(formatted_address);
        setGroomLocationResults([]);
      }
    } catch (error) {
      toast.error('Failed to get location details');
    }
  };

  // Debounced search effect for main location
  useEffect(() => {
    const timer = setTimeout(() => {
      searchLocation(locationSearch, setLocationResults, setSearchingLocation);
    }, 300);
    return () => clearTimeout(timer);
  }, [locationSearch]);

  // Debounced search for bride location
  useEffect(() => {
    const timer = setTimeout(() => {
      searchLocation(brideLocationSearch, setBrideLocationResults, () => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [brideLocationSearch]);

  // Debounced search for groom location
  useEffect(() => {
    const timer = setTimeout(() => {
      searchLocation(groomLocationSearch, setGroomLocationResults, () => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [groomLocationSearch]);

  const fetchHoroscope = async (sign) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/horoscope/daily/${sign.name.toLowerCase()}`);
      // Handle nested data structure from API
      const data = res.data;
      const prediction = data?.data?.daily_prediction || data;
      setHoroscope({
        horoscope: prediction?.prediction || prediction?.horoscope || "Your cosmic energy is aligned today. Focus on your goals and embrace new opportunities.",
        lucky_number: prediction?.lucky_number,
        lucky_color: prediction?.lucky_color,
        sign_name: data?.sign_name || sign.name,
        sign_name_hindi: data?.sign_name_hindi
      });
      setSelectedSign(sign);
    } catch (error) {
      console.error('Horoscope error:', error);
      toast.error('Failed to fetch horoscope');
    } finally {
      setLoading(false);
    }
  };

  const fetchKundali = async () => {
    if (!kundaliForm.datetime || !kundaliForm.latitude) {
      toast.error('Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      const dt = new Date(kundaliForm.datetime);
      const res = await api.post('/api/kundali', {
        year: dt.getFullYear(),
        month: dt.getMonth() + 1,
        day: dt.getDate(),
        hour: dt.getHours(),
        minute: dt.getMinutes(),
        latitude: kundaliForm.latitude,
        longitude: kundaliForm.longitude
      });
      setKundaliResult(res.data);
    } catch (error) {
      toast.error('Failed to generate birth chart');
    } finally {
      setLoading(false);
    }
  };

  const fetchMatching = async () => {
    if (!matchingForm.bride_datetime || !matchingForm.groom_datetime || 
        !matchingForm.bride_latitude || !matchingForm.groom_latitude) {
      toast.error('Please fill all fields for both bride and groom');
      return;
    }
    setLoading(true);
    try {
      const brideDt = new Date(matchingForm.bride_datetime);
      const groomDt = new Date(matchingForm.groom_datetime);
      
      const res = await api.post('/api/kundali-matching', {
        bride: {
          year: brideDt.getFullYear(),
          month: brideDt.getMonth() + 1,
          day: brideDt.getDate(),
          hour: brideDt.getHours(),
          minute: brideDt.getMinutes(),
          latitude: matchingForm.bride_latitude,
          longitude: matchingForm.bride_longitude
        },
        groom: {
          year: groomDt.getFullYear(),
          month: groomDt.getMonth() + 1,
          day: groomDt.getDate(),
          hour: groomDt.getHours(),
          minute: groomDt.getMinutes(),
          latitude: matchingForm.groom_latitude,
          longitude: matchingForm.groom_longitude
        }
      });
      setMatchingResult(res.data);
    } catch (error) {
      toast.error('Failed to calculate matching');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`pb-24 lg:pb-8 ${isDesktop ? 'px-8' : ''}`}>
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <h1 className="font-cinzel text-2xl lg:text-3xl font-bold text-maroon">Astrology</h1>
        <p className="text-gray-500 text-sm mt-1">Explore your cosmic journey</p>
      </div>

      {/* Section Tabs */}
      <div className="px-4 py-3">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                activeSection === section.id
                  ? 'bg-saffron text-white'
                  : 'bg-orange-50 text-gray-600 hover:bg-orange-100'
              }`}
            >
              <section.icon className="w-4 h-4" />
              {section.label}
            </button>
          ))}
        </div>
      </div>

      {/* Daily Horoscope Section */}
      {activeSection === 'horoscope' && (
        <div className="px-4">
          <div className={`grid ${isDesktop ? 'grid-cols-4' : 'grid-cols-3'} gap-3 mb-6`}>
            {signs.map((sign) => (
              <motion.button
                key={sign.name}
                onClick={() => fetchHoroscope(sign)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-4 rounded-2xl text-center transition-all ${
                  selectedSign?.name === sign.name
                    ? 'bg-saffron text-white shadow-lg'
                    : 'bg-white border border-orange-100 hover:border-saffron'
                }`}
              >
                <span className="text-3xl block mb-1">{sign.symbol}</span>
                <span className="text-sm font-medium">{sign.name}</span>
                <span className={`text-xs block ${selectedSign?.name === sign.name ? 'text-white/70' : 'text-gray-400'}`}>
                  {sign.dates}
                </span>
              </motion.button>
            ))}
          </div>

          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-saffron" />
            </div>
          )}

          {horoscope && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">{selectedSign?.symbol}</span>
                <div>
                  <h3 className="font-cinzel text-xl font-bold text-maroon">{selectedSign?.name}</h3>
                  <p className="text-gray-500 text-sm">Today's Horoscope</p>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed">{horoscope.horoscope}</p>
              {horoscope.lucky_number && (
                <div className="mt-4 flex gap-4">
                  <div className="bg-white rounded-xl px-4 py-2">
                    <span className="text-xs text-gray-500">Lucky Number</span>
                    <p className="font-bold text-saffron">{horoscope.lucky_number}</p>
                  </div>
                  {horoscope.lucky_color && (
                    <div className="bg-white rounded-xl px-4 py-2">
                      <span className="text-xs text-gray-500">Lucky Color</span>
                      <p className="font-bold text-saffron">{horoscope.lucky_color}</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}

      {/* Kundali (Birth Chart) Section */}
      {activeSection === 'kundali' && (
        <div className="px-4">
          <div className="bg-white rounded-2xl p-6 border border-orange-100 mb-6">
            <h3 className="font-cinzel text-lg font-semibold text-maroon mb-4">Generate Birth Chart</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date & Time of Birth</label>
                <input
                  type="datetime-local"
                  value={kundaliForm.datetime}
                  onChange={(e) => setKundaliForm({ ...kundaliForm, datetime: e.target.value })}
                  className="w-full border border-orange-200 rounded-xl px-4 py-3 focus:border-saffron focus:ring-2 focus:ring-saffron/20 outline-none"
                />
              </div>
              
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">Birth Place</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    placeholder="Search city..."
                    className="w-full border border-orange-200 rounded-xl pl-10 pr-4 py-3 focus:border-saffron focus:ring-2 focus:ring-saffron/20 outline-none"
                  />
                  {searchingLocation && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-saffron" />
                  )}
                </div>
                {locationResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-orange-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {locationResults.map((place) => (
                      <button
                        key={place.place_id}
                        onClick={() => getPlaceDetails(place.place_id, setKundaliForm, 'kundali')}
                        className="w-full px-4 py-2 text-left hover:bg-orange-50 text-sm"
                      >
                        {place.description}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={fetchKundali}
                disabled={loading || !kundaliForm.datetime || !kundaliForm.latitude}
                className="w-full bg-saffron hover:bg-saffron-dark text-white rounded-full py-4 font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generate Birth Chart'}
              </button>
            </div>
          </div>

          {kundaliResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6"
            >
              <h3 className="font-cinzel text-xl font-bold text-purple-900 mb-4">Your Birth Chart</h3>
              
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/70 rounded-xl p-3">
                  <span className="text-xs text-gray-500">Moon Sign</span>
                  <p className="font-semibold text-purple-900">{kundaliResult.moon_sign || 'N/A'}</p>
                </div>
                <div className="bg-white/70 rounded-xl p-3">
                  <span className="text-xs text-gray-500">Nakshatra</span>
                  <p className="font-semibold text-purple-900">{kundaliResult.nakshatra || 'N/A'}</p>
                </div>
                <div className="bg-white/70 rounded-xl p-3">
                  <span className="text-xs text-gray-500">Ascendant</span>
                  <p className="font-semibold text-purple-900">{kundaliResult.ascendant || 'N/A'}</p>
                </div>
                <div className="bg-white/70 rounded-xl p-3">
                  <span className="text-xs text-gray-500">Yoga</span>
                  <p className="font-semibold text-purple-900">{kundaliResult.yoga || 'N/A'}</p>
                </div>
              </div>

              {/* Planetary Positions */}
              {kundaliResult.planets && (
                <div>
                  <h4 className="font-semibold text-purple-900 mb-3">Planetary Positions</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(kundaliResult.planets).map(([planet, data]) => (
                      <div key={planet} className="bg-white/50 rounded-lg p-2 text-center">
                        <span className="text-xs text-gray-500 block">{planet}</span>
                        <span className="text-sm font-medium text-purple-900">
                          {typeof data === 'object' ? data.sign : data}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}

      {/* Kundali Matching Section */}
      {activeSection === 'matching' && (
        <div className="px-4">
          <div className={`${isDesktop ? 'grid grid-cols-2 gap-6' : 'space-y-6'}`}>
            {/* Bride Details */}
            <div className="bg-pink-50 rounded-2xl p-6">
              <h3 className="font-cinzel text-lg font-semibold text-pink-900 mb-4">Bride Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date & Time of Birth</label>
                  <input
                    type="datetime-local"
                    value={matchingForm.bride_datetime}
                    onChange={(e) => setMatchingForm({ ...matchingForm, bride_datetime: e.target.value })}
                    className="w-full border border-pink-200 rounded-xl px-4 py-3 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
                  />
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Birth Place</label>
                  <input
                    type="text"
                    value={brideLocationSearch}
                    onChange={(e) => setBrideLocationSearch(e.target.value)}
                    placeholder="Search city..."
                    className="w-full border border-pink-200 rounded-xl px-4 py-3 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
                  />
                  {brideLocationResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-pink-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {brideLocationResults.map((place) => (
                        <button
                          key={place.place_id}
                          onClick={() => getPlaceDetails(place.place_id, setMatchingForm, 'bride')}
                          className="w-full px-4 py-2 text-left hover:bg-pink-50 text-sm"
                        >
                          {place.description}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Groom Details */}
            <div className="bg-blue-50 rounded-2xl p-6">
              <h3 className="font-cinzel text-lg font-semibold text-blue-900 mb-4">Groom Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date & Time of Birth</label>
                  <input
                    type="datetime-local"
                    value={matchingForm.groom_datetime}
                    onChange={(e) => setMatchingForm({ ...matchingForm, groom_datetime: e.target.value })}
                    className="w-full border border-blue-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                  />
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Birth Place</label>
                  <input
                    type="text"
                    value={groomLocationSearch}
                    onChange={(e) => setGroomLocationSearch(e.target.value)}
                    placeholder="Search city..."
                    className="w-full border border-blue-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                  />
                  {groomLocationResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-blue-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {groomLocationResults.map((place) => (
                        <button
                          key={place.place_id}
                          onClick={() => getPlaceDetails(place.place_id, setMatchingForm, 'groom')}
                          className="w-full px-4 py-2 text-left hover:bg-blue-50 text-sm"
                        >
                          {place.description}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={fetchMatching}
            disabled={loading}
            className="w-full mt-6 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-full py-4 font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Calculate Compatibility'}
          </button>

          {matchingResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6"
            >
              <div className="text-center mb-6">
                <h3 className="font-cinzel text-2xl font-bold text-purple-900">Compatibility Score</h3>
                <div className="mt-4 inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-pink-400 to-purple-500">
                  <span className="text-4xl font-bold text-white">
                    {matchingResult.total_points || matchingResult.score || 'N/A'}
                  </span>
                </div>
                <p className="mt-2 text-gray-600">out of 36 points</p>
              </div>

              {matchingResult.aspects && (
                <div className="space-y-3">
                  {matchingResult.aspects.map((aspect, i) => (
                    <div key={i} className="bg-white/70 rounded-xl p-3 flex justify-between items-center">
                      <span className="font-medium text-gray-700">{aspect.name}</span>
                      <span className="text-purple-600 font-semibold">{aspect.points}/{aspect.max_points}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}

export default AstrologyTab;
