import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Video, Calendar, Play, Bell, BellRing, Loader2, Users, X
} from 'lucide-react';
import api from '../../../../lib/api';
import { toast } from 'sonner';

export function LiveEventsTab({ isDesktop }) {
  const [liveStreams, setLiveStreams] = useState([]);
  const [upcomingStreams, setUpcomingStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('live');
  const [remindedStreams, setRemindedStreams] = useState(new Set());
  const [settingReminder, setSettingReminder] = useState(null);
  const [watchingStream, setWatchingStream] = useState(null);

  useEffect(() => {
    fetchStreams();
    loadReminders();
  }, []);

  const fetchStreams = async () => {
    try {
      const [liveRes, upcomingRes] = await Promise.all([
        api.get('/api/live-streams?status=live'),
        api.get('/api/live-streams?status=scheduled')
      ]);
      setLiveStreams(liveRes.data.streams || []);
      setUpcomingStreams(upcomingRes.data.streams || []);
    } catch (error) {
      console.error('Error fetching streams:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReminders = async () => {
    try {
      const res = await api.get('/api/stream-reminders');
      const reminderIds = new Set(res.data.reminders?.map(r => r.stream_id) || []);
      setRemindedStreams(reminderIds);
    } catch (error) {}
  };

  const handleWatchStream = (stream) => {
    if (stream.youtube_video_id) {
      setWatchingStream(stream);
    } else if (stream.youtube_url) {
      window.open(stream.youtube_url, '_blank');
    } else {
      toast.info('Stream URL not available yet');
    }
  };

  const handleSetReminder = async (stream) => {
    setSettingReminder(stream.id);
    try {
      await api.post('/api/stream-reminders', { stream_id: stream.id });
      setRemindedStreams(prev => new Set([...prev, stream.id]));
      toast.success(`Reminder set for "${stream.title}"! You'll be notified before it starts.`);
    } catch (error) {
      if (error.response?.data?.detail?.includes('already')) {
        toast.info('Reminder already set for this stream');
        setRemindedStreams(prev => new Set([...prev, stream.id]));
      } else {
        toast.error('Failed to set reminder. Please try again.');
      }
    } finally {
      setSettingReminder(null);
    }
  };

  const handleRemoveReminder = async (stream) => {
    setSettingReminder(stream.id);
    try {
      await api.delete(`/api/stream-reminders/${stream.id}`);
      setRemindedStreams(prev => {
        const newSet = new Set(prev);
        newSet.delete(stream.id);
        return newSet;
      });
      toast.success('Reminder removed');
    } catch (error) {
      toast.error('Failed to remove reminder');
    } finally {
      setSettingReminder(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'TBD';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { 
      weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  };

  const getTimeUntil = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = date - now;
    if (diff < 0) return 'Starting soon';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (days > 0) return `In ${days}d ${hours}h`;
    if (hours > 0) return `In ${hours}h ${minutes}m`;
    return `In ${minutes}m`;
  };

  return (
    <div className={`pb-24 lg:pb-8 ${isDesktop ? 'px-8' : 'px-4'}`}>
      <div className="pt-4">
        <h1 className="font-cinzel text-2xl lg:text-3xl font-bold text-maroon mb-2">Live Events</h1>
        <p className="text-gray-500 text-sm mb-6">Watch live spiritual events from priests and temples</p>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveView('live')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
              activeView === 'live' ? 'bg-red-500 text-white' : 'bg-white text-gray-600 border border-orange-200'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${activeView === 'live' ? 'bg-white animate-pulse' : 'bg-red-500'}`} />
            Live Now ({liveStreams.length})
          </button>
          <button
            onClick={() => setActiveView('upcoming')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
              activeView === 'upcoming' ? 'bg-saffron text-white' : 'bg-white text-gray-600 border border-orange-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Upcoming ({upcomingStreams.length})
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-saffron" />
          </div>
        ) : activeView === 'live' ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {liveStreams.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Video className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No live streams right now</p>
                <p className="text-sm text-gray-400 mt-1">Check the upcoming tab for scheduled events!</p>
              </div>
            ) : (
              liveStreams.map((stream) => (
                <motion.div
                  key={stream.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden"
                >
                  <div className="relative cursor-pointer group" onClick={() => handleWatchStream(stream)}>
                    <div className="aspect-video bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
                      {stream.thumbnail ? (
                        <img src={stream.thumbnail} alt={stream.title} className="w-full h-full object-cover" />
                      ) : (
                        <Video className="w-16 h-16 text-red-500/50" />
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
                        <Play className="w-8 h-8 text-white ml-1" />
                      </div>
                    </div>
                    <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 bg-red-500 rounded-full">
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      <span className="text-xs text-white font-medium">LIVE</span>
                    </div>
                    {stream.viewer_count > 0 && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-black/60 rounded-full">
                        <Users className="w-3 h-3 text-white" />
                        <span className="text-xs text-white">{stream.viewer_count}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-saffron to-gold rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {stream.priest_name?.charAt(0) || 'P'}
                      </div>
                      <span className="text-sm text-gray-600">{stream.priest_name}</span>
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-2">{stream.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2">{stream.description}</p>
                    <button
                      onClick={() => handleWatchStream(stream)}
                      className="mt-4 w-full py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                      <Play className="w-4 h-4" />
                      Watch Now
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingStreams.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No upcoming streams scheduled</p>
                <p className="text-sm text-gray-400 mt-1">Check back later for new events!</p>
              </div>
            ) : (
              upcomingStreams.map((stream) => (
                <motion.div
                  key={stream.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden"
                >
                  <div className="relative">
                    <div className="aspect-video bg-gradient-to-br from-saffron/20 to-gold/20 flex items-center justify-center">
                      {stream.thumbnail ? (
                        <img src={stream.thumbnail} alt={stream.title} className="w-full h-full object-cover opacity-80" />
                      ) : (
                        <Video className="w-16 h-16 text-saffron/50" />
                      )}
                    </div>
                    <div className="absolute top-3 left-3 px-2 py-1 bg-saffron rounded-full">
                      <span className="text-xs text-white font-medium">{getTimeUntil(stream.scheduled_time)}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-saffron to-gold rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {stream.priest_name?.charAt(0) || 'P'}
                      </div>
                      <span className="text-sm text-gray-600">{stream.priest_name}</span>
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-2">{stream.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">{stream.description}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatDate(stream.scheduled_time)}</span>
                    </div>
                    <button
                      onClick={() => remindedStreams.has(stream.id) ? handleRemoveReminder(stream) : handleSetReminder(stream)}
                      disabled={settingReminder === stream.id}
                      className={`mt-4 w-full py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                        remindedStreams.has(stream.id)
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-saffron/10 text-saffron hover:bg-saffron/20'
                      }`}
                    >
                      {settingReminder === stream.id ? (
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : remindedStreams.has(stream.id) ? (
                        <><Bell className="w-4 h-4" /><span>Reminder Set</span></>
                      ) : (
                        <><BellRing className="w-4 h-4" /><span>Remind Me</span></>
                      )}
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {watchingStream && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setWatchingStream(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-5xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-white">
                  <h3 className="font-semibold text-xl">{watchingStream.title}</h3>
                  <p className="text-gray-400 text-sm">{watchingStream.priest_name}</p>
                </div>
                <button onClick={() => setWatchingStream(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
              {watchingStream.youtube_video_id ? (
                <div className="relative pb-[56.25%] h-0 rounded-xl overflow-hidden">
                  <iframe
                    src={`https://www.youtube.com/embed/${watchingStream.youtube_video_id}?autoplay=1&rel=0`}
                    title={watchingStream.title}
                    className="absolute top-0 left-0 w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              ) : (
                <div className="aspect-video bg-gray-800 rounded-xl flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <Video className="w-16 h-16 mx-auto mb-4" />
                    <p>Stream not available</p>
                  </div>
                </div>
              )}
              {watchingStream.description && (
                <div className="mt-4 bg-white/10 rounded-xl p-4">
                  <p className="text-gray-300 text-sm">{watchingStream.description}</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
