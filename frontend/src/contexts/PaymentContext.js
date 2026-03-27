import React, { createContext, useContext, useState } from 'react';

const PaymentContext = createContext(null);

export function PaymentProvider({ children }) {
  // Razorpay is the sole active payment gateway
  // Stripe support kept as placeholder for future international expansion
  const [paymentMethod] = useState('razorpay');

  return (
    <PaymentContext.Provider value={{ 
      paymentMethod, 
      country: 'IN',
      loading: false,
      setManualPaymentMethod: () => {},
      isIndia: true
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
