import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Star, ShoppingBag, Calendar, Settings, LogOut,
  ChevronRight, CheckCircle, AlertCircle, Loader2, TrendingUp
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { Toaster, toast } from 'sonner';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/admin/users')
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data.users || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F172A] to-[#1E293B] pb-24">
      <Toaster position="top-center" richColors />
      
      {/* Header */}
      <div className="px-4 pt-8 pb-6">
        <p className="text-gray-400 text-sm">Admin Dashboard</p>
        <h1 className="font-cinzel text-2xl font-bold text-white">{user?.name}</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="px-4 mb-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/50 rounded-2xl p-4">
                <Users className="w-8 h-8 text-indigo-400 mb-2" />
                <p className="text-2xl font-bold text-white">{stats?.total_users || 0}</p>
                <p className="text-gray-400 text-sm">Total Users</p>
              </div>
              <div className="bg-slate-800/50 rounded-2xl p-4">
                <Star className="w-8 h-8 text-yellow-400 mb-2" />
                <p className="text-2xl font-bold text-white">{stats?.total_priests || 0}</p>
                <p className="text-gray-400 text-sm">Priests</p>
              </div>
              <div className="bg-slate-800/50 rounded-2xl p-4">
                <ShoppingBag className="w-8 h-8 text-green-400 mb-2" />
                <p className="text-2xl font-bold text-white">{stats?.total_products || 0}</p>
                <p className="text-gray-400 text-sm">Products</p>
              </div>
              <div className="bg-slate-800/50 rounded-2xl p-4">
                <Calendar className="w-8 h-8 text-orange-400 mb-2" />
                <p className="text-2xl font-bold text-white">{stats?.total_bookings || 0}</p>
                <p className="text-gray-400 text-sm">Bookings</p>
              </div>
            </div>
          </div>

          {/* Pending Verifications */}
          {stats?.pending_verifications > 0 && (
            <div className="px-4 mb-6">
              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-2xl p-4 flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-yellow-400" />
                <div>
                  <p className="text-yellow-200 font-semibold">{stats.pending_verifications} pending verifications</p>
                  <p className="text-yellow-200/70 text-sm">Review priest applications</p>
                </div>
              </div>
            </div>
          )}

          {/* Recent Users */}
          <div className="px-4">
            <h2 className="font-cinzel text-lg font-semibold text-white mb-4">Recent Users</h2>
            <div className="space-y-3">
              {users.slice(0, 8).map((u) => (
                <div key={u.id} className="bg-slate-800/50 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-500/30 rounded-full flex items-center justify-center text-indigo-300 font-semibold">
                      {u.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-white font-medium">{u.name}</p>
                      <p className="text-gray-400 text-xs">{u.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs bg-indigo-500/30 text-indigo-300 px-2 py-1 rounded-full">
                      {u.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Logout */}
      <div className="px-4 mt-6">
        <button 
          onClick={logout}
          className="w-full bg-red-500/20 rounded-xl p-4 flex items-center justify-center gap-2 text-red-400"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
