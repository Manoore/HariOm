import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, Star, Sun, ShoppingBag, User, Calendar, MapPin,
  Bell, ChevronRight, Clock, Package, Search, Filter,
  Plus, Minus, ShoppingCart, Heart, Settings, LogOut,
  CheckCircle, ArrowRight, Loader2, X, Menu, BookOpen, Play, Volume2, Music, Pause, SkipForward, SkipBack,
  Camera, MessageCircle, Send, Image as ImageIcon, Rss, MessageSquare, Video, Wallet, Edit, Globe, Check
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { Toaster, toast } from 'sonner';
import ChatTab from '../../components/Chat/ChatTab';
import { WalletCard, RechargeModal, TransactionHistory } from '../../components/Wallet/WalletComponents';
import { AstrologerList, PreCallCheck, VideoCallScreen } from '../../components/VideoConsultation/VideoConsultation';
import AddressAutocomplete from '../../components/AddressAutocomplete';
import { PriestDetailView, AstrologyTab } from '../../components/DevoteeDashboard';
import SmartPayment from '../../components/PaymentComponents';
import NotificationBell from '../../components/NotificationBell';

// 3D Animated Devotional SVG Icons
const BellIcon3D = ({ size = "w-8 h-8" }) => (
  <motion.svg viewBox="0 0 100 100" className={size} animate={{ rotate: [-3, 3, -3] }} transition={{ duration: 0.4, repeat: Infinity }}>
    <defs>
      <linearGradient id="bellGradD" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFD700" />
        <stop offset="100%" stopColor="#CD853F" />
      </linearGradient>
    </defs>
    <ellipse cx="50" cy="15" rx="5" ry="5" fill="#B8860B" />
    <path d="M45 15 L45 25 Q30 35 30 60 L70 60 Q70 35 55 25 L55 15" fill="url(#bellGradD)" />
    <ellipse cx="50" cy="60" rx="22" ry="8" fill="#CD853F" />
    <circle cx="50" cy="70" r="6" fill="#B8860B" />
  </motion.svg>
);

const ZodiacIcon3D = ({ size = "w-8 h-8" }) => (
  <motion.svg viewBox="0 0 100 100" className={size} animate={{ rotate: [0, 360] }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }}>
    <defs>
      <linearGradient id="zodiacGradD" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4B0082" />
        <stop offset="100%" stopColor="#9400D3" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="35" fill="none" stroke="url(#zodiacGradD)" strokeWidth="3" />
    <circle cx="50" cy="50" r="25" fill="none" stroke="#FFD700" strokeWidth="1" strokeDasharray="4 4" />
    <circle cx="50" cy="18" r="4" fill="#FFD700" />
    <circle cx="82" cy="50" r="4" fill="#FFD700" />
    <circle cx="50" cy="82" r="4" fill="#FFD700" />
    <circle cx="18" cy="50" r="4" fill="#FFD700" />
    <circle cx="50" cy="50" r="6" fill="#4B0082" />
  </motion.svg>
);

const TempleIcon3D = ({ size = "w-8 h-8" }) => (
  <motion.svg viewBox="0 0 100 100" className={size} animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity }}>
    <defs>
      <linearGradient id="templeGradD" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#DEB887" />
        <stop offset="100%" stopColor="#CD853F" />
      </linearGradient>
      <linearGradient id="roofGradD" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFD700" />
        <stop offset="100%" stopColor="#B8860B" />
      </linearGradient>
    </defs>
    <rect x="20" y="65" width="60" height="30" fill="url(#templeGradD)" />
    <rect x="28" y="45" width="44" height="20" fill="url(#templeGradD)" />
    <polygon points="50,10 78,45 22,45" fill="url(#roofGradD)" />
    <circle cx="50" cy="28" r="5" fill="#FFD700" />
    <rect x="40" y="70" width="20" height="25" fill="#4A3728" />
  </motion.svg>
);

const CartIcon3D = ({ size = "w-8 h-8" }) => (
  <motion.svg viewBox="0 0 100 100" className={size} animate={{ y: [0, -3, 0] }} transition={{ duration: 2, repeat: Infinity }}>
    <defs>
      <linearGradient id="cartGradD" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#DEB887" />
        <stop offset="100%" stopColor="#8B4513" />
      </linearGradient>
    </defs>
    <path d="M20 35 L30 75 L70 75 L80 35 Z" fill="url(#cartGradD)" stroke="#8B4513" strokeWidth="2" />
    <path d="M25 45 L75 45 M27 55 L73 55 M29 65 L71 65" stroke="#A0522D" strokeWidth="2" fill="none" />
    <ellipse cx="35" cy="28" rx="6" ry="8" fill="#FF6347" />
    <ellipse cx="50" cy="26" rx="5" ry="7" fill="#FFD700" />
    <ellipse cx="65" cy="28" rx="6" ry="8" fill="#32CD32" />
  </motion.svg>
);

// Check if desktop
const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isDesktop;
};

// Sidebar Navigation for Desktop
function Sidebar({ activeTab, setActiveTab, user, unreadMessages }) {
  const { cartCount } = useCart();
  const { logout } = useAuth();
  
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'messages', icon: MessageSquare, label: 'Messages', badge: unreadMessages },
    { id: 'consultation', icon: Video, label: 'Call Astrologer' },
    { id: 'classes', icon: BookOpen, label: 'Vedic Classes' },
    { id: 'live', icon: Play, label: 'Live Events' },
    { id: 'feed', icon: Rss, label: 'Spiritual Feed' },
    { id: 'mantras', icon: Music, label: 'Mantras & Shlokas' },
    { id: 'calendar', icon: Calendar, label: 'Festival Calendar' },
    { id: 'priests', icon: Star, label: 'Book Priests' },
    { id: 'astrology', icon: Sun, label: 'Astrology' },
    { id: 'shop', icon: ShoppingBag, label: 'Pooja Store' },
    { id: 'profile', icon: User, label: 'My Account' },
  ];

  return (
    <div className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-orange-100 flex flex-col z-40">
      {/* Logo */}
      <div className="p-6 border-b border-orange-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <ellipse cx="50" cy="85" rx="30" ry="8" fill="#B8860B" />
              <path d="M30 85 Q30 70 35 60 L65 60 Q70 70 70 85" fill="#FFD700" />
              <ellipse cx="50" cy="60" rx="18" ry="6" fill="#FFD700" />
              <path d="M50 55 Q45 40 50 25 Q55 40 50 55" fill="#FF9933" />
            </svg>
          </div>
          <span className="font-cinzel text-xl font-bold text-maroon">DIVINE</span>
        </div>
      </div>

      {/* User Info - Clickable to go to profile */}
      <button 
        onClick={() => setActiveTab('profile')}
        className="p-4 border-b border-orange-100 w-full text-left hover:bg-orange-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-saffron to-gold rounded-full flex items-center justify-center text-white font-cinzel">
            {user?.name?.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-gray-800 hover:text-saffron transition-colors">{user?.name}</p>
            <p className="text-xs text-gray-500">{user?.role}</p>
          </div>
        </div>
      </button>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === tab.id 
                ? 'bg-saffron text-white' 
                : 'text-gray-600 hover:bg-orange-50'
            }`}
            data-testid={`sidebar-${tab.id}`}
          >
            <div className="relative">
              <tab.icon className="w-5 h-5" />
              {tab.id === 'shop' && cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
              {tab.id === 'messages' && tab.badge > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                  {tab.badge > 9 ? '9+' : tab.badge}
                </span>
              )}
            </div>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-orange-100">
        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
          data-testid="sidebar-logout"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

// Bottom Navigation Component for Mobile
function BottomNav({ activeTab, setActiveTab, unreadMessages }) {
  const { cartCount } = useCart();
  
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'messages', icon: MessageSquare, label: 'Chat', badge: unreadMessages },
    { id: 'feed', icon: Rss, label: 'Feed' },
    { id: 'shop', icon: ShoppingBag, label: 'Shop' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-orange-100 px-2 py-2 z-50 lg:hidden">
      <div className="flex justify-around items-center">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
              activeTab === tab.id ? 'text-saffron' : 'text-gray-400'
            }`}
            data-testid={`nav-${tab.id}`}
          >
            <div className="relative">
              <tab.icon className={`w-6 h-6 ${activeTab === tab.id ? 'stroke-[2.5]' : ''}`} />
              {tab.id === 'shop' && cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-saffron text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
              {tab.id === 'messages' && tab.badge > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                  {tab.badge > 9 ? '9+' : tab.badge}
                </span>
              )}
            </div>
            <span className={`text-xs mt-1 ${activeTab === tab.id ? 'font-semibold' : ''}`}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// PostCard Component with Comments and Likes
function PostCard({ post }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentImage, setCommentImage] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Check if user has liked this post
    if (user) {
      api.get(`/api/posts/${post.id}/like-status`)
        .then(res => setLiked(res.data.liked))
        .catch(() => {});
    }
  }, [post.id, user]);

  const handleLike = async () => {
    if (!user) {
      toast.error('Please login to like posts');
      return;
    }
    try {
      const res = await api.post(`/api/posts/${post.id}/like`);
      setLiked(res.data.liked);
      setLikesCount(prev => res.data.liked ? prev + 1 : prev - 1);
    } catch (error) {
      toast.error('Failed to like post');
    }
  };

  const loadComments = async () => {
    if (!showComments) {
      setLoadingComments(true);
      try {
        const res = await api.get(`/api/posts/${post.id}/comments`);
        setComments(res.data.comments || []);
      } catch (error) {
        console.error('Failed to load comments:', error);
      } finally {
        setLoadingComments(false);
      }
    }
    setShowComments(!showComments);
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
      setCommentImage(res.data.url);
      toast.success('Image uploaded!');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const submitComment = async () => {
    if (!user) {
      toast.error('Please login to comment');
      return;
    }
    if (!newComment.trim() && !commentImage) {
      toast.error('Please add text or image');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post(`/api/posts/${post.id}/comments`, {
        content: newComment,
        image_url: commentImage
      });
      setComments([res.data.comment, ...comments]);
      setNewComment('');
      setCommentImage('');
      toast.success('Comment added!');
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await api.delete(`/api/posts/${post.id}/comments/${commentId}`);
      setComments(comments.filter(c => c.id !== commentId));
      toast.success('Comment deleted');
    } catch (error) {
      toast.error('Failed to delete comment');
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-orange-50">
      {/* Post Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-saffron to-gold rounded-full flex items-center justify-center text-white font-cinzel flex-shrink-0">
          {post.priest_name?.charAt(0) || 'P'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-800">{post.priest_name || 'Priest'}</p>
            <span className="text-xs bg-orange-100 text-saffron px-2 py-0.5 rounded-full">Priest</span>
          </div>
          <p className="text-xs text-gray-400">
            {new Date(post.created_at).toLocaleDateString('en-IN', { 
              day: 'numeric', 
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>
      
      {/* Post Content */}
      <p className="mt-3 text-gray-700 text-sm leading-relaxed">
        {post.content}
      </p>
      
      {/* Post Image */}
      {post.image_url && (
        <img 
          src={post.image_url} 
          alt="Post" 
          className="mt-3 w-full h-48 object-cover rounded-xl"
        />
      )}
      
      {/* Actions Bar */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
        <button 
          onClick={handleLike}
          className={`flex items-center gap-1 transition-colors ${liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
        >
          <Heart className={`w-4 h-4 ${liked ? 'fill-red-500' : ''}`} />
          <span className="text-xs">{likesCount}</span>
        </button>
        <button 
          onClick={loadComments}
          className="flex items-center gap-1 text-gray-500 hover:text-saffron transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="text-xs">{post.comments || comments.length}</span>
        </button>
        <span className="flex items-center gap-1 text-gray-400 ml-auto">
          <span className="text-xs">{post.views || 0} views</span>
        </span>
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 border-t border-gray-100"
          >
            {/* Add Comment Form */}
            <div className="flex gap-2 mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 bg-transparent text-sm focus:outline-none"
                    onKeyPress={(e) => e.key === 'Enter' && submitComment()}
                  />
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
                    className="p-1 text-gray-400 hover:text-saffron"
                  >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={submitComment}
                    disabled={submitting || (!newComment.trim() && !commentImage)}
                    className="p-1 text-saffron disabled:text-gray-300"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
                {commentImage && (
                  <div className="relative mt-2 inline-block">
                    <img src={commentImage} alt="Upload" className="h-16 rounded-lg" />
                    <button 
                      onClick={() => setCommentImage('')}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Comments List */}
            {loadingComments ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-saffron" />
              </div>
            ) : comments.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-2">No comments yet. Be the first!</p>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center text-gray-600 text-xs font-medium flex-shrink-0 overflow-hidden">
                      {comment.user_photo ? (
                        <img src={comment.user_photo} alt="" className="w-full h-full object-cover" />
                      ) : (
                        comment.user_name?.charAt(0) || 'U'
                      )}
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-gray-700">{comment.user_name}</p>
                        {user && comment.user_id === user.id && (
                          <button 
                            onClick={() => deleteComment(comment.id)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      {comment.content && (
                        <p className="text-sm text-gray-600 mt-1">{comment.content}</p>
                      )}
                      {comment.image_url && (
                        <img src={comment.image_url} alt="Comment" className="mt-2 max-h-32 rounded-lg" />
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(comment.created_at).toLocaleDateString('en-IN', { 
                          day: 'numeric', 
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Feed Tab - Dedicated Spiritual Updates Feed
function FeedTab({ isDesktop }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  useEffect(() => {
    loadPosts(0);
  }, []);

  const loadPosts = async (pageNum) => {
    try {
      setLoading(true);
      const res = await api.get(`/api/posts/feed?limit=10&skip=${pageNum * 10}`);
      const newPosts = res.data.posts || [];
      
      if (pageNum === 0) {
        setPosts(newPosts);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
      }
      
      setHasMore(newPosts.length === 10);
    } catch (error) {
      console.error('Error loading posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadPosts(nextPage);
  };

  return (
    <div className={`p-4 lg:p-8 pb-24 lg:pb-8 ${isDesktop ? 'max-w-4xl mx-auto' : ''}`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-cinzel text-2xl font-bold text-maroon mb-1">Spiritual Feed</h1>
        <p className="text-gray-500 text-sm">Updates from our priests and spiritual guides</p>
      </div>

      {/* Posts */}
      {loading && posts.length === 0 ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-saffron" />
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-orange-50">
          <Rss className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-700 mb-1">No Posts Yet</h3>
          <p className="text-gray-400 text-sm">Follow priests to see their spiritual updates here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
          
          {/* Load More Button */}
          {hasMore && (
            <div className="text-center pt-4">
              <button
                onClick={loadMore}
                disabled={loading}
                className="px-6 py-2 bg-saffron text-white rounded-full text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-50"
                data-testid="load-more-posts"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </span>
                ) : (
                  'Load More'
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Consultation Tab - Video Call with Astrologers
function ConsultationTab({ isDesktop }) {
  const [selectedAstrologer, setSelectedAstrologer] = useState(null);
  const [showPreCall, setShowPreCall] = useState(false);
  const [callData, setCallData] = useState(null);
  const [showRecharge, setShowRecharge] = useState(false);

  const handleSelectAstrologer = (astrologer) => {
    setSelectedAstrologer(astrologer);
    setShowPreCall(true);
  };

  const handleStartCall = (data) => {
    setCallData(data);
    setShowPreCall(false);
  };

  const handleEndCall = (reason) => {
    setCallData(null);
    setSelectedAstrologer(null);
    if (reason === 'insufficient_balance') {
      toast.error('Call ended due to insufficient balance');
    } else {
      toast.success('Call ended');
    }
  };

  // If in a call, show full-screen video
  if (callData) {
    return (
      <VideoCallScreen
        callData={callData}
        onEndCall={handleEndCall}
        astrologerInfo={selectedAstrologer}
      />
    );
  }

  return (
    <div className={`p-4 lg:p-8 pb-24 lg:pb-8 ${isDesktop ? 'max-w-6xl mx-auto' : ''}`}>
      {/* Pre-Call Check Modal */}
      {showPreCall && selectedAstrologer && (
        <PreCallCheck
          astrologer={selectedAstrologer}
          onStartCall={handleStartCall}
          onCancel={() => {
            setShowPreCall(false);
            setSelectedAstrologer(null);
          }}
        />
      )}

      {/* Recharge Modal */}
      <RechargeModal
        isOpen={showRecharge}
        onClose={() => setShowRecharge(false)}
        onSuccess={() => setShowRecharge(false)}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-cinzel text-2xl font-bold text-maroon mb-1">Video Consultation</h1>
          <p className="text-gray-500 text-sm">Connect with expert astrologers via video call</p>
        </div>
        <button
          onClick={() => setShowRecharge(true)}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-purple-700 transition-colors"
          data-testid="wallet-recharge-btn"
        >
          <Wallet className="w-4 h-4" />
          Recharge Wallet
        </button>
      </div>

      {/* Wallet Card */}
      <div className="mb-8">
        <WalletCard onRecharge={() => setShowRecharge(true)} />
      </div>

      {/* Available Astrologers */}
      <div className="mb-4">
        <h2 className="font-semibold text-lg text-gray-800 mb-1">Available Astrologers</h2>
        <p className="text-gray-500 text-sm">Select an astrologer to start a consultation</p>
      </div>

      <AstrologerList onSelectAstrologer={handleSelectAstrologer} />
    </div>
  );
}

// Home Tab Content
function HomeTab({ setActiveTab, setSelectedPriest, isDesktop }) {
  const { user } = useAuth();
  const [priests, setPriests] = useState([]);
  const [festivals, setFestivals] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [horoscope, setHoroscope] = useState(null);
  const [priestPosts, setPriestPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewBooking, setReviewBooking] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelBooking, setCancelBooking] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancellationPreview, setCancellationPreview] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const requests = [
        api.get('/api/priests?limit=3'),
        api.get('/api/festivals/upcoming?limit=3'),
        api.get('/api/bookings'),
        api.get('/api/orders'),
        api.get('/api/posts/feed?limit=5')
      ];
      
      // Fetch personalized horoscope if user has nakshatra or DOB
      if (user?.nakshatra || user?.date_of_birth) {
        requests.push(api.get('/api/horoscope/personalized'));
      }
      
      const results = await Promise.all(requests);
      
      setPriests(results[0].data.priests || []);
      setFestivals(results[1].data.festivals || []);
      setBookings((results[2].data.bookings || []).slice(0, 3));
      setOrders((results[3].data.orders || []).slice(0, 3));
      setPriestPosts(results[4].data.posts || []);
      
      if (results[5]) {
        setHoroscope(results[5].data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch cancellation preview when opening cancel modal
  const fetchCancellationPreview = async (bookingId) => {
    try {
      const res = await api.get(`/api/bookings/${bookingId}/cancellation-preview`);
      setCancellationPreview(res.data);
    } catch (error) {
      console.error('Failed to get cancellation preview:', error);
      setCancellationPreview(null);
    }
  };

  // Handle opening cancel modal
  const openCancelModal = async (booking) => {
    setCancelBooking(booking);
    setShowCancelModal(true);
    await fetchCancellationPreview(booking.id);
  };

  // Handle booking cancellation
  const handleCancelBooking = async (reason = '') => {
    if (!cancelBooking) return;
    setCancelLoading(true);
    try {
      const res = await api.post(`/api/bookings/${cancelBooking.id}/cancel`, { reason });
      toast.success(`Booking cancelled. ${res.data.refund_amount > 0 ? `Refund of ₹${res.data.refund_amount} will be processed.` : ''}`);
      setShowCancelModal(false);
      setCancelBooking(null);
      setCancellationPreview(null);
      fetchData(); // Refresh bookings
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to cancel booking');
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className={`pb-24 lg:pb-8 ${isDesktop ? 'px-8' : 'px-4'}`}>
      {/* Header - Name is clickable */}
      <div className="pt-4 pb-6 flex items-start justify-between">
        <div>
          <p className="text-gray-500 text-sm">Namaste,</p>
          <button 
            onClick={() => setActiveTab('profile')}
            className="text-left hover:opacity-80 transition-opacity"
            data-testid="home-user-name"
          >
            <h1 className="font-cinzel text-2xl lg:text-3xl font-bold text-maroon hover:text-saffron transition-colors">
              {user?.name || 'Devotee'}
            </h1>
          </button>
        </div>
        <NotificationBell />
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
                <div className="bg-white/20 px-3 py-1 rounded-full">
                  Lucky No: {horoscope.data.daily_prediction.lucky_number}
                </div>
              )}
              {horoscope.data?.daily_prediction?.lucky_color && (
                <div className="bg-white/20 px-3 py-1 rounded-full">
                  Color: {horoscope.data.daily_prediction.lucky_color}
                </div>
              )}
            </div>
            <button 
              onClick={() => setActiveTab('astrology')}
              className="mt-4 text-sm text-white/80 hover:text-white flex items-center gap-1"
            >
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
                <p className="text-gray-600 text-sm mb-3">
                  Complete your profile with your date of birth or nakshatra to receive personalized horoscope predictions.
                </p>
                <button 
                  onClick={() => setActiveTab('profile')}
                  className="text-sm text-saffron font-medium hover:underline flex items-center gap-1"
                >
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
            <button onClick={() => setActiveTab('calendar')} className="text-saffron text-sm">
              View all
            </button>
          </div>
          <div className={`${isDesktop ? 'grid grid-cols-1 gap-3' : 'flex gap-3 overflow-x-auto pb-2 -mx-4 px-4'} scrollbar-hide`}>
            {festivals.map((festival, idx) => (
              <div 
                key={idx}
                className={`${isDesktop ? '' : 'flex-shrink-0 w-44'} bg-gradient-to-br ${
                  festival.is_today ? 'from-gold to-amber-500' : 
                  festival.is_tomorrow ? 'from-saffron to-orange-500' : 
                  'from-maroon to-maroon/80'
                } rounded-2xl p-4 text-white`}
              >
                <div className="flex items-start justify-between mb-2">
                  <Calendar className="w-5 h-5 opacity-80" />
                  {festival.is_today && (
                    <span className="bg-white/30 text-xs px-2 py-0.5 rounded-full">Today!</span>
                  )}
                  {festival.is_tomorrow && (
                    <span className="bg-white/30 text-xs px-2 py-0.5 rounded-full">Tomorrow</span>
                  )}
                </div>
                <p className="font-semibold text-sm">{festival.name}</p>
                <p className="text-xs opacity-80 mt-1">{festival.display_date}</p>
                <p className="text-xs opacity-70 mt-0.5">
                  {festival.days_until === 0 ? 'Today' : `${festival.days_until} days away`}
                </p>
              </div>
            ))}
            {festivals.length === 0 && (
              <div className="text-center py-4 text-gray-500 text-sm">
                Loading festivals...
              </div>
            )}
          </div>
        </div>

        {/* Featured Priests */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-cinzel text-lg font-semibold text-maroon">Featured Priests</h2>
            <button onClick={() => setActiveTab('priests')} className="text-saffron text-sm">
              See all
            </button>
          </div>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-saffron animate-spin" />
            </div>
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
            <button onClick={() => setActiveTab('feed')} className="text-saffron text-sm">
              View all
            </button>
          </div>
          <div className="space-y-4">
            {priestPosts.slice(0, 3).map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      )}

      {/* My Bookings & My Orders Row - At Bottom */}
      <div className={`${isDesktop ? 'grid grid-cols-2 gap-8' : ''} mt-4`}>
        {/* My Bookings */}
        <div className="mb-6 lg:mb-0">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-cinzel text-lg font-semibold text-maroon">My Bookings</h2>
          </div>
          {bookings.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center border border-orange-50">
              <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No bookings yet</p>
              <button 
                onClick={() => setActiveTab('priests')}
                className="mt-3 text-saffron text-sm font-medium hover:underline"
              >
                Book a Priest
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {bookings.map((booking) => (
                <div key={booking.id} className="bg-white rounded-xl p-4 border border-orange-50 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-800">{booking.service_name}</p>
                      <p className="text-sm text-gray-500">{booking.priest_name}</p>
                      {(booking.booking_date || booking.scheduled_date) && (
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(booking.booking_date || booking.scheduled_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        booking.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                        booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {booking.status}
                      </span>
                      {booking.status === 'completed' && !booking.has_review && (
                        <button
                          onClick={() => {
                            setReviewBooking(booking);
                            setShowReviewModal(true);
                          }}
                          className="text-xs text-saffron hover:underline flex items-center gap-1"
                          data-testid={`write-review-${booking.id}`}
                        >
                          <Star className="w-3 h-3" />
                          Write Review
                        </button>
                      )}
                      {booking.has_review && (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Reviewed
                        </span>
                      )}
                      {(booking.status === 'pending' || booking.status === 'confirmed') && (
                        <button
                          onClick={() => openCancelModal(booking)}
                          className="text-xs text-red-500 hover:underline flex items-center gap-1"
                          data-testid={`cancel-booking-${booking.id}`}
                        >
                          <X className="w-3 h-3" />
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Orders */}
        <div className="mb-6 lg:mb-0">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-cinzel text-lg font-semibold text-maroon">My Orders</h2>
          </div>
          {orders.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center border border-orange-50">
              <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No orders yet</p>
              <button 
                onClick={() => setActiveTab('shop')}
                className="mt-3 text-saffron text-sm font-medium hover:underline"
              >
                Visit Pooja Store
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {orders.map((order) => (
                <div key={order.id} className="bg-white rounded-xl p-4 border border-orange-50 shadow-sm">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <Package className="w-5 h-5 text-saffron" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">Order #{order.id?.slice(-6)}</p>
                        <p className="text-sm text-gray-500">₹{order.total_amount}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                      order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                      order.status === 'processing' ? 'bg-purple-100 text-purple-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && reviewBooking && (
        <ReviewModal
          booking={reviewBooking}
          onClose={() => {
            setShowReviewModal(false);
            setReviewBooking(null);
          }}
          onSuccess={() => {
            setShowReviewModal(false);
            setReviewBooking(null);
            fetchData();
            toast.success('Review submitted successfully!');
          }}
        />
      )}

      {/* Cancel Booking Modal */}
      {showCancelModal && cancelBooking && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-md w-full p-6"
          >
            <h3 className="font-cinzel text-xl font-bold text-maroon mb-2">
              Cancel Booking
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to cancel <strong>{cancelBooking.service_name}</strong> with {cancelBooking.priest_name}?
            </p>

            {/* Cancellation Policy Preview */}
            {cancellationPreview ? (
              <div className={`rounded-xl p-4 mb-4 ${
                cancellationPreview.refund_percentage === 100 ? 'bg-green-50 border border-green-200' :
                cancellationPreview.refund_percentage === 50 ? 'bg-yellow-50 border border-yellow-200' :
                'bg-red-50 border border-red-200'
              }`}>
                <p className="font-semibold text-gray-800 mb-2">Refund Policy</p>
                <p className={`text-sm ${
                  cancellationPreview.refund_percentage === 100 ? 'text-green-700' :
                  cancellationPreview.refund_percentage === 50 ? 'text-yellow-700' :
                  'text-red-700'
                }`}>
                  {cancellationPreview.policy_message}
                </p>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
                  <span className="text-gray-600">Booking Amount</span>
                  <span className="font-medium">₹{cancellationPreview.booking_price}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-600">Refund Amount</span>
                  <span className={`font-bold ${
                    cancellationPreview.refund_amount > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ₹{cancellationPreview.refund_amount}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-saffron" />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelBooking(null);
                  setCancellationPreview(null);
                }}
                className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                disabled={cancelLoading}
              >
                Keep Booking
              </button>
              <button
                onClick={() => handleCancelBooking()}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                disabled={cancelLoading}
              >
                {cancelLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Confirm Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// Mantras & Shlokas Tab Content
function MantrasTab({ isDesktop }) {
  const [deities, setDeities] = useState([]);
  const [selectedDeity, setSelectedDeity] = useState(null);
  const [mantras, setMantras] = useState([]);
  const [stotras, setStotras] = useState([]);
  const [todayDevotional, setTodayDevotional] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('today');
  const [expandedMantra, setExpandedMantra] = useState(null);
  
  // Translation states
  const [selectedLanguage, setSelectedLanguage] = useState('english');
  const [translations, setTranslations] = useState({});
  const [translating, setTranslating] = useState(false);
  
  const languages = [
    { code: 'english', name: 'English', native: 'English' },
    { code: 'hindi', name: 'Hindi', native: 'हिंदी' },
    { code: 'telugu', name: 'Telugu', native: 'తెలుగు' },
    { code: 'kannada', name: 'Kannada', native: 'ಕನ್ನಡ' },
    { code: 'tamil', name: 'Tamil', native: 'தமிழ்' },
    { code: 'malayalam', name: 'Malayalam', native: 'മലയാളം' },
  ];

  useEffect(() => {
    fetchData();
  }, []);
  
  // Translate text
  const translateText = async (text, mantraKey) => {
    if (!text || selectedLanguage === 'english') {
      return text; // No translation needed for English
    }
    
    // Check cache first
    const cacheKey = `${mantraKey}_${selectedLanguage}`;
    if (translations[cacheKey]) {
      return translations[cacheKey];
    }
    
    try {
      const res = await api.post('/api/translate', {
        text: text,
        target_lang: selectedLanguage
      });
      
      if (res.data.status === 'ok') {
        // Cache the translation
        setTranslations(prev => ({
          ...prev,
          [cacheKey]: res.data.translated
        }));
        return res.data.translated;
      }
    } catch (error) {
      console.error('Translation error:', error);
    }
    return text;
  };
  
  // Translate all visible mantras when language changes
  useEffect(() => {
    if (selectedLanguage !== 'english' && todayDevotional?.mantras) {
      translateMantras(todayDevotional.mantras);
    }
  }, [selectedLanguage, todayDevotional]);
  
  const translateMantras = async (mantrasToTranslate) => {
    if (selectedLanguage === 'english') return;
    
    setTranslating(true);
    for (const mantra of mantrasToTranslate) {
      if (mantra.meaning_english) {
        await translateText(mantra.meaning_english, mantra.name);
      }
    }
    setTranslating(false);
  };
  
  // Get translation for a mantra
  const getTranslation = (mantra) => {
    if (selectedLanguage === 'english') {
      return mantra.meaning_english;
    }
    if (selectedLanguage === 'hindi' && mantra.meaning_hindi) {
      return mantra.meaning_hindi;
    }
    const cacheKey = `${mantra.name}_${selectedLanguage}`;
    return translations[cacheKey] || mantra.meaning_english;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [deitiesRes, todayRes] = await Promise.all([
        api.get('/api/devotional/deities'),
        api.get('/api/devotional/today')
      ]);
      setDeities(deitiesRes.data.data || []);
      setTodayDevotional(todayRes.data.data);
    } catch (error) {
      console.error('Error fetching devotional content:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeityContent = async (deityId) => {
    try {
      const res = await api.get(`/api/devotional/deities/${deityId}`);
      setSelectedDeity(res.data.data);
      const deityMantras = res.data.data.mantras || [];
      setMantras(deityMantras);
      setStotras(res.data.data.stotras || []);
      
      // Translate mantras if not English
      if (selectedLanguage !== 'english' && deityMantras.length > 0) {
        for (const mantra of deityMantras) {
          if (mantra.meaning_english) {
            translateText(mantra.meaning_english, mantra.name);
          }
        }
      }
    } catch (error) {
      toast.error('Failed to load content');
    }
  };

  // Translate deity mantras when language changes
  useEffect(() => {
    if (selectedLanguage !== 'english' && mantras.length > 0 && activeSection === 'deities') {
      mantras.forEach(mantra => {
        if (mantra.meaning_english) {
          translateText(mantra.meaning_english, mantra.name);
        }
      });
    }
  }, [selectedLanguage, mantras, activeSection]);

  const sections = [
    { id: 'today', name: "Today's Worship", icon: Calendar },
    { id: 'deities', name: 'By Deity', icon: Star },
    { id: 'all', name: 'All Mantras', icon: BookOpen },
    { id: 'audio', name: 'Audio Library', icon: Music },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 text-saffron animate-spin" />
      </div>
    );
  }

  return (
    <div className={`pb-24 lg:pb-8 ${isDesktop ? 'px-8' : 'px-4'}`}>
      <div className="pt-4 pb-6">
        <h1 className="font-cinzel text-2xl lg:text-3xl font-bold text-maroon">Mantras & Shlokas</h1>
        <p className="text-gray-500 text-sm">Sacred texts for daily worship</p>
      </div>

      {/* Section Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 pb-2">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => {
              setActiveSection(section.id);
              setSelectedDeity(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
              activeSection === section.id
                ? 'bg-saffron text-white'
                : 'bg-cream text-maroon hover:bg-saffron/20'
            }`}
          >
            <section.icon className="w-4 h-4" />
            <span className="text-sm">{section.name}</span>
          </button>
        ))}
        
        <div className="flex gap-2 ml-auto">
          {/* Language Selector */}
          <div className="relative">
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="appearance-none bg-cream text-maroon px-4 py-2 pr-8 rounded-full text-sm focus:ring-2 focus:ring-saffron outline-none cursor-pointer"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.native}
                </option>
              ))}
            </select>
            <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-maroon rotate-90 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Today's Worship Section */}
      {activeSection === 'today' && todayDevotional && (
        <div className="space-y-6">
          {/* Today's Deity Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-saffron to-gold rounded-2xl p-6 text-white"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white/80 text-sm">{todayDevotional.day} • {todayDevotional.day_hindi}</p>
                <h2 className="font-cinzel text-2xl">{todayDevotional.deity?.name}</h2>
                <p className="text-white/70 text-sm">{todayDevotional.deity?.name_hindi}</p>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-3xl">🙏</span>
              </div>
            </div>
            <p className="text-white/90 text-sm">{todayDevotional.deity?.description}</p>
            <div className="flex gap-2 mt-4">
              <span className="bg-white/20 px-3 py-1 rounded-full text-xs">
                Planet: {todayDevotional.planet}
              </span>
              <span className="bg-white/20 px-3 py-1 rounded-full text-xs">
                {todayDevotional.deity?.mantra_count} Mantras
              </span>
            </div>
          </motion.div>

          {/* Today's Mantras */}
          <div>
            <h3 className="font-cinzel text-lg text-maroon mb-4">Today's Mantras</h3>
            <div className="space-y-4">
              {todayDevotional.mantras?.map((mantra, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-cream rounded-2xl p-5 border border-saffron/20"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-maroon">{mantra.name}</h4>
                      <p className="text-gray-500 text-xs">{mantra.name_hindi}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      mantra.tier === 'free' ? 'bg-green-100 text-green-700' : 'bg-gold/20 text-gold'
                    }`}>
                      {mantra.tier === 'free' ? 'Free' : 'Premium'}
                    </span>
                  </div>
                  
                  {/* Sanskrit Text */}
                  <div className="bg-white rounded-xl p-4 mb-3">
                    <p className="text-lg text-maroon font-sanskrit text-center leading-relaxed">
                      {mantra.sanskrit}
                    </p>
                  </div>
                  
                  {/* Transliteration */}
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">Transliteration:</p>
                    <p className="text-sm text-gray-700 italic">{mantra.transliteration}</p>
                  </div>
                  
                  {/* Translation in selected language */}
                  <div className="bg-saffron/5 rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-gray-500">
                        Translation ({languages.find(l => l.code === selectedLanguage)?.native}):
                      </p>
                      {translating && (
                        <Loader2 className="w-3 h-3 text-saffron animate-spin" />
                      )}
                    </div>
                    <p className="text-sm text-gray-800">{getTranslation(mantra)}</p>
                  </div>
                  
                  <button
                    onClick={() => setExpandedMantra(expandedMantra === mantra.name ? null : mantra.name)}
                    className="text-saffron text-sm mt-2 flex items-center gap-1"
                  >
                    {expandedMantra === mantra.name ? 'Show less' : 'Show benefits & instructions'}
                    <ChevronRight className={`w-4 h-4 transition-transform ${expandedMantra === mantra.name ? 'rotate-90' : ''}`} />
                  </button>
                  
                  {expandedMantra === mantra.name && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="mt-3 pt-3 border-t border-saffron/10"
                    >
                      <p className="text-xs text-gray-500 mb-2">Benefits:</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {mantra.benefits?.map((benefit, i) => (
                          <span key={i} className="text-xs bg-saffron/10 text-maroon px-2 py-1 rounded-full">
                            {benefit}
                          </span>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-saffron" />
                          Best time: {mantra.best_time}
                        </div>
                        <div>
                          Chant: {mantra.chant_count} times
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* By Deity Section */}
      {activeSection === 'deities' && (
        <div className={`${isDesktop ? 'grid grid-cols-2 gap-8' : ''}`}>
          {/* Deity List */}
          <div className={`grid ${isDesktop ? 'grid-cols-2' : 'grid-cols-3'} gap-3 mb-6`}>
            {deities.map((deity) => (
              <button
                key={deity.id}
                onClick={() => fetchDeityContent(deity.id)}
                className={`p-3 rounded-2xl text-center transition-all ${
                  selectedDeity?.id === deity.id
                    ? 'bg-saffron text-white ring-2 ring-gold'
                    : 'bg-cream text-maroon hover:bg-saffron/20'
                }`}
                style={{ borderLeft: `4px solid ${deity.color}` }}
              >
                <p className="font-semibold text-sm">{deity.name.replace('Lord ', '')}</p>
                <p className="text-xs opacity-70">{deity.name_hindi}</p>
                <p className="text-xs mt-1">{deity.mantra_count} mantras</p>
              </button>
            ))}
          </div>

          {/* Selected Deity Content */}
          {selectedDeity && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="bg-cream rounded-2xl p-5 border border-saffron/20 mb-4">
                <h3 className="font-cinzel text-xl text-maroon">{selectedDeity.name}</h3>
                <p className="text-gray-500 text-sm">{selectedDeity.name_sanskrit}</p>
                <p className="text-gray-600 text-sm mt-2">{selectedDeity.description}</p>
                <div className="flex gap-2 mt-3">
                  <span className="text-xs bg-saffron/10 text-maroon px-2 py-1 rounded-full">
                    {selectedDeity.associated_day}
                  </span>
                  <span className="text-xs bg-saffron/10 text-maroon px-2 py-1 rounded-full">
                    Planet: {selectedDeity.associated_planet}
                  </span>
                </div>
              </div>

              {/* Mantras for selected deity */}
              <h4 className="font-cinzel text-lg text-maroon mb-3">Mantras</h4>
              <div className="space-y-3">
                {mantras.map((mantra, idx) => (
                  <div key={idx} className="bg-white rounded-xl p-4 border border-saffron/10">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-maroon">{mantra.name}</p>
                        <p className="text-xs text-gray-500">{mantra.type?.replace('_', ' ')}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        mantra.tier === 'free' ? 'bg-green-100 text-green-700' : 'bg-gold/20 text-gold'
                      }`}>
                        {mantra.tier}
                      </span>
                    </div>
                    <div className="bg-cream rounded-lg p-3 my-2">
                      <p className="text-maroon text-center">{mantra.sanskrit}</p>
                    </div>
                    <p className="text-xs text-gray-600 italic mb-2">{mantra.transliteration}</p>
                    
                    {/* Translation */}
                    <div className="bg-saffron/5 rounded-lg p-2 mt-2">
                      <p className="text-xs text-gray-500 mb-1">
                        Translation ({languages.find(l => l.code === selectedLanguage)?.native}):
                      </p>
                      <p className="text-xs text-gray-700">{getTranslation(mantra)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Stotras for selected deity */}
              {stotras.length > 0 && (
                <>
                  <h4 className="font-cinzel text-lg text-maroon mb-3 mt-6">Stotras & Prayers</h4>
                  <div className="space-y-3">
                    {stotras.map((stotra, idx) => (
                      <div key={idx} className="bg-white rounded-xl p-4 border border-saffron/10">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-maroon">{stotra.name}</p>
                            <p className="text-xs text-gray-500">{stotra.name_hindi}</p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            stotra.tier === 'free' ? 'bg-green-100 text-green-700' : 'bg-gold/20 text-gold'
                          }`}>
                            {stotra.tier}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">{stotra.description}</p>
                        <div className="flex gap-2 mt-2">
                          <span className="text-xs text-gray-500">{stotra.verse_count} verses</span>
                          {stotra.audio_available && (
                            <span className="text-xs text-saffron flex items-center gap-1">
                              <Volume2 className="w-3 h-3" /> Audio
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </div>
      )}

      {/* All Mantras Section */}
      {activeSection === 'all' && (
        <AllMantrasSection 
          isDesktop={isDesktop} 
          selectedLanguage={selectedLanguage}
          languages={languages}
          translations={translations}
          translateText={translateText}
        />
      )}

      {/* Audio Library Section - Internet Archive */}
      {activeSection === 'audio' && (
        <AudioLibrarySection isDesktop={isDesktop} />
      )}
    </div>
  );
}

// All Mantras Sub-component
function AllMantrasSection({ isDesktop, selectedLanguage, languages, translations, translateText }) {
  const [mantras, setMantras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    fetchAllMantras();
  }, []);
  
  // Translate mantras when language changes
  useEffect(() => {
    if (selectedLanguage !== 'english' && mantras.length > 0) {
      translateAllMantras();
    }
  }, [selectedLanguage, mantras]);
  
  const translateAllMantras = async () => {
    setTranslating(true);
    for (const mantra of mantras.slice(0, 10)) { // Translate first 10 visible
      if (mantra.meaning_english && translateText) {
        await translateText(mantra.meaning_english, mantra.name);
      }
    }
    setTranslating(false);
  };
  
  // Get translation for a mantra
  const getTranslation = (mantra) => {
    if (selectedLanguage === 'english') {
      return mantra.meaning_english;
    }
    if (selectedLanguage === 'hindi' && mantra.meaning_hindi) {
      return mantra.meaning_hindi;
    }
    const cacheKey = `${mantra.name}_${selectedLanguage}`;
    return translations?.[cacheKey] || mantra.meaning_english;
  };

  const fetchAllMantras = async () => {
    try {
      const res = await api.get('/api/devotional/mantras');
      setMantras(res.data.data || []);
    } catch (error) {
      console.error('Error fetching mantras:', error);
    } finally {
      setLoading(false);
    }
  };

  const mantraTypes = [...new Set(mantras.map(m => m.type))].filter(Boolean);
  
  const filteredMantras = mantras.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(filter.toLowerCase()) ||
                         m.sanskrit?.includes(filter) ||
                         m.deity_id?.toLowerCase().includes(filter.toLowerCase());
    const matchesType = !typeFilter || m.type === typeFilter;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-6 h-6 text-saffron animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Search and Filter */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search mantras..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-cream rounded-xl text-maroon focus:ring-2 focus:ring-saffron outline-none"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-cream px-4 py-2 rounded-xl text-maroon focus:ring-2 focus:ring-saffron outline-none"
        >
          <option value="">All Types</option>
          {mantraTypes.map(type => (
            <option key={type} value={type}>{type?.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      <p className="text-sm text-gray-500 mb-4">{filteredMantras.length} mantras found</p>

      {/* Mantras Grid */}
      <div className={`grid ${isDesktop ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
        {filteredMantras.map((mantra, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-cream rounded-xl p-4 border border-saffron/10"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-semibold text-maroon">{mantra.name}</p>
                <p className="text-xs text-gray-500 capitalize">{mantra.deity_id} • {mantra.type?.replace('_', ' ')}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                mantra.tier === 'free' ? 'bg-green-100 text-green-700' : 'bg-gold/20 text-gold'
              }`}>
                {mantra.tier}
              </span>
            </div>
            <div className="bg-white rounded-lg p-3 my-2">
              <p className="text-maroon text-center text-sm">{mantra.sanskrit}</p>
            </div>
            <p className="text-xs text-gray-600 italic mb-2">{mantra.transliteration}</p>
            
            {/* Translation */}
            <div className="bg-saffron/5 rounded-lg p-2">
              <p className="text-xs text-gray-500 mb-1">
                Translation ({languages?.find(l => l.code === selectedLanguage)?.native || 'English'}):
                {translating && <span className="ml-1 text-saffron">(translating...)</span>}
              </p>
              <p className="text-xs text-gray-700 line-clamp-3">{getTranslation(mantra)}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Audio Library Section - Vedic Audio Library
function AudioLibrarySection({ isDesktop }) {
  const [library, setLibrary] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingItem, setLoadingItem] = useState(null);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState(null);
  const [expandedCategory, setExpandedCategory] = useState('ESSENTIAL DAILY MANTRAS');

  useEffect(() => {
    fetchLibrary();
    return () => {
      if (audioElement) {
        audioElement.pause();
      }
    };
  }, []);

  const fetchLibrary = async () => {
    try {
      const res = await api.get('/api/archive/library');
      setLibrary(res.data.data || {});
    } catch (error) {
      toast.error('Failed to load audio library');
    } finally {
      setLoading(false);
    }
  };

  const playItem = async (itemId, title) => {
    setLoadingItem(itemId);
    try {
      const res = await api.get(`/api/archive/play/${itemId}`);
      if (res.data.audio_url) {
        playAudio(res.data.audio_url, title);
      } else {
        toast.error('No audio found for this item');
      }
    } catch (error) {
      toast.error('Failed to load audio');
    } finally {
      setLoadingItem(null);
    }
  };

  const playAudio = (url, title) => {
    if (audioElement) {
      audioElement.pause();
    }
    
    const audio = new Audio(url);
    setAudioElement(audio);
    setCurrentAudio({ url, title });
    setIsPlaying(true);
    
    audio.play().catch(() => {
      toast.error('Failed to play audio');
      setIsPlaying(false);
    });
    
    audio.onended = () => {
      setIsPlaying(false);
    };
    
    audio.onerror = () => {
      toast.error('Audio playback error');
      setIsPlaying(false);
    };
  };

  const togglePlayPause = () => {
    if (audioElement) {
      if (isPlaying) {
        audioElement.pause();
        setIsPlaying(false);
      } else {
        audioElement.play();
        setIsPlaying(true);
      }
    }
  };

  const stopAudio = () => {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
      setIsPlaying(false);
      setCurrentAudio(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 text-saffron animate-spin" />
      </div>
    );
  }

  const categories = Object.keys(library);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-maroon to-maroon/80 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3">
          <Music className="w-8 h-8" />
          <div>
            <h2 className="font-cinzel text-xl font-bold">Vedic Audio Library</h2>
            <p className="text-white/80 text-sm">98 sacred texts • Vedas, Upanishads, Mantras & Stotras</p>
          </div>
        </div>
      </div>

      {/* Now Playing Bar */}
      {currentAudio && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-saffron/20 to-gold/20 rounded-xl p-4 flex items-center gap-4"
        >
          <div className="w-10 h-10 bg-saffron rounded-full flex items-center justify-center flex-shrink-0">
            <Music className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-maroon text-sm truncate">{currentAudio.title}</p>
            <p className="text-xs text-gray-500">Now Playing</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlayPause}
              className="p-2 bg-saffron text-white rounded-full hover:bg-saffron/90 transition-all"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={stopAudio}
              className="p-2 bg-maroon/10 text-maroon rounded-full hover:bg-maroon/20 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Categories Accordion */}
      <div className="space-y-2">
        {categories.map((category) => (
          <div key={category} className="bg-white rounded-lg border border-saffron/10 overflow-hidden">
            {/* Category Header */}
            <button
              onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
              className="w-full flex items-center justify-between p-3 hover:bg-saffron/5 transition-all"
            >
              <div className="flex items-center gap-2">
                <span className="text-saffron font-bold text-sm">{library[category]?.length || 0}</span>
                <span className="font-medium text-maroon text-sm">{category}</span>
              </div>
              <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${expandedCategory === category ? 'rotate-90' : ''}`} />
            </button>
            
            {/* Category Items */}
            {expandedCategory === category && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="border-t border-saffron/10"
              >
                {library[category]?.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 p-3 hover:bg-saffron/5 transition-all ${idx !== 0 ? 'border-t border-gray-100' : ''}`}
                  >
                    <button
                      onClick={() => playItem(item.id, item.title)}
                      disabled={loadingItem === item.id}
                      className="p-2 bg-saffron text-white rounded-full hover:bg-saffron/90 transition-all flex-shrink-0 disabled:opacity-50"
                    >
                      {loadingItem === item.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Play className="w-3 h-3" />
                      )}
                    </button>
                    <span className="text-sm text-maroon flex-1">{item.title}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Calendar Tab - Panchang & Festival Calendar
function CalendarTab({ isDesktop }) {
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
            <h2 className="font-cinzel text-xl font-bold">Panchang & Festival Calendar</h2>
            <p className="text-white/80 text-sm">Hindu calendar, tithis, nakshatras & festivals</p>
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'today', label: "Today's Panchang" },
          { id: 'festivals', label: 'Upcoming Festivals' },
          { id: 'calendar', label: 'Monthly Calendar' },
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
              <p className="text-xs text-gray-500 uppercase mb-1">Tithi</p>
              <p className="font-semibold text-maroon">{panchang.tithi?.name}</p>
              <p className="text-sm text-gray-600">{panchang.tithi?.paksha} Paksha</p>
            </div>

            {/* Nakshatra */}
            <div className="bg-white rounded-xl p-4 border border-saffron/10">
              <p className="text-xs text-gray-500 uppercase mb-1">Nakshatra</p>
              <p className="font-semibold text-maroon">{panchang.nakshatra?.name}</p>
            </div>

            {/* Yoga */}
            <div className="bg-white rounded-xl p-4 border border-saffron/10">
              <p className="text-xs text-gray-500 uppercase mb-1">Yoga</p>
              <p className="font-semibold text-maroon">{panchang.yoga?.name}</p>
            </div>

            {/* Karana */}
            <div className="bg-white rounded-xl p-4 border border-saffron/10">
              <p className="text-xs text-gray-500 uppercase mb-1">Karana</p>
              <p className="font-semibold text-maroon">{panchang.karana?.name}</p>
            </div>

            {/* Sunrise */}
            <div className="bg-white rounded-xl p-4 border border-saffron/10">
              <p className="text-xs text-gray-500 uppercase mb-1">Sunrise</p>
              <p className="font-semibold text-maroon">{panchang.sunrise}</p>
            </div>

            {/* Sunset */}
            <div className="bg-white rounded-xl p-4 border border-saffron/10">
              <p className="text-xs text-gray-500 uppercase mb-1">Sunset</p>
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

// Review Modal Component
function ReviewModal({ booking, onClose, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    
    setSubmitting(true);
    try {
      await api.post(`/api/bookings/${booking.id}/review`, {
        rating,
        comment
      });
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl max-w-md w-full shadow-xl"
      >
        <div className="p-4 border-b border-orange-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Write a Review</h2>
          <button onClick={onClose} className="p-2 hover:bg-orange-50 rounded-lg text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4">
          {/* Booking Info */}
          <div className="bg-orange-50 rounded-xl p-3 mb-4">
            <p className="font-medium text-gray-800">{booking.service_name}</p>
            <p className="text-sm text-gray-500">by {booking.priest_name}</p>
          </div>

          {/* Star Rating */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoverRating || rating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Fair'}
              {rating === 3 && 'Good'}
              {rating === 4 && 'Very Good'}
              {rating === 5 && 'Excellent'}
            </p>
          </div>

          {/* Comment */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Your Review (Optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50 resize-none"
              placeholder="Share your experience with this service..."
            />
          </div>
        </div>

        <div className="p-4 border-t border-orange-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-500 hover:text-gray-700">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            className="px-6 py-2 bg-saffron text-white rounded-xl disabled:opacity-50 flex items-center gap-2 hover:bg-saffron-dark transition-colors"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Submit Review
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// Priests Tab Content
function PriestsTab({ setActiveTab, setSelectedPriest, isDesktop }) {
  const [priests, setPriests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');
  const [pujaTypeFilter, setPujaTypeFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [nearbyMode, setNearbyMode] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [pujaTypes, setPujaTypes] = useState([]);
  const [pujaCategories, setPujaCategories] = useState({});

  // Load puja types for dropdown
  useEffect(() => {
    const loadPujaTypes = async () => {
      try {
        const res = await api.get('/api/puja-types');
        setPujaTypes(res.data.puja_types || []);
        setPujaCategories(res.data.categories || {});
      } catch (error) {
        console.error('Failed to load puja types:', error);
      }
    };
    loadPujaTypes();
  }, []);

  useEffect(() => {
    fetchPriests();
  }, [filter, locationFilter, languageFilter, pujaTypeFilter]);

  const fetchPriests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter) params.append('specialization', filter);
      if (locationFilter) params.append('location', locationFilter);
      if (languageFilter) params.append('language', languageFilter);
      if (pujaTypeFilter) params.append('puja_type', pujaTypeFilter);
      const queryString = params.toString() ? `?${params.toString()}` : '';
      const res = await api.get(`/api/priests${queryString}`);
      setPriests(res.data.priests || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNearbyPriests = async () => {
    setGettingLocation(true);
    try {
      // Get user's current location
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });
      
      const { latitude, longitude } = position.coords;
      setUserLocation({ lat: latitude, lng: longitude });
      setNearbyMode(true);
      
      // Use Google's Geocoding API to get city name from coordinates
      try {
        const geocodeRes = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.REACT_APP_GOOGLE_PLACES_API_KEY || 'AIzaSyBr3qP19Vxsv5jeLxccsM0OfK3DWssPTVQ'}`
        );
        const geocodeData = await geocodeRes.json();
        
        if (geocodeData.results && geocodeData.results[0]) {
          const addressComponents = geocodeData.results[0].address_components;
          const city = addressComponents.find(c => c.types.includes('locality'))?.long_name;
          const state = addressComponents.find(c => c.types.includes('administrative_area_level_1'))?.long_name;
          const postalCode = addressComponents.find(c => c.types.includes('postal_code'))?.long_name;
          
          // Set location filter to city or postal code
          if (city) {
            setLocationFilter(city);
            toast.success(`Showing priests near ${city}`);
          } else if (postalCode) {
            setLocationFilter(postalCode);
            toast.success(`Showing priests near ${postalCode}`);
          } else if (state) {
            setLocationFilter(state);
            toast.success(`Showing priests in ${state}`);
          }
        }
      } catch (geocodeError) {
        console.error('Geocoding error:', geocodeError);
        toast.error('Could not determine your city');
      }
    } catch (error) {
      console.error('Location error:', error);
      if (error.code === 1) {
        toast.error('Location access denied. Please enable location in your browser settings.');
      } else {
        toast.error('Could not get your location');
      }
      setNearbyMode(false);
    } finally {
      setGettingLocation(false);
    }
  };

  const clearFilters = () => {
    setFilter('');
    setLocationFilter('');
    setLanguageFilter('');
    setPujaTypeFilter('');
    setNearbyMode(false);
    setUserLocation(null);
  };

  const hasActiveFilters = filter || locationFilter || languageFilter || pujaTypeFilter;

  const languages = ['Hindi', 'Sanskrit', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Marathi', 'Bengali', 'Gujarati', 'English'];

  return (
    <div className={`pb-24 lg:pb-8 ${isDesktop ? 'ml-64 px-8' : 'px-4'}`}>
      <div className="pt-4 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-cinzel text-2xl lg:text-3xl font-bold text-maroon">Book a Priest</h1>
          <div className="flex items-center gap-2">
            {/* Near Me Button */}
            <button
              onClick={getNearbyPriests}
              disabled={gettingLocation}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                nearbyMode
                  ? 'bg-green-500 text-white border-green-500'
                  : 'bg-white text-gray-600 border-orange-200 hover:border-green-500 hover:text-green-600'
              }`}
            >
              {gettingLocation ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <MapPin className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">Near Me</span>
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                showFilters || hasActiveFilters
                  ? 'bg-saffron text-white border-saffron'
                  : 'bg-white text-gray-600 border-orange-200 hover:border-saffron'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Filters</span>
              {hasActiveFilters && (
                <span className="w-5 h-5 bg-white text-saffron text-xs rounded-full flex items-center justify-center font-bold">
                  {[filter, locationFilter, languageFilter].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Expanded Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white rounded-2xl border border-orange-100 p-4 mb-4 overflow-hidden"
            >
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Puja Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <BookOpen className="w-4 h-4 inline mr-1" />
                    Puja / Service Type
                  </label>
                  <select
                    value={pujaTypeFilter}
                    onChange={(e) => setPujaTypeFilter(e.target.value)}
                    className="w-full px-4 py-2.5 border border-orange-200 rounded-xl focus:ring-2 focus:ring-saffron focus:border-transparent text-sm bg-white"
                    data-testid="puja-type-filter"
                  >
                    <option value="">All Puja Types</option>
                    {Object.entries(pujaCategories).map(([category, pujas]) => (
                      <optgroup key={category} label={category}>
                        {pujas.map(puja => (
                          <option key={puja.id} value={puja.name}>{puja.name}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {/* Location Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Location / City / Zip Code
                  </label>
                  <input
                    type="text"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    placeholder="Enter city, state, or zip code"
                    className="w-full px-4 py-2.5 border border-orange-200 rounded-xl focus:ring-2 focus:ring-saffron focus:border-transparent text-sm"
                  />
                </div>

                {/* Language Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Globe className="w-4 h-4 inline mr-1" />
                    Language
                  </label>
                  <select
                    value={languageFilter}
                    onChange={(e) => setLanguageFilter(e.target.value)}
                    className="w-full px-4 py-2.5 border border-orange-200 rounded-xl focus:ring-2 focus:ring-saffron focus:border-transparent text-sm bg-white"
                  >
                    <option value="">All Languages</option>
                    {languages.map((lang) => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </div>

                {/* Clear Filters */}
                <div className="flex items-end">
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Clear All Filters
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Specialization Quick Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {['All', 'Vedic Rituals', 'Homam', 'Pooja', 'Ceremony'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f === 'All' ? '' : f)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                (f === 'All' && !filter) || filter === f
                  ? 'bg-saffron text-white'
                  : 'bg-white text-gray-600 border border-orange-100 hover:bg-orange-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mt-3">
            {pujaTypeFilter && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-saffron-dark rounded-full text-sm">
                <BookOpen className="w-3 h-3" />
                {pujaTypeFilter}
                <button onClick={() => setPujaTypeFilter('')} className="ml-1 hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {locationFilter && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-saffron-dark rounded-full text-sm">
                <MapPin className="w-3 h-3" />
                {locationFilter}
                <button onClick={() => setLocationFilter('')} className="ml-1 hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {languageFilter && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-saffron-dark rounded-full text-sm">
                <Globe className="w-3 h-3" />
                {languageFilter}
                <button onClick={() => setLanguageFilter('')} className="ml-1 hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-saffron animate-spin" />
        </div>
      ) : priests.length === 0 ? (
        <div className="text-center py-12">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No priests found</p>
          <p className="text-sm text-gray-400">Try adjusting your filters</p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 px-4 py-2 bg-saffron text-white rounded-xl text-sm font-medium hover:bg-saffron-dark transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className={`${isDesktop ? 'grid grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-3'}`}>
          {priests.map((priest) => (
            <motion.button
              key={priest.id}
              onClick={() => { setSelectedPriest(priest); setActiveTab('priest-detail'); }}
              className="w-full bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-orange-50 text-left hover:shadow-md transition-shadow"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-start gap-4">
                <div className={`${isDesktop ? 'w-20 h-20' : 'w-16 h-16'} bg-gradient-to-br from-saffron to-gold rounded-2xl flex items-center justify-center text-white text-2xl font-cinzel flex-shrink-0`}>
                  {priest.user_name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-800">{priest.user_name}</p>
                    {priest.is_verified && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mb-1">{priest.experience_years} years experience</p>
                  {(priest.city || priest.state) && (
                    <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {[priest.city, priest.state].filter(Boolean).join(', ')}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {priest.specializations?.slice(0, 2).map((s, i) => (
                      <span key={i} className="text-xs bg-orange-50 text-saffron-dark px-2 py-0.5 rounded-full">
                        {s}
                      </span>
                    ))}
                  </div>
                  {priest.languages?.length > 0 && (
                    <p className="text-xs text-gray-400 mt-2">
                      {priest.languages.slice(0, 3).join(', ')}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 mb-1">
                    <Star className="w-4 h-4 text-gold fill-gold" />
                    <span className="font-semibold">{priest.rating}</span>
                  </div>
                  <p className="text-xs text-gray-400">{priest.total_reviews} reviews</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}

// PriestDetailView and AstrologyTab have been moved to components/DevoteeDashboard/
function ProductDetailView({ product, productId, isDesktop, onBack, onAddToCart, ReviewComponents, cartCount, onOpenCart }) {
  const [productDetail, setProductDetail] = useState(product);
  const [loading, setLoading] = useState(!product);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    if (!product) {
      fetchProductDetail();
    }
  }, [productId]);

  const fetchProductDetail = async () => {
    try {
      const res = await api.get(`/api/products/${productId}`);
      setProductDetail(res.data);
    } catch (error) {
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    for (let i = 0; i < quantity; i++) {
      await onAddToCart(productId);
    }
  };

  if (loading) {
    return (
      <div className={`pb-24 lg:pb-8 ${isDesktop ? 'px-8' : 'px-4'} flex justify-center items-center py-20`}>
        <Loader2 className="w-8 h-8 text-saffron animate-spin" />
      </div>
    );
  }

  if (!productDetail) {
    return (
      <div className={`pb-24 lg:pb-8 ${isDesktop ? 'px-8' : 'px-4'} text-center py-20`}>
        <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Product not found</p>
        <button onClick={onBack} className="mt-4 text-saffron hover:underline">
          Back to Shop
        </button>
      </div>
    );
  }

  const images = productDetail.images || [];
  const hasVideo = productDetail.video_url;

  return (
    <div className={`pb-24 lg:pb-8 ${isDesktop ? 'px-8' : 'px-4'}`}>
      {/* Header */}
      <div className="flex items-center justify-between py-4 mb-4">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-saffron transition-colors"
          data-testid="back-to-shop"
        >
          <ArrowRight className="w-5 h-5 rotate-180" />
          <span>Back to Shop</span>
        </button>
        <button 
          onClick={onOpenCart}
          className="relative p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow"
        >
          <ShoppingCart className="w-6 h-6 text-saffron" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      <div className={`${isDesktop ? 'grid grid-cols-2 gap-12' : ''}`}>
        {/* Product Images */}
        <div className="mb-6 lg:mb-0">
          {/* Main Image/Video */}
          <div className="aspect-square bg-orange-50 rounded-2xl overflow-hidden mb-4 relative">
            {showVideo && hasVideo ? (
              <video 
                src={productDetail.video_url} 
                controls 
                autoPlay
                className="w-full h-full object-cover"
              />
            ) : images[selectedImage] ? (
              <img 
                src={images[selectedImage]} 
                alt={productDetail.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ShoppingBag className="w-20 h-20 text-saffron/30" />
              </div>
            )}
            
            {/* Video Toggle */}
            {hasVideo && (
              <button
                onClick={() => setShowVideo(!showVideo)}
                className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2 hover:bg-white transition-colors"
              >
                {showVideo ? (
                  <>
                    <Camera className="w-4 h-4 text-saffron" />
                    <span className="text-sm">Photos</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 text-saffron" />
                    <span className="text-sm">Video</span>
                  </>
                )}
              </button>
            )}
          </div>
          
          {/* Thumbnail Images */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => { setSelectedImage(idx); setShowVideo(false); }}
                  className={`w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${
                    selectedImage === idx && !showVideo ? 'border-saffron' : 'border-transparent'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <p className="text-sm text-saffron mb-1">{productDetail.category}</p>
          <h1 className="font-cinzel text-2xl lg:text-3xl font-bold text-maroon mb-2">
            {productDetail.name}
          </h1>
          
          {/* Rating */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star}
                  className={`w-5 h-5 ${
                    star <= Math.round(productDetail.rating || 0)
                      ? 'fill-gold text-gold'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-500">
              {productDetail.rating?.toFixed(1) || '0.0'} ({productDetail.total_reviews || 0} reviews)
            </span>
          </div>
          
          {/* Shop */}
          <p className="text-sm text-gray-500 mb-4">
            Sold by <span className="font-medium text-gray-700">{productDetail.shop_name}</span>
          </p>
          
          {/* Price */}
          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-3xl font-bold text-saffron">₹{productDetail.price}</span>
            {productDetail.stock > 0 ? (
              <span className="text-sm text-green-600">In Stock ({productDetail.stock} available)</span>
            ) : (
              <span className="text-sm text-red-500">Out of Stock</span>
            )}
          </div>
          
          {/* Description */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-800 mb-2">Description</h3>
            <p className="text-gray-600 leading-relaxed">{productDetail.description}</p>
          </div>
          
          {/* Quantity & Add to Cart */}
          {productDetail.stock > 0 && (
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-2 bg-orange-50 rounded-full p-1">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-gray-50"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(productDetail.stock, quantity + 1))}
                  className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-gray-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              <button
                onClick={handleAddToCart}
                className="flex-1 py-4 bg-saffron text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                data-testid="add-to-cart-detail"
              >
                <ShoppingCart className="w-5 h-5" />
                Add to Cart
              </button>
            </div>
          )}
          
          {/* Stock Warning */}
          {productDetail.stock > 0 && productDetail.stock < 10 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6">
              <p className="text-amber-700 text-sm flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Only {productDetail.stock} items left - order soon!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      {ReviewComponents && (
        <div className="mt-12 pt-8 border-t border-orange-100">
          <ReviewComponents.default 
            productId={productId} 
            productName={productDetail.name}
          />
        </div>
      )}
    </div>
  );
}

// Shop Tab
function ShopTab({ isDesktop }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [nearbyMode, setNearbyMode] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [view, setView] = useState('shop'); // shop, product-detail, checkout, success, orders, order-detail
  const [orderData, setOrderData] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const { addToCart, cartCount } = useCart();

  // Lazy load checkout components
  const [CheckoutComponents, setCheckoutComponents] = useState(null);
  // Lazy load reviews components
  const [ReviewComponents, setReviewComponents] = useState(null);
  
  useEffect(() => {
    import('../../components/Checkout/CheckoutComponents').then(module => {
      setCheckoutComponents(module);
    });
    import('../../components/Reviews/ProductReviews').then(module => {
      setReviewComponents(module);
    });
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [locationFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (locationFilter) params.append('location', locationFilter);
      const queryString = params.toString() ? `?${params.toString()}` : '';
      const res = await api.get(`/api/products${queryString}`);
      setProducts(res.data.products || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNearbyProducts = async () => {
    setGettingLocation(true);
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });
      
      const { latitude, longitude } = position.coords;
      setNearbyMode(true);
      
      try {
        const geocodeRes = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.REACT_APP_GOOGLE_PLACES_API_KEY || 'AIzaSyBr3qP19Vxsv5jeLxccsM0OfK3DWssPTVQ'}`
        );
        const geocodeData = await geocodeRes.json();
        
        if (geocodeData.results && geocodeData.results[0]) {
          const addressComponents = geocodeData.results[0].address_components;
          const city = addressComponents.find(c => c.types.includes('locality'))?.long_name;
          const state = addressComponents.find(c => c.types.includes('administrative_area_level_1'))?.long_name;
          
          if (city) {
            setLocationFilter(city);
            toast.success(`Showing stores near ${city}`);
          } else if (state) {
            setLocationFilter(state);
            toast.success(`Showing stores in ${state}`);
          }
        }
      } catch (geocodeError) {
        console.error('Geocoding error:', geocodeError);
        toast.error('Could not determine your city');
      }
    } catch (error) {
      console.error('Location error:', error);
      if (error.code === 1) {
        toast.error('Location access denied. Please enable location in your browser settings.');
      } else {
        toast.error('Could not get your location');
      }
      setNearbyMode(false);
    } finally {
      setGettingLocation(false);
    }
  };

  const clearLocationFilter = () => {
    setLocationFilter('');
    setNearbyMode(false);
  };

  const handleAddToCart = async (productId) => {
    const success = await addToCart(productId, 1);
    if (success) {
      toast.success('Added to cart!');
    } else {
      toast.error('Failed to add');
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  // Handle different views
  if (CheckoutComponents && view === 'checkout') {
    return (
      <div className={`pb-24 lg:pb-8 ${isDesktop ? 'px-8' : 'px-4'}`}>
        <CheckoutComponents.CheckoutPage 
          onBack={() => setView('shop')} 
          onComplete={(data) => {
            setOrderData(data);
            setView('success');
          }}
        />
      </div>
    );
  }

  if (CheckoutComponents && view === 'success' && orderData) {
    return (
      <div className={`pb-24 lg:pb-8 ${isDesktop ? 'px-8' : 'px-4'}`}>
        <CheckoutComponents.OrderSuccessPage 
          orderData={orderData}
          onContinue={() => {
            setOrderData(null);
            setView('shop');
          }}
          onViewOrders={() => setView('orders')}
        />
      </div>
    );
  }

  if (CheckoutComponents && view === 'orders') {
    return (
      <div className={`pb-24 lg:pb-8 ${isDesktop ? 'px-8' : 'px-4'}`}>
        <CheckoutComponents.MyOrdersPage 
          onBack={() => setView('shop')}
          onViewOrder={(orderId) => {
            setSelectedOrderId(orderId);
            setView('order-detail');
          }}
        />
      </div>
    );
  }

  if (CheckoutComponents && view === 'order-detail' && selectedOrderId) {
    return (
      <div className={`pb-24 lg:pb-8 ${isDesktop ? 'px-8' : 'px-4'}`}>
        <CheckoutComponents.OrderDetailPage 
          orderId={selectedOrderId}
          onBack={() => setView('orders')}
        />
      </div>
    );
  }

  // Product Detail View
  if (view === 'product-detail' && selectedProductId) {
    const selectedProduct = products.find(p => p.id === selectedProductId);
    
    return (
      <ProductDetailView 
        product={selectedProduct}
        productId={selectedProductId}
        isDesktop={isDesktop}
        onBack={() => {
          setSelectedProductId(null);
          setView('shop');
        }}
        onAddToCart={handleAddToCart}
        ReviewComponents={ReviewComponents}
        cartCount={cartCount}
        onOpenCart={() => setShowCart(true)}
      />
    );
  }

  return (
    <div className={`pb-24 lg:pb-8 ${isDesktop ? 'px-8' : 'px-4'}`}>
      {/* Cart Sidebar */}
      {CheckoutComponents && (
        <CheckoutComponents.CartSidebar 
          isOpen={showCart} 
          onClose={() => setShowCart(false)}
          onCheckout={() => {
            setShowCart(false);
            setView('checkout');
          }}
        />
      )}

      <div className="pt-4 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-cinzel text-2xl lg:text-3xl font-bold text-maroon">Pooja Store</h1>
          <div className="flex items-center gap-3">
            {/* Near Me Button */}
            <button
              onClick={getNearbyProducts}
              disabled={gettingLocation}
              className={`flex items-center gap-1 px-3 py-2 rounded-xl border text-sm transition-all ${
                nearbyMode
                  ? 'bg-green-500 text-white border-green-500'
                  : 'bg-white text-gray-600 border-orange-200 hover:border-green-500 hover:text-green-600'
              }`}
            >
              {gettingLocation ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <MapPin className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Near Me</span>
            </button>
            <button
              onClick={() => setView('orders')}
              className="text-sm text-saffron hover:underline"
              data-testid="my-orders-link"
            >
              My Orders
            </button>
            <button 
              onClick={() => setShowCart(true)}
              className="relative p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow"
              data-testid="cart-button"
            >
              <ShoppingCart className="w-6 h-6 text-saffron" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Location Filter Display */}
        {locationFilter && (
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
              <MapPin className="w-3 h-3" />
              Stores near {locationFilter}
              <button onClick={clearLocationFilter} className="ml-1 hover:text-red-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          </div>
        )}
        
        {/* Search */}
        <div className={`relative ${isDesktop ? 'max-w-md' : ''}`}>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full bg-white border border-orange-100 rounded-xl pl-12 pr-4 py-3 focus:border-saffron focus:ring-2 focus:ring-saffron/20 outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-saffron animate-spin" />
        </div>
      ) : (
        <div className={`grid ${isDesktop ? 'grid-cols-4 xl:grid-cols-5 gap-6' : 'grid-cols-2 gap-3'}`}>
          {filteredProducts.map((product) => (
            <motion.div
              key={product.id}
              className="bg-white rounded-2xl p-3 lg:p-4 shadow-sm border border-orange-50 hover:shadow-md transition-shadow cursor-pointer"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => {
                setSelectedProductId(product.id);
                setView('product-detail');
              }}
              data-testid={`product-card-${product.id}`}
            >
              <div className={`aspect-square bg-orange-50 rounded-xl mb-3 flex items-center justify-center overflow-hidden`}>
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <ShoppingBag className="w-10 h-10 text-saffron/30" />
                )}
              </div>
              <p className={`font-medium ${isDesktop ? 'text-base' : 'text-sm'} text-gray-800 line-clamp-2 mb-1`}>{product.name}</p>
              <p className="text-xs text-gray-500 mb-1">{product.shop_name}</p>
              <div className="flex items-center gap-1 mb-2">
                <Star className="w-3 h-3 text-gold fill-gold" />
                <span className="text-xs text-gray-500">{product.rating || 0}</span>
                <span className="text-xs text-gray-400">({product.total_reviews || 0})</span>
                {product.stock < 10 && product.stock > 0 && (
                  <span className="text-xs text-amber-600 ml-auto">Only {product.stock} left</span>
                )}
                {product.stock === 0 && (
                  <span className="text-xs text-red-500 ml-auto">Out of stock</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-saffron font-bold">₹{product.price}</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToCart(product.id);
                  }}
                  disabled={product.stock === 0}
                  className="w-8 h-8 lg:w-10 lg:h-10 bg-saffron hover:bg-saffron-dark text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid={`add-to-cart-${product.id}`}
                >
                  <Plus className="w-4 h-4 lg:w-5 lg:h-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// Profile Tab
function ProfileTab({ isDesktop }) {
  const { user, logout, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    pincode: user?.pincode || '',
    date_of_birth: user?.date_of_birth || '',
    gotra: user?.gotra || '',
    nakshatra: user?.nakshatra || '',
    profile_photo: user?.profile_photo || ''
  });

  useEffect(() => {
    if (user) {
      setEditForm({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        pincode: user.pincode || '',
        date_of_birth: user.date_of_birth || '',
        gotra: user.gotra || '',
        nakshatra: user.nakshatra || '',
        profile_photo: user.profile_photo || ''
      });
    }
  }, [user]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid image (JPEG, PNG, GIF, or WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image too large. Maximum size is 5MB.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/api/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setEditForm({ ...editForm, profile_photo: response.data.url });
      toast.success('Photo uploaded!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await api.put('/api/users/profile', editForm);
      updateUser({ ...user, ...res.data.user });
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`pb-24 lg:pb-8 ${isDesktop ? 'px-8' : 'px-4'}`}>
      <div className="pt-4 pb-6">
        {/* Profile Header */}
        <div className={`${isDesktop ? 'flex items-center justify-between' : ''} mb-6`}>
          <div className={`${isDesktop ? 'flex items-center gap-6' : 'flex items-center gap-4'}`}>
            {/* Profile Photo with Upload */}
            <div className="relative">
              {user?.profile_photo || editForm.profile_photo ? (
                <img 
                  src={editForm.profile_photo || user?.profile_photo} 
                  alt="Profile" 
                  className={`${isDesktop ? 'w-20 h-20' : 'w-16 h-16'} rounded-full object-cover border-2 border-saffron`}
                />
              ) : (
                <div className={`${isDesktop ? 'w-20 h-20' : 'w-16 h-16'} bg-gradient-to-br from-saffron to-gold rounded-full flex items-center justify-center text-white text-2xl lg:text-3xl font-cinzel`}>
                  {user?.name?.charAt(0)}
                </div>
              )}
              {isEditing && (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute -bottom-1 -right-1 w-8 h-8 bg-saffron text-white rounded-full flex items-center justify-center shadow-lg hover:bg-saffron-dark transition-colors"
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                  </button>
                </>
              )}
            </div>
            <div>
              <h1 className="font-cinzel text-xl lg:text-2xl font-bold text-maroon">{user?.name}</h1>
              <p className="text-gray-500 text-sm">{user?.email}</p>
              <span className="text-xs bg-orange-100 text-saffron-dark px-2 py-0.5 rounded-full">
                {user?.role}
              </span>
            </div>
          </div>
          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              className={`${isDesktop ? '' : 'mt-4 w-full'} flex items-center justify-center gap-2 px-4 py-2 bg-saffron text-white rounded-xl hover:bg-saffron-dark transition-colors`}
              data-testid="edit-profile-btn"
            >
              <Settings className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>

        {/* Edit Profile Form */}
        {isEditing && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-orange-100 p-6 mb-6"
          >
            <h2 className="font-cinzel text-lg font-semibold text-maroon mb-4">Edit Profile</h2>
            
            <div className={`grid ${isDesktop ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-saffron focus:border-transparent"
                  placeholder="Your full name"
                  data-testid="profile-name-input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-saffron focus:border-transparent"
                  placeholder="+91 XXXXX XXXXX"
                  data-testid="profile-phone-input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={editForm.date_of_birth}
                  onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })}
                  className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-saffron focus:border-transparent"
                  data-testid="profile-dob-input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gotra</label>
                <input
                  type="text"
                  value={editForm.gotra}
                  onChange={(e) => setEditForm({ ...editForm, gotra: e.target.value })}
                  className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-saffron focus:border-transparent"
                  placeholder="E.g., Bharadwaja, Kashyapa"
                  data-testid="profile-gotra-input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nakshatra</label>
                <select
                  value={editForm.nakshatra}
                  onChange={(e) => setEditForm({ ...editForm, nakshatra: e.target.value })}
                  className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-saffron focus:border-transparent"
                  data-testid="profile-nakshatra-input"
                >
                  <option value="">Select Nakshatra</option>
                  <option value="Ashwini">Ashwini</option>
                  <option value="Bharani">Bharani</option>
                  <option value="Krittika">Krittika</option>
                  <option value="Rohini">Rohini</option>
                  <option value="Mrigashira">Mrigashira</option>
                  <option value="Ardra">Ardra</option>
                  <option value="Punarvasu">Punarvasu</option>
                  <option value="Pushya">Pushya</option>
                  <option value="Ashlesha">Ashlesha</option>
                  <option value="Magha">Magha</option>
                  <option value="Purva Phalguni">Purva Phalguni</option>
                  <option value="Uttara Phalguni">Uttara Phalguni</option>
                  <option value="Hasta">Hasta</option>
                  <option value="Chitra">Chitra</option>
                  <option value="Swati">Swati</option>
                  <option value="Vishakha">Vishakha</option>
                  <option value="Anuradha">Anuradha</option>
                  <option value="Jyeshtha">Jyeshtha</option>
                  <option value="Mula">Mula</option>
                  <option value="Purva Ashadha">Purva Ashadha</option>
                  <option value="Uttara Ashadha">Uttara Ashadha</option>
                  <option value="Shravana">Shravana</option>
                  <option value="Dhanishta">Dhanishta</option>
                  <option value="Shatabhisha">Shatabhisha</option>
                  <option value="Purva Bhadrapada">Purva Bhadrapada</option>
                  <option value="Uttara Bhadrapada">Uttara Bhadrapada</option>
                  <option value="Revati">Revati</option>
                </select>
              </div>
              
              <div className={isDesktop ? 'col-span-2' : ''}>
                <AddressAutocomplete
                  label="City / Location"
                  value={editForm.city}
                  onChange={(value) => setEditForm({ ...editForm, city: value })}
                  onSelect={(placeDetails) => {
                    // Auto-fill city, pincode, and address from selected place
                    setEditForm(prev => ({
                      ...prev,
                      city: placeDetails.city || placeDetails.main_text || prev.city,
                      address: placeDetails.formatted_address || placeDetails.address || prev.address,
                      pincode: prev.pincode // Keep existing pincode as Google doesn't always provide it
                    }));
                  }}
                  placeholder="Search for your city..."
                  testId="profile-city-input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                <input
                  type="text"
                  value={editForm.pincode}
                  onChange={(e) => setEditForm({ ...editForm, pincode: e.target.value })}
                  className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-saffron focus:border-transparent"
                  placeholder="XXXXXX"
                  data-testid="profile-pincode-input"
                />
              </div>
              
              <div className={isDesktop ? 'col-span-2' : ''}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
                <textarea
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-saffron focus:border-transparent resize-none"
                  placeholder="Your complete address (auto-filled from city selection)"
                  data-testid="profile-address-input"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-saffron text-white rounded-xl hover:bg-saffron-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                data-testid="save-profile-btn"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* Profile Details Card (when not editing) */}
        {!isEditing && (user?.phone || user?.gotra || user?.nakshatra || user?.city) && (
          <div className="bg-white rounded-2xl border border-orange-100 p-6 mb-6">
            <h2 className="font-cinzel text-lg font-semibold text-maroon mb-4">Profile Details</h2>
            <div className={`grid ${isDesktop ? 'grid-cols-3' : 'grid-cols-2'} gap-4`}>
              {user?.phone && (
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-gray-800 font-medium">{user.phone}</p>
                </div>
              )}
              {user?.date_of_birth && (
                <div>
                  <p className="text-xs text-gray-500">Date of Birth</p>
                  <p className="text-gray-800 font-medium">{new Date(user.date_of_birth).toLocaleDateString()}</p>
                </div>
              )}
              {user?.gotra && (
                <div>
                  <p className="text-xs text-gray-500">Gotra</p>
                  <p className="text-gray-800 font-medium">{user.gotra}</p>
                </div>
              )}
              {user?.nakshatra && (
                <div>
                  <p className="text-xs text-gray-500">Nakshatra</p>
                  <p className="text-gray-800 font-medium">{user.nakshatra}</p>
                </div>
              )}
              {user?.city && (
                <div>
                  <p className="text-xs text-gray-500">City</p>
                  <p className="text-gray-800 font-medium">{user.city}</p>
                </div>
              )}
              {user?.pincode && (
                <div>
                  <p className="text-xs text-gray-500">Pincode</p>
                  <p className="text-gray-800 font-medium">{user.pincode}</p>
                </div>
              )}
            </div>
            {user?.address && (
              <div className="mt-4">
                <p className="text-xs text-gray-500">Address</p>
                <p className="text-gray-800">{user.address}</p>
              </div>
            )}
          </div>
        )}

        {/* Write a Testimonial Section */}
        <TestimonialSection />

        {/* Actions - Only show on mobile */}
        {!isDesktop && (
          <div className="space-y-3">
            <button 
              onClick={logout}
              className="w-full bg-red-50 rounded-xl p-4 flex items-center justify-center gap-2 text-red-600"
              data-testid="logout-button"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Testimonial Section Component
function TestimonialSection() {
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error('Please write your testimonial');
      return;
    }
    
    setSubmitting(true);
    try {
      await api.post('/api/testimonials', { content, rating });
      toast.success('Thank you! Your testimonial will be reviewed and published soon.');
      setContent('');
      setRating(5);
      setShowForm(false);
    } catch (error) {
      toast.error('Failed to submit testimonial. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-saffron/10 to-gold/10 rounded-2xl border border-orange-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-maroon flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Share Your Experience
          </h3>
          <p className="text-sm text-gray-600">Help others by sharing your experience with Divine App</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-saffron text-white rounded-xl hover:bg-saffron-dark transition-colors flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Write Review
          </button>
        )}
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm text-gray-600 mb-2">Your Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star className={`w-8 h-8 ${rating >= star ? 'text-gold fill-gold' : 'text-gray-300'}`} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-2">Your Testimonial</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-orange-200 focus:ring-2 focus:ring-saffron focus:border-transparent resize-none"
              placeholder="Share how Divine App has helped you in your spiritual journey..."
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-saffron text-white rounded-xl hover:bg-saffron-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Testimonial
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Classes Tab - Browse and enroll in Vedic classes
function ClassesTab({ isDesktop }) {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [myEnrollments, setMyEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('browse'); // 'browse' or 'enrolled'
  const [enrolling, setEnrolling] = useState(null);
  const [paymentModal, setPaymentModal] = useState(null); // {classId, className, price, clientSecret}

  useEffect(() => {
    fetchClasses();
    fetchMyEnrollments();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await api.get('/api/classes');
      setClasses(res.data.classes || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyEnrollments = async () => {
    try {
      const res = await api.get('/api/my-enrollments');
      setMyEnrollments(res.data.enrollments || []);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    }
  };

  const handleEnroll = async (cls) => {
    setEnrolling(cls.id);
    try {
      const res = await api.post(`/api/classes/${cls.id}/enroll`);
      
      if (res.data.requires_payment) {
        // Show payment modal for paid classes
        setPaymentModal({
          classId: cls.id,
          className: cls.title,
          price: res.data.price,
          clientSecret: res.data.client_secret,
          paymentIntentId: res.data.payment_intent_id
        });
      } else {
        // Free class - enrolled directly
        toast.success('Successfully enrolled in class!');
        fetchClasses();
        fetchMyEnrollments();
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to enroll');
    } finally {
      setEnrolling(null);
    }
  };

  const handlePaymentSuccess = async (paymentData) => {
    try {
      // Complete enrollment after payment
      await api.post(`/api/classes/${paymentModal.classId}/enroll`, {
        payment_intent_id: paymentData.payment_id || paymentModal.paymentIntentId
      });
      toast.success('Payment successful! You are now enrolled.');
      setPaymentModal(null);
      fetchClasses();
      fetchMyEnrollments();
    } catch (error) {
      toast.error('Enrollment failed after payment. Please contact support.');
    }
  };

  const handlePaymentError = (error) => {
    toast.error(error || 'Payment failed. Please try again.');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'TBD';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isEnrolled = (classId) => {
    return myEnrollments.some(e => e.id === classId);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-b from-cream to-parchment pb-20 lg:pb-0 ${isDesktop ? 'ml-64' : ''}`}>
      <div className="p-4 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-cinzel text-2xl lg:text-3xl font-bold text-maroon">Vedic Classes</h1>
            <p className="text-gray-600 text-sm mt-1">Learn from experienced priests and scholars</p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex bg-white rounded-xl p-1 mb-6 max-w-md">
          <button
            onClick={() => setActiveView('browse')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
              activeView === 'browse' ? 'bg-saffron text-white' : 'text-gray-600'
            }`}
          >
            Browse Classes
          </button>
          <button
            onClick={() => setActiveView('enrolled')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
              activeView === 'enrolled' ? 'bg-saffron text-white' : 'text-gray-600'
            }`}
          >
            My Classes ({myEnrollments.length})
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-saffron" />
          </div>
        ) : activeView === 'browse' ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No classes available at the moment</p>
                <p className="text-sm text-gray-400 mt-1">Check back soon for new classes!</p>
              </div>
            ) : (
              classes.map((cls) => (
                <motion.div
                  key={cls.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden"
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-saffron to-gold rounded-full flex items-center justify-center text-white font-semibold">
                          {cls.priest_name?.charAt(0) || 'P'}
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">{cls.priest_name}</p>
                          <span className="text-xs px-2 py-0.5 bg-orange-100 text-saffron rounded-full">
                            {cls.category || 'General'}
                          </span>
                        </div>
                      </div>
                      {cls.is_free ? (
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">FREE</span>
                      ) : (
                        <span className="text-sm font-semibold text-maroon">₹{cls.price}</span>
                      )}
                    </div>
                    
                    <h3 className="font-semibold text-gray-800 mb-2">{cls.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">{cls.description}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(cls.schedule_time)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{cls.duration_minutes} min</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-400">
                        <span className={cls.available_slots <= 3 ? 'text-red-500 font-medium' : ''}>
                          {cls.available_slots > 0 ? `${cls.available_slots} slots left` : 'Full'}
                        </span>
                        <span className="mx-1">•</span>
                        <span>{cls.enrolled_count} enrolled</span>
                      </div>
                      {isEnrolled(cls.id) ? (
                        <span className="px-4 py-2 bg-green-100 text-green-700 rounded-xl text-sm font-medium flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" /> Enrolled
                        </span>
                      ) : cls.available_slots <= 0 ? (
                        <span className="px-4 py-2 bg-gray-100 text-gray-500 rounded-xl text-sm font-medium">
                          Class Full
                        </span>
                      ) : (
                        <button
                          onClick={() => handleEnroll(cls)}
                          disabled={enrolling === cls.id}
                          className="px-4 py-2 bg-saffron text-white rounded-xl text-sm font-medium hover:bg-saffron-dark transition-colors disabled:opacity-50 flex items-center gap-1"
                        >
                          {enrolling === cls.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : cls.is_free ? (
                            'Enroll Free'
                          ) : (
                            <>Pay ₹{cls.price}</>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {myEnrollments.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">You haven't enrolled in any classes yet</p>
                <button 
                  onClick={() => setActiveView('browse')}
                  className="mt-4 px-6 py-2 bg-saffron text-white rounded-xl font-medium hover:bg-saffron-dark transition-colors"
                >
                  Browse Classes
                </button>
              </div>
            ) : (
              myEnrollments.map((cls) => (
                <motion.div
                  key={cls.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white rounded-xl p-4 shadow-sm border border-orange-100 flex items-center justify-between"
                >
                  <div>
                    <h3 className="font-semibold text-gray-800">{cls.title}</h3>
                    <p className="text-sm text-gray-500">{cls.priest_name}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(cls.schedule_time)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {cls.duration_minutes} min
                      </span>
                    </div>
                  </div>
                  {cls.meeting_link && (
                    <a
                      href={cls.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition-colors flex items-center gap-2"
                    >
                      <Play className="w-4 h-4" /> Join
                    </a>
                  )}
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Payment Modal for Paid Classes */}
      {paymentModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
          >
            <h3 className="font-cinzel text-xl font-bold text-maroon mb-2">
              Complete Payment
            </h3>
            <p className="text-gray-600 mb-4">
              Enroll in <strong>{paymentModal.className}</strong>
            </p>
            
            <div className="bg-orange-50 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Class Fee</span>
                <span className="text-xl font-bold text-maroon">₹{paymentModal.price}</span>
              </div>
            </div>

            <SmartPayment
              amount={paymentModal.price}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              description={`Enrollment: ${paymentModal.className}`}
              metadata={{
                type: 'class_enrollment',
                class_id: paymentModal.classId
              }}
              userEmail={user?.email}
              userName={user?.name}
            />

            <button
              onClick={() => setPaymentModal(null)}
              className="w-full mt-4 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// Live Events Tab - Watch live streams from priests
function LiveEventsTab({ isDesktop }) {
  const [liveStreams, setLiveStreams] = useState([]);
  const [upcomingStreams, setUpcomingStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('live'); // 'live' or 'upcoming'

  useEffect(() => {
    fetchStreams();
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

  const formatDate = (dateStr) => {
    if (!dateStr) return 'TBD';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
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
    <div className={`min-h-screen bg-gradient-to-b from-cream to-parchment pb-20 lg:pb-0 ${isDesktop ? 'ml-64' : ''}`}>
      <div className="p-4 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-cinzel text-2xl lg:text-3xl font-bold text-maroon">Live Events</h1>
            <p className="text-gray-600 text-sm mt-1">Watch live spiritual streams and events</p>
          </div>
          {liveStreams.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 rounded-full">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              <span className="text-sm text-red-600 font-medium">{liveStreams.length} Live Now</span>
            </div>
          )}
        </div>

        {/* View Toggle */}
        <div className="flex bg-white rounded-xl p-1 mb-6 max-w-md">
          <button
            onClick={() => setActiveView('live')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              activeView === 'live' ? 'bg-red-500 text-white' : 'text-gray-600'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${activeView === 'live' ? 'bg-white animate-pulse' : 'bg-red-500'}`}></span>
            Live Now ({liveStreams.length})
          </button>
          <button
            onClick={() => setActiveView('upcoming')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
              activeView === 'upcoming' ? 'bg-saffron text-white' : 'text-gray-600'
            }`}
          >
            Upcoming ({upcomingStreams.length})
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-saffron" />
          </div>
        ) : activeView === 'live' ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {liveStreams.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Video className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No live streams at the moment</p>
                <p className="text-sm text-gray-400 mt-1">Check the upcoming section for scheduled events</p>
              </div>
            ) : (
              liveStreams.map((stream) => (
                <motion.div
                  key={stream.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-2xl shadow-sm border-2 border-red-200 overflow-hidden"
                >
                  <div className="relative">
                    <div className="aspect-video bg-gradient-to-br from-maroon to-red-900 flex items-center justify-center">
                      {stream.thumbnail ? (
                        <img src={stream.thumbnail} alt={stream.title} className="w-full h-full object-cover" />
                      ) : (
                        <Video className="w-16 h-16 text-white/50" />
                      )}
                    </div>
                    <div className="absolute top-3 left-3 flex items-center gap-2 px-2 py-1 bg-red-500 rounded-full">
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                      <span className="text-xs text-white font-medium">LIVE</span>
                    </div>
                    <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/60 rounded-lg">
                      <span className="text-xs text-white">{stream.viewer_count} watching</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-saffron to-gold rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {stream.priest_name?.charAt(0) || 'P'}
                      </div>
                      <span className="text-sm text-gray-600">{stream.priest_name}</span>
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-3">{stream.title}</h3>
                    {stream.stream_url && (
                      <a
                        href={stream.stream_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <Play className="w-4 h-4" /> Watch Now
                      </a>
                    )}
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
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Main Dashboard Component
export default function DevoteeDashboard() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedPriest, setSelectedPriest] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const { user } = useAuth();
  const isDesktop = useIsDesktop();

  // Load unread message count
  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadUnreadCount = async () => {
    try {
      const res = await api.get('/api/chat/unread-count');
      setUnreadMessages(res.data.unread_count || 0);
    } catch (error) {
      // Silently fail - user might not be logged in yet
    }
  };

  // Handle priest detail view
  if (activeTab === 'priest-detail' && selectedPriest) {
    return (
      <div className={`min-h-screen bg-gradient-to-b from-cream to-parchment ${isDesktop ? 'lg:pl-64' : ''}`}>
        <Toaster position="top-center" richColors />
        {isDesktop && <Sidebar activeTab="priests" setActiveTab={setActiveTab} user={user} unreadMessages={unreadMessages} />}
        <PriestDetailView 
          priest={selectedPriest} 
          onBack={() => { setSelectedPriest(null); setActiveTab('priests'); }}
          isDesktop={isDesktop}
        />
        {!isDesktop && <BottomNav activeTab="priests" setActiveTab={setActiveTab} unreadMessages={unreadMessages} />}
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-b from-cream to-parchment ${isDesktop ? 'lg:pl-64' : ''}`}>
      <Toaster position="top-center" richColors />
      
      {isDesktop && <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} unreadMessages={unreadMessages} />}
      
      <div className={activeTab === 'astrology' ? '' : ''}>
        {activeTab === 'home' && (
          <HomeTab setActiveTab={setActiveTab} setSelectedPriest={setSelectedPriest} isDesktop={isDesktop} />
        )}
        {activeTab === 'messages' && <ChatTab isDesktop={isDesktop} />}
        {activeTab === 'consultation' && <ConsultationTab isDesktop={isDesktop} />}
        {activeTab === 'classes' && <ClassesTab isDesktop={isDesktop} />}
        {activeTab === 'live' && <LiveEventsTab isDesktop={isDesktop} />}
        {activeTab === 'feed' && <FeedTab isDesktop={isDesktop} />}
        {activeTab === 'mantras' && <MantrasTab isDesktop={isDesktop} />}
        {activeTab === 'calendar' && <CalendarTab isDesktop={isDesktop} />}
        {activeTab === 'priests' && (
          <PriestsTab setActiveTab={setActiveTab} setSelectedPriest={setSelectedPriest} isDesktop={isDesktop} />
        )}
        {activeTab === 'astrology' && <AstrologyTab isDesktop={isDesktop} />}
        {activeTab === 'shop' && <ShopTab isDesktop={isDesktop} />}
        {activeTab === 'profile' && <ProfileTab isDesktop={isDesktop} />}
      </div>
      
      {!isDesktop && <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} unreadMessages={unreadMessages} />}
    </div>
  );
}
