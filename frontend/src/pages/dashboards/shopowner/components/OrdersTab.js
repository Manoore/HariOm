import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, Loader2, X, Check, Truck, Clock, 
  CheckCircle, XCircle, ChevronRight, PackageCheck, 
  PackageOpen, Settings, Link2, FileText, ArrowRight
} from 'lucide-react';
import api from '../../../../lib/api';
import { toast } from 'sonner';

const STATUS_CONFIG = {
  pending:    { label: 'Pending',    color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  paid:       { label: 'Paid',       color: 'bg-indigo-100 text-indigo-700', icon: CheckCircle },
  received:   { label: 'Received',   color: 'bg-blue-100 text-blue-700',    icon: PackageOpen },
  accepted:   { label: 'Accepted',   color: 'bg-cyan-100 text-cyan-700',    icon: PackageCheck },
  processing: { label: 'Processing', color: 'bg-purple-100 text-purple-700', icon: Settings },
  shipping:   { label: 'Shipping',   color: 'bg-orange-100 text-orange-700', icon: Truck },
  delivered:  { label: 'Delivered',  color: 'bg-green-100 text-green-700',  icon: Check },
  cancelled:  { label: 'Cancelled',  color: 'bg-red-100 text-red-700',     icon: XCircle },
};

const NEXT_STATUS = {
  paid:       { key: 'received',   label: 'Mark Received' },
  received:   { key: 'accepted',   label: 'Accept Order' },
  accepted:   { key: 'processing', label: 'Start Processing' },
  processing: { key: 'shipping',   label: 'Ship Order' },
  shipping:   { key: 'delivered',  label: 'Mark Delivered' },
};

const FILTER_STATUSES = [
  { id: 'all', label: 'All' },
  { id: 'paid', label: 'New' },
  { id: 'received', label: 'Received' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'processing', label: 'Processing' },
  { id: 'shipping', label: 'Shipping' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
];

export function OrdersTab({ isDesktop }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [shippingModal, setShippingModal] = useState(false);
  const [trackingLink, setTrackingLink] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const url = statusFilter === 'all' ? '/api/shop/orders' : `/api/shop/orders?status=${statusFilter}`;
      const res = await api.get(url);
      setOrders(res.data.orders || []);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, newStatus, extraData = {}) => {
    setUpdating(true);
    try {
      await api.put(`/api/orders/${orderId}/status`, { status: newStatus, ...extraData });
      toast.success(`Order status updated to "${STATUS_CONFIG[newStatus]?.label || newStatus}"`);
      fetchOrders();
      setSelectedOrder(null);
      setShippingModal(false);
      setTrackingLink('');
      setDeliveryInstructions('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleNextStatus = (order) => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    if (next.key === 'shipping') {
      setSelectedOrder(order);
      setTrackingLink(order.tracking_link || '');
      setDeliveryInstructions(order.delivery_instructions || '');
      setShippingModal(true);
    } else {
      updateStatus(order.id, next.key);
    }
  };

  const handleShipSubmit = () => {
    if (!selectedOrder) return;
    updateStatus(selectedOrder.id, 'shipping', {
      tracking_link: trackingLink,
      delivery_instructions: deliveryInstructions,
    });
  };

  const getStatusBadge = (status) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    const Icon = config.icon;
    return (
      <span className={`flex items-center gap-1 text-xs px-3 py-1 rounded-full font-medium ${config.color}`} data-testid={`order-status-badge-${status}`}>
        <Icon className="w-3.5 h-3.5" />
        {config.label}
      </span>
    );
  };

  return (
    <div className={`p-4 lg:p-8 pb-24 lg:pb-8`}>
      <div className="mb-6">
        <h1 className="font-cinzel text-2xl font-bold text-maroon">Orders</h1>
        <p className="text-gray-500 text-sm">Manage and fulfill customer orders</p>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {FILTER_STATUSES.map((status) => (
          <button
            key={status.id}
            onClick={() => setStatusFilter(status.id)}
            data-testid={`filter-${status.id}`}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition-all text-sm ${
              statusFilter === status.id
                ? 'bg-saffron text-white'
                : 'bg-orange-50 text-gray-600 hover:bg-orange-100'
            }`}
          >
            {status.label}
          </button>
        ))}
      </div>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && !shippingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedOrder(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
              data-testid="order-detail-modal"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-cinzel text-xl font-semibold text-maroon">
                  Order #{selectedOrder.order_number}
                </h2>
                <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Current Status */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-sm text-gray-500">Status:</span>
                {getStatusBadge(selectedOrder.status)}
              </div>

              {/* Customer Info */}
              <div className="bg-orange-50 rounded-xl p-4 mb-4">
                <h3 className="font-medium text-gray-800 mb-2">Customer Details</h3>
                <p className="text-sm text-gray-600">{selectedOrder.customer_name}</p>
                <p className="text-sm text-gray-600">{selectedOrder.customer_phone}</p>
                <p className="text-sm text-gray-600">{selectedOrder.customer_email}</p>
              </div>

              {/* Shipping Address */}
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <h3 className="font-medium text-gray-800 mb-2">Shipping Address</h3>
                <p className="text-sm text-gray-600">{selectedOrder.shipping_address}</p>
              </div>

              {/* Tracking Info (if shipping/delivered) */}
              {selectedOrder.tracking_link && (
                <div className="bg-blue-50 rounded-xl p-4 mb-4">
                  <h3 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                    <Link2 className="w-4 h-4" /> Tracking Info
                  </h3>
                  <a href={selectedOrder.tracking_link} target="_blank" rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline break-all">
                    {selectedOrder.tracking_link}
                  </a>
                  {selectedOrder.delivery_instructions && (
                    <p className="text-sm text-blue-700 mt-2">
                      <FileText className="w-3.5 h-3.5 inline mr-1" />
                      {selectedOrder.delivery_instructions}
                    </p>
                  )}
                </div>
              )}

              {/* Items */}
              <div className="mb-4">
                <h3 className="font-medium text-gray-800 mb-2">Items ({selectedOrder.items.length})</h3>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-gray-500">Qty: {item.quantity} x ₹{item.price}</p>
                      </div>
                      <p className="font-semibold">₹{item.subtotal}</p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t">
                  <span className="font-medium">Total</span>
                  <span className="font-bold text-saffron text-lg">₹{selectedOrder.shop_total}</span>
                </div>
              </div>

              {/* Status Actions */}
              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-800 mb-3">Actions</h3>
                <div className="space-y-2">
                  {/* Next status button */}
                  {NEXT_STATUS[selectedOrder.status] && (
                    <button
                      onClick={() => handleNextStatus(selectedOrder)}
                      disabled={updating}
                      data-testid="next-status-btn"
                      className="w-full py-3 px-4 rounded-xl bg-saffron text-white hover:bg-orange-600 transition-all flex items-center justify-center gap-2 font-medium disabled:opacity-50"
                    >
                      {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                      {NEXT_STATUS[selectedOrder.status].label}
                    </button>
                  )}
                  {/* Cancel button */}
                  {!['delivered', 'cancelled', 'shipping'].includes(selectedOrder.status) && (
                    <button
                      onClick={() => updateStatus(selectedOrder.id, 'cancelled')}
                      disabled={updating}
                      data-testid="cancel-order-btn"
                      className="w-full py-3 px-4 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-all flex items-center justify-center gap-2 font-medium disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" /> Cancel Order
                    </button>
                  )}
                  {selectedOrder.status === 'delivered' && (
                    <div className="text-center py-3 text-green-600 font-medium flex items-center justify-center gap-2">
                      <CheckCircle className="w-5 h-5" /> Order Completed
                    </div>
                  )}
                  {selectedOrder.status === 'cancelled' && (
                    <div className="text-center py-3 text-red-500 font-medium flex items-center justify-center gap-2">
                      <XCircle className="w-5 h-5" /> Order Cancelled
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shipping Modal - for entering tracking link */}
      <AnimatePresence>
        {shippingModal && selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => { setShippingModal(false); setSelectedOrder(null); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
              data-testid="shipping-modal"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-cinzel text-lg font-semibold text-maroon">
                  Ship Order #{selectedOrder.order_number}
                </h2>
                <button onClick={() => { setShippingModal(false); setSelectedOrder(null); }} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block flex items-center gap-1.5">
                    <Link2 className="w-4 h-4 text-saffron" /> Tracking Link
                  </label>
                  <input
                    type="url"
                    value={trackingLink}
                    onChange={(e) => setTrackingLink(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-orange-100 focus:ring-2 focus:ring-saffron/50 focus:border-saffron outline-none text-sm"
                    placeholder="https://tracking.example.com/..."
                    data-testid="tracking-link-input"
                  />
                  <p className="text-xs text-gray-400 mt-1">Paste the courier tracking URL (optional)</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-saffron" /> Delivery Instructions
                  </label>
                  <textarea
                    value={deliveryInstructions}
                    onChange={(e) => setDeliveryInstructions(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-orange-100 focus:ring-2 focus:ring-saffron/50 focus:border-saffron outline-none resize-none text-sm"
                    placeholder="e.g., Expected delivery in 3-5 days via BlueDart..."
                    data-testid="delivery-instructions-input"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { setShippingModal(false); setSelectedOrder(null); }}
                  className="flex-1 py-3 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleShipSubmit}
                  disabled={updating}
                  data-testid="confirm-ship-btn"
                  className="flex-1 py-3 bg-saffron text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                  Confirm Shipment
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Orders List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-saffron animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-orange-50">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-700 mb-2">No orders found</h3>
          <p className="text-gray-500">Orders will appear here when customers place them</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <button
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              data-testid={`order-card-${order.order_number}`}
              className="w-full bg-white rounded-2xl p-4 border border-orange-50 shadow-sm hover:shadow-md transition-all text-left"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-semibold text-gray-800">#{order.order_number}</p>
                  <p className="text-sm text-gray-500">{order.customer_name}</p>
                </div>
                {getStatusBadge(order.status)}
              </div>
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  {order.item_count} items - {new Date(order.created_at).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-saffron">₹{order.shop_total}</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
              {/* Quick action hint */}
              {NEXT_STATUS[order.status] && (
                <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-1.5 text-xs text-saffron font-medium">
                  <ArrowRight className="w-3 h-3" />
                  {NEXT_STATUS[order.status].label}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
