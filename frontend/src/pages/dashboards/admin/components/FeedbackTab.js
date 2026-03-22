import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, MessageSquare, Star, Loader2, Check, Trash2 } from 'lucide-react';
import api from '../../../../lib/api';
import { toast } from 'sonner';

export function FeedbackTab({ isDesktop }) {
  const [feedback, setFeedback] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('feedback');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [feedbackRes, testimonialsRes] = await Promise.all([
        api.get('/api/feedback').catch(() => ({ data: { feedback: [] } })),
        api.get('/api/testimonials?approved_only=false').catch(() => ({ data: { testimonials: [] } }))
      ]);
      setFeedback(feedbackRes.data.feedback || []);
      setTestimonials(testimonialsRes.data.testimonials || []);
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveTestimonial = async (id) => {
    try {
      await api.put(`/api/testimonials/${id}/approve`);
      toast.success('Testimonial approved!');
      fetchData();
    } catch (error) {
      toast.error('Failed to approve testimonial');
    }
  };

  const handleDeleteTestimonial = async (id) => {
    if (!window.confirm('Are you sure you want to delete this testimonial?')) return;
    try {
      await api.delete(`/api/testimonials/${id}`);
      toast.success('Testimonial deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete testimonial');
    }
  };

  return (
    <div className={`${isDesktop ? 'px-8' : 'px-4'} py-6`}>
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveSubTab('feedback')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeSubTab === 'feedback' 
              ? 'bg-saffron text-white' 
              : 'bg-white shadow-sm text-gray-600 hover:bg-orange-50'
          }`}
        >
          <Mail className="w-4 h-4 inline mr-2" />
          Feedback ({feedback.length})
        </button>
        <button
          onClick={() => setActiveSubTab('testimonials')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeSubTab === 'testimonials' 
              ? 'bg-saffron text-white' 
              : 'bg-white shadow-sm text-gray-600 hover:bg-orange-50'
          }`}
        >
          <MessageSquare className="w-4 h-4 inline mr-2" />
          Testimonials ({testimonials.length})
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-saffron" />
        </div>
      ) : activeSubTab === 'feedback' ? (
        <div className="space-y-4">
          {feedback.length === 0 ? (
            <div className="bg-white shadow-sm border border-orange-100 rounded-xl p-8 text-center">
              <Mail className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500">No feedback received yet</p>
            </div>
          ) : (
            feedback.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white shadow-sm border border-orange-100 rounded-xl p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-800">{item.name}</h4>
                    <p className="text-sm text-gray-500">{item.email}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-4 h-4 ${i < (item.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'}`} 
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-saffron font-medium mb-2">{item.subject}</p>
                <p className="text-gray-600">{item.message}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {new Date(item.created_at).toLocaleString()}
                </p>
              </motion.div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {testimonials.length === 0 ? (
            <div className="bg-white shadow-sm border border-orange-100 rounded-xl p-8 text-center">
              <MessageSquare className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500">No testimonials yet</p>
            </div>
          ) : (
            testimonials.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white shadow-sm border border-orange-100 rounded-xl p-4 border-l-4 ${
                  item.is_approved ? 'border-l-green-500' : 'border-l-yellow-500'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-800">{item.user_name}</h4>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded capitalize">
                      {item.user_role}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      item.is_approved 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {item.is_approved ? 'Approved' : 'Pending'}
                    </span>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${i < item.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'}`} 
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 mb-3">"{item.content}"</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    {new Date(item.created_at).toLocaleString()}
                  </p>
                  <div className="flex gap-2">
                    {!item.is_approved && (
                      <button
                        onClick={() => handleApproveTestimonial(item.id)}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200 transition-colors flex items-center gap-1"
                      >
                        <Check className="w-4 h-4" />
                        Approve
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteTestimonial(item.id)}
                      className="px-3 py-1 bg-red-100 text-red-600 rounded-lg text-sm hover:bg-red-200 transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
