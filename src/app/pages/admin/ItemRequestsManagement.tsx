import React, { useState, useEffect } from 'react';
import { ShoppingBag, CheckCircle, XCircle, Clock, Package, Search, Filter } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { ItemRequest } from '../../../types';
import { collection, query, getDocs, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { motion } from 'motion/react';
import { toast } from 'sonner';

const ItemRequestsManagement: React.FC = () => {
  const [requests, setRequests] = useState<ItemRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<ItemRequest['status'] | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const requestsRef = collection(db, 'itemRequests');
      const q = query(requestsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const requestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ItemRequest[];
      setRequests(requestsData);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Gagal memuat permintaan');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    const notes = prompt('Catatan untuk jamaah (opsional):');
    
    try {
      await updateDoc(doc(db, 'itemRequests', requestId), {
        status: 'approved',
        adminNotes: notes || undefined,
        approvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      toast.success('Permintaan disetujui');
      fetchRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Gagal menyetujui permintaan');
    }
  };

  const handleReject = async (requestId: string) => {
    const reason = prompt('Alasan penolakan:');
    if (!reason) return;

    try {
      await updateDoc(doc(db, 'itemRequests', requestId), {
        status: 'rejected',
        rejectedReason: reason,
        updatedAt: new Date().toISOString()
      });
      toast.success('Permintaan ditolak');
      fetchRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Gagal menolak permintaan');
    }
  };

  const handleFulfill = async (requestId: string) => {
    try {
      await updateDoc(doc(db, 'itemRequests', requestId), {
        status: 'fulfilled',
        fulfilledAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      toast.success('Permintaan ditandai selesai');
      fetchRequests();
    } catch (error) {
      console.error('Error fulfilling request:', error);
      toast.error('Gagal mengupdate permintaan');
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus;
    const matchesSearch = searchQuery.trim() === '' || 
      request.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.userName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: ItemRequest['status']) => {
    const badges = {
      pending: { label: 'Menunggu', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
      approved: { label: 'Disetujui', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
      rejected: { label: 'Ditolak', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
      fulfilled: { label: 'Selesai', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Package }
    };
    return badges[status];
  };

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    fulfilled: requests.filter(r => r.status === 'fulfilled').length
  };

  const itemTypeLabels: Record<ItemRequest['itemType'], string> = {
    'tas': 'Tas',
    'sajadah': 'Sajadah',
    'buku-doa': 'Buku Doa',
    'mukena': 'Mukena',
    'perlengkapan-lain': 'Perlengkapan Lain',
    'custom': 'Custom'
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
        <p className="mt-4 text-gray-600">Memuat permintaan...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Manajemen Permintaan Barang</h1>
        <p className="text-gray-600 mt-1">Kelola permintaan barang dari jamaah</p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Permintaan</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <ShoppingBag className="w-10 h-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Menunggu Review</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="w-10 h-10 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Disetujui</p>
              <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Selesai</p>
              <p className="text-3xl font-bold text-blue-600">{stats.fulfilled}</p>
            </div>
            <Package className="w-10 h-10 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari barang atau nama jamaah..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            {[
              { value: 'all', label: 'Semua' },
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Disetujui' },
              { value: 'fulfilled', label: 'Selesai' }
            ].map(filter => (
              <button
                key={filter.value}
                onClick={() => setFilterStatus(filter.value as ItemRequest['status'] | 'all')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filterStatus === filter.value
                    ? 'bg-gold text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Tidak ada permintaan ditemukan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Jamaah</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Barang</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Detail</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Tanggal</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRequests.map((request, index) => {
                  const statusBadge = getStatusBadge(request.status);
                  const StatusIcon = statusBadge.icon;

                  return (
                    <motion.tr
                      key={request.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{request.userName}</p>
                          <p className="text-sm text-gray-500">{request.userEmail}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{request.itemName}</p>
                          <p className="text-sm text-gray-500">
                            {itemTypeLabels[request.itemType]} • Qty: {request.quantity}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 space-y-1">
                          {request.description && (
                            <p className="line-clamp-2">
                              <span className="font-medium">Deskripsi:</span> {request.description}
                            </p>
                          )}
                          {request.customization && (
                            <p className="line-clamp-1">
                              <span className="font-medium">Custom:</span> {request.customization}
                            </p>
                          )}
                          {request.adminNotes && (
                            <p className="text-blue-600">
                              <span className="font-medium">Catatan:</span> {request.adminNotes}
                            </p>
                          )}
                          {request.rejectedReason && (
                            <p className="text-red-600">
                              <span className="font-medium">Ditolak:</span> {request.rejectedReason}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border-2 ${statusBadge.color} flex items-center gap-1 w-fit`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">
                          {new Date(request.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          {request.status === 'pending' && (
                            <>
                              <Button
                                onClick={() => handleApprove(request.id)}
                                size="sm"
                                className="bg-green-500 hover:bg-green-600 text-white gap-1"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Setujui
                              </Button>
                              <Button
                                onClick={() => handleReject(request.id)}
                                size="sm"
                                variant="outline"
                                className="border-red-500 text-red-500 hover:bg-red-50 gap-1"
                              >
                                <XCircle className="w-4 h-4" />
                                Tolak
                              </Button>
                            </>
                          )}

                          {request.status === 'approved' && (
                            <Button
                              onClick={() => handleFulfill(request.id)}
                              size="sm"
                              className="bg-blue-500 hover:bg-blue-600 text-white gap-1"
                            >
                              <Package className="w-4 h-4" />
                              Tandai Selesai
                            </Button>
                          )}

                          {request.status === 'fulfilled' && (
                            <span className="text-xs text-gray-500 text-center">
                              ✓ Selesai
                            </span>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemRequestsManagement;
