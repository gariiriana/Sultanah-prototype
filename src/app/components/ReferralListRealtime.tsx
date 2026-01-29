import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Users, Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { formatCommission } from '../../constants/commissionRates';

interface ReferralRecord {
  id: string;
  referredUserName: string;
  referredUserEmail: string;
  status: 'registered' | 'upgraded' | 'approved'; // ✅ FIXED: Add all lifecycle statuses
  hasUpgraded: boolean; // ✅ NEW
  hasPaid: boolean; // ✅ NEW
  paymentApproved: boolean; // ✅ NEW
  commissionGranted: boolean;
  commissionAmount: number;
  createdAt: string;
  paidAt?: string;
}

interface ReferralListRealtimeProps {
  userId: string;
  userRole: 'alumni' | 'agen';
}

const ReferralListRealtime: React.FC<ReferralListRealtimeProps> = ({ userId, userRole }) => {
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, 'referralTracking'),
      where('referrerId', '==', userId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const referralData: ReferralRecord[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          referralData.push({
            id: doc.id,
            referredUserName: data.referredUserName || 'User',
            referredUserEmail: data.referredUserEmail || '',
            status: data.status || 'registered',
            hasUpgraded: data.hasUpgraded || false,
            hasPaid: data.hasPaid || false,
            paymentApproved: data.paymentApproved || false,
            commissionGranted: data.commissionGranted || false,
            commissionAmount: data.commissionAmount || 0,
            createdAt: data.createdAt || new Date().toISOString(),
            paidAt: data.paidAt,
          });
        });

        referralData.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateB - dateA;
        });

        setReferrals(referralData);
        setLoading(false);
      },
      (error) => {
        setReferrals([]);
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

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '-';
    }
  };

  const stats = {
    total: referrals.length,
    paid: referrals.filter(r => r.hasPaid).length, // ✅ FIXED: Use hasPaid
    pending: referrals.filter(r => !r.hasPaid).length, // ✅ FIXED: Use hasPaid
    totalCommission: referrals
      .filter(r => r.commissionGranted)
      .reduce((sum, r) => sum + r.commissionAmount, 0),
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-amber-600"></div>
            <p className="text-gray-600">Loading referrals...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Referral</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Sudah Bayar</p>
                <p className="text-2xl font-bold text-gray-900">{stats.paid}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Belum Bayar</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-amber-600" />
              <div>
                <p className="text-sm text-gray-600">Total Komisi</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCommission(stats.totalCommission)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-600" />
            Daftar Referral
          </CardTitle>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Belum ada referral</p>
              <p className="text-sm text-gray-500">
                Bagikan kode referral Anda untuk mendapatkan komisi
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Nama
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Email
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Tanggal Daftar
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                      Komisi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((referral) => (
                    <tr
                      key={referral.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900">
                          {referral.referredUserName}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-gray-600">{referral.referredUserEmail}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-gray-600">
                          {formatDate(referral.createdAt)}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        {/* ✅ FIXED: Status badge based on lifecycle */}
                        {referral.status === 'approved' && referral.paymentApproved ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Komisi Didapat
                          </Badge>
                        ) : referral.hasPaid ? (
                          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                            <Clock className="w-3 h-3 mr-1" />
                            Menunggu Approval
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
                            <Clock className="w-3 h-3 mr-1" />
                            Belum Bayar
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {referral.commissionGranted ? (
                          <span className="font-semibold text-green-600">
                            {formatCommission(referral.commissionAmount)}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">
                            Rp 0
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-bold">ℹ️</span>
              </div>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 mb-2">Informasi Komisi</h4>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>• Komisi {userRole === 'alumni' ? 'Alumni' : 'Agen'}: {userRole === 'alumni' ? 'Rp200.000' : 'Rp500.000'} per referral sukses</li>
                <li>• Komisi dihitung setelah Jamaah bayar paket & disetujui Admin</li>
                <li>• Referral yang belum bayar akan tetap tampil di daftar</li>
                <li>• Saldo komisi dapat dicairkan kapan saja (minimum Rp50.000)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReferralListRealtime;