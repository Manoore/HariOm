import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, Loader2, X, Video, Play, Square, Eye, Users, Clock, Calendar } from 'lucide-react';
import api from '../../../../lib/api';
import { toast } from 'sonner';

function StreamsTab({ streams, onRefresh }) {
  const [showModal, setShowModal] = useState(false);
  const [editingStream, setEditingStream] = useState(null);
  const scheduled = streams.filter(s => s.status === 'scheduled');
  const live = streams.filter(s => s.status === 'live');
  const past = streams.filter(s => s.status === 'ended');

  const handleScheduleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingStream(null);
    setShowModal(true);
  };

  const handleEditStream = (stream) => {
    setEditingStream(stream);
    setShowModal(true);
  };

  const deleteStream = async (streamId) => {
    if (!window.confirm('Delete this scheduled stream?')) return;
    try {
      await api.delete(`/api/priest/streams/${streamId}`);
      toast.success('Stream deleted');
      onRefresh();
    } catch (error) {
      toast.error('Failed to delete stream');
    }
  };

  const startStream = async (streamId) => {
    try {
      await api.put(`/api/priest/streams/${streamId}/start`);
      toast.success('Stream started! You are now live.');
      onRefresh();
    } catch (error) {
      toast.error('Failed to start stream');
    }
  };

  const endStream = async (streamId) => {
    if (!window.confirm('End this stream?')) return;
    try {
      await api.put(`/api/priest/streams/${streamId}/end`);
      toast.success('Stream ended');
      onRefresh();
    } catch (error) {
      toast.error('Failed to end stream');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-cinzel text-lg font-semibold text-maroon">Live Streams</h2>
        <button 
          type="button"
          data-testid="schedule-stream-btn"
          onClick={handleScheduleClick}
          onTouchEnd={handleScheduleClick}
          style={{ pointerEvents: 'auto', touchAction: 'manipulation' }}
          className="flex items-center gap-2 bg-saffron text-white px-4 py-2 rounded-lg text-sm hover:bg-saffron/90 active:scale-95 transition-all cursor-pointer select-none"
        >
          <Plus className="w-4 h-4" /> Schedule
        </button>
      </div>

      {live.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <h3 className="font-semibold text-red-700 flex items-center gap-2 mb-3">
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>Live Now
          </h3>
          {live.map(s => (
            <div key={s.id} className="bg-white rounded-xl p-3 flex justify-between items-center">
              <div>
                <p className="font-medium">{s.title}</p>
                <p className="text-sm text-gray-500">{s.viewer_count || 0} watching</p>
              </div>
              <button onClick={() => endStream(s.id)} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm flex items-center gap-1">
                <Square className="w-4 h-4" /> End
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl p-4">
        <h3 className="font-semibold mb-3">Scheduled ({scheduled.length})</h3>
        {scheduled.length === 0 ? (
          <p className="text-center text-gray-400 py-4">No scheduled streams</p>
        ) : (
          <div className="space-y-2">
            {scheduled.map(s => (
              <div key={s.id} className="flex justify-between items-center p-3 border border-gray-100 rounded-xl">
                <div>
                  <p className="font-medium">{s.title}</p>
                  <p className="text-xs text-gray-400">{new Date(s.scheduled_time).toLocaleString()}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{s.stream_type}</span>
                    {s.youtube_url && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Play className="w-3 h-3" /> YouTube
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleEditStream(s)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <Edit className="w-4 h-4 text-gray-500" />
                  </button>
                  <button onClick={() => deleteStream(s.id)} className="p-2 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                  <button onClick={() => startStream(s.id)} className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm flex items-center gap-1">
                    <Play className="w-4 h-4" /> Go Live
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {past.length > 0 && (
        <div className="bg-white rounded-xl p-4">
          <h3 className="font-semibold mb-3">Past Streams ({past.length})</h3>
          <div className="space-y-2">
            {past.slice(0, 5).map(s => (
              <div key={s.id} className="p-3 border border-gray-100 rounded-xl">
                <p className="font-medium">{s.title}</p>
                <div className="flex gap-3 text-xs text-gray-400 mt-1">
                  <span>{new Date(s.ended_at).toLocaleDateString()}</span>
                  <span>{s.max_viewers || 0} max viewers</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <StreamModal 
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingStream(null); }}
        editData={editingStream}
        onSuccess={onRefresh}
      />
    </div>
  );
}

// Stream Modal Component
function StreamModal({ isOpen, onClose, editData, onSuccess }) {
  const [form, setForm] = useState({
    title: '', description: '', stream_type: 'puja', scheduled_time: '', youtube_url: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        // Editing existing stream
        const scheduledTime = editData.scheduled_time ? new Date(editData.scheduled_time).toISOString().slice(0, 16) : '';
        setForm({
          title: editData.title || '',
          description: editData.description || '',
          stream_type: editData.stream_type || 'puja',
          scheduled_time: scheduledTime,
          youtube_url: editData.youtube_url || ''
        });
      } else {
        // Set default scheduled time to 1 hour from now
        const defaultTime = new Date();
        defaultTime.setHours(defaultTime.getHours() + 1);
        setForm({
          title: '',
          description: '',
          stream_type: 'puja',
          scheduled_time: defaultTime.toISOString().slice(0, 16),
          youtube_url: ''
        });
      }
    }
  }, [isOpen, editData]);

  const handleSubmit = async () => {
    if (!form.title) { toast.error('Enter stream title'); return; }
    if (!form.scheduled_time) { toast.error('Select schedule time'); return; }
    
    setSaving(true);
    try {
      const payload = {
        ...form,
        scheduled_time: new Date(form.scheduled_time).toISOString()
      };
      
      if (editData) {
        await api.put(`/api/priest/streams/${editData.id}`, payload);
        toast.success('Stream updated!');
      } else {
        await api.post('/api/priest/streams', payload);
        toast.success('Stream scheduled!');
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(editData ? 'Failed to update stream' : 'Failed to schedule stream');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white">
          <h2 className="font-cinzel text-lg font-semibold text-maroon">Schedule Live Stream</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stream Title*</label>
            <input 
              type="text" 
              value={form.title} 
              onChange={(e) => setForm({ ...form, title: e.target.value })} 
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50" 
              placeholder="e.g., Morning Aarti Live" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea 
              value={form.description} 
              onChange={(e) => setForm({ ...form, description: e.target.value })} 
              rows={2} 
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50" 
              placeholder="What will you stream?"
            />
          </div>

          {/* YouTube Live URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              YouTube Live URL
              <span className="text-gray-400 font-normal ml-1">(optional)</span>
            </label>
            <input 
              type="url" 
              value={form.youtube_url} 
              onChange={(e) => setForm({ ...form, youtube_url: e.target.value })} 
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50" 
              placeholder="https://youtube.com/live/..." 
            />
            <p className="text-xs text-gray-400 mt-1">
              Paste your YouTube Live stream URL. Devotees can watch directly in the app.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stream Type</label>
              <select 
                value={form.stream_type} 
                onChange={(e) => setForm({ ...form, stream_type: e.target.value })} 
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
              >
                <option value="puja">Pooja</option>
                <option value="aarti">Aarti</option>
                <option value="discourse">Discourse</option>
                <option value="class">Class</option>
                <option value="qa">Q&A Session</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Time*</label>
              <input 
                type="datetime-local" 
                value={form.scheduled_time} 
                onChange={(e) => setForm({ ...form, scheduled_time: e.target.value })} 
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50" 
              />
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t flex justify-end gap-3 sticky bottom-0 bg-white">
          <button onClick={onClose} className="px-4 py-2 text-gray-600">Cancel</button>
          <button 
            onClick={handleSubmit} 
            disabled={saving} 
            className="px-6 py-2 bg-saffron text-white rounded-xl disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
            {editData ? 'Update' : 'Schedule'} Stream
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export { StreamsTab, StreamModal };
