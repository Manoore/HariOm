import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, X, Plus, Minus, Trash2, MapPin, Phone, User,
  CreditCard, Truck, CheckCircle, Loader2, ArrowLeft, ChevronRight,
  Package, Clock, ShoppingBag, MessageSquare, AlertCircle
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { usePayment } from '../../contexts/PaymentContext';
import { toast } from 'sonner';

// Cart Sidebar Component
export function CartSidebar({ isOpen, onClose, onCheckout }) {
  const [cartData, setCartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { updateCartItem, removeFromCart, refreshCart, cartCount } = useCart();

  useEffect(() => {
    if (isOpen) {
      fetchCartSummary();
    }
  }, [isOpen, cartCount]);

  const fetchCartSummary = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/cart/summary');
      setCartData(res.data);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = async (productId, newQuantity) => {
    if (newQuantity < 1) {
      await removeFromCart(productId);
    } else {
      await updateCartItem(productId, newQuantity);
    }
    fetchCartSummary();
  };

  const handleRemove = async (productId) => {
    await removeFromCart(productId);
    fetchCartSummary();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />
          
          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-orange-100">
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-6 h-6 text-saffron" />
                <h2 className="font-cinzel text-xl font-semibold text-maroon">Your Cart</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-orange-50 rounded-full">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Cart Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 text-saffron animate-spin" />
                </div>
              ) : !cartData?.items?.length ? (
                <div className="text-center py-12">
                  <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-700 mb-2">Your cart is empty</h3>
                  <p className="text-gray-500 text-sm">Add items to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartData.items.map((item) => (
                    <div key={item.product_id} className="bg-orange-50 rounded-xl p-4">
                      <div className="flex gap-3">
                        <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center overflow-hidden">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-8 h-8 text-saffron/30" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 line-clamp-2">{item.name}</p>
                          <p className="text-xs text-gray-500">{item.shop_name}</p>
                          <p className="text-saffron font-bold mt-1">₹{item.price}</p>
                        </div>
                        <button 
                          onClick={() => handleRemove(item.product_id)}
                          className="text-red-400 hover:text-red-600 self-start"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {/* Quantity Control */}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2 bg-white rounded-full">
                          <button 
                            onClick={() => handleQuantityChange(item.product_id, item.quantity - 1)}
                            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-orange-100"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <button 
                            onClick={() => handleQuantityChange(item.product_id, item.quantity + 1)}
                            disabled={item.quantity >= item.stock}
                            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-orange-100 disabled:opacity-50"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="font-semibold text-gray-800">₹{item.subtotal}</p>
                      </div>
                      
                      {/* Stock Warning */}
                      {item.quantity >= item.stock && (
                        <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Max available: {item.stock}
                        </p>
                      )}
                    </div>
                  ))}

                  {/* Shipping Breakdown */}
                  {cartData.shipping_breakdown?.length > 0 && (
                    <div className="bg-blue-50 rounded-xl p-4">
                      <h3 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                        <Truck className="w-4 h-4" /> Shipping
                      </h3>
                      {cartData.shipping_breakdown.map((shop, idx) => (
                        <div key={idx} className="flex justify-between text-sm py-1">
                          <span className="text-blue-700">{shop.shop}</span>
                          <span className={shop.cost === 0 ? 'text-green-600' : 'text-blue-700'}>
                            {shop.cost === 0 ? 'FREE' : `₹${shop.cost}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer with Totals */}
            {cartData?.items?.length > 0 && (
              <div className="border-t border-orange-100 p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal ({cartData.item_count} items)</span>
                  <span className="font-medium">₹{cartData.subtotal}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className={cartData.shipping === 0 ? 'text-green-600 font-medium' : 'font-medium'}>
                    {cartData.shipping === 0 ? 'FREE' : `₹${cartData.shipping}`}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total</span>
                  <span className="text-saffron">₹{cartData.total}</span>
                </div>
                <button
                  onClick={onCheckout}
                  className="w-full py-4 bg-saffron text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                  data-testid="proceed-checkout-btn"
                >
                  Proceed to Checkout
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Checkout Page Component
export function CheckoutPage({ onBack, onComplete }) {
  const { user } = useAuth();
  const { paymentGateway } = usePayment();
  const [cartData, setCartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1); // 1: Address, 2: Payment, 3: Confirmation
  const [formData, setFormData] = useState({
    shipping_name: user?.name || '',
    shipping_phone: user?.phone || '',
    shipping_address: user?.address || '',
    shipping_city: user?.city || '',
    notes: '',
    payment_method: paymentGateway || 'stripe'
  });

  useEffect(() => {
    fetchCartSummary();
  }, []);

  const fetchCartSummary = async () => {
    try {
      const res = await api.get('/api/cart/summary');
      setCartData(res.data);
    } catch (error) {
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!formData.shipping_name || !formData.shipping_phone || !formData.shipping_address || !formData.shipping_city) {
      toast.error('Please fill all required fields');
      setStep(1);
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/api/checkout', formData);
      
      // If checkout_url is returned (Stripe), redirect to Stripe checkout
      if (res.data.checkout_url) {
        toast.success('Redirecting to payment...');
        // Store order info before redirect
        localStorage.setItem('pending_order', JSON.stringify({
          order_id: res.data.order_id,
          order_number: res.data.order_number,
          total: res.data.total
        }));
        // Redirect to Stripe checkout page
        window.location.href = res.data.checkout_url;
      } else {
        // Non-Stripe flow (if needed in future)
        toast.success('Order placed successfully!');
        onComplete(res.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to place order');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 text-saffron animate-spin" />
      </div>
    );
  }

  if (!cartData?.items?.length) {
    return (
      <div className="text-center py-12">
        <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="font-semibold text-gray-700 mb-2">Your cart is empty</h3>
        <button onClick={onBack} className="text-saffron hover:underline">
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-24 lg:pb-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-orange-50 rounded-full">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="font-cinzel text-2xl font-bold text-maroon">Checkout</h1>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4 mb-8">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <button
              onClick={() => setStep(s)}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                step >= s ? 'bg-saffron text-white' : 'bg-orange-100 text-gray-500'
              }`}
            >
              {s}
            </button>
            {s < 3 && <div className={`w-16 h-1 rounded ${step > s ? 'bg-saffron' : 'bg-orange-100'}`} />}
          </React.Fragment>
        ))}
      </div>
      <div className="flex justify-center gap-8 text-sm text-gray-500 mb-8">
        <span className={step >= 1 ? 'text-saffron font-medium' : ''}>Address</span>
        <span className={step >= 2 ? 'text-saffron font-medium' : ''}>Payment</span>
        <span className={step >= 3 ? 'text-saffron font-medium' : ''}>Confirm</span>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Step 1: Shipping Address */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl p-6 border border-orange-100"
            >
              <h2 className="font-cinzel text-lg font-semibold text-maroon mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" /> Shipping Address
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Full Name *</label>
                  <input
                    type="text"
                    value={formData.shipping_name}
                    onChange={(e) => setFormData({...formData, shipping_name: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-orange-100 focus:ring-2 focus:ring-saffron/50 focus:border-saffron outline-none"
                    placeholder="Enter full name"
                    required
                  />
                </div>
                
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Phone Number *</label>
                  <input
                    type="tel"
                    value={formData.shipping_phone}
                    onChange={(e) => setFormData({...formData, shipping_phone: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-orange-100 focus:ring-2 focus:ring-saffron/50 focus:border-saffron outline-none"
                    placeholder="+91 XXXXX XXXXX"
                    required
                  />
                </div>
                
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Address *</label>
                  <textarea
                    value={formData.shipping_address}
                    onChange={(e) => setFormData({...formData, shipping_address: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-orange-100 focus:ring-2 focus:ring-saffron/50 focus:border-saffron outline-none resize-none"
                    placeholder="House/Flat No, Street, Landmark"
                    required
                  />
                </div>
                
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">City *</label>
                  <input
                    type="text"
                    value={formData.shipping_city}
                    onChange={(e) => setFormData({...formData, shipping_city: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-orange-100 focus:ring-2 focus:ring-saffron/50 focus:border-saffron outline-none"
                    placeholder="Enter city"
                    required
                  />
                </div>
                
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Order Notes (Optional)</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl border border-orange-100 focus:ring-2 focus:ring-saffron/50 focus:border-saffron outline-none resize-none"
                    placeholder="Any special instructions..."
                  />
                </div>
              </div>
              
              <button
                onClick={() => setStep(2)}
                disabled={!formData.shipping_name || !formData.shipping_phone || !formData.shipping_address || !formData.shipping_city}
                className="w-full mt-6 py-4 bg-saffron text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue to Payment
              </button>
            </motion.div>
          )}

          {/* Step 2: Payment Method */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl p-6 border border-orange-100"
            >
              <h2 className="font-cinzel text-lg font-semibold text-maroon mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" /> Payment Method
              </h2>
              
              <div className="space-y-4">
                <button
                  onClick={() => setFormData({...formData, payment_method: 'stripe'})}
                  className={`w-full p-4 rounded-xl border-2 text-left flex items-center gap-4 transition-all ${
                    formData.payment_method === 'stripe' 
                      ? 'border-saffron bg-orange-50' 
                      : 'border-gray-200 hover:border-orange-200'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    formData.payment_method === 'stripe' ? 'bg-saffron' : 'bg-gray-100'
                  }`}>
                    <CreditCard className={`w-6 h-6 ${formData.payment_method === 'stripe' ? 'text-white' : 'text-gray-500'}`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Credit/Debit Card</p>
                    <p className="text-sm text-gray-500">Pay securely with Stripe</p>
                  </div>
                  {formData.payment_method === 'stripe' && (
                    <CheckCircle className="w-6 h-6 text-saffron ml-auto" />
                  )}
                </button>
                
                <button
                  onClick={() => setFormData({...formData, payment_method: 'razorpay'})}
                  className={`w-full p-4 rounded-xl border-2 text-left flex items-center gap-4 transition-all ${
                    formData.payment_method === 'razorpay' 
                      ? 'border-saffron bg-orange-50' 
                      : 'border-gray-200 hover:border-orange-200'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    formData.payment_method === 'razorpay' ? 'bg-saffron' : 'bg-gray-100'
                  }`}>
                    <CreditCard className={`w-6 h-6 ${formData.payment_method === 'razorpay' ? 'text-white' : 'text-gray-500'}`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">UPI / Net Banking</p>
                    <p className="text-sm text-gray-500">Pay with Razorpay (India)</p>
                  </div>
                  {formData.payment_method === 'razorpay' && (
                    <CheckCircle className="w-6 h-6 text-saffron ml-auto" />
                  )}
                </button>
              </div>
              
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-4 border border-gray-200 rounded-xl font-medium hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-4 bg-saffron text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors"
                >
                  Review Order
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Order Confirmation */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              {/* Shipping Info Summary */}
              <div className="bg-white rounded-2xl p-6 border border-orange-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-maroon flex items-center gap-2">
                    <Truck className="w-5 h-5" /> Shipping To
                  </h3>
                  <button onClick={() => setStep(1)} className="text-saffron text-sm hover:underline">
                    Edit
                  </button>
                </div>
                <p className="font-medium">{formData.shipping_name}</p>
                <p className="text-sm text-gray-600">{formData.shipping_phone}</p>
                <p className="text-sm text-gray-600">{formData.shipping_address}</p>
                <p className="text-sm text-gray-600">{formData.shipping_city}</p>
              </div>
              
              {/* Payment Method Summary */}
              <div className="bg-white rounded-2xl p-6 border border-orange-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-maroon flex items-center gap-2">
                    <CreditCard className="w-5 h-5" /> Payment Method
                  </h3>
                  <button onClick={() => setStep(2)} className="text-saffron text-sm hover:underline">
                    Edit
                  </button>
                </div>
                <p className="font-medium">
                  {formData.payment_method === 'stripe' ? 'Credit/Debit Card (Stripe)' : 'UPI/Net Banking (Razorpay)'}
                </p>
              </div>
              
              {/* Order Items */}
              <div className="bg-white rounded-2xl p-6 border border-orange-100">
                <h3 className="font-medium text-maroon mb-4">Order Items ({cartData?.item_count})</h3>
                <div className="space-y-3">
                  {cartData?.items?.map((item) => (
                    <div key={item.product_id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                      <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center overflow-hidden">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-6 h-6 text-saffron/30" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm line-clamp-1">{item.name}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity} × ₹{item.price}</p>
                      </div>
                      <p className="font-semibold">₹{item.subtotal}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Place Order Button */}
              <div className="flex gap-4">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-4 border border-gray-200 rounded-xl font-medium hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={submitting}
                  className="flex-1 py-4 bg-saffron text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  data-testid="place-order-btn"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Place Order
                      <CheckCircle className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-6 border border-orange-100 sticky top-4">
            <h3 className="font-cinzel text-lg font-semibold text-maroon mb-4">Order Summary</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal ({cartData?.item_count} items)</span>
                <span className="font-medium">₹{cartData?.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className={cartData?.shipping === 0 ? 'text-green-600 font-medium' : 'font-medium'}>
                  {cartData?.shipping === 0 ? 'FREE' : `₹${cartData?.shipping}`}
                </span>
              </div>
              <div className="pt-3 border-t">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-saffron">₹{cartData?.total}</span>
                </div>
              </div>
            </div>

            {/* Shipping Breakdown */}
            {cartData?.shipping_breakdown?.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-gray-500 mb-2">Shipping by shop:</p>
                {cartData.shipping_breakdown.map((shop, idx) => (
                  <div key={idx} className="flex justify-between text-xs py-1">
                    <span className="text-gray-600">{shop.shop}</span>
                    <span className={shop.cost === 0 ? 'text-green-600' : ''}>
                      {shop.cost === 0 ? 'Free' : `₹${shop.cost}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Order Success Page
export function OrderSuccessPage({ orderData, onContinue, onViewOrders }) {
  return (
    <div className="max-w-md mx-auto text-center py-12 px-4">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 15 }}
        className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
      >
        <CheckCircle className="w-12 h-12 text-green-600" />
      </motion.div>
      
      <h1 className="font-cinzel text-2xl font-bold text-maroon mb-2">Order Placed!</h1>
      <p className="text-gray-600 mb-6">
        Your order #{orderData.order_number} has been placed successfully.
      </p>
      
      <div className="bg-orange-50 rounded-2xl p-6 text-left mb-6">
        <div className="flex justify-between py-2 border-b border-orange-100">
          <span className="text-gray-600">Order Number</span>
          <span className="font-semibold">#{orderData.order_number}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-orange-100">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium">₹{orderData.subtotal}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-orange-100">
          <span className="text-gray-600">Shipping</span>
          <span className={orderData.shipping === 0 ? 'text-green-600' : ''}>
            {orderData.shipping === 0 ? 'FREE' : `₹${orderData.shipping}`}
          </span>
        </div>
        <div className="flex justify-between py-2 text-lg font-bold">
          <span>Total</span>
          <span className="text-saffron">₹{orderData.total}</span>
        </div>
      </div>

      <div className="bg-blue-50 rounded-xl p-4 mb-6 text-left">
        <div className="flex items-start gap-3">
          <MessageSquare className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800">Chat with Shop Owner</p>
            <p className="text-xs text-blue-600">
              A chat room has been created. You can message the shop owner about your order.
            </p>
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        <button
          onClick={onViewOrders}
          className="w-full py-4 bg-saffron text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors"
          data-testid="view-orders-btn"
        >
          View My Orders
        </button>
        <button
          onClick={onContinue}
          className="w-full py-4 border border-gray-200 rounded-xl font-medium hover:bg-gray-50"
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
}

// My Orders Page Component
export function MyOrdersPage({ onBack, onViewOrder }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/api/orders');
      setOrders(res.data.orders || []);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'shipped': return 'bg-blue-100 text-blue-700';
      case 'paid': return 'bg-purple-100 text-purple-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="w-4 h-4" />;
      case 'shipped': return <Truck className="w-4 h-4" />;
      case 'paid': return <Package className="w-4 h-4" />;
      case 'cancelled': return <X className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-24 lg:pb-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-orange-50 rounded-full">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="font-cinzel text-2xl font-bold text-maroon">My Orders</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-saffron animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-orange-50">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-700 mb-2">No orders yet</h3>
          <p className="text-gray-500 text-sm">Your order history will appear here</p>
          <button onClick={onBack} className="mt-4 text-saffron hover:underline">
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <button
              key={order.id}
              onClick={() => onViewOrder(order.id)}
              className="w-full bg-white rounded-2xl p-4 border border-orange-50 shadow-sm hover:shadow-md transition-all text-left"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-semibold text-gray-800">Order #{order.id?.slice(-8).toUpperCase()}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <span className={`flex items-center gap-1 text-xs px-3 py-1 rounded-full ${getStatusColor(order.status)}`}>
                  {getStatusIcon(order.status)}
                  {order.status}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {order.items?.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="w-8 h-8 bg-orange-100 rounded-full border-2 border-white flex items-center justify-center">
                        {item.image ? (
                          <img src={item.image} alt="" className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <Package className="w-4 h-4 text-saffron/50" />
                        )}
                      </div>
                    ))}
                    {order.items?.length > 3 && (
                      <div className="w-8 h-8 bg-saffron text-white rounded-full border-2 border-white flex items-center justify-center text-xs font-medium">
                        +{order.items.length - 3}
                      </div>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">{order.items?.length} items</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-saffron">₹{order.total_amount}</span>
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

// Order Detail Page
export function OrderDetailPage({ orderId, onBack }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/api/orders/${orderId}`);
      setOrder(res.data);
    } catch (error) {
      toast.error('Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'shipped': return 'bg-blue-100 text-blue-700';
      case 'paid': return 'bg-purple-100 text-purple-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 text-saffron animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="font-semibold text-gray-700">Order not found</h3>
        <button onClick={onBack} className="mt-4 text-saffron hover:underline">
          Back to Orders
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-24 lg:pb-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-orange-50 rounded-full">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="font-cinzel text-xl font-bold text-maroon">Order #{order.order_number}</h1>
          <p className="text-sm text-gray-500">
            {new Date(order.created_at).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>

      {/* Status */}
      <div className={`rounded-2xl p-4 mb-6 ${getStatusColor(order.status)}`}>
        <div className="flex items-center gap-2">
          {order.status === 'delivered' && <CheckCircle className="w-5 h-5" />}
          {order.status === 'shipped' && <Truck className="w-5 h-5" />}
          {order.status === 'paid' && <Package className="w-5 h-5" />}
          {order.status === 'pending' && <Clock className="w-5 h-5" />}
          <span className="font-medium capitalize">{order.status}</span>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-2xl p-6 border border-orange-100 mb-6">
        <h2 className="font-medium text-maroon mb-4">Order Items</h2>
        <div className="space-y-4">
          {order.items?.map((item, idx) => (
            <div key={idx} className="flex gap-4 py-3 border-b border-gray-100 last:border-0">
              <div className="w-16 h-16 bg-orange-50 rounded-xl flex items-center justify-center overflow-hidden">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-8 h-8 text-saffron/30" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-gray-500">Qty: {item.quantity} × ₹{item.price}</p>
              </div>
              <p className="font-semibold">₹{item.subtotal}</p>
            </div>
          ))}
        </div>
        
        {/* Totals */}
        <div className="mt-4 pt-4 border-t space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span>₹{order.subtotal}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Shipping</span>
            <span className={order.shipping_cost === 0 ? 'text-green-600' : ''}>
              {order.shipping_cost === 0 ? 'FREE' : `₹${order.shipping_cost}`}
            </span>
          </div>
          <div className="flex justify-between text-lg font-bold pt-2 border-t">
            <span>Total</span>
            <span className="text-saffron">₹{order.total_amount}</span>
          </div>
        </div>
      </div>

      {/* Shipping Address */}
      <div className="bg-white rounded-2xl p-6 border border-orange-100 mb-6">
        <h2 className="font-medium text-maroon mb-3 flex items-center gap-2">
          <Truck className="w-5 h-5" /> Shipping Address
        </h2>
        <p className="font-medium">{order.shipping_name}</p>
        <p className="text-sm text-gray-600">{order.shipping_phone}</p>
        <p className="text-sm text-gray-600">{order.shipping_address}</p>
        <p className="text-sm text-gray-600">{order.shipping_city}</p>
      </div>

      {/* Payment Info */}
      <div className="bg-white rounded-2xl p-6 border border-orange-100">
        <h2 className="font-medium text-maroon mb-3 flex items-center gap-2">
          <CreditCard className="w-5 h-5" /> Payment
        </h2>
        <p className="text-sm">
          <span className="text-gray-600">Method:</span>{' '}
          <span className="font-medium">{order.payment_method === 'stripe' ? 'Card (Stripe)' : 'UPI/Net Banking (Razorpay)'}</span>
        </p>
        <p className="text-sm">
          <span className="text-gray-600">Status:</span>{' '}
          <span className={`font-medium ${order.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
            {order.payment_status}
          </span>
        </p>
      </div>
    </div>
  );
}
