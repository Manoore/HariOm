import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, Users, Clock, BookOpen, X, Loader2, Play, Square, Eye, Repeat, DollarSign, MapPin, Building2, IndianRupee, MessageCircle, Video, Save } from 'lucide-react';
import api from '../../../../lib/api';
import { toast } from 'sonner';
import { SCHEDULE_FREQUENCIES, DAYS } from './shared';
import { useConfirmDialog } from '../../../../components/ui/ConfirmDialog';

function ClassesTab({ classes, onRefresh }) {
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [activeView, setActiveView] = useState('myClasses');
  const [classRequests, setClassRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [creatingRoom, setCreatingRoom] = useState(null);
  const [joiningClass, setJoiningClass] = useState(null);
  const { confirm, ConfirmDialog } = useConfirmDialog();

  useEffect(() => {
    if (activeView === 'requests') {
      fetchClassRequests();
    }
  }, [activeView]);

  const fetchClassRequests = async () => {
    setLoadingRequests(true);
    try {
      const res = await api.get('/api/class-requests/all');
      setClassRequests(res.data.requests || []);
    } catch (error) {
      console.error('Error fetching class requests:', error);
    } finally {
      setLoadingRequests(false);
    }
  };

  const respondToRequest = async (requestId) => {
    try {
      await api.post(`/api/class-requests/${requestId}/respond`);
      toast.success('Interest submitted! The devotee will be notified.');
      fetchClassRequests();
    } catch (error) {
      toast.error('Failed to respond');
    }
  };

  const deleteClass = async (classId) => {
    const ok = await confirm({
      title: 'Delete Class?',
      message: 'This class and all its enrollments will be permanently removed.',
      confirmLabel: 'Delete',
      variant: 'danger'
    });
    if (!ok) return;
    try {
      await api.delete(`/api/priest/classes/${classId}`);
      toast.success('Class deleted');
      onRefresh();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  // Create 100ms room for class
  const createRoomForClass = async (classId) => {
    setCreatingRoom(classId);
    try {
      await api.post(`/api/priest/classes/${classId}/create-room`);
      toast.success('Room created! Students will be notified.');
      onRefresh();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create room');
    } finally {
      setCreatingRoom(null);
    }
  };

  // Join class as host
  const joinClassAsHost = async (classId) => {
    setJoiningClass(classId);
    try {
      const res = await api.get(`/api/priest/classes/${classId}/host-token`);
      // Open video room - for now, store in localStorage and redirect
      // In future, this could be an in-app component
      toast.success('Joining class...');
      // Store class info for the video room
      localStorage.setItem('divine_class_room', JSON.stringify({
        classId,
        roomId: res.data.room_id,
        token: res.data.token,
        title: res.data.class_title,
        isHost: true
      }));
      window.location.href = '/class-room';
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to join class');
    } finally {
      setJoiningClass(null);
    }
  };

  return (
    <div className="space-y-4">
      <ConfirmDialog />
      <div className="flex items-center justify-between">
        <h2 className="font-cinzel text-lg md:text-xl font-semibold text-maroon">Classes</h2>
        <button
          onClick={() => { setEditingClass(null); setShowModal(true); }}
          className="flex items-center gap-2 bg-saffron text-white px-4 py-2 rounded-lg text-sm"
        >
          <Plus className="w-4 h-4" /> Add Class
        </button>
      </div>

      {/* View Toggle */}
      <div className="flex bg-gray-100 rounded-xl p-1 max-w-md">
        <button
          onClick={() => setActiveView('myClasses')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all text-sm ${
            activeView === 'myClasses' ? 'bg-white text-maroon shadow-sm' : 'text-gray-600'
          }`}
        >
          My Classes ({classes.length})
        </button>
        <button
          onClick={() => setActiveView('requests')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all text-sm ${
            activeView === 'requests' ? 'bg-white text-maroon shadow-sm' : 'text-gray-600'
          }`}
        >
          Requests ({classRequests.length})
        </button>
      </div>

      {activeView === 'requests' ? (
        /* Class Requests from Devotees */
        loadingRequests ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-saffron" />
          </div>
        ) : classRequests.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400">No class requests from devotees yet</p>
            <p className="text-sm text-gray-400 mt-1">Requests will appear here when devotees ask for specific topics</p>
          </div>
        ) : (
          <div className="space-y-3">
            {classRequests.map((req) => (
              <div key={req.id} className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-blue-400">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{req.topic}</h3>
                    <p className="text-sm text-gray-500">Requested by: {req.user_name}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-xs bg-orange-50 text-saffron px-2 py-1 rounded-full">{req.category}</span>
                      <span className="text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded-full">{req.language}</span>
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">{req.preferred_time}</span>
                      <span className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded-full">
                        ₹{req.budget_min} - ₹{req.budget_max}
                      </span>
                      <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full">
                        {req.meeting_type === 'group' ? 'Group Class' : 'One-on-One'}
                      </span>
                      <span className="text-xs bg-cyan-50 text-cyan-600 px-2 py-1 rounded-full">
                        {req.frequency === 'once' ? 'One Time' : req.frequency === 'biweekly' ? 'Biweekly' : req.frequency === 'monthly' ? 'Monthly' : 'Weekly'}
                      </span>
                    </div>
                    {req.description && (
                      <p className="text-sm text-gray-600 mt-2">{req.description}</p>
                    )}
                    {req.preferred_days?.length > 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        Preferred days: {req.preferred_days.join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 ml-4">
                    <span className="text-xs text-gray-400">
                      {req.responses_count} interested
                    </span>
                    <button
                      onClick={() => respondToRequest(req.id)}
                      className="px-3 py-1.5 bg-saffron text-white text-sm rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      I'm Interested
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : classes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-400">No classes yet</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {classes.map((cls) => (
            <div key={cls.id} className={`rounded-xl shadow-sm p-4 border-l-4 ${
              cls.is_free || cls.price === 0 
                ? 'bg-green-50 border-green-500' 
                : cls.room_id 
                  ? 'bg-white border-green-500' 
                  : 'bg-white border-saffron'
            }`}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-gray-800">{cls.title}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{cls.category}</span>
                    {cls.is_free || cls.price === 0 ? (
                      <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-medium">FREE</span>
                    ) : (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">₹{cls.price}</span>
                    )}
                    {cls.room_id && !(cls.is_free || cls.price === 0) && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Video className="w-3 h-3" /> Room Ready
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditingClass(cls); setShowModal(true); }} className="p-1.5 hover:bg-gray-100 rounded">
                    <Edit className="w-4 h-4 text-gray-500" />
                  </button>
                  <button onClick={() => deleteClass(cls.id)} className="p-1.5 hover:bg-red-50 rounded">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
              
              <p className="text-sm text-gray-500 mb-2 line-clamp-2">{cls.description}</p>
              
              <div className="flex flex-wrap gap-2 text-xs md:text-sm">
                <span className="flex items-center gap-1 text-gray-600">
                  <Clock className="w-3 h-3" /> {cls.duration_minutes} min
                </span>
                <span className={`flex items-center gap-1 ${(cls.available_slots || (cls.max_students - (cls.enrolled_count || 0))) <= 3 ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                  <Users className="w-3 h-3" /> {cls.enrolled_count || 0}/{cls.max_students} enrolled
                </span>
              </div>
              
              {/* Show remaining slots */}
              <div className="mt-2 text-xs text-gray-500">
                {(cls.available_slots || (cls.max_students - (cls.enrolled_count || 0))) > 0 
                  ? `${cls.available_slots || (cls.max_students - (cls.enrolled_count || 0))} slots available`
                  : <span className="text-red-500 font-medium">Class Full</span>
                }
              </div>
              
              {cls.frequency && cls.frequency !== 'once' && (
                <div className="mt-2 flex items-center gap-1 text-xs text-blue-600">
                  <Repeat className="w-3 h-3" />
                  {cls.frequency === 'daily' && 'Daily'}
                  {cls.frequency === 'weekly' && `Every ${cls.schedule_day || 'week'}`}
                  {cls.frequency === 'biweekly' && 'Bi-weekly'}
                  {cls.frequency === 'monthly' && 'Monthly'}
                  {(cls.start_time || cls.schedule_time) && (
                    <span className="ml-1 text-gray-500">
                      {cls.start_time || cls.schedule_time}{cls.end_time ? ` - ${cls.end_time}` : ''}
                    </span>
                  )}
                </div>
              )}

              {/* Room Actions - Only for PAID classes */}
              {(cls.enrolled_count || 0) > 0 && !(cls.is_free || cls.price === 0) && (
                <div className="mt-3 pt-3 border-t flex gap-2">
                  {!cls.room_id ? (
                    <button
                      onClick={() => createRoomForClass(cls.id)}
                      disabled={creatingRoom === cls.id}
                      className="flex-1 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {creatingRoom === cls.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Video className="w-4 h-4" />
                      )}
                      Create Room
                    </button>
                  ) : (
                    <button
                      onClick={() => joinClassAsHost(cls.id)}
                      disabled={joiningClass === cls.id}
                      className="flex-1 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {joiningClass === cls.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                      Start Teaching
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ClassModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingClass(null); }}
        editData={editingClass}
        onSuccess={onRefresh}
      />
    </div>
  );
}

// ==================== CLASS MODAL with Schedule Options ====================
function ClassModal({ isOpen, onClose, editData, onSuccess }) {
  const [form, setForm] = useState({
    title: '', description: '', class_type: 'online', duration_minutes: 60,
    is_free: false, price: 500, max_students: 20, category: 'General',
    frequency: 'weekly', schedule_day: 'Monday', start_time: '10:00', end_time: '11:00',
    meeting_link: '', location_type: 'online', temple_name: ''
  });
  const [saving, setSaving] = useState(false);

  const locationTypes = [
    { value: 'online', label: 'Online', description: 'Via video call' },
    { value: 'home_visit', label: 'Home Visit', description: 'At devotee\'s home' },
    { value: 'temple', label: 'Temple', description: 'At a temple venue' }
  ];

  useEffect(() => {
    if (editData) {
      setForm({
        ...editData,
        is_free: editData.is_free || editData.price === 0,
        frequency: editData.frequency || 'weekly',
        schedule_day: editData.schedule_day || 'Monday',
        start_time: editData.start_time || editData.schedule_time || '10:00',
        end_time: editData.end_time || '11:00',
        meeting_link: editData.meeting_link || '',
        location_type: editData.location_type || 'online',
        temple_name: editData.temple_name || ''
      });
    } else {
      setForm({
        title: '', description: '', class_type: 'online', duration_minutes: 60,
        is_free: false, price: 500, max_students: 20, category: 'General',
        frequency: 'weekly', schedule_day: 'Monday', start_time: '10:00', end_time: '11:00',
        meeting_link: '', location_type: 'online', temple_name: ''
      });
    }
  }, [editData, isOpen]);

  const handleSubmit = async () => {
    if (!form.title) { toast.error('Enter class title'); return; }
    
    // If free, set price to 0
    const submitData = { ...form };
    if (submitData.is_free) {
      submitData.price = 0;
    }
    
    setSaving(true);
    try {
      if (editData) await api.put(`/api/priest/classes/${editData.id}`, submitData);
      else await api.post('/api/priest/classes', submitData);
      toast.success(editData ? 'Updated!' : 'Created!');
      onSuccess(); onClose();
    } catch { toast.error('Failed'); }
    finally { setSaving(false); }
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
          <h2 className="font-cinzel text-lg font-semibold text-maroon">{editData ? 'Edit Class' : 'New Class'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title*</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl" placeholder="e.g., Sanskrit for Beginners" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-4 py-2 border border-gray-200 rounded-xl" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl">
                <option>General</option>
                <option>Vedic Chanting</option>
                <option>Sanskrit</option>
                <option>Puja Rituals</option>
                <option>Meditation</option>
                <option>Philosophy</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={form.class_type} onChange={(e) => setForm({ ...form, class_type: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl">
                <option value="online">Online</option>
                <option value="offline">In-person</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>
          
          {/* Free/Paid Toggle */}
          <div className="bg-orange-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-gray-700">Class Pricing</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_free}
                  onChange={(e) => setForm({ ...form, is_free: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                <span className="ml-2 text-sm font-medium text-gray-700">
                  {form.is_free ? 'FREE' : 'PAID'}
                </span>
              </label>
            </div>
            
            {!form.is_free && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                  min="1"
                />
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
              <input type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) })} className="w-full px-4 py-2 border border-gray-200 rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Students (Slots)</label>
              <input type="number" value={form.max_students} onChange={(e) => setForm({ ...form, max_students: parseInt(e.target.value) })} className="w-full px-4 py-2 border border-gray-200 rounded-xl" min="1" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Link (Zoom/Google Meet)</label>
            <input type="url" value={form.meeting_link} onChange={(e) => setForm({ ...form, meeting_link: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl" placeholder="https://zoom.us/j/..." />
          </div>
          
          {/* Location Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Class Location*</label>
            <div className="grid grid-cols-3 gap-2">
              {locationTypes.map(loc => (
                <button
                  key={loc.value}
                  type="button"
                  onClick={() => setForm({ ...form, location_type: loc.value })}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    form.location_type === loc.value
                      ? 'border-saffron bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  data-testid={`class-location-${loc.value}`}
                >
                  <div className="font-medium text-sm text-gray-800">{loc.label}</div>
                  <div className="text-xs text-gray-500">{loc.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Temple Name - only show if location_type is temple */}
          {form.location_type === 'temple' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Temple Name*</label>
              <input 
                type="text" 
                value={form.temple_name} 
                onChange={(e) => setForm({ ...form, temple_name: e.target.value })} 
                className="w-full px-4 py-2 border border-gray-200 rounded-xl" 
                placeholder="Enter temple name where class is held"
                data-testid="class-temple-name"
              />
            </div>
          )}
          
          {/* Schedule Section */}
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
              <Repeat className="w-4 h-4 text-saffron" /> Schedule
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl">
                  {SCHEDULE_FREQUENCIES.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
              
              {(form.frequency === 'weekly' || form.frequency === 'biweekly') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
                  <select value={form.schedule_day} onChange={(e) => setForm({ ...form, schedule_day: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl">
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl" data-testid="class-start-time" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl" data-testid="class-end-time" />
              </div>
            </div>
          </div>
          
          {/* Show enrolled count if editing */}
          {editData && editData.enrolled_count > 0 && (
            <div className="bg-blue-50 rounded-xl p-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-700">
                {editData.enrolled_count} student(s) enrolled • {(editData.max_students || 20) - (editData.enrolled_count || 0)} slots remaining
              </span>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t flex justify-end gap-3 sticky bottom-0 bg-white">
          <button onClick={onClose} className="px-4 py-2 text-gray-600">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="px-6 py-2 bg-saffron text-white rounded-xl disabled:opacity-50 flex items-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {editData ? 'Update' : 'Create'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}


export { ClassesTab, ClassModal };
