import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { PaymentProvider } from './contexts/PaymentContext';
import MobileApp from './pages/MobileApp';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <PaymentProvider>
          <MobileApp />
        </PaymentProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
