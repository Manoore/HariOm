import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authAPI, setAuthToken, getAuthToken } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on app start
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await getAuthToken();
      if (token) {
        const response = await authAPI.getProfile();
        setUser(response.data);
      }
    } catch (err) {
      console.log('Auth check failed:', err);
      await setAuthToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      
      console.log('Attempting login with:', email);
      const response = await authAPI.login(email, password);
      console.log('Login response:', response.data);
      
      // Backend returns { token, user } not { access_token, user }
      const { token, user: userData } = response.data;
      
      console.log('Setting token and user...');
      await setAuthToken(token);
      setUser(userData);
      
      console.log('Login successful!');
      return { success: true };
    } catch (err) {
      console.error('Login error:', err);
      console.error('Error response:', err.response?.data);
      const errorMessage = err.response?.data?.detail || err.message || 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await authAPI.register(userData);
      // Backend returns { token, user } not { access_token, user }
      const { token, user: newUser } = response.data;
      
      await setAuthToken(token);
      setUser(newUser);
      
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Registration failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await setAuthToken(null);
      await SecureStore.deleteItemAsync('user');
      setUser(null);
    } catch (err) {
      console.log('Logout error:', err);
    }
  };

  const updateProfile = async (data) => {
    try {
      setError(null);
      const response = await authAPI.updateProfile(data);
      setUser(response.data);
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Profile update failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Firebase sync for Google/Phone auth
  const firebaseSync = async (firebaseUser) => {
    try {
      setError(null);
      setLoading(true);
      
      const userData = {
        firebase_uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName,
        phone: firebaseUser.phoneNumber,
        photo_url: firebaseUser.photoURL,
      };
      
      const response = await authAPI.firebaseSync(userData);
      // Backend returns { token, user } not { access_token, user }
      const { token, user: syncedUser } = response.data;
      
      await setAuthToken(token);
      setUser(syncedUser);
      
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Firebase sync failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    firebaseSync,
    checkAuth,
    isAuthenticated: !!user,
    isDevotee: user?.role === 'devotee',
    isPriest: user?.role === 'priest',
    isAstrologer: user?.role === 'astrologer',
    isShopOwner: user?.role === 'shop_owner',
    isAdmin: user?.role === 'admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
