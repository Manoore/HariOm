import React, { createContext, useContext, useState, useEffect } from 'react';
import { cartAPI } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      setCart([]);
    }
  }, [isAuthenticated]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await cartAPI.get();
      setCart(response.data.items || []);
    } catch (err) {
      console.log('Fetch cart error:', err);
      setCart([]);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    try {
      setError(null);
      setLoading(true);
      await cartAPI.add(productId, quantity);
      await fetchCart();
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Failed to add to cart';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId, quantity) => {
    try {
      setError(null);
      setLoading(true);
      
      if (quantity <= 0) {
        await cartAPI.remove(productId);
      } else {
        await cartAPI.update(productId, quantity);
      }
      
      await fetchCart();
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Failed to update cart';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (productId) => {
    try {
      setError(null);
      setLoading(true);
      await cartAPI.remove(productId);
      await fetchCart();
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Failed to remove from cart';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      setError(null);
      setLoading(true);
      await cartAPI.clear();
      setCart([]);
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Failed to clear cart';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const cartItemCount = cart.reduce((total, item) => total + (item.quantity || 0), 0);
  
  const cartTotal = cart.reduce((total, item) => {
    const price = item.product?.price || 0;
    const quantity = item.quantity || 0;
    return total + (price * quantity);
  }, 0);

  const value = {
    cart,
    loading,
    error,
    fetchCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    cartItemCount,
    cartTotal,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;
