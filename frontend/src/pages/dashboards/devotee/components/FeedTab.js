import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Send, Image as ImageIcon, X, Loader2, Rss } from 'lucide-react';
import api from '../../../../lib/api';
import { useAuth } from '../../../../contexts/AuthContext';
import { toast } from 'sonner';
import { useConfirmDialog } from '../../../../components/ui/ConfirmDialog';

// PostCard Component with Comments and Likes
export function PostCard({ post }) {
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
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const fileInputRef = useRef(null);

  useEffect(() => {
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
    const ok = await confirm({ title: 'Delete Comment?', message: 'This comment will be permanently removed.', confirmLabel: 'Delete', variant: 'danger' });
    if (!ok) return;
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
      <ConfirmDialog />
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
              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
            })}
          </p>
        </div>
      </div>
      
      <p className="mt-3 text-gray-700 text-sm leading-relaxed">{post.content}</p>
      
      {post.image_url && (
        <img src={post.image_url} alt="Post" className="mt-3 w-full h-48 object-cover rounded-xl" />
      )}
      
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

      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 border-t border-gray-100"
          >
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
                  <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="p-1 text-gray-400 hover:text-saffron">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                  </button>
                  <button onClick={submitComment} disabled={submitting || (!newComment.trim() && !commentImage)} className="p-1 text-saffron disabled:text-gray-300">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
                {commentImage && (
                  <div className="relative mt-2 inline-block">
                    <img src={commentImage} alt="Upload" className="h-16 rounded-lg" />
                    <button onClick={() => setCommentImage('')} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {loadingComments ? (
              <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-saffron" /></div>
            ) : comments.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-2">No comments yet. Be the first!</p>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center text-gray-600 text-xs font-medium flex-shrink-0 overflow-hidden">
                      {comment.user_photo ? <img src={comment.user_photo} alt="" className="w-full h-full object-cover" /> : comment.user_name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-gray-700">{comment.user_name}</p>
                        {user && comment.user_id === user.id && (
                          <button onClick={() => deleteComment(comment.id)} className="text-gray-400 hover:text-red-500">
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      {comment.content && <p className="text-sm text-gray-600 mt-1">{comment.content}</p>}
                      {comment.image_url && <img src={comment.image_url} alt="Comment" className="mt-2 max-h-32 rounded-lg" />}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(comment.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
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
export function FeedTab({ isDesktop }) {
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
      <div className="mb-6">
        <h1 className="font-cinzel text-2xl font-bold text-maroon mb-1">Spiritual Feed</h1>
        <p className="text-gray-500 text-sm">Updates from our priests and spiritual guides</p>
      </div>

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
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                  </span>
                ) : 'Load More'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
