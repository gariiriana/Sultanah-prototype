/**
 * 🚀 ONE-CLICK FIX: Alumni Auto-Upgrade System
 * 
 * Usage:
 * 1. Open browser console
 * 2. Run: oneClickAlumniFix()
 * 3. Follow prompts
 */

import { auth, db } from '../config/firebase';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

/**
 * One-click fix untuk test Alumni → Agen flow
 */
export const oneClickAlumniFix = async () => {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 ONE-CLICK ALUMNI FIX');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  const ekoUid = 'FVIzKcC2j2Q7Hn7ZyDsKm0BPGa52';

  try {
    // Step 1: Check current state
    console.log('📋 Step 1: Checking current state...');
    const userRef = doc(db, 'users', ekoUid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      console.error('❌ Error: User Eko not found in Firestore');
      return;
    }

    const currentData = userSnap.data();
    console.log('👤 Current Data:');
    console.log('   Email:', currentData.email);
    console.log('   Role:', currentData.role);
    console.log('   Display Name:', currentData.displayName);
    console.log('');

    // Step 2: Upgrade to alumni
    if (currentData.role === 'alumni') {
      console.log('✅ User already alumni!');
      console.log('');
    } else {
      console.log('🔄 Step 2: Upgrading to alumni...');
      await updateDoc(userRef, {
        role: 'alumni',
        upgradedToAlumniAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      console.log('✅ Role updated: current-jamaah → alumni');
      console.log('');
    }

    // Step 3: Clear localStorage
    console.log('🧹 Step 3: Clearing cache...');
    const agentUpgradeKey = `agent-upgrade-seen-${ekoUid}`;
    localStorage.removeItem(agentUpgradeKey);
    localStorage.removeItem('userProfile');
    localStorage.removeItem('userRole');
    console.log('✅ localStorage cleared');
    console.log('');

    // Step 4: Logout current user
    console.log('🔐 Step 4: Logging out...');
    await signOut(auth);
    console.log('✅ Logged out');
    console.log('');

    // Step 5: Instructions
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ FIX COMPLETE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('🎯 NEXT STEPS:');
    console.log('');
    console.log('1. Page will redirect to login in 3 seconds');
    console.log('2. Login dengan:');
    console.log('   Email: eko@gmail.com');
    console.log('   Password: [Eko password]');
    console.log('');
    console.log('3. ✅ EXPECTED RESULT:');
    console.log('   - Redirect ke Alumni Portal');
    console.log('   - Pop-up "Selamat! Anda Telah Menjadi Alumni" MUNCUL!');
    console.log('   - Button "Baca Syarat & Ketentuan" tersedia');
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    // Redirect to login after 3 seconds
    setTimeout(() => {
      window.location.href = '/';
    }, 3000);

  } catch (error: any) {
    console.error('');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ ERROR');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    console.error('');

    if (error.code === 'permission-denied') {
      console.error('💡 SOLUTION:');
      console.error('');
      console.error('Firestore Rules tidak allow update.');
      console.error('Gunakan Firebase Console manual:');
      console.error('');
      console.error('1. Firebase Console → Firestore Database');
      console.error('2. Collection: users');
      console.error('3. Document ID: FVIzKcC2j2Q7Hn7ZyDsKm0BPGa52');
      console.error('4. Edit field "role" → change to "alumni"');
      console.error('5. Save');
      console.error('6. Run: manualLoginAsAlumni()');
      console.error('');
    }

    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('');
  }
};

/**
 * Manual login helper setelah upgrade via Firebase Console
 */
export const manualLoginAsAlumni = () => {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔐 MANUAL LOGIN HELPER');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  // Clear cache
  const ekoUid = 'FVIzKcC2j2Q7Hn7ZyDsKm0BPGa52';
  const agentUpgradeKey = `agent-upgrade-seen-${ekoUid}`;
  localStorage.removeItem(agentUpgradeKey);
  localStorage.clear();
  sessionStorage.clear();

  console.log('✅ Cache cleared');
  console.log('');
  console.log('🎯 NEXT STEPS:');
  console.log('');
  console.log('1. Page will reload in 2 seconds');
  console.log('2. Login dengan:');
  console.log('   Email: eko@gmail.com');
  console.log('   Password: [Eko password]');
  console.log('');
  console.log('3. ✅ Pop-up should appear!');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  setTimeout(() => {
    window.location.href = '/';
  }, 2000);
};

/**
 * Verify Eko current status
 */
export const verifyEkoStatus = async () => {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 VERIFY EKO STATUS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  const ekoUid = 'FVIzKcC2j2Q7Hn7ZyDsKm0BPGa52';

  try {
    const userRef = doc(db, 'users', ekoUid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      console.error('❌ User not found');
      return;
    }

    const data = userSnap.data();

    console.log('📋 FIRESTORE DATA:');
    console.log('   Email:', data.email);
    console.log('   Display Name:', data.displayName);
    console.log('   Role:', data.role);
    console.log('   Approval Status:', data.approvalStatus);
    console.log('   Profile Complete:', data.profileComplete);
    console.log('   Created At:', data.createdAt?.toDate?.());
    console.log('   Updated At:', data.updatedAt?.toDate?.());
    console.log('   Upgraded to Alumni At:', data.upgradedToAlumniAt?.toDate?.());
    console.log('');

    console.log('💾 LOCALSTORAGE:');
    const agentUpgradeKey = `agent-upgrade-seen-${ekoUid}`;
    console.log('   agent-upgrade-seen:', localStorage.getItem(agentUpgradeKey));
    console.log('');

    console.log('🎯 ANALYSIS:');
    if (data.role === 'alumni') {
      console.log('   ✅ Role is "alumni" - correct!');
      const seen = localStorage.getItem(agentUpgradeKey);
      if (seen === 'true') {
        console.log('   ⚠️ Pop-up already seen (localStorage)');
        console.log('   💡 Run: resetAgentUpgradeDialog() to see pop-up again');
      } else {
        console.log('   ✅ Pop-up should appear on next login');
      }
    } else if (data.role === 'current-jamaah') {
      console.log('   ❌ Role is "current-jamaah" - need to upgrade!');
      console.log('   💡 Run: oneClickAlumniFix()');
    } else if (data.role === 'agen') {
      console.log('   ✅ Already agen - no pop-up needed');
    } else {
      console.log('   ⚠️ Unexpected role:', data.role);
    }

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
};

// Export for window global access
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.oneClickAlumniFix = oneClickAlumniFix;
  // @ts-ignore
  window.manualLoginAsAlumni = manualLoginAsAlumni;
  // @ts-ignore
  window.verifyEkoStatus = verifyEkoStatus;

  console.log('');
  console.log('✅ One-Click Alumni Fix loaded!');
  console.log('');
  console.log('📌 Available commands:');
  console.log('   oneClickAlumniFix()   ← Auto upgrade Eko & logout');
  console.log('   verifyEkoStatus()     ← Check Eko current status');
  console.log('   manualLoginAsAlumni() ← Use after manual Firebase Console update');
  console.log('');
}