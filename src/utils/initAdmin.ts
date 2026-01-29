import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export const DEFAULT_ADMIN_EMAIL = 'adminSultanah@gmail.com';
const DEFAULT_ADMIN_PASSWORD = 'Sultanah@536!';
const DEFAULT_ADMIN_NAME = 'Admin Sultanah';
const DEFAULT_ADMIN_PHONE = '+62 812 3456 7890';

/**
 * Wait for network to be available
 */
const waitForNetwork = async (maxRetries = 3, delayMs = 1000): Promise<boolean> => {
  for (let i = 0; i < maxRetries; i++) {
    if (navigator.onLine) {
      // Double check with a small delay
      await new Promise(resolve => setTimeout(resolve, 500));
      if (navigator.onLine) {
        return true;
      }
    }
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  return navigator.onLine;
};

/**
 * AUTO-FIX & INITIALIZE ADMIN
 * This function:
 * 1. Checks if admin exists
 * 2. Auto-fixes role if uppercase "ADMIN" → lowercase "admin"
 * 3. Creates admin if doesn't exist
 * 
 * NOTE: Due to Firestore rules, this may fail before authentication.
 * In that case, admin should be created manually via Firebase Console.
 * See /SETUP_ADMIN_FIREBASE.md for manual setup guide.
 */
export const initializeAdmin = async () => {
  try {
    console.log('🔧 Initializing admin system...');
    
    // Check if network is available
    if (!navigator.onLine) {
      console.log('⚠️  No network connection. Waiting for network...');
      const networkAvailable = await waitForNetwork();
      
      if (!networkAvailable) {
        console.log('❌ Network unavailable. Admin initialization skipped.');
        return {
          success: false,
          error: 'network-unavailable',
          message: 'No internet connection'
        };
      }
      
      console.log('✅ Network connection restored');
    }
    
    // Add a small delay to ensure Firebase SDK is fully initialized
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Step 1: Check if admin record exists in admins collection
    const adminDocRef = doc(db, 'admins', DEFAULT_ADMIN_EMAIL);
    const adminDoc = await getDoc(adminDocRef);
    
    if (adminDoc.exists()) {
      const adminUid = adminDoc.data().uid;
      console.log('✅ Admin record found, checking role...');
      
      // Step 2: Auto-fix admin role if needed
      const userDocRef = doc(db, 'users', adminUid);
      const userDoc = await getDoc(userDocRef);
      
      // ✅ DECLARE userData OUTSIDE IF BLOCK
      let userData = null;
      let roleWasFixed = false;
      
      if (userDoc.exists()) {
        userData = userDoc.data();
        
        // AUTO-FIX: If role is uppercase "ADMIN", convert to lowercase "admin"
        if (userData.role && userData.role !== 'admin') {
          console.log('🔧 Auto-fixing admin role from "' + userData.role + '" to "admin"...');
          
          await updateDoc(userDocRef, {
            role: 'admin'
          });
          
          roleWasFixed = true;
          
          console.log('✅ Admin role auto-fixed successfully!');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('✅ ADMIN SYSTEM READY!');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('📧 Admin Email: ' + DEFAULT_ADMIN_EMAIL);
          console.log('');
          console.log('🎯 Admin will now be redirected to Admin Dashboard after login!');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        } else {
          console.log('✅ Admin role already correct');
        }
      }
      
      return {
        success: true,
        existed: true,
        fixed: roleWasFixed
      };
    }
    
    // Step 3: Admin doesn't exist - will be created via Firebase Console
    console.log('ℹ️  Admin account not found in database');
    console.log('   Please create admin manually via Firebase Console');
    console.log('   See: /SETUP_ADMIN_FIREBASE.md for instructions');
    
    return {
      success: false,
      existed: false,
      message: 'Admin not found - manual setup required'
    };
    
  } catch (error: any) {
    // Suppress errors that are expected and don't affect functionality
    const errorCode = error.code || '';
    const errorMessage = error.message || '';
    
    // Don't log these errors - they're normal:
    // - permission-denied: Expected before auth
    // - unavailable: Temporary network issue, Firebase auto-reconnects
    if (
      errorCode === 'permission-denied' || 
      errorCode === 'unavailable' ||
      errorMessage.includes('client is offline')
    ) {
      // Silently return - these are transient and don't affect functionality
      return {
        success: false,
        error: errorCode
      };
    }
    
    // Only log unexpected errors
    console.error('❌ Error initializing admin:', error);
    
    // Return error info without breaking app
    return {
      success: false,
      error: errorCode || errorMessage
    };
  }
};

/**
 * Display admin credentials in console
 */
export const displayAdminCredentials = () => {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔐 ADMIN LOGIN CREDENTIALS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 Email: ' + DEFAULT_ADMIN_EMAIL);
  console.log('🔑 Password: ' + DEFAULT_ADMIN_PASSWORD);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
};