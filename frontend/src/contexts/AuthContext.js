import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../lib/api';
import { 
  onFirebaseAuthStateChanged, 
  firebaseSignIn, 
  firebaseSignUp, 
  firebaseSignOut,
  firebaseGoogleSignIn,
  firebasePasswordReset,
  checkGoogleRedirectResult,
  getIdToken,
  isFirebaseConfigured,
  setupRecaptcha,
  sendPhoneOTP,
  verifyPhoneOTP
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
  // Guard flag: when true, onAuthStateChanged should NOT process user
  // This prevents race conditions during Phone OTP and Google auth flows
  const manualAuthInProgress = useRef(false);

  // Loading safety timeout — if loading is stuck for 15 seconds, force it to false
  useEffect(() => {
    if (!loading) return;
    const timeout = setTimeout(() => {
      console.warn('Auth loading timeout reached, forcing loading to false');
      setLoading(false);
    }, 15000);
    return () => clearTimeout(timeout);
  }, [loading]);

  useEffect(() => {
    let isMounted = true;
    
    // Check for Google redirect result first (for mobile sign-in)
    const handleRedirectResult = async () => {
      try {
        const result = await checkGoogleRedirectResult();
        if (result && result.user) {
          console.log('Google redirect sign-in detected:', result.user.email);
          hasProcessedInitialState.current = false;
          
          // Retrieve pending role from before redirect
          const pendingRole = localStorage.getItem('divine_pending_role');
          
          const idToken = await result.user.getIdToken();
          localStorage.setItem('divine_token', idToken);
          
          try {
            const res = await api.post('/api/auth/firebase-sync', {
              firebase_uid: result.user.uid,
              email: result.user.email,
              name: result.user.displayName || result.user.email?.split('@')[0] || 'User',
              photo_url: result.user.photoURL,
              role: pendingRole || undefined
            });
            
            if (isMounted) {
              setFirebaseUser(result.user);
              setUser(res.data.user);
              localStorage.setItem('divine_user', JSON.stringify(res.data.user));
              localStorage.removeItem('divine_pending_role');
              hasProcessedInitialState.current = true;
            }
          } catch (syncError) {
            console.error('Backend sync after redirect failed:', syncError);
            // Even if backend sync fails, set a basic user so the app isn't stuck
            if (isMounted) {
              const fallbackUser = {
                id: result.user.uid,
                email: result.user.email,
                name: result.user.displayName || 'User',
                role: pendingRole || 'devotee',
                firebase_uid: result.user.uid
              };
              setFirebaseUser(result.user);
              setUser(fallbackUser);
              localStorage.setItem('divine_user', JSON.stringify(fallbackUser));
              hasProcessedInitialState.current = true;
            }
          }
        }
      } catch (error) {
        console.error('Error checking redirect result:', error);
      } finally {
        // Always ensure loading ends after redirect check
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    handleRedirectResult();
    
    const unsubscribe = onFirebaseAuthStateChanged(async (fbUser) => {
      if (!isMounted || !authListenerActive.current) return;
      
      // CRITICAL: Skip processing if a manual auth flow (Phone OTP or Google)
      // is currently in progress. The manual flow handles user state itself.
      if (manualAuthInProgress.current) {
        console.log('Manual auth in progress, skipping onAuthStateChanged');
        if (fbUser) {
          setFirebaseUser(fbUser);
        }
        return;
      }
      
      // Skip if already processed AND no firebase user change
      if (hasProcessedInitialState.current && !fbUser) {
        console.log('Already processed initial state, ignoring null state');
        return;
      }
      
      console.log('Processing auth state:', fbUser ? (fbUser.email || fbUser.phoneNumber) : 'null');
      
      if (fbUser) {
        hasProcessedInitialState.current = true;
        
        try {
          const idToken = await fbUser.getIdToken();
          localStorage.setItem('divine_token', idToken);
          
          const res = await api.post('/api/auth/firebase-sync', {
            firebase_uid: fbUser.uid,
            email: fbUser.email || fbUser.phoneNumber,
            name: fbUser.displayName || fbUser.email?.split('@')[0] || fbUser.phoneNumber || 'User',
            photo_url: fbUser.photoURL,
            phone: fbUser.phoneNumber || undefined,
            auth_type: fbUser.phoneNumber ? 'phone' : undefined
          });
          
          if (isMounted) {
            setFirebaseUser(fbUser);
            setUser(res.data.user);
            localStorage.setItem('divine_user', JSON.stringify(res.data.user));
          }
        } catch (error) {
          console.error('Sync error:', error);
          if (isMounted) {
            // Only set fallback if we don't already have a valid user
            const existingUser = getInitialUser();
            if (!existingUser) {
              const fallbackUser = {
                id: fbUser.uid,
                email: fbUser.email || fbUser.phoneNumber,
                name: fbUser.displayName || fbUser.phoneNumber || 'User',
                phone: fbUser.phoneNumber,
                role: 'devotee',
                firebase_uid: fbUser.uid
              };
              setFirebaseUser(fbUser);
              setUser(fallbackUser);
              localStorage.setItem('divine_user', JSON.stringify(fallbackUser));
            }
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
      
      // Set guard to prevent onAuthStateChanged from interfering
      manualAuthInProgress.current = true;
      
      // Store selected role for redirect flow (mobile)
      if (selectedRole) {
        localStorage.setItem('divine_pending_role', selectedRole);
      }
      
      const result = await firebaseGoogleSignIn();
      
      // On mobile, signInWithRedirect returns null — the result is handled 
      // by checkGoogleRedirectResult after page reload
      if (!result) {
        console.log('Redirect flow initiated (mobile), waiting for redirect...');
        manualAuthInProgress.current = false;
        return { user: null, redirecting: true };
      }
      
      console.log('Google Sign-In successful:', result.user?.email);
      
      if (result.user) {
        const idToken = await result.user.getIdToken();
        localStorage.setItem('divine_token', idToken);
        
        try {
          const res = await api.post('/api/auth/firebase-sync', {
            firebase_uid: result.user.uid,
            email: result.user.email,
            name: result.user.displayName || result.user.email?.split('@')[0] || 'User',
            photo_url: result.user.photoURL,
            role: selectedRole
          });
          
          setFirebaseUser(result.user);
          setUser(res.data.user);
          localStorage.setItem('divine_user', JSON.stringify(res.data.user));
          localStorage.removeItem('divine_pending_role');
          hasProcessedInitialState.current = true;
        } catch (syncError) {
          console.error('Backend sync failed:', syncError);
          const basicUser = {
            id: result.user.uid,
            email: result.user.email,
            name: result.user.displayName || 'User',
            role: selectedRole || 'devotee',
            firebase_uid: result.user.uid
          };
          setFirebaseUser(result.user);
          setUser(basicUser);
          localStorage.setItem('divine_user', JSON.stringify(basicUser));
          localStorage.removeItem('divine_pending_role');
          hasProcessedInitialState.current = true;
        }
      }
      
      setLoading(false);
      // Release guard after user state is fully set
      manualAuthInProgress.current = false;
      return { user: result.user };
    } catch (error) {
      console.error('Google sign in error:', error.code, error.message);
      manualAuthInProgress.current = false;
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

  // ==================== PHONE AUTHENTICATION ====================
  
  // Initialize reCAPTCHA for phone auth (no longer needed - handled in sendPhoneOTP)
  const initPhoneAuth = (containerId = 'recaptcha-container') => {
    // This is now a no-op as reCAPTCHA is created fresh for each OTP request
    console.log('Phone auth initialized for container:', containerId);
    return true;
  };

  // Send OTP to phone number
  const sendOTP = async (phoneNumber) => {
    try {
      const result = await sendPhoneOTP(phoneNumber);
      return result;
    } catch (error) {
      console.error('Error sending OTP:', error);
      throw error;
    }
  };

  // Verify OTP and sign in with phone
  const verifyOTPAndSignIn = async (otp, userData = {}) => {
    try {
      // Set guard to prevent onAuthStateChanged from interfering
      manualAuthInProgress.current = true;
      
      const result = await verifyPhoneOTP(otp);
      
      if (result.user) {
        const idToken = await result.user.getIdToken();
        localStorage.setItem('divine_token', idToken);
        
        try {
          // Sync with backend - phone number as identifier
          const res = await api.post('/api/auth/firebase-sync', {
            firebase_uid: result.user.uid,
            email: result.user.phoneNumber, // Use phone as email placeholder
            name: userData.name || result.user.phoneNumber,
            phone: result.user.phoneNumber,
            role: userData.role || 'devotee',
            auth_type: 'phone' // Mark as phone auth
          });
          
          setFirebaseUser(result.user);
          setUser(res.data.user);
          localStorage.setItem('divine_user', JSON.stringify(res.data.user));
          hasProcessedInitialState.current = true;
        } catch (syncError) {
          console.error('Backend sync failed:', syncError);
          const basicUser = {
            id: result.user.uid,
            phone: result.user.phoneNumber,
            name: userData.name || result.user.phoneNumber,
            role: userData.role || 'devotee',
            firebase_uid: result.user.uid
          };
          setFirebaseUser(result.user);
          setUser(basicUser);
          localStorage.setItem('divine_user', JSON.stringify(basicUser));
          hasProcessedInitialState.current = true;
        }
      }
      
      setLoading(false);
      // Release guard after user state is fully set
      manualAuthInProgress.current = false;
      return { user: result.user };
    } catch (error) {
      console.error('OTP verification error:', error);
      manualAuthInProgress.current = false;
      throw error;
    }
  };

  // ==================== END PHONE AUTHENTICATION ====================

  // Forgot Password
  const forgotPassword = async (email) => {
    try {
      await firebasePasswordReset(email);
      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
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
      firebaseUser,
      forgotPassword,
      // Phone auth methods
      initPhoneAuth,
      sendOTP,
      verifyOTPAndSignIn
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
