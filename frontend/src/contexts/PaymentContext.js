import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

const PaymentContext = createContext(null);

export function PaymentProvider({ children }) {
  const [paymentMethod, setPaymentMethod] = useState(null); // 'stripe' or 'razorpay'
  const [country, setCountry] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    detectLocation();
  }, []);

  const detectLocation = async () => {
    try {
      // Try to detect user's country via IP
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      const userCountry = data.country_code || 'US';
      setCountry(userCountry);
      
      // India uses Razorpay, rest of world uses Stripe
      if (userCountry === 'IN') {
        setPaymentMethod('razorpay');
      } else {
        setPaymentMethod('stripe');
      }
    } catch (error) {
      console.error('Location detection failed:', error);
      // Default to Stripe for international
      setPaymentMethod('stripe');
      setCountry('US');
    } finally {
      setLoading(false);
    }
  };

  // Manual override for testing
  const setManualPaymentMethod = (method) => {
    setPaymentMethod(method);
  };

  return (
    <PaymentContext.Provider value={{ 
      paymentMethod, 
      country, 
      loading,
      setManualPaymentMethod,
      isIndia: country === 'IN'
    }}>
      {children}
    </PaymentContext.Provider>
  );
}

export function usePayment() {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
}
