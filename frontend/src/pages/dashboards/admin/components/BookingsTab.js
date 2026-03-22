import React from 'react';
import { Calendar } from 'lucide-react';

export function BookingsTab({ bookings, isDesktop, loading }) {
  return (
    <div className={`pb-24 lg:pb-8 ${isDesktop ? 'px-8' : 'px-4'}`}>
      <div className="pt-4">
        <h2 className="font-cinzel text-xl font-semibold text-gray-800 mb-4">All Bookings</h2>
        {bookings.length === 0 ? (
          <div className="bg-white shadow-sm border border-orange-100 rounded-xl p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No bookings yet</p>
          </div>
        ) : (
          <div className={`${isDesktop ? 'grid grid-cols-2 gap-4' : 'space-y-3'}`}>
            {bookings.map((booking) => (
              <div key={booking.id} className="bg-white shadow-sm border border-orange-100 rounded-xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-gray-800 font-medium">{booking.service_name}</p>
                    <p className="text-sm text-gray-500">{booking.priest_name}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    booking.status === 'confirmed' ? 'bg-blue-500/30 text-blue-300' :
                    booking.status === 'pending' ? 'bg-yellow-500/30 text-yellow-300' :
                    booking.status === 'completed' ? 'bg-green-500/30 text-green-300' :
                    'bg-red-500/30 text-red-300'
                  }`}>
                    {booking.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {new Date(booking.booking_date).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
