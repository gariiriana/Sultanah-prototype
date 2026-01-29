import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ShoppingCart,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Image as ImageIcon,
  Calendar,
  User,
  CheckCircle2,
  XCircle as XCircleIcon
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../components/ui/alert-dialog';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../../config/firebase';
import { toast } from 'sonner';
import { useAuth } from '../../../../contexts/AuthContext';

interface MarketplaceOrdersSectionProps {
  orders: any[];
  onRefresh: () => void;
}

const MarketplaceOrdersSection: React.FC<MarketplaceOrdersSectionProps> = ({ orders, onRefresh }) => {
  const { userProfile } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [confirmApprove, setConfirmApprove] = useState<string | null>(null);
  const [confirmReject, setConfirmReject] = useState<string | null>(null);

  const handleApprove = async (orderId: string) => {
    if (!userProfile) return;

    setProcessingId(orderId);
    try {
      const orderRef = doc(db, 'marketplaceOrders', orderId);
      await updateDoc(orderRef, {
        status: 'confirmed', // ✅ FIXED: Changed from 'approved' to 'confirmed' to match user-side status
        reviewedBy: userProfile.id,
        reviewedByName: userProfile.displayName || userProfile.email || 'Admin',
        reviewedAt: new Date().toISOString(),
        adminNotes: adminNotes || 'Pesanan disetujui',
        updatedAt: new Date().toISOString()
      });

      toast.success('✅ Pesanan berhasil disetujui!');
      setAdminNotes('');
      setSelectedOrder(null);
      onRefresh();
    } catch (error) {
      console.error('Error approving order:', error);
      toast.error('❌ Gagal menyetujui pesanan');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (orderId: string) => {
    if (!userProfile) return;
    if (!adminNotes.trim()) {
      toast.error('Silakan isi alasan penolakan');
      return;
    }

    setProcessingId(orderId);
    try {
      const orderRef = doc(db, 'marketplaceOrders', orderId);
      await updateDoc(orderRef, {
        status: 'rejected',
        reviewedBy: userProfile.id,
        reviewedByName: userProfile.displayName || userProfile.email || 'Admin',
        reviewedAt: new Date().toISOString(),
        adminNotes,
        updatedAt: new Date().toISOString()
      });

      toast.success('Pesanan ditolak');
      setAdminNotes('');
      setSelectedOrder(null);
      onRefresh();
    } catch (error) {
      console.error('Error rejecting order:', error);
      toast.error('❌ Gagal menolak pesanan');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-semibold">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-semibold">
            <CheckCircle className="w-3 h-3" />
            Dikonfirmasi
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-semibold">
            <XCircle className="w-3 h-3" />
            Ditolak
          </span>
        );
      default:
        return null;
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

  if (orders.length === 0) {
    return (
      <div className="bg-white border-2 border-gray-200 rounded-xl p-12 text-center">
        <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 font-semibold">Belum ada pesanan marketplace</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Order #</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Jamaah</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Items</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Total</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Tanggal</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono font-bold text-purple-600">{order.orderNumber}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-gray-900">{order.userName}</p>
                      <p className="text-sm text-gray-600">{order.userEmail}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold">{order.items.length} item(s)</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-gray-900">
                      {formatCurrency(order.totalAmount)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(order.status)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">
                      {formatDate(order.createdAt)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {/* View Detail Button */}
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setAdminNotes(order.adminNotes || '');
                        }}
                        className="text-purple-600 hover:text-white hover:bg-purple-600 font-semibold p-2 rounded-lg transition-all border-2 border-purple-600"
                        title="Lihat Detail"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      
                      {/* Approve/Reject Buttons - Only for Pending Orders */}
                      {order.status === 'pending' && (
                        <>
                          <button
                            onClick={() => setConfirmApprove(order.id)}
                            disabled={processingId === order.id}
                            className="flex items-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                            title="Setujui"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-xs">Approve</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setAdminNotes('');
                            }}
                            disabled={processingId === order.id}
                            className="flex items-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                            title="Tolak"
                          >
                            <XCircle className="w-4 h-4" />
                            <span className="text-xs">Reject</span>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden my-8"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white">Detail Pesanan Marketplace</h3>
                  <p className="text-white/90 text-sm mt-1">{selectedOrder.orderNumber}</p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-300px)]">
              {/* Info Jamaah */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Informasi Jamaah
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Nama</p>
                    <p className="font-semibold">{selectedOrder.userName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold">{selectedOrder.userEmail}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tanggal Order</p>
                    <p className="font-semibold flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(selectedOrder.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    {getStatusBadge(selectedOrder.status)}
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="mb-6">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Item yang Dipesan ({selectedOrder.items.length} item)
                </h4>
                <div className="space-y-3">
                  {selectedOrder.items.map((item: any, index: number) => (
                    <div key={index} className="bg-white border-2 border-gray-200 rounded-xl p-4">
                      <div className="flex gap-4">
                        <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                          {item.image ? (
                            <img src={item.image} alt={item.itemName} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-8 h-8 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-900">{item.itemName}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            {formatCurrency(item.price)} x {item.quantity} pcs
                          </p>
                          <p className="font-bold text-purple-600 mt-2">
                            Subtotal: {formatCurrency(item.subtotal)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-white border-2 border-purple-400 rounded-xl p-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-900 text-lg">Total Pembayaran</span>
                    <span className="text-3xl font-bold text-purple-600">
                      {formatCurrency(selectedOrder.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Proof */}
              <div className="mb-6">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Bukti Pembayaran
                </h4>
                <div className="bg-gray-100 rounded-lg p-4 border-2 border-dashed border-gray-300">
                  <img
                    src={selectedOrder.paymentProofUrl}
                    alt="Bukti Pembayaran"
                    className="max-w-full h-auto rounded-lg shadow-md mx-auto"
                    style={{ maxHeight: '400px' }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5HYWdhbCBtZW11YXQgZ2FtYmFyPC90ZXh0Pjwvc3ZnPg==';
                    }}
                  />
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div className="mb-6">
                  <h4 className="font-bold text-gray-900 mb-2">Catatan Jamaah</h4>
                  <p className="text-gray-700 bg-gray-50 rounded-xl p-4">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Admin Notes for Pending */}
              {selectedOrder.status === 'pending' && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Catatan Admin
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Tambahkan catatan (wajib untuk penolakan)..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 outline-none resize-none"
                    rows={3}
                  />
                </div>
              )}

              {/* Previous Admin Notes */}
              {selectedOrder.adminNotes && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h4 className="font-bold text-blue-900 mb-2">Catatan Admin</h4>
                  <p className="text-blue-800">{selectedOrder.adminNotes}</p>
                  {selectedOrder.reviewedByName && (
                    <p className="text-sm text-blue-600 mt-2">
                      Oleh: {selectedOrder.reviewedByName} • {formatDate(selectedOrder.reviewedAt)}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            {selectedOrder.status === 'pending' && (
              <div className="border-t bg-gray-50 p-6 flex gap-3">
                <Button
                  onClick={() => setConfirmReject(selectedOrder.id)}
                  variant="outline"
                  className="flex-1 border-2 border-red-500 text-red-600 hover:bg-red-50"
                  disabled={processingId === selectedOrder.id}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Tolak
                </Button>
                <Button
                  onClick={() => handleApprove(selectedOrder.id)}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                  disabled={processingId === selectedOrder.id}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {processingId === selectedOrder.id ? 'Memproses...' : 'Setujui'}
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Confirm Approve Dialog */}
      <AlertDialog open={!!confirmApprove} onOpenChange={(open) => !open && setConfirmApprove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              Setujui Pesanan
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Apakah Anda yakin ingin menyetujui pesanan ini? Jamaah akan mendapatkan notifikasi bahwa pesanan telah disetujui.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setConfirmApprove(null)}
              className="bg-gray-50 text-gray-900 hover:bg-gray-100"
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmApprove) {
                  handleApprove(confirmApprove);
                  setConfirmApprove(null);
                }
              }}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              Ya, Setujui
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Reject Dialog */}
      <AlertDialog open={!!confirmReject} onOpenChange={(open) => !open && setConfirmReject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <XCircle className="w-6 h-6 text-red-600" />
              Tolak Pesanan
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Apakah Anda yakin ingin menolak pesanan ini? Pastikan Anda telah mengisi alasan penolakan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setConfirmReject(null)}
              className="bg-gray-50 text-gray-900 hover:bg-gray-100"
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmReject) {
                  handleReject(confirmReject);
                  setConfirmReject(null);
                }
              }}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Ya, Tolak
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MarketplaceOrdersSection;