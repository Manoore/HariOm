import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Sun, Search, Loader2, ChevronRight, MapPin, Calendar } from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';

function AstrologyTab({ isDesktop }) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState('horoscope');
  const [signs] = useState([
    { name: 'Aries', nameKey: 'aries', symbol: '♈', dates: 'Mar 21 - Apr 19' },
    { name: 'Taurus', nameKey: 'taurus', symbol: '♉', dates: 'Apr 20 - May 20' },
    { name: 'Gemini', nameKey: 'gemini', symbol: '♊', dates: 'May 21 - Jun 20' },
    { name: 'Cancer', nameKey: 'cancer', symbol: '♋', dates: 'Jun 21 - Jul 22' },
    { name: 'Leo', nameKey: 'leo', symbol: '♌', dates: 'Jul 23 - Aug 22' },
    { name: 'Virgo', nameKey: 'virgo', symbol: '♍', dates: 'Aug 23 - Sep 22' },
    { name: 'Libra', nameKey: 'libra', symbol: '♎', dates: 'Sep 23 - Oct 22' },
    { name: 'Scorpio', nameKey: 'scorpio', symbol: '♏', dates: 'Oct 23 - Nov 21' },
    { name: 'Sagittarius', nameKey: 'sagittarius', symbol: '♐', dates: 'Nov 22 - Dec 21' },
    { name: 'Capricorn', nameKey: 'capricorn', symbol: '♑', dates: 'Dec 22 - Jan 19' },
    { name: 'Aquarius', nameKey: 'aquarius', symbol: '♒', dates: 'Jan 20 - Feb 18' },
    { name: 'Pisces', nameKey: 'pisces', symbol: '♓', dates: 'Feb 19 - Mar 20' },
  ]);
  const [selectedSign, setSelectedSign] = useState(null);
  const [horoscope, setHoroscope] = useState(null);
  const [personalHoroscope, setPersonalHoroscope] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Location search states
  const [locationSearch, setLocationSearch] = useState('');
  const [locationResults, setLocationResults] = useState([]);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [locationSelected, setLocationSelected] = useState(false); // Track if location was just selected
  const [brideLocationSearch, setBrideLocationSearch] = useState('');
  const [brideLocationResults, setBrideLocationResults] = useState([]);
  const [brideLocationSelected, setBrideLocationSelected] = useState(false);
  const [groomLocationSearch, setGroomLocationSearch] = useState('');
  const [groomLocationResults, setGroomLocationResults] = useState([]);
  const [groomLocationSelected, setGroomLocationSelected] = useState(false);
  
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
    { id: 'horoscope', label: t('astrology.horoscope.title'), icon: Sun },
    { id: 'kundali', label: t('astrology.kundali.title'), icon: Star },
    { id: 'matching', label: t('astrology.kundali.matching'), icon: Calendar }
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
      // Backend returns 'results' not 'predictions'
      setResults(res.data.results || []);
    } catch (error) {
      console.error('Location search failed:', error);
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  // Get place details
  const getPlaceDetails = async (placeId, setForm, formKey) => {
    try {
      const res = await api.get(`/api/places/details/${placeId}`);
      // Backend returns { status, data: { latitude, longitude, formatted_address, ... } }
      const placeData = res.data.data || res.data;
      const lat = placeData.latitude || placeData.lat;
      const lng = placeData.longitude || placeData.lng;
      const formatted_address = placeData.formatted_address;
      
      if (formKey === 'kundali') {
        setKundaliForm(prev => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          location: formatted_address
        }));
        setLocationSelected(true);  // Mark that location was selected
        setLocationSearch(formatted_address);
        setLocationResults([]);
      } else if (formKey === 'bride') {
        setMatchingForm(prev => ({
          ...prev,
          bride_latitude: lat,
          bride_longitude: lng,
          bride_location: formatted_address
        }));
        setBrideLocationSelected(true);
        setBrideLocationSearch(formatted_address);
        setBrideLocationResults([]);
      } else if (formKey === 'groom') {
        setMatchingForm(prev => ({
          ...prev,
          groom_latitude: lat,
          groom_longitude: lng,
          groom_location: formatted_address
        }));
        setGroomLocationSelected(true);
        setGroomLocationSearch(formatted_address);
        setGroomLocationResults([]);
      }
    } catch (error) {
      console.error('Place details error:', error);
      toast.error('Failed to get location details');
    }
  };

  // Debounced search effect for main location
  useEffect(() => {
    // Skip search if location was just selected programmatically
    if (locationSelected) {
      setLocationSelected(false);
      return;
    }
    // Skip search if the value matches the already selected location
    if (kundaliForm.latitude && locationSearch === kundaliForm.location) {
      return;
    }
    const timer = setTimeout(() => {
      searchLocation(locationSearch, setLocationResults, setSearchingLocation);
    }, 300);
    return () => clearTimeout(timer);
  }, [locationSearch, locationSelected, kundaliForm.latitude, kundaliForm.location]);

  // Debounced search for bride location
  useEffect(() => {
    if (brideLocationSelected) {
      setBrideLocationSelected(false);
      return;
    }
    if (matchingForm.bride_latitude && brideLocationSearch === matchingForm.bride_location) {
      return;
    }
    const timer = setTimeout(() => {
      searchLocation(brideLocationSearch, setBrideLocationResults, () => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [brideLocationSearch, brideLocationSelected, matchingForm.bride_latitude, matchingForm.bride_location]);

  // Debounced search for groom location
  useEffect(() => {
    if (groomLocationSelected) {
      setGroomLocationSelected(false);
      return;
    }
    if (matchingForm.groom_latitude && groomLocationSearch === matchingForm.groom_location) {
      return;
    }
    const timer = setTimeout(() => {
      searchLocation(groomLocationSearch, setGroomLocationResults, () => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [groomLocationSearch, groomLocationSelected, matchingForm.groom_latitude, matchingForm.groom_location]);

  const fetchHoroscope = async (sign) => {
    setLoading(true);
    try {
      // Pass the current language to the API
      const currentLang = i18n.language || 'en';
      const res = await api.get(`/api/horoscope/daily/${sign.name.toLowerCase()}?lang=${currentLang}`);
      // Handle nested data structure from API
      const data = res.data;
      const prediction = data?.data?.daily_prediction || data;
      setHoroscope({
        horoscope: prediction?.prediction || prediction?.horoscope || t('astrology.horoscope.defaultPrediction', 'Your cosmic energy is aligned today. Focus on your goals and embrace new opportunities.'),
        lucky_number: prediction?.lucky_number,
        lucky_color: prediction?.lucky_color,
        sign_name: data?.sign_name || sign.name,
        sign_name_localized: data?.sign_name_localized || t(`astrology.signs.${sign.nameKey}`),
        sign_name_hindi: data?.sign_name_hindi
      });
      setSelectedSign(sign);
    } catch (error) {
      console.error('Horoscope error:', error);
      toast.error(t('errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  const fetchKundali = async () => {
    if (!kundaliForm.datetime || !kundaliForm.latitude) {
      toast.error(t('errors.generic'));
      return;
    }
    setLoading(true);
    try {
      const dt = new Date(kundaliForm.datetime);
      // Format datetime as ISO string for the API
      const datetimeStr = dt.toISOString();
      const res = await api.post('/api/astrology/birth-kundali', {
        datetime: datetimeStr,
        latitude: kundaliForm.latitude,
        longitude: kundaliForm.longitude
      });
      setKundaliResult(res.data);
    } catch (error) {
      console.error('Kundali error:', error);
      toast.error(t('errors.generic'));
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
        <h1 className="font-cinzel text-2xl lg:text-3xl font-bold text-maroon">{t('astrology.title')}</h1>
        <p className="text-gray-500 text-sm mt-1">{t('astrology.kundali.subtitle')}</p>
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
                <span className="text-sm font-medium">{t(`astrology.signs.${sign.nameKey}`)}</span>
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
                  <h3 className="font-cinzel text-xl font-bold text-maroon">{t(`astrology.signs.${selectedSign?.nameKey}`)}</h3>
                  <p className="text-gray-500 text-sm">{t('astrology.horoscope.todaysHoroscope')}</p>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed">{horoscope.horoscope}</p>
              {horoscope.lucky_number && (
                <div className="mt-4 flex gap-4">
                  <div className="bg-white rounded-xl px-4 py-2">
                    <span className="text-xs text-gray-500">{t('astrology.horoscope.luckyNumber')}</span>
                    <p className="font-bold text-saffron">{horoscope.lucky_number}</p>
                  </div>
                  {horoscope.lucky_color && (
                    <div className="bg-white rounded-xl px-4 py-2">
                      <span className="text-xs text-gray-500">{t('astrology.horoscope.luckyColor')}</span>
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
            <h3 className="font-cinzel text-lg font-semibold text-maroon mb-4">{t('astrology.kundali.result.birthChart')}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('astrology.kundali.form.dob')} & {t('astrology.kundali.form.tob')}</label>
                <input
                  type="datetime-local"
                  value={kundaliForm.datetime}
                  onChange={(e) => setKundaliForm({ ...kundaliForm, datetime: e.target.value })}
                  className="w-full border border-orange-200 rounded-xl px-4 py-3 focus:border-saffron focus:ring-2 focus:ring-saffron/20 outline-none"
                />
              </div>
              
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('astrology.kundali.form.pob')}</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    data-testid="kundali-location-input"
                    value={locationSearch}
                    onChange={(e) => {
                      setLocationSearch(e.target.value);
                      // Clear coordinates when user manually edits the location
                      if (kundaliForm.latitude) {
                        setKundaliForm(prev => ({ ...prev, latitude: null, longitude: null }));
                      }
                    }}
                    placeholder={t('common.search') + '...'}
                    className="w-full border border-orange-200 rounded-xl pl-10 pr-4 py-3 focus:border-saffron focus:ring-2 focus:ring-saffron/20 outline-none"
                  />
                  {searchingLocation && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-saffron" />
                  )}
                </div>
                {locationResults.length > 0 && (
                  <div data-testid="kundali-location-dropdown" className="absolute z-10 w-full mt-1 bg-white border border-orange-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {locationResults.map((place) => (
                      <button
                        key={place.place_id}
                        data-testid={`location-option-${place.place_id}`}
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
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('astrology.kundali.form.generate')}
              </button>
            </div>
          </div>

          {kundaliResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6"
            >
              <h3 className="font-cinzel text-xl font-bold text-purple-900 mb-4">{t('astrology.kundali.result.birthChart')}</h3>
              
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/70 rounded-xl p-3">
                  <span className="text-xs text-gray-500">{t('astrology.panchang.nakshatra')}</span>
                  <p className="font-semibold text-purple-900">{kundaliResult.moon_sign || 'N/A'}</p>
                </div>
                <div className="bg-white/70 rounded-xl p-3">
                  <span className="text-xs text-gray-500">{t('astrology.panchang.nakshatra')}</span>
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
