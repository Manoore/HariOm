import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Star, MapPin, Filter, Loader2, ChevronRight, 
  Phone, Calendar, BookOpen, X, Languages, ChevronDown
} from 'lucide-react';
import api from '../../../../lib/api';
import { toast } from 'sonner';

export function PriestsTab({ setActiveTab, setSelectedPriest, isDesktop }) {
  const [priests, setPriests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');
  const [pujaTypeFilter, setPujaTypeFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [nearbyMode, setNearbyMode] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [pujaTypes, setPujaTypes] = useState([]);
  const [pujaCategories, setPujaCategories] = useState({});

  useEffect(() => {
    const loadPujaTypes = async () => {
      try {
        const res = await api.get('/api/puja-types');
        setPujaTypes(res.data.puja_types || []);
        setPujaCategories(res.data.categories || {});
      } catch (error) {
        console.error('Failed to load puja types:', error);
      }
    };
    loadPujaTypes();
  }, []);

  useEffect(() => {
    fetchPriests();
  }, [filter, locationFilter, languageFilter, pujaTypeFilter]);

  const fetchPriests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter) params.append('specialization', filter);
      if (locationFilter) params.append('location', locationFilter);
      if (languageFilter) params.append('language', languageFilter);
      if (pujaTypeFilter) params.append('puja_type', pujaTypeFilter);
      const queryString = params.toString() ? `?${params.toString()}` : '';
      const res = await api.get(`/api/priests${queryString}`);
      setPriests(res.data.priests || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNearbyPriests = async () => {
    setGettingLocation(true);
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });
      
      const { latitude, longitude } = position.coords;
      setUserLocation({ lat: latitude, lng: longitude });
      setNearbyMode(true);
      
      try {
        const geocodeRes = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.REACT_APP_GOOGLE_PLACES_API_KEY || 'AIzaSyBr3qP19Vxsv5jeLxccsM0OfK3DWssPTVQ'}`
        );
        const geocodeData = await geocodeRes.json();
        
        if (geocodeData.results && geocodeData.results[0]) {
          const addressComponents = geocodeData.results[0].address_components;
          const city = addressComponents.find(c => c.types.includes('locality'))?.long_name;
          const state = addressComponents.find(c => c.types.includes('administrative_area_level_1'))?.long_name;
          const postalCode = addressComponents.find(c => c.types.includes('postal_code'))?.long_name;
          
          if (city) {
            setLocationFilter(city);
            toast.success(`Showing priests near ${city}`);
          } else if (postalCode) {
            setLocationFilter(postalCode);
            toast.success(`Showing priests near ${postalCode}`);
          } else if (state) {
            setLocationFilter(state);
            toast.success(`Showing priests in ${state}`);
          }
        }
      } catch (geocodeError) {
        console.error('Geocoding error:', geocodeError);
        toast.error('Could not determine your city');
      }
    } catch (error) {
      console.error('Location error:', error);
      if (error.code === 1) {
        toast.error('Location access denied. Please enable location in your browser settings.');
      } else {
        toast.error('Could not get your location');
      }
      setNearbyMode(false);
    } finally {
      setGettingLocation(false);
    }
  };

  const clearFilters = () => {
    setFilter('');
    setLocationFilter('');
    setLanguageFilter('');
    setPujaTypeFilter('');
    setNearbyMode(false);
    setUserLocation(null);
  };

  const hasActiveFilters = filter || locationFilter || languageFilter || pujaTypeFilter;
  const languages = ['Hindi', 'Sanskrit', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Marathi', 'Bengali', 'Gujarati', 'English'];

  return (
    <div className={`pb-24 lg:pb-8 ${isDesktop ? 'px-8' : 'px-4'}`}>
      <div className="pt-4 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-cinzel text-2xl lg:text-3xl font-bold text-maroon">Book a Priest</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={getNearbyPriests}
              disabled={gettingLocation}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                nearbyMode
                  ? 'bg-green-500 text-white border-green-500'
                  : 'bg-white text-gray-600 border-orange-200 hover:border-green-500 hover:text-green-600'
              }`}
            >
              {gettingLocation ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
              <span className="text-sm font-medium">Near Me</span>
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                showFilters || hasActiveFilters
                  ? 'bg-saffron text-white border-saffron'
                  : 'bg-white text-gray-600 border-orange-200 hover:border-saffron'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Filters</span>
              {hasActiveFilters && (
                <span className="w-5 h-5 bg-white text-saffron text-xs rounded-full flex items-center justify-center font-bold">
                  {[filter, locationFilter, languageFilter].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white rounded-2xl border border-orange-100 p-4 mb-4 overflow-hidden"
            >
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <BookOpen className="w-4 h-4 inline mr-1" />
                    Puja / Service Type
                  </label>
                  <select
                    value={pujaTypeFilter}
                    onChange={(e) => setPujaTypeFilter(e.target.value)}
                    className="w-full px-4 py-2.5 border border-orange-200 rounded-xl focus:ring-2 focus:ring-saffron focus:border-transparent text-sm bg-white"
                    data-testid="puja-type-filter"
                  >
                    <option value="">All Puja Types</option>
                    {Object.entries(pujaCategories).map(([category, pujas]) => (
                      <optgroup key={category} label={category}>
                        {pujas.map(puja => (
                          <option key={puja.id} value={puja.name}>{puja.name}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Location
                  </label>
                  <input
                    type="text"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    placeholder="City or Pincode"
                    className="w-full px-4 py-2.5 border border-orange-200 rounded-xl focus:ring-2 focus:ring-saffron focus:border-transparent text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Languages className="w-4 h-4 inline mr-1" />
                    Language
                  </label>
                  <select
                    value={languageFilter}
                    onChange={(e) => setLanguageFilter(e.target.value)}
                    className="w-full px-4 py-2.5 border border-orange-200 rounded-xl focus:ring-2 focus:ring-saffron focus:border-transparent text-sm bg-white"
                  >
                    <option value="">All Languages</option>
                    {languages.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="w-full px-4 py-2.5 text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Clear Filters
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-saffron" />
          </div>
        ) : priests.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-orange-50">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-700 mb-1">No Priests Found</h3>
            <p className="text-gray-400 text-sm">Try adjusting your filters</p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="mt-4 text-saffron text-sm font-medium hover:underline">
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className={`grid ${isDesktop ? 'grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'} gap-4`}>
            {priests.map((priest) => (
              <motion.button
                key={priest.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => { setSelectedPriest(priest); setActiveTab('priest-detail'); }}
                className="bg-white rounded-2xl p-4 shadow-sm border border-orange-50 text-left hover:shadow-md transition-all"
                data-testid={`priest-card-${priest.id}`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-saffron to-gold rounded-full flex items-center justify-center text-white text-xl font-cinzel flex-shrink-0">
                    {priest.user_name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{priest.user_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Star className="w-3.5 h-3.5 text-gold fill-gold" />
                      <span className="text-sm text-gray-600">{priest.rating}</span>
                      <span className="text-xs text-gray-400">({priest.total_reviews} reviews)</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1 truncate">
                      {priest.specializations?.slice(0, 2).join(', ')}
                    </p>
                    {priest.location && (
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {typeof priest.location === 'object' 
                          ? `${priest.location.city || ''}${priest.location.city && priest.location.state ? ', ' : ''}${priest.location.state || ''}`
                          : priest.location
                        }
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
                </div>
                {priest.languages && priest.languages.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {priest.languages.slice(0, 3).map(lang => (
                      <span key={lang} className="text-xs bg-orange-50 text-saffron px-2 py-0.5 rounded-full">
                        {lang}
                      </span>
                    ))}
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
