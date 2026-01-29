/**
 * 🔍 REFERRAL SYSTEM VERIFICATION SCRIPT
 * 
 * Script ini untuk verify bahwa semua setup referral system sudah benar.
 * Jalankan di console browser untuk quick check.
 */

import { db } from '../config/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

export async function verifyReferralSetup(referralCode: string) {
  console.log('🔍 ===== VERIFYING REFERRAL SYSTEM SETUP =====');
  console.log('Testing referral code:', referralCode);
  
  try {
    // Step 1: Check if referral code exists
    console.log('\n📝 Step 1: Searching for referral code...');
    const referralsQuery = query(
      collection(db, 'alumniReferrals'),
      where('referralCode', '==', referralCode)
    );
    const referralsSnapshot = await getDocs(referralsQuery);
    
    if (referralsSnapshot.empty) {
      console.error('❌ FAILED: Referral code not found in alumniReferrals collection');
      console.log('💡 Solution: Create a document in alumniReferrals with this referral code');
      return false;
    }
    
    console.log('✅ PASSED: Referral code found');
    const referralDoc = referralsSnapshot.docs[0];
    const referralData = referralDoc.data();
    console.log('📊 Referral Data:', {
      docId: referralDoc.id,
      userId: referralData.userId,
      referralCode: referralData.referralCode,
      totalReferrals: referralData.totalReferrals,
      totalCommission: referralData.totalCommission,
    });
    
    // Step 2: Check if referrer user exists
    console.log('\n📝 Step 2: Checking referrer user profile...');
    const referrerId = referralData.userId;
    const userDoc = await getDoc(doc(db, 'users', referrerId));
    
    if (!userDoc.exists()) {
      console.error('❌ FAILED: Referrer user not found in users collection');
      console.log('💡 Solution: Ensure the userId in alumniReferrals matches a real user');
      return false;
    }
    
    console.log('✅ PASSED: Referrer user found');
    const userData = userDoc.data();
    console.log('👤 User Data:', {
      userId: userDoc.id,
      email: userData.email,
      displayName: userData.displayName,
      role: userData.role,
    });
    
    // Step 3: Verify permissions (test query)
    console.log('\n📝 Step 3: Testing Firestore permissions...');
    
    // Test: Can we query alumniReferrals? (should work even without auth)
    try {
      const testQuery = query(
        collection(db, 'alumniReferrals'),
        where('referralCode', '==', referralCode)
      );
      await getDocs(testQuery);
      console.log('✅ PASSED: Can query alumniReferrals collection');
    } catch (error) {
      console.error('❌ FAILED: Cannot query alumniReferrals collection');
      console.error('Error:', error);
      console.log('💡 Solution: Update Firestore rules to allow read on alumniReferrals');
      return false;
    }
    
    // Step 4: Check collections exist
    console.log('\n📝 Step 4: Checking required collections...');
    const requiredCollections = [
      'alumniReferrals',
      'referralTracking',
      'referralUsage',
      'commissionWithdrawals',
    ];
    
    for (const collectionName of requiredCollections) {
      try {
        const snapshot = await getDocs(query(collection(db, collectionName)));
        console.log(`✅ Collection "${collectionName}" exists (${snapshot.size} documents)`);
      } catch (error) {
        console.warn(`⚠️ Collection "${collectionName}" might not exist or has no documents`);
      }
    }
    
    console.log('\n🎉 ===== VERIFICATION COMPLETE =====');
    console.log('✅ All checks passed! Referral system is ready.');
    console.log('\n📋 Next Steps:');
    console.log('1. Test registration with this referral code');
    console.log('2. Monitor console logs during registration');
    console.log('3. Verify dashboard updates in real-time');
    
    return true;
  } catch (error) {
    console.error('\n❌ ===== VERIFICATION FAILED =====');
    console.error('Error:', error);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Check Firestore Rules are deployed');
    console.log('2. Verify network connection');
    console.log('3. Check Firebase project configuration');
    return false;
  }
}

// Quick test function - call from browser console
export async function quickTestReferral() {
  const testCode = 'SULTANAH-AGT0027';
  console.log('🧪 Running quick test with code:', testCode);
  await verifyReferralSetup(testCode);
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).verifyReferralSetup = verifyReferralSetup;
  (window as any).quickTestReferral = quickTestReferral;
  console.log('✅ Referral verification functions loaded!');
  console.log('📝 Usage:');
  console.log('  - quickTestReferral()');
  console.log('  - verifyReferralSetup("YOUR-CODE-HERE")');
}