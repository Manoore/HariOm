import React, { useState, useEffect } from 'react';
import { 
  DollarSign, TrendingUp, ShoppingBag, Package, 
  AlertTriangle, Store, Loader2 
} from 'lucide-react';
import api from '../../../../lib/api';
import { toast } from 'sonner';

export function DashboardTab({ isDesktop }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/api/shop/dashboard');
      setStats(res.data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 text-saffron animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="font-semibold text-gray-700 mb-2">Shop Not Found</h3>
        <p className="text-gray-500">Please register your shop first.</p>
      </div>
    );
  }

  return (
    <div className={`p-4 lg:p-8 pb-24 lg:pb-8`}>
      <div className="mb-6">
        <h1 className="font-cinzel text-2xl font-bold text-maroon">Dashboard</h1>
        <p className="text-gray-500 text-sm">Welcome back! Here's your shop overview</p>
      </div>

      {/* Stats Grid */}
      <div className={`grid ${isDesktop ? 'grid-cols-4' : 'grid-cols-2'} gap-4 mb-8`}>
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-4 text-white">
          <DollarSign className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-2xl font-bold">₹{stats.stats.today_revenue?.toLocaleString() || 0}</p>
          <p className="text-sm opacity-80">Today's Revenue</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-4 text-white">
          <TrendingUp className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-2xl font-bold">₹{stats.stats.monthly_revenue?.toLocaleString() || 0}</p>
          <p className="text-sm opacity-80">This Month</p>
        </div>
        <div className="bg-gradient-to-br from-saffron to-orange-600 rounded-2xl p-4 text-white">
          <ShoppingBag className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-2xl font-bold">{stats.stats.pending_orders + stats.stats.processing_orders}</p>
          <p className="text-sm opacity-80">Pending Orders</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl p-4 text-white">
          <Package className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-2xl font-bold">{stats.stats.total_products}</p>
          <p className="text-sm opacity-80">Products</p>
        </div>
      </div>

      {/* Low Stock Alert */}
      {stats.stats.low_stock > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-red-500" />
          <div>
            <p className="font-medium text-red-800">{stats.stats.low_stock} products low on stock</p>
            <p className="text-sm text-red-600">Check inventory to restock items</p>
          </div>
        </div>
      )}

      <div className={`${isDesktop ? 'grid grid-cols-2 gap-8' : ''}`}>
        {/* Recent Orders */}
        <div className="mb-6">
          <h2 className="font-cinzel text-lg font-semibold text-maroon mb-4">Recent Orders</h2>
          {stats.recent_orders.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center border border-orange-50">
              <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400">No orders yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recent_orders.map((order) => (
                <div key={order.id} className="bg-white rounded-xl p-4 border border-orange-50 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-800">#{order.order_number}</p>
                      <p className="text-sm text-gray-500">{order.customer_name}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                      order.status === 'shipping' ? 'bg-orange-100 text-orange-700' :
                      order.status === 'processing' ? 'bg-purple-100 text-purple-700' :
                      order.status === 'accepted' ? 'bg-cyan-100 text-cyan-700' :
                      order.status === 'received' ? 'bg-blue-100 text-blue-700' :
                      order.status === 'paid' ? 'bg-indigo-100 text-indigo-700' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">{order.items_count} items</span>
                    <span className="font-semibold text-saffron">₹{order.total}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="mb-6">
          <h2 className="font-cinzel text-lg font-semibold text-maroon mb-4">Top Selling Products</h2>
          {stats.top_products.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center border border-orange-50">
              <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400">No sales data yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.top_products.map((product, idx) => (
                <div key={product.id} className="bg-white rounded-xl p-4 border border-orange-50 shadow-sm flex items-center gap-4">
                  <div className="w-8 h-8 bg-saffron/10 rounded-full flex items-center justify-center text-saffron font-bold">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.sold} sold</p>
                  </div>
                  <p className="font-semibold text-green-600">₹{product.revenue}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
