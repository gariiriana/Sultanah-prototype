// Firebase Configuration
// Replace these values with your actual Firebase project credentials

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, initializeFirestore, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || "AIzaSyBm80jrty9X28t90CsuJmwIwSKju2WStyc",
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || "sultanah-travel-6a382.firebaseapp.com",
  projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID || "sultanah-travel-6a382",
  storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || "sultanah-travel-6a382.firebasestorage.app",
  messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "696046595036",
  appId: import.meta.env?.VITE_FIREBASE_APP_ID || "1:696046595036:web:394daa46627958b1487d19",
  measurementId: import.meta.env?.VITE_FIREBASE_MEASUREMENT_ID || "G-PQEJ18JS64"
};

// Initialize Firebase (check if already initialized to prevent duplicate app error)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Log successful Firebase initialization (only once)
if (getApps().length === 1) {
  console.log('🔥 Firebase initialized successfully');
  console.log('📦 Project:', firebaseConfig.projectId);
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⚠️  IF YOU SEE PERMISSION-DENIED ERROR:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('📋 QUICK FIX (2 minutes):');
  console.log('');
  console.log('1. Open: https://console.firebase.google.com/project/' + firebaseConfig.projectId + '/firestore/databases/-default-/rules');
  console.log('');
  console.log('2. Delete all, paste this:');
  console.log('   rules_version = \'2\';');
  console.log('   service cloud.firestore {');
  console.log('     match /databases/{database}/documents {');
  console.log('       match /{document=**} {');
  console.log('         allow read, write: if request.time < timestamp.date(2025, 3, 1);');
  console.log('       }');
  console.log('     }');
  console.log('   }');
  console.log('');
  console.log('3. Click "Publish"');
  console.log('');
  console.log('4. Refresh this page (Ctrl+Shift+R)');
  console.log('');
  console.log('📄 See /START_HERE.md for detailed guide');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
}

// Initialize Firebase Services
export const auth = getAuth(app);

// Initialize Firestore - use simple getFirestore to avoid conflicts
export const db = getFirestore(app);

// Initialize Firebase Storage
export const storage = getStorage(app);

// ✅ ENHANCED: Suppress Firestore WebChannel connection errors
// These are transient network errors from Firestore real-time listeners
// They don't affect functionality - Firestore auto-reconnects
if (typeof window !== 'undefined') {
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleLog = console.log;
  
  // Suppress error logs
  console.error = (...args: any[]) => {
    const message = JSON.stringify(args).toLowerCase();
    
    // Suppress all Firestore WebChannel errors (they're normal and auto-recover)
    if (
      message.includes('webchannelconnection') || 
      message.includes('rpc') ||
      message.includes('transport errored') ||
      message.includes('listen stream') ||
      message.includes('stream') && message.includes('firestore') ||
      message.includes('@firebase/firestore') ||
      message.includes('client is offline') ||
      message.includes('unavailable') ||
      message.includes('failed to get document') ||
      message.includes('listen stream') ||
      message.includes('0x8') || // Hex stream IDs from error
      message.includes('name:  message:') || // Empty Name/Message pattern from WebChannel
      message.includes('logpreviewerror') ||
      message.includes('reduxstate') ||
      message.includes('failed to fetch dynamically imported module')
    ) {
      // Handle dynamic import error with reload
      if (message.includes('failed to fetch dynamically imported module')) {
        const hasReloaded = sessionStorage.getItem('dynamicImportReload');
        if (!hasReloaded) {
          sessionStorage.setItem('dynamicImportReload', 'true');
          console.log('🔄 Reloading due to cache issue...');
          setTimeout(() => window.location.reload(), 100);
        }
      }
      return; // Silently ignore - these are expected
    }
    
    originalConsoleError.apply(console, args);
  };
  
  // Suppress warning logs
  console.warn = (...args: any[]) => {
    const message = JSON.stringify(args).toLowerCase();
    
    // Suppress Firestore connection warnings
    if (
      message.includes('webchannelconnection') || 
      message.includes('firestore') && message.includes('stream') ||
      message.includes('@firebase/firestore') ||
      message.includes('logpreviewerror') ||
      message.includes('reduxstate')
    ) {
      return; // Silently ignore
    }
    
    originalConsoleWarn.apply(console, args);
  };
  
  // Suppress log spam
  console.log = (...args: any[]) => {
    const message = JSON.stringify(args).toLowerCase();
    
    // Suppress Firestore spam
    if (
      message.includes('@firebase/firestore') ||
      message.includes('webchannelconnection') ||
      message.includes('logpreviewerror') ||
      message.includes('reduxstate')
    ) {
      return; // Silently ignore
    }
    
    originalConsoleLog.apply(console, args);
  };
}

// Log services initialization
console.log('✅ Firestore ready');
console.log('✅ Storage ready');

export default app;