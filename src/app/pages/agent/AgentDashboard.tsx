
import React, { useState, useEffect, useRef } from 'react'; // ✅ ADD: Import useRef

import { useNavigate } from 'react-router-dom'; // ✅ Import useNavigate
import { useAuth } from '../../../contexts/AuthContext';
import { db } from '../../../config/firebase';
import {
  collection,
  query,
  where,
  doc,
  getDoc,
  addDoc,
  Timestamp,
  onSnapshot // ✅ ADD: Import onSnapshot for real-time updates
} from 'firebase/firestore';
import { toast } from 'sonner';
import {
  Users,
  DollarSign,
  TrendingUp,
  Copy,
  Check,
  Wallet,
  User,
  LogOut,
  Link as LinkIcon,
  Share2
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../components/ui/alert-dialog';
import CommissionWithdrawalForm, { WithdrawalFormData } from '../../components/CommissionWithdrawalForm'; // ✅ FIX: Correct import path
import { copyToClipboard } from '../../../utils/clipboard'; // ✅ Import safe clipboard utility
import { autoCreateReferralCode } from '../../../utils/autoCreateReferralCode'; // ✅ NEW: Import centralized auto-create


// ✅ LOGO: Mosque dome with gold
const logoSultanah = '/images/logo.png';
import ReferralListRealtime from '../../components/ReferralListRealtime'; // ✅ NEW: Real-time referral list
import ReferralBalanceCard from '../../components/ReferralBalanceCard'; // ✅ NEW: Real-time balance card


interface ReferralStats {
  referralCode: string;
  totalReferrals: number;
  totalCommission: number;
  pendingCommission: number;
  approvedCommission: number;
  withdrawnCommission: number; // ✅ Total yang sudah dicairkan
  conversions: number;
}

interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'rejected'; // ✅ Changed 'approved' to 'confirmed'
  requestDate: Date;
  processedDate?: Date;
  note?: string;
  // Bank transfer fields
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  // E-wallet fields
  ewalletProvider?: string;
  ewalletNumber?: string;
  ewalletAccountName?: string;
  paymentMethod?: 'bank' | 'ewallet';
  transferProofUrl?: string;
}

const AgentDashboard: React.FC = () => {
  const { currentUser, userProfile, signOut } = useAuth();
  const navigate = useNavigate(); // ✅ Use useNavigate hook
  const [stats, setStats] = useState<ReferralStats>({
    referralCode: '',
    totalReferrals: 0,
    totalCommission: 0,
    pendingCommission: 0,
    approvedCommission: 0,
    withdrawnCommission: 0, // ✅ Total yang sudah dicairkan
    conversions: 0,
  });
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showAlert, setShowAlert] = useState(false); // ✅ FIX: Add missing showAlert state
  const isInitialLoad = useRef(true); // ✅ Track first load to prevent false notification
  const previousReferrals = useRef(0); // ✅ Track previous referrals count

  useEffect(() => {
    if (currentUser) {
      loadReferralData();
      // ✅ Removed loadWithdrawals() - using real-time listener instead
    }
  }, [currentUser]);

  // ✅ NEW: Add real-time listener for referral data
  useEffect(() => {
    if (!currentUser) return;

    const referralDocRef = doc(db, 'alumniReferrals', currentUser.uid);

    // Setup real-time listener
    const unsubscribe = onSnapshot(referralDocRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          const newStats = {
            referralCode: data.referralCode || '',
            totalReferrals: data.totalReferrals || 0,
            totalCommission: data.totalCommission || 0,
            pendingCommission: data.pendingCommission || 0,
            approvedCommission: data.approvedCommission || 0,
            withdrawnCommission: data.withdrawnCommission || 0, // ✅ Total yang sudah dicairkan
            conversions: data.conversions || 0,
          };

          setStats(newStats);

          // ✅ Show notification when totalReferrals increases (but not on initial load)
          if (!isInitialLoad.current && data.totalReferrals > previousReferrals.current) {
            toast.success('🎉 Kode referral Anda baru saja digunakan!', {
              description: `Total referral: ${data.totalReferrals} `,
              duration: 5000,
            });
          }

          // ✅ Update previous count
          previousReferrals.current = data.totalReferrals || 0;

          // ✅ Mark initial load as complete
          if (isInitialLoad.current) {
            isInitialLoad.current = false;
          }

          setLoading(false);
        } else {
          // If document doesn't exist, create it
          loadReferralData();
        }
      },
      (error) => {
        console.error('Error listening to referral data:', error);
        setLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [currentUser]); // ✅ Remove stats dependency to avoid infinite loop

  // ✅ NEW: Add real-time listener for balance data (approvedCommission & withdrawnCommission)
  useEffect(() => {
    if (!currentUser) return;

    const balanceDocRef = doc(db, 'referralBalances', currentUser.uid);

    // Setup real-time listener for balance
    const unsubscribe = onSnapshot(
      balanceDocRef,
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
      (_) => {
        // ✅ SILENT FAIL: Permission denied is expected if doc doesn't exist yet
        setStats(prevStats => ({
          ...prevStats,
          approvedCommission: 0,
          withdrawnCommission: 0,
        }));
      }
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [currentUser]);

  // ✅ NEW: Add real-time listener for withdrawal data
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'commissionWithdrawals'),
      where('userId', '==', currentUser.uid)
    );

    // Setup real-time listener for withdrawals
    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        let withdrawalList: WithdrawalRequest[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          requestDate: doc.data().requestDate?.toDate() || new Date(),
          processedDate: doc.data().processedDate?.toDate(),
        } as WithdrawalRequest));

        // Sort client-side by requestDate desc (newest first)
        withdrawalList.sort((a, b) => b.requestDate.getTime() - a.requestDate.getTime());

        setWithdrawals(withdrawalList);
      },
      (error) => {
        console.error('Error listening to withdrawals:', error);
      }
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [currentUser]);

  const loadReferralData = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);

      // ✅ FIXED: Use centralized auto-create system
      console.log('🔧 [AGENT REFERRAL] Initializing referral system...');

      // Auto-create referral code if not exists (uses autoCreateReferralCode.ts)
      await autoCreateReferralCode(
        currentUser.uid,
        'agen',
        userProfile?.displayName || 'AGENT',
        currentUser.email || ''
      );

      // Get or create referral record
      const referralDocRef = doc(db, 'alumniReferrals', currentUser.uid);
      let referralDoc = await getDoc(referralDocRef);

      if (referralDoc.exists()) {
        const data = referralDoc.data();
        console.log('✅ [AGENT REFERRAL] Referral loaded:', data.referralCode);

        setStats({
          referralCode: data.referralCode || '',
          totalReferrals: data.totalReferrals || 0,
          totalCommission: data.totalCommission || 0,
          pendingCommission: data.pendingCommission || 0,
          approvedCommission: data.approvedCommission || 0,
          withdrawnCommission: data.withdrawnCommission || 0, // ✅ Total yang sudah dicairkan
          conversions: data.conversions || 0,
        });
      } else {
        console.error('❌ [AGENT REFERRAL] Failed to create referral code');
        toast.error('Gagal membuat kode referral. Silakan refresh halaman.');
      }
    } catch (error) {
      console.error('Error loading referral data:', error);
      toast.error('Gagal memuat data referral');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyReferralLink = async () => {
    const link = `${window.location.origin}?ref = ${stats.referralCode} `;
    const success = await copyToClipboard(link);
    if (success) {
      setCopied(true);
      toast.success('Link referral berhasil disalin!');
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('Gagal menyalin link');
    }
  };

  const handleCopyCode = async () => {
    const success = await copyToClipboard(stats.referralCode);
    if (success) {
      toast.success('Kode referral berhasil disalin!');
    } else {
      toast.error('Gagal menyalin kode');
    }
  };

  const handleRequestWithdrawal = async (formData: WithdrawalFormData) => {
    if (!currentUser) return;

    try {
      await addDoc(collection(db, 'commissionWithdrawals'), {
        userId: currentUser.uid,
        userName: userProfile?.displayName || currentUser.email,
        userEmail: currentUser.email,
        userType: 'agen',
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

      toast.success('Permintaan pencairan komisi berhasil diajukan!');
      setShowWithdrawalForm(false); // ✅ Close the form
      // ✅ Removed loadWithdrawals() - real-time listener will auto-update
    } catch (error) {
      console.error('Error requesting withdrawal:', error);
      toast.error('Gagal mengajukan pencairan komisi');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Gagal logout');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-amber-50 relative overflow-hidden">
      {/* ✨ PREMIUM BACKGROUND PATTERN - Islamic Geometric */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}></div>
      </div>

      {/* ✨ GRADIENT OVERLAY */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#C5A572]/5 via-transparent to-[#D4AF37]/5 pointer-events-none"></div>

      {/* ✨ PREMIUM HEADER with Logo */}
      <div className="relative bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-white shadow-2xl">
        {/* Header Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 0L93.3 25v50L50 100 6.7 75V25z' fill='%23ffffff' fill-opacity='0.3'/%3E%3C/svg%3E")`,
            backgroundSize: '100px 100px'
          }}></div>
        </div>

        <div className="container mx-auto px-4 py-6 relative z-10">
          <div className="flex items-center justify-between">
            {/* Left: Logo + Title */}
            <div className="flex items-center gap-6">
              {/* ✨ LOGO SULTANAH - Real Image */}
              <img
                src={logoSultanah}
                alt="Sultanah Logo"
                className="h-16 w-auto drop-shadow-lg"
              />

              {/* Title */}
              <div>
                <h1 className="text-3xl font-bold mb-1 drop-shadow-lg">Dashboard Agen</h1>
                <p className="text-amber-100 text-sm">Selamat datang, {userProfile?.displayName || currentUser?.email}</p>
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={() => navigate('/agent/profile')}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
              >
                <User className="w-4 h-4 mr-2" />
                Profil
              </Button>
              <Button
                onClick={() => setShowLogoutDialog(true)}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">{/* Stats Cards - PREMIUM GLASSMORPHISM */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-t-4 border-t-blue-500 bg-white/80 backdrop-blur-md shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Referral</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-slate-900">{stats.totalReferrals}</div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-green-500 bg-white/80 backdrop-blur-md shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Saldo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-green-600">
                  Rp {stats.approvedCommission.toLocaleString('id-ID')}
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-amber-500 bg-white/80 backdrop-blur-md shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Komisi Disetujui</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-amber-600">
                  Rp {stats.withdrawnCommission.toLocaleString('id-ID')}
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-purple-500 bg-white/80 backdrop-blur-md shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Konversi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-slate-900">{stats.conversions}</div>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="referral" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="referral">Program Referral</TabsTrigger>
            <TabsTrigger value="withdrawal">Pencairan Komisi</TabsTrigger>
          </TabsList>

          {/* Referral Tab */}
          <TabsContent value="referral">
            {/* Referral Code Card */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Kode Referral Anda</CardTitle>
                <CardDescription>
                  Bagikan kode referral Anda untuk mendapatkan komisi Rp500.000 per referral sukses
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Referral Code Display */}
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Kode Referral Anda</p>
                      <p className="text-3xl font-bold text-amber-600">{stats.referralCode}</p>
                    </div>
                    <Button
                      onClick={handleCopyCode}
                      variant="outline"
                      size="sm"
                      className="border-amber-300 text-amber-700 hover:bg-amber-100"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Salin Kode
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex-1 bg-white p-3 rounded-lg border border-amber-200 text-sm truncate">
                      {window.location.origin}?ref={stats.referralCode}
                    </div>
                    <Button
                      onClick={handleCopyReferralLink}
                      className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Tersalin
                        </>
                      ) : (
                        <>
                          <LinkIcon className="w-4 h-4 mr-2" />
                          Salin Link
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Share2 className="w-4 h-4" />
                    <span>Bagikan link referral Anda di media sosial untuk jangkauan lebih luas</span>
                  </div>
                </div>

                {/* Referral Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Cara Kerja Program Referral</h3>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 mt-0.5 text-blue-600" />
                      <span>Bagikan kode atau link referral Anda kepada calon jamaah</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 mt-0.5 text-blue-600" />
                      <span>Setiap pembelian paket menggunakan kode Anda akan tercatat otomatis</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 mt-0.5 text-blue-600" />
                      <span>Komisi Rp500.000 diberikan setelah pembayaran disetujui admin</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 mt-0.5 text-blue-600" />
                      <span>Anda dapat mengajukan pencairan komisi yang sudah disetujui</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* ✅ NEW: Real-time Balance Card */}
            {currentUser && (
              <div className="mb-6">
                <ReferralBalanceCard
                  userId={currentUser.uid}
                  userRole="agen"
                />
              </div>
            )}

            {/* ✅ NEW: Real-time Referral List */}
            {currentUser && (
              <ReferralListRealtime
                userId={currentUser.uid}
                userRole="agen"
              />
            )}
          </TabsContent>

          {/* Withdrawal Tab */}
          <TabsContent value="withdrawal">
            <div className="grid gap-6">
              {/* Request Withdrawal Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Ajukan Pencairan Komisi</CardTitle>
                  <CardDescription>
                    Komisi tersedia: <span className="text-green-600 font-semibold">
                      Rp {stats.approvedCommission.toLocaleString('id-ID')}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => setShowWithdrawalForm(true)}
                    disabled={stats.approvedCommission <= 0}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    Ajukan Pencairan Komisi
                  </Button>
                  {stats.approvedCommission <= 0 && (
                    <p className="text-sm text-slate-500 mt-2 text-center">
                      Belum ada komisi yang dapat dicairkan
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Withdrawal History */}
              <Card>
                <CardHeader>
                  <CardTitle>Riwayat Pencairan</CardTitle>
                  <CardDescription>Daftar permintaan pencairan komisi Anda</CardDescription>
                </CardHeader>
                <CardContent>
                  {withdrawals.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Belum ada riwayat pencairan</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {withdrawals.map((withdrawal) => (
                        <div
                          key={withdrawal.id}
                          className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-semibold text-lg">
                              Rp {withdrawal.amount.toLocaleString('id-ID')}
                            </div>
                            <Badge
                              className={
                                withdrawal.status === 'confirmed'
                                  ? 'bg-green-100 text-green-700'
                                  : withdrawal.status === 'rejected'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-amber-100 text-amber-700'
                              }
                            >
                              {withdrawal.status === 'confirmed'
                                ? 'Disetujui'
                                : withdrawal.status === 'rejected'
                                  ? 'Ditolak'
                                  : 'Pending'}
                            </Badge>
                          </div>
                          <div className="text-sm text-slate-600">
                            <p>Tanggal pengajuan: {withdrawal.requestDate.toLocaleDateString('id-ID')}</p>
                            {withdrawal.processedDate && (
                              <p>Tanggal diproses: {withdrawal.processedDate.toLocaleDateString('id-ID')}</p>
                            )}
                            {withdrawal.note && (
                              <p className="mt-2 text-slate-700">Catatan: {withdrawal.note}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Commission Withdrawal Dialog */}
      <CommissionWithdrawalForm
        open={showWithdrawalForm}
        onClose={() => setShowWithdrawalForm(false)}
        onSubmit={handleRequestWithdrawal}
        maxAmount={stats.approvedCommission}
        userType="agen"
      />

      {/* Alert Dialog */}
      <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Peringatan</AlertDialogTitle>
            <AlertDialogDescription>
              Anda belum memiliki komisi yang dapat dicairkan. Pastikan Anda memiliki komisi yang disetujui sebelum mengajukan pencairan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowAlert(false)}>
              Tutup
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Logout Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin logout dari akun Anda?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowLogoutDialog(false)}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AgentDashboard;