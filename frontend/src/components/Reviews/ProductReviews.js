import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, Camera, X, Loader2, ThumbsUp, CheckCircle, 
  ChevronDown, ChevronUp, Edit, Trash2, User
} from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';
import { useConfirmDialog } from '../ui/ConfirmDialog';

// Star Rating Component
export function StarRating({ rating, setRating, size = "md", readonly = false }) {
  const [hoverRating, setHoverRating] = useState(0);
  
  const sizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8"
  };
  
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && setRating(star)}
          onMouseEnter={() => !readonly && setHoverRating(star)}
          onMouseLeave={() => !readonly && setHoverRating(0)}
          disabled={readonly}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
        >
          <Star
            className={`${sizes[size]} ${
              star <= (hoverRating || rating)
                ? 'fill-gold text-gold'
                : 'text-gray-300'
            } transition-colors`}
          />
        </button>
      ))}
    </div>
  );
}

// Rating Summary Component
export function RatingSummary({ summary, totalReviews, avgRating }) {
  const maxCount = Math.max(...Object.values(summary), 1);
  
  return (
    <div className="bg-orange-50 rounded-2xl p-4">
      <div className="flex items-center gap-4 mb-4">
        <div className="text-center">
          <div className="text-4xl font-bold text-maroon">{avgRating?.toFixed(1) || "0.0"}</div>
          <StarRating rating={Math.round(avgRating || 0)} readonly size="sm" />
          <p className="text-sm text-gray-500 mt-1">{totalReviews} reviews</p>
        </div>
        <div className="flex-1 space-y-1">
          {[5, 4, 3, 2, 1].map((star) => (
            <div key={star} className="flex items-center gap-2">
              <span className="text-xs w-3">{star}</span>
              <Star className="w-3 h-3 fill-gold text-gold" />
              <div className="flex-1 h-2 bg-white rounded-full overflow-hidden">
                <div
                  className="h-full bg-gold rounded-full transition-all"
                  style={{ width: `${(summary[star] / maxCount) * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 w-8">{summary[star]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Write Review Modal
export function WriteReviewModal({ productId, productName, isOpen, onClose, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newImages = [...images];

    for (let i = 0; i < Math.min(files.length, 3 - newImages.length); i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        continue;
      }

      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await api.post('/api/upload/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        newImages.push(res.data.url);
      } catch (error) {
        toast.error('Failed to upload image');
      }
    }

    setImages(newImages);
    setUploading(false);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/api/products/${productId}/reviews`, {
        rating,
        comment,
        images
      });
      toast.success('Review submitted!');
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-cinzel text-xl font-semibold text-maroon">Write a Review</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          <p className="text-gray-600 mb-4">{productName}</p>

          {/* Rating */}
          <div className="mb-6">
            <label className="text-sm text-gray-600 mb-2 block">Your Rating *</label>
            <StarRating rating={rating} setRating={setRating} size="lg" />
          </div>

          {/* Comment */}
          <div className="mb-6">
            <label className="text-sm text-gray-600 mb-2 block">Your Review</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="Share your experience with this product..."
              className="w-full px-4 py-3 rounded-xl border border-orange-100 focus:ring-2 focus:ring-saffron/50 focus:border-saffron outline-none resize-none"
            />
          </div>

          {/* Image Upload */}
          <div className="mb-6">
            <label className="text-sm text-gray-600 mb-2 block">Add Photos (up to 3)</label>
            
            {images.length > 0 && (
              <div className="flex gap-2 mb-3">
                {images.map((img, idx) => (
                  <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-orange-100">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {images.length < 3 && (
              <label className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-orange-200 rounded-xl cursor-pointer hover:border-saffron hover:bg-orange-50 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-saffron" />
                    <span className="text-sm text-gray-500">Uploading...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5 text-saffron" />
                    <span className="text-sm text-gray-600">Add Photos</span>
                  </>
                )}
              </label>
            )}
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            className="w-full py-4 bg-saffron text-white rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Review'
            )}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Single Review Card
export function ReviewCard({ review, isOwn, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [marking, setMarking] = useState(false);

  const handleHelpful = async () => {
    setMarking(true);
    try {
      await api.post(`/api/reviews/${review.id}/helpful`);
      toast.success('Marked as helpful');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed');
    } finally {
      setMarking(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-4 border border-orange-50">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center overflow-hidden">
            {review.user_image ? (
              <img src={review.user_image} alt="" className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-saffron" />
            )}
          </div>
          <div>
            <p className="font-medium text-gray-800">{review.user_name}</p>
            <div className="flex items-center gap-2">
              <StarRating rating={review.rating} readonly size="sm" />
              {review.is_verified_purchase && (
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Verified
                </span>
              )}
            </div>
          </div>
        </div>
        <span className="text-xs text-gray-400">
          {new Date(review.created_at).toLocaleDateString()}
        </span>
      </div>

      {/* Content */}
      {review.comment && (
        <p className={`text-gray-600 text-sm ${!expanded && review.comment.length > 200 ? 'line-clamp-3' : ''}`}>
          {review.comment}
        </p>
      )}
      
      {review.comment?.length > 200 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-saffron text-sm mt-1 flex items-center gap-1"
        >
          {expanded ? <><ChevronUp className="w-4 h-4" /> Less</> : <><ChevronDown className="w-4 h-4" /> More</>}
        </button>
      )}

      {/* Images */}
      {review.images?.length > 0 && (
        <div className="flex gap-2 mt-3">
          {review.images.map((img, idx) => (
            <div key={idx} className="w-16 h-16 rounded-lg overflow-hidden border border-orange-100">
              <img src={img} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
        <button
          onClick={handleHelpful}
          disabled={marking || isOwn}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-saffron disabled:opacity-50"
        >
          <ThumbsUp className="w-4 h-4" />
          Helpful ({review.helpful_count || 0})
        </button>
        
        {isOwn && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit?.(review)}
              className="text-sm text-saffron hover:underline"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete?.(review.id)}
              className="text-sm text-red-500 hover:underline"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Product Reviews List Component
export function ProductReviews({ productId, productName }) {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({1: 0, 2: 0, 3: 0, 4: 0, 5: 0});
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [canReview, setCanReview] = useState(false);
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [sortBy, setSortBy] = useState('recent');
  const { confirm, ConfirmDialog } = useConfirmDialog();

  useEffect(() => {
    fetchReviews();
    checkCanReview();
  }, [productId, sortBy]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/products/${productId}/reviews?sort=${sortBy}`);
      setReviews(res.data.reviews || []);
      setSummary(res.data.rating_summary || {1: 0, 2: 0, 3: 0, 4: 0, 5: 0});
      setProduct(res.data.product);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkCanReview = async () => {
    try {
      const res = await api.get(`/api/products/${productId}/can-review`);
      setCanReview(res.data.can_review);
    } catch (error) {
      setCanReview(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    const ok = await confirm({
      title: 'Delete Review?',
      message: 'Are you sure you want to delete this review? This cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Keep',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api.delete(`/api/reviews/${reviewId}`);
      toast.success('Review deleted');
      fetchReviews();
    } catch (error) {
      toast.error('Failed to delete review');
    }
  };

  return (
    <div className="space-y-6">
      <ConfirmDialog />
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-cinzel text-xl font-semibold text-maroon">Customer Reviews</h2>
        {canReview && (
          <button
            onClick={() => setShowWriteReview(true)}
            className="bg-saffron text-white px-4 py-2 rounded-xl text-sm hover:bg-orange-600"
          >
            Write a Review
          </button>
        )}
      </div>

      {/* Rating Summary */}
      {product && (
        <RatingSummary 
          summary={summary} 
          totalReviews={product.total_reviews} 
          avgRating={product.rating} 
        />
      )}

      {/* Sort */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Sort by:</span>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="text-sm border border-orange-100 rounded-lg px-3 py-1 outline-none focus:ring-2 focus:ring-saffron/50"
        >
          <option value="recent">Most Recent</option>
          <option value="helpful">Most Helpful</option>
          <option value="rating_high">Highest Rating</option>
          <option value="rating_low">Lowest Rating</option>
        </select>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 text-saffron animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8 bg-orange-50 rounded-2xl">
          <Star className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">No reviews yet</p>
          {canReview && (
            <button
              onClick={() => setShowWriteReview(true)}
              className="mt-4 text-saffron hover:underline"
            >
              Be the first to review
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              isOwn={false}
              onDelete={handleDeleteReview}
            />
          ))}
        </div>
      )}

      {/* Write Review Modal */}
      <WriteReviewModal
        productId={productId}
        productName={productName}
        isOpen={showWriteReview}
        onClose={() => setShowWriteReview(false)}
        onSuccess={fetchReviews}
      />
    </div>
  );
}

export default ProductReviews;
