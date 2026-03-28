import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Package, Phone, Loader2, Star, X, 
  CheckCircle, Clock, Truck, ChevronRight, Filter, Eye, IndianRupee, Wallet, BookOpen, ArrowUpRight, ArrowDownLeft
} from 'lucide-react';
import api from '../../../../lib/api';
import { toast } from 'sonner';
import { ReviewModal } from './ReviewModal';

const SUB_TABS = [
  { id: 'bookings', label: 'Bookings', icon: Calendar },
  { id: 'orders', label: 'Orders', icon: Package },
  { id: 'calls', label: 'Call History', icon: Phone },
  { id: 'transactions', label: 'Transactions', icon: IndianRupee },
];

export function MyActivityTab({ isDesktop, setActiveTab: setParentTab, setSelectedPriest, onViewOrder }) {
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
        <OrdersSection isDesktop={isDesktop} setParentTab={setParentTab} onViewOrder={onViewOrder} />
      )}
      {subTab === 'calls' && (
        <CallHistorySection isDesktop={isDesktop} />
      )}
      {subTab === 'transactions' && (
        <TransactionsSection isDesktop={isDesktop} />
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
  const [selectedBooking, setSelectedBooking] = useState(null);

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
                  <button
                    onClick={() => setSelectedBooking(booking)}
                    className="text-xs bg-gray-50 text-gray-600 px-3 py-1.5 rounded-full font-medium hover:bg-gray-100 flex items-center gap-1"
                    data-testid={`view-booking-${booking.id}`}
                  >
                    <Eye className="w-3 h-3" /> Details
                  </button>
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

      {/* Booking Detail Modal */}
      <AnimatePresence>
        {selectedBooking && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
            onClick={() => setSelectedBooking(null)}
          >
            <motion.div
              initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
              className="bg-white rounded-t-2xl sm:rounded-2xl max-w-md w-full p-6 max-h-[85vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-cinzel text-lg font-bold text-maroon">Booking Details</h3>
                <button onClick={() => setSelectedBooking(null)} className="p-1 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Service</span>
                  <span className="font-semibold text-gray-800">{selectedBooking.service_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Priest</span>
                  <span className="text-gray-800">{selectedBooking.priest_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Status</span>
                  <StatusBadge status={selectedBooking.status} />
                </div>
                {(selectedBooking.booking_date || selectedBooking.scheduled_date) && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Date</span>
                    <span className="text-gray-800">{new Date(selectedBooking.booking_date || selectedBooking.scheduled_date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                )}
                {selectedBooking.booking_time && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Time</span>
                    <span className="text-gray-800">{selectedBooking.booking_time}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Amount</span>
                  <span className="font-bold text-saffron text-lg">₹{selectedBooking.price}</span>
                </div>
                {selectedBooking.address && (
                  <div className="flex justify-between items-start">
                    <span className="text-sm text-gray-500">Address</span>
                    <span className="text-gray-800 text-right max-w-[60%]">{selectedBooking.address}</span>
                  </div>
                )}
                {selectedBooking.notes && (
                  <div className="pt-3 border-t border-orange-50">
                    <span className="text-sm text-gray-500 block mb-1">Notes</span>
                    <p className="text-gray-700 text-sm">{selectedBooking.notes}</p>
                  </div>
                )}
                {selectedBooking.payment_status && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Payment</span>
                    <span className={`text-sm font-medium ${selectedBooking.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                      {selectedBooking.payment_status}
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="w-full mt-6 py-3 bg-saffron text-white rounded-xl font-semibold hover:bg-saffron/90 transition-colors"
              >Close</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
function OrdersSection({ isDesktop, setParentTab, onViewOrder }) {
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
            <div className="flex items-center gap-2">
              {order.status === 'shipping' && (
                <div className="flex items-center gap-1 text-xs text-blue-600">
                  <Truck className="w-4 h-4" /> In transit
                </div>
              )}
              {['processing', 'accepted', 'received'].includes(order.status) && (
                <div className="flex items-center gap-1 text-xs text-purple-600">
                  <Clock className="w-4 h-4" /> {order.status === 'received' ? 'Received' : order.status === 'accepted' ? 'Accepted' : 'Processing'}
                </div>
              )}
              {order.status === 'delivered' && (
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle className="w-4 h-4" /> Delivered
                </div>
              )}
              <button
                onClick={() => onViewOrder?.(order.id)}
                className="text-xs bg-gray-50 text-gray-600 px-3 py-1.5 rounded-full font-medium hover:bg-gray-100 flex items-center gap-1"
                data-testid={`view-order-${order.id}`}
              >
                <Eye className="w-3 h-3" /> Details
              </button>
            </div>
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


// ==================== TRANSACTIONS SECTION ====================
const TXN_TYPE_CONFIG = {
  order: { icon: Package, color: 'text-green-600', bg: 'bg-green-50', label: 'Order' },
  booking: { icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Booking' },
  consultation: { icon: Phone, color: 'text-purple-600', bg: 'bg-purple-50', label: 'Call' },
  wallet_recharge: { icon: Wallet, color: 'text-saffron', bg: 'bg-orange-50', label: 'Recharge' },
  class: { icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50', label: 'Class' },
};

const TXN_STATUS_COLORS = {
  completed: 'text-green-600', delivered: 'text-green-600', paid: 'text-green-600',
  confirmed: 'text-blue-600', processing: 'text-blue-600', shipping: 'text-blue-600',
  pending: 'text-yellow-600', cancelled: 'text-red-600', refunded: 'text-red-600',
};

function TransactionsSection({ isDesktop }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchTransactions(); }, []);

  const fetchTransactions = async () => {
    try {
      const res = await api.get('/api/my-transactions?limit=200');
      setData(res.data);
    } catch {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-saffron" /></div>;

  const txns = (data?.transactions || []).filter(t => filter === 'all' || t.type === filter);

  return (
    <div>
      {/* Summary Cards */}
      <div className={`grid ${isDesktop ? 'grid-cols-3' : 'grid-cols-3'} gap-3 mb-4`}>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-orange-100 text-center">
          <ArrowUpRight className="w-4 h-4 text-red-500 mx-auto mb-1" />
          <p className="text-xs text-gray-500">Total Spent</p>
          <p className="text-base font-bold text-gray-800">₹{(data?.total_spent || 0).toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-orange-100 text-center">
          <ArrowDownLeft className="w-4 h-4 text-green-500 mx-auto mb-1" />
          <p className="text-xs text-gray-500">Recharged</p>
          <p className="text-base font-bold text-gray-800">₹{(data?.total_recharged || 0).toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-orange-100 text-center">
          <IndianRupee className="w-4 h-4 text-saffron mx-auto mb-1" />
          <p className="text-xs text-gray-500">Total Txns</p>
          <p className="text-base font-bold text-gray-800">{data?.total || 0}</p>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
        {[
          { id: 'all', label: 'All' },
          { id: 'order', label: 'Orders' },
          { id: 'booking', label: 'Bookings' },
          { id: 'consultation', label: 'Calls' },
          { id: 'class', label: 'Classes' },
          { id: 'wallet_recharge', label: 'Recharges' },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filter === f.id ? 'bg-saffron text-white' : 'bg-gray-100 text-gray-600'}`}
            data-testid={`txn-filter-${f.id}`}
          >{f.label}</button>
        ))}
      </div>

      {/* Transaction List */}
      <div className="space-y-2">
        {txns.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <IndianRupee className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No transactions found</p>
          </div>
        ) : txns.map((txn, i) => {
          const config = TXN_TYPE_CONFIG[txn.type] || TXN_TYPE_CONFIG.order;
          const TxnIcon = config.icon;
          const isRecharge = txn.type === 'wallet_recharge';
          return (
            <div key={i} className="bg-white rounded-xl p-3 shadow-sm border border-orange-100 flex items-center gap-3" data-testid={`txn-item-${i}`}>
              <div className={`w-10 h-10 ${config.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <TxnIcon className={`w-5 h-5 ${config.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{txn.label}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className={TXN_STATUS_COLORS[txn.status] || 'text-gray-500'}>{txn.status}</span>
                  <span>|</span>
                  <span>{txn.date ? new Date(txn.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</span>
                </div>
              </div>
              <span className={`text-sm font-bold ${isRecharge ? 'text-green-600' : 'text-gray-800'}`}>
                {isRecharge ? '+' : '-'}₹{(txn.amount || 0).toLocaleString('en-IN')}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
