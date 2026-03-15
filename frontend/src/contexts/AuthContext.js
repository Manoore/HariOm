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
  const [loading, setLoading] = useState(!getInitialUser());
  const [firebaseUser, setFirebaseUser] = useState(null);
  const authListenerActive = useRef(true);
  const hasProcessedInitialState = useRef(false);

  useEffect(() => {
    let isMounted = true;
    
    const unsubscribe = onFirebaseAuthStateChanged(async (fbUser) => {
      if (!isMounted || !authListenerActive.current) return;
      
      // Only process the first auth state change
      if (hasProcessedInitialState.current) {
        console.log('Already processed initial state, ignoring subsequent changes');
        return;
      }
      
      console.log('Processing auth state:', fbUser ? fbUser.email : 'null');
      
      if (fbUser) {
        hasProcessedInitialState.current = true;
        
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
            setFirebaseUser(fbUser);
            setUser(res.data.user);
            localStorage.setItem('divine_user', JSON.stringify(res.data.user));
          }
        } catch (error) {
          console.error('Sync error:', error);
          if (isMounted) {
            const fallbackUser = {
              email: fbUser.email,
              name: fbUser.displayName || 'User',
              role: 'devotee',
              firebase_uid: fbUser.uid
            };
            setFirebaseUser(fbUser);
            setUser(fallbackUser);
            localStorage.setItem('divine_user', JSON.stringify(fallbackUser));
          }
        }
      } else {
        // No Firebase user - check for cached session
        const cachedUser = getInitialUser();
        if (!cachedUser) {
          hasProcessedInitialState.current = true;
          setUser(null);
          setFirebaseUser(null);
        }
        // If we have cached user, keep it (legacy session)
      }
      
      if (isMounted) {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
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

  // Google Sign In (with optional role for new registrations)
  const loginWithGoogle = async (selectedRole = null) => {
    try {
      console.log('Starting Google Sign-In...', selectedRole ? `with role: ${selectedRole}` : '');
      
      const result = await firebaseGoogleSignIn();
      console.log('Google Sign-In successful:', result.user?.email);
      
      // Handle the sign-in directly here since we're ignoring subsequent auth state changes
      if (result.user) {
        const idToken = await result.user.getIdToken();
        localStorage.setItem('divine_token', idToken);
        
        try {
          const res = await api.post('/api/auth/firebase-sync', {
            firebase_uid: result.user.uid,
            email: result.user.email,
            name: result.user.displayName || result.user.email?.split('@')[0] || 'User',
            photo_url: result.user.photoURL,
            role: selectedRole // Pass role for new users
          });
          
          setFirebaseUser(result.user);
          setUser(res.data.user);
          localStorage.setItem('divine_user', JSON.stringify(res.data.user));
          hasProcessedInitialState.current = true;
        } catch (syncError) {
          console.error('Backend sync failed:', syncError);
          const basicUser = {
            email: result.user.email,
            name: result.user.displayName || 'User',
            role: 'devotee',
            firebase_uid: result.user.uid
          };
          setFirebaseUser(result.user);
          setUser(basicUser);
          localStorage.setItem('divine_user', JSON.stringify(basicUser));
          hasProcessedInitialState.current = true;
        }
      }
      
      setLoading(false);
      return { user: result.user };
    } catch (error) {
      console.error('Google sign in error:', error.code, error.message);
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    try {
      authListenerActive.current = false; // Disable listener during logout
      await firebaseSignOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
    localStorage.removeItem('divine_token');
    localStorage.removeItem('divine_user');
    setUser(null);
    setFirebaseUser(null);
    hasProcessedInitialState.current = false; // Reset for next login
    authListenerActive.current = true; // Re-enable listener
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
