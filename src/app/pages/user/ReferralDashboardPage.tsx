import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../../contexts/AuthContext';
import { doc, getDoc, collection, query, where, getDocs, setDoc, addDoc, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { toast } from 'sonner';
import { Copy, CheckCircle, Users, DollarSign, TrendingUp, Share2, Link as LinkIcon, ArrowLeft, Gift, Check, Award, Wallet, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import UserLayout from './UserLayout';
import { copyToClipboard } from '../../../utils/clipboard'; // ✅ Import safe clipboard utility
import { Referral, ReferredUser } from '../../../types'; // ✅ Import types
import CommissionWithdrawalForm, { WithdrawalFormData } from '../../components/CommissionWithdrawalForm'; // ✅ Import withdrawal form

interface ReferralDashboardPageProps {
  onBack: () => void;
}

const ReferralDashboardPage: React.FC<ReferralDashboardPageProps> = ({ onBack }) => {
  const { currentUser, userProfile } = useAuth();
  const [referralData, setReferralData] = useState<Referral | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [referralLink, setReferralLink] = useState('');
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const [commissionBalance, setCommissionBalance] = useState(0);
  const [withdrawalHistory, setWithdrawalHistory] = useState<any[]>([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);

  useEffect(() => {
    if (currentUser) {
      initializeReferral();
      loadCommissionData();
      loadWithdrawalHistory();
    }
  }, [currentUser]);

  const generateReferralCode = (userId: string): string => {
    // Generate unique referral code from userId
    const code = userId.substring(0, 8).toUpperCase();
    return `SULTANAH${code}`;
  };

  const initializeReferral = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const referralRef = doc(db, 'referrals', currentUser.uid);
      const referralSnap = await getDoc(referralRef);

      if (referralSnap.exists()) {
        const data = referralSnap.data() as Referral;
        setReferralData(data);
        setReferralLink(`${window.location.origin}?ref=${data.code}`);
      } else {
        // Create new referral record
        const code = generateReferralCode(currentUser.uid);
        const newReferral: Referral = {
          id: currentUser.uid,
          userId: currentUser.uid,
          code: code,
          totalReferrals: 0,
          referredUsers: [],
          rewards: {
            points: 0,
            bonuses: []
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        await setDoc(referralRef, newReferral);
        setReferralData(newReferral);
        setReferralLink(`${window.location.origin}?ref=${code}`);
        
        // Also update user document with referral code
        const userRef = doc(db, 'users', currentUser.uid);
        await setDoc(userRef, { referralCode: code }, { merge: true });
      }

      // ✅ AUTO-INITIALIZE: Ensure commissionBalance exists in user document
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        
        // If commissionBalance doesn't exist, initialize it to 0
        if (userData.commissionBalance === undefined || userData.commissionBalance === null) {
          await setDoc(userRef, { 
            commissionBalance: 0 
          }, { merge: true });
          
          console.log('✅ Auto-initialized commissionBalance to 0');
          setCommissionBalance(0);
        } else {
          setCommissionBalance(userData.commissionBalance);
        }
      } else {
        // User document doesn't exist - create it with commission balance
        await setDoc(userRef, { 
          commissionBalance: 0 
        }, { merge: true });
        
        console.log('✅ Created user document with commissionBalance');
        setCommissionBalance(0);
      }
    } catch (error) {
      console.error('Error initializing referral:', error);
      toast.error('Gagal memuat data referral');
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = async () => {
    const success = await copyToClipboard(referralLink);
    if (success) {
      setCopied(true);
      toast.success('Link referral berhasil disalin!');
      setTimeout(() => setCopied(false), 3000);
    } else {
      toast.error('Gagal menyalin link');
    }
  };

  const shareToWhatsApp = () => {
    const message = `🕋 Assalamu'alaikum!\n\nYuk bergabung dengan Sultanah Travel untuk perjalanan Umroh impianmu!\n\nGunakan kode referral saya: ${referralData?.code}\nAtau klik link ini: ${referralLink}\n\n✨ Dapatkan benefit spesial untuk pendaftaran pertamamu!\n\nBarakallah!`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const getStatusBadge = (status: ReferredUser['status']) => {
    const badges = {
      registered: { label: 'Terdaftar', color: 'bg-blue-100 text-blue-700' },
      verified: { label: 'Terverifikasi', color: 'bg-green-100 text-green-700' },
      converted: { label: 'Sudah Booking', color: 'bg-gold/20 text-gold-dark' }
    };
    return badges[status] || badges.registered;
  };

  const loadCommissionData = async () => {
    if (!currentUser) return;

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        setCommissionBalance(data?.commissionBalance || 0);
      }
    } catch (error) {
      console.error('Error loading commission data:', error);
      toast.error('Gagal memuat data komisi');
    }
  };

  const loadWithdrawalHistory = async () => {
    if (!currentUser) return;

    try {
      setLoadingWithdrawals(true);
      const withdrawalsRef = collection(db, 'withdrawals');
      const q = query(withdrawalsRef, where('userId', '==', currentUser.uid), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const history: any[] = [];
      querySnapshot.forEach((doc) => {
        history.push({ id: doc.id, ...doc.data() });
      });

      setWithdrawalHistory(history);
    } catch (error) {
      console.error('Error loading withdrawal history:', error);
      toast.error('Gagal memuat riwayat penarikan');
    } finally {
      setLoadingWithdrawals(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
          <p className="mt-4 text-gray-600">Memuat data referral...</p>
        </div>
      </div>
    );
  }

  return (
    <UserLayout>
      {/* Header */}
      <div className="relative bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] text-white py-20">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.05) 10px, rgba(255,255,255,.05) 20px)'
          }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            <Button
              onClick={onBack}
              variant="ghost"
              className="text-white hover:bg-white/20 gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Kembali
            </Button>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-md rounded-full mb-6">
              <Gift className="w-10 h-10" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Program Referral
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Ajak teman dan keluarga bergabung, dapatkan reward spesial!
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Total Referrals */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-gray-600 text-sm mb-1">Total Referral</p>
            <p className="text-3xl font-bold text-gray-900">{referralData?.totalReferrals || 0}</p>
            <p className="text-xs text-gray-500 mt-2">Orang yang bergabung</p>
          </motion.div>

          {/* Points */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-gold via-gold-light to-gold-dark rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-1">Poin Reward</p>
            <p className="text-3xl font-bold bg-gradient-to-r from-gold via-gold-light to-gold-dark bg-clip-text text-transparent">
              {referralData?.rewards?.points || 0}
            </p>
            <p className="text-xs text-gray-500 mt-2">Bisa ditukar benefit</p>
          </motion.div>

          {/* Converted */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <Check className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-1">Sudah Booking</p>
            <p className="text-3xl font-bold text-gray-900">
              {referralData?.referredUsers.filter(u => u.status === 'converted').length || 0}
            </p>
            <p className="text-xs text-gray-500 mt-2">Dari total referral</p>
          </motion.div>
        </div>

        {/* ✅ NEW: Commission Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-8 shadow-xl mb-12 text-white"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                <Wallet className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-white/80 text-sm mb-1">Saldo Komisi Anda</p>
                <p className="text-4xl font-bold">
                  Rp {commissionBalance.toLocaleString('id-ID')}
                </p>
                <p className="text-white/70 text-xs mt-1">Bisa dicairkan kapan saja</p>
              </div>
            </div>
            <Button
              onClick={() => setShowWithdrawalForm(true)}
              disabled={commissionBalance <= 0}
              className="bg-white text-green-600 hover:bg-white/90 gap-2 px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Wallet className="w-5 h-5" />
              Ajukan Pencairan Komisi
            </Button>
          </div>
        </motion.div>

        {/* Referral Link Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 shadow-xl border border-gray-200 mb-12"
        >
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Link Referral Anda</h2>
            <p className="text-gray-600">Bagikan link atau kode referral untuk mengajak teman bergabung</p>
          </div>

          {/* Referral Code */}
          <div className="bg-white rounded-xl p-6 border-2 border-dashed border-gold/50 mb-6">
            <p className="text-sm text-gray-600 mb-2 text-center">Kode Referral Anda:</p>
            <p className="text-3xl font-bold text-center bg-gradient-to-r from-gold via-gold-light to-gold-dark bg-clip-text text-transparent tracking-wider">
              {referralData?.code}
            </p>
          </div>

          {/* Link Input */}
          <div className="flex flex-col md:flex-row gap-3 mb-6">
            <input
              type="text"
              value={referralLink}
              readOnly
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-sm"
            />
            <Button
              onClick={copyReferralLink}
              className={`${
                copied
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] hover:opacity-90'
              } text-white gap-2 px-6 py-3 rounded-xl transition-all`}
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5" />
                  Tersalin!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  Salin Link
                </>
              )}
            </Button>
          </div>

          {/* Share Buttons */}
          <div className="flex flex-col md:flex-row gap-3">
            <Button
              onClick={shareToWhatsApp}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white gap-2 py-3 rounded-xl"
            >
              <Share2 className="w-5 h-5" />
              Bagikan via WhatsApp
            </Button>
          </div>
        </motion.div>

        {/* Referred Users List */}
        {referralData && referralData.referredUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Daftar Referral Anda ({referralData.referredUsers.length})
            </h2>
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Nama</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Email</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Tanggal Bergabung</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {referralData.referredUsers.map((user, index) => {
                      const statusBadge = getStatusBadge(user.status);
                      return (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-medium text-gray-900">{user.userName}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-600">{user.email}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-600">
                              {new Date(user.joinedAt).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
                              {statusBadge.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {referralData && referralData.referredUsers.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-gray-200"
          >
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Belum Ada Referral</h3>
            <p className="text-gray-600 mb-6">
              Mulai bagikan link referral Anda untuk mengajak teman dan keluarga bergabung!
            </p>
            <Button
              onClick={shareToWhatsApp}
              className="bg-green-500 hover:bg-green-600 text-white gap-2 px-6 py-3 rounded-xl"
            >
              <Share2 className="w-5 h-5" />
              Mulai Bagikan Sekarang
            </Button>
          </motion.div>
        )}
      </div>

      {/* ✅ NEW: Commission Withdrawal Form Dialog */}
      <CommissionWithdrawalForm
        open={showWithdrawalForm}
        onClose={() => setShowWithdrawalForm(false)}
        onSubmit={async (data: WithdrawalFormData) => {
          try {
            if (!currentUser || !userProfile) {
              toast.error('Data user tidak ditemukan');
              return;
            }

            // Create withdrawal request
            await addDoc(collection(db, 'commissionWithdrawals'), {
              userId: currentUser.uid,
              userName: userProfile.fullName || userProfile.email,
              userEmail: userProfile.email,
              userType: userProfile.role === 'agen' ? 'agen' : 'alumni',
              amount: data.amount,
              paymentMethod: data.paymentMethod,
              bankName: data.bankName || '',
              accountNumber: data.accountNumber || '',
              accountHolderName: data.accountHolderName || '',
              ewalletProvider: data.ewalletProvider || '',
              ewalletNumber: data.ewalletNumber || '',
              ewalletAccountName: data.ewalletAccountName || '',
              status: 'pending',
              requestDate: Timestamp.now(),
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now(),
            });

            toast.success('Pengajuan pencairan berhasil! Mohon tunggu konfirmasi admin.');
            setShowWithdrawalForm(false);
            loadCommissionData();
            loadWithdrawalHistory();
          } catch (error) {
            console.error('Error submitting withdrawal:', error);
            toast.error('Gagal mengajukan pencairan');
          }
        }}
        maxAmount={commissionBalance}
        userType={userProfile?.role === 'agen' ? 'agen' : 'alumni'}
      />
    </UserLayout>
  );
};

export default ReferralDashboardPage;