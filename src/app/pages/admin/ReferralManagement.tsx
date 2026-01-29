import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { toast } from 'sonner';
import { Users, TrendingUp, DollarSign, Copy, Download, Filter, Search } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { copyToClipboard } from '../../../utils/clipboard'; // ✅ Import safe clipboard utility

interface ReferralData {
  id: string;
  userId: string;
  code: string;
  totalReferrals: number;
  successfulReferrals: number;
  totalCommission: number;
  createdAt: any;
  userName?: string;
  userEmail?: string;
}

interface ReferralDetail {
  id: string;
  referralCode: string;
  referredUserId: string;
  referredUserName: string;
  referredUserEmail: string;
  status: 'pending' | 'successful' | 'failed';
  packageName?: string;
  commissionAmount: number;
  createdAt: any;
}

const ReferralManagement: React.FC = () => {
  const [referrals, setReferrals] = useState<ReferralData[]>([]);
  const [filteredReferrals, setFilteredReferrals] = useState<ReferralData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState<ReferralData | null>(null);
  const [referralDetails, setReferralDetails] = useState<ReferralDetail[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  // Stats
  const totalReferrals = referrals.reduce((acc, r) => acc + r.totalReferrals, 0);
  const totalSuccessful = referrals.reduce((acc, r) => acc + r.successfulReferrals, 0);
  const totalCommission = referrals.reduce((acc, r) => acc + (r.totalCommission || 0), 0);

  useEffect(() => {
    fetchReferrals();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredReferrals(referrals);
    } else {
      const filtered = referrals.filter(r => {
        const searchLower = searchQuery.toLowerCase();
        return (
          r.code.toLowerCase().includes(searchLower) ||
          r.userName?.toLowerCase().includes(searchLower) ||
          r.userEmail?.toLowerCase().includes(searchLower)
        );
      });
      setFilteredReferrals(filtered);
    }
  }, [searchQuery, referrals]);

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      const referralsRef = collection(db, 'alumniReferrals');
      const q = query(referralsRef, orderBy('createdAt', 'desc'));
      
      const querySnapshot = await getDocs(q);
      const referralData: ReferralData[] = [];
      
      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data();
        
        // Fetch user info
        let userName = 'Unknown';
        let userEmail = 'Unknown';
        
        if (data.userId) {
          try {
            const userRef = doc(db, 'users', data.userId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              const userData = userSnap.data();
              userName = userData.fullName || userData.name || userData.displayName || 'Unknown';
              userEmail = userData.email || 'Unknown';
            }
          } catch (err) {
            console.error('Error fetching user:', err);
          }
        }
        
        referralData.push({
          id: docSnap.id,
          userId: data.userId || '',
          code: data.code || '',
          totalReferrals: data.totalReferrals || 0,
          successfulReferrals: data.successfulReferrals || 0,
          totalCommission: data.totalCommission || 0,
          createdAt: data.createdAt,
          userName,
          userEmail,
        });
      }
      
      setReferrals(referralData);
      setFilteredReferrals(referralData);
    } catch (error) {
      console.error('Error fetching referrals:', error);
      toast.error('Gagal memuat data referral');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (referral: ReferralData) => {
    setSelectedReferral(referral);
    setShowDetails(true);
    
    // In real implementation, fetch referral details from a separate collection
    // For now, we'll show empty state
    setReferralDetails([]);
  };

  const handleCopyCode = (code: string) => {
    copyToClipboard(code);
    toast.success('Kode referral berhasil disalin!');
  };

  const exportToCSV = () => {
    const headers = ['Kode Referral', 'Nama Alumni', 'Email', 'Total Referrals', 'Successful', 'Komisi Total'];
    const rows = filteredReferrals.map(r => [
      r.code,
      r.userName || '',
      r.userEmail || '',
      r.totalReferrals,
      r.successfulReferrals,
      `Rp ${(r.totalCommission || 0).toLocaleString('id-ID')}`,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `referral-data-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast.success('Data referral berhasil diekspor!');
  };

  const formatDate = (dateField: any): string => {
    if (!dateField) return new Date().toLocaleDateString('id-ID');
    if (dateField.toDate && typeof dateField.toDate === 'function') {
      return dateField.toDate().toLocaleDateString('id-ID');
    }
    if (dateField instanceof Date) {
      return dateField.toLocaleDateString('id-ID');
    }
    return new Date(dateField).toLocaleDateString('id-ID');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-3xl md:text-4xl font-light mb-2">
                <span className="bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#F4D03F] bg-clip-text text-transparent">
                  Referral Management
                </span>
              </h1>
              <p className="text-gray-600">Kelola program referral alumni Jamaah Umroh</p>
            </div>
            
            <Button
              onClick={exportToCSV}
              className="bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] hover:opacity-90 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-xl border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Alumni</p>
                  <p className="text-3xl font-bold text-blue-600">{referrals.length}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-xl border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Referrals</p>
                  <p className="text-3xl font-bold text-purple-600">{totalReferrals}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                  <Gift className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-xl border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Successful</p>
                  <p className="text-3xl font-bold text-green-600">{totalSuccessful}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-xl border-[#D4AF37]/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Komisi</p>
                  <p className="text-2xl font-bold text-[#D4AF37]">
                    Rp {totalCommission.toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4AF37]/20 to-[#FFD700]/20 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-[#D4AF37]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filter */}
        <Card className="bg-white/80 backdrop-blur-xl mb-6">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Cari berdasarkan kode referral, nama, atau email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" className="border-[#D4AF37]/30 text-[#D4AF37]">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Referrals Table */}
        <Card className="bg-white/80 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-[#D4AF37]" />
              Daftar Referral Alumni
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12 text-gray-500">
                Memuat data referral...
              </div>
            ) : filteredReferrals.length === 0 ? (
              <div className="text-center py-12">
                <Gift className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold mb-2">Tidak Ada Data</h3>
                <p className="text-gray-600">Belum ada data referral yang tersedia</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Kode Referral</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Nama Alumni</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Total</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Successful</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Komisi</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Tanggal</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredReferrals.map((referral, index) => (
                      <motion.tr
                        key={referral.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm bg-[#D4AF37]/10 text-[#D4AF37] px-3 py-1 rounded-full">
                              {referral.code}
                            </span>
                            <button
                              onClick={() => handleCopyCode(referral.code)}
                              className="text-gray-400 hover:text-[#D4AF37] transition-colors"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-800">{referral.userName}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-sm text-gray-600">{referral.userEmail}</p>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold">
                            {referral.totalReferrals}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 font-semibold">
                            {referral.successfulReferrals}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <p className="font-semibold text-[#D4AF37]">
                            Rp {(referral.totalCommission || 0).toLocaleString('id-ID')}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <p className="text-sm text-gray-600">{formatDate(referral.createdAt)}</p>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetails(referral)}
                              className="border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Details Modal */}
        {showDetails && selectedReferral && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Detail Referral</h2>
                    <p className="text-gray-600">Kode: <span className="font-mono text-[#D4AF37] font-semibold">{selectedReferral.code}</span></p>
                  </div>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-gray-600 mb-1">Nama Alumni</p>
                    <p className="font-semibold text-gray-800">{selectedReferral.userName}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-gray-600 mb-1">Email</p>
                    <p className="font-semibold text-gray-800">{selectedReferral.userEmail}</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-sm text-gray-600 mb-1">Total Referrals</p>
                    <p className="text-2xl font-bold text-purple-600">{selectedReferral.totalReferrals}</p>
                  </div>
                  <div className="p-4 bg-[#D4AF37]/10 rounded-lg border border-[#D4AF37]/30">
                    <p className="text-sm text-gray-600 mb-1">Total Komisi</p>
                    <p className="text-2xl font-bold text-[#D4AF37]">
                      Rp {(selectedReferral.totalCommission || 0).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                <h3 className="font-semibold text-lg mb-4">Riwayat Referral</h3>
                {referralDetails.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <Award className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-600">Belum ada riwayat referral</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {referralDetails.map((detail) => (
                      <div key={detail.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{detail.referredUserName}</p>
                            <p className="text-sm text-gray-600">{detail.referredUserEmail}</p>
                            {detail.packageName && (
                              <p className="text-xs text-gray-500 mt-1">Paket: {detail.packageName}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-[#D4AF37]">
                              Rp {detail.commissionAmount.toLocaleString('id-ID')}
                            </p>
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                              detail.status === 'successful' ? 'bg-green-100 text-green-700' :
                              detail.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {detail.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReferralManagement;