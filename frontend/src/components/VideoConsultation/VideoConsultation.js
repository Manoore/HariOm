import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Video, VideoOff, Mic, MicOff, Phone, PhoneOff, 
  Maximize2, Minimize2, Settings, Loader2, Wallet,
  Clock, Star, MessageSquare, Gift, AlertTriangle,
  Monitor, MonitorOff, Send, X, ArrowLeft
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { RechargeModal, LowBalanceWarning, GracePeriodWarning } from '../Wallet/WalletComponents';

// 100ms SDK imports
import {
  useHMSActions,
  useHMSStore,
  selectIsConnectedToRoom,
  selectLocalPeer,
  selectPeers,
  selectIsLocalAudioEnabled,
  selectIsLocalVideoEnabled,
  selectIsLocalScreenShared,
  selectPeerScreenSharing,
  selectVideoTrackByPeerID,
  selectScreenShareByPeerID,
  selectHMSMessages,
  HMSRoomProvider,
  useVideo,
  useAVToggle,
} from '@100mslive/react-sdk';

// Video Tile Component for rendering peer video
function VideoTile({ peer, isLocal = false, isScreenShare = false }) {
  // Get both track types unconditionally (React hooks rules)
  const videoTrack = useHMSStore(selectVideoTrackByPeerID(peer?.id));
  const screenTrack = useHMSStore(selectScreenShareByPeerID(peer?.id));
  
  // Select the appropriate track based on isScreenShare prop
  const trackId = isScreenShare ? screenTrack?.id : videoTrack?.id;
  
  const { videoRef } = useVideo({ trackId });

  return (
    <div className={`relative w-full h-full bg-gray-800 rounded-lg overflow-hidden ${isLocal ? 'border-2 border-blue-500' : ''}`}>
      <video
        ref={videoRef}
        autoPlay
        muted={isLocal}
        playsInline
        className={`w-full h-full object-cover ${!trackId ? 'hidden' : ''}`}
      />
      {!trackId && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
          <div className="w-20 h-20 rounded-full bg-purple-500 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">
              {peer?.name?.charAt(0)?.toUpperCase() || '?'}
            </span>
          </div>
        </div>
      )}
      <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-white text-sm">
        {peer?.name} {isLocal ? '(You)' : ''} {isScreenShare ? '- Screen' : ''}
      </div>
    </div>
  );
}

// Main Video Call Content Component (inside HMS context)
function VideoCallContent({ callData, onEndCall, astrologerInfo }) {
  const { user } = useAuth();
  const token = localStorage.getItem('divine_token');
  const hmsActions = useHMSActions();
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const localPeer = useHMSStore(selectLocalPeer);
  const peers = useHMSStore(selectPeers);
  const isLocalAudioEnabled = useHMSStore(selectIsLocalAudioEnabled);
  const isLocalVideoEnabled = useHMSStore(selectIsLocalVideoEnabled);
  const isLocalScreenShared = useHMSStore(selectIsLocalScreenShared);
  const screenSharingPeer = useHMSStore(selectPeerScreenSharing);
  
  const { toggleAudio, toggleVideo } = useAVToggle();

  const [callState, setCallState] = useState({
    duration: 0,
    balance: callData.user_balance,
    freeMinutes: callData.free_minutes,
    minutesLeft: 0
  });
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [showLowBalanceWarning, setShowLowBalanceWarning] = useState(false);
  const [gracePeriod, setGracePeriod] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionError, setConnectionError] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const chatMessages = useHMSStore(selectHMSMessages);
  const chatEndRef = useRef(null);
  
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

  // Join 100ms room
  useEffect(() => {
    const joinRoom = async () => {
      try {
        setIsConnecting(true);
        setConnectionError(null);
        
        await hmsActions.join({
          userName: user?.name || 'User',
          authToken: callData.user_token,
        });
        
        setIsConnecting(false);
      } catch (error) {
        console.error('Failed to join room:', error);
        setConnectionError(error.message || 'Failed to connect');
        setIsConnecting(false);
      }
    };

    if (callData.user_token) {
      joinRoom();
    }

    return () => {
      hmsActions.leave();
    };
  }, [callData.user_token, hmsActions, user?.name]);

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

  // Prevent accidental navigation during call
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'You are in an active call. Leaving will end the call.';
      return e.returnValue;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Cleanup: end call if component unmounts unexpectedly
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Try to end the call on unmount
      if (callData?.call_id) {
        api.post(`/api/consultation/${callData.call_id}/end`, { reason: 'disconnected' }).catch(() => {});
      }
    };
  }, [callData?.call_id]);

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

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = async () => {
    try {
      await hmsActions.leave();
      await api.post(`/api/consultation/${callData.call_id}/end`, { reason: 'user_ended' });
      onEndCall('user_ended');
    } catch (error) {
      console.error('Failed to end call:', error);
      onEndCall('error');
    }
  };

  const handleToggleScreenShare = async () => {
    try {
      // Check if screen sharing is supported
      if (!navigator.mediaDevices?.getDisplayMedia) {
        toast.error('Screen sharing is not supported on this device/browser. Try using Chrome on desktop.');
        return;
      }
      await hmsActions.setScreenShareEnabled(!isLocalScreenShared);
    } catch (error) {
      console.error('Screen share error:', error);
      if (error.name === 'NotAllowedError') {
        toast.error('Screen sharing permission was denied');
      } else if (error.name === 'NotSupportedError' || error.message?.includes('not supported')) {
        toast.error('Screen sharing is not supported on this device. Try Chrome on desktop.');
      } else {
        toast.error('Failed to share screen. This feature may not be available on mobile browsers.');
      }
    }
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    hmsActions.sendBroadcastMessage(chatInput.trim());
    setChatInput('');
  };

  // Auto-scroll chat
  useEffect(() => {
    if (showChat && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, showChat]);

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

  // Get remote peer (the other participant)
  const remotePeers = peers.filter(peer => !peer.isLocal);

  if (isConnecting) {
    return (
      <div className="fixed inset-0 bg-gray-900 z-50 flex items-center justify-center">
        <div className="text-center text-white">
          <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Connecting to {astrologerInfo?.name}...</h2>
          <p className="text-gray-400">Please allow camera and microphone access</p>
        </div>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="fixed inset-0 bg-gray-900 z-50 flex items-center justify-center">
        <div className="text-center text-white max-w-md p-6">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Connection Failed</h2>
          <p className="text-gray-400 mb-4">{connectionError}</p>
          <button
            onClick={() => onEndCall('connection_error')}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-full"
          >
            Go Back
          </button>
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
      <div className="bg-gray-800/80 backdrop-blur-sm px-3 py-2 md:px-4 md:py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
            {astrologerInfo?.profile_photo ? (
              <img src={astrologerInfo.profile_photo} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-white font-semibold text-sm">{astrologerInfo?.name?.charAt(0) || 'A'}</span>
            )}
          </div>
          <div className="min-w-0">
            <h3 className="text-white font-semibold text-sm md:text-base truncate">{astrologerInfo?.name || 'Astrologer'}</h3>
            <div className="flex items-center gap-1 md:gap-2 text-gray-400 text-xs">
              <span>₹{callData.rate_per_minute}/min</span>
              {isConnected && <span className="text-green-400">• Live</span>}
            </div>
          </div>
        </div>

        {/* Duration & Balance */}
        <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
          <div className="text-center">
            <div className="flex items-center gap-1 text-white">
              <Clock className="w-3 h-3 md:w-4 md:h-4" />
              <span className="font-mono text-sm md:text-lg">{formatDuration(callState.duration)}</span>
            </div>
          </div>
          
          <div className="text-center hidden sm:block">
            <div className="flex items-center gap-1 text-white">
              <Wallet className="w-3 h-3 md:w-4 md:h-4" />
              <span className="font-mono text-sm md:text-lg">
                {callState.freeMinutes > 0 ? (
                  <span className="text-green-400">{callState.freeMinutes}m</span>
                ) : (
                  <span className={callState.balance < 50 ? 'text-yellow-400' : ''}>
                    ₹{callState.balance}
                  </span>
                )}
              </span>
            </div>
            <p className="text-gray-400 text-[10px]">
              ~{callState.minutesLeft} min left
            </p>
          </div>

          <button
            onClick={() => setShowRechargeModal(true)}
            className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 md:px-3 md:py-1.5 rounded-full text-xs md:text-sm font-medium transition-colors"
          >
            + Add
          </button>
        </div>
      </div>

      {/* Video Area */}
      <div className="flex-1 relative bg-gray-900 p-4">
        {/* Screen Share takes full screen if active */}
        {screenSharingPeer ? (
          <div className="absolute inset-4">
            <VideoTile peer={screenSharingPeer} isScreenShare={true} />
            {/* Remote peer in small window when screen sharing */}
            <div className="absolute bottom-4 right-4 w-48 h-36">
              {remotePeers[0] && <VideoTile peer={remotePeers[0]} />}
            </div>
          </div>
        ) : (
          <>
            {/* Remote Video (Astrologer) - Full screen */}
            <div className="absolute inset-2 md:inset-4">
              {remotePeers.length > 0 ? (
                <VideoTile peer={remotePeers[0]} />
              ) : (
                <div className="w-full h-full bg-gray-800 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <Loader2 className="w-12 h-12 mx-auto mb-2 animate-spin" />
                    <p>Waiting for {astrologerInfo?.name || 'Astrologer'} to join...</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Local Video (User) - Picture in Picture */}
        <div className="absolute bottom-4 right-4 w-32 h-44 md:w-48 md:h-64 shadow-xl">
          {localPeer && <VideoTile peer={localPeer} isLocal={true} />}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800/80 backdrop-blur-sm px-3 py-3 md:px-4 md:py-4 safe-area-bottom">
        <div className="flex items-center justify-center gap-3 md:gap-4">
          {/* Mic Toggle */}
          <button
            onClick={toggleAudio}
            className={`w-11 h-11 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-colors ${
              isLocalAudioEnabled ? 'bg-gray-700 text-white' : 'bg-red-500 text-white'
            }`}
            data-testid="toggle-mic"
          >
            {isLocalAudioEnabled ? <Mic className="w-5 h-5 md:w-6 md:h-6" /> : <MicOff className="w-5 h-5 md:w-6 md:h-6" />}
          </button>

          {/* Video Toggle */}
          <button
            onClick={toggleVideo}
            className={`w-11 h-11 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-colors ${
              isLocalVideoEnabled ? 'bg-gray-700 text-white' : 'bg-red-500 text-white'
            }`}
            data-testid="toggle-video"
          >
            {isLocalVideoEnabled ? <Video className="w-5 h-5 md:w-6 md:h-6" /> : <VideoOff className="w-5 h-5 md:w-6 md:h-6" />}
          </button>

          {/* Screen Share Toggle - hidden on mobile */}
          <button
            onClick={handleToggleScreenShare}
            className={`hidden md:flex w-14 h-14 rounded-full items-center justify-center transition-colors ${
              isLocalScreenShared ? 'bg-blue-500 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'
            }`}
            data-testid="toggle-screen-share"
          >
            {isLocalScreenShared ? <MonitorOff className="w-6 h-6" /> : <Monitor className="w-6 h-6" />}
          </button>

          {/* End Call */}
          <button
            onClick={handleEndCall}
            className="w-13 h-13 md:w-16 md:h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors"
            data-testid="end-call"
          >
            <PhoneOff className="w-6 h-6 md:w-7 md:h-7" />
          </button>

          {/* Chat Toggle */}
          <button
            onClick={() => setShowChat(!showChat)}
            className={`w-11 h-11 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-colors relative ${
              showChat ? 'bg-purple-500 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'
            }`}
            data-testid="toggle-chat"
          >
            <MessageSquare className="w-5 h-5 md:w-6 md:h-6" />
            {chatMessages.length > 0 && !showChat && (
              <span className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-red-500 rounded-full text-[9px] md:text-[10px] text-white flex items-center justify-center">
                {chatMessages.length}
              </span>
            )}
          </button>
        </div>

        {/* Mobile balance indicator */}
        <div className="flex sm:hidden items-center justify-center mt-2 gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Wallet className="w-3 h-3" />
            {callState.freeMinutes > 0 ? `${callState.freeMinutes}m free` : `₹${callState.balance}`}
          </span>
          <span>•</span>
          <span>~{callState.minutesLeft} min left</span>
        </div>
      </div>

      {/* In-Call Chat Panel */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute bottom-24 left-0 right-0 md:left-auto md:right-4 md:bottom-28 md:w-96 bg-gray-800/95 backdrop-blur-md rounded-t-2xl md:rounded-2xl border border-gray-700 flex flex-col z-10"
            style={{ maxHeight: '50vh' }}
            data-testid="in-call-chat-panel"
          >
            {/* Chat Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
              <h3 className="text-white font-semibold text-sm">In-Call Chat</h3>
              <button onClick={() => setShowChat(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[150px]">
              {chatMessages.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">No messages yet. Say hi!</p>
              ) : (
                chatMessages.map((msg) => {
                  const isOwn = msg.sender?.name === user?.name;
                  return (
                    <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                        isOwn ? 'bg-purple-500 text-white rounded-br-sm' : 'bg-gray-700 text-gray-200 rounded-bl-sm'
                      }`}>
                        {!isOwn && (
                          <p className="text-xs text-purple-300 mb-0.5">{msg.sender?.name}</p>
                        )}
                        <p className="text-sm">{msg.message}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="px-3 py-3 border-t border-gray-700">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendChat()}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-700 text-white text-sm rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/50 placeholder-gray-400"
                  data-testid="in-call-chat-input"
                />
                <button
                  onClick={handleSendChat}
                  disabled={!chatInput.trim()}
                  className="w-9 h-9 bg-purple-500 rounded-full flex items-center justify-center text-white disabled:opacity-40 hover:bg-purple-600 transition-colors"
                  data-testid="in-call-chat-send"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Wrapped Video Call Screen with HMS Provider
export function VideoCallScreen({ callData, onEndCall, astrologerInfo }) {
  return (
    <HMSRoomProvider>
      <VideoCallContent 
        callData={callData} 
        onEndCall={onEndCall} 
        astrologerInfo={astrologerInfo} 
      />
    </HMSRoomProvider>
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
      setAstrologers(res.data.astrologers || res.data || []);
    } catch (error) {
      console.error('Error loading astrologers:', error);
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
