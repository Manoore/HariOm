import React, { createContext, useContext, useState, useEffect } from 'react';

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
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      const userCountry = data.country_code || 'US';
      setCountry(userCountry);
      
      if (userCountry === 'IN') {
        setPaymentMethod('razorpay');
      } else {
        setPaymentMethod('stripe');
      }
    } catch (error) {
      console.error('Location detection failed:', error);
      setPaymentMethod('stripe');
      setCountry('US');
    } finally {
      setLoading(false);
    }
  };

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
