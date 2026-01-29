import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  Search,
  Download,
  Gift,
  Wallet,
  Eye,
  X,
  Calendar,
  Award,
  Filter,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { db } from '../../../config/firebase';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { toast } from 'sonner';

interface ReferralData {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  code: string;
  totalReferrals: number;
  successfulReferrals: number;
  commissionPercentage: number;
  commissionPerReferral: number;
  totalCommissionEarned: number;
  pendingCommission: number;
  paidCommission: number;
  createdAt: any;
}

interface ReferralStats {
  totalAlumni: number;
  totalReferrals: number;
  successfulReferrals: number;
  totalCommissionEarned: number;
  pendingCommission: number;
  paidCommission: number;
}

interface ReferralDetail {
  referralId: string;
  referredUserId: string;
  referredUserName: string;
  referredUserEmail: string;
  packageName?: string;
  packagePrice?: number;
  status: 'pending' | 'successful' | 'cancelled';
  commissionAmount: number;
  commissionPaid: boolean;
  createdAt: any;
}

const AdminReferralManagement: React.FC = () => {
  const [referrals, setReferrals] = useState<ReferralData[]>([]);
  const [filteredReferrals, setFilteredReferrals] = useState<ReferralData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'has-pending' | 'all-paid'>('all');
  
  // Stats
  const [stats, setStats] = useState<ReferralStats>({
    totalAlumni: 0,
    totalReferrals: 0,
    successfulReferrals: 0,
    totalCommissionEarned: 0,
    pendingCommission: 0,
    paidCommission: 0,
  });

  // Detail Modal
  const [selectedReferral, setSelectedReferral] = useState<ReferralData | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [referralDetails, setReferralDetails] = useState<ReferralDetail[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchAllReferrals();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, filterStatus, referrals]);

  const fetchAllReferrals = async () => {
    try {
      setLoading(true);
      
      // Fetch all alumni referrals
      const referralsRef = collection(db, 'alumniReferrals');
      const referralsSnap = await getDocs(referralsRef);
      
      const referralsData: ReferralData[] = [];
      
      for (const docSnap of referralsSnap.docs) {
        const data = docSnap.data();
        
        // Fetch user info - alumniId is the document ID
        const alumniId = data.alumniId || docSnap.id;
        const userRef = doc(db, 'users', alumniId);
        const userSnap = await (async () => {
          try {
            const snap = await import('firebase/firestore').then(mod => mod.getDoc(userRef));
            return snap;
          } catch {
            return null;
          }
        })();
        
        const userData = userSnap?.data();
        
        referralsData.push({
          id: docSnap.id,
          userId: alumniId,
          userName: userData?.fullName || userData?.name || 'Unknown',
          userEmail: userData?.email || '',
          code: data.code || '',
          totalReferrals: data.totalClicks || 0,
          successfulReferrals: data.successfulConversions || 0,
          commissionPercentage: data.commissionPercentage || 5,
          commissionPerReferral: data.commissionPerReferral || 200000, // ✅ FIXED: Rp200.000 for Alumni Jamaah Umroh
          totalCommissionEarned: data.totalCommissionEarned || 0,
          pendingCommission: data.pendingCommission || 0,
          paidCommission: data.paidCommission || 0,
          createdAt: data.createdAt,
        });
      }
      
      // Sort by total commission earned (descending)
      referralsData.sort((a, b) => b.totalCommissionEarned - a.totalCommissionEarned);
      
      setReferrals(referralsData);
      calculateStats(referralsData);
      
    } catch (error) {
      console.error('Error fetching referrals:', error);
      toast.error('Gagal memuat data referral');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: ReferralData[]) => {
    const stats: ReferralStats = {
      totalAlumni: data.length,
      totalReferrals: data.reduce((sum, r) => sum + r.totalReferrals, 0),
      successfulReferrals: data.reduce((sum, r) => sum + r.successfulReferrals, 0),
      totalCommissionEarned: data.reduce((sum, r) => sum + r.totalCommissionEarned, 0),
      pendingCommission: data.reduce((sum, r) => sum + r.pendingCommission, 0),
      paidCommission: data.reduce((sum, r) => sum + r.paidCommission, 0),
    };
    
    setStats(stats);
  };

  const applyFilters = () => {
    let filtered = [...referrals];
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.userName.toLowerCase().includes(query) ||
        r.userEmail.toLowerCase().includes(query) ||
        r.code.toLowerCase().includes(query)
      );
    }
    
    // Status filter
    if (filterStatus === 'has-pending') {
      filtered = filtered.filter(r => r.pendingCommission > 0);
    } else if (filterStatus === 'all-paid') {
      filtered = filtered.filter(r => r.pendingCommission === 0 && r.paidCommission > 0);
    }
    
    setFilteredReferrals(filtered);
  };

  const handleViewDetails = async (referral: ReferralData) => {
    setSelectedReferral(referral);
    setShowDetailModal(true);
    setLoadingDetails(true);
    
    try {
      // In real implementation, fetch actual referral records from a 'referralTransactions' collection
      // For now, we'll show mock data based on successful referrals
      const mockDetails: ReferralDetail[] = [];
      
      for (let i = 0; i < referral.successfulReferrals; i++) {
        mockDetails.push({
          referralId: `REF-${referral.code}-${i + 1}`,
          referredUserId: `user-${i + 1}`,
          referredUserName: `Jamaah ${i + 1}`,
          referredUserEmail: `jamaah${i + 1}@example.com`,
          packageName: `Paket Umrah ${['Reguler', 'Plus', 'VIP'][Math.floor(Math.random() * 3)]}`,
          packagePrice: [15000000, 20000000, 25000000][Math.floor(Math.random() * 3)],
          status: 'successful',
          commissionAmount: referral.commissionPerReferral,
          commissionPaid: Math.random() > 0.5,
          createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
        });
      }
      
      setReferralDetails(mockDetails);
    } catch (error) {
      console.error('Error fetching referral details:', error);
      toast.error('Gagal memuat detail referral');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handlePayCommission = async (referral: ReferralData) => {
    if (referral.pendingCommission === 0) {
      toast.info('Tidak ada komisi yang perlu dibayar');
      return;
    }

    try {
      const referralRef = doc(db, 'alumniReferrals', referral.id);
      
      await updateDoc(referralRef, {
        paidCommission: referral.paidCommission + referral.pendingCommission,
        pendingCommission: 0,
      });
      
      toast.success(`Komisi sebesar Rp ${referral.pendingCommission.toLocaleString('id-ID')} telah dibayar!`);
      
      // Refresh data
      fetchAllReferrals();
      
      if (showDetailModal && selectedReferral?.id === referral.id) {
        setShowDetailModal(false);
      }
      
    } catch (error) {
      console.error('Error paying commission:', error);
      toast.error('Gagal membayar komisi');
    }
  };

  const exportToCSV = () => {
    const headers = ['Nama Alumni', 'Email', 'Kode Referral', 'Total Referrals', 'Successful', 'Total Komisi', 'Pending', 'Paid'];
    const rows = filteredReferrals.map(r => [
      r.userName,
      r.userEmail,
      r.code,
      r.totalReferrals,
      r.successfulReferrals,
      r.totalCommissionEarned,
      r.pendingCommission,
      r.paidCommission,
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `referral-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    toast.success('Data berhasil diekspor!');
  };

  const formatDate = (date: any): string => {
    if (!date) return '-';
    if (date.toDate && typeof date.toDate === 'function') {
      return date.toDate().toLocaleDateString('id-ID');
    }
    if (date instanceof Date) {
      return date.toLocaleDateString('id-ID');
    }
    return new Date(date).toLocaleDateString('id-ID');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Referral Management
              </h1>
              <p className="text-gray-600 mt-1">
                Monitor dan kelola program referral alumni jamaah umroh
              </p>
            </div>
            <Button
              onClick={exportToCSV}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:opacity-90 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Total Alumni with Referrals */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700 mb-1">Total Alumni Aktif</p>
                    <p className="text-4xl font-bold text-blue-900">{stats.totalAlumni}</p>
                    <p className="text-xs text-blue-600 mt-1">Memiliki kode referral</p>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Total Referrals */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-700 mb-1">Total Referrals</p>
                    <p className="text-4xl font-bold text-purple-900">{stats.totalReferrals}</p>
                    <p className="text-xs text-purple-600 mt-1">
                      <span className="font-semibold">{stats.successfulReferrals}</span> sukses
                    </p>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-purple-500 flex items-center justify-center">
                    <Gift className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Total Commission Earned */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700 mb-1">Total Komisi</p>
                    <p className="text-3xl font-bold text-green-900">
                      Rp {stats.totalCommissionEarned.toLocaleString('id-ID')}
                    </p>
                    <p className="text-xs text-green-600 mt-1">Terkumpul</p>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center">
                    <DollarSign className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Pending Commission */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-gradient-to-br from-amber-50 to-yellow-100 border-2 border-amber-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-amber-700 mb-1">Komisi Tertunda</p>
                    <p className="text-3xl font-bold text-amber-900">
                      Rp {stats.pendingCommission.toLocaleString('id-ID')}
                    </p>
                    <p className="text-xs text-amber-600 mt-1">Menunggu pembayaran</p>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-amber-500 flex items-center justify-center">
                    <Clock className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Paid Commission */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="bg-gradient-to-br from-cyan-50 to-blue-100 border-2 border-cyan-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-cyan-700 mb-1">Komisi Dibayar</p>
                    <p className="text-3xl font-bold text-cyan-900">
                      Rp {stats.paidCommission.toLocaleString('id-ID')}
                    </p>
                    <p className="text-xs text-cyan-600 mt-1">Sudah ditransfer</p>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-cyan-500 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Success Rate */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="bg-gradient-to-br from-[#D4AF37]/10 to-[#FFD700]/20 border-2 border-[#D4AF37]/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#D4AF37] mb-1">Success Rate</p>
                    <p className="text-4xl font-bold text-gray-900">
                      {stats.totalReferrals > 0 
                        ? Math.round((stats.successfulReferrals / stats.totalReferrals) * 100)
                        : 0}%
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Conversion rate</p>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#FFD700] flex items-center justify-center">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Filters & Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <Label className="mb-2 block">Cari Alumni</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari berdasarkan nama, email, atau kode referral..."
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Filter Status */}
              <div>
                <Label className="mb-2 block">Filter Status</Label>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setFilterStatus('all')}
                    variant={filterStatus === 'all' ? 'default' : 'outline'}
                    className={filterStatus === 'all' ? 'bg-[#D4AF37] hover:bg-[#C5A572]' : ''}
                    size="sm"
                  >
                    Semua
                  </Button>
                  <Button
                    onClick={() => setFilterStatus('has-pending')}
                    variant={filterStatus === 'has-pending' ? 'default' : 'outline'}
                    className={filterStatus === 'has-pending' ? 'bg-amber-500 hover:bg-amber-600' : ''}
                    size="sm"
                  >
                    Ada Pending
                  </Button>
                  <Button
                    onClick={() => setFilterStatus('all-paid')}
                    variant={filterStatus === 'all-paid' ? 'default' : 'outline'}
                    className={filterStatus === 'all-paid' ? 'bg-green-500 hover:bg-green-600' : ''}
                    size="sm"
                  >
                    Lunas
                  </Button>
                </div>
              </div>
            </div>

            {/* Active Filters Display */}
            {(searchQuery || filterStatus !== 'all') && (
              <div className="mt-4 flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-600">Filter aktif:</span>
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm">
                    Pencarian: "{searchQuery}"
                    <button onClick={() => setSearchQuery('')} className="hover:text-blue-900">
                      <XCircle className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filterStatus !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm">
                    Status: {filterStatus === 'has-pending' ? 'Ada Pending' : 'Lunas'}
                    <button onClick={() => setFilterStatus('all')} className="hover:text-purple-900">
                      <XCircle className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Referrals Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-[#D4AF37]" />
              Daftar Alumni & Komisi ({filteredReferrals.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-gray-600">Memuat data referral...</p>
              </div>
            ) : filteredReferrals.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Alumni</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Kode Referral</th>
                      <th className="text-center py-4 px-4 font-semibold text-gray-700">Total</th>
                      <th className="text-center py-4 px-4 font-semibold text-gray-700">Sukses</th>
                      <th className="text-right py-4 px-4 font-semibold text-gray-700">Total Komisi</th>
                      <th className="text-right py-4 px-4 font-semibold text-gray-700">Pending</th>
                      <th className="text-right py-4 px-4 font-semibold text-gray-700">Paid</th>
                      <th className="text-center py-4 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReferrals.map((referral, index) => (
                      <motion.tr
                        key={referral.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-semibold text-gray-900">{referral.userName}</p>
                            <p className="text-sm text-gray-500">{referral.userEmail}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-block px-3 py-1 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] font-mono text-sm font-semibold">
                            {referral.code}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold">
                            {referral.totalReferrals}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-700 font-bold">
                            {referral.successfulReferrals}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <p className="font-bold text-gray-900">
                            Rp {referral.totalCommissionEarned.toLocaleString('id-ID')}
                          </p>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <p className={`font-semibold ${referral.pendingCommission > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                            Rp {referral.pendingCommission.toLocaleString('id-ID')}
                          </p>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <p className="font-semibold text-green-600">
                            Rp {referral.paidCommission.toLocaleString('id-ID')}
                          </p>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              onClick={() => handleViewDetails(referral)}
                              size="sm"
                              variant="outline"
                              className="hover:bg-blue-50"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {referral.pendingCommission > 0 && (
                              <Button
                                onClick={() => handlePayCommission(referral)}
                                size="sm"
                                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90 text-white"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Bayar
                              </Button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  {searchQuery || filterStatus !== 'all' 
                    ? 'Tidak ada hasil'
                    : 'Belum ada data referral'}
                </h3>
                <p className="text-gray-500">
                  {searchQuery || filterStatus !== 'all'
                    ? 'Coba ubah filter atau kata kunci pencarian'
                    : 'Data referral alumni akan muncul di sini'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedReferral && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#D4AF37] to-[#FFD700] p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center">
                    <Award className="w-7 h-7 text-[#D4AF37]" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedReferral.userName}</h2>
                    <p className="text-white/80">{selectedReferral.userEmail}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-blue-700 mb-1">Total Referrals</p>
                    <p className="text-3xl font-bold text-blue-900">{selectedReferral.totalReferrals}</p>
                  </CardContent>
                </Card>
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-green-700 mb-1">Successful</p>
                    <p className="text-3xl font-bold text-green-900">{selectedReferral.successfulReferrals}</p>
                  </CardContent>
                </Card>
                <Card className="bg-amber-50 border-amber-200">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-amber-700 mb-1">Pending</p>
                    <p className="text-xl font-bold text-amber-900">
                      Rp {(selectedReferral.pendingCommission / 1000).toFixed(0)}k
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-cyan-50 border-cyan-200">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-cyan-700 mb-1">Paid</p>
                    <p className="text-xl font-bold text-cyan-900">
                      Rp {(selectedReferral.paidCommission / 1000).toFixed(0)}k
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Commission Info */}
              <Card className="mb-6 bg-gradient-to-br from-[#D4AF37]/5 to-[#FFD700]/10 border-[#D4AF37]/30">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Kode Referral</p>
                      <p className="text-2xl font-bold text-[#D4AF37] font-mono">{selectedReferral.code}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Komisi Per Referral</p>
                      <p className="text-2xl font-bold text-gray-900">
                        Rp {selectedReferral.commissionPerReferral.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Persentase Komisi</p>
                      <p className="text-2xl font-bold text-purple-600">{selectedReferral.commissionPercentage}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Komisi Earned</p>
                      <p className="text-2xl font-bold text-green-600">
                        Rp {selectedReferral.totalCommissionEarned.toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Referral Details Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Detail Referral Sukses ({referralDetails.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingDetails ? (
                    <div className="text-center py-8">
                      <div className="inline-block w-6 h-6 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : referralDetails.length > 0 ? (
                    <div className="space-y-3">
                      {referralDetails.map((detail, index) => (
                        <div
                          key={index}
                          className="p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">{detail.referredUserName}</p>
                              <p className="text-sm text-gray-500">{detail.referredUserEmail}</p>
                              {detail.packageName && (
                                <p className="text-sm text-blue-600 mt-1">
                                  📦 {detail.packageName} - Rp {detail.packagePrice?.toLocaleString('id-ID')}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-green-600">
                                Rp {detail.commissionAmount.toLocaleString('id-ID')}
                              </p>
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                                detail.commissionPaid 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-amber-100 text-amber-700'
                              }`}>
                                {detail.commissionPaid ? '✓ Paid' : '⏳ Pending'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Belum ada detail referral
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              {selectedReferral.pendingCommission > 0 && (
                <div className="mt-6 flex justify-end gap-3">
                  <Button
                    onClick={() => setShowDetailModal(false)}
                    variant="outline"
                  >
                    Tutup
                  </Button>
                  <Button
                    onClick={() => handlePayCommission(selectedReferral)}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90 text-white"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Bayar Komisi (Rp {selectedReferral.pendingCommission.toLocaleString('id-ID')})
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminReferralManagement;