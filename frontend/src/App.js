import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import MobileApp from './pages/MobileApp';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <MobileApp />
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
