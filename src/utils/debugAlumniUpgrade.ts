/**
 * 🔧 DEBUG UTILITY: Alumni Auto-Upgrade System
 * 
 * Usage di browser console:
 * import { debugAlumniSystem, manualUpgradeToAlumni } from './utils/debugAlumniUpgrade';
 * 
 * // Check current state
 * debugAlumniSystem();
 * 
 * // Manual upgrade user to alumni
 * manualUpgradeToAlumni('USER_UID_HERE');
 */

import { doc, getDoc, updateDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Debug current auth state and user role
 */
export const debugAlumniSystem = async () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 DEBUG ALUMNI AUTO-UPGRADE SYSTEM');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // @ts-ignore
  const currentUser = window.auth?.currentUser;
  // @ts-ignore
  const userProfile = window.userProfile;

  if (!currentUser) {
    console.error('❌ No user logged in');
    return;
  }

  console.log('👤 Email:', currentUser.email);
  console.log('🆔 UID:', currentUser.uid);
  console.log('🎭 Role (from context):', userProfile?.role);

  // Fetch from Firestore
  try {
    const userRef = doc(db, 'users', currentUser.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      console.log('🎭 Role (from Firestore):', data.role);
      console.log('📅 Created At:', data.createdAt?.toDate?.());
      console.log('📅 Updated At:', data.updatedAt?.toDate?.());
      console.log('📅 Upgraded to Alumni At:', data.upgradedToAlumniAt?.toDate?.());
      console.log('📋 Full Profile:', data);
    } else {
      console.error('❌ User document not found in Firestore');
    }

    // Check localStorage
    const agentUpgradeSeen = localStorage.getItem(`agent-upgrade-seen-${currentUser.uid}`);
    console.log('💾 localStorage (agent-upgrade-seen):', agentUpgradeSeen);

    // Check payments
    const paymentsQuery = query(
      collection(db, 'payments'),
      where('userId', '==', currentUser.uid)
    );
    const paymentsSnapshot = await getDocs(paymentsQuery);
    console.log('💳 Payments count:', paymentsSnapshot.size);
    paymentsSnapshot.docs.forEach((doc) => {
      const payment = doc.data();
      console.log('  - Payment:', {
        id: doc.id,
        packageId: payment.packageId,
        status: payment.status,
        amount: payment.amount,
      });
    });

  } catch (error) {
    console.error('❌ Error fetching user data:', error);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
};

/**
 * Manually upgrade user to alumni
 */
export const manualUpgradeToAlumni = async (userId: string) => {
  try {
    console.log('🔄 Upgrading user to alumni...', userId);

    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      console.error('❌ User not found:', userId);
      return;
    }

    const currentRole = userSnap.data().role;
    console.log('🎭 Current role:', currentRole);

    if (currentRole === 'alumni') {
      console.warn('⚠️ User already alumni');
      return;
    }

    await updateDoc(userRef, {
      role: 'alumni',
      upgradedToAlumniAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    console.log('✅ User upgraded to alumni successfully!');
    console.log('🔄 Clearing localStorage and reloading...');

    // Clear localStorage
    localStorage.clear();

    // Reload page
    setTimeout(() => {
      window.location.reload();
    }, 1000);

  } catch (error) {
    console.error('❌ Error upgrading user:', error);
  }
};

/**
 * Check all itineraries and their completion status
 */
export const checkItineraries = async () => {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 CHECKING ALL ITINERARIES');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const itinerariesQuery = query(collection(db, 'itineraries'));
    const snapshot = await getDocs(itinerariesQuery);

    console.log('📊 Total itineraries:', snapshot.size);

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      console.log({
        id: doc.id,
        packageId: data.packageId,
        tourLeaderId: data.tourLeaderId,
        status: data.status,
        completedAt: data.completedAt?.toDate?.(),
        completedDays: data.completedDays || [],
      });
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ Error checking itineraries:', error);
  }
};

/**
 * Reset agent upgrade dialog (remove localStorage flag)
 */
export const resetAgentUpgradeDialog = () => {
  // @ts-ignore
  const currentUser = window.auth?.currentUser;

  if (!currentUser) {
    console.error('❌ No user logged in');
    return;
  }

  const key = `agent-upgrade-seen-${currentUser.uid}`;
  localStorage.removeItem(key);
  console.log('✅ Agent upgrade dialog reset');
  console.log('🔄 Reload page to see dialog again');
};

/**
 * Quick upgrade Eko to alumni (hardcoded UID from screenshot)
 */
export const quickUpgradeEko = async () => {
  const ekoUid = 'FVIzKcC2j2Q7Hn7ZyDsKm0BPGa52'; // From user's screenshot
  await manualUpgradeToAlumni(ekoUid);
};

// Export for window global access
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.debugAlumniSystem = debugAlumniSystem;
  // @ts-ignore
  window.manualUpgradeToAlumni = manualUpgradeToAlumni;
  // @ts-ignore
  window.checkItineraries = checkItineraries;
  // @ts-ignore
  window.resetAgentUpgradeDialog = resetAgentUpgradeDialog;
  // @ts-ignore
  window.quickUpgradeEko = quickUpgradeEko;

  console.log('✅ Debug utilities loaded. Available commands:');
  console.log('  - debugAlumniSystem()');
  console.log('  - manualUpgradeToAlumni(userId)');
  console.log('  - checkItineraries()');
  console.log('  - resetAgentUpgradeDialog()');
  console.log('  - quickUpgradeEko()');
}
