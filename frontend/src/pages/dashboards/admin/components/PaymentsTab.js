import React, { useState, useEffect } from 'react';
import { IndianRupee, TrendingUp, CreditCard, Wallet, ShoppingBag, BookOpen, Users, Calendar, ArrowDown, ArrowUp, Filter, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../../../lib/api';
import { toast } from 'sonner';

function StatCard({ icon: Icon, label, value, sub, color, iconBg }) {
  return (
    <div className="bg-white rounded-2xl p-4 lg:p-5 shadow-sm border border-orange-100">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        {sub && <span className="text-xs text-gray-500">{sub}</span>}
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}

function GatewayBar({ label, amount, count, total, color }) {
  const pct = total > 0 ? (amount / total) * 100 : 0;
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="font-medium text-gray-700 capitalize">{label}</span>
        <span className="text-gray-600">₹{amount.toLocaleString()} ({count} txns)</span>
      </div>
      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

const TYPE_LABELS = {
  wallet_recharge: 'Wallet Recharge',
  class_enrollment: 'Class Enrollment',
  order: 'Product Order',
  puja_booking: 'Puja Booking',
  general: 'General',
};

const STATUS_COLORS = {
  completed: 'bg-green-100 text-green-700',
  succeeded: 'bg-green-100 text-green-700',
  paid: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-purple-100 text-purple-700',
};

export function PaymentsTab({ isDesktop }) {
  const [dashboard, setDashboard] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [txTotal, setTxTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({ payment_type: '', gateway: '', status: '' });
  const [showFilters, setShowFilters] = useState(false);
  const LIMIT = 20;

  useEffect(() => { fetchDashboard(); }, []);
  useEffect(() => { fetchTransactions(); }, [page, filters]);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/api/admin/payments/dashboard');
      setDashboard(res.data);
    } catch (err) {
      toast.error('Failed to load payment dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    setTxLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('skip', page * LIMIT);
      params.set('limit', LIMIT);
      if (filters.payment_type) params.set('payment_type', filters.payment_type);
      if (filters.gateway) params.set('gateway', filters.gateway);
      if (filters.status) params.set('status', filters.status);
      const res = await api.get(`/api/admin/payments/transactions?${params}`);
      setTransactions(res.data.transactions || []);
      setTxTotal(res.data.total || 0);
    } catch (err) {
      toast.error('Failed to load transactions');
    } finally {
      setTxLoading(false);
    }
  };

  const refresh = () => { fetchDashboard(); fetchTransactions(); };

  const fmt = (v) => `₹${(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

  if (loading) {
    return (
      <div className={`pb-24 lg:pb-8 ${isDesktop ? 'px-8' : 'px-4'} pt-4`}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-orange-100 animate-pulse h-28" />
          ))}
        </div>
      </div>
    );
  }

  const s = dashboard?.summary || {};
  const byType = dashboard?.by_type || {};
  const gw = dashboard?.gateway_split || {};
  const payouts = dashboard?.provider_payouts || {};
  const gwTotal = Object.values(gw).reduce((a, b) => a + (b.total || 0), 0);

  return (
    <div className={`pb-24 lg:pb-8 ${isDesktop ? 'px-8' : 'px-4'} pt-4`} data-testid="payments-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-cinzel text-lg font-semibold text-gray-800">Payments Dashboard</h2>
        <button onClick={refresh} className="p-2 rounded-lg hover:bg-orange-100 transition-colors" data-testid="payments-refresh-btn">
          <RefreshCw className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Revenue Summary */}
      <div className={`grid ${isDesktop ? 'grid-cols-4' : 'grid-cols-2'} gap-4 mb-6`}>
        <StatCard icon={IndianRupee} label="Total Revenue" value={fmt(s.total_revenue)} color="text-green-600" iconBg="bg-green-50" />
        <StatCard icon={TrendingUp} label="This Month" value={fmt(s.month_revenue)} sub="month" color="text-blue-600" iconBg="bg-blue-50" />
        <StatCard icon={CreditCard} label="Platform Fees" value={fmt(s.platform_fees_earned)} sub={`${s.platform_fee_pct}%`} color="text-saffron" iconBg="bg-orange-50" />
        <StatCard icon={IndianRupee} label="GST Collected" value={fmt(s.gst_collected)} sub={`${s.gst_pct}%`} color="text-purple-600" iconBg="bg-purple-50" />
      </div>

      {/* Time-period cards */}
      <div className={`grid ${isDesktop ? 'grid-cols-3' : 'grid-cols-3'} gap-3 mb-6`}>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-orange-100 text-center">
          <p className="text-xs text-gray-500">Today</p>
          <p className="text-lg font-bold text-gray-800">{fmt(s.today_revenue)}</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-orange-100 text-center">
          <p className="text-xs text-gray-500">This Week</p>
          <p className="text-lg font-bold text-gray-800">{fmt(s.week_revenue)}</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-orange-100 text-center">
          <p className="text-xs text-gray-500">This Month</p>
          <p className="text-lg font-bold text-gray-800">{fmt(s.month_revenue)}</p>
        </div>
      </div>

      {/* Revenue by Type + Gateway Split */}
      <div className={`grid ${isDesktop ? 'grid-cols-2' : 'grid-cols-1'} gap-4 mb-6`}>
        {/* Revenue by Type */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-orange-100">
          <h3 className="font-semibold text-gray-800 mb-4">Revenue by Type</h3>
          <div className="space-y-3">
            {[
              { icon: ShoppingBag, label: 'Product Orders', data: byType.orders, color: 'text-green-600' },
              { icon: Calendar, label: 'Puja Bookings', data: byType.bookings, color: 'text-blue-600' },
              { icon: BookOpen, label: 'Class Enrollments', data: byType.classes, color: 'text-purple-600' },
              { icon: Wallet, label: 'Wallet Recharges', data: byType.wallet_recharges, color: 'text-saffron' },
            ].map(({ icon: I, label, data, color }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <I className={`w-4 h-4 ${color}`} />
                  <span className="text-sm text-gray-700">{label}</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-gray-800">{fmt(data?.total)}</span>
                  <span className="text-xs text-gray-500 ml-2">({data?.count || 0})</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gateway Split */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-orange-100">
          <h3 className="font-semibold text-gray-800 mb-4">Gateway Split</h3>
          {Object.keys(gw).length > 0 ? (
            <>
              {gw.stripe && <GatewayBar label="Stripe" amount={gw.stripe.total} count={gw.stripe.count} total={gwTotal} color="bg-blue-500" />}
              {gw.razorpay && <GatewayBar label="Razorpay" amount={gw.razorpay.total} count={gw.razorpay.count} total={gwTotal} color="bg-green-500" />}
              {Object.entries(gw).filter(([k]) => k !== 'stripe' && k !== 'razorpay').map(([k, v]) => (
                <GatewayBar key={k} label={k} amount={v.total} count={v.count} total={gwTotal} color="bg-gray-400" />
              ))}
            </>
          ) : (
            <p className="text-sm text-gray-500">No gateway data yet</p>
          )}

          {/* Provider Payouts Summary */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <h4 className="font-medium text-gray-700 mb-2">Pending Payouts</h4>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">Total due to providers</span>
              <span className="font-bold text-red-600">{fmt(payouts.total_due)}</span>
            </div>
            <div className="flex gap-4 text-xs text-gray-500 mt-1">
              <span>{payouts.shop_owners} shop owner(s)</span>
              <span>{payouts.priests} priest(s)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Recent Transactions</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${showFilters ? 'bg-saffron/20 text-saffron-dark' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            data-testid="payments-filter-btn"
          >
            <Filter className="w-4 h-4" /> Filters
          </button>
        </div>

        {/* Filters Row */}
        {showFilters && (
          <div className="p-4 bg-orange-50/50 border-b border-gray-100 flex flex-wrap gap-3">
            <select
              value={filters.payment_type}
              onChange={e => { setFilters(f => ({ ...f, payment_type: e.target.value })); setPage(0); }}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm bg-white"
              data-testid="filter-payment-type"
            >
              <option value="">All Types</option>
              <option value="wallet_recharge">Wallet Recharge</option>
              <option value="class_enrollment">Class Enrollment</option>
              <option value="order">Product Order</option>
              <option value="puja_booking">Puja Booking</option>
            </select>
            <select
              value={filters.gateway}
              onChange={e => { setFilters(f => ({ ...f, gateway: e.target.value })); setPage(0); }}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm bg-white"
              data-testid="filter-gateway"
            >
              <option value="">All Gateways</option>
              <option value="stripe">Stripe</option>
              <option value="razorpay">Razorpay</option>
            </select>
            <select
              value={filters.status}
              onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPage(0); }}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm bg-white"
              data-testid="filter-status"
            >
              <option value="">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="transactions-table">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left font-medium">User</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Gateway</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
                <th className="px-4 py-3 text-center font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {txLoading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No transactions found</td></tr>
              ) : (
                transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-orange-50/30">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{tx.user_name}</p>
                      <p className="text-xs text-gray-500">{tx.user_email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{TYPE_LABELS[tx.payment_type] || tx.payment_type}</td>
                    <td className="px-4 py-3 capitalize text-gray-700">{tx.payment_method}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-800">₹{tx.amount}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[tx.payment_status] || 'bg-gray-100 text-gray-600'}`}>
                        {tx.payment_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500 text-xs">
                      {tx.created_at ? new Date(tx.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {page * LIMIT + 1}-{Math.min((page + 1) * LIMIT, txTotal)} of {txTotal}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
              data-testid="payments-prev-page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={(page + 1) * LIMIT >= txTotal}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
              data-testid="payments-next-page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
