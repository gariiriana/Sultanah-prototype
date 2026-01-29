import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useLocation } from 'react-router-dom'; // ✅ NEW: For reading URL params
import {
  ArrowLeft,
  CreditCard,
  ShoppingBag,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  Truck,
  FileText,
  Calendar,
  DollarSign,
  Eye,
  Download
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { collection, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'sonner';

interface Payment {
  id: string;
  paymentNumber: string;
  booking: string;
  amount: number;
  paymentMethod: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: any;
  reviewedAt: any;
  proofOfPayment: string;
  proofFileName: string;
  rejectionReason?: string;
  // Installment fields
  paymentType?: 'full' | 'installment';
  currentInstallment?: number;
  totalInstallments?: number;
}

interface MarketplaceOrder {
  id: string;
  orderNumber: string;
  items: any[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: any;
  deliveryAddress: string;
  phoneNumber: string;
}

interface PesananPageProps {
  onBack: () => void;
}

const PesananPage: React.FC<PesananPageProps> = ({ onBack }) => {
  const { currentUser, userProfile } = useAuth();
  const location = useLocation(); // ✅ NEW: For reading URL params
  const [activeTab, setActiveTab] = useState<'umroh' | 'marketplace'>('umroh');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all'); // ✅ NEW: Status filter
  const [payments, setPayments] = useState<Payment[]>([]);
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<MarketplaceOrder | null>(null);

  // ✅ NEW: Auto-switch tab based on URL param (e.g., /pesanan?tab=marketplace)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'marketplace') {
      setActiveTab('marketplace');
      console.log('✅ Auto-switched to Marketplace tab from URL param');
    }
  }, [location.search]);

  useEffect(() => {
    if (activeTab === 'umroh') {
      fetchPayments();
    } else {
      // ✅ NEW: Real-time listener for marketplace orders
      const unsubscribe = setupMarketplaceOrdersListener();
      return () => unsubscribe && unsubscribe();
    }
  }, [activeTab, currentUser]);

  const fetchPayments = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      
      // ✅ FIX: Ensure userId is defined before query
      const userId = userProfile?.id || currentUser.email;
      if (!userId) {
        console.log('No valid userId for payments fetch');
        setLoading(false);
        return;
      }
      
      const paymentsQuery = query(
        collection(db, 'payments'),
        where('userId', '==', userId)
      );
      
      const snapshot = await getDocs(paymentsQuery);
      const paymentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Payment[];
      
      // Sort by submittedAt descending (newest first) on client-side
      paymentsData.sort((a, b) => {
        const dateA = a.submittedAt?.toDate?.() || new Date(a.submittedAt);
        const dateB = b.submittedAt?.toDate?.() || new Date(b.submittedAt);
        return dateB.getTime() - dateA.getTime();
      });
      
      setPayments(paymentsData);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Gagal memuat data pembayaran');
    } finally {
      setLoading(false);
    }
  };

  const setupMarketplaceOrdersListener = () => {
    if (!currentUser) return;
    
    setLoading(true); // ✅ Set loading before listener
    
    // ✅ FIX: Ensure userId is defined before query
    const userId = userProfile?.id || currentUser.email;
    if (!userId) {
      console.log('No valid userId for marketplace orders listener');
      setLoading(false);
      return;
    }
    
    const ordersQuery = query(
      collection(db, 'marketplaceOrders'),
      where('userId', '==', userId)
    );
    
    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MarketplaceOrder[];
      
      // Sort by createdAt descending (newest first) on client-side
      ordersData.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
      
      setOrders(ordersData);
      setLoading(false); // ✅ Set loading false after data received
      
      console.log('🔄 Marketplace orders updated (real-time):', ordersData.length);
    }, (error) => {
      console.error('Error setting up marketplace orders listener:', error);
      toast.error('Gagal memuat data pesanan marketplace');
      setLoading(false); // ✅ Set loading false on error
    });
    
    return unsubscribe;
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Disetujui
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Ditolak
          </Badge>
        );
      default:
        return null;
    }
  };

  const getPaymentTypeBadge = (payment: Payment) => {
    if (payment.paymentType === 'installment' && payment.currentInstallment && payment.totalInstallments) {
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
          <CreditCard className="w-3 h-3 mr-1" />
          Cicilan {payment.currentInstallment}/{payment.totalInstallments}
        </Badge>
      );
    }
    return (
      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
        <CheckCircle className="w-3 h-3 mr-1" />
        Lunas
      </Badge>
    );
  };

  const getOrderStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; icon: any; label: string }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock, label: 'Pending' },
      confirmed: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: CheckCircle, label: 'Dikonfirmasi' },
      processing: { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Package, label: 'Diproses' },
      shipped: { color: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: Truck, label: 'Dikirim' },
      delivered: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle, label: 'Selesai' },
      rejected: { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle, label: 'Ditolak' },
      cancelled: { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle, label: 'Dibatalkan' }
    };

    const config = statusMap[status] || statusMap.pending;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  // ✅ NEW: Filter payments based on status
  const filteredPayments = statusFilter === 'all' 
    ? payments 
    : payments.filter(p => p.status === statusFilter);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Hero Header with Background Image */}
      <div 
        className="relative h-56 overflow-hidden"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1731975184484-2f5f6a03490e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXNqaWQlMjBuYWJhd2klMjBuaWdodCUyMGFlcmlhbHxlbnwxfHx8fDE3Njc2Mzc1MzB8MA&ixlib=rb-4.1.0&q=80&w=1080)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Gradient Overlay - Emerald & Gold */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/90 via-emerald-800/85 to-[#D4AF37]/80"></div>
        
        {/* Decorative Islamic Pattern Overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>

        <div className="relative max-w-7xl mx-auto px-6 h-full flex flex-col justify-between py-6">
          {/* Back Button & Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4"
          >
            <Button
              onClick={onBack}
              className="bg-white/15 hover:bg-white/25 border border-white/30 text-white backdrop-blur-md shadow-lg hover:shadow-xl transition-all"
              size="sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </motion.div>

          {/* Hero Content */}
          <div className="space-y-2">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-bold text-white flex items-center gap-3"
            >
              <Package className="w-10 h-10 text-[#F4D03F]" />
              Pesanan Saya
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-emerald-100/90 text-lg"
            >
              Lihat status pembayaran & pesanan Anda
            </motion.p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4">
        <div className="bg-white rounded-t-2xl shadow-sm border border-b-0 border-gray-100">
          <div className="flex justify-center gap-1 p-2">
            <button
              onClick={() => setActiveTab('umroh')}
              className={`px-8 py-3.5 font-semibold transition-all relative rounded-xl ${
                activeTab === 'umroh'
                  ? 'text-white bg-gradient-to-r from-[#C5A572] to-[#D4AF37] shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                <CreditCard className="w-5 h-5" />
                <span>Pembayaran Paket Umroh</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('marketplace')}
              className={`px-8 py-3.5 font-semibold transition-all relative rounded-xl ${
                activeTab === 'marketplace'
                  ? 'text-white bg-gradient-to-r from-[#C5A572] to-[#D4AF37] shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                <ShoppingBag className="w-5 h-5" />
                <span>Pesanan Marketplace</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white rounded-b-2xl shadow-md border border-gray-100 min-h-[500px]">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 border-4 border-gray-200 border-t-[#D4AF37] rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Memuat data...</p>
            </div>
          ) : activeTab === 'umroh' ? (
            <div>
              {/* Status Filter - Only for Umroh Payments */}
              {payments.length > 0 && (
                <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-2 overflow-x-auto">
                    <button
                      onClick={() => setStatusFilter('all')}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
                        statusFilter === 'all'
                          ? 'bg-gradient-to-r from-[#C5A572] to-[#D4AF37] text-white shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Semua ({payments.length})
                    </button>
                    <button
                      onClick={() => setStatusFilter('pending')}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
                        statusFilter === 'pending'
                          ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-400 shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Clock className="w-4 h-4 inline mr-1" />
                      Pending ({payments.filter(p => p.status === 'pending').length})
                    </button>
                    <button
                      onClick={() => setStatusFilter('approved')}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
                        statusFilter === 'approved'
                          ? 'bg-green-100 text-green-800 border-2 border-green-400 shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4 inline mr-1" />
                      Disetujui ({payments.filter(p => p.status === 'approved').length})
                    </button>
                    <button
                      onClick={() => setStatusFilter('rejected')}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
                        statusFilter === 'rejected'
                          ? 'bg-red-100 text-red-800 border-2 border-red-400 shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <XCircle className="w-4 h-4 inline mr-1" />
                      Ditolak ({payments.filter(p => p.status === 'rejected').length})
                    </button>
                  </div>
                </div>
              )}

              {/* Pembayaran Paket Umroh */}
              <div className="p-6 space-y-4">
                {filteredPayments.length === 0 ? (
                  <div className="py-12 text-center">
                    <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {payments.length === 0 ? 'Belum Ada Pembayaran' : 'Tidak Ada Hasil'}
                    </h3>
                    <p className="text-gray-600">
                      {payments.length === 0 
                        ? 'Anda belum memiliki riwayat pembayaran paket umroh'
                        : `Tidak ada pembayaran dengan status ${statusFilter}`
                      }
                    </p>
                  </div>
                ) : (
                  filteredPayments.map((payment, index) => {
                    // Determine border color based on status
                    let borderColor = 'border-l-yellow-400';
                    let bgColor = 'bg-white';
                    if (payment.status === 'approved') {
                      borderColor = 'border-l-green-400';
                      bgColor = 'bg-green-50/30';
                    } else if (payment.status === 'rejected') {
                      borderColor = 'border-l-red-400';
                      bgColor = 'bg-red-50/30';
                    } else if (payment.status === 'pending') {
                      borderColor = 'border-l-yellow-400';
                      bgColor = 'bg-yellow-50/30';
                    }

                    return (
                      <motion.div
                        key={payment.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`${bgColor} border-l-4 ${borderColor} rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6`}
                      >
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
                          {/* Payment Number & Type */}
                          <div>
                            <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Nomor Pembayaran</p>
                            <p className="text-sm font-mono text-gray-600 mb-3">{payment.paymentNumber}</p>
                            <div className="flex flex-wrap gap-2">
                              {getPaymentTypeBadge(payment)}
                            </div>
                          </div>

                          {/* Amount */}
                          <div>
                            <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Jumlah</p>
                            <p className="text-2xl font-bold text-green-600">
                              Rp {payment.amount.toLocaleString('id-ID')}
                            </p>
                            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                              <CreditCard className="w-3 h-3" />
                              {payment.paymentMethod}
                            </p>
                          </div>

                          {/* Date */}
                          <div>
                            <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Tanggal Pengajuan</p>
                            <p className="text-sm text-gray-900 font-medium flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              {formatDate(payment.submittedAt)}
                            </p>
                          </div>

                          {/* Status & Actions */}
                          <div className="flex flex-col gap-3">
                            <div>
                              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Status</p>
                              {getPaymentStatusBadge(payment.status)}
                            </div>
                            <Button
                              onClick={() => setSelectedPayment(payment)}
                              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all"
                              size="sm"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Lihat Detail
                            </Button>
                          </div>
                        </div>

                        {/* Rejection Reason */}
                        {payment.status === 'rejected' && payment.rejectionReason && (
                          <div className="mt-5 pt-5 border-t border-red-200">
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                              <p className="text-xs font-bold text-red-800 mb-2 uppercase tracking-wide flex items-center gap-2">
                                <XCircle className="w-4 h-4" />
                                Alasan Penolakan:
                              </p>
                              <p className="text-sm text-red-700">{payment.rejectionReason}</p>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            // Pesanan Marketplace
            <div className="p-6 space-y-4">
              {orders.length === 0 ? (
                <div className="py-12 text-center">
                  <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Pesanan</h3>
                  <p className="text-gray-600">Anda belum memiliki pesanan dari marketplace</p>
                </div>
              ) : (
                orders.map((order, index) => {
                  // Determine border color based on status
                  let borderColor = 'border-l-yellow-400';
                  let bgColor = 'bg-white';
                  if (order.status === 'delivered') {
                    borderColor = 'border-l-green-400';
                    bgColor = 'bg-green-50/30';
                  } else if (order.status === 'cancelled' || order.status === 'rejected') {
                    borderColor = 'border-l-red-400';
                    bgColor = 'bg-red-50/30';
                  } else if (order.status === 'shipped') {
                    borderColor = 'border-l-indigo-400';
                    bgColor = 'bg-indigo-50/30';
                  } else if (order.status === 'processing') {
                    borderColor = 'border-l-purple-400';
                    bgColor = 'bg-purple-50/30';
                  } else if (order.status === 'confirmed') {
                    borderColor = 'border-l-blue-400';
                    bgColor = 'bg-blue-50/30';
                  }

                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`${bgColor} border-l-4 ${borderColor} rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6`}
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
                        {/* Order Number */}
                        <div>
                          <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Nomor Pesanan</p>
                          <p className="text-sm font-mono text-gray-600 mb-2">{order.orderNumber}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            {order.items.length} item
                          </p>
                        </div>

                        {/* Total Amount */}
                        <div>
                          <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Total Pembayaran</p>
                          <p className="text-2xl font-bold text-green-600">
                            Rp {order.totalAmount.toLocaleString('id-ID')}
                          </p>
                        </div>

                        {/* Date */}
                        <div>
                          <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Tanggal Pesanan</p>
                          <p className="text-sm text-gray-900 font-medium flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {formatDate(order.createdAt)}
                          </p>
                        </div>

                        {/* Status & Actions */}
                        <div className="flex flex-col gap-3">
                          <div>
                            <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Status</p>
                            {getOrderStatusBadge(order.status)}
                          </div>
                          <Button
                            onClick={() => setSelectedOrder(order)}
                            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all"
                            size="sm"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Lihat Detail
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* Payment Detail Modal */}
      {selectedPayment && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPayment(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-gradient-to-r from-[#C5A572] to-[#D4AF37] p-6 text-white">
              <h2 className="text-2xl font-bold">Detail Pembayaran</h2>
              <p className="text-white/90 text-sm">{selectedPayment.paymentNumber}</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Jumlah</p>
                  <p className="font-bold text-green-600 text-xl">
                    Rp {selectedPayment.amount.toLocaleString('id-ID')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Status</p>
                  {getPaymentStatusBadge(selectedPayment.status)}
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Metode Pembayaran</p>
                  <p className="font-medium text-gray-900">{selectedPayment.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Tanggal Pengajuan</p>
                  <p className="font-medium text-gray-900">{formatDate(selectedPayment.submittedAt)}</p>
                </div>
              </div>

              {/* Proof of Payment */}
              {selectedPayment.proofOfPayment && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Bukti Pembayaran</p>
                  {selectedPayment.proofOfPayment.startsWith('data:image') ? (
                    <img
                      src={selectedPayment.proofOfPayment}
                      alt="Bukti pembayaran"
                      className="w-full rounded-lg border border-gray-200"
                    />
                  ) : (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 text-center">{selectedPayment.proofFileName}</p>
                      <a
                        href={selectedPayment.proofOfPayment}
                        download={selectedPayment.proofFileName}
                        className="text-blue-600 hover:underline text-sm mt-2 flex items-center justify-center gap-1"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Rejection Reason */}
              {selectedPayment.status === 'rejected' && selectedPayment.rejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-red-800 mb-1">Alasan Penolakan:</p>
                  <p className="text-sm text-red-700">{selectedPayment.rejectionReason}</p>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 p-6 border-t border-gray-100">
              <Button
                onClick={() => setSelectedPayment(null)}
                className="w-full bg-gradient-to-r from-[#C5A572] to-[#D4AF37]"
              >
                Tutup
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedOrder(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-gradient-to-r from-[#C5A572] to-[#D4AF37] p-6 text-white">
              <h2 className="text-2xl font-bold">Detail Pesanan</h2>
              <p className="text-white/90 text-sm">{selectedOrder.orderNumber}</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Pembayaran</p>
                  <p className="font-bold text-green-600 text-xl">
                    Rp {selectedOrder.totalAmount.toLocaleString('id-ID')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Status</p>
                  {getOrderStatusBadge(selectedOrder.status)}
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Tanggal Pesanan</p>
                  <p className="font-medium text-gray-900">{formatDate(selectedOrder.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Jumlah Item</p>
                  <p className="font-medium text-gray-900">{selectedOrder.items.length} item</p>
                </div>
              </div>

              {/* Items */}
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-3">Item Pesanan</p>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex gap-3 border border-gray-100 rounded-lg p-3">
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{item.name}</p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                        <p className="text-sm font-semibold text-green-600">
                          Rp {item.price.toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Address */}
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-1">Alamat Pengiriman</p>
                <p className="text-sm text-gray-700">{selectedOrder.deliveryAddress}</p>
                <p className="text-sm text-gray-500 mt-1">Tel: {selectedOrder.phoneNumber}</p>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 p-6 border-t border-gray-100">
              <Button
                onClick={() => setSelectedOrder(null)}
                className="w-full bg-gradient-to-r from-[#C5A572] to-[#D4AF37]"
              >
                Tutup
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PesananPage;