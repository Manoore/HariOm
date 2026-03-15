import React, { useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { PaymentProvider } from './contexts/PaymentContext';
import MobileApp from './pages/MobileApp';
import api from './lib/api';
import { toast, Toaster } from 'sonner';
import './App.css';

// Payment redirect handler component
function PaymentHandler({ children }) {
  useEffect(() => {
    const handlePaymentRedirect = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const paymentStatus = urlParams.get('payment');
      const orderId = urlParams.get('order_id');
      
      if (paymentStatus && orderId) {
        // Clear URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
        
        if (paymentStatus === 'success') {
          try {
            // Confirm payment with backend
            const token = localStorage.getItem('divine_token');
            if (token) {
              await api.post(`/api/payment/confirm/${orderId}`);
              toast.success('Payment successful! Your order has been confirmed.', {
                duration: 5000,
              });
              // Clear pending order from localStorage
              localStorage.removeItem('pending_order');
            }
          } catch (error) {
            console.error('Error confirming payment:', error);
            toast.success('Payment received! Order is being processed.', {
              duration: 5000,
            });
          }
        } else if (paymentStatus === 'cancelled') {
          toast.error('Payment was cancelled. Your order is saved as pending.', {
            duration: 5000,
          });
        }
      }
    };
    
    handlePaymentRedirect();
  }, []);
  
  return children;
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <PaymentProvider>
          <PaymentHandler>
            <Toaster position="top-center" richColors />
            <MobileApp />
          </PaymentHandler>
        </PaymentProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
