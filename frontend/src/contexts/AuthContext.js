import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../lib/api';
import { 
  onFirebaseAuthStateChanged, 
  firebaseSignIn, 
  firebaseSignUp, 
  firebaseSignOut,
  firebaseGoogleSignIn,
  getIdToken,
  isFirebaseConfigured
} from '../lib/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const syncInProgress = useRef(false);
  const initialLoadDone = useRef(false);

  useEffect(() => {
    // First, check for cached user to prevent flash
    const cachedUser = localStorage.getItem('divine_user');
    if (cachedUser) {
      try {
        setUser(JSON.parse(cachedUser));
      } catch (e) {
        localStorage.removeItem('divine_user');
      }
    }

    // Listen to Firebase auth state changes
    const unsubscribe = onFirebaseAuthStateChanged(async (fbUser) => {
      // Prevent multiple syncs running simultaneously
      if (syncInProgress.current) return;
      
      if (fbUser) {
        setFirebaseUser(fbUser);
        
        // Only sync if we don't already have user data or it's a different user
        const currentUser = user || (cachedUser ? JSON.parse(cachedUser) : null);
        if (!currentUser || currentUser.firebase_uid !== fbUser.uid) {
          syncInProgress.current = true;
          
          try {
            const idToken = await fbUser.getIdToken();
            localStorage.setItem('divine_token', idToken);
            
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
            const fallbackUser = {
              email: fbUser.email,
              name: fbUser.displayName || 'User',
              role: 'devotee',
              firebase_uid: fbUser.uid
            };
            setUser(fallbackUser);
            localStorage.setItem('divine_user', JSON.stringify(fallbackUser));
          } finally {
            syncInProgress.current = false;
          }
        }
      } else if (!localStorage.getItem('divine_token')) {
        // Only clear if no token exists (handles legacy login)
        setFirebaseUser(null);
        setUser(null);
        localStorage.removeItem('divine_token');
        localStorage.removeItem('divine_user');
      }
      
      if (!initialLoadDone.current) {
        initialLoadDone.current = true;
        setLoading(false);
      }
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
      console.log('Firebase login failed, trying backend:', error.code);
      try {
        const res = await api.post('/api/auth/login', { email, password });
        localStorage.setItem('divine_token', res.data.token);
        localStorage.setItem('divine_user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        setLoading(false);
        return res.data;
      } catch (backendError) {
        throw backendError.response?.data?.detail ? backendError : error;
      }
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
      console.log('Starting Google Sign-In...');
      syncInProgress.current = true;
      
      const result = await firebaseGoogleSignIn();
      console.log('Google Sign-In result received:', result.user?.email);
      
      if (result.user) {
        console.log('Syncing user with backend...');
        const idToken = await result.user.getIdToken();
        localStorage.setItem('divine_token', idToken);
        
        try {
          const res = await api.post('/api/auth/firebase-sync', {
            firebase_uid: result.user.uid,
            email: result.user.email,
            name: result.user.displayName || result.user.email?.split('@')[0] || 'User',
            photo_url: result.user.photoURL
          });
          
          console.log('Backend sync successful:', res.data);
          setUser(res.data.user);
          setFirebaseUser(result.user);
          localStorage.setItem('divine_user', JSON.stringify(res.data.user));
        } catch (syncError) {
          console.error('Backend sync failed:', syncError);
          const basicUser = {
            email: result.user.email,
            name: result.user.displayName || 'User',
            role: 'devotee',
            firebase_uid: result.user.uid
          };
          setUser(basicUser);
          setFirebaseUser(result.user);
          localStorage.setItem('divine_user', JSON.stringify(basicUser));
        }
      }
      
      syncInProgress.current = false;
      setLoading(false);
      return { user: result.user };
    } catch (error) {
      syncInProgress.current = false;
      console.error('Google sign in error:', error.code, error.message);
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
