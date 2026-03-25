import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Package, Phone, Loader2, Star, X, 
  CheckCircle, Clock, Truck, ChevronRight, Filter
} from 'lucide-react';
import api from '../../../../lib/api';
import { toast } from 'sonner';
import { ReviewModal } from './ReviewModal';

const SUB_TABS = [
  { id: 'bookings', label: 'Bookings', icon: Calendar },
  { id: 'orders', label: 'Orders', icon: Package },
  { id: 'calls', label: 'Call History', icon: Phone },
];

export function MyActivityTab({ isDesktop, setActiveTab: setParentTab, setSelectedPriest }) {
  const [subTab, setSubTab] = useState('bookings');

  return (
    <div className={`pb-24 lg:pb-8 ${isDesktop ? 'px-8' : 'px-4'}`}>
      <div className="pt-4 pb-2">
        <h1 className="font-cinzel text-2xl font-bold text-maroon">My Activity</h1>
        <p className="text-gray-500 text-sm">Track your bookings, orders & consultations</p>
      </div>

      {/* Sub-tab switcher */}
      <div className="flex gap-2 mt-4 mb-6 overflow-x-auto pb-1 scrollbar-hide">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full whitespace-nowrap transition-all text-sm font-medium ${
              subTab === tab.id
                ? 'bg-saffron text-white shadow-md'
                : 'bg-white text-gray-600 border border-orange-100 hover:border-saffron/40'
            }`}
            data-testid={`activity-tab-${tab.id}`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {subTab === 'bookings' && (
        <BookingsSection isDesktop={isDesktop} setParentTab={setParentTab} setSelectedPriest={setSelectedPriest} />
      )}
      {subTab === 'orders' && (
        <OrdersSection isDesktop={isDesktop} setParentTab={setParentTab} />
      )}
      {subTab === 'calls' && (
        <CallHistorySection isDesktop={isDesktop} />
      )}
    </div>
  );
}

// ==================== BOOKINGS SECTION ====================
function BookingsSection({ isDesktop, setParentTab }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewBooking, setReviewBooking] = useState(null);
  const [cancelBooking, setCancelBooking] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancellationPreview, setCancellationPreview] = useState(null);

  useEffect(() => { fetchBookings(); }, []);

  const fetchBookings = async () => {
    try {
      const res = await api.get('/api/bookings');
      setBookings(res.data.bookings || []);
    } catch (error) {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const fetchCancellationPreview = async (bookingId) => {
    try {
      const res = await api.get(`/api/bookings/${bookingId}/cancellation-preview`);
      setCancellationPreview(res.data);
    } catch { setCancellationPreview(null); }
  };

  const openCancelModal = async (booking) => {
    setCancelBooking(booking);
    await fetchCancellationPreview(booking.id);
  };

  const handleCancel = async (reason = '') => {
    if (!cancelBooking) return;
    setCancelLoading(true);
    try {
      const res = await api.post(`/api/bookings/${cancelBooking.id}/cancel`, { reason });
      toast.success(`Booking cancelled. ${res.data.refund_amount > 0 ? `Refund of ₹${res.data.refund_amount} will be processed.` : ''}`);
      setCancelBooking(null);
      setCancellationPreview(null);
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to cancel');
    } finally { setCancelLoading(false); }
  };

  const statuses = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];
  const filtered = statusFilter === 'all' ? bookings : bookings.filter(b => b.status === statusFilter);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-saffron animate-spin" /></div>;
  }

  return (
    <>
      {/* Status filter pills */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
        {statuses.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium capitalize whitespace-nowrap transition-all ${
              statusFilter === s ? 'bg-maroon text-white' : 'bg-orange-50 text-gray-600 hover:bg-orange-100'
            }`}
            data-testid={`filter-${s}`}
          >
            {s === 'all' ? 'All' : s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={statusFilter === 'all' ? 'No bookings yet' : `No ${statusFilter} bookings`}
          subtitle="Book a priest for your next puja"
          actionLabel="Book a Priest"
          onAction={() => setParentTab('priests')}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((booking) => (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-4 border border-orange-50 shadow-sm"
              data-testid={`booking-${booking.id}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800">{booking.service_name}</p>
                  <p className="text-sm text-gray-500">{booking.priest_name}</p>
                </div>
                <StatusBadge status={booking.status} />
              </div>

              {(booking.booking_date || booking.scheduled_date) && (
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                  <Clock className="w-4 h-4" />
                  <span>{new Date(booking.booking_date || booking.scheduled_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-orange-50">
                <span className="font-semibold text-saffron">₹{booking.price}</span>
                <div className="flex gap-2">
                  {booking.status === 'completed' && !booking.has_review && (
                    <button
                      onClick={() => { setReviewBooking(booking); setShowReviewModal(true); }}
                      className="text-xs bg-saffron/10 text-saffron px-3 py-1.5 rounded-full font-medium hover:bg-saffron/20 flex items-center gap-1"
                      data-testid={`review-${booking.id}`}
                    >
                      <Star className="w-3 h-3" /> Write Review
                    </button>
                  )}
                  {booking.has_review && (
                    <span className="text-xs text-green-600 flex items-center gap-1 px-3 py-1.5"><CheckCircle className="w-3 h-3" /> Reviewed</span>
                  )}
                  {(booking.status === 'pending' || booking.status === 'confirmed') && (
                    <button
                      onClick={() => openCancelModal(booking)}
                      className="text-xs bg-red-50 text-red-500 px-3 py-1.5 rounded-full font-medium hover:bg-red-100 flex items-center gap-1"
                      data-testid={`cancel-${booking.id}`}
                    >
                      <X className="w-3 h-3" /> Cancel
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && reviewBooking && (
        <ReviewModal
          booking={reviewBooking}
          onClose={() => { setShowReviewModal(false); setReviewBooking(null); }}
          onSuccess={() => { setShowReviewModal(false); setReviewBooking(null); fetchBookings(); toast.success('Review submitted!'); }}
        />
      )}

      {/* Cancel Modal */}
      <AnimatePresence>
        {cancelBooking && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => { setCancelBooking(null); setCancellationPreview(null); }}
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full p-6"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="font-cinzel text-xl font-bold text-maroon mb-2">Cancel Booking</h3>
              <p className="text-gray-600 mb-4">Cancel <strong>{cancelBooking.service_name}</strong> with {cancelBooking.priest_name}?</p>
              {cancellationPreview ? (
                <div className={`rounded-xl p-4 mb-4 ${
                  cancellationPreview.refund_percentage === 100 ? 'bg-green-50 border border-green-200' :
                  cancellationPreview.refund_percentage === 50 ? 'bg-yellow-50 border border-yellow-200' : 'bg-red-50 border border-red-200'
                }`}>
                  <p className="font-semibold text-gray-800 mb-2">Refund Policy</p>
                  <p className={`text-sm ${
                    cancellationPreview.refund_percentage === 100 ? 'text-green-700' :
                    cancellationPreview.refund_percentage === 50 ? 'text-yellow-700' : 'text-red-700'
                  }`}>{cancellationPreview.policy_message}</p>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
                    <span className="text-gray-600">Amount</span>
                    <span className="font-medium">₹{cancellationPreview.booking_price}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-gray-600">Refund</span>
                    <span className={`font-bold ${cancellationPreview.refund_amount > 0 ? 'text-green-600' : 'text-red-600'}`}>₹{cancellationPreview.refund_amount}</span>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin text-saffron" /></div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => { setCancelBooking(null); setCancellationPreview(null); }}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200"
                  disabled={cancelLoading}
                >Keep Booking</button>
                <button
                  onClick={() => handleCancel()}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 flex items-center justify-center gap-2"
                  disabled={cancelLoading}
                >
                  {cancelLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirm Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ==================== ORDERS SECTION ====================
function OrdersSection({ isDesktop, setParentTab }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/api/orders');
      setOrders(res.data.orders || []);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-saffron animate-spin" /></div>;
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="No orders yet"
        subtitle="Browse the Pooja Store for sacred items"
        actionLabel="Visit Store"
        onAction={() => setParentTab('shop')}
      />
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <motion.div
          key={order.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-4 border border-orange-50 shadow-sm"
          data-testid={`order-${order.id}`}
        >
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-saffron/10 to-gold/10 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-saffron" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800">Order #{order.id?.slice(-6)}</p>
              <p className="text-xs text-gray-500">
                {order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
              </p>
            </div>
            <StatusBadge status={order.status} />
          </div>

          {/* Order items preview */}
          {order.items && order.items.length > 0 && (
            <div className="mb-3 space-y-1">
              {order.items.slice(0, 2).map((item, idx) => (
                <p key={idx} className="text-sm text-gray-600 truncate">
                  {item.quantity}x {item.name || item.product_name}
                </p>
              ))}
              {order.items.length > 2 && (
                <p className="text-xs text-gray-400">+{order.items.length - 2} more items</p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-orange-50">
            <span className="font-semibold text-saffron">₹{Math.round(order.total_amount || order.total)}</span>
            {order.status === 'shipped' && (
              <div className="flex items-center gap-1 text-xs text-blue-600">
                <Truck className="w-4 h-4" /> In transit
              </div>
            )}
            {order.status === 'delivered' && (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle className="w-4 h-4" /> Delivered
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ==================== CALL HISTORY SECTION ====================
function CallHistorySection({ isDesktop }) {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchCalls(); }, []);

  const fetchCalls = async () => {
    try {
      const res = await api.get('/api/consultation/history');
      setCalls(res.data.calls || []);
    } catch (error) {
      console.error('Call history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0m';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-saffron animate-spin" /></div>;
  }

  if (calls.length === 0) {
    return (
      <EmptyState
        icon={Phone}
        title="No consultations yet"
        subtitle="Talk to an astrologer for personalized guidance"
        actionLabel="Call an Astrologer"
      />
    );
  }

  return (
    <div className="space-y-3">
      {calls.map((call) => (
        <motion.div
          key={call.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-4 border border-orange-50 shadow-sm"
          data-testid={`call-${call.id}`}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Phone className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800">{call.astrologer_name || 'Astrologer'}</p>
              <p className="text-xs text-gray-500">
                {call.started_at ? new Date(call.started_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-800">₹{call.amount_charged || 0}</p>
              <p className="text-xs text-gray-500">{formatDuration(call.duration_seconds)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDuration(call.duration_seconds)}</span>
            <span className={`ml-auto px-2 py-0.5 rounded-full ${
              call.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
            }`}>{call.status}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ==================== SHARED COMPONENTS ====================
function StatusBadge({ status }) {
  const styles = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-green-100 text-green-700',
    completed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-700',
    delivered: 'bg-green-100 text-green-700',
    shipped: 'bg-blue-100 text-blue-700',
    processing: 'bg-purple-100 text-purple-700',
    paid: 'bg-purple-100 text-purple-700',
  };
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full capitalize font-medium ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

function EmptyState({ icon: Icon, title, subtitle, actionLabel, onAction }) {
  return (
    <div className="bg-white rounded-2xl p-8 text-center border border-orange-50">
      <Icon className="w-14 h-14 text-gray-200 mx-auto mb-4" />
      <h3 className="font-semibold text-gray-700 mb-1">{title}</h3>
      <p className="text-gray-400 text-sm mb-4">{subtitle}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="bg-saffron text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-orange-600 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
