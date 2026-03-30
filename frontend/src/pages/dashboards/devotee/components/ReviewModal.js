import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, X, Loader2, Check } from 'lucide-react';
import api from '../../../../lib/api';
import { toast } from 'sonner';

export function ReviewModal({ booking, onClose, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/api/bookings/${booking.id}/review`, { rating, review_text: comment });
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl max-w-md w-full shadow-xl"
      >
        <div className="p-4 border-b border-orange-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Write a Review</h2>
          <button onClick={onClose} className="p-2 hover:bg-orange-50 rounded-lg text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4">
          <div className="bg-orange-50 rounded-xl p-3 mb-4">
            <p className="font-medium text-gray-800">{booking.service_name}</p>
            <p className="text-sm text-gray-500">by {booking.priest_name}</p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star className={`w-8 h-8 ${star <= (hoverRating || rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Fair'}
              {rating === 3 && 'Good'}
              {rating === 4 && 'Very Good'}
              {rating === 5 && 'Excellent'}
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Your Review (Optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50 resize-none"
              placeholder="Share your experience with this service..."
            />
          </div>
        </div>

        <div className="p-4 border-t border-orange-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-500 hover:text-gray-700">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            className="px-6 py-2 bg-saffron text-white rounded-xl disabled:opacity-50 flex items-center gap-2 hover:bg-saffron-dark transition-colors"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Submit Review
          </button>
        </div>
      </motion.div>
    </div>
  );
}
