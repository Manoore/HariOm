import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Loader2, PhoneCall, Phone, PhoneOff } from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { Toaster, toast } from 'sonner';
import ChatTab from '../../components/Chat/ChatTab';
import { VideoCallScreen } from '../../components/VideoConsultation/VideoConsultation';
import NotificationBell from '../../components/NotificationBell';

import { useIsDesktop } from './astrologer/components/shared';
import { Sidebar } from './astrologer/components/Sidebar';
import { BottomNav } from './astrologer/components/BottomNav';
import { DashboardTab } from './astrologer/components/DashboardTab';
import { CallsTab } from './astrologer/components/CallsTab';
import { EarningsTab } from './astrologer/components/EarningsTab';
import { ProfileTab } from './astrologer/components/ProfileTab';

export default function AstrologerDashboard() {
  const [activeTab, setActiveTab] = useState('home');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(false);
  const { user } = useAuth();
  const isDesktop = useIsDesktop();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await api.get('/api/astrologer/dashboard');
      setDashboardData(res.data);
      setIsAvailable(res.data.profile?.is_available || false);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Incoming call state
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [callAudio] = useState(() => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ==');
      audio.loop = true;
      return audio;
    } catch { return null; }
  });

  // Poll for incoming calls every 5 seconds
  const checkIncomingCalls = useCallback(async () => {
    if (!isAvailable) return;
    try {
      const res = await api.get('/api/astrologer/incoming-calls');
      const calls = res.data?.calls || [];
      if (calls.length > 0 && !incomingCall) {
        setIncomingCall(calls[0]);
        try { callAudio?.play(); } catch {}
      } else if (calls.length === 0 && incomingCall) {
        setIncomingCall(null);
        try { callAudio?.pause(); } catch {}
      }
    } catch {}
  }, [isAvailable, incomingCall, callAudio]);

  useEffect(() => {
    if (!isAvailable) { setIncomingCall(null); return; }
    const interval = setInterval(checkIncomingCalls, 5000);
    checkIncomingCalls();
    return () => clearInterval(interval);
  }, [isAvailable, checkIncomingCalls]);

  const acceptCall = () => {
    if (!incomingCall) return;
    try { callAudio?.pause(); } catch {}
    setActiveCall({
      call_id: incomingCall.call_id,
      room_id: incomingCall.room_id,
      user_token: incomingCall.astrologer_token,
      rate_per_minute: incomingCall.rate_per_minute || 15,
      user_balance: 99999,
      free_minutes: 0,
      caller_name: incomingCall.caller_name,
    });
    setIncomingCall(null);
  };

  const declineCall = async () => {
    if (!incomingCall) return;
    try {
      callAudio?.pause();
      await api.post(`/api/consultation/${incomingCall.call_id}/end`, { reason: 'declined' });
    } catch {}
    setIncomingCall(null);
  };

  const toggleAvailability = async () => {
    try {
      const res = await api.put('/api/astrologer/availability', {
        is_available: !isAvailable
      });
      setIsAvailable(res.data.is_available);
      toast.success(res.data.is_available ? 'You are now online!' : 'You are now offline');
    } catch (error) {
      toast.error('Failed to update availability');
    }
  };

  // If in an active call, show full-screen video
  if (activeCall) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-900">
        <VideoCallScreen
          callData={activeCall}
          onEndCall={(reason) => {
            setActiveCall(null);
            toast.success(reason === 'declined' ? 'Call declined' : 'Call ended');
          }}
          astrologerInfo={{ name: user?.name }}
        />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-b from-purple-50 to-white ${isDesktop ? 'lg:pl-64' : ''}`}>
      <Toaster position="top-center" richColors />
      
      {isDesktop && (
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          user={user}
          isAvailable={isAvailable}
          onToggleAvailability={toggleAvailability}
        />
      )}
      
      {/* Mobile Header */}
      {!isDesktop && (
        <div className="sticky top-0 bg-white border-b border-purple-100 px-4 py-3 z-40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/temple-logo.png" alt="Divine Logo" className="w-8 h-8 rounded-lg object-cover" />
              <span className="font-cinzel font-bold text-purple-900">DIVINE</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1">
                <div className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                <span className={`text-xs font-medium ${isAvailable ? 'text-green-600' : 'text-gray-500'}`}>
                  {isAvailable ? 'Online' : 'Offline'}
                </span>
                <label className="relative inline-flex items-center cursor-pointer ml-1">
                  <input
                    type="checkbox"
                    checked={isAvailable}
                    onChange={toggleAvailability}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-gray-200 rounded-full peer peer-checked:bg-green-500 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-4"></div>
                </label>
              </div>
              <NotificationBell />
            </div>
          </div>
        </div>
      )}

      {/* Incoming Call Modal */}
      <AnimatePresence>
        {incomingCall && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl p-8 mx-4 max-w-sm w-full text-center"
            >
              <div className="relative mx-auto w-24 h-24 mb-5">
                <motion.div
                  className="absolute inset-0 rounded-full bg-green-100"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                  <motion.div animate={{ rotate: [0, -10, 10, -10, 0] }} transition={{ duration: 0.5, repeat: Infinity }}>
                    <PhoneCall className="w-10 h-10 text-white" />
                  </motion.div>
                </div>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-1">Incoming Call</h3>
              <p className="text-lg text-purple-700 font-medium mb-1">{incomingCall.caller_name}</p>
              <p className="text-sm text-gray-500 mb-6">Consultation Request</p>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={declineCall}
                  className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg transition-colors"
                  data-testid="decline-call-btn"
                >
                  <PhoneOff className="w-7 h-7 text-white" />
                </button>
                <button
                  onClick={acceptCall}
                  className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center shadow-lg transition-colors"
                  data-testid="accept-call-btn"
                >
                  <Phone className="w-7 h-7 text-white" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : (
        <>
          {activeTab === 'home' && <DashboardTab stats={dashboardData?.stats} isDesktop={isDesktop} />}
          {activeTab === 'calls' && <CallsTab isDesktop={isDesktop} />}
          {activeTab === 'earnings' && <EarningsTab isDesktop={isDesktop} />}
          {activeTab === 'messages' && <ChatTab isDesktop={isDesktop} />}
          {activeTab === 'profile' && (
            <ProfileTab 
              profile={dashboardData?.profile} 
              user={user} 
              isDesktop={isDesktop}
              onUpdate={loadDashboard}
            />
          )}
        </>
      )}
      
      {!isDesktop && <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />}
    </div>
  );
}
