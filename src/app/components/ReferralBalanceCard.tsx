import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Wallet, TrendingUp, ArrowDownCircle } from 'lucide-react';
import { formatCommission } from '../../constants/commissionRates';
import CommissionWithdrawalForm, { WithdrawalFormData } from './CommissionWithdrawalForm';
import { processWithdrawalRequest } from '../../utils/referralProcessor';
import { toast } from 'sonner';

interface ReferralBalanceCardProps {
  userId: string;
  userRole: 'alumni' | 'agen';
}

interface BalanceData {
  balance: number;
  totalEarned: number;
  totalWithdrawn: number;
}

const ReferralBalanceCard: React.FC<ReferralBalanceCardProps> = ({ userId, userRole }) => {
  const [balanceData, setBalanceData] = useState<BalanceData>({
    balance: 0,
    totalEarned: 0,
    totalWithdrawn: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const balanceRef = doc(db, 'referralBalances', userId);
    
    const unsubscribe = onSnapshot(
      balanceRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          setBalanceData({
            balance: data.balance || 0,
            totalEarned: data.totalEarned || 0,
            totalWithdrawn: data.totalWithdrawn || 0,
          });
        } else {
          setBalanceData({
            balance: 0,
            totalEarned: 0,
            totalWithdrawn: 0,
          });
        }
        setLoading(false);
      },
      (error) => {
        // ✅ SILENT FAIL: Permission denied is expected if doc doesn't exist or user doesn't have access
        // No logging needed - just set default values
        setBalanceData({
          balance: 0,
          totalEarned: 0,
          totalWithdrawn: 0,
        });
        setLoading(false);
      }
    );

    // Timeout fallback
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 3000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, [userId]);

  const handleWithdrawalSubmit = async (formData: WithdrawalFormData) => {
    try {
      console.log('💸 [WITHDRAWAL] Submitting withdrawal request:', formData);

      // Determine bank info based on payment method
      const bankName = formData.paymentMethod === 'bank' 
        ? formData.bankName || ''
        : formData.ewalletProvider || '';
      
      const accountNumber = formData.paymentMethod === 'bank'
        ? formData.accountNumber || ''
        : formData.ewalletNumber || '';
      
      const accountName = formData.paymentMethod === 'bank'
        ? formData.accountHolderName || ''
        : formData.ewalletAccountName || '';

      // Process withdrawal
      const result = await processWithdrawalRequest(
        userId,
        formData.amount,
        bankName,
        accountNumber,
        accountName
      );

      if (result.success) {
        toast.success('✅ Pengajuan pencairan berhasil!', {
          description: `Saldo Anda telah dikurangi Rp${formData.amount.toLocaleString('id-ID')}. Menunggu approval Admin.`,
          duration: 5000,
        });
        setShowWithdrawalForm(false);
      } else {
        toast.error('❌ Pengajuan pencairan gagal', {
          description: result.error || 'Terjadi kesalahan saat memproses pencairan',
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('❌ [WITHDRAWAL] Error submitting withdrawal:', error);
      toast.error('❌ Terjadi kesalahan', {
        description: error instanceof Error ? error.message : 'Gagal mengajukan pencairan',
      });
    }
  };

  if (loading) {
    return (
      <Card className="border-amber-200">
        <CardContent className="p-8">
          <div className="flex items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-amber-600"></div>
            <p className="text-gray-600">Loading balance...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-amber-600" />
            Saldo Komisi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Balance */}
          <div className="text-center py-6 px-4 bg-white rounded-xl shadow-sm border border-amber-100">
            <p className="text-sm text-gray-600 mb-2">Saldo Tersedia</p>
            <p className="text-4xl font-bold text-amber-600 mb-4">
              {formatCommission(balanceData.balance)}
            </p>
            <Button
              onClick={() => setShowWithdrawalForm(true)}
              disabled={balanceData.balance < 50000}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md"
            >
              <ArrowDownCircle className="w-4 h-4 mr-2" />
              Ajukan Pencairan
            </Button>
            {balanceData.balance < 50000 && balanceData.balance > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                Minimum pencairan Rp50.000
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-100">
              <div className="flex items-start gap-2">
                <TrendingUp className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-600 mb-1">Total Pendapatan</p>
                  <p className="font-semibold text-gray-900">
                    {formatCommission(balanceData.totalEarned)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-100">
              <div className="flex items-start gap-2">
                <ArrowDownCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-600 mb-1">Total Ditarik</p>
                  <p className="font-semibold text-gray-900">
                    {formatCommission(balanceData.totalWithdrawn)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800 leading-relaxed">
              💡 <strong>Catatan:</strong> Saldo akan langsung berkurang saat Anda mengajukan pencairan. 
              Jika ditolak oleh Admin, saldo akan dikembalikan secara otomatis.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Withdrawal Form Modal */}
      <CommissionWithdrawalForm
        open={showWithdrawalForm}
        onClose={() => setShowWithdrawalForm(false)}
        onSubmit={handleWithdrawalSubmit}
        maxAmount={balanceData.balance}
        userType={userRole}
      />
    </>
  );
};

export default ReferralBalanceCard;