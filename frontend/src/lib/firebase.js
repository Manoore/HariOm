// Firebase configuration and initialization
import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  updateProfile,
  browserLocalPersistence,
  setPersistence,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential,
  sendPasswordResetEmail
} from 'firebase/auth';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Check if Firebase is properly configured
const isFirebaseConfigured = firebaseConfig.apiKey && firebaseConfig.apiKey !== 'placeholder_api_key';

// Initialize Firebase (singleton pattern) - only if configured
let app = null;
let auth = null;
let googleProvider = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    // Set persistence to local to prevent constant re-authentication
    setPersistence(auth, browserLocalPersistence).catch(console.error);
    googleProvider = new GoogleAuthProvider();
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
}

// Auth functions with fallback handling
export const firebaseSignIn = async (email, password) => {
  if (!auth) {
    throw new Error('Firebase not configured');
  }
  return signInWithEmailAndPassword(auth, email, password);
};

export const firebaseSignUp = async (email, password, displayName) => {
  if (!auth) {
    throw new Error('Firebase not configured');
  }
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  // Update the user profile with display name
  if (displayName) {
    await updateProfile(userCredential.user, { displayName });
  }
  return userCredential;
};

export const firebaseSignOut = async () => {
  if (!auth) return;
  return signOut(auth);
};

export const firebaseGoogleSignIn = async () => {
  if (!auth || !googleProvider) {
    console.error('Firebase Google Sign-In not configured:', { auth: !!auth, googleProvider: !!googleProvider });
    throw new Error('Google Sign-In not configured');
  }
  
  try {
    console.log('Initiating Google Sign-In...');
    
    // Check if mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Use redirect for mobile (popups are often blocked)
      console.log('Mobile detected, using redirect flow...');
      await signInWithRedirect(auth, googleProvider);
      // The result will be handled by getRedirectResult in AuthContext
      return null;
    } else {
      // Use popup for desktop
      const result = await signInWithPopup(auth, googleProvider);
      console.log('Google Sign-In successful:', result.user.email);
      return result;
    }
  } catch (error) {
    console.error('Google Sign-In error:', error.code, error.message);
    throw error;
  }
};

// Check for redirect result (for mobile Google Sign-In)
export const checkGoogleRedirectResult = async () => {
  if (!auth) return null;
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      console.log('Google redirect sign-in successful:', result.user.email);
    }
    return result;
  } catch (error) {
    console.error('Google redirect result error:', error);
    return null;
  }
};

// Password Reset
export const firebasePasswordReset = async (email) => {
  if (!auth) {
    throw new Error('Firebase not configured');
  }
  return sendPasswordResetEmail(auth, email);
};

// ==================== PHONE AUTHENTICATION ====================

// Setup invisible reCAPTCHA verifier
export const setupRecaptcha = (containerId) => {
  if (!auth) {
    throw new Error('Firebase not configured');
  }
  
  // Clear any existing verifier first
  if (window.recaptchaVerifier) {
    try {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    } catch (e) {
      console.log('Could not clear existing verifier:', e);
    }
  }
  
  // Clear the container's innerHTML to remove any lingering reCAPTCHA
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = '';
  }
  
  try {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {
        console.log('reCAPTCHA verified');
      },
      'expired-callback': () => {
        console.log('reCAPTCHA expired');
        // Reset the verifier on expiry
        window.recaptchaVerifier = null;
      }
    });
    
    return window.recaptchaVerifier;
  } catch (error) {
    console.error('Error creating reCAPTCHA verifier:', error);
    window.recaptchaVerifier = null;
    throw error;
  }
};

// Send OTP to phone number
export const sendPhoneOTP = async (phoneNumber) => {
  if (!auth) {
    throw new Error('Firebase not configured');
  }
  
  try {
    // Phone number should already be in E.164 format (e.g., +91XXXXXXXXXX)
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    
    console.log('Sending OTP to:', formattedPhone);
    
    // Always create a fresh reCAPTCHA verifier for each OTP request
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (e) {
        console.log('Could not clear verifier:', e);
      }
      window.recaptchaVerifier = null;
    }
    
    // Clear and recreate the container
    const container = document.getElementById('recaptcha-container');
    if (container) {
      container.innerHTML = '';
    }
    
    // Create new reCAPTCHA verifier
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: () => {
        console.log('reCAPTCHA solved');
      },
      'expired-callback': () => {
        console.log('reCAPTCHA expired');
      }
    });
    
    const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
    
    // Store confirmation result for OTP verification
    window.confirmationResult = confirmationResult;
    
    console.log('OTP sent successfully');
    return { success: true, confirmationResult };
  } catch (error) {
    console.error('Error sending OTP:', error);
    
    // Reset reCAPTCHA on error
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      } catch (e) {
        console.log('Could not clear verifier');
      }
    }
    
    throw error;
  }
};

// Verify OTP and sign in
export const verifyPhoneOTP = async (otp) => {
  if (!window.confirmationResult) {
    throw new Error('No OTP verification in progress. Please request a new OTP.');
  }
  
  try {
    console.log('Verifying OTP...');
    const result = await window.confirmationResult.confirm(otp);
    console.log('OTP verified, user signed in:', result.user.phoneNumber);
    
    // Clear confirmation result after successful verification
    window.confirmationResult = null;
    
    return result;
  } catch (error) {
    console.error('OTP verification error:', error);
    throw error;
  }
};

// ==================== END PHONE AUTHENTICATION ====================

export const onFirebaseAuthStateChanged = (callback) => {
  if (!auth) {
    // If Firebase not configured, immediately call callback with null
    setTimeout(() => callback(null), 0);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};

export const getCurrentUser = () => {
  return auth?.currentUser || null;
};

export const getIdToken = async () => {
  const user = auth?.currentUser;
  if (user) {
    return user.getIdToken();
  }
  return null;
};

export { app, auth, isFirebaseConfigured };
