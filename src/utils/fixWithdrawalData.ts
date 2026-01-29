/**
 * 🔧 MIGRATION HELPER - Fix Withdrawal Data
 * 
 * Run this once to fix existing withdrawal data in Firebase:
 * 1. Convert 'approved' status to 'confirmed'
 * 2. Recalculate balance untuk semua user yang punya pending/rejected withdrawals
 * 
 * HOW TO RUN:
 * 1. Buka browser console di halaman admin
 * 2. Import: import { fixWithdrawalData } from './utils/fixWithdrawalData'
 * 3. Run: fixWithdrawalData()
 */

import { db } from '../config/firebase';
import { collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';

export async function fixWithdrawalData() {
  console.log('🔧 Starting withdrawal data migration...');
  
  try {
    // 1. Get all withdrawals
    const withdrawalsSnap = await getDocs(collection(db, 'commissionWithdrawals'));
    
    console.log(`📊 Found ${withdrawalsSnap.size} withdrawals`);
    
    let updatedCount = 0;
    const userBalanceAdjustments: Record<string, number> = {};
    
    // 2. Process each withdrawal
    for (const withdrawalDoc of withdrawalsSnap.docs) {
      const data = withdrawalDoc.data();
      const withdrawalId = withdrawalDoc.id;
      
      // Convert 'approved' to 'confirmed'
      if (data.status === 'approved') {
        await updateDoc(doc(db, 'commissionWithdrawals', withdrawalId), {
          status: 'confirmed'
        });
        console.log(`✅ Updated ${withdrawalId}: approved → confirmed`);
        updatedCount++;
      }
      
      // Track balance adjustments untuk pending/rejected withdrawals
      // Jika withdrawal masih pending atau rejected, balance TIDAK boleh dikurangi
      if (data.status === 'pending' || data.status === 'rejected') {
        const userId = data.userId;
        const amount = data.amount || 0;
        
        // Kumpulkan total yang perlu di-refund per user
        if (!userBalanceAdjustments[userId]) {
          userBalanceAdjustments[userId] = 0;
        }
        userBalanceAdjustments[userId] += amount;
      }
    }
    
    console.log(`\n📈 Balance adjustments needed for ${Object.keys(userBalanceAdjustments).length} users:`);
    
    // 3. Fix balances
    for (const [userId, refundAmount] of Object.entries(userBalanceAdjustments)) {
      const balanceRef = doc(db, 'referralBalances', userId);
      const balanceSnap = await getDoc(balanceRef);
      
      if (balanceSnap.exists()) {
        const currentBalance = balanceSnap.data().balance || 0;
        const newBalance = currentBalance + refundAmount;
        
        await updateDoc(balanceRef, {
          balance: newBalance
        });
        
        console.log(`  ✅ User ${userId}: ${currentBalance} → ${newBalance} (+${refundAmount})`);
      } else {
        console.warn(`  ⚠️ User ${userId}: balance document not found`);
      }
    }
    
    console.log(`\n🎉 Migration complete!`);
    console.log(`  - Updated ${updatedCount} withdrawals (approved → confirmed)`);
    console.log(`  - Adjusted ${Object.keys(userBalanceAdjustments).length} user balances`);
    
    return {
      success: true,
      updatedWithdrawals: updatedCount,
      adjustedBalances: Object.keys(userBalanceAdjustments).length
    };
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * 🔧 SIMPLE FIX - Just refund pending/rejected withdrawals
 * Lebih aman karena hanya fix balance untuk pending/rejected
 */
export async function refundPendingWithdrawals() {
  console.log('🔧 Refunding pending/rejected withdrawals...');
  
  try {
    const withdrawalsSnap = await getDocs(collection(db, 'commissionWithdrawals'));
    const userRefunds: Record<string, number> = {};
    
    // Calculate refunds
    for (const withdrawalDoc of withdrawalsSnap.docs) {
      const data = withdrawalDoc.data();
      
      if (data.status === 'pending' || data.status === 'rejected') {
        const userId = data.userId;
        const amount = data.amount || 0;
        
        if (!userRefunds[userId]) {
          userRefunds[userId] = 0;
        }
        userRefunds[userId] += amount;
        
        console.log(`  📌 ${data.status}: Rp ${amount.toLocaleString('id-ID')} for ${data.userName || userId}`);
      }
    }
    
    console.log(`\n💰 Refunding to ${Object.keys(userRefunds).length} users...`);
    
    // Apply refunds
    for (const [userId, refundAmount] of Object.entries(userRefunds)) {
      const balanceRef = doc(db, 'referralBalances', userId);
      const balanceSnap = await getDoc(balanceRef);
      
      if (balanceSnap.exists()) {
        const currentBalance = balanceSnap.data().balance || 0;
        const newBalance = currentBalance + refundAmount;
        
        await updateDoc(balanceRef, {
          balance: newBalance
        });
        
        console.log(`  ✅ Refunded Rp ${refundAmount.toLocaleString('id-ID')}: ${currentBalance.toLocaleString('id-ID')} → ${newBalance.toLocaleString('id-ID')}`);
      }
    }
    
    console.log('\n🎉 Refund complete!');
    
    return {
      success: true,
      refundedUsers: Object.keys(userRefunds).length,
      totalRefunded: Object.values(userRefunds).reduce((a, b) => a + b, 0)
    };
    
  } catch (error) {
    console.error('❌ Refund failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
