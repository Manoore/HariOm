import React from 'react';
import { Users, Star, ShoppingBag, Calendar, AlertCircle } from 'lucide-react';

export function OverviewTab({ stats, users, isDesktop, loading }) {
  return (
    <div className={`pb-24 lg:pb-8 ${isDesktop ? 'px-8' : 'px-4'}`}>
      {/* Stats Grid */}
      <div className="pt-4 mb-6">
        <h2 className="font-cinzel text-lg font-semibold text-gray-800 mb-4">Dashboard Overview</h2>
        <div className={`grid ${isDesktop ? 'grid-cols-4' : 'grid-cols-2'} gap-4`}>
          <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-orange-100">
            <Users className="w-8 h-8 text-saffron mb-2" />
            <p className="text-2xl lg:text-3xl font-bold text-gray-800">
              {loading ? <span className="animate-pulse">...</span> : (stats?.total_users || 0)}
            </p>
            <p className="text-gray-500 text-sm">Total Users</p>
          </div>
          <div className="bg-white shadow-sm border border-orange-100 rounded-2xl p-4 lg:p-6">
            <Star className="w-8 h-8 text-yellow-400 mb-2" />
            <p className="text-2xl lg:text-3xl font-bold text-gray-800">
              {loading ? <span className="animate-pulse">...</span> : (stats?.total_priests || 0)}
            </p>
            <p className="text-gray-500 text-sm">Priests</p>
          </div>
          <div className="bg-white shadow-sm border border-orange-100 rounded-2xl p-4 lg:p-6">
            <ShoppingBag className="w-8 h-8 text-green-400 mb-2" />
            <p className="text-2xl lg:text-3xl font-bold text-gray-800">
              {loading ? <span className="animate-pulse">...</span> : (stats?.total_products || 0)}
            </p>
            <p className="text-gray-500 text-sm">Products</p>
          </div>
          <div className="bg-white shadow-sm border border-orange-100 rounded-2xl p-4 lg:p-6">
            <Calendar className="w-8 h-8 text-orange-400 mb-2" />
            <p className="text-2xl lg:text-3xl font-bold text-gray-800">
              {loading ? <span className="animate-pulse">...</span> : (stats?.total_bookings || 0)}
            </p>
            <p className="text-gray-500 text-sm">Bookings</p>
          </div>
        </div>
      </div>

      {/* Pending Verifications */}
      {stats?.pending_verifications > 0 && (
        <div className="mb-6">
          <div className="bg-orange-100 border-2 border-orange-500 rounded-2xl p-4 flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-orange-600" />
            <div>
              <p className="text-orange-900 font-bold text-base">{stats.pending_verifications} pending verifications</p>
              <p className="text-orange-800 text-sm">Review priest applications in the Approvals tab</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Users */}
      <div>
        <h2 className="font-cinzel text-lg font-semibold text-gray-800 mb-4">Recent Users</h2>
        <div className={`${isDesktop ? 'grid grid-cols-2 gap-4' : 'space-y-3'}`}>
          {users.slice(0, isDesktop ? 8 : 5).map((u) => (
            <div key={u.id} className="bg-white shadow-sm border border-orange-100 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-saffron/30 rounded-full flex items-center justify-center text-indigo-300 font-semibold">
                  {u.name?.charAt(0)}
                </div>
                <div>
                  <p className="text-gray-800 font-medium">{u.name}</p>
                  <p className="text-gray-500 text-xs">{u.email}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs bg-saffron/30 text-indigo-300 px-2 py-1 rounded-full">
                  {u.role}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
