import React, { useState, useEffect } from 'react';
import { IndianRupee, TrendingUp, CreditCard, Wallet, ShoppingBag, BookOpen, Users, Calendar, Filter, RefreshCw, ChevronLeft, ChevronRight, CheckCircle, Clock, Ban, ArrowDownRight, Edit3, Save, X } from 'lucide-react';
import api from '../../../../lib/api';
import { toast } from 'sonner';

// ===================== STAT CARD =====================
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

const fmt = (v) => `₹${(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const TYPE_LABELS = { wallet_recharge: 'Wallet Recharge', class_enrollment: 'Class Enrollment', order: 'Product Order', puja_booking: 'Puja Booking', general: 'General' };
const STATUS_COLORS = { completed: 'bg-green-100 text-green-700', succeeded: 'bg-green-100 text-green-700', paid: 'bg-green-100 text-green-700', pending: 'bg-yellow-100 text-yellow-700', failed: 'bg-red-100 text-red-700', refunded: 'bg-purple-100 text-purple-700' };
const PROVIDER_COLORS = { priest: 'bg-blue-100 text-blue-700', shop_owner: 'bg-green-100 text-green-700', astrologer: 'bg-purple-100 text-purple-700' };
const PROVIDER_LABELS = { priest: 'Priest', shop_owner: 'Shop Owner', astrologer: 'Astrologer' };

// ===================== DASHBOARD SUB-TAB =====================
function DashboardView({ isDesktop }) {
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
    try { const res = await api.get('/api/admin/payments/dashboard'); setDashboard(res.data); }
    catch { toast.error('Failed to load dashboard'); }
    finally { setLoading(false); }
  };

  const fetchTransactions = async () => {
    setTxLoading(true);
    try {
      const params = new URLSearchParams({ skip: page * LIMIT, limit: LIMIT });
      if (filters.payment_type) params.set('payment_type', filters.payment_type);
      if (filters.gateway) params.set('gateway', filters.gateway);
      if (filters.status) params.set('status', filters.status);
      const res = await api.get(`/api/admin/payments/transactions?${params}`);
      setTransactions(res.data.transactions || []); setTxTotal(res.data.total || 0);
    } catch { toast.error('Failed to load transactions'); }
    finally { setTxLoading(false); }
  };

  if (loading) return <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-orange-100 animate-pulse h-28" />)}</div>;

  const s = dashboard?.summary || {};
  const byType = dashboard?.by_type || {};
  const gw = dashboard?.gateway_split || {};
  const payouts = dashboard?.provider_payouts || {};
  const gwTotal = Object.values(gw).reduce((a, b) => a + (b.total || 0), 0);

  return (
    <>
      <div className={`grid ${isDesktop ? 'grid-cols-4' : 'grid-cols-2'} gap-4 mb-6`}>
        <StatCard icon={IndianRupee} label="Total Revenue" value={fmt(s.total_revenue)} color="text-green-600" iconBg="bg-green-50" />
        <StatCard icon={TrendingUp} label="This Month" value={fmt(s.month_revenue)} sub="month" color="text-blue-600" iconBg="bg-blue-50" />
        <StatCard icon={CreditCard} label="Platform Fees" value={fmt(s.platform_fees_earned)} sub={`${s.platform_fee_pct}%`} color="text-saffron" iconBg="bg-orange-50" />
        <StatCard icon={IndianRupee} label="GST Collected" value={fmt(s.gst_collected)} sub={`${s.gst_pct}%`} color="text-purple-600" iconBg="bg-purple-50" />
      </div>

      <div className={`grid ${isDesktop ? 'grid-cols-3' : 'grid-cols-3'} gap-3 mb-6`}>
        {[{ l: 'Today', v: s.today_revenue }, { l: 'This Week', v: s.week_revenue }, { l: 'This Month', v: s.month_revenue }].map(x => (
          <div key={x.l} className="bg-white rounded-xl p-3 shadow-sm border border-orange-100 text-center">
            <p className="text-xs text-gray-500">{x.l}</p>
            <p className="text-lg font-bold text-gray-800">{fmt(x.v)}</p>
          </div>
        ))}
      </div>

      <div className={`grid ${isDesktop ? 'grid-cols-2' : 'grid-cols-1'} gap-4 mb-6`}>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-orange-100">
          <h3 className="font-semibold text-gray-800 mb-4">Revenue by Type</h3>
          {[
            { icon: ShoppingBag, label: 'Product Orders', data: byType.orders, color: 'text-green-600' },
            { icon: Calendar, label: 'Puja Bookings', data: byType.bookings, color: 'text-blue-600' },
            { icon: BookOpen, label: 'Class Enrollments', data: byType.classes, color: 'text-purple-600' },
            { icon: Wallet, label: 'Wallet Recharges', data: byType.wallet_recharges, color: 'text-saffron' },
          ].map(({ icon: I, label, data, color }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-3"><I className={`w-4 h-4 ${color}`} /><span className="text-sm text-gray-700">{label}</span></div>
              <div className="text-right"><span className="font-semibold text-gray-800">{fmt(data?.total)}</span><span className="text-xs text-gray-500 ml-2">({data?.count || 0})</span></div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-orange-100">
          <h3 className="font-semibold text-gray-800 mb-4">Gateway Split</h3>
          {Object.keys(gw).length > 0 ? (
            <>
              {gw.stripe && <GatewayBar label="Stripe" amount={gw.stripe.total} count={gw.stripe.count} total={gwTotal} color="bg-blue-500" />}
              {gw.razorpay && <GatewayBar label="Razorpay" amount={gw.razorpay.total} count={gw.razorpay.count} total={gwTotal} color="bg-green-500" />}
            </>
          ) : <p className="text-sm text-gray-500">No gateway data yet</p>}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <h4 className="font-medium text-gray-700 mb-2">Pending Payouts</h4>
            <div className="flex items-center justify-between text-sm"><span className="text-gray-600">Total due to providers</span><span className="font-bold text-red-600">{fmt(payouts.total_due)}</span></div>
            <div className="flex gap-4 text-xs text-gray-500 mt-1"><span>{payouts.shop_owners} shop owner(s)</span><span>{payouts.priests} priest(s)</span></div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Recent Transactions</h3>
          <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${showFilters ? 'bg-saffron/20 text-saffron-dark' : 'bg-gray-100 text-gray-600'}`} data-testid="payments-filter-btn"><Filter className="w-4 h-4" /> Filters</button>
        </div>
        {showFilters && (
          <div className="p-4 bg-orange-50/50 border-b border-gray-100 flex flex-wrap gap-3">
            <select value={filters.payment_type} onChange={e => { setFilters(f => ({ ...f, payment_type: e.target.value })); setPage(0); }} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm bg-white" data-testid="filter-payment-type">
              <option value="">All Types</option><option value="wallet_recharge">Wallet Recharge</option><option value="class_enrollment">Class</option><option value="order">Order</option><option value="puja_booking">Booking</option>
            </select>
            <select value={filters.gateway} onChange={e => { setFilters(f => ({ ...f, gateway: e.target.value })); setPage(0); }} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm bg-white" data-testid="filter-gateway">
              <option value="">All Gateways</option><option value="stripe">Stripe</option><option value="razorpay">Razorpay</option>
            </select>
            <select value={filters.status} onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPage(0); }} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm bg-white" data-testid="filter-status">
              <option value="">All Statuses</option><option value="completed">Completed</option><option value="pending">Pending</option><option value="failed">Failed</option>
            </select>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="transactions-table">
            <thead className="bg-gray-50 text-gray-600"><tr><th className="px-4 py-3 text-left font-medium">User</th><th className="px-4 py-3 text-left font-medium">Type</th><th className="px-4 py-3 text-left font-medium">Gateway</th><th className="px-4 py-3 text-right font-medium">Amount</th><th className="px-4 py-3 text-center font-medium">Status</th><th className="px-4 py-3 text-right font-medium">Date</th></tr></thead>
            <tbody className="divide-y divide-gray-50">
              {txLoading ? <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
              : transactions.length === 0 ? <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No transactions found</td></tr>
              : transactions.map(tx => (
                <tr key={tx.id} className="hover:bg-orange-50/30">
                  <td className="px-4 py-3"><p className="font-medium text-gray-800">{tx.user_name}</p><p className="text-xs text-gray-500">{tx.user_email}</p></td>
                  <td className="px-4 py-3 text-gray-700">{TYPE_LABELS[tx.payment_type] || tx.payment_type}</td>
                  <td className="px-4 py-3 capitalize text-gray-700">{tx.payment_method}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-800">₹{tx.amount}</td>
                  <td className="px-4 py-3 text-center"><span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[tx.payment_status] || 'bg-gray-100 text-gray-600'}`}>{tx.payment_status}</span></td>
                  <td className="px-4 py-3 text-right text-gray-500 text-xs">{tx.created_at ? new Date(tx.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">Showing {Math.min(page * LIMIT + 1, txTotal)}-{Math.min((page + 1) * LIMIT, txTotal)} of {txTotal}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * LIMIT >= txTotal} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </>
  );
}

// ===================== PAYOUTS SUB-TAB =====================
function PayoutsView({ isDesktop }) {
  const [splitConfig, setSplitConfig] = useState(null);
  const [pendingPayouts, setPendingPayouts] = useState(null);
  const [payoutHistory, setPayoutHistory] = useState([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editConfig, setEditConfig] = useState({});
  const [payModal, setPayModal] = useState(null);
  const [payForm, setPayForm] = useState({ reference: '', payment_mode: 'bank_transfer', notes: '' });
  const [processing, setProcessing] = useState(false);
  const [view, setView] = useState('pending');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [configRes, pendingRes, historyRes] = await Promise.all([
        api.get('/api/admin/payouts/split-config'),
        api.get('/api/admin/payouts/pending'),
        api.get('/api/admin/payouts/history'),
      ]);
      setSplitConfig(configRes.data);
      setEditConfig(JSON.parse(JSON.stringify(configRes.data)));
      setPendingPayouts(pendingRes.data);
      setPayoutHistory(historyRes.data.payouts || []);
      setHistoryTotal(historyRes.data.total || 0);
    } catch { toast.error('Failed to load payout data'); }
    finally { setLoading(false); }
  };

  const saveSplitConfig = async () => {
    try {
      await api.put('/api/admin/payouts/split-config', editConfig);
      setSplitConfig(JSON.parse(JSON.stringify(editConfig)));
      setEditing(false);
      toast.success('Split configuration saved!');
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed to save'); }
  };

  const recordPayout = async () => {
    if (!payModal) return;
    setProcessing(true);
    try {
      await api.post('/api/admin/payouts/record', {
        provider_id: payModal.provider_id,
        provider_type: payModal.provider_type,
        amount: payModal.pending_amount,
        ...payForm,
      });
      toast.success(`Payout of ${fmt(payModal.pending_amount)} recorded!`);
      setPayModal(null);
      setPayForm({ reference: '', payment_mode: 'bank_transfer', notes: '' });
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed to record payout'); }
    finally { setProcessing(false); }
  };

  if (loading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-orange-100 animate-pulse h-20" />)}</div>;

  return (
    <>
      {/* Split Config */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-orange-100 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Platform Fee Split Configuration</h3>
          {!editing ? (
            <button onClick={() => setEditing(true)} className="flex items-center gap-1 px-3 py-1.5 bg-saffron/10 text-saffron-dark rounded-lg text-sm hover:bg-saffron/20" data-testid="edit-split-btn"><Edit3 className="w-4 h-4" /> Edit</button>
          ) : (
            <div className="flex gap-2">
              <button onClick={saveSplitConfig} className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200" data-testid="save-split-btn"><Save className="w-4 h-4" /> Save</button>
              <button onClick={() => { setEditing(false); setEditConfig(JSON.parse(JSON.stringify(splitConfig))); }} className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"><X className="w-4 h-4" /></button>
            </div>
          )}
        </div>
        <div className={`grid ${isDesktop ? 'grid-cols-3' : 'grid-cols-1'} gap-4`}>
          {['priest', 'shop_owner', 'astrologer'].map(role => (
            <div key={role} className="border border-gray-100 rounded-xl p-4">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PROVIDER_COLORS[role]}`}>{PROVIDER_LABELS[role]}</span>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Platform Fee</span>
                  {editing ? (
                    <div className="flex items-center gap-1">
                      <input type="number" min={0} max={50} value={editConfig[role]?.platform_fee_pct || 0} onChange={e => setEditConfig(c => ({ ...c, [role]: { ...c[role], platform_fee_pct: parseFloat(e.target.value) || 0 } }))}
                        className="w-16 px-2 py-1 border border-gray-200 rounded text-sm text-right" data-testid={`split-${role}-fee`} />
                      <span className="text-sm text-gray-500">%</span>
                    </div>
                  ) : <span className="font-semibold text-gray-800">{splitConfig?.[role]?.platform_fee_pct || 0}%</span>}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">GST</span>
                  {editing ? (
                    <div className="flex items-center gap-1">
                      <input type="number" min={0} max={50} value={editConfig[role]?.gst_pct || 0} onChange={e => setEditConfig(c => ({ ...c, [role]: { ...c[role], gst_pct: parseFloat(e.target.value) || 0 } }))}
                        className="w-16 px-2 py-1 border border-gray-200 rounded text-sm text-right" data-testid={`split-${role}-gst`} />
                      <span className="text-sm text-gray-500">%</span>
                    </div>
                  ) : <span className="font-semibold text-gray-800">{splitConfig?.[role]?.gst_pct || 0}%</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setView('pending')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'pending' ? 'bg-saffron text-white' : 'bg-gray-100 text-gray-600'}`} data-testid="payouts-pending-tab">Pending ({pendingPayouts?.count || 0})</button>
        <button onClick={() => setView('history')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'history' ? 'bg-saffron text-white' : 'bg-gray-100 text-gray-600'}`} data-testid="payouts-history-tab">History ({historyTotal})</button>
      </div>

      {/* Pending Payouts */}
      {view === 'pending' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total pending: <span className="font-bold text-red-600">{fmt(pendingPayouts?.total_pending)}</span></p>
          </div>
          {(pendingPayouts?.providers || []).map(p => (
            <div key={`${p.provider_type}-${p.provider_id}`} className="bg-white rounded-2xl p-4 shadow-sm border border-orange-100" data-testid={`payout-card-${p.provider_id}`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PROVIDER_COLORS[p.provider_type]}`}>{PROVIDER_LABELS[p.provider_type]}</span>
                    <span className="font-semibold text-gray-800">{p.name}</span>
                  </div>
                  <p className="text-xs text-gray-500">{p.email || 'No email'} | {p.transaction_count} transactions</p>
                </div>
                <button onClick={() => setPayModal(p)} className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors" data-testid={`pay-btn-${p.provider_id}`}>
                  Mark Paid
                </button>
              </div>
              <div className={`grid ${isDesktop ? 'grid-cols-4' : 'grid-cols-2'} gap-3 text-sm`}>
                <div><p className="text-gray-500">Gross</p><p className="font-semibold">{fmt(p.gross_earnings)}</p></div>
                <div><p className="text-gray-500">Fee ({p.platform_fee_pct}%)</p><p className="font-semibold text-red-600">-{fmt(p.platform_fee)}</p></div>
                <div><p className="text-gray-500">Already Paid</p><p className="font-semibold text-green-600">{fmt(p.already_paid)}</p></div>
                <div><p className="text-gray-500">Pending</p><p className="font-bold text-lg text-orange-600">{fmt(p.pending_amount)}</p></div>
              </div>
            </div>
          ))}
          {(pendingPayouts?.providers || []).length === 0 && <p className="text-center text-gray-400 py-8">No pending payouts</p>}
        </div>
      )}

      {/* Payout History */}
      {view === 'history' && (
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="payout-history-table">
              <thead className="bg-gray-50 text-gray-600"><tr><th className="px-4 py-3 text-left font-medium">Provider</th><th className="px-4 py-3 text-right font-medium">Amount</th><th className="px-4 py-3 text-left font-medium">Mode</th><th className="px-4 py-3 text-left font-medium">Reference</th><th className="px-4 py-3 text-left font-medium">By</th><th className="px-4 py-3 text-right font-medium">Date</th></tr></thead>
              <tbody className="divide-y divide-gray-50">
                {payoutHistory.length === 0 ? <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No payout history yet</td></tr> :
                payoutHistory.map(p => (
                  <tr key={p.id} className="hover:bg-orange-50/30">
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PROVIDER_COLORS[p.provider_type] || 'bg-gray-100'}`}>{PROVIDER_LABELS[p.provider_type] || p.provider_type}</span></td>
                    <td className="px-4 py-3 text-right font-semibold text-green-700">{fmt(p.amount)}</td>
                    <td className="px-4 py-3 capitalize text-gray-700">{(p.payment_mode || '').replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs font-mono">{p.reference || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{p.recorded_by_name}</td>
                    <td className="px-4 py-3 text-right text-gray-500 text-xs">{p.created_at ? new Date(p.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pay Modal */}
      {payModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setPayModal(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()} data-testid="record-payout-modal">
            <h3 className="font-cinzel text-lg font-semibold text-gray-800 mb-1">Record Payout</h3>
            <p className="text-sm text-gray-500 mb-4">Mark payment to <strong>{payModal.name}</strong></p>
            <div className="bg-orange-50 rounded-xl p-3 mb-4">
              <div className="flex items-center justify-between"><span className="text-sm text-gray-600">Amount</span><span className="text-xl font-bold text-green-700">{fmt(payModal.pending_amount)}</span></div>
            </div>
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Payment Mode</label>
                <select value={payForm.payment_mode} onChange={e => setPayForm(f => ({ ...f, payment_mode: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" data-testid="payout-payment-mode">
                  <option value="bank_transfer">Bank Transfer (NEFT/IMPS/RTGS)</option>
                  <option value="upi">UPI</option>
                  <option value="cheque">Cheque</option>
                  <option value="cash">Cash</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Reference / UTR Number</label>
                <input type="text" value={payForm.reference} onChange={e => setPayForm(f => ({ ...f, reference: e.target.value }))} placeholder="e.g. UTR123456789" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" data-testid="payout-reference" />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Notes (optional)</label>
                <input type="text" value={payForm.notes} onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any notes..." className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" data-testid="payout-notes" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setPayModal(null)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200">Cancel</button>
              <button onClick={recordPayout} disabled={processing} className="flex-1 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 disabled:opacity-50" data-testid="confirm-payout-btn">{processing ? 'Recording...' : 'Confirm Payout'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ===================== REFUNDS SUB-TAB =====================
function RefundsView({ isDesktop }) {
  const [eligible, setEligible] = useState([]);
  const [refundHistory, setRefundHistory] = useState([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('eligible');
  const [refundModal, setRefundModal] = useState(null);
  const [refundForm, setRefundForm] = useState({ refund_amount: 0, reason: 'requested_by_customer' });
  const [processing, setProcessing] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [eligibleRes, historyRes] = await Promise.all([
        api.get('/api/admin/refunds/eligible'),
        api.get('/api/admin/refunds/history'),
      ]);
      setEligible(eligibleRes.data.eligible || []);
      setRefundHistory(historyRes.data.refunds || []);
      setHistoryTotal(historyRes.data.total || 0);
    } catch { toast.error('Failed to load refund data'); }
    finally { setLoading(false); }
  };

  const processRefund = async () => {
    if (!refundModal) return;
    setProcessing(true);
    try {
      await api.post('/api/admin/refunds/process', {
        source_id: refundModal.id,
        source_type: refundModal.source_type,
        refund_amount: refundForm.refund_amount,
        reason: refundForm.reason,
        payment_method: refundModal.payment_method,
        payment_intent_id: refundModal.payment_intent_id,
      });
      toast.success(`Refund of ${fmt(refundForm.refund_amount)} processed!`);
      setRefundModal(null);
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.detail || 'Refund failed'); }
    finally { setProcessing(false); }
  };

  if (loading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-orange-100 animate-pulse h-20" />)}</div>;

  return (
    <>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setView('eligible')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'eligible' ? 'bg-saffron text-white' : 'bg-gray-100 text-gray-600'}`} data-testid="refunds-eligible-tab">Eligible ({eligible.length})</button>
        <button onClick={() => setView('history')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'history' ? 'bg-saffron text-white' : 'bg-gray-100 text-gray-600'}`} data-testid="refunds-history-tab">History ({historyTotal})</button>
      </div>

      {view === 'eligible' && (
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="refunds-eligible-table">
              <thead className="bg-gray-50 text-gray-600"><tr><th className="px-4 py-3 text-left font-medium">Description</th><th className="px-4 py-3 text-left font-medium">User</th><th className="px-4 py-3 text-left font-medium">Type</th><th className="px-4 py-3 text-right font-medium">Amount</th><th className="px-4 py-3 text-center font-medium">Status</th><th className="px-4 py-3 text-center font-medium">Action</th></tr></thead>
              <tbody className="divide-y divide-gray-50">
                {eligible.length === 0 ? <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No eligible refunds</td></tr> :
                eligible.map(item => (
                  <tr key={item.id} className="hover:bg-orange-50/30">
                    <td className="px-4 py-3"><p className="font-medium text-gray-800">{item.description}</p><p className="text-xs text-gray-500 font-mono">{item.id}</p></td>
                    <td className="px-4 py-3"><p className="text-gray-800">{item.user_name}</p><p className="text-xs text-gray-500">{item.user_email}</p></td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.source_type === 'order' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{item.source_type}</span></td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-800">{fmt(item.amount)}</td>
                    <td className="px-4 py-3 text-center"><span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[item.original_status] || 'bg-gray-100'}`}>{item.original_status}</span></td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => { setRefundModal(item); setRefundForm({ refund_amount: item.amount, reason: 'requested_by_customer' }); }}
                        className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 transition-colors" data-testid={`refund-btn-${item.id}`}>
                        <ArrowDownRight className="w-3 h-3 inline mr-1" />Refund
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === 'history' && (
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="refunds-history-table">
              <thead className="bg-gray-50 text-gray-600"><tr><th className="px-4 py-3 text-left font-medium">Source</th><th className="px-4 py-3 text-right font-medium">Amount</th><th className="px-4 py-3 text-left font-medium">Reason</th><th className="px-4 py-3 text-left font-medium">Gateway</th><th className="px-4 py-3 text-left font-medium">By</th><th className="px-4 py-3 text-right font-medium">Date</th></tr></thead>
              <tbody className="divide-y divide-gray-50">
                {refundHistory.length === 0 ? <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No refund history</td></tr> :
                refundHistory.map(r => (
                  <tr key={r.id} className="hover:bg-orange-50/30">
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.source_type === 'order' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{r.source_type}</span><span className="ml-2 text-xs text-gray-500 font-mono">{r.source_id?.slice(0, 8)}</span></td>
                    <td className="px-4 py-3 text-right font-semibold text-red-600">{fmt(r.refund_amount)}</td>
                    <td className="px-4 py-3 capitalize text-gray-700 text-xs">{(r.reason || '').replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3 capitalize text-gray-700">{r.payment_method}</td>
                    <td className="px-4 py-3 text-gray-600">{r.processed_by_name}</td>
                    <td className="px-4 py-3 text-right text-gray-500 text-xs">{r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {refundModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setRefundModal(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()} data-testid="process-refund-modal">
            <h3 className="font-cinzel text-lg font-semibold text-gray-800 mb-1">Process Refund</h3>
            <p className="text-sm text-gray-500 mb-4">{refundModal.description} — {refundModal.user_name}</p>
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Refund Amount (max: {fmt(refundModal.amount)})</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                  <input type="number" min={1} max={refundModal.amount} value={refundForm.refund_amount} onChange={e => setRefundForm(f => ({ ...f, refund_amount: Math.min(refundModal.amount, parseFloat(e.target.value) || 0) }))}
                    className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold" data-testid="refund-amount-input" />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Reason</label>
                <select value={refundForm.reason} onChange={e => setRefundForm(f => ({ ...f, reason: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" data-testid="refund-reason">
                  <option value="requested_by_customer">Requested by Customer</option>
                  <option value="duplicate">Duplicate Payment</option>
                  <option value="fraudulent">Fraudulent</option>
                  <option value="service_not_provided">Service Not Provided</option>
                  <option value="quality_issue">Quality Issue</option>
                </select>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-800">
                {refundModal.payment_intent_id
                  ? `This will process a real ${refundModal.payment_method} refund via gateway.`
                  : 'No payment intent found. This will be recorded as a manual refund.'}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setRefundModal(null)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200">Cancel</button>
              <button onClick={processRefund} disabled={processing || refundForm.refund_amount <= 0} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50" data-testid="confirm-refund-btn">{processing ? 'Processing...' : `Refund ${fmt(refundForm.refund_amount)}`}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ===================== MAIN PAYMENTS TAB =====================
export function PaymentsTab({ isDesktop }) {
  const [subTab, setSubTab] = useState('dashboard');

  return (
    <div className={`pb-24 lg:pb-8 ${isDesktop ? 'px-8' : 'px-4'} pt-4`} data-testid="payments-dashboard">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-cinzel text-lg font-semibold text-gray-800">Payments & Finance</h2>
      </div>

      {/* Sub-navigation */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6" data-testid="payments-sub-nav">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
          { id: 'payouts', label: 'Payouts', icon: Users },
          { id: 'refunds', label: 'Refunds', icon: ArrowDownRight },
        ].map(tab => (
          <button key={tab.id} onClick={() => setSubTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium flex-1 justify-center transition-colors ${subTab === tab.id ? 'bg-white text-saffron-dark shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            data-testid={`sub-tab-${tab.id}`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {subTab === 'dashboard' && <DashboardView isDesktop={isDesktop} />}
      {subTab === 'payouts' && <PayoutsView isDesktop={isDesktop} />}
      {subTab === 'refunds' && <RefundsView isDesktop={isDesktop} />}
    </div>
  );
}
