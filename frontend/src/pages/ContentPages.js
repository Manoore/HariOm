import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Star, Search, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../lib/api';

export function FestivalsPage() {
  const [festivals, setFestivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    fetchFestivals();
  }, []);

  const fetchFestivals = async () => {
    try {
      const res = await api.get('/api/festivals');
      setFestivals(res.data.festivals || []);
    } catch (error) {
      console.error('Error fetching festivals:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-12 bg-gradient-to-b from-cream to-parchment">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-cinzel text-3xl md:text-4xl font-bold text-maroon mb-2">
            {t('festivals.title')}
          </h1>
          <p className="text-gray-600">
            {t('festivals.subtitle')}
          </p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-saffron animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {festivals.map((festival, index) => (
              <motion.div 
                key={festival.id}
                className="card overflow-hidden"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex flex-col md:flex-row">
                  <div className={`p-6 md:w-48 flex-shrink-0 ${
                    festival.importance === 'Major' 
                      ? 'bg-gradient-to-br from-saffron to-gold' 
                      : 'bg-gradient-to-br from-maroon-light to-maroon'
                  }`}>
                    <Calendar className="w-8 h-8 text-white mb-2" />
                    <p className="text-white/80 text-sm">{formatDate(festival.date)}</p>
                  </div>
                  <div className="p-6 flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-cinzel text-xl font-bold text-maroon mb-2">
                          {festival.name}
                        </h3>
                        <p className="text-gray-600">{festival.description}</p>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full flex-shrink-0 ${
                        festival.importance === 'Major' 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {festival.importance}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function TemplesPage() {
  const [temples, setTemples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    fetchTemples();
  }, [search]);

  const fetchTemples = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('city', search);
      
      const res = await api.get(`/api/temples?${params.toString()}`);
      setTemples(res.data.temples || []);
    } catch (error) {
      console.error('Error fetching temples:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-12 bg-gradient-to-b from-cream to-parchment">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-cinzel text-3xl md:text-4xl font-bold text-maroon mb-2">
            {t('nav.temples')}
          </h1>
          <p className="text-gray-600">
            {t('landing.features.priests.desc')}
          </p>
        </motion.div>

        {/* Search */}
        <div className="card p-4 mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-12"
              placeholder={t('common.search') + '...'}
              data-testid="search-temples"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-saffron animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {temples.map((temple, index) => (
              <motion.div 
                key={temple.id}
                className="card overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="h-32 bg-gradient-to-br from-saffron to-gold flex items-center justify-center">
                  <span className="text-6xl">🛕</span>
                </div>
                <div className="p-6">
                  <h3 className="font-cinzel text-lg font-bold text-maroon mb-2">
                    {temple.name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <MapPin className="w-4 h-4" />
                    {temple.city}, {temple.state}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-saffron mb-3">
                    <Star className="w-4 h-4 fill-current" />
                    {temple.deity}
                  </div>
                  <p className="text-gray-600 text-sm">{temple.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && temples.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500">{t('common.noResults')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
