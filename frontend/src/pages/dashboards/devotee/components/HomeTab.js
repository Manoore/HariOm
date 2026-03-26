import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Calendar, ChevronRight, Loader2 } from 'lucide-react';
import api from '../../../../lib/api';
import { useAuth } from '../../../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../../../../components/LanguageSelector';
import { BellIcon3D, ZodiacIcon3D, CartIcon3D, TempleIcon3D } from './shared';
import { PostCard } from './FeedTab';

export function HomeTab({ setActiveTab, setSelectedPriest, isDesktop }) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [priests, setPriests] = useState([]);
  const [festivals, setFestivals] = useState([]);
  const [horoscope, setHoroscope] = useState(null);
  const [priestPosts, setPriestPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const requests = [
        api.get('/api/priests?limit=3'),
        api.get('/api/festivals/upcoming?limit=3'),
        api.get('/api/posts/feed?limit=5')
      ];
      if (user?.nakshatra || user?.date_of_birth) {
        requests.push(api.get('/api/horoscope/personalized'));
      }
      const results = await Promise.all(requests);
      setPriests(results[0].data.priests || []);
      setFestivals(results[1].data.festivals || []);
      setPriestPosts(results[2].data.posts || []);
      if (results[3]) setHoroscope(results[3].data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`pb-24 lg:pb-8 ${isDesktop ? 'px-8' : 'px-4'}`}>
      {/* Header */}
      <div className="pt-4 pb-6 flex items-start justify-between">
        <div>
          <p className="text-gray-500 text-sm">{t('dashboard.namaste')},</p>
          <button onClick={() => setActiveTab('profile')} className="text-left hover:opacity-80 transition-opacity" data-testid="home-user-name">
            <h1 className="font-cinzel text-2xl lg:text-3xl font-bold text-maroon hover:text-saffron transition-colors">
              {user?.name || 'Devotee'}
            </h1>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSelector className="text-gray-700" />
        </div>
      </div>

      {/* Personalized Daily Horoscope */}
      {horoscope && (
        <div className="mb-6">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-5 text-white shadow-lg">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="font-cinzel text-lg font-semibold">Today's Horoscope</h2>
                <p className="text-white/80 text-sm">
                  {horoscope.user_sign_name} ({horoscope.user_sign_hindi})
                  {horoscope.user_nakshatra && ` • ${horoscope.user_nakshatra}`}
                </p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-300 fill-yellow-300" />
              </div>
            </div>
            <p className="text-white/90 text-sm leading-relaxed mb-4">
              {horoscope.data?.daily_prediction?.prediction || "Today brings positive energy your way. Trust your instincts and embrace new opportunities."}
            </p>
            <div className="flex gap-4 text-sm">
              {horoscope.data?.daily_prediction?.lucky_number && (
                <div className="bg-white/20 px-3 py-1 rounded-full">Lucky No: {horoscope.data.daily_prediction.lucky_number}</div>
              )}
              {horoscope.data?.daily_prediction?.lucky_color && (
                <div className="bg-white/20 px-3 py-1 rounded-full">Color: {horoscope.data.daily_prediction.lucky_color}</div>
              )}
            </div>
            <button onClick={() => setActiveTab('astrology')} className="mt-4 text-sm text-white/80 hover:text-white flex items-center gap-1">
              View full horoscope <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Prompt to complete profile if no horoscope data */}
      {!horoscope && !loading && (
        <div className="mb-6">
          <div className="bg-gradient-to-r from-orange-100 to-amber-100 rounded-2xl p-5 border border-orange-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-saffron/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Star className="w-6 h-6 text-saffron" />
              </div>
              <div>
                <h3 className="font-cinzel text-maroon font-semibold mb-1">Get Your Daily Horoscope</h3>
                <p className="text-gray-600 text-sm mb-3">Complete your profile with your date of birth or nakshatra to receive personalized horoscope predictions.</p>
                <button onClick={() => setActiveTab('profile')} className="text-sm text-saffron font-medium hover:underline flex items-center gap-1">
                  Complete Profile <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions with 3D Icons */}
      <div className={`grid ${isDesktop ? 'grid-cols-4 gap-6' : 'grid-cols-4 gap-3'} mb-8`}>
        {[
          { Icon: BellIcon3D, label: 'Priests', tab: 'priests' },
          { Icon: ZodiacIcon3D, label: 'Horoscope', tab: 'astrology' },
          { Icon: CartIcon3D, label: 'Shop', tab: 'shop' },
          { Icon: TempleIcon3D, label: 'Temples', tab: 'temples' },
        ].map((item) => (
          <button
            key={item.label}
            onClick={() => setActiveTab(item.tab)}
            className={`bg-white rounded-2xl ${isDesktop ? 'p-6' : 'p-4'} shadow-sm border border-orange-50 active:scale-95 transition-transform hover:shadow-md flex flex-col items-center justify-center`}
            data-testid={`quick-${item.tab}`}
          >
            <item.Icon size={isDesktop ? "w-12 h-12" : "w-8 h-8"} />
            <span className={`${isDesktop ? 'text-base mt-2' : 'text-xs mt-1'} text-gray-600`}>{item.label}</span>
          </button>
        ))}
      </div>

      <div className={`${isDesktop ? 'grid grid-cols-2 gap-8' : ''}`}>
        {/* Upcoming Festivals */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-cinzel text-lg font-semibold text-maroon">Upcoming Festivals</h2>
            <button onClick={() => setActiveTab('calendar')} className="text-saffron text-sm">View all</button>
          </div>
          <div className={`${isDesktop ? 'grid grid-cols-1 gap-3' : 'flex gap-3 overflow-x-auto pb-2 -mx-4 px-4'} scrollbar-hide`}>
            {festivals.map((festival, idx) => (
              <div key={idx} className={`${isDesktop ? '' : 'flex-shrink-0 w-44'} bg-gradient-to-br ${
                festival.is_today ? 'from-gold to-amber-500' : festival.is_tomorrow ? 'from-saffron to-orange-500' : 'from-maroon to-maroon/80'
              } rounded-2xl p-4 text-white`}>
                <div className="flex items-start justify-between mb-2">
                  <Calendar className="w-5 h-5 opacity-80" />
                  {festival.is_today && <span className="bg-white/30 text-xs px-2 py-0.5 rounded-full">Today!</span>}
                  {festival.is_tomorrow && <span className="bg-white/30 text-xs px-2 py-0.5 rounded-full">Tomorrow</span>}
                </div>
                <p className="font-semibold text-sm">{festival.name}</p>
                <p className="text-xs opacity-80 mt-1">{festival.display_date}</p>
                <p className="text-xs opacity-70 mt-0.5">{festival.days_until === 0 ? 'Today' : `${festival.days_until} days away`}</p>
              </div>
            ))}
            {festivals.length === 0 && <div className="text-center py-4 text-gray-500 text-sm">Loading festivals...</div>}
          </div>
        </div>

        {/* Featured Priests */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-cinzel text-lg font-semibold text-maroon">Featured Priests</h2>
            <button onClick={() => setActiveTab('priests')} className="text-saffron text-sm">See all</button>
          </div>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-saffron animate-spin" /></div>
          ) : (
            <div className="space-y-3">
              {priests.map((priest) => (
                <button
                  key={priest.id}
                  onClick={() => { setSelectedPriest(priest); setActiveTab('priest-detail'); }}
                  className="w-full bg-white rounded-2xl p-4 shadow-sm border border-orange-50 flex items-center gap-4 active:scale-[0.98] transition-transform text-left hover:shadow-md"
                  data-testid={`priest-${priest.id}`}
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-saffron to-gold rounded-full flex items-center justify-center text-white text-xl font-cinzel flex-shrink-0">
                    {priest.user_name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{priest.user_name}</p>
                    <p className="text-sm text-gray-500 truncate">{priest.specializations?.slice(0, 2).join(', ')}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Star className="w-3 h-3 text-gold fill-gold" />
                      <span className="text-xs text-gray-600">{priest.rating} ({priest.total_reviews})</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Priest Feed - Spiritual Updates */}
      {priestPosts.length > 0 && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-cinzel text-lg font-semibold text-maroon">Spiritual Updates</h2>
            <button onClick={() => setActiveTab('feed')} className="text-saffron text-sm">View all</button>
          </div>
          <div className="space-y-4">
            {priestPosts.slice(0, 3).map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
