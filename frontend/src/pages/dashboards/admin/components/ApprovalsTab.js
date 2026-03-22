import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserCheck, Star, ShoppingBag, Check, X, Loader2, RefreshCw, CheckCircle } from 'lucide-react';
import api from '../../../../lib/api';
import { toast } from 'sonner';

export function ApprovalsTab({ isDesktop }) {
  const [pendingApprovals, setPendingApprovals] = useState({ priests: [], astrologers: [], shops: [] });
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const fetchPendingApprovals = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/pending-approvals');
      setPendingApprovals(res.data);
    } catch (error) {
      toast.error('Failed to load pending approvals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const handleApprove = async (type, id) => {
    setProcessingId(id);
    try {
      await api.put(`/api/admin/approve/${type}/${id}`);
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} approved successfully!`);
      fetchPendingApprovals();
    } catch (error) {
      toast.error('Failed to approve');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!showRejectModal) return;
    const { type, id } = showRejectModal;
    setProcessingId(id);
    try {
      await api.put(`/api/admin/reject/${type}/${id}`, { reason: rejectReason });
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} rejected`);
      setShowRejectModal(null);
      setRejectReason('');
      fetchPendingApprovals();
    } catch (error) {
      toast.error('Failed to reject');
    } finally {
      setProcessingId(null);
    }
  };

  const totalPending = pendingApprovals.priests.length + pendingApprovals.astrologers.length + pendingApprovals.shops.length;

  const filterTabs = [
    { id: 'all', label: 'All', count: totalPending },
    { id: 'priests', label: 'Priests', count: pendingApprovals.priests.length, icon: UserCheck },
    { id: 'astrologers', label: 'Astrologers', count: pendingApprovals.astrologers.length, icon: Star },
    { id: 'shops', label: 'Shops', count: pendingApprovals.shops.length, icon: ShoppingBag },
  ];

  const ProviderCard = ({ provider, type }) => (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-800">{provider.name || provider.owner_name}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              type === 'priest' ? 'bg-orange-100 text-orange-700' :
              type === 'astrologer' ? 'bg-purple-100 text-purple-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </span>
          </div>
          <p className="text-sm text-gray-500">{provider.email}</p>
          {provider.phone && <p className="text-xs text-gray-400">{provider.phone}</p>}
          {type === 'shop' && provider.shop_name && (
            <p className="text-xs text-saffron mt-1">Shop: {provider.shop_name}</p>
          )}
          {(provider.specializations?.length > 0) && (
            <div className="flex flex-wrap gap-1 mt-2">
              {provider.specializations.slice(0, 3).map((s, i) => (
                <span key={i} className="text-xs bg-orange-50 text-saffron px-2 py-0.5 rounded-full">{s}</span>
              ))}
            </div>
          )}
          {provider.experience_years > 0 && (
            <p className="text-xs text-gray-500 mt-1">{provider.experience_years} years experience</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleApprove(type, provider.id)}
            disabled={processingId === provider.id}
            className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
            title="Approve"
          >
            {processingId === provider.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setShowRejectModal({ type, id: provider.id, name: provider.name || provider.owner_name })}
            disabled={processingId === provider.id}
            className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
            title="Reject"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-saffron" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-cinzel font-bold text-maroon">Pending Approvals</h2>
        <button onClick={fetchPendingApprovals} className="text-saffron hover:text-orange-600">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {filterTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeFilter === tab.id
                ? 'bg-saffron text-white'
                : 'bg-white text-gray-600 hover:bg-orange-50 border border-gray-200'
            }`}
          >
            {tab.icon && <tab.icon className="w-4 h-4" />}
            {tab.label}
            {tab.count > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                activeFilter === tab.id ? 'bg-white/20 text-white' : 'bg-orange-100 text-saffron'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {totalPending === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No pending approvals</p>
          <p className="text-gray-400 text-sm mt-1">All provider applications have been processed</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Priests */}
          {(activeFilter === 'all' || activeFilter === 'priests') && pendingApprovals.priests.length > 0 && (
            <div className="space-y-3">
              {activeFilter === 'all' && (
                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-orange-500" />
                  Priests ({pendingApprovals.priests.length})
                </h3>
              )}
              {pendingApprovals.priests.map(priest => (
                <ProviderCard key={priest.id} provider={priest} type="priest" />
              ))}
            </div>
          )}

          {/* Astrologers */}
          {(activeFilter === 'all' || activeFilter === 'astrologers') && pendingApprovals.astrologers.length > 0 && (
            <div className="space-y-3">
              {activeFilter === 'all' && (
                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                  <Star className="w-5 h-5 text-purple-500" />
                  Astrologers ({pendingApprovals.astrologers.length})
                </h3>
              )}
              {pendingApprovals.astrologers.map(astro => (
                <ProviderCard key={astro.id} provider={astro} type="astrologer" />
              ))}
            </div>
          )}

          {/* Shops */}
          {(activeFilter === 'all' || activeFilter === 'shops') && pendingApprovals.shops.length > 0 && (
            <div className="space-y-3">
              {activeFilter === 'all' && (
                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-blue-500" />
                  Shops ({pendingApprovals.shops.length})
                </h3>
              )}
              {pendingApprovals.shops.map(shop => (
                <ProviderCard key={shop.id} provider={shop} type="shop" />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full"
          >
            <h3 className="font-semibold text-lg text-gray-800 mb-2">Reject {showRejectModal.name}?</h3>
            <p className="text-sm text-gray-500 mb-4">Please provide a reason:</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-saffron/50"
              rows={3}
              placeholder="e.g., Please complete your profile..."
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowRejectModal(null); setRejectReason(''); }}
                className="flex-1 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={processingId}
                className="flex-1 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processingId ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reject'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
