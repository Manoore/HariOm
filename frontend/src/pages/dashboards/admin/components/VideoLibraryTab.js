import React, { useState, useEffect } from 'react';
import { Play, Plus, Search, Edit2, Trash2, Loader2 } from 'lucide-react';
import api from '../../../../lib/api';
import { toast } from 'sonner';

const VIDEO_CATEGORIES = [
  { id: 'aarti', label: 'Aarti' },
  { id: 'bhajans', label: 'Bhajans' },
  { id: 'chalisas', label: 'Chalisas' },
  { id: 'kirtans', label: 'Kirtans' },
  { id: 'mantras', label: 'Mantras' },
  { id: 'spiritual_talks', label: 'Spiritual Talks' },
];

export function VideoLibraryTab({ isDesktop }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [form, setForm] = useState({ 
    title: '', 
    video_id: '', 
    artist: '', 
    duration: '',
    category: 'aarti' 
  });
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, title: '' });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const res = await api.get('/api/admin/video-library');
      setVideos(res.data.videos || []);
    } catch (error) {
      toast.error('Failed to load video library');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingVideo) {
        await api.put(`/api/admin/video-library/${editingVideo.id}`, form);
        toast.success('Video updated successfully');
      } else {
        await api.post('/api/admin/video-library', form);
        toast.success('Video added successfully');
      }
      setShowModal(false);
      setEditingVideo(null);
      setForm({ title: '', video_id: '', artist: '', duration: '', category: 'aarti' });
      fetchVideos();
    } catch (error) {
      toast.error('Failed to save video');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.id) return;
    setDeleting(true);
    try {
      await api.delete(`/api/admin/video-library/${deleteConfirm.id}`);
      toast.success('Video deleted');
      setDeleteConfirm({ show: false, id: null, title: '' });
      fetchVideos();
    } catch (error) {
      toast.error('Failed to delete video');
    } finally {
      setDeleting(false);
    }
  };

  const filteredVideos = videos.filter(v => {
    const matchesSearch = v.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          v.artist?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || v.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-saffron" />
      </div>
    );
  }

  return (
    <div className={isDesktop ? 'p-6' : 'px-4 pb-24'}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h2 className="font-cinzel text-2xl font-bold text-gray-800">Video Library Management</h2>
        <button
          onClick={() => {
            setEditingVideo(null);
            setForm({ title: '', video_id: '', artist: '', duration: '', category: 'aarti' });
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-saffron text-white px-4 py-2 rounded-xl hover:bg-saffron-dark transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Video
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search videos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-saffron/20 focus:border-saffron"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-saffron/20 focus:border-saffron"
        >
          <option value="">All Categories</option>
          {VIDEO_CATEGORIES.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.label}</option>
          ))}
        </select>
      </div>

      {/* Videos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVideos.map((video) => (
          <div key={video.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="aspect-video relative">
              <img
                src={`https://img.youtube.com/vi/${video.video_id}/mqdefault.jpg`}
                alt={video.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                {video.duration}
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-800 truncate">{video.title}</h3>
              <p className="text-sm text-gray-500">{video.artist}</p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full capitalize">
                  {video.category?.replace('_', ' ')}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingVideo(video);
                      setForm({
                        title: video.title,
                        video_id: video.video_id,
                        artist: video.artist || '',
                        duration: video.duration || '',
                        category: video.category
                      });
                      setShowModal(true);
                    }}
                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm({ show: true, id: video.id, title: video.title })}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredVideos.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No videos found</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <h3 className="font-cinzel text-xl font-bold text-gray-800">
                {editingVideo ? 'Edit Video' : 'Add New Video'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({...form, title: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-saffron/20 focus:border-saffron"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">YouTube Video ID</label>
                <input
                  type="text"
                  value={form.video_id}
                  onChange={(e) => setForm({...form, video_id: e.target.value})}
                  placeholder="e.g., AETFvQonfV8"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-saffron/20 focus:border-saffron"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Artist/Channel</label>
                <input
                  type="text"
                  value={form.artist}
                  onChange={(e) => setForm({...form, artist: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-saffron/20 focus:border-saffron"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                <input
                  type="text"
                  value={form.duration}
                  onChange={(e) => setForm({...form, duration: e.target.value})}
                  placeholder="e.g., 8:51"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-saffron/20 focus:border-saffron"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({...form, category: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-saffron/20 focus:border-saffron"
                >
                  {VIDEO_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-saffron text-white rounded-xl hover:bg-saffron-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingVideo ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="font-cinzel text-xl font-bold text-gray-800 mb-2">Delete Video</h3>
              <p className="text-gray-600 mb-2">Are you sure you want to delete this video?</p>
              <p className="text-sm font-medium text-maroon mb-6">"{deleteConfirm.title}"</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm({ show: false, id: null, title: '' })}
                  disabled={deleting}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
