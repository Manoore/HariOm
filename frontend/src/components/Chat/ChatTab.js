import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, Send, Image as ImageIcon, ArrowLeft, 
  Loader2, X, Phone, Video, MoreVertical, Check, CheckCheck,
  ShoppingBag, Calendar, Clock, User
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { Toaster, toast } from 'sonner';

// Chat Room List Component
export function ChatRoomList({ onSelectRoom, selectedRoomId }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadRooms();
    // Poll for updates every 10 seconds
    const interval = setInterval(loadRooms, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadRooms = async () => {
    try {
      const res = await api.get('/api/chat/rooms');
      setRooms(res.data.rooms || []);
    } catch (error) {
      console.error('Failed to load chat rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-saffron" />
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-4">
        <MessageCircle className="w-16 h-16 text-gray-200 mb-4" />
        <h3 className="font-semibold text-gray-600 mb-2">No Conversations Yet</h3>
        <p className="text-gray-400 text-sm">
          When you book a priest or place an order, you'll be able to chat with them here.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {rooms.map((room) => (
        <button
          key={room.id}
          onClick={() => onSelectRoom(room)}
          className={`w-full p-4 flex items-start gap-3 hover:bg-orange-50 transition-colors text-left ${
            selectedRoomId === room.id ? 'bg-orange-50' : ''
          }`}
          data-testid={`chat-room-${room.id}`}
        >
          {/* Avatar */}
          <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
            room.type === 'booking' 
              ? 'bg-gradient-to-br from-saffron to-gold' 
              : 'bg-gradient-to-br from-green-400 to-emerald-500'
          }`}>
            {room.type === 'booking' ? (
              <Calendar className="w-5 h-5 text-white" />
            ) : (
              <ShoppingBag className="w-5 h-5 text-white" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-semibold text-gray-800 truncate">
                {room.other_participant?.name || 'Unknown'}
              </h4>
              <span className="text-xs text-gray-400 flex-shrink-0">
                {formatTime(room.last_message?.created_at || room.created_at)}
              </span>
            </div>
            
            <p className="text-xs text-saffron mb-1 truncate">
              {room.context || (room.type === 'booking' ? 'Booking' : 'Order')}
            </p>
            
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-gray-500 truncate">
                {room.last_message?.content || 'No messages yet'}
              </p>
              {room.unread_count > 0 && (
                <span className="bg-saffron text-white text-xs px-2 py-0.5 rounded-full flex-shrink-0">
                  {room.unread_count}
                </span>
              )}
            </div>

            {!room.is_active && (
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded mt-1 inline-block">
                {room.chat_expiry_reason === 'expired' 
                  ? 'Chat expired - Book again to chat' 
                  : 'Chat ended'}
              </span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

// Individual Chat Room Component
export function ChatRoom({ room, onBack, isDesktop }) {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [typing, setTyping] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const wsRef = useRef(null);

  // Load messages
  useEffect(() => {
    loadMessages();
  }, [room.id]);

  // Poll for new messages ONLY when WebSocket is not connected (fallback)
  useEffect(() => {
    if (wsConnected) return; // Skip polling when WS is active
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/api/chat/rooms/${room.id}/messages`);
        const newMessages = res.data.messages || [];
        setMessages(prev => {
          if (newMessages.length !== prev.length) {
            scrollToBottom();
            return newMessages;
          }
          return prev;
        });
      } catch (err) {
        // silent fail for polling
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [room.id, wsConnected]);

  // Setup WebSocket connection
  useEffect(() => {
    if (!room.id || !token) return;

    let reconnectTimer = null;
    let ws = null;

    const connect = () => {
      const wsUrl = process.env.REACT_APP_BACKEND_URL?.replace('https://', 'wss://').replace('http://', 'ws://');
      ws = new WebSocket(`${wsUrl}/ws/chat/${room.id}?token=${token}`);
      
      ws.onopen = () => {
        console.log('Chat WebSocket connected');
        setWsConnected(true);
        // Mark messages as read
        ws.send(JSON.stringify({ type: 'read' }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'new_message') {
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(m => m.id === data.message.id)) return prev;
            return [...prev, data.message];
          });
          scrollToBottom();
          
          // Mark as read if from other user
          if (data.message.sender_id !== user?.id) {
            ws.send(JSON.stringify({ type: 'read' }));
          }
        } else if (data.type === 'typing') {
          if (data.user_id !== user?.id) {
            setTyping(data.user_name);
            setTimeout(() => setTyping(null), 3000);
          }
        }
      };

      ws.onerror = () => {
        console.log('Chat WebSocket error, falling back to polling');
      };

      ws.onclose = () => {
        setWsConnected(false);
        // Auto-reconnect after 5 seconds
        reconnectTimer = setTimeout(() => {
          if (wsRef.current === ws) {
            connect();
          }
        }, 5000);
      };

      wsRef.current = ws;
    };

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      if (ws) ws.close();
      wsRef.current = null;
      setWsConnected(false);
    };
  }, [room.id, token, user?.id]);

  const loadMessages = async () => {
    try {
      const res = await api.get(`/api/chat/rooms/${room.id}/messages`);
      setMessages(res.data.messages || []);
      scrollToBottom();
    } catch (error) {
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image too large. Max 5MB.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/api/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setImageUrl(res.data.url);
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && !imageUrl) || sending) return;
    if (!room.is_active) {
      toast.error('This chat has ended');
      return;
    }

    setSending(true);
    try {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        // Send via WebSocket (server saves to DB and broadcasts)
        wsRef.current.send(JSON.stringify({
          type: 'new_message',
          content: newMessage,
          image_url: imageUrl
        }));
      } else {
        // Fallback to REST API
        const res = await api.post(`/api/chat/rooms/${room.id}/messages`, {
          content: newMessage,
          image_url: imageUrl
        });
        setMessages(prev => [...prev, res.data.data]);
        scrollToBottom();
      }
      
      setNewMessage('');
      setImageUrl('');
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleTyping = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'typing' }));
    }
  };

  const formatMessageTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateSeparator = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const dateKey = new Date(message.created_at).toDateString();
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(message);
    return groups;
  }, {});

  return (
    <div className="flex flex-col h-full min-h-0 bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-white">
        {!isDesktop && (
          <button onClick={onBack} className="p-1 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
        )}
        
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          room.type === 'booking' 
            ? 'bg-gradient-to-br from-saffron to-gold' 
            : 'bg-gradient-to-br from-green-400 to-emerald-500'
        }`}>
          {room.other_participant?.name?.charAt(0) || 'U'}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-800 truncate">
            {room.other_participant?.name || 'Unknown'}
          </h3>
          <p className="text-xs truncate">
            {typing ? (
              <span className="text-green-500 animate-pulse">{typing} is typing...</span>
            ) : wsConnected ? (
              <span className="text-green-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" /> Online
              </span>
            ) : (
              <span className="text-gray-500">{room.context || (room.type === 'booking' ? 'Booking Chat' : 'Order Chat')}</span>
            )}
          </p>
        </div>

        {!room.is_active && (
          <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
            Ended
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-orange-50/30">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-saffron" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle className="w-12 h-12 text-gray-200 mb-3" />
            <p className="text-gray-400">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {Object.entries(groupedMessages).map(([dateKey, dateMessages]) => (
              <div key={dateKey}>
                {/* Date Separator */}
                <div className="flex items-center justify-center my-4">
                  <span className="bg-white text-gray-400 text-xs px-3 py-1 rounded-full shadow-sm">
                    {formatDateSeparator(dateMessages[0].created_at)}
                  </span>
                </div>
                
                {/* Messages for this date */}
                {dateMessages.map((message) => {
                  const isOwn = message.sender_id === user?.id;
                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex mb-3 ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[75%] ${isOwn ? 'order-2' : 'order-1'}`}>
                        {!isOwn && (
                          <span className="text-xs text-gray-400 ml-2 mb-1 block">
                            {message.sender_name}
                          </span>
                        )}
                        <div className={`rounded-2xl px-4 py-2 ${
                          isOwn 
                            ? 'bg-saffron text-white rounded-br-sm' 
                            : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'
                        }`}>
                          {message.image_url && (
                            <img 
                              src={message.image_url} 
                              alt="Shared" 
                              className="max-w-full rounded-lg mb-2 cursor-pointer"
                              onClick={() => window.open(message.image_url, '_blank')}
                            />
                          )}
                          {message.content && (
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          )}
                          <div className={`flex items-center justify-end gap-1 mt-1 ${
                            isOwn ? 'text-white/70' : 'text-gray-400'
                          }`}>
                            <span className="text-xs">{formatMessageTime(message.created_at)}</span>
                            {isOwn && <CheckCheck className="w-3 h-3" />}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ))}
            
            {/* Typing Indicator */}
            {typing && (
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span>{typing} is typing...</span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Image Preview */}
      {imageUrl && (
        <div className="p-2 border-t border-gray-100 bg-gray-50">
          <div className="relative inline-block">
            <img src={imageUrl} alt="Upload" className="h-20 rounded-lg" />
            <button 
              onClick={() => setImageUrl('')}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      {room.is_active ? (
        <div className="p-4 border-t border-gray-100 bg-white">
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="p-2 text-gray-400 hover:text-saffron hover:bg-orange-50 rounded-full transition-colors"
            >
              {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
            </button>
            
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyUp={handleTyping}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-saffron/50"
              data-testid="chat-input"
            />
            
            <button 
              onClick={sendMessage}
              disabled={sending || (!newMessage.trim() && !imageUrl)}
              className="p-2 bg-saffron text-white rounded-full hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="chat-send"
            >
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 border-t border-gray-100 bg-gray-50 text-center">
          <p className="text-gray-400 text-sm">
            {room.chat_expiry_reason === 'expired' 
              ? 'This chat has expired. Book again through the app to continue chatting with this priest.'
              : `This chat has ended. The ${room.type === 'booking' ? 'booking' : 'order'} was ${room.chat_expiry_reason === 'cancelled' ? 'cancelled' : 'completed'}.`
            }
          </p>
        </div>
      )}
    </div>
  );
}

// Main Chat Tab Component
export default function ChatTab({ isDesktop }) {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadUnreadCount = async () => {
    try {
      const res = await api.get('/api/chat/unread-count');
      setUnreadCount(res.data.unread_count || 0);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  // Desktop: Side-by-side layout
  if (isDesktop) {
    return (
      <div className="p-4 lg:p-8 pb-8" style={{ height: 'calc(100vh - 2rem)' }}>
        <div className="bg-white rounded-2xl shadow-sm border border-orange-50 h-full flex overflow-hidden">
          {/* Room List */}
          <div className="w-80 border-r border-gray-100 flex flex-col">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-cinzel text-xl font-bold text-maroon">Messages</h2>
              {unreadCount > 0 && (
                <p className="text-sm text-saffron">{unreadCount} unread message{unreadCount > 1 ? 's' : ''}</p>
              )}
            </div>
            <div className="flex-1 overflow-y-auto">
              <ChatRoomList 
                onSelectRoom={setSelectedRoom} 
                selectedRoomId={selectedRoom?.id}
              />
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col min-h-0">
            {selectedRoom ? (
              <ChatRoom 
                room={selectedRoom} 
                onBack={() => setSelectedRoom(null)}
                isDesktop={true}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <MessageCircle className="w-20 h-20 text-gray-200 mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">Select a Conversation</h3>
                <p className="text-gray-400 max-w-sm">
                  Choose a chat from the list to start messaging with priests or shop owners.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Mobile: Full screen views
  return (
    <div className="pb-20">
      <Toaster position="top-center" richColors />
      
      {selectedRoom ? (
        <div className="fixed inset-0 bg-white z-[60] flex flex-col" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <ChatRoom 
            room={selectedRoom} 
            onBack={() => setSelectedRoom(null)}
            isDesktop={false}
          />
        </div>
      ) : (
        <div className="p-4">
          <h1 className="font-cinzel text-2xl font-bold text-maroon mb-1">Messages</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-saffron mb-4">{unreadCount} unread message{unreadCount > 1 ? 's' : ''}</p>
          )}
          <div className="bg-white rounded-2xl shadow-sm border border-orange-50 overflow-hidden">
            <ChatRoomList 
              onSelectRoom={setSelectedRoom}
              selectedRoomId={null}
            />
          </div>
        </div>
      )}
    </div>
  );
}
