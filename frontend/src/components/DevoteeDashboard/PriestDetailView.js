import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, ChevronRight, Clock, Loader2, MessageSquare, MapPin, Award, Landmark } from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import SmartPayment from '../PaymentComponents';

function PriestDetailView({ priest, onBack, isDesktop }) {
  const { user } = useAuth();
  const [selectedService, setSelectedService] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [ratingSummary, setRatingSummary] = useState(null);
  const [paymentModal, setPaymentModal] = useState(null);
  const [showAllReviews, setShowAllReviews] = useState(false);

  // Fetch reviews for this priest
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await api.get(`/api/providers/${priest.id}/reviews`);
        // Map backend fields to frontend expected fields
        const mapped = (res.data.reviews || []).map(r => ({
          ...r,
          comment: r.review_text || r.comment || '',
          service_name: r.service_type || r.service_name || '',
        }));
        setReviews(mapped);
        setRatingSummary(res.data.rating_summary || { distribution: {} });
      } catch (error) {
        console.error('Failed to fetch reviews:', error);
      } finally {
        setReviewsLoading(false);
      }
    };
    fetchReviews();
  }, [priest.id]);

  const handleBook = async () => {
    if (!selectedService || !bookingDate) {
      toast.error('Please select service and date');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/api/bookings', {
        priest_id: priest.id,
        service_name: selectedService.name,
        booking_date: new Date(bookingDate).toISOString(),
        booking_type: 'online'
      });

      if (res.data.requires_payment) {
        setPaymentModal({
          bookingId: res.data.booking_id,
          serviceName: selectedService.name,
          price: res.data.price,
          priceBreakdown: res.data.price_breakdown,
          totalAmount: res.data.price_breakdown?.total || res.data.price,
        });
      } else {
        toast.success('Booking created successfully!');
        onBack();
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentData) => {
    try {
      const res = await api.post(`/api/bookings/${paymentModal.bookingId}/confirm-payment`, {
        payment_id: paymentData.payment_id,
      });
      toast.success('Payment successful! Booking confirmed. You can now chat with your priest in Messages.');
      setPaymentModal(null);
      onBack();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Payment confirmation failed');
    }
  };

  return (
    <>
    <div className={`pb-24 lg:pb-8 ${isDesktop ? 'px-8' : ''}`}>
      {/* Header with back button */}
      <div className="sticky top-0 bg-white/90 backdrop-blur-sm z-10 px-4 py-3 border-b border-orange-50">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-maroon">
          <ChevronRight className="w-5 h-5 rotate-180" />
          <span>Back to Priests</span>
        </button>
      </div>

      <div className={`${isDesktop ? 'grid grid-cols-3 gap-8 pt-6' : 'px-4 pt-4'}`}>
        {/* Priest Info */}
        <div className={`${isDesktop ? 'col-span-2' : ''}`}>
          <div className={`${isDesktop ? 'flex items-start gap-6' : 'text-center'} mb-6`}>
            <div className={`${isDesktop ? 'w-32 h-32' : 'w-24 h-24 mx-auto'} bg-gradient-to-br from-saffron to-gold rounded-full flex items-center justify-center text-white text-4xl font-cinzel mb-4`}>
              {priest.user_name?.charAt(0)}
            </div>
            <div className={`${isDesktop ? 'text-left' : ''}`}>
              <h1 className="font-cinzel text-xl lg:text-2xl font-bold text-maroon">{priest.user_name}</h1>
              <div className={`flex items-center ${isDesktop ? '' : 'justify-center'} gap-2 mt-2`}>
                <Star className="w-4 h-4 text-gold fill-gold" />
                <span className="text-gray-600">{priest.rating} ({priest.total_reviews} reviews)</span>
              </div>
              <p className="text-gray-500 text-sm mt-2">{priest.experience_years} years experience</p>
              <div className={`flex flex-wrap ${isDesktop ? '' : 'justify-center'} gap-2 mt-3`}>
                {priest.specializations?.map((s, i) => (
                  <span key={i} className="text-xs bg-orange-100 text-saffron-dark px-3 py-1 rounded-full">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="bg-orange-50 rounded-2xl p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">About</h3>
            <p className="text-gray-600 text-sm">{priest.bio}</p>
          </div>

          {/* Priest Details: Subcaste, Math/Mutt, Temple, Work Locations */}
          {(priest.subcaste || priest.math_mutt || priest.temple_affiliation || (priest.work_locations && priest.work_locations.length > 0)) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              {priest.subcaste && (
                <div className="bg-white rounded-xl p-3 border border-orange-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Award className="w-4 h-4 text-saffron" />
                    <span className="text-xs font-medium text-gray-500">Subcaste</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-800">{priest.subcaste}</p>
                </div>
              )}
              {priest.math_mutt && (
                <div className="bg-white rounded-xl p-3 border border-orange-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Landmark className="w-4 h-4 text-saffron" />
                    <span className="text-xs font-medium text-gray-500">Math/Mutt</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-800">{priest.math_mutt}</p>
                </div>
              )}
              {priest.temple_affiliation && (
                <div className="bg-white rounded-xl p-3 border border-orange-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Landmark className="w-4 h-4 text-maroon" />
                    <span className="text-xs font-medium text-gray-500">Temple Affiliation</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-800">{priest.temple_affiliation}</p>
                </div>
              )}
              {priest.work_locations && priest.work_locations.length > 0 && (
                <div className="bg-white rounded-xl p-3 border border-orange-100">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-medium text-gray-500">Work Locations</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {priest.work_locations.map((loc, i) => (
                      <span key={i} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{loc}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Services */}
          <h2 className="font-cinzel text-lg font-semibold text-maroon mb-3">Services</h2>
          <div className={`${isDesktop ? 'grid grid-cols-2 gap-4' : 'space-y-3'} mb-6`}>
            {priest.services?.map((service, i) => (
              <button
                key={i}
                onClick={() => setSelectedService(service)}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                  selectedService?.name === service.name
                    ? 'border-saffron bg-orange-50'
                    : 'border-gray-100 bg-white hover:border-orange-200'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <p className="font-semibold text-gray-800">{service.name}</p>
                  <p className="text-saffron font-bold">₹{service.price}</p>
                </div>
                <p className="text-gray-500 text-sm mb-2">{service.description}</p>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  {service.duration_minutes} mins
                </div>
              </button>
            ))}
          </div>

          {/* Reviews Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-cinzel text-lg font-semibold text-maroon">
                Reviews ({priest.total_reviews || 0})
              </h2>
              {reviews.length > 3 && (
                <button
                  onClick={() => setShowAllReviews(!showAllReviews)}
                  className="text-sm text-saffron hover:text-saffron-dark font-medium"
                >
                  {showAllReviews ? 'Show Less' : 'View All'}
                </button>
              )}
            </div>

            {/* Rating Summary */}
            {ratingSummary && (
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-4 mb-4">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-maroon">{priest.rating || '0.0'}</p>
                    <div className="flex items-center justify-center gap-0.5 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= Math.round(priest.rating || 0)
                              ? 'text-gold fill-gold'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{priest.total_reviews || 0} reviews</p>
                  </div>
                  {ratingSummary.distribution && (
                    <div className="flex-1 space-y-1">
                      {[5, 4, 3, 2, 1].map((rating) => {
                        const count = ratingSummary.distribution[rating] || 0;
                        const percentage = priest.total_reviews > 0 
                          ? (count / priest.total_reviews) * 100 
                          : 0;
                        return (
                          <div key={rating} className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 w-3">{rating}</span>
                            <Star className="w-3 h-3 text-gold fill-gold" />
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gold rounded-full"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 w-6">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Reviews List */}
            {reviewsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-saffron" />
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-2xl">
                <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No reviews yet</p>
                <p className="text-xs text-gray-400">Be the first to review after your booking!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {(showAllReviews ? reviews : reviews.slice(0, 3)).map((review) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl p-4 border border-orange-100 shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-saffron/20 rounded-full flex items-center justify-center text-saffron-dark font-semibold">
                          {review.user_name?.charAt(0) || 'A'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{review.user_name || 'Anonymous'}</p>
                          <p className="text-xs text-gray-500">{review.service_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3 h-3 ${
                                star <= review.rating
                                  ? 'text-gold fill-gold'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {review.created_at
                            ? new Date(review.created_at).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })
                            : ''}
                        </p>
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-gray-600 mt-2 pl-13">{review.comment}</p>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Booking Form - Sidebar on Desktop */}
        <div className={`${isDesktop ? 'col-span-1' : ''}`}>
          {selectedService && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white rounded-2xl p-6 border border-orange-100 ${isDesktop ? 'sticky top-20' : 'mb-6'}`}
            >
              <h3 className="font-cinzel text-lg font-semibold text-maroon mb-4">Book Service</h3>
              <div className="bg-orange-50 rounded-xl p-4 mb-4">
                <p className="text-sm text-gray-600">Selected Service</p>
                <p className="font-semibold text-gray-800">{selectedService.name}</p>
                <p className="text-saffron font-bold text-xl">₹{selectedService.price}</p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Date & Time</label>
                <input
                  type="datetime-local"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full border border-orange-200 rounded-xl px-4 py-3 focus:border-saffron focus:ring-2 focus:ring-saffron/20 outline-none"
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
              <button
                onClick={handleBook}
                disabled={loading}
                className="w-full bg-saffron hover:bg-saffron-dark text-white rounded-full py-4 font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Confirm Booking</>}
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>

    {paymentModal && (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setPaymentModal(null)}>
        <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()} data-testid="booking-payment-modal">
          <h3 className="font-cinzel text-lg font-semibold text-gray-800 mb-1">Complete Payment</h3>
          <p className="text-sm text-gray-500 mb-4">{paymentModal.serviceName}</p>
          {paymentModal.priceBreakdown && (
            <div className="bg-orange-50 rounded-xl p-4 mb-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Service Fee</span><span className="font-medium">₹{paymentModal.priceBreakdown.base_price}</span></div>
              {paymentModal.priceBreakdown.platform_fee > 0 && (
                <div className="flex justify-between"><span className="text-gray-600">Platform Fee ({paymentModal.priceBreakdown.platform_fee_percent}%)</span><span>₹{paymentModal.priceBreakdown.platform_fee}</span></div>
              )}
              {paymentModal.priceBreakdown.gst > 0 && (
                <div className="flex justify-between"><span className="text-gray-600">{paymentModal.priceBreakdown.tax_label} ({paymentModal.priceBreakdown.gst_percent}%)</span><span>₹{paymentModal.priceBreakdown.gst.toFixed(2)}</span></div>
              )}
              <div className="flex justify-between pt-2 border-t border-orange-200 font-bold"><span>Total</span><span className="text-lg text-maroon">₹{paymentModal.totalAmount?.toFixed(2)}</span></div>
            </div>
          )}
          <SmartPayment
            amount={paymentModal.totalAmount}
            onSuccess={handlePaymentSuccess}
            onError={(err) => toast.error(err)}
            description={`Puja Booking: ${paymentModal.serviceName}`}
            metadata={{ type: 'puja_booking', booking_id: paymentModal.bookingId }}
          />
        </div>
      </div>
    )}
    </>
  );
}

export default PriestDetailView;
