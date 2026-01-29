/**
 * 🔄 Balance Recalculator
 * 
 * Recalculate balance untuk semua user berdasarkan withdrawal yang CONFIRMED
 * Ini akan fix masalah balance yang salah karena logic lama
 */

import { db } from '../config/firebase';
import { collection, getDocs, doc, updateDoc, getDoc, writeBatch } from 'firebase/firestore';

interface RecalculationResult {
  userId: string;
  userName: string;
  userType: 'alumni' | 'agen';
  oldBalance: number;
  newBalance: number;
  oldTotalWithdrawn: number;
  newTotalWithdrawn: number;
  adjustmentAmount: number;
  totalEarnings: number;
  withdrawalBreakdown: {
    confirmed: number;
    pending: number;
    rejected: number;
  };
}

export async function recalculateAllBalances(): Promise<{
  success: boolean;
  results: RecalculationResult[];
  error?: string;
}> {
  console.log('🔄 Starting balance recalculation...');
  
  try {
    const results: RecalculationResult[] = [];
    
    // 1. Get all withdrawals
    const withdrawalsSnap = await getDocs(collection(db, 'commissionWithdrawals'));
    
    // 2. Group by userId
    const userWithdrawals: Record<string, any[]> = {};
    
    withdrawalsSnap.forEach(doc => {
      const data = doc.data();
      const userId = data.userId;
      
      if (!userWithdrawals[userId]) {
        userWithdrawals[userId] = [];
      }
      
      userWithdrawals[userId].push({
        id: doc.id,
        ...data,
        // Convert old 'approved' to 'confirmed'
        status: data.status === 'approved' ? 'confirmed' : data.status
      });
    });
    
    console.log(`📊 Found ${Object.keys(userWithdrawals).length} users with withdrawals`);
    
    // 3. Recalculate for each user
    for (const [userId, withdrawals] of Object.entries(userWithdrawals)) {
      const firstWithdrawal = withdrawals[0];
      const userName = firstWithdrawal.userName || 'Unknown';
      const userType = firstWithdrawal.userType || 'agen';
      
      // Calculate totals
      const confirmedWithdrawals = withdrawals.filter(w => w.status === 'confirmed');
      const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');
      const rejectedWithdrawals = withdrawals.filter(w => w.status === 'rejected');
      
      const totalConfirmed = confirmedWithdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);
      const totalPending = pendingWithdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);
      const totalRejected = rejectedWithdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);
      
      // Get current balance from referralBalances
      const balanceRef = doc(db, 'referralBalances', userId);
      const balanceSnap = await getDoc(balanceRef);
      
      if (!balanceSnap.exists()) {
        console.warn(`⚠️ No balance document for user ${userName} (${userId})`);
        continue;
      }
      
      const balanceData = balanceSnap.data();
      const oldBalance = balanceData.balance || 0;
      const oldTotalWithdrawn = balanceData.totalWithdrawn || 0;
      
      // Get total earnings from agenReferrals or alumniReferrals
      let totalEarnings = 0;
      const referralCollection = userType === 'agen' ? 'agenReferrals' : 'alumniReferrals';
      const referralRef = doc(db, referralCollection, userId);
      const referralSnap = await getDoc(referralRef);
      
      if (referralSnap.exists()) {
        totalEarnings = referralSnap.data().totalCommission || 0;
      }
      
      // ✅ CALCULATE NEW BALANCE
      // Balance = Total Earnings - Total Confirmed Withdrawals
      const newBalance = totalEarnings - totalConfirmed;
      const newTotalWithdrawn = totalConfirmed;
      const adjustmentAmount = newBalance - oldBalance;
      
      // Update balance
      await updateDoc(balanceRef, {
        balance: newBalance,
        totalWithdrawn: newTotalWithdrawn,
      });
      
      console.log(`✅ ${userName}: Balance ${oldBalance} → ${newBalance} (${adjustmentAmount >= 0 ? '+' : ''}${adjustmentAmount})`);
      
      results.push({
        userId,
        userName,
        userType,
        oldBalance,
        newBalance,
        oldTotalWithdrawn,
        newTotalWithdrawn,
        adjustmentAmount,
        totalEarnings,
        withdrawalBreakdown: {
          confirmed: totalConfirmed,
          pending: totalPending,
          rejected: totalRejected,
        }
      });
    }
    
    console.log(`\n🎉 Recalculation complete! Updated ${results.length} users`);
    
    return {
      success: true,
      results
    };
    
  } catch (error) {
    console.error('❌ Recalculation failed:', error);
    return {
      success: false,
      results: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * 🔄 Recalculate balance untuk 1 user saja
 */
export async function recalculateUserBalance(userId: string): Promise<{
  success: boolean;
  result?: RecalculationResult;
  error?: string;
}> {
  console.log(`🔄 Recalculating balance for user ${userId}...`);
  
  try {
    // 1. Get all withdrawals for this user
    const withdrawalsSnap = await getDocs(collection(db, 'commissionWithdrawals'));
    const userWithdrawals = withdrawalsSnap.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        status: doc.data().status === 'approved' ? 'confirmed' : doc.data().status
      }))
      .filter(w => w.userId === userId);
    
    if (userWithdrawals.length === 0) {
      return {
        success: false,
        error: 'No withdrawals found for this user'
      };
    }
    
    const firstWithdrawal = userWithdrawals[0];
    const userName = firstWithdrawal.userName || 'Unknown';
    const userType = firstWithdrawal.userType || 'agen';
    
    // Calculate totals
    const confirmedWithdrawals = userWithdrawals.filter(w => w.status === 'confirmed');
    const pendingWithdrawals = userWithdrawals.filter(w => w.status === 'pending');
    const rejectedWithdrawals = userWithdrawals.filter(w => w.status === 'rejected');
    
    const totalConfirmed = confirmedWithdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);
    const totalPending = pendingWithdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);
    const totalRejected = rejectedWithdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);
    
    // Get current balance
    const balanceRef = doc(db, 'referralBalances', userId);
    const balanceSnap = await getDoc(balanceRef);
    
    if (!balanceSnap.exists()) {
      return {
        success: false,
        error: 'Balance document not found'
      };
    }
    
    const balanceData = balanceSnap.data();
    const oldBalance = balanceData.balance || 0;
    const oldTotalWithdrawn = balanceData.totalWithdrawn || 0;
    
    // Get total earnings
    let totalEarnings = 0;
    const referralCollection = userType === 'agen' ? 'agenReferrals' : 'alumniReferrals';
    const referralRef = doc(db, referralCollection, userId);
    const referralSnap = await getDoc(referralRef);
    
    if (referralSnap.exists()) {
      totalEarnings = referralSnap.data().totalCommission || 0;
    }
    
    // Calculate new balance
    const newBalance = totalEarnings - totalConfirmed;
    const newTotalWithdrawn = totalConfirmed;
    const adjustmentAmount = newBalance - oldBalance;
    
    // Update balance
    await updateDoc(balanceRef, {
      balance: newBalance,
      totalWithdrawn: newTotalWithdrawn,
    });
    
    console.log(`✅ ${userName}: Balance ${oldBalance} → ${newBalance} (${adjustmentAmount >= 0 ? '+' : ''}${adjustmentAmount})`);
    
    return {
      success: true,
      result: {
        userId,
        userName,
        userType,
        oldBalance,
        newBalance,
        oldTotalWithdrawn,
        newTotalWithdrawn,
        adjustmentAmount,
        totalEarnings,
        withdrawalBreakdown: {
          confirmed: totalConfirmed,
          pending: totalPending,
          rejected: totalRejected,
        }
      }
    };
    
  } catch (error) {
    console.error('❌ Recalculation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
