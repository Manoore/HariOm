import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Music, Plus, Search, Edit2, Trash2, Loader2, Check, X, Play, Pause } from 'lucide-react';
import api from '../../../../lib/api';
import { toast } from 'sonner';

export function AudioLibraryTab({ isDesktop }) {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({ title: '', search_query: '', category: 'ESSENTIAL DAILY MANTRAS' });
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  
  const [playingItem, setPlayingItem] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await api.get('/api/admin/audio-library');
      setItems(res.data.items || []);
      setCategories(res.data.categories || []);
    } catch (error) {
      toast.error('Failed to load audio library');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((e) => console.error('Auto-play failed:', e));
    }
  }, [audioUrl]);

  const handlePlayAudio = async (item) => {
    if (playingItem?.id === item.id && audioUrl) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    setPlayingItem(item);
    setAudioLoading(true);
    setAudioUrl(null);
    setIsPlaying(false);

    try {
      const res = await api.get(`/api/archive/play/${item.item_id}`);
      if (res.data.audio_url) {
        setAudioUrl(res.data.audio_url);
      } else {
        toast.error('No audio found for this item');
        setPlayingItem(null);
      }
    } catch (error) {
      toast.error('Failed to load audio');
      setPlayingItem(null);
    } finally {
      setAudioLoading(false);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setPlayingItem(null);
    setAudioUrl(null);
    setIsPlaying(false);
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.search_query.trim()) {
      toast.error('Title and search query are required');
      return;
    }
    setSaving(true);
    try {
      if (editingItem) {
        await api.put(`/api/admin/audio-library/${editingItem.id}`, form);
        toast.success('Audio item updated!');
      } else {
        await api.post('/api/admin/audio-library', form);
        toast.success('Audio item added!');
      }
      fetchItems();
      setShowModal(false);
      setEditingItem(null);
      setForm({ title: '', search_query: '', category: 'ESSENTIAL DAILY MANTRAS' });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this audio item?')) return;
    try {
      await api.delete(`/api/admin/audio-library/${id}`);
      toast.success('Audio item deleted!');
      fetchItems();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setForm({ title: item.title, search_query: item.search_query, category: item.category });
    setShowModal(true);
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.search_query.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedItems = filteredItems.reduce((acc, item) => {
    const cat = item.category || 'UNCATEGORIZED';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <div className={`${isDesktop ? 'px-8 pb-8' : 'px-4 pb-24'}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pt-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Audio Library Management</h2>
          <p className="text-gray-500 text-sm">Manage mantras and shlokas for the music player</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setEditingItem(null); setForm({ title: '', search_query: '', category: 'ESSENTIAL DAILY MANTRAS' }); }}
          className="flex items-center gap-2 px-4 py-2 bg-saffron text-white rounded-xl hover:bg-saffron-dark transition-colors"
          data-testid="add-audio-btn"
        >
          <Plus className="w-4 h-4" />
          Add Audio Item
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title or query..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50 bg-white"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-orange-100">
          <p className="text-gray-500 text-sm">Total Items</p>
          <p className="text-2xl font-bold text-gray-800">{items.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-orange-100">
          <p className="text-gray-500 text-sm">Categories</p>
          <p className="text-2xl font-bold text-gray-800">{Object.keys(groupedItems).length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-orange-100">
          <p className="text-gray-500 text-sm">Active</p>
          <p className="text-2xl font-bold text-green-600">{items.filter(i => i.is_active).length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-orange-100">
          <p className="text-gray-500 text-sm">Inactive</p>
          <p className="text-2xl font-bold text-red-500">{items.filter(i => !i.is_active).length}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-saffron" />
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedItems).sort().map(([category, categoryItems]) => (
            <div key={category} className="bg-white rounded-2xl shadow-sm border border-orange-100 p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Music className="w-5 h-5 text-saffron" />
                {category} ({categoryItems.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {categoryItems.map(item => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-3 rounded-xl ${
                      item.is_active ? 'bg-orange-50' : 'bg-red-50'
                    } ${playingItem?.id === item.id ? 'ring-2 ring-saffron' : ''}`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <button
                        onClick={() => handlePlayAudio(item)}
                        disabled={audioLoading && playingItem?.id === item.id}
                        className={`p-2 rounded-full transition-all ${
                          playingItem?.id === item.id && isPlaying
                            ? 'bg-saffron text-white'
                            : 'bg-white text-saffron hover:bg-saffron hover:text-white'
                        } shadow-sm`}
                      >
                        {audioLoading && playingItem?.id === item.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : playingItem?.id === item.id && isPlaying ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate ${item.is_active ? 'text-gray-800' : 'text-red-400'}`}>
                          {item.title}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{item.search_query}</p>
                        {!item.is_active && <span className="text-xs text-red-500">Inactive</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-1.5 hover:bg-orange-100 rounded-lg text-gray-500 hover:text-saffron-dark transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 hover:bg-red-100 rounded-lg text-gray-500 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          onError={() => {
            toast.error('Failed to play audio');
            setIsPlaying(false);
          }}
          data-testid="audio-player"
        />
      )}

      {playingItem && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-xl border border-orange-200 p-3 flex items-center gap-4 z-40 max-w-md w-[90%]">
          <button
            onClick={() => {
              if (isPlaying) {
                audioRef.current?.pause();
                setIsPlaying(false);
              } else {
                audioRef.current?.play();
                setIsPlaying(true);
              }
            }}
            className="p-3 bg-saffron text-white rounded-full"
          >
            {audioLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-800 truncate">{playingItem.title}</p>
            <p className="text-xs text-gray-500 truncate">{playingItem.category}</p>
          </div>
          <button onClick={stopAudio} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-md w-full shadow-xl"
          >
            <div className="p-4 border-b border-orange-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                {editingItem ? 'Edit Audio Item' : 'Add Audio Item'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-orange-50 rounded-lg text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title*</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-2 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
                  placeholder="e.g., Gayatri Mantra"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search Query*</label>
                <input
                  type="text"
                  value={form.search_query}
                  onChange={(e) => setForm({ ...form, search_query: e.target.value })}
                  className="w-full px-4 py-2 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
                  placeholder="e.g., gayatri mantra chanting"
                />
                <p className="text-xs text-gray-500 mt-1">Used to search Internet Archive for audio</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-4 py-2 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50 bg-white"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-4 border-t border-orange-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-500 hover:text-gray-700">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-6 py-2 bg-saffron text-white rounded-xl disabled:opacity-50 flex items-center gap-2 hover:bg-saffron-dark transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {editingItem ? 'Update' : 'Add'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
