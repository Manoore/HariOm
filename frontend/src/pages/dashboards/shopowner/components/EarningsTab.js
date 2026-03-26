import React, { useState, useEffect } from 'react';
import { 
  DollarSign, TrendingUp, ArrowUpRight, Loader2,
  Wallet, Receipt, Calendar, Package
} from 'lucide-react';
import api from '../../../../lib/api';
import { toast } from 'sonner';

export function EarningsTab({ isDesktop }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      const res = await api.get('/api/shop/earnings');
      setData(res.data);
    } catch (error) {
      toast.error('Failed to load earnings');
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

  if (!data) return null;

  return (
    <div className="p-4 lg:p-8 pb-24 lg:pb-8" data-testid="shop-earnings-tab">
      <div className="mb-6">
        <h1 className="font-cinzel text-2xl font-bold text-maroon">Earnings & Payouts</h1>
        <p className="text-gray-500 text-sm">Track your revenue, fees, and net earnings</p>
      </div>

      {/* Summary Cards */}
      <div className={`grid ${isDesktop ? 'grid-cols-4' : 'grid-cols-2'} gap-4 mb-8`}>
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-4 text-white" data-testid="total-earnings-card">
          <DollarSign className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-2xl font-bold">₹{data.net_earnings?.toLocaleString()}</p>
          <p className="text-sm opacity-80">Net Earnings</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-4 text-white" data-testid="month-revenue-card">
          <TrendingUp className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-2xl font-bold">₹{data.month_revenue?.toLocaleString()}</p>
          <p className="text-sm opacity-80">This Month</p>
        </div>
        <div className="bg-gradient-to-br from-saffron to-orange-600 rounded-2xl p-4 text-white" data-testid="pending-payout-card">
          <Wallet className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-2xl font-bold">₹{data.pending_payout?.toLocaleString()}</p>
          <p className="text-sm opacity-80">Pending Payout</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl p-4 text-white">
          <Package className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-2xl font-bold">{data.total_orders}</p>
          <p className="text-sm opacity-80">Total Orders</p>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className={`${isDesktop ? 'grid grid-cols-2 gap-8' : ''}`}>
        {/* Period Breakdown */}
        <div className="bg-white rounded-2xl p-6 border border-orange-100 mb-6">
          <h2 className="font-cinzel text-lg font-semibold text-maroon mb-4">Revenue Breakdown</h2>
          <div className="space-y-4">
            {[
              { label: 'Today', amount: data.today_revenue, orders: data.today_orders, color: 'text-green-600' },
              { label: 'This Week', amount: data.week_revenue, orders: data.week_orders, color: 'text-blue-600' },
              { label: 'This Month', amount: data.month_revenue, orders: data.month_orders, color: 'text-indigo-600' },
              { label: 'All Time', amount: data.total_revenue, orders: data.total_orders, color: 'text-saffron' },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-medium text-gray-800">{row.label}</p>
                  <p className="text-xs text-gray-500">{row.orders} orders</p>
                </div>
                <p className={`font-bold text-lg ${row.color}`}>
                  ₹{row.amount?.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Fee Breakdown */}
        <div className="bg-white rounded-2xl p-6 border border-orange-100 mb-6">
          <h2 className="font-cinzel text-lg font-semibold text-maroon mb-4">Fee Summary</h2>
          <div className="space-y-4">
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Gross Revenue</span>
              <span className="font-semibold">₹{data.total_revenue?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Platform Fee ({data.platform_fee_pct}%)</span>
              <span className="text-red-500">-₹{data.platform_fee?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">GST on Fee ({data.gst_pct}%)</span>
              <span className="text-red-500">-₹{data.gst_on_fee?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-3 pt-3 border-t-2 border-gray-200">
              <span className="font-bold text-gray-800">Net Earnings</span>
              <span className="font-bold text-green-600 text-lg">₹{data.net_earnings?.toLocaleString()}</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Payouts are processed after order delivery. Contact support for payout queries.
          </p>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl p-6 border border-orange-100">
        <h2 className="font-cinzel text-lg font-semibold text-maroon mb-4">Recent Transactions</h2>
        {data.transactions?.length === 0 ? (
          <div className="text-center py-8">
            <Receipt className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.transactions?.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                    <ArrowUpRight className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Order #{t.order_number}</p>
                    <p className="text-xs text-gray-500">
                      {t.items_count} items - {new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">+₹{t.net_amount}</p>
                  <p className="text-xs text-gray-400">Fee: ₹{t.platform_fee}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
