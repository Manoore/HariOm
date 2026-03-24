import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Calendar, Clock, Users, Star, Loader2, 
  X, MessageSquare, Video, Play, Send, Plus, CheckCircle
} from 'lucide-react';
import { useAuth } from '../../../../contexts/AuthContext';
import api from '../../../../lib/api';
import { toast } from 'sonner';

// Import separate components
import { ClassVideoRoom } from './ClassVideoRoom';
import { TestimonialSection } from './TestimonialSection';

// SmartPayment component placeholder (actual implementation in main codebase)
const SmartPayment = ({ amount, onSuccess, onCancel, metadata }) => {
  return (
    <div className="text-center py-8">
      <p className="text-gray-600">Processing payment of ₹{amount}...</p>
      <div className="flex gap-4 justify-center mt-4">
        <button onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
        <button onClick={() => onSuccess({ id: 'mock_payment' })} className="px-4 py-2 bg-saffron text-white rounded-lg">Pay Now</button>
      </div>
    </div>
  );
};

// Class Request Form Component
function ClassRequestForm({ 
  requestForm, 
  setRequestForm, 
  onSubmit, 
  onClose, 
  submitting,
  categories,
  days,
  timeSlots,
  durations,
  languages,
  meetingTypes,
  frequencies
}) {
  const toggleDay = (day) => {
    setRequestForm(prev => ({
      ...prev,
      preferred_days: prev.preferred_days.includes(day)
        ? prev.preferred_days.filter(d => d !== day)
        : [...prev.preferred_days, day]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="font-cinzel text-xl font-bold text-maroon">Request a Class</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {/* Topic */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">What do you want to learn? *</label>
            <input
              type="text"
              value={requestForm.topic}
              onChange={(e) => setRequestForm({...requestForm, topic: e.target.value})}
              placeholder="e.g., Bhagavad Gita, Sanskrit basics, Puja vidhi"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={requestForm.category}
              onChange={(e) => setRequestForm({...requestForm, category: e.target.value})}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron"
            >
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Additional Details</label>
            <textarea
              value={requestForm.description}
              onChange={(e) => setRequestForm({...requestForm, description: e.target.value})}
              placeholder="Any specific requirements or goals..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron"
            />
          </div>

          {/* Preferred Days */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Days</label>
            <div className="flex flex-wrap gap-2">
              {days.map(day => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    requestForm.preferred_days.includes(day)
                      ? 'bg-saffron text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          {/* Preferred Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Time</label>
            <select
              value={requestForm.preferred_time}
              onChange={(e) => setRequestForm({...requestForm, preferred_time: e.target.value})}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron"
            >
              {timeSlots.map(time => <option key={time} value={time}>{time}</option>)}
            </select>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class Duration</label>
            <select
              value={requestForm.duration_preference}
              onChange={(e) => setRequestForm({...requestForm, duration_preference: e.target.value})}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron"
            >
              {durations.map(dur => <option key={dur} value={dur}>{dur}</option>)}
            </select>
          </div>

          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Language</label>
            <select
              value={requestForm.language}
              onChange={(e) => setRequestForm({...requestForm, language: e.target.value})}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron"
            >
              {languages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
            </select>
          </div>

          {/* Budget Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Budget Range (per class)</label>
            <div className="flex gap-3 items-center">
              <div className="flex-1">
                <span className="text-xs text-gray-500">Min</span>
                <input
                  type="number"
                  value={requestForm.budget_min}
                  onChange={(e) => setRequestForm({...requestForm, budget_min: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-saffron"
                />
              </div>
              <span className="text-gray-400">to</span>
              <div className="flex-1">
                <span className="text-xs text-gray-500">Max</span>
                <input
                  type="number"
                  value={requestForm.budget_max}
                  onChange={(e) => setRequestForm({...requestForm, budget_max: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-saffron"
                />
              </div>
            </div>
          </div>

          {/* Meeting Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Type</label>
            <div className="grid grid-cols-2 gap-3">
              {meetingTypes.map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setRequestForm({...requestForm, meeting_type: type.value})}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    requestForm.meeting_type === type.value
                      ? 'border-saffron bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  data-testid={`meeting-type-${type.value}`}
                >
                  <div className="font-medium text-sm text-gray-800">{type.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{type.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class Frequency</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {frequencies.map(freq => (
                <button
                  key={freq.value}
                  type="button"
                  onClick={() => setRequestForm({...requestForm, frequency: freq.value})}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    requestForm.frequency === freq.value
                      ? 'border-saffron bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  data-testid={`frequency-${freq.value}`}
                >
                  <div className="font-medium text-sm text-gray-800">{freq.label}</div>
                  <div className="text-xs text-gray-500">{freq.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={onSubmit}
            disabled={submitting || !requestForm.topic.trim()}
            className="w-full py-4 bg-saffron text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Submit Request
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Class Card Component
function ClassCard({ cls, isEnrolled, onEnroll, enrolling, formatDate }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl shadow-sm overflow-hidden ${
        cls.is_free 
          ? 'bg-green-100 border-2 border-green-400' 
          : 'bg-white border border-orange-100'
      }`}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
              cls.is_free 
                ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                : 'bg-gradient-to-br from-saffron to-gold'
            }`}>
              {cls.priest_name?.charAt(0) || 'P'}
            </div>
            <div>
              <p className="text-sm text-gray-600">{cls.priest_name}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                cls.is_free 
                  ? 'bg-green-200 text-green-800' 
                  : 'bg-orange-100 text-saffron'
              }`}>
                {cls.category || 'General'}
              </span>
            </div>
          </div>
          {cls.is_free ? (
            <span className="text-sm px-3 py-1 bg-green-500 text-white rounded-full font-bold">FREE</span>
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
          {isEnrolled ? (
            <span className="px-4 py-2 bg-green-100 text-green-700 rounded-xl text-sm font-medium flex items-center gap-1">
              <CheckCircle className="w-4 h-4" /> Enrolled
            </span>
          ) : cls.available_slots <= 0 ? (
            <span className="px-4 py-2 bg-gray-100 text-gray-500 rounded-xl text-sm font-medium">
              Class Full
            </span>
          ) : (
            <button
              onClick={() => onEnroll(cls)}
              disabled={enrolling === cls.id}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-1 ${
                cls.is_free 
                  ? 'bg-green-500 text-white hover:bg-green-600' 
                  : 'bg-saffron text-white hover:bg-saffron-dark'
              }`}
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
  );
}

// Classes Tab - Browse and enroll in Vedic classes
function ClassesTab({ isDesktop }) {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [myEnrollments, setMyEnrollments] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('browse'); // 'browse', 'enrolled', 'requests'
  const [enrolling, setEnrolling] = useState(null);
  const [paymentModal, setPaymentModal] = useState(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestForm, setRequestForm] = useState({
    topic: '',
    category: 'Vedic Studies',
    description: '',
    preferred_days: [],
    preferred_time: 'Morning',
    budget_min: 500,
    budget_max: 2000,
    language: 'Hindi',
    duration_preference: '1 hour',
    meeting_type: 'one_on_one',
    frequency: 'weekly'
  });

  // Configuration options
  const categories = ['Vedic Studies', 'Sanskrit', 'Puja Rituals', 'Astrology', 'Yoga & Meditation', 'Scriptures', 'Mantras', 'Other'];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const timeSlots = ['Early Morning (5-7 AM)', 'Morning (7-10 AM)', 'Afternoon (12-3 PM)', 'Evening (5-8 PM)', 'Night (8-10 PM)'];
  const durations = ['30 minutes', '45 minutes', '1 hour', '1.5 hours', '2 hours'];
  const languages = ['Hindi', 'Sanskrit', 'English', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Marathi'];
  const meetingTypes = [
    { value: 'one_on_one', label: 'One-on-One (Private)', description: 'Personal session with the teacher' },
    { value: 'group', label: 'Group Class', description: 'Learn with other students' }
  ];
  const frequencies = [
    { value: 'once', label: 'One Time', description: 'Single session' },
    { value: 'weekly', label: 'Weekly', description: 'Once a week' },
    { value: 'biweekly', label: 'Biweekly', description: 'Every two weeks' },
    { value: 'monthly', label: 'Monthly', description: 'Once a month' }
  ];

  // State for video class room
  const [classRoom, setClassRoom] = useState(null);
  
  // States for interested priests modal
  const [viewingPriests, setViewingPriests] = useState(null);
  const [interestedPriests, setInterestedPriests] = useState([]);
  const [loadingPriests, setLoadingPriests] = useState(false);
  const [acceptingPriest, setAcceptingPriest] = useState(null);

  useEffect(() => {
    fetchClasses();
    fetchMyEnrollments();
    fetchMyRequests();
  }, []);

  // Handler to join class video room
  const handleJoinClass = async (classId) => {
    try {
      const res = await api.get(`/api/classes/${classId}/join`);
      setClassRoom({
        classId,
        roomId: res.data.room_id,
        token: res.data.token,
        classTitle: res.data.class_title,
        priestName: res.data.priest_name
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to join class');
    }
  };

  // If in a class room, show the video component
  if (classRoom) {
    return (
      <ClassVideoRoom
        roomId={classRoom.roomId}
        token={classRoom.token}
        classTitle={classRoom.classTitle}
        priestName={classRoom.priestName}
        onLeave={() => {
          setClassRoom(null);
          fetchMyEnrollments();
        }}
      />
    );
  }

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

  const fetchMyRequests = async () => {
    try {
      const res = await api.get('/api/class-requests');
      setMyRequests(res.data.requests || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const handleSubmitRequest = async () => {
    if (!requestForm.topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }
    setSubmittingRequest(true);
    try {
      await api.post('/api/class-requests', requestForm);
      toast.success('Class request submitted! Priests will be notified.');
      setShowRequestForm(false);
      setRequestForm({
        topic: '',
        category: 'Vedic Studies',
        description: '',
        preferred_days: [],
        preferred_time: 'Morning',
        budget_min: 500,
        budget_max: 2000,
        language: 'Hindi',
        duration_preference: '1 hour',
        meeting_type: 'one_on_one',
        frequency: 'weekly'
      });
      fetchMyRequests();
    } catch (error) {
      toast.error('Failed to submit request');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleCancelRequest = async (requestId) => {
    try {
      await api.delete(`/api/class-requests/${requestId}`);
      toast.success('Request cancelled');
      fetchMyRequests();
    } catch (error) {
      toast.error('Failed to cancel request');
    }
  };

  const viewInterestedPriests = async (request) => {
    setViewingPriests(request);
    setLoadingPriests(true);
    try {
      const res = await api.get(`/api/class-requests/${request.id}/interested-priests`);
      setInterestedPriests(res.data.priests || []);
    } catch (error) {
      toast.error('Failed to load interested priests');
    } finally {
      setLoadingPriests(false);
    }
  };

  const acceptPriest = async (requestId, priestId) => {
    setAcceptingPriest(priestId);
    try {
      const res = await api.post(`/api/class-requests/${requestId}/accept/${priestId}`);
      toast.success(res.data.message || 'Priest accepted! Class created.');
      setViewingPriests(null);
      setInterestedPriests([]);
      fetchMyRequests();
      fetchMyEnrollments();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to accept priest');
    } finally {
      setAcceptingPriest(null);
    }
  };

  const handleEnroll = async (cls) => {
    setEnrolling(cls.id);
    try {
      const res = await api.post(`/api/classes/${cls.id}/enroll`);
      
      if (res.data.requires_payment) {
        setPaymentModal({
          classId: cls.id,
          className: cls.title,
          price: res.data.price,
          priceBreakdown: res.data.price_breakdown,
          clientSecret: res.data.client_secret,
          paymentIntentId: res.data.payment_intent_id
        });
      } else {
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
    <div className="min-h-screen bg-gradient-to-b from-cream to-parchment pb-20 lg:pb-0">
      <div className="p-4 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-cinzel text-2xl lg:text-3xl font-bold text-maroon">Vedic Classes</h1>
            <p className="text-gray-600 text-sm mt-1">Learn from experienced priests and scholars</p>
          </div>
          <button
            onClick={() => setShowRequestForm(true)}
            className="flex items-center gap-2 bg-saffron text-white px-4 py-2 rounded-xl font-medium hover:bg-orange-600 transition-colors"
            data-testid="request-class-btn"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Request Class</span>
          </button>
        </div>

        {/* View Toggle */}
        <div className="flex bg-white rounded-xl p-1 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveView('browse')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeView === 'browse' ? 'bg-saffron text-white' : 'text-gray-600'
            }`}
          >
            Browse
          </button>
          <button
            onClick={() => setActiveView('enrolled')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeView === 'enrolled' ? 'bg-saffron text-white' : 'text-gray-600'
            }`}
          >
            Enrolled ({myEnrollments.length})
          </button>
          <button
            onClick={() => setActiveView('requests')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeView === 'requests' ? 'bg-saffron text-white' : 'text-gray-600'
            }`}
          >
            My Requests ({myRequests.length})
          </button>
        </div>

        {/* Request Class Modal */}
        {showRequestForm && (
          <ClassRequestForm
            requestForm={requestForm}
            setRequestForm={setRequestForm}
            onSubmit={handleSubmitRequest}
            onClose={() => setShowRequestForm(false)}
            submitting={submittingRequest}
            categories={categories}
            days={days}
            timeSlots={timeSlots}
            durations={durations}
            languages={languages}
            meetingTypes={meetingTypes}
            frequencies={frequencies}
          />
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-saffron" />
          </div>
        ) : activeView === 'requests' ? (
          /* My Requests View */
          <>
          <div className="space-y-4">
            {myRequests.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No class requests yet</p>
                <p className="text-sm text-gray-400 mt-1">Click "Request Class" to ask for a specific topic</p>
              </div>
            ) : (
              myRequests.map(req => (
                <div key={req.id} className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{req.topic}</h3>
                      <p className="text-sm text-gray-500">{req.category} • {req.language}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-xs bg-orange-50 text-saffron px-2 py-1 rounded-full">
                          {req.preferred_time}
                        </span>
                        <span className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded-full">
                          ₹{req.budget_min} - ₹{req.budget_max}
                        </span>
                        <span className="text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded-full">
                          {req.meeting_type === 'group' ? 'Group Class' : 'One-on-One'}
                        </span>
                        <span className="text-xs bg-cyan-50 text-cyan-600 px-2 py-1 rounded-full">
                          {req.frequency === 'once' ? 'One Time' : req.frequency === 'biweekly' ? 'Biweekly' : req.frequency === 'monthly' ? 'Monthly' : 'Weekly'}
                        </span>
                        {req.responses_count > 0 && (
                          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                            {req.responses_count} priest(s) interested
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        req.status === 'open' ? 'bg-green-100 text-green-700' : 
                        req.status === 'matched' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </span>
                      {req.status === 'open' && req.responses_count > 0 && (
                        <button
                          onClick={() => viewInterestedPriests(req)}
                          className="text-xs bg-saffron text-white px-3 py-1.5 rounded-full hover:bg-orange-600 transition-colors"
                          data-testid={`view-priests-${req.id}`}
                        >
                          View Priests
                        </button>
                      )}
                      {req.status === 'open' && (
                        <button
                          onClick={() => handleCancelRequest(req.id)}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Interested Priests Modal */}
          {viewingPriests && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto"
              >
                <div className="p-4 border-b sticky top-0 bg-white flex items-center justify-between">
                  <div>
                    <h2 className="font-cinzel text-lg font-semibold text-maroon">Interested Priests</h2>
                    <p className="text-sm text-gray-500">{viewingPriests.topic}</p>
                  </div>
                  <button onClick={() => { setViewingPriests(null); setInterestedPriests([]); }} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-4">
                  {loadingPriests ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-saffron" />
                    </div>
                  ) : interestedPriests.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No priests have shown interest yet</p>
                  ) : (
                    <div className="space-y-4">
                      {interestedPriests.map(priest => (
                        <div key={priest.priest_id} className="border border-gray-200 rounded-xl p-4">
                          <div className="flex items-start gap-4">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-saffron to-orange-400 flex items-center justify-center text-white text-xl font-semibold overflow-hidden">
                              {priest.profile_photo ? (
                                <img src={priest.profile_photo} alt={priest.name} className="w-full h-full object-cover" />
                              ) : (
                                priest.name?.charAt(0) || 'P'
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-800">{priest.name}</h3>
                              <p className="text-sm text-gray-500">{priest.experience_years} years experience</p>
                              {priest.math_mutt && (
                                <p className="text-xs text-purple-600 mt-1">{priest.math_mutt}</p>
                              )}
                              {priest.specializations?.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {priest.specializations.slice(0, 3).map((spec, i) => (
                                    <span key={i} className="text-xs bg-orange-50 text-saffron px-2 py-0.5 rounded-full">{spec}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => acceptPriest(viewingPriests.id, priest.priest_id)}
                              disabled={acceptingPriest === priest.priest_id}
                              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-2 text-sm"
                              data-testid={`accept-priest-${priest.priest_id}`}
                            >
                              {acceptingPriest === priest.priest_id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCircle className="w-4 h-4" />
                              )}
                              Accept
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
          </>
        ) : activeView === 'browse' ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No classes available at the moment</p>
                <p className="text-sm text-gray-400 mt-1">Request a class topic you'd like to learn!</p>
                <button
                  onClick={() => setShowRequestForm(true)}
                  className="mt-4 px-6 py-2 bg-saffron text-white rounded-xl font-medium hover:bg-orange-600"
                >
                  Request a Class
                </button>
              </div>
            ) : (
              classes.map((cls) => (
                <ClassCard
                  key={cls.id}
                  cls={cls}
                  isEnrolled={isEnrolled(cls.id)}
                  onEnroll={handleEnroll}
                  enrolling={enrolling}
                  formatDate={formatDate}
                />
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
              myEnrollments.map((cls) => {
                const isFreeClass = cls.is_free || cls.price === 0;
                return (
                <motion.div
                  key={cls.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`rounded-xl p-4 shadow-sm border flex items-center justify-between ${
                    isFreeClass 
                      ? 'bg-green-50 border-green-300' 
                      : cls.is_starting_soon 
                        ? 'bg-green-50 border-green-300' 
                        : 'bg-white border-orange-100'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-800">{cls.title}</h3>
                      {isFreeClass && (
                        <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full font-medium">
                          FREE
                        </span>
                      )}
                      {cls.is_starting_soon && (
                        <span className="px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full animate-pulse">
                          Starting Soon!
                        </span>
                      )}
                    </div>
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
                  {/* For FREE classes - show meeting link button */}
                  {isFreeClass ? (
                    cls.meeting_link ? (
                      <a
                        href={cls.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition-colors flex items-center gap-2"
                      >
                        <Play className="w-4 h-4" /> Join Free Class
                      </a>
                    ) : (
                      <span className="px-4 py-2 bg-gray-100 text-gray-500 rounded-xl text-sm font-medium">
                        Link coming soon
                      </span>
                    )
                  ) : /* For PAID classes - show 100ms Join button */
                  cls.can_join ? (
                    <button
                      onClick={() => handleJoinClass(cls.id)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors flex items-center gap-2 animate-pulse"
                      data-testid={`join-class-${cls.id}`}
                    >
                      <Video className="w-4 h-4" /> Join Class
                    </button>
                  ) : cls.meeting_link ? (
                    <a
                      href={cls.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors flex items-center gap-2"
                    >
                      <Play className="w-4 h-4" /> External Link
                    </a>
                  ) : cls.is_starting_soon ? (
                    <span className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-xl text-sm font-medium">
                      Room preparing...
                    </span>
                  ) : null}
                </motion.div>
              )})
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
              {paymentModal.priceBreakdown ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Class Fee</span>
                    <span className="text-gray-800">₹{paymentModal.priceBreakdown.base_price}</span>
                  </div>
                  {paymentModal.priceBreakdown.platform_fee > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Platform Fee ({paymentModal.priceBreakdown.platform_fee_percent}%)</span>
                      <span className="text-gray-800">₹{paymentModal.priceBreakdown.platform_fee}</span>
                    </div>
                  )}
                  {paymentModal.priceBreakdown.gst > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">{paymentModal.priceBreakdown.tax_label || 'GST'} ({paymentModal.priceBreakdown.gst_percent}%)</span>
                      <span className="text-gray-800">₹{paymentModal.priceBreakdown.gst}</span>
                    </div>
                  )}
                  <div className="border-t border-orange-200 pt-2 mt-2 flex justify-between items-center">
                    <span className="font-semibold text-gray-700">Total</span>
                    <span className="text-xl font-bold text-maroon">₹{paymentModal.priceBreakdown.total}</span>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Class Fee</span>
                  <span className="text-xl font-bold text-maroon">₹{paymentModal.price}</span>
                </div>
              )}
            </div>

            <SmartPayment
              amount={paymentModal.price}
              clientSecret={paymentModal.clientSecret}
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

export { ClassesTab, TestimonialSection, ClassVideoRoom, ClassRequestForm, ClassCard };
