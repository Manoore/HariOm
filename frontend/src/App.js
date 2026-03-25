import React, { useEffect, useRef } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { PaymentProvider } from './contexts/PaymentContext';
import MobileApp from './pages/MobileApp';
import InstallPWA from './components/InstallPWA';
import api from './lib/api';
import { toast, Toaster } from 'sonner';
import './App.css';

// Initialize i18n
import './i18n';

// Payment redirect handler component
function PaymentHandler({ children }) {
  const hasHandledPayment = useRef(false);
  
  useEffect(() => {
    // Prevent running twice in strict mode
    if (hasHandledPayment.current) return;
    
    const handlePaymentRedirect = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const paymentStatus = urlParams.get('payment');
      const orderId = urlParams.get('order_id');
      
      if (paymentStatus && orderId) {
        hasHandledPayment.current = true;
        
        // Clear URL parameters first
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Small delay to ensure component is fully mounted before showing toast
        await new Promise(resolve => setTimeout(resolve, 100));
        
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
  // Clean up stale/broken service workers on app load
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          // Force update the service worker so stale cached versions are replaced
          registration.update().catch(() => {});
        }
      }).catch(() => {});
    }
  }, []);

  return (
    <AuthProvider>
      <CartProvider>
        <PaymentProvider>
          <PaymentHandler>
            <Toaster position="top-center" richColors />
            <MobileApp />
            <InstallPWA />
          </PaymentHandler>
        </PaymentProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
