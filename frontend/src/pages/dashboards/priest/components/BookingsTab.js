import React, { useState } from 'react';
import { User, Clock, CheckCircle, XCircle, Calendar, Filter } from 'lucide-react';

// ==================== BOOKING CARD ====================
function BookingCard({ booking, onUpdateStatus, compact = false }) {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  return (
    <div className={`border border-orange-100 rounded-xl ${compact ? 'p-3' : 'p-4'}`}>
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
            onClick={() => onUpdateStatus(booking.id, 'confirmed')}
            className="flex-1 bg-green-500 text-white rounded-lg py-1.5 text-xs flex items-center justify-center gap-1"
          >
            <CheckCircle className="w-3 h-3" /> Accept
          </button>
          <button
            onClick={() => onUpdateStatus(booking.id, 'cancelled')}
            className="flex-1 bg-red-500 text-white rounded-lg py-1.5 text-xs flex items-center justify-center gap-1"
          >
            <XCircle className="w-3 h-3" /> Decline
          </button>
        </div>
      )}

      {booking.status === 'confirmed' && (
        <button
          onClick={() => onUpdateStatus(booking.id, 'completed')}
          className="w-full bg-saffron text-white rounded-lg py-1.5 text-xs mt-2"
        >
          Mark Completed
        </button>
      )}
    </div>
  );
}

// ==================== BOOKINGS TAB ====================
function BookingsTab({ bookings, updateStatus }) {
  const [filter, setFilter] = useState('all');

  const filteredBookings = bookings.filter(b => filter === 'all' || b.status === filter);
  const stats = {
    all: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
  };

  return (
    <div className="space-y-4">
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
              <BookingCard booking={booking} onUpdateStatus={updateStatus} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== CLASSES TAB with Schedule Options ====================

export { BookingCard, BookingsTab };
