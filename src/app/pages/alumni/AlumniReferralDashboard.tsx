import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { db } from '../../../config/firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs, orderBy, addDoc, Timestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { 
  Gift, 
  Copy, 
  Share2, 
  TrendingUp, 
  DollarSign, 
  Users, 
  CheckCircle,
  Clock,
  Wallet,
  ArrowLeft,
  Link2,
  Eye,
  Calendar,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import CommissionWithdrawalForm, { WithdrawalFormData } from '../../components/CommissionWithdrawalForm'; // ✅ FIX: Correct path
import { copyToClipboard } from '../../../utils/clipboard'; // ✅ Import safe clipboard utility
import { COMMISSION_RATES } from '../../../constants/commissionRates'; // ✅ NEW: Import commission rates
import { autoCreateReferralCode } from '../../../utils/autoCreateReferralCode'; // ✅ NEW: Import centralized auto-create

interface ReferralData {
  alumniId: string; // Kept for backward compatibility
  userId?: string; // New standard field
  referralCode: string;
  createdAt: string;
  totalClicks: number;
  totalConversions: number;
  totalCommission: number;
}

interface ReferralUsage {
  id: string;
  referralCode: string;
  clickedAt: string;
  converted: boolean;
  packageName?: string;
  userName?: string;
  commissionAmount: number;
}

interface AlumniReferralDashboardProps {
  onBack?: () => void;
}

const AlumniReferralDashboard: React.FC<AlumniReferralDashboardProps> = ({ onBack }) => {
  const { userProfile, currentUser } = useAuth();
  const navigate = useNavigate();
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [referralUsages, setReferralUsages] = useState<ReferralUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);

  // Commission rate - 5% dari harga paket
  const COMMISSION_RATE = COMMISSION_RATES.alumni;

  useEffect(() => {
    if (userProfile?.uid) {
      initializeReferral();
    }
  }, [userProfile]);

  const initializeReferral = async () => {
    if (!userProfile?.uid) return;

    try {
      setLoading(true);

      // ✅ FIXED: Use centralized auto-create system
      console.log('🔧 [ALUMNI REFERRAL] Initializing referral system...');
      
      // Auto-create referral code if not exists (uses autoCreateReferralCode.ts)
      await autoCreateReferralCode(
        userProfile.uid, 
        'alumni', 
        userProfile.displayName || 'USER',
        userProfile.email
      );

      // Check if referral already exists (should exist after auto-create)
      const referralRef = doc(db, 'alumniReferrals', userProfile.uid);
      const referralSnap = await getDoc(referralRef);

      if (referralSnap.exists()) {
        const data = referralSnap.data();
        setReferralData(data as ReferralData);
        console.log('✅ [ALUMNI REFERRAL] Referral loaded:', data.referralCode);
        
        // Fetch referral usage history
        await fetchReferralUsages(data.referralCode);
      } else {
        console.error('❌ [ALUMNI REFERRAL] Failed to create referral code');
        toast.error('Gagal membuat kode referral. Silakan refresh halaman.');
      }

    } catch (error) {
      console.error('Error initializing referral:', error);
      toast.error('Gagal memuat data referral');
    } finally {
      setLoading(false);
    }
  };

  const fetchReferralUsages = async (refCode: string) => {
    try {
      const usagesQuery = query(
        collection(db, 'referralUsage'),
        where('referralCode', '==', refCode),
        orderBy('clickedAt', 'desc')
      );
      
      const usagesSnapshot = await getDocs(usagesQuery);
      const usagesData = usagesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ReferralUsage[];

      setReferralUsages(usagesData);
    } catch (error) {
      console.error('Error fetching referral usages:', error);
    }
  };

  const getReferralLink = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/?ref=${referralData?.referralCode}`;
  };

  const copyReferralLink = async () => {
    const link = getReferralLink();
    try {
      await copyToClipboard(link);
      setCopySuccess(true);
      toast.success('✅ Link berhasil disalin!');
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      toast.error('Gagal menyalin link');
    }
  };

  const shareReferral = async () => {
    const link = getReferralLink();
    const text = `🕌 Yuk ikutan Umrah bersama Sultanah Travel! Gunakan link referral saya untuk dapatkan penawaran spesial:\n\n${link}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Referral Sultanah Travel',
          text: text,
          url: link
        });
      } catch (error) {
        // User cancelled share
      }
    } else {
      copyReferralLink();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data referral...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <Button
            onClick={() => onBack ? onBack() : navigate('/')}
            variant="ghost"
            className="text-white hover:bg-white/20 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Dashboard
          </Button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Gift className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Program Referral Alumni</h1>
              <p className="text-purple-100 mt-1">Ajak teman & keluarga, dapatkan komisi!</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Referral Link Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="border-2 border-purple-200 bg-gradient-to-br from-white to-purple-50/30 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Link2 className="w-6 h-6 text-purple-600" />
                Link Referral Anda
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Kode Referral */}
              <div>
                <label className="text-sm font-medium text-gray-600 mb-2 block">Kode Referral</label>
                <div className="bg-gray-100 rounded-xl p-4 border-2 border-gray-300">
                  <p className="text-2xl font-bold text-purple-600 text-center tracking-wider">
                    {referralData?.referralCode}
                  </p>
                </div>
              </div>

              {/* Link Referral */}
              <div>
                <label className="text-sm font-medium text-gray-600 mb-2 block">Link Referral</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={getReferralLink()}
                    readOnly
                    className="flex-1 bg-white border-2 border-gray-300 rounded-xl px-4 py-3 text-sm"
                  />
                  <Button
                    onClick={copyReferralLink}
                    className="bg-gray-600 hover:bg-gray-700 px-6"
                  >
                    {copySuccess ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Tersalin!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Salin
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Share Button */}
              <Button
                onClick={shareReferral}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 py-6 text-lg"
              >
                <Share2 className="w-5 h-5 mr-2" />
                Bagikan Link Referral
              </Button>

              {/* Info */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-800">
                  💡 <strong>Cara kerja:</strong> Bagikan link Anda kepada teman/keluarga. 
                  Setiap mereka mendaftar & <strong>membayar paket umrah</strong> melalui link Anda (dan pembayaran di-approve oleh Admin), 
                  Anda akan mendapatkan komisi <strong>Rp{COMMISSION_RATE.toLocaleString('id-ID')}</strong> per referral yang berhasil!
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-2 border-blue-200 bg-gradient-to-br from-white to-blue-50/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Total Klik
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {referralData?.totalClicks || 0}
                </div>
                <p className="text-xs text-gray-500 mt-1">Orang yang mengklik link</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-2 border-green-200 bg-gradient-to-br from-white to-green-50/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Total Konversi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {referralData?.totalConversions || 0}
                </div>
                <p className="text-xs text-gray-500 mt-1">Pendaftaran berhasil</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-2 border-purple-200 bg-gradient-to-br from-white to-purple-50/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Total Komisi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {formatCurrency(referralData?.totalCommission || 0)}
                </div>
                <p className="text-xs text-gray-500 mt-1">Komisi yang didapat</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Referral Usage History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-2 border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                Riwayat Penggunaan Referral
              </CardTitle>
            </CardHeader>
            <CardContent>
              {referralUsages.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Penggunaan</h3>
                  <p className="text-gray-600">
                    Mulai bagikan link referral Anda untuk mendapatkan komisi!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {referralUsages.map((usage) => (
                    <div
                      key={usage.id}
                      className={`border-2 rounded-xl p-4 ${
                        usage.converted
                          ? 'border-green-200 bg-green-50/30'
                          : 'border-gray-200 bg-gray-50/30'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {usage.converted ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <Eye className="w-5 h-5 text-gray-400" />
                            )}
                            <p className="font-semibold text-gray-900">
                              {usage.converted ? 'Berhasil Konversi! 🎉' : 'Klik Link'}
                            </p>
                          </div>

                          <div className="space-y-1 text-sm">
                            <p className="text-gray-600">
                              <Calendar className="w-4 h-4 inline mr-1" />
                              {formatDate(usage.clickedAt)}
                            </p>
                            {usage.converted && usage.packageName && (
                              <p className="text-gray-600">
                                📦 Paket: <strong>{usage.packageName}</strong>
                              </p>
                            )}
                            {usage.userName && (
                              <p className="text-gray-600">
                                👤 Oleh: <strong>{usage.userName}</strong>
                              </p>
                            )}
                          </div>
                        </div>

                        {usage.converted && (
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Komisi</p>
                            <p className="text-xl font-bold text-green-600">
                              {formatCurrency(usage.commissionAmount)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
            <CardContent className="p-6">
              <h3 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                <Gift className="w-5 h-5" />
                Syarat & Ketentuan
              </h3>
              <ul className="space-y-2 text-sm text-purple-800">
                <li>✅ Komisi <strong>Rp{COMMISSION_RATE.toLocaleString('id-ID')}</strong> per referral yang berhasil</li>
                <li>✅ Komisi dihitung HANYA setelah pembayaran paket di-approve oleh Admin</li>
                <li>✅ Link referral berlaku selamanya</li>
                <li>✅ Tidak ada batas jumlah referral yang bisa Anda dapatkan</li>
                <li>✅ Pencairan komisi dapat diajukan melalui tombol "Ajukan Pencairan Komisi" di bawah</li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        {/* Commission Withdrawal Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8"
        >
          <Card className="border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-amber-600" />
                Ajukan Pencairan Komisi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Komisi tersedia: <span className="text-green-600 font-semibold">{formatCurrency(referralData?.totalCommission || 0)}</span>
                </p>
              </div>
              <Button
                onClick={() => setShowWithdrawalForm(true)}
                disabled={(referralData?.totalCommission || 0) <= 0}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
              >
                <Wallet className="w-4 h-4 mr-2" />
                Ajukan Pencairan Komisi
              </Button>
              {(referralData?.totalCommission || 0) <= 0 && (
                <p className="text-sm text-gray-500 mt-2 text-center">
                  Belum ada komisi yang dapat dicairkan
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Commission Withdrawal Dialog */}
      <CommissionWithdrawalForm
        open={showWithdrawalForm}
        onClose={() => setShowWithdrawalForm(false)}
        onSubmit={async (formData: WithdrawalFormData) => {
          if (!currentUser) return;

          try {
            await addDoc(collection(db, 'commissionWithdrawals'), {
              userId: currentUser.uid,
              userName: userProfile?.displayName || currentUser.email,
              userEmail: currentUser.email,
              userType: 'alumni',
              amount: formData.amount,
              // Payment method details
              paymentMethod: formData.paymentMethod,
              // Bank transfer
              bankName: formData.bankName || null,
              accountNumber: formData.accountNumber || null,
              accountHolderName: formData.accountHolderName || null,
              // E-wallet
              ewalletProvider: formData.ewalletProvider || null,
              ewalletNumber: formData.ewalletNumber || null,
              ewalletAccountName: formData.ewalletAccountName || null,
              status: 'pending',
              requestDate: Timestamp.now(),
              note: '',
            });

            toast.success('✅ Permintaan pencairan komisi berhasil diajukan!');
          } catch (error) {
            console.error('Error submitting withdrawal:', error);
            toast.error('Gagal mengajukan pencairan komisi');
          }
        }}
        maxAmount={referralData?.totalCommission || 0}
        userType="alumni"
      />
    </div>
  );
};

export default AlumniReferralDashboard;