import React, { useState } from 'react';
import { Star, MessageSquare, Loader2 } from 'lucide-react';
import { useAuth } from '../../../../contexts/AuthContext';
import api from '../../../../lib/api';
import { toast } from 'sonner';

export function TestimonialSection() {
  const { user } = useAuth();
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
      await api.post('/api/testimonials', {
        content,
        rating,
        user_role: user?.role || 'devotee'
      });
      toast.success('Thank you! Your testimonial has been submitted for review.');
      setContent('');
      setRating(5);
      setShowForm(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit testimonial');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-saffron/10 to-gold/10 rounded-2xl p-6 border border-saffron/20">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-saffron/20 rounded-full flex items-center justify-center flex-shrink-0">
          <MessageSquare className="w-6 h-6 text-saffron" />
        </div>
        <div className="flex-1">
          <h3 className="font-cinzel text-lg font-semibold text-maroon mb-1">
            Share Your Experience
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            Your feedback helps other devotees find the right spiritual guidance
          </p>
          
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-saffron text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
              data-testid="write-testimonial-btn"
            >
              Write a Testimonial
            </button>
          ) : (
            <div className="space-y-4">
              {/* Star Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Testimonial Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Experience</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron resize-none"
                  placeholder="Share how Divine App has helped you in your spiritual journey..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-6 py-2 bg-saffron text-white rounded-xl font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Testimonial'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
