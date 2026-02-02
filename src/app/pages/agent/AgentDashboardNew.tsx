import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { db } from '../../../config/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  onSnapshot
} from 'firebase/firestore';
import { toast } from 'sonner';
import {
  Users,
  DollarSign,
  TrendingUp,
  Copy,
  Check,
  Gift,
  CheckCircle,
  Clock,
  Wallet,
  LogOut,
  Link as LinkIcon,
  Award,

  Sparkles,
  Crown,
  Settings
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../components/ui/alert-dialog';
import CommissionWithdrawalForm, { WithdrawalFormData } from '../../components/CommissionWithdrawalForm';
import { copyToClipboard } from '../../../utils/clipboard';
import { autoCreateReferralCode } from '../../../utils/autoCreateReferralCode';
// import ReferralDetailsTable from '../../components/ReferralDetailsTable';

// ✅ LOGO: Genuine Sultanah Logo
const logoSultanah = '/images/logo.png';
import ReferralListRealtime from '../../components/ReferralListRealtime';
import ReferralBalanceCard from '../../components/ReferralBalanceCard';
import AgentNotificationBell from '../../components/AgentNotificationBell';

interface ReferralStats {
  referralCode: string;
  totalReferrals: number;
  totalCommission: number;
  pendingCommission: number;
  approvedCommission: number;
  withdrawnCommission: number; // ✅ Total yang sudah dicairkan
  conversions: number;
  totalClicks: number;
}

interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userType: 'alumni' | 'agen' | 'brand_ambassador' | 'affiliator' | 'influencer';
  amount: number;
  status: 'pending' | 'confirmed' | 'rejected'; // ✅ Changed 'approved' to 'confirmed'
  requestDate: Date;
  processedDate?: Date;
  note?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  transferProofUrl?: string;
  // E-wallet fields
  ewalletProvider?: string;
  ewalletNumber?: string;
  ewalletAccountName?: string;
  paymentMethod?: 'bank' | 'ewallet';
}

const AgentDashboardNew: React.FC = () => {
  const { userProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<ReferralStats>({
    referralCode: '',
    totalReferrals: 0,
    totalCommission: 0,
    pendingCommission: 0,
    approvedCommission: 0,
    withdrawnCommission: 0, // ✅ Total yang sudah dicairkan
    conversions: 0,
    totalClicks: 0,
  });
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);

  useEffect(() => {
    if (userProfile?.uid) {
      // ✅ FIX: Support all agent-like roles
      const isAgent = ['agen', 'brand_ambassador', 'influencer', 'affiliator'].includes(userProfile.role);
      if (isAgent) {
        initializeReferral();
        loadWithdrawalRequests();
      }
    }
  }, [userProfile]);

  const initializeReferral = async () => {
    if (!userProfile?.uid) return;

    try {
      setLoading(true);

      // Auto-create referral code
      const success = await autoCreateReferralCode(
        userProfile.uid,
        userProfile.role as any,
        userProfile.displayName || 'AGEN',
        userProfile.email
      );

      if (!success) {
        setLoading(false);
        return;
      }

      // Set up real-time listener for BOTH collections
      const unsubscribeReferrals = onSnapshot(
        doc(db, 'agenReferrals', userProfile.uid),
        {
          includeMetadataChanges: false,
        },
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            setStats(prevStats => ({
              ...prevStats,
              referralCode: data.referralCode || '',
              totalReferrals: data.totalReferrals || 0,
              totalCommission: data.totalCommission || 0,
              pendingCommission: data.pendingCommission || 0,
              conversions: data.totalConversions || 0,
              totalClicks: data.totalClicks || 0,
            }));
          }
          setLoading(false);
        },
        () => {
          // console.error(error);
          setLoading(false);
        }
      );

      // ✅ REAL-TIME: Listen to referralBalances for actual balance & withdrawn
      const unsubscribeBalance = onSnapshot(
        doc(db, 'referralBalances', userProfile.uid),
        {
          includeMetadataChanges: false,
        },
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            setStats(prevStats => ({
              ...prevStats,
              approvedCommission: data.balance || 0, // ✅ Balance yang bisa dicairkan
              withdrawnCommission: data.totalWithdrawn || 0, // ✅ Total yang sudah ditarik
            }));
          } else {
            // If no balance doc, default to 0
            setStats(prevStats => ({
              ...prevStats,
              approvedCommission: 0,
              withdrawnCommission: 0,
            }));
          }
        },
        () => {
          // ✅ SILENT FAIL: Permission denied is expected if doc doesn't exist yet or during role transition
          // No logging needed - just set default values
          setStats(prevStats => ({
            ...prevStats,
            approvedCommission: 0,
            withdrawnCommission: 0,
          }));
        }
      );

      // Timeout fallback
      const timeout = setTimeout(() => {
        setLoading(false);
      }, 5000);

      return () => {
        unsubscribeReferrals();
        unsubscribeBalance();
        clearTimeout(timeout);
      };
    } catch (error) {
      setLoading(false);
    }
  };

  const loadWithdrawalRequests = async () => {
    if (!userProfile?.uid) return;

    try {
      const q = query(
        collection(db, 'commissionWithdrawals'),
        where('userId', '==', userProfile.uid)
      );

      const querySnapshot = await getDocs(q);
      const requests = querySnapshot.docs.map(doc => {
        const data = doc.data();

        // ✅ BACKWARD COMPATIBILITY: Convert old status to new format
        let status = data.status;
        if (status === 'approved') {
          status = 'confirmed';
        }

        return {
          id: doc.id,
          ...data,
          status, // Use converted status
          requestDate: data.requestDate?.toDate() || new Date(),
          processedDate: data.processedDate?.toDate(),
        } as WithdrawalRequest;
      });

      setWithdrawalRequests(requests.sort((a, b) => b.requestDate.getTime() - a.requestDate.getTime()));
    } catch (error) {
      console.error('Error loading withdrawal requests:', error);
    }
  };

  const handleCopyCode = async () => {
    const success = await copyToClipboard(stats.referralCode);
    if (success) {
      setCopySuccess(true);
      toast.success('Kode referral berhasil disalin!');
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleCopyLink = async () => {
    const referralLink = `${window.location.origin}/?ref=${stats.referralCode}`;
    const success = await copyToClipboard(referralLink);
    if (success) {
      toast.success('Link referral berhasil disalin!');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Berhasil logout');
      navigate('/');
    } catch (error) {
      toast.error('Gagal logout');
    }
  };

  const referralLink = `${window.location.origin}/?ref=${stats.referralCode}`;


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Beautiful Kaaba Background Image - Full Screen */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(/images/mecca-background.jpg)`,
          zIndex: 0
        }}
      />
      {/* Dark overlay for better text contrast */}
      <div className="fixed inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" style={{ zIndex: 1 }} />

      {/* Content Container */}
      <div className="relative" style={{ zIndex: 2 }}>
        {/* Premium Glassmorphism Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white/10 backdrop-blur-xl border-b border-white/20 shadow-2xl sticky top-0"
          style={{ zIndex: 50 }}>
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
              <div className="flex items-center gap-2 sm:gap-4">
                <motion.img
                  src={logoSultanah}
                  alt="Sultanah"
                  className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl shadow-lg bg-white p-2"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                />
                <div>
                  <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white flex items-center gap-1 sm:gap-2 drop-shadow-lg">
                    <Crown className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-[#D4AF37]" />
                    Beranda {
                      userProfile?.role === 'affiliator' ? 'Affiliator' :
                        userProfile?.role === 'influencer' ? 'Influencer' :
                          userProfile?.role === 'agen' ? 'Agen Syiar' :
                            'Brand Ambassador'
                    }
                  </h1>
                  <p className="text-white/90 text-xs sm:text-sm mt-1 drop-shadow-md">
                    Selamat datang, <span className="font-semibold">{userProfile?.displayName ||
                      (userProfile?.role === 'affiliator' ? 'Affiliator' :
                        userProfile?.role === 'influencer' ? 'Influencer' :
                          userProfile?.role === 'agen' ? 'Agen' : 'Mitra')
                    }</span>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 sm:gap-3">
                <AgentNotificationBell
                  userId={userProfile?.uid || ''}
                  className="text-white hover:bg-white/20 rounded-full"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/agent/profile')}
                  className="text-white hover:bg-white/20 rounded-full">
                  <Settings className="w-5 h-5" />
                </Button>
                <Button
                  onClick={() => setShowLogoutDialog(true)}
                  className="bg-white/20 hover:bg-white/30 text-white border-0 rounded-full px-4 sm:px-6 text-sm">
                  <LogOut className="w-4 h-4 mr-2" />
                  Keluar
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
          {/* Stats Cards - Glassmorphism Design */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
            {/* Total Referrals */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}>
              <Card className="relative overflow-hidden border border-white/20 shadow-2xl bg-white/10 backdrop-blur-xl text-white">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
                <CardContent className="p-4 sm:p-6 relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                    </div>
                    <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white/70" />
                  </div>
                  <p className="text-blue-100 text-[10px] sm:text-xs md:text-sm font-medium mb-0.5 sm:mb-1">Total Referral</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold">{stats.totalReferrals}</p>
                  <p className="text-blue-100 text-[9px] sm:text-[10px] md:text-xs mt-1 sm:mt-2">{stats.totalClicks} total klik</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Approved Commission - Card Hijau */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}>
              <Card className="relative overflow-hidden border border-white/20 shadow-2xl bg-white/10 backdrop-blur-xl text-white">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
                <CardContent className="p-2 sm:p-4 md:p-6 relative z-10">
                  <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-between backdrop-blur-sm">
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                    </div>
                    <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white/70" />
                  </div>
                  <p className="text-green-100 text-[10px] sm:text-xs md:text-sm font-medium mb-0.5 sm:mb-1">Total Saldo</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold">Rp {stats.approvedCommission.toLocaleString('id-ID')}</p>
                  <p className="text-green-100 text-[9px] sm:text-[10px] md:text-xs mt-1 sm:mt-2">Siap dicairkan</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Pending Commission - Card Orange */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}>
              <Card className="relative overflow-hidden border border-white/20 shadow-2xl bg-white/10 backdrop-blur-xl text-white">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
                <CardContent className="p-2 sm:p-4 md:p-6 relative z-10">
                  <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                    </div>
                    <Award className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white/70" />
                  </div>
                  <p className="text-yellow-100 text-[10px] sm:text-xs md:text-sm font-medium mb-0.5 sm:mb-1">Komisi Disetujui</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold">Rp {stats.withdrawnCommission.toLocaleString('id-ID')}</p>
                  <p className="text-yellow-100 text-[9px] sm:text-[10px] md:text-xs mt-1 sm:mt-2">Sudah dibayar admin</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="referral" className="space-y-6">
            <TabsList className="bg-white/10 backdrop-blur-xl shadow-2xl border border-white/20 p-1 sm:p-1.5 rounded-2xl flex justify-center">
              <TabsTrigger
                value="referral"
                className="rounded-xl data-[state=active]:bg-[#D4AF37] data-[state=active]:text-white text-white/70 px-3 sm:px-6 md:px-8 py-2 sm:py-3 font-semibold hover:text-white transition-colors text-xs sm:text-sm md:text-base flex-1 sm:flex-none">
                <Gift className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="whitespace-nowrap">Program Referral</span>
              </TabsTrigger>
              <TabsTrigger
                value="withdrawal"
                className="rounded-xl data-[state=active]:bg-[#D4AF37] data-[state=active]:text-white text-white/70 px-3 sm:px-6 md:px-8 py-2 sm:py-3 font-semibold hover:text-white transition-colors text-xs sm:text-sm md:text-base flex-1 sm:flex-none">
                <Wallet className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="whitespace-nowrap">Pencairan Komisi</span>
              </TabsTrigger>
            </TabsList>

            {/* Referral Tab */}
            <TabsContent value="referral" className="space-y-6">
              {/* Referral Code Card - Premium */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}>
                <Card className="border-0 shadow-2xl overflow-hidden">
                  <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-4 sm:p-6 md:p-8 rounded-t-2xl">
                    <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                        <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Kode Referral Anda</h2>
                        <p className="text-white/90 text-xs sm:text-sm">Bagikan untuk mendapatkan komisi Rp500.000/referral</p>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 sm:p-5 md:p-6 shadow-xl">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
                        <div>
                          <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2 font-medium">Kode Referral Anda</p>
                          <p className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#D4AF37] to-[#FFD700] bg-clip-text text-transparent break-all">
                            {stats.referralCode}
                          </p>
                        </div>
                        <Button
                          onClick={handleCopyCode}
                          className="bg-gradient-to-r from-[#D4AF37] to-[#FFD700] hover:from-[#C5A572] hover:to-[#D4AF37] text-white border-0 shadow-lg px-4 sm:px-6 md:px-8 py-3 sm:py-4 md:py-6 text-sm sm:text-base md:text-lg rounded-xl w-full sm:w-auto transition-all">
                          {copySuccess ? (
                            <>
                              <Check className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                              Tersalin!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                              Salin Kode
                            </>
                          )}
                        </Button>
                      </div>

                      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-3 sm:p-4 border-2 border-amber-200">
                        <p className="text-xs sm:text-sm text-gray-600 mb-2 font-medium">Link Referral</p>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                          <code className="flex-1 text-xs sm:text-sm bg-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-amber-200 text-gray-700 font-mono overflow-x-auto">
                            {referralLink}
                          </code>
                          <Button
                            onClick={handleCopyLink}
                            variant="outline"
                            className="border-amber-300 text-amber-700 hover:bg-amber-100 rounded-lg px-4 sm:px-6 text-sm w-full sm:w-auto">
                            <LinkIcon className="w-4 h-4 mr-2" />
                            Salin Link
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 sm:p-6 md:p-8 bg-gradient-to-br from-gray-50 to-white rounded-b-2xl">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
                      Cara Kerja Program Referral
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="flex items-start gap-3 bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-gray-200">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">
                          1
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 mb-1">Bagikan Kode Referral</p>
                          <p className="text-sm text-gray-600">Bagikan kode atau link referral Anda kepada calon jamaah</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-gray-200">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">
                          2
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 mb-1">Jamaah Mendaftar & Booking</p>
                          <p className="text-sm text-gray-600">Setiap pembelian paket dengan kode Anda tercatat otomatis</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-gray-200">
                        <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">
                          3
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 mb-1">Admin Approve Pembayaran</p>
                          <p className="text-sm text-gray-600">Komisi Rp500.000 otomatis aktif setelah pembayaran disetujui</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-gray-200">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">
                          4
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 mb-1">Cairkan Komisi</p>
                          <p className="text-sm text-gray-600">Ajukan pencairan untuk komisi yang sudah disetujui</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Referral Details Table */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}>
                <Card className="border-0 shadow-xl">
                  <div className="p-6 border-b border-gray-100">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <Users className="w-6 h-6 text-amber-600" />
                      Daftar Referral Anda
                    </h3>
                    <p className="text-gray-600 mt-1">Track semua referral dan komisi Anda</p>
                  </div>
                  <div className="p-6">
                    <ReferralListRealtime userId={userProfile?.uid || ''} userRole={userProfile?.role as any || 'brand_ambassador'} />
                  </div>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Withdrawal Tab */}
            <TabsContent value="withdrawal">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}>
                <Card className="border-0 shadow-xl">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                        <Wallet className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">Pencairan Komisi</h2>
                        <p className="text-green-100">Cairkan komisi yang sudah disetujui</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-8">
                    {/* Balance Summary */}
                    <div className="mb-8">
                      <ReferralBalanceCard userId={userProfile?.uid || ''} userRole={userProfile?.role as any || 'brand_ambassador'} />
                    </div>

                    {/* Withdrawal Form */}
                    <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border-2 border-gray-200 mb-8">
                      <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        Ajukan Pencairan
                      </h3>

                      <Button
                        onClick={() => setShowWithdrawalForm(true)}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg">
                        <Wallet className="w-5 h-5 mr-2" />
                        Ajukan Pencairan Komisi
                      </Button>
                    </div>

                    {/* Withdrawal History */}
                    <div className="bg-white rounded-2xl border-2 border-gray-200">
                      <div className="p-6 border-b border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                          <Clock className="w-5 h-5 text-amber-600" />
                          Riwayat Pengajuan Pencairan
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">Status dan detail pengajuan pencairan komisi Anda</p>
                      </div>

                      <div className="p-6">
                        {withdrawalRequests.length === 0 ? (
                          <div className="text-center py-12">
                            <Wallet className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500 font-medium">Belum ada pengajuan pencairan</p>
                            <p className="text-sm text-gray-400 mt-2">Klik tombol "Ajukan Pencairan Komisi" untuk memulai</p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b-2 border-gray-200">
                                  <th className="text-left py-4 px-4 text-sm font-bold text-gray-700">No</th>
                                  <th className="text-left py-4 px-4 text-sm font-bold text-gray-700">Tanggal Pengajuan</th>
                                  <th className="text-left py-4 px-4 text-sm font-bold text-gray-700">Total Pengajuan</th>
                                  <th className="text-left py-4 px-4 text-sm font-bold text-gray-700">Status</th>
                                  <th className="text-left py-4 px-4 text-sm font-bold text-gray-700">Info Rekening</th>
                                  <th className="text-left py-4 px-4 text-sm font-bold text-gray-700">No. Rekening</th>
                                  <th className="text-left py-4 px-4 text-sm font-bold text-gray-700">Atas Nama</th>
                                </tr>
                              </thead>
                              <tbody>
                                {withdrawalRequests.map((request, index) => (
                                  <tr
                                    key={request.id}
                                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${request.status === 'pending'
                                      ? 'bg-amber-50/30'
                                      : request.status === 'confirmed'
                                        ? 'bg-green-50/30'
                                        : 'bg-red-50/30'
                                      }`}>
                                    <td className="py-4 px-4 text-sm font-medium text-gray-900">
                                      {index + 1}
                                    </td>
                                    <td className="py-4 px-4 text-sm text-gray-700">
                                      {request.requestDate.toLocaleDateString('id-ID', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                      })}
                                    </td>
                                    <td className="py-4 px-4 text-sm font-bold text-gray-900">
                                      Rp {request.amount.toLocaleString('id-ID')}
                                    </td>
                                    <td className="py-4 px-4">
                                      <Badge
                                        className={
                                          request.status === 'pending'
                                            ? 'bg-amber-500 text-white'
                                            : request.status === 'confirmed'
                                              ? 'bg-green-500 text-white'
                                              : 'bg-red-500 text-white'
                                        }>
                                        {request.status === 'pending'
                                          ? 'Pending'
                                          : request.status === 'confirmed'
                                            ? 'Confirmed'
                                            : 'Rejected'}
                                      </Badge>
                                    </td>
                                    <td className="py-4 px-4 text-sm text-gray-700">
                                      {request.paymentMethod === 'bank' ? (
                                        <span className="font-semibold uppercase">{request.bankName || '-'}</span>
                                      ) : request.paymentMethod === 'ewallet' ? (
                                        <span className="font-semibold">{request.ewalletProvider || '-'}</span>
                                      ) : (
                                        <span className="font-semibold uppercase">{request.bankName || '-'}</span>
                                      )}
                                    </td>
                                    <td className="py-4 px-4 text-sm font-mono text-gray-900">
                                      {request.paymentMethod === 'ewallet'
                                        ? (request.ewalletNumber || '-')
                                        : (request.accountNumber || '-')}
                                    </td>
                                    <td className="py-4 px-4 text-sm text-gray-700">
                                      {request.paymentMethod === 'ewallet'
                                        ? (request.ewalletAccountName || '-')
                                        : (request.accountName || '-')}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Withdrawal Form Modal */}
        <CommissionWithdrawalForm
          open={showWithdrawalForm}
          onClose={() => setShowWithdrawalForm(false)}
          maxAmount={stats.approvedCommission}
          userType={userProfile?.role as any || 'brand_ambassador'}
          onSubmit={async (data: WithdrawalFormData) => {
            console.log('Withdrawal request:', data);
            toast.success('Permintaan pencairan berhasil diajukan!');
            setShowWithdrawalForm(false);
            // Reload withdrawal requests
            loadWithdrawalRequests();
          }}
        />

        {/* Logout Confirmation */}
        <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Konfirmasi Logout</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin keluar dari dashboard?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout} className="bg-red-500 hover:bg-red-600">
                Ya, Logout
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default AgentDashboardNew;
