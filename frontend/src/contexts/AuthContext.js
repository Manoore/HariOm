import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';
import { 
  onFirebaseAuthStateChanged, 
  firebaseSignIn, 
  firebaseSignUp, 
  firebaseSignOut,
  firebaseGoogleSignIn,
  getIdToken 
} from '../lib/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState(null);

  useEffect(() => {
    // Listen to Firebase auth state changes
    const unsubscribe = onFirebaseAuthStateChanged(async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        
        // Get Firebase ID token and sync with backend
        try {
          const idToken = await fbUser.getIdToken();
          localStorage.setItem('divine_token', idToken);
          
          // Sync user with backend (create or get existing user)
          const res = await api.post('/api/auth/firebase-sync', {
            firebase_uid: fbUser.uid,
            email: fbUser.email,
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
            photo_url: fbUser.photoURL
          });
          
          setUser(res.data.user);
          localStorage.setItem('divine_user', JSON.stringify(res.data.user));
        } catch (error) {
          console.error('Error syncing with backend:', error);
          // Fallback to basic user info from Firebase
          setUser({
            email: fbUser.email,
            name: fbUser.displayName || 'User',
            role: 'devotee',
            firebase_uid: fbUser.uid
          });
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
        localStorage.removeItem('divine_token');
        localStorage.removeItem('divine_user');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Login with email/password using Firebase
  const login = async (email, password) => {
    try {
      const userCredential = await firebaseSignIn(email, password);
      // Auth state listener will handle the rest
      return { user: userCredential.user };
    } catch (error) {
      // If Firebase login fails, try legacy backend login
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        // Try backend login for existing users not in Firebase
        const res = await api.post('/api/auth/login', { email, password });
        localStorage.setItem('divine_token', res.data.token);
        localStorage.setItem('divine_user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        return res.data;
      }
      throw error;
    }
  };

  // Register with email/password using Firebase
  const register = async (data) => {
    try {
      // Create Firebase user
      const userCredential = await firebaseSignUp(data.email, data.password, data.name);
      
      // Get ID token
      const idToken = await userCredential.user.getIdToken();
      localStorage.setItem('divine_token', idToken);
      
      // Register user in backend with role
      const res = await api.post('/api/auth/firebase-register', {
        firebase_uid: userCredential.user.uid,
        email: data.email,
        name: data.name,
        phone: data.phone,
        role: data.role || 'devotee'
      });
      
      setUser(res.data.user);
      localStorage.setItem('divine_user', JSON.stringify(res.data.user));
      return res.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  // Google Sign In
  const loginWithGoogle = async () => {
    try {
      const result = await firebaseGoogleSignIn();
      // Auth state listener will handle the rest
      return { user: result.user };
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    try {
      await firebaseSignOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
    localStorage.removeItem('divine_token');
    localStorage.removeItem('divine_user');
    setUser(null);
    setFirebaseUser(null);
  };

  // Update user data
  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('divine_user', JSON.stringify(userData));
  };

  // Refresh token (for API calls)
  const refreshToken = async () => {
    if (firebaseUser) {
      const newToken = await firebaseUser.getIdToken(true);
      localStorage.setItem('divine_token', newToken);
      return newToken;
    }
    return null;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      register, 
      logout, 
      loginWithGoogle,
      updateUser,
      refreshToken,
      firebaseUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
