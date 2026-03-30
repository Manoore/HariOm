import React, { useState } from 'react';
import { User, Clock, CheckCircle, XCircle, Calendar, Loader2 } from 'lucide-react';
import { useConfirmDialog } from '../../../../components/ui/ConfirmDialog';

// ==================== BOOKING CARD ====================
function BookingCard({ booking, onUpdateStatus, compact = false, confirm }) {
  const [loadingAction, setLoadingAction] = useState(null);

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  const handleAction = async (bookingId, status) => {
    const configs = {
      confirmed: {
        title: 'Accept Booking?',
        message: `Accept "${booking.service_name}" from ${booking.user_name}? The devotee will be notified.`,
        confirmLabel: 'Accept',
        cancelLabel: 'Not Now',
      },
      completed: {
        title: 'Mark as Completed?',
        message: `Mark "${booking.service_name}" with ${booking.user_name} as completed?`,
        confirmLabel: 'Yes, Complete',
        cancelLabel: 'Not Yet',
      },
      cancelled: {
        title: 'Cancel Booking?',
        message: `Cancel "${booking.service_name}" with ${booking.user_name}? The devotee will be notified.`,
        confirmLabel: 'Yes, Cancel',
        cancelLabel: 'Keep Booking',
        variant: 'danger',
      },
    };

    if (confirm && configs[status]) {
      const ok = await confirm(configs[status]);
      if (!ok) return;
    }

    setLoadingAction(status);
    try {
      await onUpdateStatus(bookingId, status);
    } finally {
      setLoadingAction(null);
    }
  };

  const isLoading = loadingAction !== null;

  return (
    <div className={`border border-orange-100 rounded-xl ${compact ? 'p-3' : 'p-4'}`} data-testid={`booking-card-${booking.id}`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className={`font-semibold text-gray-800 ${compact ? 'text-sm' : ''}`}>{booking.service_name}</p>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <User className="w-3 h-3" />
            {booking.user_name}
          </p>
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            {new Date(booking.booking_date).toLocaleDateString('en-IN', { 
              weekday: 'short', day: 'numeric', month: 'short'
            })}
          </div>
          <p className="text-sm font-medium text-saffron mt-1">₹{booking.price}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${statusColors[booking.status]}`}>
          {booking.status}
        </span>
      </div>

      {booking.status === 'pending' && (
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => handleAction(booking.id, 'confirmed')}
            disabled={isLoading}
            className="flex-1 bg-green-500 text-white rounded-lg py-1.5 text-xs flex items-center justify-center gap-1 disabled:opacity-50 hover:bg-green-600 transition-colors"
            data-testid={`accept-booking-${booking.id}`}
          >
            {loadingAction === 'confirmed' ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />} Accept
          </button>
          <button
            onClick={() => handleAction(booking.id, 'cancelled')}
            disabled={isLoading}
            className="flex-1 bg-red-500 text-white rounded-lg py-1.5 text-xs flex items-center justify-center gap-1 disabled:opacity-50 hover:bg-red-600 transition-colors"
            data-testid={`decline-booking-${booking.id}`}
          >
            {loadingAction === 'cancelled' ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />} Decline
          </button>
        </div>
      )}

      {booking.status === 'confirmed' && (
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => handleAction(booking.id, 'completed')}
            disabled={isLoading}
            className="flex-1 bg-saffron text-white rounded-lg py-1.5 text-xs disabled:opacity-50 flex items-center justify-center gap-1 hover:bg-saffron-dark transition-colors"
            data-testid={`complete-booking-${booking.id}`}
          >
            {loadingAction === 'completed' ? <Loader2 className="w-3 h-3 animate-spin" /> : null} Mark Completed
          </button>
          <button
            onClick={() => handleAction(booking.id, 'cancelled')}
            disabled={isLoading}
            className="flex-1 bg-red-50 text-red-500 border border-red-200 rounded-lg py-1.5 text-xs flex items-center justify-center gap-1 disabled:opacity-50 hover:bg-red-100 transition-colors"
            data-testid={`cancel-booking-${booking.id}`}
          >
            {loadingAction === 'cancelled' ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />} Cancel
          </button>
        </div>
      )}
    </div>
  );
}

// ==================== BOOKINGS TAB ====================
function BookingsTab({ bookings, updateStatus }) {
  const [filter, setFilter] = useState('all');
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const filteredBookings = bookings.filter(b => filter === 'all' || b.status === filter);
  const stats = {
    all: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
  };

  return (
    <div className="space-y-4">
      <ConfirmDialog />
      <h2 className="font-cinzel text-lg md:text-xl font-semibold text-maroon">Bookings</h2>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {Object.entries(stats).map(([status, count]) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1.5 rounded-full text-xs md:text-sm font-medium whitespace-nowrap ${
              filter === status ? 'bg-saffron text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)} ({count})
          </button>
        ))}
      </div>

      {filteredBookings.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-400">No bookings found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-xl shadow-sm p-4">
              <BookingCard booking={booking} onUpdateStatus={updateStatus} confirm={confirm} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== CLASSES TAB with Schedule Options ====================

export { BookingCard, BookingsTab };
