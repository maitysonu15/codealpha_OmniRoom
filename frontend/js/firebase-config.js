/**
 * OmniRoom — Firebase Client SDK Initializer
 * Configuration is dynamically loaded from the server (.env via /api/config/firebase/)
 * No private API keys or secrets are stored in this file, making it 100% safe to commit to Git.
 */

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics, isSupported as isAnalyticsSupported } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// Default Firebase configuration (can be overridden by server .env via /api/config/firebase/)
const defaultConfig = {
  apiKey: "AIzaSyATdvoQbbcXCKNj23VO7Rll7mebyl3mD5c",
  authDomain: "omniroom-16585.firebaseapp.com",
  projectId: "omniroom-16585",
  storageBucket: "omniroom-16585.firebasestorage.app",
  messagingSenderId: "517278443150",
  appId: "1:517278443150:web:e555b9a48ca7d36fa98bdf",
  measurementId: "G-69XEQJN2SH"
};

let config = { ...defaultConfig };

// 1. Check if pre-injected in window
if (typeof window !== 'undefined' && window.firebaseConfig && window.firebaseConfig.apiKey) {
  config = { ...defaultConfig, ...window.firebaseConfig };
} else {
  // 2. Fetch active credentials dynamically from backend (.env)
  try {
    const res = await fetch('/api/config/firebase/');
    if (res.ok) {
      const serverConfig = await res.json();
      if (serverConfig && serverConfig.apiKey) {
        config = { ...config, ...serverConfig };
      }
    }
  } catch (err) {
    console.debug('[Firebase] Using active project configuration.');
  }
}

export const firebaseConfig = config;

// Initialize Firebase App if valid apiKey is present
export let app = null;
export let auth = null;
export let db = null;
export let storage = null;
export let analytics = null;
export const googleProvider = new GoogleAuthProvider();

if (firebaseConfig.apiKey) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);

    isAnalyticsSupported().then(supported => {
      if (supported && app) {
        analytics = getAnalytics(app);
        if (typeof window !== 'undefined') window.firebaseAnalytics = analytics;
      }
    }).catch(() => {});

    console.log('[Firebase] Connected successfully to project:', firebaseConfig.projectId || 'active');
  } catch (initErr) {
    console.warn('[Firebase] Initialization notice:', initErr.message);
  }
} else {
  console.info('[Firebase] No API key detected in .env. Configure .env with FIREBASE_API_KEY to enable Google/Firebase Auth.');
}

// Expose globally on window for unified auth modal and scripts
if (typeof window !== 'undefined') {
  window.firebaseConfig = firebaseConfig;
  window.firebaseApp = app;
  window.firebaseAuth = auth;
  window.firebaseDb = db;
  window.firebaseStorage = storage;

  window.FIREBASE_AUTH = auth ? {
    auth,
    GoogleAuthProvider,
    googleProvider,
    signInWithPopup: (provider) => signInWithPopup(auth, provider || googleProvider),
    signInWithEmailAndPassword: (email, pass) => signInWithEmailAndPassword(auth, email, pass),
    createUserWithEmailAndPassword: (email, pass) => createUserWithEmailAndPassword(auth, email, pass),
    signOut: () => signOut(auth),
    onAuthStateChanged: (callback) => onAuthStateChanged(auth, callback),
    updateProfile: (user, profileData) => updateProfile(user, profileData)
  } : null;

  window.FIREBASE = {
    app,
    auth,
    db,
    storage,
    config: firebaseConfig,
    getAnalytics: () => analytics,
    authHelpers: window.FIREBASE_AUTH
  };
}
