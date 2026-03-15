import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Video, VideoOff, Mic, MicOff, Phone, PhoneOff, 
  Maximize2, Minimize2, Settings, Loader2, Wallet,
  Clock, Star, MessageSquare, Gift, AlertTriangle
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { Toaster, toast } from 'sonner';
import { RechargeModal, LowBalanceWarning, GracePeriodWarning } from '../Wallet/WalletComponents';

// Video Call Interface
export function VideoCallScreen({ 
  callData, 
  onEndCall, 
  astrologerInfo 
}) {
  const { user, token } = useAuth();
  const [callState, setCallState] = useState({
    isVideoOn: true,
    isAudioOn: true,
    duration: 0,
    balance: callData.user_balance,
    freeMinutes: callData.free_minutes,
    minutesLeft: 0
  });
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [showLowBalanceWarning, setShowLowBalanceWarning] = useState(false);
  const [gracePeriod, setGracePeriod] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const wsRef = useRef(null);
  const timerRef = useRef(null);

  // Calculate minutes left
  useEffect(() => {
    const freeMinutes = callState.freeMinutes || 0;
    const balanceMinutes = Math.floor(callState.balance / callData.rate_per_minute);
    setCallState(prev => ({
      ...prev,
      minutesLeft: freeMinutes + balanceMinutes
    }));
  }, [callState.balance, callState.freeMinutes, callData.rate_per_minute]);

  // Setup WebSocket for billing updates
  useEffect(() => {
    const wsUrl = process.env.REACT_APP_BACKEND_URL?.replace('https://', 'wss://').replace('http://', 'ws://');
    const ws = new WebSocket(`${wsUrl}/ws/consultation/${callData.call_id}?token=${token}`);

    ws.onopen = () => {
      console.log('Billing WebSocket connected');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'billing_update') {
        setCallState(prev => ({
          ...prev,
          balance: data.balance,
          freeMinutes: data.free_minutes,
          minutesLeft: data.minutes_left
        }));

        if (data.status === 'low_balance') {
          setShowLowBalanceWarning(true);
        }
      }

      if (data.type === 'grace_period') {
        setGracePeriod(data.seconds_remaining);
        // Countdown
        const countdown = setInterval(() => {
          setGracePeriod(prev => {
            if (prev <= 1) {
              clearInterval(countdown);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }

      if (data.type === 'call_ended') {
        toast.error(data.message);
        onEndCall(data.reason);
      }
    };

    ws.onerror = (error) => {
      console.error('Billing WebSocket error:', error);
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [callData.call_id, token, onEndCall]);

  // Duration timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCallState(prev => ({
        ...prev,
        duration: prev.duration + 1
      }));
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Simulate connection (in real app, use 100ms SDK)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsConnecting(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = async () => {
    try {
      await api.post(`/api/consultation/${callData.call_id}/end`, { reason: 'user_ended' });
      onEndCall('user_ended');
    } catch (error) {
      console.error('Failed to end call:', error);
      onEndCall('error');
    }
  };

  const handleRechargeSuccess = (wallet) => {
    setCallState(prev => ({
      ...prev,
      balance: wallet.balance,
      freeMinutes: wallet.free_minutes
    }));
    setShowRechargeModal(false);
    setShowLowBalanceWarning(false);
    setGracePeriod(null);
    toast.success('Balance added! Call continues.');
  };

  if (isConnecting) {
    return (
      <div className="fixed inset-0 bg-gray-900 z-50 flex items-center justify-center">
        <div className="text-center text-white">
          <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Connecting to {astrologerInfo?.name}...</h2>
          <p className="text-gray-400">Please wait while we establish the connection</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      {/* Grace Period Warning */}
      {gracePeriod !== null && gracePeriod > 0 && (
        <GracePeriodWarning 
          secondsRemaining={gracePeriod}
          onRecharge={() => setShowRechargeModal(true)}
        />
      )}

      {/* Low Balance Warning */}
      <AnimatePresence>
        {showLowBalanceWarning && !gracePeriod && (
          <LowBalanceWarning
            balance={callState.balance}
            minutesLeft={callState.minutesLeft}
            onRecharge={() => setShowRechargeModal(true)}
            onDismiss={() => setShowLowBalanceWarning(false)}
          />
        )}
      </AnimatePresence>

      {/* Recharge Modal */}
      <RechargeModal
        isOpen={showRechargeModal}
        onClose={() => setShowRechargeModal(false)}
        onSuccess={handleRechargeSuccess}
      />

      {/* Header with call info */}
      <div className="bg-gray-800/80 backdrop-blur-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center">
            {astrologerInfo?.profile_photo ? (
              <img src={astrologerInfo.profile_photo} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-white font-semibold">{astrologerInfo?.name?.charAt(0) || 'A'}</span>
            )}
          </div>
          <div>
            <h3 className="text-white font-semibold">{astrologerInfo?.name || 'Astrologer'}</h3>
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span>{astrologerInfo?.avg_rating || '4.8'}</span>
              <span>•</span>
              <span>₹{callData.rate_per_minute}/min</span>
            </div>
          </div>
        </div>

        {/* Duration & Balance */}
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="flex items-center gap-1 text-white">
              <Clock className="w-4 h-4" />
              <span className="font-mono text-lg">{formatDuration(callState.duration)}</span>
            </div>
            <p className="text-gray-400 text-xs">Duration</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center gap-1 text-white">
              <Wallet className="w-4 h-4" />
              <span className="font-mono text-lg">
                {callState.freeMinutes > 0 ? (
                  <span className="text-green-400">{callState.freeMinutes}m free</span>
                ) : (
                  <span className={callState.balance < 50 ? 'text-yellow-400' : ''}>
                    ₹{callState.balance}
                  </span>
                )}
              </span>
            </div>
            <p className="text-gray-400 text-xs">
              ~{callState.minutesLeft} min{callState.minutesLeft !== 1 ? 's' : ''} left
            </p>
          </div>

          <button
            onClick={() => setShowRechargeModal(true)}
            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
          >
            + Add Money
          </button>
        </div>
      </div>

      {/* Video Area */}
      <div className="flex-1 relative bg-gray-900">
        {/* Remote Video (Astrologer) */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-full max-w-4xl mx-auto bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
            {/* Placeholder for 100ms video */}
            <div className="text-center text-gray-500">
              <Video className="w-16 h-16 mx-auto mb-2 opacity-50" />
              <p>Astrologer's video will appear here</p>
              <p className="text-sm mt-2 text-gray-600">
                (100ms SDK integration required)
              </p>
            </div>
          </div>
        </div>

        {/* Local Video (User) - Picture in Picture */}
        <div className="absolute bottom-4 right-4 w-32 h-44 md:w-48 md:h-64 bg-gray-700 rounded-lg overflow-hidden shadow-xl border-2 border-gray-600">
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            <Video className="w-8 h-8 opacity-50" />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800/80 backdrop-blur-sm px-4 py-4">
        <div className="flex items-center justify-center gap-4">
          {/* Mic Toggle */}
          <button
            onClick={() => setCallState(prev => ({ ...prev, isAudioOn: !prev.isAudioOn }))}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
              callState.isAudioOn ? 'bg-gray-700 text-white' : 'bg-red-500 text-white'
            }`}
            data-testid="toggle-mic"
          >
            {callState.isAudioOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </button>

          {/* Video Toggle */}
          <button
            onClick={() => setCallState(prev => ({ ...prev, isVideoOn: !prev.isVideoOn }))}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
              callState.isVideoOn ? 'bg-gray-700 text-white' : 'bg-red-500 text-white'
            }`}
            data-testid="toggle-video"
          >
            {callState.isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </button>

          {/* End Call */}
          <button
            onClick={handleEndCall}
            className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors"
            data-testid="end-call"
          >
            <PhoneOff className="w-7 h-7" />
          </button>

          {/* Chat (optional) */}
          <button
            className="w-14 h-14 bg-gray-700 rounded-full flex items-center justify-center text-white hover:bg-gray-600 transition-colors"
          >
            <MessageSquare className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Pre-Call Check Component
export function PreCallCheck({ astrologer, onStartCall, onCancel }) {
  const [wallet, setWallet] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [showRecharge, setShowRecharge] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [walletRes, settingsRes] = await Promise.all([
        api.get('/api/wallet'),
        api.get('/api/consultation/settings')
      ]);
      setWallet(walletRes.data);
      setSettings(settingsRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const canStartCall = () => {
    if (!wallet || !settings) return false;
    const hasFreeMinutes = wallet.free_minutes > 0;
    const hasMinBalance = wallet.balance >= settings.min_recharge_amount;
    return hasFreeMinutes || hasMinBalance;
  };

  const handleStartCall = async () => {
    if (!canStartCall()) {
      setShowRecharge(true);
      return;
    }

    setStarting(true);
    try {
      const res = await api.post('/api/consultation/start', {
        astrologer_user_id: astrologer.user_id
      });
      onStartCall(res.data);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to start call');
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <RechargeModal
        isOpen={showRecharge}
        onClose={() => setShowRecharge(false)}
        onSuccess={(newWallet) => {
          setWallet(newWallet);
          setShowRecharge(false);
        }}
      />

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl p-6 w-full max-w-md"
      >
        {/* Astrologer Info */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 rounded-full bg-purple-100 mx-auto mb-3 flex items-center justify-center overflow-hidden">
            {astrologer.profile_photo ? (
              <img src={astrologer.profile_photo} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-purple-600">{astrologer.name?.charAt(0)}</span>
            )}
          </div>
          <h2 className="text-xl font-bold text-gray-800">{astrologer.name}</h2>
          <div className="flex items-center justify-center gap-2 text-gray-500 text-sm mt-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span>{astrologer.avg_rating || '4.8'}</span>
            <span>•</span>
            <span>{astrologer.total_consultations || 0} consultations</span>
          </div>
          <div className="mt-2 inline-block bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
            ₹{astrologer.rate_per_minute}/minute
          </div>
        </div>

        {/* Wallet Status */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-600">Your Balance</span>
            <span className="font-bold text-lg">₹{wallet?.balance || 0}</span>
          </div>
          
          {wallet?.free_minutes > 0 && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-3">
              <Gift className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-700">
                You have <strong>{wallet.free_minutes} free minutes!</strong>
              </span>
            </div>
          )}

          {!canStartCall() && (
            <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <span className="text-sm text-yellow-700">
                Minimum ₹{settings?.min_recharge_amount} required to start call
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          
          {canStartCall() ? (
            <button
              onClick={handleStartCall}
              disabled={starting}
              className="flex-1 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              data-testid="start-call-btn"
            >
              {starting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Phone className="w-5 h-5" />
              )}
              Start Call
            </button>
          ) : (
            <button
              onClick={() => setShowRecharge(true)}
              className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
            >
              <Wallet className="w-5 h-5" />
              Recharge ₹{settings?.min_recharge_amount}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// Astrologer List Component
export function AstrologerList({ onSelectAstrologer }) {
  const [astrologers, setAstrologers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAstrologers();
  }, []);

  const loadAstrologers = async () => {
    try {
      const res = await api.get('/api/astrologers/available');
      setAstrologers(res.data.astrologers || []);
    } catch (error) {
      toast.error('Failed to load astrologers');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (astrologers.length === 0) {
    return (
      <div className="text-center py-12">
        <Video className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Astrologers Available</h3>
        <p className="text-gray-500">Please check back later</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {astrologers.map(astrologer => (
        <motion.div
          key={astrologer.id}
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 cursor-pointer"
          onClick={() => onSelectAstrologer(astrologer)}
          data-testid={`astrologer-card-${astrologer.id}`}
        >
          <div className="flex items-start gap-3">
            <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden flex-shrink-0">
              {astrologer.profile_photo ? (
                <img src={astrologer.profile_photo} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-purple-600">{astrologer.name?.charAt(0)}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-800 truncate">{astrologer.name}</h3>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span>{astrologer.avg_rating || '4.8'}</span>
                <span>•</span>
                <span>{astrologer.experience_years || 0}y exp</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {(astrologer.specializations || []).slice(0, 2).map((spec, i) => (
                  <span key={i} className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
            <div>
              <span className="text-lg font-bold text-green-600">₹{astrologer.rate_per_minute}</span>
              <span className="text-gray-500 text-sm">/min</span>
            </div>
            <button className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-green-600 transition-colors flex items-center gap-1">
              <Video className="w-4 h-4" />
              Call Now
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default VideoCallScreen;
