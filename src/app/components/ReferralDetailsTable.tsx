import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore'; // ✅ Remove orderBy - akan sort di client side
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from './ui/table';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { 
  getReferralStatusDisplay, 
  getReferralStatusColor,
  formatCommission 
} from '../../constants/commissionRates';
import { User, Calendar, DollarSign, CheckCircle, Clock, XCircle, Users } from 'lucide-react'; // ✅ Add Users import

interface ReferralDetail {
  id: string;
  referredUserName: string;
  referredUserEmail: string;
  referralCode: string;
  status: string;
  commission: number;
  createdAt: string;
  convertedAt: string | null;
  paymentSubmittedAt: string | null;
}

interface ReferralDetailsTableProps {
  userId: string;
}

const ReferralDetailsTable: React.FC<ReferralDetailsTableProps> = ({ userId }) => {
  const [referrals, setReferrals] = useState<ReferralDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    console.log('🔍 [ReferralDetails] Setting up real-time listener for referrals...');

    // ✅ Real-time listener untuk referralTracking
    const referralsQuery = query(
      collection(db, 'referralTracking'),
      where('referrerId', '==', userId)
    );

    const unsubscribe = onSnapshot(
      referralsQuery,
      (snapshot) => {
        const referralData: ReferralDetail[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as ReferralDetail));

        console.log('✅ [ReferralDetails] Referral data updated:', {
          count: referralData.length,
          data: referralData
        });

        setReferrals(referralData);
        setLoading(false);
      },
      (error) => {
        console.error('❌ [ReferralDetails] Error fetching referrals:', error);
        setLoading(false);
      }
    );

    return () => {
      console.log('🧹 [ReferralDetails] Cleaning up listener...');
      unsubscribe();
    };
  }, [userId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'registered':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'payment_submitted':
        return <Clock className="w-4 h-4 text-yellow-600 animate-pulse" />;
      case 'converted':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'payment_rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-xl">Detail Referral</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (referrals.length === 0) {
    return (
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <User className="w-5 h-5 text-[#D4AF37]" />
            Detail Referral
          </CardTitle>
          <CardDescription>
            Belum ada jamaah yang menggunakan kode referral Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Bagikan kode referral Anda untuk mulai mendapatkan komisi!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <User className="w-5 h-5 text-[#D4AF37]" />
          Detail Referral
        </CardTitle>
        <CardDescription>
          Total {referrals.length} jamaah menggunakan kode referral Anda
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-[#C5A572]/10 via-[#D4AF37]/10 to-[#F4D03F]/10">
                <TableHead className="font-semibold">Nama Jamaah</TableHead>
                <TableHead className="font-semibold">Email</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Komisi</TableHead>
                <TableHead className="font-semibold">Tanggal Daftar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {referrals.map((referral) => (
                <TableRow key={referral.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C5A572] to-[#D4AF37] flex items-center justify-center text-white font-semibold text-sm">
                        {referral.referredUserName.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium">{referral.referredUserName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600">{referral.referredUserEmail}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(referral.status)}
                      <span className={`text-sm font-medium ${getReferralStatusColor(referral.status)}`}>
                        {getReferralStatusDisplay(referral.status)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {referral.commission > 0 ? (
                      <div className="flex items-center gap-1 text-green-600 font-semibold">
                        <DollarSign className="w-4 h-4" />
                        {formatCommission(referral.commission)}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">Belum ada</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-gray-600 text-sm">
                      <Calendar className="w-4 h-4" />
                      {formatDate(referral.createdAt)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Baru Daftar</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {referrals.filter(r => r.status === 'registered').length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600 font-medium">Menunggu Approval</p>
                  <p className="text-2xl font-bold text-yellow-700">
                    {referrals.filter(r => r.status === 'payment_submitted').length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-400 animate-pulse" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Komisi Aktif</p>
                  <p className="text-2xl font-bold text-green-700">
                    {referrals.filter(r => r.status === 'converted').length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReferralDetailsTable;