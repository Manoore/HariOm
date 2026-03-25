import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, Loader2, X, Check, Truck, Clock, 
  CheckCircle, XCircle, ChevronRight 
} from 'lucide-react';
import api from '../../../../lib/api';
import { toast } from 'sonner';

export function OrdersTab({ isDesktop }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const statuses = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'paid', label: 'Processing' },
    { id: 'shipped', label: 'Shipped' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

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

  const updateStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/api/orders/${orderId}/status`, { status: newStatus });
      toast.success('Order status updated');
      fetchOrders();
      setSelectedOrder(null);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'paid': return <CheckCircle className="w-4 h-4" />;
      case 'shipped': return <Truck className="w-4 h-4" />;
      case 'delivered': return <Check className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className={`p-4 lg:p-8 pb-24 lg:pb-8`}>
      <div className="mb-6">
        <h1 className="font-cinzel text-2xl font-bold text-maroon">Orders</h1>
        <p className="text-gray-500 text-sm">Manage and fulfill customer orders</p>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {statuses.map((status) => (
          <button
            key={status.id}
            onClick={() => setStatusFilter(status.id)}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
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
        {selectedOrder && (
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
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-cinzel text-xl font-semibold text-maroon">
                  Order #{selectedOrder.order_number}
                </h2>
                <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
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

              {/* Status Update */}
              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-800 mb-3">Update Status</h3>
                <div className="grid grid-cols-2 gap-2">
                  {selectedOrder.status === 'pending' && (
                    <button
                      onClick={() => updateStatus(selectedOrder.id, 'paid')}
                      className="py-2 px-4 rounded-xl bg-purple-100 text-purple-700 hover:bg-purple-200 flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" /> Mark Processing
                    </button>
                  )}
                  {(selectedOrder.status === 'pending' || selectedOrder.status === 'paid') && (
                    <button
                      onClick={() => updateStatus(selectedOrder.id, 'shipped')}
                      className="py-2 px-4 rounded-xl bg-blue-100 text-blue-700 hover:bg-blue-200 flex items-center justify-center gap-2"
                    >
                      <Truck className="w-4 h-4" /> Mark Shipped
                    </button>
                  )}
                  {selectedOrder.status === 'shipped' && (
                    <button
                      onClick={() => updateStatus(selectedOrder.id, 'delivered')}
                      className="py-2 px-4 rounded-xl bg-green-100 text-green-700 hover:bg-green-200 flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" /> Mark Delivered
                    </button>
                  )}
                  {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                    <button
                      onClick={() => updateStatus(selectedOrder.id, 'cancelled')}
                      className="py-2 px-4 rounded-xl bg-red-100 text-red-700 hover:bg-red-200 flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" /> Cancel
                    </button>
                  )}
                </div>
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
              className="w-full bg-white rounded-2xl p-4 border border-orange-50 shadow-sm hover:shadow-md transition-all text-left"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-semibold text-gray-800">#{order.order_number}</p>
                  <p className="text-sm text-gray-500">{order.customer_name}</p>
                </div>
                <span className={`flex items-center gap-1 text-xs px-3 py-1 rounded-full ${
                  order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                  order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                  order.status === 'paid' ? 'bg-purple-100 text-purple-700' :
                  order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {getStatusIcon(order.status)}
                  {order.status}
                </span>
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
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
