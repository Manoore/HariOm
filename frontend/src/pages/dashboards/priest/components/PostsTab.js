import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Send, Heart, MessageCircle, Eye, Trash2, Camera, X, Loader2 } from 'lucide-react';
import api from '../../../../lib/api';
import { toast } from 'sonner';

function PostsTab({ posts, onRefresh }) {
  const [showModal, setShowModal] = useState(false);
  const [newPost, setNewPost] = useState({ content: '', image_url: '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid image (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image too large. Maximum size is 5MB.');
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);

    // Upload to server
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/api/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setNewPost({ ...newPost, image_url: response.data.url });
      toast.success('Image uploaded!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
      setImagePreview(null);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setNewPost({ ...newPost, image_url: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const createPost = async () => {
    if (!newPost.content.trim()) {
      toast.error('Please write something');
      return;
    }
    setSaving(true);
    try {
      await api.post('/api/priest/posts', newPost);
      toast.success('Post published!');
      setNewPost({ content: '', image_url: '' });
      setImagePreview(null);
      setShowModal(false);
      onRefresh();
    } catch (error) {
      toast.error('Failed to post');
    } finally {
      setSaving(false);
    }
  };

  const deletePost = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await api.delete(`/api/priest/posts/${postId}`);
      toast.success('Post deleted');
      onRefresh();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setNewPost({ content: '', image_url: '' });
    setImagePreview(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-cinzel text-lg md:text-xl font-semibold text-maroon">Daily Updates</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-saffron text-white px-4 py-2 rounded-lg text-sm"
        >
          <Plus className="w-4 h-4" /> New Post
        </button>
      </div>

      <p className="text-sm text-gray-500">
        Share daily updates, spiritual thoughts, mantras, or announcements with your devotees.
      </p>

      {posts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <Send className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-400 mb-4">No posts yet</p>
          <button onClick={() => setShowModal(true)} className="text-saffron hover:underline">
            Share your first update
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex justify-between items-start mb-3">
                <p className="text-xs text-gray-400">
                  {new Date(post.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
                <button onClick={() => deletePost(post.id)} className="text-gray-400 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
              
              {post.image_url && (
                <img src={post.image_url} alt="Post" className="mt-3 rounded-lg max-h-60 object-cover" />
              )}
              
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
                <span className="flex items-center gap-1 text-sm text-gray-500">
                  <Heart className="w-4 h-4" /> {post.likes || 0} likes
                </span>
                <span className="flex items-center gap-1 text-sm text-gray-500">
                  <MessageCircle className="w-4 h-4" /> {post.comments || 0} comments
                </span>
                <span className="flex items-center gap-1 text-sm text-gray-500">
                  <Eye className="w-4 h-4" /> {post.views || 0} views
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Post Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
                <h2 className="font-cinzel text-lg font-semibold text-maroon">Create Post</h2>
                <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-4 space-y-4">
                <textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  placeholder="Share spiritual thoughts, daily mantras, or announcements..."
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50 resize-none"
                />
                
                {/* Image Upload Section */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Add Image (optional)</label>
                  
                  {/* Hidden file input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                  />
                  
                  {/* Image Preview or Upload Button */}
                  {imagePreview || newPost.image_url ? (
                    <div className="relative">
                      <img 
                        src={imagePreview || newPost.image_url} 
                        alt="Preview" 
                        className="w-full h-48 object-cover rounded-xl border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      {uploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
                          <Loader2 className="w-8 h-8 text-white animate-spin" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-saffron hover:bg-orange-50 transition-colors flex flex-col items-center gap-2 text-gray-500"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-8 h-8 animate-spin text-saffron" />
                          <span className="text-sm">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Camera className="w-8 h-8 text-gray-400" />
                          <span className="text-sm">Click to upload image</span>
                          <span className="text-xs text-gray-400">JPEG, PNG, GIF, WebP (max 5MB)</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
              
              <div className="p-4 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white">
                <button onClick={closeModal} className="px-4 py-2 text-gray-600">
                  Cancel
                </button>
                <button
                  onClick={createPost}
                  disabled={saving || uploading}
                  className="px-6 py-2 bg-saffron text-white rounded-xl disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Post
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { PostsTab };
