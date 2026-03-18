import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, IndianRupee, Globe, Loader2, CheckCircle, Shield, Lock } from 'lucide-react';
import { usePayment } from '../contexts/PaymentContext';
import api from '../lib/api';

// Stripe Payment Component
export function StripePayment({ amount, currency = 'INR', clientSecret, onSuccess, onError, description, metadata }) {
  const [loading, setLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  const handlePayment = async () => {
    // Validate inputs
    if (!cardNumber || cardNumber.length < 16) {
      onError('Please enter a valid card number');
      return;
    }
    if (!expiry || expiry.length < 5) {
      onError('Please enter a valid expiry date');
      return;
    }
    if (!cvc || cvc.length < 3) {
      onError('Please enter a valid CVC');
      return;
    }

    setLoading(true);
    try {
      let paymentClientSecret = clientSecret;
      let paymentIntentId = null;
      
      // If no clientSecret provided, create a new payment intent
      if (!paymentClientSecret) {
        const response = await api.post('/api/payments/stripe/create-intent', {
          amount: Math.round(amount * 100), // Convert to paise
          currency,
          description,
          metadata
        });
        paymentClientSecret = response.data.client_secret;
        paymentIntentId = response.data.payment_intent_id;
      } else {
        // Extract payment intent ID from clientSecret
        paymentIntentId = clientSecret.split('_secret_')[0];
      }

      // Confirm the payment with Stripe
      const confirmResponse = await api.post('/api/payments/stripe/confirm', {
        payment_intent_id: paymentIntentId,
        card_number: cardNumber.replace(/\s/g, ''),
        exp_month: expiry.split('/')[0],
        exp_year: '20' + expiry.split('/')[1],
        cvc: cvc
      });

      if (confirmResponse.data.status === 'succeeded' || confirmResponse.data.success) {
        onSuccess({
          payment_id: paymentIntentId,
          method: 'stripe',
          amount,
          currency
        });
      } else if (confirmResponse.data.status === 'requires_action') {
        onError('3D Secure authentication required. Please try a different card.');
      } else {
        onError('Payment could not be processed. Please try again.');
      }
    } catch (error) {
      onError(error.response?.data?.detail || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Pay with Card</h3>
          <p className="text-sm text-gray-500">Powered by Stripe</p>
        </div>
        <div className="ml-auto flex gap-2">
          <img src="https://img.icons8.com/color/32/visa.png" alt="Visa" className="h-6" />
          <img src="https://img.icons8.com/color/32/mastercard.png" alt="Mastercard" className="h-6" />
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
          <input
            type="text"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
            placeholder="4242 4242 4242 4242"
            className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
            data-testid="stripe-card-number"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry</label>
            <input
              type="text"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              placeholder="MM/YY"
              className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
              data-testid="stripe-expiry"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CVC</label>
            <input
              type="text"
              value={cvc}
              onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="123"
              className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
              data-testid="stripe-cvc"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <div className="flex justify-between mb-4">
            <span className="text-gray-600">Total Amount</span>
            <span className="font-bold text-xl">{currency === 'USD' ? '$' : '₹'}{amount.toFixed(2)}</span>
          </div>

          <button
            onClick={handlePayment}
            disabled={loading || !cardNumber || !expiry || !cvc}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            data-testid="stripe-pay-button"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Pay {currency === 'USD' ? '$' : '₹'}{amount.toFixed(2)}
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
        <Shield className="w-3 h-3" />
        <span>Secured by 256-bit SSL encryption</span>
      </div>
    </div>
  );
}

// Razorpay Payment Component
export function RazorpayPayment({ amount, currency = 'INR', onSuccess, onError, description, metadata, userEmail, userName }) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      // Create order on backend
      const response = await api.post('/api/payments/razorpay/create-order', {
        amount: Math.round(amount * 100), // Convert to paise
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

// Smart Payment Component - Auto-selects based on location
export function SmartPayment({ amount, clientSecret, onSuccess, onError, description, metadata, userEmail, userName }) {
  const { paymentMethod, country, loading: locationLoading, setManualPaymentMethod, isIndia } = usePayment();
  const [showOptions, setShowOptions] = useState(false);

  if (locationLoading) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-gray-200 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-saffron mx-auto mb-4" />
        <p className="text-gray-600">Detecting your location...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Location indicator */}
      <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            Detected: <strong>{isIndia ? 'India' : 'International'}</strong>
          </span>
        </div>
        <button 
          onClick={() => setShowOptions(!showOptions)}
          className="text-sm text-saffron hover:underline"
        >
          Change
        </button>
      </div>

      {/* Payment method selector */}
      {showOptions && (
        <motion.div 
          className="grid grid-cols-2 gap-3"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          <button
            onClick={() => { setManualPaymentMethod('razorpay'); setShowOptions(false); }}
            className={`p-4 rounded-xl border-2 transition-all ${
              paymentMethod === 'razorpay' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <IndianRupee className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <span className="text-sm font-medium">Razorpay</span>
            <span className="text-xs text-gray-500 block">India</span>
          </button>
          <button
            onClick={() => { setManualPaymentMethod('stripe'); setShowOptions(false); }}
            className={`p-4 rounded-xl border-2 transition-all ${
              paymentMethod === 'stripe' 
                ? 'border-indigo-500 bg-indigo-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <CreditCard className="w-6 h-6 mx-auto mb-2 text-indigo-600" />
            <span className="text-sm font-medium">Stripe</span>
            <span className="text-xs text-gray-500 block">International</span>
          </button>
        </motion.div>
      )}

      {/* Payment form */}
      {paymentMethod === 'razorpay' ? (
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
      ) : (
        <StripePayment
          amount={amount}
          currency="INR"
          clientSecret={clientSecret}
          onSuccess={onSuccess}
          onError={onError}
          description={description}
          metadata={metadata}
        />
      )}
    </div>
  );
}

export default SmartPayment;
