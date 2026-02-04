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
  User
} from 'lucide-react';

interface MarketplaceOrdersSectionProps {
  orders: any[];
  onRefresh: () => void;
}

const MarketplaceOrdersSection: React.FC<MarketplaceOrdersSectionProps> = ({ orders }) => {
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-semibold">
            <Clock className="w-3 h-3" />
            Menunggu Pembayaran
          </span>
        );
      case 'confirmed':
      case 'success':
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-semibold">
            <CheckCircle className="w-3 h-3" />
            Dibayar
          </span>
        );
      case 'rejected':
      case 'failed':
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-semibold">
            <XCircle className="w-3 h-3" />
            Gagal / Dibatalkan
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-xs font-semibold">
            <Clock className="w-3 h-3" />
            {status}
          </span>
        );
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
        {/* Header Actions */}
        {/* Header Actions Removed as per request (Read Only) */}

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
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-purple-600 hover:text-white hover:bg-purple-600 font-semibold p-2 rounded-lg transition-all border-2 border-purple-600"
                        title="Lihat Detail"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
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



              {/* Notes */}
              {selectedOrder.notes && (
                <div className="mb-6">
                  <h4 className="font-bold text-gray-900 mb-2">Catatan Jamaah</h4>
                  <p className="text-gray-700 bg-gray-50 rounded-xl p-4">{selectedOrder.notes}</p>
                </div>
              )}

            </div>
            {/* Footer Actions Removed - Read Only */}
          </motion.div>
        </div>
      )}
    </>
  );
};

export default MarketplaceOrdersSection;