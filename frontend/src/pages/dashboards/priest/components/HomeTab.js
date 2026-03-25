import React from 'react';
import { Sun, Send, Heart, MessageCircle, CalendarDays, AlertCircle, BarChart3, Eye } from 'lucide-react';

// ==================== STAT CARD ====================
function StatCard({ icon: Icon, value, label, highlight }) {
  return (
    <div className={`rounded-xl p-3 text-center ${highlight ? 'bg-saffron/30' : 'bg-white/20'} backdrop-blur`}>
      <div className="flex items-center justify-center gap-1 mb-1">
        <Icon className="w-4 h-4 text-white/80" />
        <p className="text-xl font-bold text-white">{value}</p>
      </div>
      <p className="text-xs text-white/70">{label}</p>
    </div>
  );
}

// ==================== HOME TAB ====================
function HomeTab({ analytics, bookings, panchang, festivals, posts, updateStatus }) {
  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const upcomingBookings = bookings.filter(b => b.status === 'confirmed');
  const todayFestivals = festivals.slice(0, 3);
  const recentPosts = posts.slice(0, 3);

  const getPanchangValue = (value, fallback = '') => {
    if (!value) return fallback;
    if (typeof value === 'string') return value;
    if (typeof value === 'object') return value.name || value.value || fallback;
    return String(value);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Mobile Stats */}
      <div className="md:hidden grid grid-cols-4 gap-2">
        <div className="bg-white rounded-xl p-2 text-center shadow-sm">
          <p className="text-lg font-bold text-saffron">₹{analytics?.stats?.monthly_earnings || 0}</p>
          <p className="text-[10px] text-gray-500">Month</p>
        </div>
        <div className="bg-orange-50 rounded-xl p-2 text-center shadow-sm">
          <p className="text-lg font-bold text-orange-600">{pendingBookings.length}</p>
          <p className="text-[10px] text-gray-500">Pending</p>
        </div>
        <div className="bg-white rounded-xl p-2 text-center shadow-sm">
          <p className="text-lg font-bold text-blue-600">{analytics?.stats?.total_students || 0}</p>
          <p className="text-[10px] text-gray-500">Students</p>
        </div>
        <div className="bg-white rounded-xl p-2 text-center shadow-sm">
          <p className="text-lg font-bold text-gold">{analytics?.stats?.avg_rating || '4.8'}</p>
          <p className="text-[10px] text-gray-500">Rating</p>
        </div>
      </div>

      {/* Today's Panchang Quick View */}
      {panchang && (
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-3 md:p-4 border border-orange-100">
          <div className="flex items-center gap-2 mb-2 md:mb-3">
            <Sun className="w-4 h-4 md:w-5 md:h-5 text-saffron" />
            <h3 className="font-cinzel text-sm md:text-base font-semibold text-maroon">Today's Panchang</h3>
          </div>
          <div className="grid grid-cols-4 gap-2 md:gap-3 text-xs md:text-sm">
            <div>
              <p className="text-gray-500 text-[10px] md:text-xs">Tithi</p>
              <p className="font-medium text-gray-800">{getPanchangValue(panchang.tithi, 'Dashami')}</p>
            </div>
            <div>
              <p className="text-gray-500 text-[10px] md:text-xs">Nakshatra</p>
              <p className="font-medium text-gray-800">{getPanchangValue(panchang.nakshatra, 'Rohini')}</p>
            </div>
            <div>
              <p className="text-gray-500 text-[10px] md:text-xs">Sunrise</p>
              <p className="font-medium text-gray-800">{getPanchangValue(panchang.sunrise, '6:15 AM')}</p>
            </div>
            <div>
              <p className="text-gray-500 text-[10px] md:text-xs">Sunset</p>
              <p className="font-medium text-gray-800">{getPanchangValue(panchang.sunset, '6:30 PM')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Posts Preview */}
      {recentPosts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Send className="w-4 h-4 text-saffron" />
            Recent Posts
          </h3>
          <div className="space-y-2">
            {recentPosts.map((post) => (
              <div key={post.id} className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700 line-clamp-2">{post.content}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {post.likes || 0}</span>
                  <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {post.comments || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Festivals */}
      {todayFestivals.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-saffron" />
            Upcoming Festivals
          </h3>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {todayFestivals.map((fest, i) => (
              <div key={i} className="flex-shrink-0 bg-gradient-to-br from-saffron to-gold rounded-xl p-3 text-white min-w-[120px]">
                <p className="font-semibold text-sm">{fest.name}</p>
                <p className="text-xs opacity-80">{fest.date}</p>
                {fest.days_until !== undefined && (
                  <p className="text-[10px] mt-1 bg-white/20 rounded px-2 py-0.5 inline-block">
                    {fest.days_until === 0 ? 'Today!' : `${fest.days_until} days`}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Requests */}
      {pendingBookings.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-500" />
            Pending Requests ({pendingBookings.length})
          </h2>
          <div className="space-y-3">
            {pendingBookings.slice(0, 3).map((booking) => (
              <BookingCard key={booking.id} booking={booking} onUpdateStatus={updateStatus} compact />
            ))}
          </div>
        </div>
      )}

      {/* Dashboard Overview */}
      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
        <h2 className="font-cinzel text-base md:text-lg font-semibold text-maroon mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Overview
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-3 md:p-4">
            <p className="text-xl md:text-2xl font-bold text-saffron">{analytics?.stats?.total_bookings || 0}</p>
            <p className="text-xs md:text-sm text-gray-600">Total Bookings</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 md:p-4">
            <p className="text-xl md:text-2xl font-bold text-green-600">{analytics?.stats?.completed_bookings || 0}</p>
            <p className="text-xs md:text-sm text-gray-600">Completed</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 md:p-4">
            <p className="text-xl md:text-2xl font-bold text-blue-600">{analytics?.stats?.total_classes || 0}</p>
            <p className="text-xs md:text-sm text-gray-600">Classes</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-3 md:p-4">
            <p className="text-xl md:text-2xl font-bold text-purple-600">{posts?.length || 0}</p>
            <p className="text-xs md:text-sm text-gray-600">Posts</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export { HomeTab, StatCard };
