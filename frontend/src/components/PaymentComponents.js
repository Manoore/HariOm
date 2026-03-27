import React, { useState } from 'react';
import { IndianRupee, Loader2, Shield, Lock } from 'lucide-react';
import api from '../lib/api';

// ============================================================
// STRIPE PAYMENT COMPONENT — PLACEHOLDER (Not active in app)
// Kept for future international expansion if needed.
// To re-enable: update PaymentContext.js to detect location
// and set paymentMethod to 'stripe' for non-India users.
// ============================================================
// export function StripePayment({ ... }) { ... }

// Razorpay Payment Component — PRIMARY GATEWAY
export function RazorpayPayment({ amount, currency = 'INR', onSuccess, onError, description, metadata, userEmail, userName }) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      // Create order on backend
      const response = await api.post('/api/payments/razorpay/create-order', {
        amount: Math.round(amount * 100),
        currency,
        description,
        metadata
      });

      const { order_id, razorpay_key } = response.data;

      // Load Razorpay script if not loaded
      if (!window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        await new Promise(resolve => script.onload = resolve);
      }

      // Open Razorpay checkout
      const options = {
        key: razorpay_key,
        amount: Math.round(amount * 100),
        currency,
        name: 'Divine App',
        description: description || 'Payment for services',
        order_id,
        prefill: {
          email: userEmail,
          name: userName
        },
        theme: {
          color: '#FF9933'
        },
        handler: function(response) {
          onSuccess({
            payment_id: response.razorpay_payment_id,
            order_id: response.razorpay_order_id,
            signature: response.razorpay_signature,
            method: 'razorpay',
            amount,
            currency
          });
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      onError(error.response?.data?.detail || 'Payment failed');
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <IndianRupee className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Pay with Razorpay</h3>
          <p className="text-sm text-gray-500">UPI, Cards, Netbanking & more</p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 mb-6">
        <div className="flex flex-wrap justify-center gap-3">
          <div className="bg-white rounded-lg px-3 py-2 border border-gray-200">
            <span className="text-sm font-medium text-gray-700">UPI</span>
          </div>
          <div className="bg-white rounded-lg px-3 py-2 border border-gray-200">
            <span className="text-sm font-medium text-gray-700">Cards</span>
          </div>
          <div className="bg-white rounded-lg px-3 py-2 border border-gray-200">
            <span className="text-sm font-medium text-gray-700">Netbanking</span>
          </div>
          <div className="bg-white rounded-lg px-3 py-2 border border-gray-200">
            <span className="text-sm font-medium text-gray-700">Wallets</span>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100">
        <div className="flex justify-between mb-4">
          <span className="text-gray-600">Total Amount</span>
          <span className="font-bold text-xl">₹{amount.toFixed(2)}</span>
        </div>

        <button
          onClick={handlePayment}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          data-testid="razorpay-pay-button"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Lock className="w-4 h-4" />
              Pay ₹{amount.toFixed(2)}
            </>
          )}
        </button>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
        <Shield className="w-3 h-3" />
        <span>100% Secure Payments by Razorpay</span>
      </div>
    </div>
  );
}

// Smart Payment Component — Uses Razorpay only
// Stripe support removed from active flow. See comment at top of file.
export function SmartPayment({ amount, onSuccess, onError, description, metadata, userEmail, userName }) {
  return (
    <RazorpayPayment
      amount={amount}
      currency="INR"
      onSuccess={onSuccess}
      onError={onError}
      description={description}
      metadata={metadata}
      userEmail={userEmail}
      userName={userName}
    />
  );
}

export default SmartPayment;
