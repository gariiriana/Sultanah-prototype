import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  Calendar,
  DollarSign,
  CreditCard,
  Building2,
  User,
  Package,
  Eye,
  Download,
  Calculator,
  TrendingDown,
  Upload,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { toast } from 'sonner';
import PayNextInstallmentModal from './PayNextInstallmentModal';

interface PaymentStatusTrackingProps {
  onBack: () => void;
}

interface Payment {
  id: string;
  paymentNumber: string;
  booking: string;
  amount: number;
  paymentMethod: string;
  paymentType?: 'full' | 'installment';
  totalInstallments?: number;
  currentInstallment?: number;
  paidInstallments?: number; // How many installments have been paid (approved)
  totalPackagePrice?: number; // Total package price for installment tracking
  bankName: string;
  accountNumber: string;
  accountName: string;
  transferDateTime: Timestamp;
  proofOfPayment: string;
  proofFileName: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  submittedAt: Timestamp;
  reviewedAt?: Timestamp | null;
  reviewedBy?: string;
  userName: string;
  userEmail: string;
}

const PaymentStatusTracking: React.FC<PaymentStatusTrackingProps> = ({ onBack }) => {
  const { userProfile } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPayNextInstallmentModal, setShowPayNextInstallmentModal] = useState(false);

  useEffect(() => {
    if (userProfile?.email) {
      fetchUserPayments();
    }
  }, [userProfile?.email]); // Add email as dependency

  const fetchUserPayments = async () => {
    if (!userProfile?.email) {
      console.log('No user email found, skipping fetch');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching payments for:', userProfile.email);
      
      const q = query(
        collection(db, 'payments'),
        where('userEmail', '==', userProfile.email)
      );
      
      const querySnapshot = await getDocs(q);
      console.log('Found payments:', querySnapshot.docs.length);
      
      const paymentsData = querySnapshot.docs.map(doc => {
        console.log('Payment data:', doc.id, doc.data());
        return {
          id: doc.id,
          ...doc.data()
        };
      }) as Payment[];

      // Sort by submittedAt in descending order (client-side)
      paymentsData.sort((a, b) => {
        const timeA = a.submittedAt?.toMillis() || 0;
        const timeB = b.submittedAt?.toMillis() || 0;
        return timeB - timeA; // Descending order (newest first)
      });

      console.log('Sorted payments:', paymentsData);
      setPayments(paymentsData);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Gagal memuat riwayat pembayaran. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-6 h-6 text-red-500" />;
      case 'pending':
      default:
        return <Clock className="w-6 h-6 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'pending':
      default:
        return 'Pending Review';
    }
  };

  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return '-';
    return timestamp.toDate().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getProgressStage = (status: string) => {
    switch (status) {
      case 'approved':
      case 'rejected':
        return 3; // Final stage
      case 'pending':
        return 2; // Pending review
      default:
        return 1; // Submitted
    }
  };

  const downloadProof = (proofData: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = proofData;
    link.download = fileName || 'payment-proof.jpg';
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-[#FFF9F0]">
      {/* Hero Section with Mecca Night Background */}
      <div 
        className="relative h-[280px] md:h-[320px] bg-cover bg-center"
        style={{ 
          backgroundImage: `url(https://images.unsplash.com/photo-1637100272004-5764743480a8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWNjYSUyMHNhdWRpJTIwYXJhYmlhJTIwbmlnaHR8ZW58MXx8fHwxNjcxOTA5OTd8MA&ixlib=rb-4.1.0&q=80&w=1080)` 
        }}
      >
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/75"></div>
        
        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-between max-w-6xl mx-auto px-6 py-8">
          {/* Back Button */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/30 flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </motion.button>

          {/* Title */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center text-white pb-8"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#C5A572] mb-4 shadow-xl">
              <CreditCard className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3 drop-shadow-lg">
              Status Pembayaran
            </h1>
            <p className="text-base md:text-lg text-white/90 drop-shadow-md max-w-2xl mx-auto">
              Pantau status konfirmasi pembayaran Anda untuk paket umrah yang telah diajukan
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-12 pb-12 relative z-20">
        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37]"></div>
            <p className="mt-4 text-gray-600">Loading payment history...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && payments.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="bg-white rounded-2xl p-12 shadow-sm">
              <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Payments Yet</h3>
              <p className="text-gray-600 mb-6">
                You haven't submitted any payments. Submit your first payment to get started.
              </p>
              <Button
                onClick={onBack}
                className="bg-gradient-to-r from-[#C5A572] to-[#D4AF37] text-white"
              >
                Go to Payment Form
              </Button>
            </div>
          </motion.div>
        )}

        {/* Payment List */}
        {!loading && payments.length > 0 && (
          <div className="space-y-4">
            {payments.map((payment, index) => (
              <motion.div
                key={payment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {payment.paymentNumber}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(payment.status)}`}>
                            {getStatusText(payment.status)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Submitted on {formatDate(payment.submittedAt)}
                        </p>
                      </div>
                      {getStatusIcon(payment.status)}
                    </div>

                    {/* Progress Tracker */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between relative">
                        {/* Progress Line */}
                        <div className="absolute top-4 left-0 right-0 h-1 bg-gray-200 -z-10">
                          <div 
                            className={`h-full transition-all duration-500 ${
                              payment.status === 'approved' 
                                ? 'bg-green-500' 
                                : payment.status === 'rejected' 
                                ? 'bg-red-500' 
                                : 'bg-yellow-500'
                            }`}
                            style={{ width: `${(getProgressStage(payment.status) - 1) * 50}%` }}
                          />
                        </div>

                        {/* Stage 1: Submit Request */}
                        <div className="flex flex-col items-center z-10">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            getProgressStage(payment.status) >= 1 
                              ? 'bg-green-500 text-white' 
                              : 'bg-gray-300 text-gray-600'
                          }`}>
                            {getProgressStage(payment.status) >= 1 ? <CheckCircle className="w-5 h-5" /> : '1'}
                          </div>
                          <span className="text-xs mt-2 font-medium text-gray-700">Submit Request</span>
                        </div>

                        {/* Stage 2: Pending */}
                        <div className="flex flex-col items-center z-10">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            getProgressStage(payment.status) >= 2 
                              ? payment.status === 'pending'
                                ? 'bg-yellow-500 text-white animate-pulse'
                                : 'bg-green-500 text-white'
                              : 'bg-gray-300 text-gray-600'
                          }`}>
                            {getProgressStage(payment.status) >= 2 ? <Clock className="w-5 h-5" /> : '2'}
                          </div>
                          <span className="text-xs mt-2 font-medium text-gray-700">Pending Review</span>
                        </div>

                        {/* Stage 3: Approval/Rejection */}
                        <div className="flex flex-col items-center z-10">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            getProgressStage(payment.status) >= 3 
                              ? payment.status === 'approved'
                                ? 'bg-green-500 text-white'
                                : 'bg-red-500 text-white'
                              : 'bg-gray-300 text-gray-600'
                          }`}>
                            {payment.status === 'approved' ? (
                              <CheckCircle className="w-5 h-5" />
                            ) : payment.status === 'rejected' ? (
                              <XCircle className="w-5 h-5" />
                            ) : (
                              '3'
                            )}
                          </div>
                          <span className="text-xs mt-2 font-medium text-gray-700">
                            {payment.status === 'approved' ? 'Approved' : payment.status === 'rejected' ? 'Rejected' : 'Confirmation'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Payment Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Package className="w-4 h-4 text-gray-500" />
                          <p className="text-xs text-gray-600">Package</p>
                        </div>
                        <p className="font-semibold text-sm text-gray-900 truncate">{payment.booking}</p>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <DollarSign className="w-4 h-4 text-gray-500" />
                          <p className="text-xs text-gray-600">Amount</p>
                        </div>
                        <p className="font-semibold text-sm text-gray-900">{formatCurrency(payment.amount)}</p>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Building2 className="w-4 h-4 text-gray-500" />
                          <p className="text-xs text-gray-600">Bank</p>
                        </div>
                        <p className="font-semibold text-sm text-gray-900 truncate">{payment.bankName}</p>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <p className="text-xs text-gray-600">Transfer Date</p>
                        </div>
                        <p className="font-semibold text-sm text-gray-900">
                          {formatDate(payment.transferDateTime)}
                        </p>
                      </div>
                    </div>

                    {/* Installment Progress Card - Show if payment type is installment */}
                    {payment.paymentType === 'installment' && payment.totalInstallments && payment.totalInstallments > 1 && (
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Calculator className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-3">
                              <p className="font-semibold text-blue-900">Status Cicilan</p>
                              <span className="text-xs font-medium px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full">
                                {payment.paidInstallments || 0} / {payment.totalInstallments} Lunas
                              </span>
                            </div>
                            <div className="space-y-2 text-sm mb-3">
                              <div className="flex justify-between">
                                <span className="text-blue-700">Total Paket:</span>
                                <span className="font-semibold text-blue-900">
                                  Rp {(payment.totalPackagePrice || (payment.amount * payment.totalInstallments)).toLocaleString('id-ID')}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-blue-700">Sudah Dibayar:</span>
                                <span className="font-semibold text-blue-900">
                                  Rp {(Math.ceil((payment.totalPackagePrice || (payment.amount * payment.totalInstallments)) / payment.totalInstallments) * (payment.paidInstallments || 0)).toLocaleString('id-ID')}
                                </span>
                              </div>
                              <div className="border-t border-blue-200 pt-2 flex justify-between">
                                <span className="text-blue-700 font-medium">Sisa Pembayaran:</span>
                                <span className="font-bold text-blue-900">
                                  Rp {Math.max(0, (payment.totalPackagePrice || (payment.amount * payment.totalInstallments)) - (Math.ceil((payment.totalPackagePrice || (payment.amount * payment.totalInstallments)) / payment.totalInstallments) * (payment.paidInstallments || 0))).toLocaleString('id-ID')}
                                </span>
                              </div>
                            </div>

                            {/* Progress Bar */}
                            <div>
                              <div className="flex items-center justify-between text-xs text-blue-700 mb-1.5">
                                <span>Progress Pembayaran</span>
                                <span>{Math.round(((payment.paidInstallments || 0) / payment.totalInstallments) * 100)}%</span>
                              </div>
                              <div className="w-full h-2 bg-blue-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                                  style={{ width: `${((payment.paidInstallments || 0) / payment.totalInstallments) * 100}%` }}
                                />
                              </div>
                            </div>

                            {/* Status Info */}
                            {(payment.paidInstallments || 0) >= payment.totalInstallments ? (
                              <div className="mt-3 flex items-center gap-2 text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-xs font-medium">✓ Pembayaran Lunas!</span>
                              </div>
                            ) : (
                              <div className="mt-3 flex items-center gap-2 text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
                                <Clock className="w-4 h-4" />
                                <span className="text-xs font-medium">
                                  Cicilan ke-{(payment.paidInstallments || 0) + 1} menunggu pembayaran
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Rejection Reason */}
                    {payment.status === 'rejected' && payment.rejectionReason && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                        <div className="flex items-start gap-2">
                          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-red-900 mb-1">Rejection Reason</p>
                            <p className="text-sm text-red-700">{payment.rejectionReason}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          setSelectedPayment(payment);
                          setShowDetailModal(true);
                        }}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      <Button
                        onClick={() => downloadProof(payment.proofOfPayment, payment.proofFileName)}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Proof
                      </Button>
                      {payment.paymentType === 'installment' && payment.currentInstallment < payment.totalInstallments && (
                        <Button
                          onClick={() => {
                            setSelectedPayment(payment);
                            setShowPayNextInstallmentModal(true);
                          }}
                          size="sm"
                          className="flex-1 bg-gradient-to-r from-[#C5A572] to-[#D4AF37] text-white"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Pay Next Installment
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        <AnimatePresence>
          {showDetailModal && selectedPayment && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowDetailModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="sticky top-0 bg-gradient-to-r from-[#C5A572] to-[#D4AF37] p-6 text-white">
                  <h2 className="text-2xl font-bold mb-1">Payment Details</h2>
                  <p className="text-white/90 text-sm">{selectedPayment.paymentNumber}</p>
                </div>

                <div className="p-6 space-y-6">
                  {/* Status Badge */}
                  <div className="flex items-center justify-center">
                    <div className={`px-6 py-3 rounded-full text-lg font-semibold border-2 ${getStatusColor(selectedPayment.status)}`}>
                      {getStatusIcon(selectedPayment.status)}
                      <span className="ml-2">{getStatusText(selectedPayment.status)}</span>
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">User Name</p>
                      <p className="font-semibold text-gray-900">{selectedPayment.userName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Email</p>
                      <p className="font-semibold text-gray-900">{selectedPayment.userEmail}</p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Payment Information</h3>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Package</p>
                          <p className="font-medium text-gray-900">{selectedPayment.booking}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Amount</p>
                          <p className="font-medium text-gray-900">{formatCurrency(selectedPayment.amount)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Transfer Details</h3>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Payment Method</p>
                          <p className="font-medium text-gray-900">{selectedPayment.paymentMethod}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Bank Name</p>
                          <p className="font-medium text-gray-900">{selectedPayment.bankName}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Account Number</p>
                          <p className="font-medium text-gray-900">{selectedPayment.accountNumber}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Account Name</p>
                          <p className="font-medium text-gray-900">{selectedPayment.accountName}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Transfer Date & Time</p>
                        <p className="font-medium text-gray-900">{formatDate(selectedPayment.transferDateTime)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Proof of Payment */}
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Proof of Payment</h3>
                    {selectedPayment.proofOfPayment.startsWith('data:image') ? (
                      <img 
                        src={selectedPayment.proofOfPayment} 
                        alt="Payment Proof"
                        className="w-full rounded-lg border"
                      />
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <FileText className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">{selectedPayment.proofFileName}</p>
                      </div>
                    )}
                  </div>

                  {/* Timeline */}
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Timeline</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Submitted</p>
                          <p className="text-xs text-gray-600">{formatDate(selectedPayment.submittedAt)}</p>
                        </div>
                      </div>
                      {selectedPayment.reviewedAt && (
                        <div className="flex items-center gap-3">
                          {selectedPayment.status === 'approved' ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {selectedPayment.status === 'approved' ? 'Approved' : 'Rejected'}
                            </p>
                            <p className="text-xs text-gray-600">{formatDate(selectedPayment.reviewedAt)}</p>
                            {selectedPayment.reviewedBy && (
                              <p className="text-xs text-gray-500">by {selectedPayment.reviewedBy}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setShowDetailModal(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Close
                    </Button>
                    <Button
                      onClick={() => downloadProof(selectedPayment.proofOfPayment, selectedPayment.proofFileName)}
                      className="flex-1 bg-gradient-to-r from-[#C5A572] to-[#D4AF37] text-white"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Proof
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pay Next Installment Modal */}
        <AnimatePresence>
          {showPayNextInstallmentModal && selectedPayment && (
            <PayNextInstallmentModal
              payment={selectedPayment}
              onClose={() => setShowPayNextInstallmentModal(false)}
              onSuccess={() => {
                fetchUserPayments(); // Refresh payment list
                setShowPayNextInstallmentModal(false);
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PaymentStatusTracking;