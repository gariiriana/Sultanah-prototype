import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { DEFAULT_ADMIN_EMAIL } from './initAdmin';

/**
 * QUICK FIX ADMIN ROLE
 * Run this function in console to fix admin role to lowercase "admin"
 * 
 * Usage in browser console:
 * quickFixAdminRole()
 */
export const quickFixAdminRole = async () => {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔧 QUICK FIX: Admin Role');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  try {
    // Step 1: Get admin UID from admins collection
    console.log('1️⃣ Looking up admin record...');
    const adminDocRef = doc(db, 'admins', DEFAULT_ADMIN_EMAIL);
    const adminDoc = await getDoc(adminDocRef);

    if (!adminDoc.exists()) {
      console.error('❌ Admin record not found!');
      console.log('');
      console.log('💡 Solution:');
      console.log('   1. Go to Firebase Console > Firestore');
      console.log('   2. Create collection "admins"');
      console.log('   3. Create document with ID: ' + DEFAULT_ADMIN_EMAIL);
      console.log('   4. Add fields:');
      console.log('      - email: "' + DEFAULT_ADMIN_EMAIL + '"');
      console.log('      - uid: "[your admin UID from Authentication]"');
      console.log('      - displayName: "Admin Sultanah"');
      console.log('');
      return {
        success: false,
        error: 'Admin record not found'
      };
    }

    const adminData = adminDoc.data();
    const adminUid = adminData.uid;

    console.log('✅ Admin found');
    console.log('   Email:', adminData.email);
    console.log('   UID:', adminUid);
    console.log('');

    // Step 2: Get user profile
    console.log('2️⃣ Checking user profile...');
    const userDocRef = doc(db, 'users', adminUid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      console.error('❌ User profile not found!');
      console.log('');
      console.log('💡 Solution:');
      console.log('   1. Go to Firebase Console > Firestore');
      console.log('   2. Create document in "users" collection with ID: ' + adminUid);
      console.log('   3. Add fields:');
      console.log('      - email: "' + DEFAULT_ADMIN_EMAIL + '"');
      console.log('      - role: "admin"');
      console.log('      - displayName: "Admin Sultanah"');
      console.log('      - createdAt: "[current timestamp]"');
      console.log('');
      return {
        success: false,
        error: 'User profile not found'
      };
    }

    const userData = userDoc.data();
    console.log('✅ User profile found');
    console.log('   Current role:', userData.role);
    console.log('   Role type:', typeof userData.role);
    console.log('');

    // Step 3: Fix role if needed
    const currentRole = userData.role;
    const correctRole = 'admin';

    if (currentRole === correctRole) {
      console.log('✅ Role is already correct!');
      console.log('   No changes needed.');
      console.log('');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ Admin system is working correctly!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
      console.log('🔄 Please:');
      console.log('   1. Logout (if logged in)');
      console.log('   2. Clear browser cache (Ctrl+Shift+Delete)');
      console.log('   3. Login again with admin credentials');
      console.log('');
      return {
        success: true,
        alreadyCorrect: true,
        role: correctRole
      };
    }

    console.log('3️⃣ Fixing admin role...');
    console.log('   Changing: "' + currentRole + '" → "' + correctRole + '"');

    await updateDoc(userDocRef, {
      role: correctRole
    });

    console.log('✅ Role fixed successfully!');
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ ADMIN ROLE FIXED!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('📋 Changes:');
    console.log('   Before: role = "' + currentRole + '"');
    console.log('   After:  role = "' + correctRole + '"');
    console.log('');
    console.log('🔄 Next Steps:');
    console.log('   1. Logout (if logged in)');
    console.log('   2. Clear browser cache (Ctrl+Shift+Delete)');
    console.log('   3. Login again with:');
    console.log('      Email: ' + DEFAULT_ADMIN_EMAIL);
    console.log('      Password: Sultanah@536!');
    console.log('   4. You should now see Admin Dashboard!');
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return {
      success: true,
      fixed: true,
      oldRole: currentRole,
      newRole: correctRole
    };

  } catch (error: any) {
    console.error('❌ Error fixing admin role:', error);
    console.log('');

    if (error.code === 'permission-denied') {
      console.log('⚠️ PERMISSION DENIED');
      console.log('');
      console.log('💡 Solution:');
      console.log('   1. Login first as admin (even if it goes to user interface)');
      console.log('   2. Then run this function again: quickFixAdminRole()');
      console.log('   OR');
      console.log('   3. Fix manually in Firebase Console:');
      console.log('      a. Go to Firestore Database');
      console.log('      b. Open "users" collection');
      console.log('      c. Find document with email "' + DEFAULT_ADMIN_EMAIL + '"');
      console.log('      d. Edit "role" field to: admin (lowercase)');
      console.log('');
    }

    return {
      success: false,
      error: error.message || error.code
    };
  }
};

// Make available in console
if (typeof window !== 'undefined') {
  (window as any).quickFixAdminRole = quickFixAdminRole;
  console.log('✅ quickFixAdminRole() ready - run in console to fix admin role');
}
