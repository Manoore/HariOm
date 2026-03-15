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

// Get initial user from localStorage synchronously
const getInitialUser = () => {
  try {
    const cached = localStorage.getItem('divine_user');
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  // Initialize with cached user to prevent flash
  const [user, setUser] = useState(getInitialUser);
  const [loading, setLoading] = useState(!getInitialUser()); // Only show loading if no cached user
  const [firebaseUser, setFirebaseUser] = useState(null);
  const syncInProgress = useRef(false);
  const initialLoadDone = useRef(false);
  const lastSyncedUid = useRef(getInitialUser()?.firebase_uid || null); // Initialize from cached user

  useEffect(() => {
    let isMounted = true;
    
    // Listen to Firebase auth state changes
    const unsubscribe = onFirebaseAuthStateChanged(async (fbUser) => {
      if (!isMounted) return;
      
      // Prevent multiple syncs running simultaneously
      if (syncInProgress.current) {
        console.log('Sync already in progress, skipping...');
        return;
      }
      
      if (fbUser) {
        console.log('Firebase user detected:', fbUser.email, 'UID:', fbUser.uid);
        setFirebaseUser(fbUser);
        
        // Only sync if this is a NEW Firebase user (different UID than last sync)
        if (lastSyncedUid.current !== fbUser.uid) {
          console.log('New user, syncing with backend...');
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
            
            if (isMounted) {
              console.log('Sync successful, setting user');
              lastSyncedUid.current = fbUser.uid;
              setUser(res.data.user);
              localStorage.setItem('divine_user', JSON.stringify(res.data.user));
            }
          } catch (error) {
            console.error('Error syncing with backend:', error);
            if (isMounted) {
              const fallbackUser = {
                email: fbUser.email,
                name: fbUser.displayName || 'User',
                role: 'devotee',
                firebase_uid: fbUser.uid
              };
              lastSyncedUid.current = fbUser.uid;
              setUser(fallbackUser);
              localStorage.setItem('divine_user', JSON.stringify(fallbackUser));
            }
          } finally {
            syncInProgress.current = false;
          }
        } else {
          console.log('Same user, skipping sync. UID:', fbUser.uid);
        }
      } else {
        console.log('No Firebase user detected');
        // Firebase has no user - but DON'T clear if we have a valid legacy token/user
        const hasToken = localStorage.getItem('divine_token');
        const hasUser = localStorage.getItem('divine_user');
        
        if (!hasToken && !hasUser) {
          console.log('No cached session, clearing user');
          setFirebaseUser(null);
          setUser(null);
          lastSyncedUid.current = null;
        } else {
          console.log('Keeping cached legacy session');
        }
      }
      
      if (!initialLoadDone.current && isMounted) {
        initialLoadDone.current = true;
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []); // Empty dependency array - only run once on mount

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
      
      const result = await firebaseGoogleSignIn();
      console.log('Google Sign-In successful:', result.user?.email);
      
      // Don't set user state here - let the auth state listener handle it
      // Just return the result
      return { user: result.user };
    } catch (error) {
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
    lastSyncedUid.current = null;
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
