import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Home, Calendar, Settings, LogOut, ChevronRight, Clock,
  CheckCircle, XCircle, User, Star, Bell, Loader2
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { Toaster, toast } from 'sonner';

export default function PriestDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pending: 0, confirmed: 0, completed: 0 });

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await api.get('/api/priest/bookings');
      const data = res.data.bookings || [];
      setBookings(data);
      setStats({
        pending: data.filter(b => b.status === 'pending').length,
        confirmed: data.filter(b => b.status === 'confirmed').length,
        completed: data.filter(b => b.status === 'completed').length,
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (bookingId, status) => {
    try {
      await api.put(`/api/bookings/${bookingId}/status?status=${status}`);
      toast.success('Booking updated!');
      fetchBookings();
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-parchment pb-24">
      <Toaster position="top-center" richColors />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-maroon to-maroon-light px-4 pt-8 pb-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-white/70 text-sm">Welcome back,</p>
            <h1 className="font-cinzel text-xl font-bold text-white">{user?.name}</h1>
          </div>
          <button className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Bell className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/20 backdrop-blur rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-white">{stats.pending}</p>
            <p className="text-xs text-white/70">Pending</p>
          </div>
          <div className="bg-white/20 backdrop-blur rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-white">{stats.confirmed}</p>
            <p className="text-xs text-white/70">Confirmed</p>
          </div>
          <div className="bg-white/20 backdrop-blur rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-white">{stats.completed}</p>
            <p className="text-xs text-white/70">Completed</p>
          </div>
        </div>
      </div>

      {/* Bookings */}
      <div className="px-4 -mt-4">
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <h2 className="font-cinzel text-lg font-semibold text-maroon mb-4">Booking Requests</h2>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 text-saffron animate-spin" />
            </div>
          ) : bookings.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No bookings yet</p>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <motion.div
                  key={booking.id}
                  className="border border-orange-100 rounded-xl p-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-gray-800">{booking.service_name}</p>
                      <p className="text-sm text-gray-500">{booking.user_name}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        {new Date(booking.booking_date).toLocaleDateString()}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      booking.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      booking.status === 'completed' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {booking.status}
                    </span>
                  </div>

                  {booking.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateStatus(booking.id, 'confirmed')}
                        className="flex-1 bg-green-500 text-white rounded-lg py-2 text-sm flex items-center justify-center gap-1"
                      >
                        <CheckCircle className="w-4 h-4" /> Accept
                      </button>
                      <button
                        onClick={() => updateStatus(booking.id, 'cancelled')}
                        className="flex-1 bg-red-500 text-white rounded-lg py-2 text-sm flex items-center justify-center gap-1"
                      >
                        <XCircle className="w-4 h-4" /> Decline
                      </button>
                    </div>
                  )}

                  {booking.status === 'confirmed' && (
                    <button
                      onClick={() => updateStatus(booking.id, 'completed')}
                      className="w-full bg-saffron text-white rounded-lg py-2 text-sm"
                    >
                      Mark as Completed
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Logout */}
      <div className="px-4 mt-6">
        <button 
          onClick={logout}
          className="w-full bg-red-50 rounded-xl p-4 flex items-center justify-center gap-2 text-red-600"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-orange-100 px-4 py-3">
        <div className="flex justify-around">
          <button className="flex flex-col items-center text-saffron">
            <Home className="w-6 h-6" />
            <span className="text-xs mt-1">Home</span>
          </button>
          <button className="flex flex-col items-center text-gray-400">
            <Calendar className="w-6 h-6" />
            <span className="text-xs mt-1">Schedule</span>
          </button>
          <button className="flex flex-col items-center text-gray-400">
            <Settings className="w-6 h-6" />
            <span className="text-xs mt-1">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
