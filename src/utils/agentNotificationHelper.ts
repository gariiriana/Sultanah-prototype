import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Create notification for agent when referral code is used
 */
export const createReferralUsedNotification = async (
  agentId: string,
  referredUserId: string,
  referralName: string,
  referralCode: string
) => {
  try {
    await addDoc(collection(db, 'agentNotifications'), {
      agentId,
      type: 'referral_used',
      title: '🎉 Kode Referral Digunakan!',
      message: `${referralName} baru saja mendaftar menggunakan kode referral Anda (${referralCode})`,
      referralName,
      referredUserId,
      referralCode,
      isRead: false,
      createdAt: Timestamp.now(),
    });
    console.log('✅ Referral used notification created for agent:', agentId);
  } catch (error) {
    console.error('❌ Error creating referral used notification:', error);
  }
};

/**
 * Create notification for agent when payment is approved and commission earned
 */
export const createPaymentApprovedNotification = async (
  agentId: string,
  referralName: string,
  packageName: string,
  commissionAmount: number
) => {
  try {
    await addDoc(collection(db, 'agentNotifications'), {
      agentId,
      type: 'payment_approved',
      title: '💰 Pembayaran Disetujui!',
      message: `Pembayaran ${referralName} untuk paket ${packageName} telah disetujui admin`,
      referralName,
      packageName,
      amount: commissionAmount,
      isRead: false,
      createdAt: Timestamp.now(),
    });
    console.log('✅ Payment approved notification created for agent:', agentId);
  } catch (error) {
    console.error('❌ Error creating payment approved notification:', error);
  }
};

/**
 * Create notification for agent when profit is earned
 */
export const createProfitEarnedNotification = async (
  agentId: string,
  referralName: string,
  profitAmount: number
) => {
  try {
    await addDoc(collection(db, 'agentNotifications'), {
      agentId,
      type: 'profit_earned',
      title: '✨ Profit Diperoleh!',
      message: `Selamat! Anda mendapatkan profit dari referral ${referralName}`,
      referralName,
      amount: profitAmount,
      isRead: false,
      createdAt: Timestamp.now(),
    });
    console.log('✅ Profit earned notification created for agent:', agentId);
  } catch (error) {
    console.error('❌ Error creating profit earned notification:', error);
  }
};