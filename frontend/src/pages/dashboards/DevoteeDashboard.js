import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, Star, Sun, ShoppingBag, User, Calendar, MapPin,
  Bell, ChevronRight, Clock, Package, Search, Filter,
  Plus, Minus, ShoppingCart, Heart, Settings, LogOut,
  CheckCircle, ArrowRight, Loader2, X, Menu, BookOpen, Play, Volume2, Music, Pause, SkipForward, SkipBack,
  Camera, MessageCircle, Send, Image as ImageIcon, Rss, MessageSquare, Video, Wallet
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { Toaster, toast } from 'sonner';
import ChatTab from '../../components/Chat/ChatTab';
import { WalletCard, RechargeModal, TransactionHistory } from '../../components/Wallet/WalletComponents';
import { AstrologerList, PreCallCheck, VideoCallScreen } from '../../components/VideoConsultation/VideoConsultation';

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
    { id: 'feed', icon: Rss, label: 'Spiritual Feed' },
    { id: 'mantras', icon: BookOpen, label: 'Mantras & Shlokas' },
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

  return (
    <div className={`pb-24 lg:pb-8 ${isDesktop ? 'px-8' : 'px-4'}`}>
      {/* Header - Name is clickable */}
      <div className="pt-4 pb-6">
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
                      {booking.scheduled_date && (
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(booking.scheduled_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      booking.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {booking.status}
                    </span>
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
  
  // Text-to-Speech states
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [showVoiceSelector, setShowVoiceSelector] = useState(false);
  
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
    loadVoices();
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
  
  // Load available voices from Sarvam AI (Indian voices)
  const loadVoices = async () => {
    try {
      const res = await api.get('/api/tts/voices');
      if (res.data.status === 'ok' && res.data.voices.length > 0) {
        setVoices(res.data.voices);
        // Default to a recommended Indian voice if available
        const recommendedVoice = res.data.voices.find(v => v.recommended);
        setSelectedVoice(recommendedVoice || res.data.voices[0]);
      } else {
        // Fallback to browser voices
        loadBrowserVoices();
      }
    } catch (error) {
      console.error('Error loading Sarvam AI voices:', error);
      loadBrowserVoices();
    }
  };
  
  // Fallback to browser TTS voices
  const loadBrowserVoices = () => {
    const loadAvailableVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      const relevantVoices = availableVoices.filter(v => 
        v.lang.includes('hi') || v.lang.includes('en') || v.lang.includes('sa')
      );
      const voiceList = (relevantVoices.length > 0 ? relevantVoices : availableVoices).map((v, idx) => ({
        voice_id: `browser_${idx}`,
        name: v.name,
        category: 'browser',
        browserVoice: v
      }));
      setVoices(voiceList);
      const hindiVoice = voiceList.find(v => v.name?.toLowerCase().includes('hindi'));
      setSelectedVoice(hindiVoice || voiceList[0]);
    };
    
    loadAvailableVoices();
    window.speechSynthesis.onvoiceschanged = loadAvailableVoices;
  };
  
  // Audio element ref for Sarvam AI playback
  const audioRef = React.useRef(null);
  
  // Speak mantra text using Sarvam AI or browser fallback
  const speakMantra = async (mantra, textType = 'transliteration') => {
    if (isSpeaking) {
      // Stop current playback
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setCurrentlyPlaying(null);
      return;
    }
    
    const text = textType === 'sanskrit' ? mantra.sanskrit : mantra.transliteration;
    if (!text) {
      toast.error('No text available to read');
      return;
    }
    
    // Check if using Sarvam AI voice
    if (selectedVoice && selectedVoice.voice_id && !selectedVoice.voice_id.startsWith('browser_')) {
      // Use Sarvam AI API
      setIsSpeaking(true);
      setCurrentlyPlaying(mantra.name);
      
      try {
        const res = await api.post('/api/tts/speak', {
          text: text,
          voice_id: selectedVoice.voice_id
        });
        
        if (res.data.status === 'ok' && res.data.audio) {
          const audio = new Audio(res.data.audio);
          audioRef.current = audio;
          
          audio.onended = () => {
            setIsSpeaking(false);
            setCurrentlyPlaying(null);
            audioRef.current = null;
          };
          
          audio.onerror = () => {
            setIsSpeaking(false);
            setCurrentlyPlaying(null);
            audioRef.current = null;
            toast.error('Audio playback failed');
          };
          
          audio.play();
        } else {
          throw new Error('Invalid audio response');
        }
      } catch (error) {
        console.error('Sarvam AI TTS error:', error);
        setIsSpeaking(false);
        setCurrentlyPlaying(null);
        toast.error('Voice generation failed. Try again.');
      }
    } else {
      // Fallback to browser TTS
      const utterance = new SpeechSynthesisUtterance(text);
      if (selectedVoice?.browserVoice) {
        utterance.voice = selectedVoice.browserVoice;
      }
      utterance.rate = 0.8;
      utterance.pitch = 1;
      
      utterance.onstart = () => {
        setIsSpeaking(true);
        setCurrentlyPlaying(mantra.name);
      };
      
      utterance.onend = () => {
        setIsSpeaking(false);
        setCurrentlyPlaying(null);
      };
      
      utterance.onerror = () => {
        setIsSpeaking(false);
        setCurrentlyPlaying(null);
        toast.error('Speech synthesis failed');
      };
      
      window.speechSynthesis.speak(utterance);
    }
  };
  
  // Stop speaking
  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setCurrentlyPlaying(null);
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
          
          {/* Voice Selector Button */}
          <div className="relative">
            <button
              onClick={() => setShowVoiceSelector(!showVoiceSelector)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-cream text-maroon hover:bg-saffron/20 transition-all"
            >
              <Volume2 className="w-4 h-4" />
              <span className="text-sm hidden md:inline">Voice</span>
            </button>
            
            {showVoiceSelector && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-saffron/20 z-20 p-3">
                <p className="text-xs text-gray-500 mb-2">Select Voice for Reading</p>
                <select
                  value={selectedVoice?.name || ''}
                  onChange={(e) => {
                    const voice = voices.find(v => v.name === e.target.value);
                    setSelectedVoice(voice);
                  }}
                  className="w-full bg-cream rounded-lg px-3 py-2 text-sm text-maroon focus:ring-2 focus:ring-saffron outline-none"
                >
                  {voices.map((voice, idx) => (
                    <option key={idx} value={voice.name}>
                      {voice.name} {voice.recommended ? '★' : ''} {voice.category === 'browser' ? '(Browser)' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-2">
                  {selectedVoice?.category !== 'browser' ? '🎙️ Using Sarvam AI (Indian Voice)' : 'Using browser voice'}
                </p>
              </div>
            )}
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
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => speakMantra(mantra)}
                        className={`p-2 rounded-full transition-all ${
                          currentlyPlaying === mantra.name 
                            ? 'bg-saffron text-white' 
                            : 'bg-saffron/10 text-saffron hover:bg-saffron/20'
                        }`}
                        title={currentlyPlaying === mantra.name ? 'Stop' : 'Listen'}
                      >
                        {currentlyPlaying === mantra.name ? (
                          <X className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </button>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        mantra.tier === 'free' ? 'bg-green-100 text-green-700' : 'bg-gold/20 text-gold'
                      }`}>
                        {mantra.tier === 'free' ? 'Free' : 'Premium'}
                      </span>
                    </div>
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
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => speakMantra(mantra)}
                          className={`p-1.5 rounded-full transition-all ${
                            currentlyPlaying === mantra.name 
                              ? 'bg-saffron text-white' 
                              : 'bg-saffron/10 text-saffron hover:bg-saffron/20'
                          }`}
                          title={currentlyPlaying === mantra.name ? 'Stop' : 'Listen'}
                        >
                          {currentlyPlaying === mantra.name ? (
                            <X className="w-3 h-3" />
                          ) : (
                            <Play className="w-3 h-3" />
                          )}
                        </button>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          mantra.tier === 'free' ? 'bg-green-100 text-green-700' : 'bg-gold/20 text-gold'
                        }`}>
                          {mantra.tier}
                        </span>
                      </div>
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
          speakMantra={speakMantra} 
          currentlyPlaying={currentlyPlaying}
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
function AllMantrasSection({ isDesktop, speakMantra, currentlyPlaying, selectedLanguage, languages, translations, translateText }) {
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => speakMantra(mantra)}
                  className={`p-1.5 rounded-full transition-all ${
                    currentlyPlaying === mantra.name 
                      ? 'bg-saffron text-white' 
                      : 'bg-saffron/10 text-saffron hover:bg-saffron/20'
                  }`}
                  title={currentlyPlaying === mantra.name ? 'Stop' : 'Listen'}
                >
                  {currentlyPlaying === mantra.name ? (
                    <X className="w-3 h-3" />
                  ) : (
                    <Play className="w-3 h-3" />
                  )}
                </button>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  mantra.tier === 'free' ? 'bg-green-100 text-green-700' : 'bg-gold/20 text-gold'
                }`}>
                  {mantra.tier}
                </span>
              </div>
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

// Priests Tab Content
function PriestsTab({ setActiveTab, setSelectedPriest, isDesktop }) {
  const [priests, setPriests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchPriests();
  }, [filter]);

  const fetchPriests = async () => {
    try {
      const params = filter ? `?specialization=${filter}` : '';
      const res = await api.get(`/api/priests${params}`);
      setPriests(res.data.priests || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`pb-24 lg:pb-8 ${isDesktop ? 'px-8' : 'px-4'}`}>
      <div className="pt-4 pb-4">
        <h1 className="font-cinzel text-2xl lg:text-3xl font-bold text-maroon mb-4">Book a Priest</h1>
        
        {/* Filter */}
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
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-saffron animate-spin" />
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
                  <p className="text-sm text-gray-500 mb-2">{priest.experience_years} years experience</p>
                  <div className="flex flex-wrap gap-1">
                    {priest.specializations?.slice(0, 2).map((s, i) => (
                      <span key={i} className="text-xs bg-orange-50 text-saffron-dark px-2 py-0.5 rounded-full">
                        {s}
                      </span>
                    ))}
                  </div>
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

// Priest Detail View
function PriestDetailView({ priest, onBack, isDesktop }) {
  const { user } = useAuth();
  const [selectedService, setSelectedService] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBook = async () => {
    if (!selectedService || !bookingDate) {
      toast.error('Please select service and date');
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/bookings', {
        priest_id: priest.id,
        service_name: selectedService.name,
        booking_date: new Date(bookingDate).toISOString(),
        booking_type: 'online'
      });
      toast.success('Booking created successfully!');
      onBack();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`pb-24 lg:pb-8 ${isDesktop ? 'px-8' : ''}`}>
      {/* Header with back button */}
      <div className="sticky top-0 bg-white/90 backdrop-blur-sm z-10 px-4 py-3 border-b border-orange-50">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-maroon">
          <ChevronRight className="w-5 h-5 rotate-180" />
          <span>Back to Priests</span>
        </button>
      </div>

      <div className={`${isDesktop ? 'grid grid-cols-3 gap-8 pt-6' : 'px-4 pt-4'}`}>
        {/* Priest Info */}
        <div className={`${isDesktop ? 'col-span-2' : ''}`}>
          <div className={`${isDesktop ? 'flex items-start gap-6' : 'text-center'} mb-6`}>
            <div className={`${isDesktop ? 'w-32 h-32' : 'w-24 h-24 mx-auto'} bg-gradient-to-br from-saffron to-gold rounded-full flex items-center justify-center text-white text-4xl font-cinzel mb-4`}>
              {priest.user_name?.charAt(0)}
            </div>
            <div className={`${isDesktop ? 'text-left' : ''}`}>
              <h1 className="font-cinzel text-xl lg:text-2xl font-bold text-maroon">{priest.user_name}</h1>
              <div className={`flex items-center ${isDesktop ? '' : 'justify-center'} gap-2 mt-2`}>
                <Star className="w-4 h-4 text-gold fill-gold" />
                <span className="text-gray-600">{priest.rating} ({priest.total_reviews} reviews)</span>
              </div>
              <p className="text-gray-500 text-sm mt-2">{priest.experience_years} years experience</p>
              <div className={`flex flex-wrap ${isDesktop ? '' : 'justify-center'} gap-2 mt-3`}>
                {priest.specializations?.map((s, i) => (
                  <span key={i} className="text-xs bg-orange-100 text-saffron-dark px-3 py-1 rounded-full">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="bg-orange-50 rounded-2xl p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">About</h3>
            <p className="text-gray-600 text-sm">{priest.bio}</p>
          </div>

          {/* Services */}
          <h2 className="font-cinzel text-lg font-semibold text-maroon mb-3">Services</h2>
          <div className={`${isDesktop ? 'grid grid-cols-2 gap-4' : 'space-y-3'} mb-6`}>
            {priest.services?.map((service, i) => (
              <button
                key={i}
                onClick={() => setSelectedService(service)}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                  selectedService?.name === service.name
                    ? 'border-saffron bg-orange-50'
                    : 'border-gray-100 bg-white hover:border-orange-200'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <p className="font-semibold text-gray-800">{service.name}</p>
                  <p className="text-saffron font-bold">₹{service.price}</p>
                </div>
                <p className="text-gray-500 text-sm mb-2">{service.description}</p>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  {service.duration_minutes} mins
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Booking Form - Sidebar on Desktop */}
        <div className={`${isDesktop ? 'col-span-1' : ''}`}>
          {selectedService && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white rounded-2xl p-6 border border-orange-100 ${isDesktop ? 'sticky top-20' : 'mb-6'}`}
            >
              <h3 className="font-cinzel text-lg font-semibold text-maroon mb-4">Book Service</h3>
              <div className="bg-orange-50 rounded-xl p-4 mb-4">
                <p className="text-sm text-gray-600">Selected Service</p>
                <p className="font-semibold text-gray-800">{selectedService.name}</p>
                <p className="text-saffron font-bold text-xl">₹{selectedService.price}</p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Date & Time</label>
                <input
                  type="datetime-local"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full border border-orange-200 rounded-xl px-4 py-3 focus:border-saffron focus:ring-2 focus:ring-saffron/20 outline-none"
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
              <button
                onClick={handleBook}
                disabled={loading}
                className="w-full bg-saffron hover:bg-saffron-dark text-white rounded-full py-4 font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Confirm Booking</>}
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

// Astrology Tab
function AstrologyTab({ isDesktop }) {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('horoscope');
  const [signs] = useState([
    { name: 'Aries', symbol: '♈', dates: 'Mar 21 - Apr 19' },
    { name: 'Taurus', symbol: '♉', dates: 'Apr 20 - May 20' },
    { name: 'Gemini', symbol: '♊', dates: 'May 21 - Jun 20' },
    { name: 'Cancer', symbol: '♋', dates: 'Jun 21 - Jul 22' },
    { name: 'Leo', symbol: '♌', dates: 'Jul 23 - Aug 22' },
    { name: 'Virgo', symbol: '♍', dates: 'Aug 23 - Sep 22' },
    { name: 'Libra', symbol: '♎', dates: 'Sep 23 - Oct 22' },
    { name: 'Scorpio', symbol: '♏', dates: 'Oct 23 - Nov 21' },
    { name: 'Sagittarius', symbol: '♐', dates: 'Nov 22 - Dec 21' },
    { name: 'Capricorn', symbol: '♑', dates: 'Dec 22 - Jan 19' },
    { name: 'Aquarius', symbol: '♒', dates: 'Jan 20 - Feb 18' },
    { name: 'Pisces', symbol: '♓', dates: 'Feb 19 - Mar 20' },
  ]);
  const [selectedSign, setSelectedSign] = useState(null);
  const [horoscope, setHoroscope] = useState(null);
  const [personalHoroscope, setPersonalHoroscope] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Location search states
  const [locationSearch, setLocationSearch] = useState('');
  const [locationResults, setLocationResults] = useState([]);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [brideLocationSearch, setBrideLocationSearch] = useState('');
  const [brideLocationResults, setBrideLocationResults] = useState([]);
  const [groomLocationSearch, setGroomLocationSearch] = useState('');
  const [groomLocationResults, setGroomLocationResults] = useState([]);
  
  // Kundali states
  const [kundaliForm, setKundaliForm] = useState({
    datetime: '',
    latitude: null,
    longitude: null,
    location: ''
  });
  const [kundaliResult, setKundaliResult] = useState(null);
  
  // Kundali Matching states
  const [matchingForm, setMatchingForm] = useState({
    bride_datetime: '',
    bride_location: '',
    bride_latitude: null,
    bride_longitude: null,
    groom_datetime: '',
    groom_location: '',
    groom_latitude: null,
    groom_longitude: null
  });
  const [matchingResult, setMatchingResult] = useState(null);

  // Search location using Google Places API
  const searchLocation = async (query, type = 'kundali') => {
    if (!query || query.length < 2) {
      if (type === 'kundali') setLocationResults([]);
      else if (type === 'bride') setBrideLocationResults([]);
      else setGroomLocationResults([]);
      return;
    }
    
    setSearchingLocation(true);
    
    try {
      // Use Google Places Autocomplete API via backend
      const res = await api.get(`/api/places/autocomplete?query=${encodeURIComponent(query)}`);
      
      if (res.data.status === 'ok' && res.data.results) {
        const results = res.data.results.map(place => ({
          place_id: place.place_id,
          name: place.main_text || place.description,
          description: place.description,
          secondary_text: place.secondary_text
        }));
        
        if (type === 'kundali') setLocationResults(results);
        else if (type === 'bride') setBrideLocationResults(results);
        else setGroomLocationResults(results);
      }
    } catch (error) {
      console.error('Error searching location:', error);
    }
    setSearchingLocation(false);
  };
  
  // Get place details with coordinates
  const selectLocation = async (place, type = 'kundali') => {
    try {
      const res = await api.get(`/api/places/details/${place.place_id}`);
      
      if (res.data.status === 'ok' && res.data.data) {
        const { name, formatted_address, latitude, longitude, city, state, country } = res.data.data;
        const locationName = city || name || formatted_address;
        const fullLocation = [city, state, country].filter(Boolean).join(', ');
        
        if (type === 'kundali') {
          setKundaliForm({
            ...kundaliForm,
            location: fullLocation || locationName,
            latitude: latitude,
            longitude: longitude
          });
          setLocationSearch('');
          setLocationResults([]);
        } else if (type === 'bride') {
          setMatchingForm({
            ...matchingForm,
            bride_location: fullLocation || locationName,
            bride_latitude: latitude,
            bride_longitude: longitude
          });
          setBrideLocationSearch('');
          setBrideLocationResults([]);
        } else {
          setMatchingForm({
            ...matchingForm,
            groom_location: fullLocation || locationName,
            groom_latitude: latitude,
            groom_longitude: longitude
          });
          setGroomLocationSearch('');
          setGroomLocationResults([]);
        }
      }
    } catch (error) {
      console.error('Error getting place details:', error);
      toast.error('Failed to get location details');
    }
  };
  
  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (locationSearch) searchLocation(locationSearch, 'kundali');
    }, 300);
    return () => clearTimeout(timer);
  }, [locationSearch]);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (brideLocationSearch) searchLocation(brideLocationSearch, 'bride');
    }, 300);
    return () => clearTimeout(timer);
  }, [brideLocationSearch]);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (groomLocationSearch) searchLocation(groomLocationSearch, 'groom');
    }, 300);
    return () => clearTimeout(timer);
  }, [groomLocationSearch]);

  useEffect(() => {
    // Fetch personalized horoscope if user has profile data
    if (user?.nakshatra || user?.date_of_birth) {
      fetchPersonalHoroscope();
    }
  }, [user]);

  const fetchPersonalHoroscope = async () => {
    try {
      const res = await api.get('/api/horoscope/personalized');
      setPersonalHoroscope(res.data);
    } catch (error) {
      console.error('Error fetching personal horoscope:', error);
    }
  };

  const fetchHoroscope = async (sign) => {
    setSelectedSign(sign);
    setLoading(true);
    try {
      const res = await api.get(`/api/horoscope/daily/${sign.name.toLowerCase()}`);
      setHoroscope(res.data);
    } catch (error) {
      toast.error('Failed to fetch horoscope');
    } finally {
      setLoading(false);
    }
  };

  const fetchKundali = async () => {
    if (!kundaliForm.datetime) {
      toast.error('Please enter date and time of birth');
      return;
    }
    if (!kundaliForm.latitude || !kundaliForm.longitude) {
      toast.error('Please select a birth place from the search results');
      return;
    }
    setLoading(true);
    try {
      // Add Indian timezone (+05:30) if not present
      let datetimeStr = kundaliForm.datetime;
      if (!datetimeStr.includes('+') && !datetimeStr.includes('Z')) {
        datetimeStr = datetimeStr + ':00+05:30';
      }
      const res = await api.post('/api/astrology/birth-kundali', {
        datetime: datetimeStr,
        latitude: kundaliForm.latitude,
        longitude: kundaliForm.longitude
      });
      if (res.data.error) {
        toast.error('Unable to generate kundali. Please try again later.');
        setKundaliResult({ error: true });
      } else {
        setKundaliResult(res.data);
        toast.success('Birth Kundali generated!');
      }
    } catch (error) {
      toast.error('Failed to generate kundali');
      setKundaliResult({ error: true });
    } finally {
      setLoading(false);
    }
  };

  const fetchKundaliMatching = async () => {
    if (!matchingForm.bride_datetime || !matchingForm.groom_datetime) {
      toast.error('Please enter both birth date/time');
      return;
    }
    if (!matchingForm.bride_latitude || !matchingForm.groom_latitude) {
      toast.error('Please select birth places for both bride and groom');
      return;
    }
    setLoading(true);
    try {
      // Add Indian timezone (+05:30) if not present
      let brideDatetime = matchingForm.bride_datetime;
      let groomDatetime = matchingForm.groom_datetime;
      if (!brideDatetime.includes('+') && !brideDatetime.includes('Z')) {
        brideDatetime = brideDatetime + ':00+05:30';
      }
      if (!groomDatetime.includes('+') && !groomDatetime.includes('Z')) {
        groomDatetime = groomDatetime + ':00+05:30';
      }
      const res = await api.post('/api/astrology/kundali-matching', {
        bride_datetime: brideDatetime,
        bride_latitude: matchingForm.bride_latitude,
        bride_longitude: matchingForm.bride_longitude,
        groom_datetime: groomDatetime,
        groom_latitude: matchingForm.groom_latitude,
        groom_longitude: matchingForm.groom_longitude
      });
      if (res.data.error) {
        toast.error('Unable to match kundalis. Please try again later.');
        setMatchingResult({ error: true });
      } else {
        setMatchingResult(res.data);
        toast.success('Kundali matching complete!');
      }
    } catch (error) {
      toast.error('Failed to perform kundali matching');
      setMatchingResult({ error: true });
    } finally {
      setLoading(false);
    }
  };

  const sections = [
    { id: 'horoscope', name: 'Daily Horoscope', icon: Sun },
    { id: 'kundali', name: 'Birth Kundali', icon: Star },
    { id: 'matching', name: 'Kundali Matching', icon: Heart }
  ];

  return (
    <div className={`pb-24 lg:pb-8 ${isDesktop ? 'px-8' : 'px-4'}`}>
      <div className="pt-4 pb-6">
        <h1 className="font-cinzel text-2xl lg:text-3xl font-bold text-maroon">Astrology Services</h1>
        <p className="text-gray-500 text-sm">Vedic astrology powered by Prokerala</p>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
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
      </div>

        {/* Personal Horoscope Card */}
        {personalHoroscope && activeSection === 'horoscope' && (
          <div className="bg-gradient-to-r from-saffron to-gold rounded-2xl p-5 mb-6 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-white/80 text-sm">Your Daily Prediction</p>
                <h3 className="text-white font-cinzel text-lg">
                  {personalHoroscope.user_sign_name} ({personalHoroscope.user_sign_hindi})
                </h3>
              </div>
              <div className="text-4xl">{signs.find(s => s.name.toLowerCase() === personalHoroscope.user_sign)?.symbol}</div>
            </div>
            <p className="text-white/90 text-sm mb-4">
              {personalHoroscope.data?.daily_prediction?.prediction}
            </p>
            <div className="flex gap-3">
              {personalHoroscope.data?.daily_prediction?.lucky_number && (
                <span className="bg-white/20 px-3 py-1 rounded-full text-white text-xs">
                  Lucky: {personalHoroscope.data.daily_prediction.lucky_number}
                </span>
              )}
              {personalHoroscope.data?.daily_prediction?.lucky_color && (
                <span className="bg-white/20 px-3 py-1 rounded-full text-white text-xs">
                  {personalHoroscope.data.daily_prediction.lucky_color}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Daily Horoscope Section */}
        {activeSection === 'horoscope' && (
          <div className={`${isDesktop ? 'grid grid-cols-2 gap-8' : ''}`}>
            <div className={`grid ${isDesktop ? 'grid-cols-4' : 'grid-cols-4'} gap-3 mb-6`}>
              {signs.map((sign) => (
                <button
                  key={sign.name}
                  onClick={() => fetchHoroscope(sign)}
                  className={`p-3 lg:p-4 rounded-2xl text-center transition-all hover:scale-105 ${
                    selectedSign?.name === sign.name
                      ? 'bg-saffron ring-2 ring-gold'
                      : 'bg-cream hover:bg-saffron/20'
                  }`}
                >
                  <span className={`${isDesktop ? 'text-3xl' : 'text-2xl'} block mb-1`}>{sign.symbol}</span>
                  <span className={`text-xs ${selectedSign?.name === sign.name ? 'text-white' : 'text-maroon'}`}>{sign.name}</span>
                </button>
              ))}
            </div>

            <div>
              {loading && (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 text-saffron animate-spin" />
                </div>
              )}

              {horoscope && !loading && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-cream rounded-2xl p-6 border border-saffron/20">
                  <div className="text-center mb-4">
                    <span className="text-5xl">{selectedSign?.symbol}</span>
                    <h2 className="font-cinzel text-xl text-maroon mt-2">{horoscope.sign_name || selectedSign?.name}</h2>
                  </div>
                  <p className="text-gray-700 text-center mb-6">{horoscope.data?.daily_prediction?.prediction}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-saffron/10 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-500">Lucky Number</p>
                      <p className="text-xl text-maroon font-bold">{horoscope.data?.daily_prediction?.lucky_number}</p>
                    </div>
                    <div className="bg-saffron/10 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-500">Lucky Color</p>
                      <p className="text-lg text-maroon">{horoscope.data?.daily_prediction?.lucky_color}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {!horoscope && !loading && !personalHoroscope && (
                <div className="text-center py-12">
                  <Sun className="w-16 h-16 text-saffron/30 mx-auto mb-4" />
                  <p className="text-gray-500">Select a sign to see your horoscope</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Birth Kundali Section */}
        {activeSection === 'kundali' && (
          <div className={`${isDesktop ? 'grid grid-cols-2 gap-8' : ''}`}>
            <div className="bg-cream rounded-2xl p-6 mb-6 border border-saffron/20">
              <h3 className="font-cinzel text-lg text-maroon mb-4">Enter Birth Details</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Date & Time of Birth</label>
                  <input
                    type="datetime-local"
                    value={kundaliForm.datetime}
                    onChange={(e) => setKundaliForm({ ...kundaliForm, datetime: e.target.value })}
                    className="w-full bg-white border border-saffron/30 rounded-xl px-4 py-3 text-maroon focus:ring-2 focus:ring-saffron outline-none"
                  />
                </div>
                
                <div className="relative">
                  <label className="block text-sm text-gray-600 mb-1">Birth Place (Search any city worldwide)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={locationSearch || kundaliForm.location}
                      onChange={(e) => {
                        setLocationSearch(e.target.value);
                        if (!e.target.value) {
                          setLocationResults([]);
                        }
                      }}
                      onFocus={() => {
                        if (kundaliForm.location) setLocationSearch('');
                      }}
                      placeholder="Search any city (e.g., New York, Delhi, London)..."
                      className="w-full bg-white border border-saffron/30 rounded-xl px-4 py-3 text-maroon focus:ring-2 focus:ring-saffron outline-none pr-10"
                    />
                    {searchingLocation ? (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-saffron animate-spin" />
                    ) : (
                      <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  
                  {/* Location Results Dropdown */}
                  {locationResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white rounded-xl shadow-lg border border-saffron/20 max-h-48 overflow-auto">
                      {locationResults.map((loc, idx) => (
                        <button
                          key={idx}
                          onClick={() => selectLocation(loc, 'kundali')}
                          className="w-full px-4 py-2 text-left hover:bg-saffron/10 text-sm text-maroon border-b border-gray-100 last:border-0"
                        >
                          <span className="font-medium">{loc.name}</span>
                          {loc.secondary_text && <span className="text-gray-500 ml-1">{loc.secondary_text}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {kundaliForm.location && kundaliForm.latitude && (
                  <p className="text-xs text-gray-500">
                    Selected: {kundaliForm.location} ({kundaliForm.latitude.toFixed(4)}°N, {kundaliForm.longitude.toFixed(4)}°E)
                  </p>
                )}

                <button
                  onClick={fetchKundali}
                  disabled={loading}
                  className="w-full bg-saffron hover:bg-saffron/90 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Generate Kundali</>}
                </button>
              </div>
            </div>

            {kundaliResult && !kundaliResult.error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-cream rounded-2xl p-6 border border-saffron/20">
                <h3 className="font-cinzel text-lg text-maroon mb-4">Your Birth Kundali</h3>
                
                {/* Nakshatra & Basic Info */}
                {kundaliResult.data?.nakshatra_details && (
                  <>
                    <div className="bg-gradient-to-r from-saffron to-gold rounded-xl p-4 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white/80 text-sm">Nakshatra</span>
                        <span className="text-white font-semibold">{kundaliResult.data.nakshatra_details.nakshatra?.name}</span>
                      </div>
                      {kundaliResult.data.nakshatra_details.nakshatra?.lord && (
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white/80 text-sm">Nakshatra Lord</span>
                          <span className="text-white">{kundaliResult.data.nakshatra_details.nakshatra.lord.vedic_name || kundaliResult.data.nakshatra_details.nakshatra.lord.name}</span>
                        </div>
                      )}
                      {kundaliResult.data.nakshatra_details.nakshatra?.pada && (
                        <div className="flex items-center justify-between">
                          <span className="text-white/80 text-sm">Pada</span>
                          <span className="text-white">{kundaliResult.data.nakshatra_details.nakshatra.pada}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Rashi Info - using chandra_rasi */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {kundaliResult.data.nakshatra_details.chandra_rasi && (
                        <div className="bg-saffron/10 rounded-xl p-3 text-center">
                          <p className="text-xs text-gray-500 mb-1">Moon Sign (Chandra Rashi)</p>
                          <p className="text-maroon font-semibold">{kundaliResult.data.nakshatra_details.chandra_rasi.name}</p>
                          {kundaliResult.data.nakshatra_details.chandra_rasi.lord && (
                            <p className="text-saffron text-xs">Lord: {kundaliResult.data.nakshatra_details.chandra_rasi.lord.vedic_name}</p>
                          )}
                        </div>
                      )}
                      {kundaliResult.data.nakshatra_details.soorya_rasi && (
                        <div className="bg-saffron/10 rounded-xl p-3 text-center">
                          <p className="text-xs text-gray-500 mb-1">Sun Sign (Surya Rashi)</p>
                          <p className="text-maroon font-semibold">{kundaliResult.data.nakshatra_details.soorya_rasi.name}</p>
                          {kundaliResult.data.nakshatra_details.soorya_rasi.lord && (
                            <p className="text-saffron text-xs">Lord: {kundaliResult.data.nakshatra_details.soorya_rasi.lord.vedic_name}</p>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Additional Info */}
                    {kundaliResult.data.nakshatra_details.additional_info && (
                      <div className="bg-white rounded-xl p-4 mb-4 border border-saffron/10">
                        <h4 className="text-maroon text-sm font-medium mb-3">Nakshatra Details</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                          {kundaliResult.data.nakshatra_details.additional_info.deity && (
                            <div>
                              <p className="text-gray-500 text-xs">Deity</p>
                              <p className="text-maroon">{kundaliResult.data.nakshatra_details.additional_info.deity}</p>
                            </div>
                          )}
                          {kundaliResult.data.nakshatra_details.additional_info.symbol && (
                            <div>
                              <p className="text-gray-500 text-xs">Symbol</p>
                              <p className="text-maroon">{kundaliResult.data.nakshatra_details.additional_info.symbol}</p>
                            </div>
                          )}
                          {kundaliResult.data.nakshatra_details.additional_info.ganam && (
                            <div>
                              <p className="text-gray-500 text-xs">Gana</p>
                              <p className="text-maroon">{kundaliResult.data.nakshatra_details.additional_info.ganam}</p>
                            </div>
                          )}
                          {kundaliResult.data.nakshatra_details.additional_info.birth_stone && (
                            <div>
                              <p className="text-gray-500 text-xs">Birth Stone</p>
                              <p className="text-maroon">{kundaliResult.data.nakshatra_details.additional_info.birth_stone}</p>
                            </div>
                          )}
                          {kundaliResult.data.nakshatra_details.additional_info.color && (
                            <div>
                              <p className="text-gray-500 text-xs">Lucky Color</p>
                              <p className="text-maroon">{kundaliResult.data.nakshatra_details.additional_info.color}</p>
                            </div>
                          )}
                          {kundaliResult.data.nakshatra_details.additional_info.syllables && (
                            <div>
                              <p className="text-gray-500 text-xs">Name Syllables</p>
                              <p className="text-maroon">{kundaliResult.data.nakshatra_details.additional_info.syllables}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
                
                {/* Mangal Dosha */}
                {kundaliResult.data?.mangal_dosha && (
                  <div className={`rounded-xl p-4 mb-4 border ${
                    kundaliResult.data.mangal_dosha.has_dosha ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {kundaliResult.data.mangal_dosha.has_dosha ? (
                        <span className="text-red-500 text-lg">⚠️</span>
                      ) : (
                        <span className="text-green-500 text-lg">✓</span>
                      )}
                      <p className="text-maroon font-medium">Mangal Dosha</p>
                      {kundaliResult.data.mangal_dosha.type && (
                        <span className="text-xs bg-red-100 px-2 py-0.5 rounded text-red-600">{kundaliResult.data.mangal_dosha.type}</span>
                      )}
                    </div>
                    <p className="text-gray-700 text-sm mb-2">{kundaliResult.data.mangal_dosha.description}</p>
                    {kundaliResult.data.mangal_dosha.exceptions?.length > 0 && (
                      <div className="mt-2">
                        <p className="text-amber-600 text-xs mb-1">Exceptions:</p>
                        {kundaliResult.data.mangal_dosha.exceptions.slice(0, 2).map((exc, i) => (
                          <p key={i} className="text-gray-500 text-xs">• {exc}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Fallback for no data */}
                {!kundaliResult.data?.nakshatra_details && (
                  <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                    <p className="text-green-600 text-sm mb-2">✓ Kundali generated successfully</p>
                    <p className="text-gray-500 text-xs">Detailed planetary positions calculated based on your birth details.</p>
                  </div>
                )}
              </motion.div>
            )}
            
            {/* Error state */}
            {kundaliResult?.error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-cream rounded-2xl p-6 border border-saffron/20">
                <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                  <p className="text-red-600 text-sm mb-2">⚠️ Service Temporarily Unavailable</p>
                  <p className="text-gray-500 text-xs">The astrology service is currently unavailable. Please try again later or contact support.</p>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Kundali Matching Section */}
        {activeSection === 'matching' && (
          <div className={`${isDesktop ? 'grid grid-cols-2 gap-8' : ''}`}>
            <div className="bg-cream rounded-2xl p-6 mb-6 border border-saffron/20">
              <h3 className="font-cinzel text-lg text-maroon mb-4">Bride's Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Date & Time of Birth</label>
                  <input
                    type="datetime-local"
                    value={matchingForm.bride_datetime}
                    onChange={(e) => setMatchingForm({ ...matchingForm, bride_datetime: e.target.value })}
                    className="w-full bg-white border border-saffron/30 rounded-xl px-4 py-3 text-maroon focus:ring-2 focus:ring-saffron outline-none"
                  />
                </div>
                <div className="relative">
                  <label className="block text-sm text-gray-600 mb-1">Birth Place (Search any city worldwide)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={brideLocationSearch || matchingForm.bride_location}
                      onChange={(e) => {
                        setBrideLocationSearch(e.target.value);
                        if (!e.target.value) setBrideLocationResults([]);
                      }}
                      onFocus={() => {
                        if (matchingForm.bride_location) setBrideLocationSearch('');
                      }}
                      placeholder="Search any city (e.g., New York, Delhi)..."
                      className="w-full bg-white border border-saffron/30 rounded-xl px-4 py-3 text-maroon focus:ring-2 focus:ring-saffron outline-none pr-10"
                    />
                    <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                  {brideLocationResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white rounded-xl shadow-lg border border-saffron/20 max-h-48 overflow-auto">
                      {brideLocationResults.map((loc, idx) => (
                        <button
                          key={idx}
                          onClick={() => selectLocation(loc, 'bride')}
                          className="w-full px-4 py-2 text-left hover:bg-saffron/10 text-sm text-maroon border-b border-gray-100 last:border-0"
                        >
                          <span className="font-medium">{loc.name}</span>
                          {loc.secondary_text && <span className="text-gray-500 ml-1">{loc.secondary_text}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <h3 className="font-cinzel text-lg text-maroon mb-4 mt-6">Groom's Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Date & Time of Birth</label>
                  <input
                    type="datetime-local"
                    value={matchingForm.groom_datetime}
                    onChange={(e) => setMatchingForm({ ...matchingForm, groom_datetime: e.target.value })}
                    className="w-full bg-white border border-saffron/30 rounded-xl px-4 py-3 text-maroon focus:ring-2 focus:ring-saffron outline-none"
                  />
                </div>
                <div className="relative">
                  <label className="block text-sm text-gray-600 mb-1">Birth Place (Search any city worldwide)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={groomLocationSearch || matchingForm.groom_location}
                      onChange={(e) => {
                        setGroomLocationSearch(e.target.value);
                        if (!e.target.value) setGroomLocationResults([]);
                      }}
                      onFocus={() => {
                        if (matchingForm.groom_location) setGroomLocationSearch('');
                      }}
                      placeholder="Search any city (e.g., London, Mumbai)..."
                      className="w-full bg-white border border-saffron/30 rounded-xl px-4 py-3 text-maroon focus:ring-2 focus:ring-saffron outline-none pr-10"
                    />
                    <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                  {groomLocationResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white rounded-xl shadow-lg border border-saffron/20 max-h-48 overflow-auto">
                      {groomLocationResults.map((loc, idx) => (
                        <button
                          key={idx}
                          onClick={() => selectLocation(loc, 'groom')}
                          className="w-full px-4 py-2 text-left hover:bg-saffron/10 text-sm text-maroon border-b border-gray-100 last:border-0"
                        >
                          <span className="font-medium">{loc.name}</span>
                          {loc.secondary_text && <span className="text-gray-500 ml-1">{loc.secondary_text}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={fetchKundaliMatching}
                disabled={loading}
                className="w-full bg-saffron hover:bg-saffron/90 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 transition-colors mt-6"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Heart className="w-5 h-5" /> Check Compatibility</>}
              </button>
            </div>

            {matchingResult && !matchingResult.error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-cream rounded-2xl p-6 border border-saffron/20">
                <h3 className="font-cinzel text-lg text-maroon mb-4">Marriage Compatibility</h3>
                
                {/* Overall Score */}
                {matchingResult.data?.guna_milan && (
                  <div className={`rounded-xl p-5 mb-4 text-center ${
                    matchingResult.data.guna_milan.total_points >= 21 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                      : matchingResult.data.guna_milan.total_points >= 18 
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-500'
                        : 'bg-gradient-to-r from-saffron to-gold'
                  }`}>
                    <p className="text-white/80 text-sm mb-1">Compatibility Score</p>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-5xl font-bold text-white">{matchingResult.data.guna_milan.total_points}</span>
                      <span className="text-white/80 text-lg">/{matchingResult.data.guna_milan.maximum_points || 36}</span>
                    </div>
                    <p className="text-white text-sm mt-2">
                      {matchingResult.data.guna_milan.total_points >= 28 ? 'Excellent Match!' : 
                       matchingResult.data.guna_milan.total_points >= 21 ? 'Good Compatibility' : 
                       matchingResult.data.guna_milan.total_points >= 18 ? 'Average Match' : 'Needs Consultation'}
                    </p>
                  </div>
                )}
                
                {/* Message/Recommendation */}
                {matchingResult.data?.message && (
                  <div className={`rounded-xl p-4 mb-4 border ${
                    matchingResult.data.message.type === 'good' ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
                  }`}>
                    <p className="text-gray-700 text-sm">{matchingResult.data.message.description}</p>
                  </div>
                )}
                
                {/* Couple Info */}
                {(matchingResult.data?.girl_info || matchingResult.data?.boy_info) && (
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {matchingResult.data.girl_info && (
                      <div className="bg-pink-50 rounded-xl p-3 border border-pink-200">
                        <p className="text-pink-600 text-xs font-medium mb-2">Bride</p>
                        <p className="text-maroon text-sm">{matchingResult.data.girl_info.nakshatra?.name}</p>
                        <p className="text-gray-500 text-xs">{matchingResult.data.girl_info.rasi?.name} Rashi</p>
                      </div>
                    )}
                    {matchingResult.data.boy_info && (
                      <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
                        <p className="text-blue-600 text-xs font-medium mb-2">Groom</p>
                        <p className="text-maroon text-sm">{matchingResult.data.boy_info.nakshatra?.name}</p>
                        <p className="text-gray-500 text-xs">{matchingResult.data.boy_info.rasi?.name} Rashi</p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Guna Details (Ashtakoot) */}
                {matchingResult.data?.guna_milan?.guna && (
                  <div className="mb-4">
                    <h4 className="text-maroon text-sm font-medium mb-3">Ashtakoot Milan (8 Aspects)</h4>
                    <div className="space-y-2">
                      {matchingResult.data.guna_milan.guna.slice(0, 8).map((guna, idx) => (
                        <div key={idx} className="bg-white rounded-lg p-3 flex justify-between items-center border border-saffron/10">
                          <div className="flex-1">
                            <p className="text-maroon text-sm">{guna.name}</p>
                            <p className="text-gray-400 text-xs">
                              {guna.girl_koot && guna.boy_koot ? `${guna.girl_koot} / ${guna.boy_koot}` : ''}
                            </p>
                          </div>
                          <div className="text-right ml-2">
                            <span className={`font-semibold ${
                              guna.obtained_points === guna.maximum_points ? 'text-green-600' :
                              guna.obtained_points > 0 ? 'text-amber-600' : 'text-red-600'
                            }`}>{guna.obtained_points}</span>
                            <span className="text-gray-400">/{guna.maximum_points}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Fallback for no guna data */}
                {!matchingResult.data?.guna_milan && (
                  <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                    <p className="text-green-600 text-sm mb-2">✓ Kundali matching analysis complete</p>
                    <p className="text-gray-500 text-xs">Compatibility analysis based on the provided birth details.</p>
                  </div>
                )}
              </motion.div>
            )}
            
            {/* Error state for matching */}
            {matchingResult?.error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-cream rounded-2xl p-6 border border-saffron/20">
                <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                  <p className="text-red-600 text-sm mb-2">⚠️ Service Temporarily Unavailable</p>
                  <p className="text-gray-500 text-xs">The astrology service is currently unavailable. Please try again later or contact support.</p>
                </div>
              </motion.div>
            )}
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
  const { addToCart } = useCart();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/api/products');
      setProducts(res.data.products || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
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

  return (
    <div className={`pb-24 lg:pb-8 ${isDesktop ? 'px-8' : 'px-4'}`}>
      <div className="pt-4 pb-4">
        <h1 className="font-cinzel text-2xl lg:text-3xl font-bold text-maroon mb-4">Pooja Store</h1>
        
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
              className="bg-white rounded-2xl p-3 lg:p-4 shadow-sm border border-orange-50 hover:shadow-md transition-shadow"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className={`aspect-square bg-orange-50 rounded-xl mb-3 flex items-center justify-center overflow-hidden`}>
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <ShoppingBag className="w-10 h-10 text-saffron/30" />
                )}
              </div>
              <p className={`font-medium ${isDesktop ? 'text-base' : 'text-sm'} text-gray-800 line-clamp-2 mb-1`}>{product.name}</p>
              <div className="flex items-center gap-1 mb-2">
                <Star className="w-3 h-3 text-gold fill-gold" />
                <span className="text-xs text-gray-500">{product.rating}</span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-saffron font-bold">₹{product.price}</p>
                <button
                  onClick={() => handleAddToCart(product.id)}
                  className="w-8 h-8 lg:w-10 lg:h-10 bg-saffron hover:bg-saffron-dark text-white rounded-full flex items-center justify-center transition-colors"
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
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  value={editForm.city}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                  className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-saffron focus:border-transparent"
                  placeholder="Your city"
                  data-testid="profile-city-input"
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
                  placeholder="Your complete address"
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
