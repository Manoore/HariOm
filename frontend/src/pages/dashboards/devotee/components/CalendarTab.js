import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../../../lib/api';

function CalendarTab({ isDesktop }) {
  const { t } = useTranslation();
  const [panchang, setPanchang] = useState(null);
  const [upcomingFestivals, setUpcomingFestivals] = useState([]);
  const [monthPanchang, setMonthPanchang] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [view, setView] = useState('today'); // 'today', 'calendar', 'festivals'

  useEffect(() => {
    fetchPanchang();
    fetchUpcomingFestivals();
  }, []);

  useEffect(() => {
    if (view === 'calendar') {
      fetchMonthPanchang();
    }
  }, [selectedMonth, selectedYear, view]);

  const fetchPanchang = async () => {
    try {
      const res = await api.get('/api/panchang/today');
      setPanchang(res.data);
    } catch (error) {
      console.error('Failed to fetch panchang:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUpcomingFestivals = async () => {
    try {
      const res = await api.get('/api/festivals/upcoming?limit=15');
      setUpcomingFestivals(res.data.festivals || []);
    } catch (error) {
      console.error('Failed to fetch festivals:', error);
    }
  };

  const fetchMonthPanchang = async () => {
    try {
      const res = await api.get(`/api/panchang/month?year=${selectedYear}&month=${selectedMonth}`);
      setMonthPanchang(res.data);
    } catch (error) {
      console.error('Failed to fetch month panchang:', error);
    }
  };

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
      <div className="bg-gradient-to-r from-maroon to-maroon/80 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3">
          <Calendar className="w-8 h-8" />
          <div>
            <h2 className="font-cinzel text-xl font-bold">{t('panchang.title')}</h2>
            <p className="text-white/80 text-sm">{t('panchang.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'today', label: t('astrology.panchang.today') },
          { id: 'festivals', label: t('festivals.upcoming') },
          { id: 'calendar', label: t('festivals.calendar') },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              view === tab.id ? 'bg-saffron text-white' : 'bg-cream text-maroon hover:bg-saffron/20'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Today's Panchang */}
      {view === 'today' && panchang && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Date Header */}
          <div className="bg-gradient-to-r from-saffron/20 to-gold/20 rounded-xl p-4">
            <div className="text-center">
              <p className="text-3xl font-cinzel font-bold text-maroon">{new Date().getDate()}</p>
              <p className="text-lg text-gray-700">{panchang.day_name}</p>
              <p className="text-sm text-saffron font-medium">{panchang.hindu_month} • {panchang.vara?.name}</p>
            </div>
          </div>

          {/* Panchang Details Grid */}
          <div className={`grid ${isDesktop ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-4`}>
            {/* Tithi */}
            <div className="bg-white rounded-xl p-4 border border-saffron/10">
              <p className="text-xs text-gray-500 uppercase mb-1">{t('panchang.tithi')}</p>
              <p className="font-semibold text-maroon">{panchang.tithi?.name}</p>
              <p className="text-sm text-gray-600">{panchang.tithi?.paksha} {t('panchang.paksha')}</p>
            </div>

            {/* Nakshatra */}
            <div className="bg-white rounded-xl p-4 border border-saffron/10">
              <p className="text-xs text-gray-500 uppercase mb-1">{t('panchang.nakshatra')}</p>
              <p className="font-semibold text-maroon">{panchang.nakshatra?.name}</p>
            </div>

            {/* Yoga */}
            <div className="bg-white rounded-xl p-4 border border-saffron/10">
              <p className="text-xs text-gray-500 uppercase mb-1">{t('panchang.yoga')}</p>
              <p className="font-semibold text-maroon">{panchang.yoga?.name}</p>
            </div>

            {/* Karana */}
            <div className="bg-white rounded-xl p-4 border border-saffron/10">
              <p className="text-xs text-gray-500 uppercase mb-1">{t('panchang.karana')}</p>
              <p className="font-semibold text-maroon">{panchang.karana?.name}</p>
            </div>

            {/* Sunrise */}
            <div className="bg-white rounded-xl p-4 border border-saffron/10">
              <p className="text-xs text-gray-500 uppercase mb-1">{t('astrology.panchang.sunrise')}</p>
              <p className="font-semibold text-maroon">{panchang.sunrise}</p>
            </div>

            {/* Sunset */}
            <div className="bg-white rounded-xl p-4 border border-saffron/10">
              <p className="text-xs text-gray-500 uppercase mb-1">{t('astrology.panchang.sunset')}</p>
              <p className="font-semibold text-maroon">{panchang.sunset}</p>
            </div>
          </div>

          {/* Vara Deity */}
          <div className="bg-gradient-to-r from-gold/20 to-saffron/20 rounded-xl p-4">
            <p className="text-center">
              <span className="text-gray-600">Today is ruled by </span>
              <span className="font-semibold text-maroon">{panchang.vara?.deity}</span>
              <span className="text-gray-600"> ({panchang.vara?.name})</span>
            </p>
          </div>
        </motion.div>
      )}

      {/* Upcoming Festivals */}
      {view === 'festivals' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          {upcomingFestivals.map((festival, idx) => (
            <div
              key={idx}
              className={`bg-white rounded-xl p-4 border transition-all ${
                festival.is_today 
                  ? 'border-gold bg-gold/10' 
                  : festival.is_tomorrow 
                    ? 'border-saffron/50' 
                    : 'border-saffron/10'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`text-center min-w-[60px] p-2 rounded-lg ${
                  festival.is_today ? 'bg-gold text-maroon' : 'bg-saffron/10'
                }`}>
                  <p className="text-lg font-bold text-maroon">
                    {new Date(festival.date).getDate()}
                  </p>
                  <p className="text-xs text-gray-600">
                    {new Date(festival.date).toLocaleString('default', { month: 'short' })}
                  </p>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-maroon">{festival.name}</h3>
                    {festival.is_today && (
                      <span className="bg-gold text-maroon text-xs px-2 py-0.5 rounded-full">Today!</span>
                    )}
                    {festival.is_tomorrow && (
                      <span className="bg-saffron/20 text-saffron text-xs px-2 py-0.5 rounded-full">Tomorrow</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{festival.description}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {festival.day_name} • {festival.days_until === 0 ? 'Today' : `${festival.days_until} days away`}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Monthly Calendar View */}
      {view === 'calendar' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Month Selector */}
          <div className="flex items-center justify-between bg-white rounded-xl p-3 border border-saffron/10">
            <button
              onClick={() => {
                if (selectedMonth === 1) {
                  setSelectedMonth(12);
                  setSelectedYear(selectedYear - 1);
                } else {
                  setSelectedMonth(selectedMonth - 1);
                }
              }}
              className="p-2 hover:bg-saffron/10 rounded-lg transition-all"
            >
              <ChevronRight className="w-5 h-5 text-maroon rotate-180" />
            </button>
            <div className="text-center">
              <p className="font-semibold text-maroon">
                {new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long' })} {selectedYear}
              </p>
            </div>
            <button
              onClick={() => {
                if (selectedMonth === 12) {
                  setSelectedMonth(1);
                  setSelectedYear(selectedYear + 1);
                } else {
                  setSelectedMonth(selectedMonth + 1);
                }
              }}
              className="p-2 hover:bg-saffron/10 rounded-lg transition-all"
            >
              <ChevronRight className="w-5 h-5 text-maroon" />
            </button>
          </div>

          {/* Calendar Grid */}
          {monthPanchang && (
            <div className="bg-white rounded-xl border border-saffron/10 overflow-hidden">
              {/* Weekday Headers */}
              <div className="grid grid-cols-7 bg-saffron/10">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="p-2 text-center text-xs font-medium text-maroon">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7">
                {/* Empty cells for days before month starts */}
                {Array.from({ length: new Date(selectedYear, selectedMonth - 1, 1).getDay() }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="p-2 border-t border-r border-gray-100" />
                ))}
                
                {/* Actual days */}
                {monthPanchang.days?.map((day) => {
                  const isToday = day.date === new Date().toISOString().split('T')[0];
                  return (
                    <div
                      key={day.day}
                      className={`p-2 border-t border-r border-gray-100 min-h-[70px] ${
                        isToday ? 'bg-saffron/10' : ''
                      }`}
                    >
                      <p className={`text-sm font-medium ${isToday ? 'text-saffron' : 'text-maroon'}`}>
                        {day.day}
                      </p>
                      <p className="text-xs text-gray-500 truncate" title={day.tithi}>
                        {day.tithi}
                      </p>
                      <p className="text-xs text-gray-400 truncate" title={day.nakshatra}>
                        {day.nakshatra}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

export { CalendarTab };
