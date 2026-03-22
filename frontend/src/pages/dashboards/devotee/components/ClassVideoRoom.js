import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Video, Mic, MicOff, VideoOff, PhoneOff, ScreenShare, ScreenShareOff, 
  Hand, Volume2, VolumeX, Maximize, Minimize, MessageSquare, X, Send, Loader2
} from 'lucide-react';
import {
  HMSRoomProvider,
  useHMSStore,
  useHMSActions,
  selectIsConnectedToRoom,
  selectLocalPeer,
  selectPeers,
  selectIsLocalAudioEnabled,
  selectIsLocalVideoEnabled,
  selectIsLocalScreenShared,
  selectVideoTrackByPeerID,
  selectPeerScreenSharing,
  selectRoomState,
  HMSRoomState,
  useAVToggle,
  useVideo,
  selectScreenShareByPeerID,
} from '@100mslive/react-sdk';
import { toast } from 'sonner';

// Video Tile Component for Class
function VideoTileClass({ peer, isLocal = false, isScreenShare = false, label }) {
  const trackSelector = isScreenShare ? selectScreenShareByPeerID : selectVideoTrackByPeerID;
  const track = useHMSStore(trackSelector(peer?.id));
  const { videoRef } = useVideo({ trackId: track?.id });

  return (
    <div className={`relative rounded-xl overflow-hidden bg-gray-900 ${isScreenShare ? 'col-span-2 row-span-2' : ''}`}>
      {track?.enabled ? (
        <video
          ref={videoRef}
          autoPlay
          muted={isLocal}
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
          <div className="w-20 h-20 rounded-full bg-saffron/20 flex items-center justify-center">
            <span className="text-2xl text-white font-cinzel">
              {peer?.name?.charAt(0) || '?'}
            </span>
          </div>
        </div>
      )}
      <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded text-white text-xs">
        {label || peer?.name} {isLocal && '(You)'}
      </div>
    </div>
  );
}

// Class Video Room Component (Inner)
function ClassVideoRoomInner({ classTitle, priestName, onLeave }) {
  const hmsActions = useHMSActions();
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const localPeer = useHMSStore(selectLocalPeer);
  const peers = useHMSStore(selectPeers);
  const isLocalAudioEnabled = useHMSStore(selectIsLocalAudioEnabled);
  const isLocalVideoEnabled = useHMSStore(selectIsLocalVideoEnabled);
  const isScreenSharing = useHMSStore(selectIsLocalScreenShared);
  const peerScreenSharing = useHMSStore(selectPeerScreenSharing);
  const roomState = useHMSStore(selectRoomState);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const containerRef = useRef(null);

  const { isLocalAudioEnabled: audioEnabled, isLocalVideoEnabled: videoEnabled, toggleAudio, toggleVideo } = useAVToggle();

  const handleLeave = useCallback(async () => {
    try {
      await hmsActions.leave();
      onLeave();
    } catch (error) {
      console.error('Error leaving room:', error);
      onLeave();
    }
  }, [hmsActions, onLeave]);

  const toggleScreenShare = async () => {
    try {
      await hmsActions.setScreenShareEnabled(!isScreenSharing);
    } catch (error) {
      toast.error('Screen share failed');
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const sendMessage = () => {
    if (newMessage.trim()) {
      hmsActions.sendBroadcastMessage(newMessage);
      setChatMessages(prev => [...prev, { sender: 'You', text: newMessage, time: new Date() }]);
      setNewMessage('');
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (roomState === HMSRoomState.Connecting) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
        <div className="text-center text-white">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-saffron" />
          <p className="text-xl">Joining {classTitle}...</p>
          <p className="text-gray-400 mt-2">Please wait while we connect you</p>
        </div>
      </div>
    );
  }

  const otherPeers = peers.filter(p => p.id !== localPeer?.id);
  const priestPeer = otherPeers.find(p => p.roleName === 'host' || p.roleName === 'priest');

  return (
    <div ref={containerRef} className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
        <div>
          <h2 className="text-white font-semibold">{classTitle}</h2>
          <p className="text-gray-400 text-sm">with {priestName}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-green-400 text-sm">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Live
          </span>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-4 overflow-hidden">
        <div className={`h-full grid gap-4 ${
          peerScreenSharing ? 'grid-cols-3 grid-rows-2' :
          otherPeers.length === 0 ? 'grid-cols-1' :
          otherPeers.length === 1 ? 'grid-cols-2' :
          'grid-cols-2 md:grid-cols-3'
        }`}>
          {/* Screen Share */}
          {peerScreenSharing && (
            <VideoTileClass peer={peerScreenSharing} isScreenShare={true} label="Screen Share" />
          )}
          
          {/* Priest Video (prioritized) */}
          {priestPeer && (
            <VideoTileClass peer={priestPeer} label={`${priestPeer.name} (Teacher)`} />
          )}
          
          {/* Local Video */}
          {localPeer && (
            <VideoTileClass peer={localPeer} isLocal={true} />
          )}
          
          {/* Other Participants */}
          {otherPeers.filter(p => p.id !== priestPeer?.id).map(peer => (
            <VideoTileClass key={peer.id} peer={peer} />
          ))}
        </div>
      </div>

      {/* Chat Panel */}
      {showChat && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          className="absolute right-0 top-0 bottom-20 w-80 bg-gray-800 border-l border-gray-700 flex flex-col"
        >
          <div className="p-3 border-b border-gray-700 flex items-center justify-between">
            <h3 className="text-white font-medium">Class Chat</h3>
            <button onClick={() => setShowChat(false)} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {chatMessages.map((msg, i) => (
              <div key={i} className="bg-gray-700 rounded-lg p-2">
                <p className="text-saffron text-xs font-medium">{msg.sender}</p>
                <p className="text-white text-sm">{msg.text}</p>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-gray-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron"
              />
              <button onClick={sendMessage} className="p-2 bg-saffron text-white rounded-lg hover:bg-orange-600">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Controls */}
      <div className="bg-gray-800 px-4 py-4 flex items-center justify-center gap-4">
        <button
          onClick={toggleAudio}
          className={`p-4 rounded-full transition-colors ${
            audioEnabled ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-500 text-white'
          }`}
        >
          {audioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
        </button>
        
        <button
          onClick={toggleVideo}
          className={`p-4 rounded-full transition-colors ${
            videoEnabled ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-500 text-white'
          }`}
        >
          {videoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
        </button>

        <button
          onClick={toggleScreenShare}
          className={`p-4 rounded-full transition-colors ${
            isScreenSharing ? 'bg-green-500 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
          }`}
        >
          {isScreenSharing ? <ScreenShareOff className="w-6 h-6" /> : <ScreenShare className="w-6 h-6" />}
        </button>

        <button
          onClick={() => setShowChat(!showChat)}
          className={`p-4 rounded-full transition-colors ${
            showChat ? 'bg-saffron text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
          }`}
        >
          <MessageSquare className="w-6 h-6" />
        </button>

        <button
          onClick={toggleFullscreen}
          className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors"
        >
          {isFullscreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
        </button>

        <button
          onClick={handleLeave}
          className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}

// Class Video Room with HMSRoomProvider wrapper
export function ClassVideoRoom({ roomId, token, classTitle, priestName, onLeave }) {
  const hmsActions = useHMSActions();

  useEffect(() => {
    const joinRoom = async () => {
      try {
        await hmsActions.join({
          userName: 'Student',
          authToken: token,
        });
      } catch (error) {
        console.error('Error joining room:', error);
        toast.error('Failed to join class');
        onLeave();
      }
    };

    if (token) {
      joinRoom();
    }

    return () => {
      hmsActions.leave().catch(console.error);
    };
  }, [token, hmsActions, onLeave]);

  return (
    <HMSRoomProvider>
      <ClassVideoRoomInner
        classTitle={classTitle}
        priestName={priestName}
        onLeave={onLeave}
      />
    </HMSRoomProvider>
  );
}

export { VideoTileClass };
