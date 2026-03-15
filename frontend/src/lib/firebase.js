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
  updateProfile
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
    throw new Error('Google Sign-In not configured');
  }
  return signInWithPopup(auth, googleProvider);
};

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
