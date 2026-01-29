import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { updateReferralOnUpgrade } from './referralProcessor'; // ✅ NEW: Import referral upgrade function

/**
 * Check user role in Firestore
 * Usage in console: checkUserRole('user@example.com')
 */
export async function checkUserRole(email: string) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 CHECKING USER ROLE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 Email:', email);
  
  try {
    // Get all users and find by email
    const { collection, getDocs, query, where } = await import('firebase/firestore');
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.error('❌ User not found in Firestore');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return null;
    }
    
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    
    console.log('✅ User found!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📄 User Data:');
    console.log('   UID:', userDoc.id);
    console.log('   Email:', userData.email);
    console.log('   Role:', userData.role);
    console.log('   Role Type:', typeof userData.role);
    console.log('   Display Name:', userData.displayName || 'N/A');
    console.log('   Approval Status:', userData.approvalStatus || 'N/A');
    console.log('   Profile Complete:', userData.profileComplete || false);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return {
      uid: userDoc.id,
      ...userData
    };
  } catch (error: any) {
    console.error('❌ Error checking user role:', error.message);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return null;
  }
}

/**
 * Update user role in Firestore
 * Usage in console: updateUserRole('user@example.com', 'staff')
 * 
 * Valid roles:
 * - admin
 * - staff
 * - supervisor
 * - direktur
 * - tour-leader
 * - mutawwif
 * - prospective-jamaah
 * - current-jamaah
 * - alumni
 */
export async function updateUserRole(email: string, newRole: string) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔄 UPDATING USER ROLE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 Email:', email);
  console.log('🎯 New Role:', newRole);
  
  const validRoles = [
    'admin',
    'staff',
    'supervisor',
    'direktur',
    'tour-leader',
    'mutawwif',
    'prospective-jamaah',
    'current-jamaah',
    'alumni'
  ];
  
  if (!validRoles.includes(newRole)) {
    console.error('❌ Invalid role! Valid roles are:');
    validRoles.forEach(role => console.log('   -', role));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return false;
  }
  
  try {
    // Get all users and find by email
    const { collection, getDocs, query, where } = await import('firebase/firestore');
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.error('❌ User not found in Firestore');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return false;
    }
    
    const userDoc = querySnapshot.docs[0];
    const userRef = doc(db, 'users', userDoc.id);
    
    // Update role
    await updateDoc(userRef, {
      role: newRole
    });
    
    // ✅ NEW: Update referral status if user is upgraded
    if (newRole === 'current-jamaah') {
      await updateReferralOnUpgrade(userDoc.id);
    }
    
    console.log('✅ Role updated successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📄 Updated Data:');
    console.log('   UID:', userDoc.id);
    console.log('   Email:', email);
    console.log('   New Role:', newRole);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  Please REFRESH the page for changes to take effect!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return true;
  } catch (error: any) {
    console.error('❌ Error updating user role:', error.message);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return false;
  }
}

// Make functions available globally in console
if (typeof window !== 'undefined') {
  (window as any).checkUserRole = checkUserRole;
  (window as any).updateUserRole = updateUserRole;
}