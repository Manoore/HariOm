import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import api from '../lib/api';

export function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('checking');
  const [paymentData, setPaymentData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      checkPaymentStatus(sessionId);
    } else {
      setStatus('error');
    }
  }, [searchParams]);

  const checkPaymentStatus = async (sessionId, attempts = 0) => {
    const maxAttempts = 5;
    const pollInterval = 2000;

    if (attempts >= maxAttempts) {
      setStatus('timeout');
      return;
    }

    try {
      const res = await api.get(`/api/payments/status/${sessionId}`);
      setPaymentData(res.data);

      if (res.data.payment_status === 'paid') {
        setStatus('success');
      } else if (res.data.status === 'expired') {
        setStatus('expired');
      } else {
        setTimeout(() => checkPaymentStatus(sessionId, attempts + 1), pollInterval);
      }
    } catch (error) {
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 flex items-center justify-center bg-gradient-to-b from-cream to-parchment">
      <motion.div
        className="w-full max-w-md text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="card p-8">
          {status === 'checking' && (
            <>
              <Loader2 className="w-16 h-16 text-saffron animate-spin mx-auto mb-4" />
              <h1 className="font-cinzel text-2xl font-bold text-maroon mb-2">
                Processing Payment
              </h1>
              <p className="text-gray-600">Please wait while we confirm your payment...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h1 className="font-cinzel text-2xl font-bold text-green-700 mb-2">
                Payment Successful!
              </h1>
              <p className="text-gray-600 mb-6">
                Thank you for your payment. Your order has been confirmed.
              </p>
              {paymentData && (
                <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                  <p className="text-sm text-gray-600">Amount Paid</p>
                  <p className="text-2xl font-bold text-maroon">
                    {paymentData.currency?.toUpperCase()} {(paymentData.amount_total / 100).toFixed(2)}
                  </p>
                </div>
              )}
              <button
                onClick={() => navigate('/dashboard')}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                Go to Dashboard <ArrowRight className="w-5 h-5" />
              </button>
            </>
          )}

          {(status === 'error' || status === 'expired' || status === 'timeout') && (
            <>
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-12 h-12 text-red-600" />
              </div>
              <h1 className="font-cinzel text-2xl font-bold text-red-700 mb-2">
                {status === 'timeout' ? 'Payment Verification Timeout' : 'Payment Failed'}
              </h1>
              <p className="text-gray-600 mb-6">
                {status === 'timeout' 
                  ? 'Please check your email for payment confirmation.'
                  : 'Something went wrong with your payment. Please try again.'}
              </p>
              <button
                onClick={() => navigate('/marketplace')}
                className="btn-secondary w-full"
              >
                Return to Marketplace
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export function PaymentCancelPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 flex items-center justify-center bg-gradient-to-b from-cream to-parchment">
      <motion.div
        className="w-full max-w-md text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="card p-8">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-12 h-12 text-yellow-600" />
          </div>
          <h1 className="font-cinzel text-2xl font-bold text-yellow-700 mb-2">
            Payment Cancelled
          </h1>
          <p className="text-gray-600 mb-6">
            Your payment was cancelled. Your cart items are still saved.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/cart')}
              className="btn-primary w-full"
            >
              Return to Cart
            </button>
            <button
              onClick={() => navigate('/marketplace')}
              className="btn-secondary w-full"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
