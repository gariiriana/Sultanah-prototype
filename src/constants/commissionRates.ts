/**
 * 💰 COMMISSION RATES CONFIGURATION
 * 
 * Ketentuan komisi referral Sultanah Travel:
 * - Alumni Jamaah Umroh: Rp200.000 per Jamaah
 * - Reseller Agen: Rp500.000 per Jamaah
 * 
 * Komisi HANYA dihitung setelah:
 * 1. Jamaah melakukan pembayaran
 * 2. Pembayaran di-approve oleh Admin
 */

export const COMMISSION_RATES = {
  // Referral Affiliator (Alumni Jamaah Umroh)
  alumni: 200000, // Rp200.000

  // Reseller Agen
  agen: 500000, // Rp500.000
} as const;

export type CommissionRole = keyof typeof COMMISSION_RATES;

/**
 * Get commission amount based on referrer role
 */
export function getCommissionAmount(referrerRole: string): number {
  if (referrerRole === 'alumni') {
    return COMMISSION_RATES.alumni;
  } else if (referrerRole === 'agen') {
    return COMMISSION_RATES.agen;
  }
  return 0; // No commission for other roles
}

/**
 * Format commission amount to Indonesian Rupiah
 */
export function formatCommission(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Referral Status Types
 */
export const REFERRAL_STATUS = {
  // Jamaah baru registrasi, belum bayar
  REGISTERED: 'registered',
  
  // Jamaah sudah submit payment, menunggu approval
  PAYMENT_SUBMITTED: 'payment_submitted',
  
  // Payment approved, komisi sudah dihitung
  CONVERTED: 'converted',
  
  // Payment rejected
  PAYMENT_REJECTED: 'payment_rejected',
} as const;

export type ReferralStatus = typeof REFERRAL_STATUS[keyof typeof REFERRAL_STATUS];

/**
 * Get status display name in Bahasa Indonesia
 */
export function getReferralStatusDisplay(status: string): string {
  const statusMap: Record<string, string> = {
    'registered': '🆕 Baru Daftar (Belum Bayar)',
    'payment_submitted': '⏳ Menunggu Approval Pembayaran',
    'converted': '✅ Pembayaran Approved - Komisi Aktif',
    'payment_rejected': '❌ Pembayaran Ditolak',
    'pending': '⏳ Menunggu Pembayaran', // Legacy status
  };
  return statusMap[status] || status;
}

/**
 * Get status color for UI
 */
export function getReferralStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    'registered': 'text-blue-600',
    'payment_submitted': 'text-yellow-600',
    'converted': 'text-green-600',
    'payment_rejected': 'text-red-600',
    'pending': 'text-gray-600',
  };
  return colorMap[status] || 'text-gray-600';
}
