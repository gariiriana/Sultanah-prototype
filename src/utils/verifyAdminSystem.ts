import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { DEFAULT_ADMIN_EMAIL } from './initAdmin';

/**
 * VERIFY ADMIN SYSTEM
 * Run this in console to check if admin system is working correctly
 * Usage: verifyAdminSystem()
 */
export const verifyAdminSystem = async () => {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 VERIFYING ADMIN SYSTEM...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  try {
    // Step 1: Check admins collection
    console.log('1️⃣ Checking admins collection...');
    const adminDocRef = doc(db, 'admins', DEFAULT_ADMIN_EMAIL);
    const adminDoc = await getDoc(adminDocRef);

    if (!adminDoc.exists()) {
      console.log('❌ Admin record NOT found in admins collection');
      console.log('');
      console.log('💡 Solution: Refresh the page - initAdmin will create it automatically');
      return {
        success: false,
        error: 'Admin record not found'
      };
    }

    const adminData = adminDoc.data();
    const adminUid = adminData.uid;
    console.log('✅ Admin record found');
    console.log('   UID:', adminUid);
    console.log('');

    // Step 2: Check users collection
    console.log('2️⃣ Checking users collection...');
    const userDocRef = doc(db, 'users', adminUid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      console.log('❌ User profile NOT found for admin UID');
      console.log('');
      console.log('💡 Solution: Contact developer - user profile missing');
      return {
        success: false,
        error: 'User profile not found'
      };
    }

    const userData = userDoc.data();
    console.log('✅ User profile found');
    console.log('   Email:', userData.email);
    console.log('   Role:', userData.role);
    console.log('   Display Name:', userData.displayName);
    console.log('');

    // Step 3: Verify role is correct
    console.log('3️⃣ Verifying role...');
    const roleCorrect = userData.role?.toLowerCase() === 'admin';

    if (!roleCorrect) {
      console.log('❌ Role is incorrect: "' + userData.role + '"');
      console.log('   Expected: "admin" (lowercase)');
      console.log('');
      console.log('💡 Solution: Refresh the page - auto-fix will correct this');
      return {
        success: false,
        error: 'Role incorrect',
        currentRole: userData.role,
        expectedRole: 'admin'
      };
    }

    console.log('✅ Role is correct: "' + userData.role + '"');
    console.log('');

    // Step 4: Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ ADMIN SYSTEM VERIFIED!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('📋 Summary:');
    console.log('   ✅ Admin record exists');
    console.log('   ✅ User profile exists');
    console.log('   ✅ Role is correct (lowercase "admin")');
    console.log('');
    console.log('🔐 Admin Credentials:');
    console.log('   Email: ' + DEFAULT_ADMIN_EMAIL);
    console.log('   Password: Sultanah@536!');
    console.log('');
    console.log('🎯 Login Process:');
    console.log('   1. Click "Masuk" button');
    console.log('   2. Enter admin credentials');
    console.log('   3. You should see Admin Dashboard (not User Interface)');
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return {
      success: true,
      admin: {
        email: userData.email,
        role: userData.role,
        uid: adminUid
      }
    };

  } catch (error: any) {
    console.error('❌ Error verifying admin system:', error);
    
    if (error.code === 'permission-denied') {
      console.log('');
      console.log('⚠️ PERMISSION DENIED');
      console.log('Make sure Firestore rules allow read access to admins and users collections');
      console.log('');
    }

    return {
      success: false,
      error: error.message
    };
  }
};

// Make available in console
if (typeof window !== 'undefined') {
  (window as any).verifyAdminSystem = verifyAdminSystem;
  console.log('✅ verifyAdminSystem() ready - run in console to check admin setup');
}
