import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [cartCount, setCartCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      setCart({ items: [], total: 0 });
      setCartCount(0);
    }
  }, [user]);

  const fetchCart = async () => {
    try {
      const res = await api.get('/api/cart');
      setCart(res.data);
      setCartCount(res.data.items?.reduce((sum, item) => sum + item.quantity, 0) || 0);
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    try {
      await api.post('/api/cart/add', { product_id: productId, quantity });
      await fetchCart();
      return true;
    } catch (error) {
      console.error('Error adding to cart:', error);
      return false;
    }
  };

  const removeFromCart = async (productId) => {
    try {
      await api.delete(`/api/cart/remove/${productId}`);
      await fetchCart();
      return true;
    } catch (error) {
      console.error('Error removing from cart:', error);
      return false;
    }
  };

  const clearCart = async () => {
    try {
      await api.delete('/api/cart/clear');
      await fetchCart();
      return true;
    } catch (error) {
      console.error('Error clearing cart:', error);
      return false;
    }
  };

  return (
    <CartContext.Provider value={{ cart, cartCount, addToCart, removeFromCart, clearCart, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
