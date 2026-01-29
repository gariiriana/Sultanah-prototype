/**
 * Utility to fix approval status for existing agen accounts
 * This is needed for agents who registered before the approval system was implemented
 */

import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Set approval status for all agen accounts that don't have it
 * Usage in console: fixAgenApprovalStatus()
 */
export async function fixAgenApprovalStatus() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔧 FIXING AGEN APPROVAL STATUS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    // Get all users with role = 'agen'
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', 'agen'));
    const querySnapshot = await getDocs(q);
    
    console.log(`📊 Found ${querySnapshot.size} agen account(s)`);
    console.log('');
    
    let updated = 0;
    let skipped = 0;
    
    for (const userDoc of querySnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;
      
      // Check if approval status already exists
      if (!userData.approvalStatus) {
        // Set to pending by default
        await updateDoc(doc(db, 'users', userId), {
          approvalStatus: 'pending',
          approvalRequestedAt: userData.createdAt || new Date().toISOString(),
        });
        
        console.log(`✅ Updated: ${userData.email} → approvalStatus: 'pending'`);
        updated++;
      } else {
        console.log(`⏭️  Skipped: ${userData.email} (already has approvalStatus: ${userData.approvalStatus})`);
        skipped++;
      }
    }
    
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Updated: ${updated}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`📊 Total: ${querySnapshot.size}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('💡 Refresh the User Management page to see the changes!');
    
    return {
      success: true,
      updated,
      skipped,
      total: querySnapshot.size
    };
  } catch (error: any) {
    console.error('❌ Error fixing agen approval status:', error.message);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Manually approve a specific agen account
 * Usage in console: approveAgen('agen@gmail.com')
 */
export async function approveAgen(email: string) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ APPROVING AGEN ACCOUNT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 Email:', email);
  
  try {
    // Find user by email
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.error('❌ User not found:', email);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return { success: false, error: 'User not found' };
    }
    
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    
    // Verify it's an agen
    if (userData.role !== 'agen') {
      console.error('❌ User is not an agen. Role:', userData.role);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return { success: false, error: 'User is not an agen' };
    }
    
    // Approve the account
    await updateDoc(doc(db, 'users', userDoc.id), {
      approvalStatus: 'approved',
      approvedAt: new Date().toISOString(),
    });
    
    console.log('✅ Account approved successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💡 The agen can now login and access the dashboard!');
    
    return { success: true };
  } catch (error: any) {
    console.error('❌ Error approving agen:', error.message);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return { success: false, error: error.message };
  }
}

/**
 * Manually reject a specific agen account
 * Usage in console: rejectAgen('agen@gmail.com', 'Reason for rejection')
 */
export async function rejectAgen(email: string, reason: string) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('❌ REJECTING AGEN ACCOUNT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 Email:', email);
  console.log('📝 Reason:', reason);
  
  try {
    // Find user by email
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.error('❌ User not found:', email);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return { success: false, error: 'User not found' };
    }
    
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    
    // Verify it's an agen
    if (userData.role !== 'agen') {
      console.error('❌ User is not an agen. Role:', userData.role);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return { success: false, error: 'User is not an agen' };
    }
    
    // Reject the account
    await updateDoc(doc(db, 'users', userDoc.id), {
      approvalStatus: 'rejected',
      rejectionReason: reason,
      rejectedAt: new Date().toISOString(),
    });
    
    console.log('❌ Account rejected successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return { success: true };
  } catch (error: any) {
    console.error('❌ Error rejecting agen:', error.message);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return { success: false, error: error.message };
  }
}

// Make functions available in browser console
(window as any).fixAgenApprovalStatus = fixAgenApprovalStatus;
(window as any).approveAgen = approveAgen;
(window as any).rejectAgen = rejectAgen;
