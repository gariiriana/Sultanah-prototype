import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CreditCard, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye,
  Download,
  Calendar,
  User,
  DollarSign,
  Building2,
  FileText,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Package
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { collection, getDocs, doc, updateDoc, Timestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { processReferralCommission } from '../../../utils/referralProcessor'; // ✅ Import commission processor

interface Payment {
  id: string;
  paymentNumber: string;
  booking: string;
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  paymentMethod: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  ewalletProvider: string;
  phoneNumber: string;
  transferDateTime: any;
  proofOfPayment: string;
  proofFileName: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason: string;
  submittedAt: any;
  reviewedAt: any;
  reviewedBy: string;
  // Payment type fields (from PayNextInstallmentModal)
  paymentType?: 'full' | 'installment';
  totalInstallments?: number;
  currentInstallment?: number;
  paidInstallments?: number;
  totalPackagePrice?: number;
  parentPaymentId?: string;
  parentPaymentNumber?: string;
}

const PaymentManagement: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [expandedPaymentId, setExpandedPaymentId] = useState<string | null>(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    filterPayments();
  }, [payments, searchTerm, statusFilter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const paymentsQuery = query(
        collection(db, 'payments'),
        orderBy('submittedAt', 'desc')
      );
      const paymentsSnapshot = await getDocs(paymentsQuery);
      const paymentsData = paymentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Payment[];
      
      setPayments(paymentsData);
      console.log('📊 Fetched payments:', paymentsData.length);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  const filterPayments = () => {
    let filtered = [...payments];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => payment.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(payment => 
        payment.paymentNumber.toLowerCase().includes(term) ||
        payment.userName.toLowerCase().includes(term) ||
        payment.userEmail.toLowerCase().includes(term) ||
        payment.accountName.toLowerCase().includes(term)
      );
    }

    setFilteredPayments(filtered);
  };

  const handleApprove = async (payment: Payment) => {
    setProcessing(true);
    try {
      const paymentRef = doc(db, 'payments', payment.id);
      await updateDoc(paymentRef, {
        status: 'approved',
        reviewedAt: Timestamp.now(),
        reviewedBy: 'Admin', // In real app, use current admin user
        rejectionReason: '',
      });

      toast.success('Payment approved successfully!');
      fetchPayments();
      setShowDetailDialog(false);
      setShowApproveDialog(false);

      // ✅ NEW: Process referral commission (if user was referred)
      if (payment.userId) {
        console.log('💰 Processing referral commission for userId:', payment.userId);
        const commissionProcessed = await processReferralCommission(payment.userId, payment.id);
        if (commissionProcessed) {
          console.log('✅ Referral commission activated successfully!');
        }
      }
    } catch (error) {
      console.error('Error approving payment:', error);
      toast.error('Failed to approve payment');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPayment) return;
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setProcessing(true);
    try {
      const paymentRef = doc(db, 'payments', selectedPayment.id);
      await updateDoc(paymentRef, {
        status: 'rejected',
        reviewedAt: Timestamp.now(),
        reviewedBy: 'Admin', // In real app, use current admin user
        rejectionReason: rejectionReason.trim(),
      });

      toast.success('Payment rejected');
      setRejectionReason('');
      setShowRejectDialog(false);
      setShowDetailDialog(false);
      fetchPayments();
    } catch (error) {
      console.error('Error rejecting payment:', error);
      toast.error('Failed to reject payment');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
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
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
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

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const stats = {
    total: payments.length,
    pending: payments.filter(p => p.status === 'pending').length,
    approved: payments.filter(p => p.status === 'approved').length,
    rejected: payments.filter(p => p.status === 'rejected').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
              <CreditCard className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Payment Management</h1>
              <p className="text-white/90 text-sm mt-0.5">
                Manage and review payment submissions from jamaah
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 -mt-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Payments</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Pending</p>
            <p className="text-3xl font-bold text-gray-900">{stats.pending}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Approved</p>
            <p className="text-3xl font-bold text-gray-900">{stats.approved}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Rejected</p>
            <p className="text-3xl font-bold text-gray-900">{stats.rejected}</p>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6"
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by payment number, user, or account name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
                <Button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  className={statusFilter === status ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' : ''}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Payments List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8"
        >
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 border-4 border-gray-200 border-t-green-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading payments...</p>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No payments found</h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredPayments.map((payment, index) => {
                const isExpanded = expandedPaymentId === payment.id;
                return (
                  <motion.div
                    key={payment.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {/* Main Row */}
                    <div className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Left: Main Info */}
                        <div className="flex-1 min-w-0">
                          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                            {/* Payment Number & Type */}
                            <div className="min-w-0">
                              <p className="text-xs text-gray-500 mb-1">Payment Number</p>
                              <p className="font-semibold text-gray-900 truncate mb-2">{payment.paymentNumber}</p>
                              {getPaymentTypeBadge(payment)}
                            </div>

                            {/* User */}
                            <div className="min-w-0">
                              <p className="text-xs text-gray-500 mb-1">User</p>
                              <p className="font-medium text-gray-900 truncate">{payment.userName}</p>
                              <p className="text-xs text-gray-500 truncate">{payment.userEmail}</p>
                            </div>

                            {/* Amount & Date */}
                            <div className="min-w-0">
                              <p className="text-xs text-gray-500 mb-1">Amount</p>
                              <p className="font-bold text-green-600 mb-2">
                                Rp {payment.amount.toLocaleString('id-ID')}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatDate(payment.submittedAt)}
                              </p>
                            </div>

                            {/* Status */}
                            <div className="min-w-0">
                              <p className="text-xs text-gray-500 mb-1">Status</p>
                              {getStatusBadge(payment.status)}
                            </div>
                          </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-start gap-2 flex-shrink-0">
                          <Button
                            onClick={() => setExpandedPaymentId(isExpanded ? null : payment.id)}
                            variant="ghost"
                            size="sm"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </Button>
                          
                          {/* Quick Action Buttons for Pending Payments */}
                          {payment.status === 'pending' && (
                            <>
                              <Button
                                onClick={() => {
                                  setSelectedPayment(payment);
                                  setShowApproveDialog(true);
                                }}
                                size="sm"
                                disabled={processing}
                                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                onClick={() => {
                                  setSelectedPayment(payment);
                                  setShowRejectDialog(true);
                                }}
                                size="sm"
                                disabled={processing}
                                variant="outline"
                                className="border-red-200 text-red-600 hover:bg-red-50"
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          
                          <Button
                            onClick={() => {
                              setSelectedPayment(payment);
                              setShowDetailDialog(true);
                            }}
                            variant="outline"
                            size="sm"
                            className="border-blue-200 text-blue-600 hover:bg-blue-50"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mt-4 pt-4 border-t border-gray-100"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500 mb-1">Payment Method</p>
                                <p className="font-medium text-gray-900">{payment.paymentMethod}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 mb-1">Bank Name</p>
                                <p className="font-medium text-gray-900">{payment.bankName || '-'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 mb-1">Account Name</p>
                                <p className="font-medium text-gray-900">{payment.accountName || '-'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 mb-1">Account Number</p>
                                <p className="font-medium text-gray-900">{payment.accountNumber || '-'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 mb-1">Transfer Date & Time</p>
                                <p className="font-medium text-gray-900">{formatDate(payment.transferDateTime)}</p>
                              </div>
                              {payment.status === 'rejected' && payment.rejectionReason && (
                                <div className="md:col-span-3">
                                  <p className="text-gray-500 mb-1">Rejection Reason</p>
                                  <p className="font-medium text-red-600">{payment.rejectionReason}</p>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              Review complete payment information and proof of transfer
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-6">
              {/* Payment Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Payment Number</p>
                  <p className="font-semibold text-gray-900">{selectedPayment.paymentNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Status</p>
                  {getStatusBadge(selectedPayment.status)}
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">User</p>
                  <p className="font-medium text-gray-900">{selectedPayment.userName}</p>
                  <p className="text-sm text-gray-500">{selectedPayment.userEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Amount</p>
                  <p className="font-bold text-green-600 text-xl">
                    Rp {selectedPayment.amount.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>

              {/* Transfer Details */}
              <div className="border-t border-gray-100 pt-6">
                <h3 className="font-semibold text-gray-900 mb-4">Transfer Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Payment Method</p>
                    <p className="font-medium text-gray-900">{selectedPayment.paymentMethod}</p>
                  </div>
                  
                  {/* Bank Transfer specific fields */}
                  {selectedPayment.paymentMethod === 'Bank Transfer' && (
                    <>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Bank Name</p>
                        <p className="font-medium text-gray-900">{selectedPayment.bankName || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Account Number</p>
                        <p className="font-medium text-gray-900">{selectedPayment.accountNumber || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Account Name</p>
                        <p className="font-medium text-gray-900">{selectedPayment.accountName || '-'}</p>
                      </div>
                    </>
                  )}

                  {/* E-Wallet specific fields */}
                  {selectedPayment.paymentMethod === 'E-Wallet' && (
                    <>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">E-Wallet Provider</p>
                        <p className="font-medium text-gray-900">{selectedPayment.ewalletProvider || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Phone Number</p>
                        <p className="font-medium text-gray-900">{selectedPayment.phoneNumber || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Account Name</p>
                        <p className="font-medium text-gray-900">{selectedPayment.accountName || '-'}</p>
                      </div>
                    </>
                  )}
                  
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Transfer Date & Time</p>
                    <p className="font-medium text-gray-900">{formatDate(selectedPayment.transferDateTime)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Submitted At</p>
                    <p className="font-medium text-gray-900">{formatDate(selectedPayment.submittedAt)}</p>
                  </div>
                </div>
              </div>

              {/* Proof of Payment */}
              {selectedPayment.proofOfPayment && (
                <div className="border-t border-gray-100 pt-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Proof of Payment</h3>
                  {selectedPayment.proofOfPayment.startsWith('data:image') ? (
                    <img
                      src={selectedPayment.proofOfPayment}
                      alt="Payment proof"
                      className="max-w-full h-auto rounded-lg border border-gray-200"
                    />
                  ) : (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <p className="text-gray-600">PDF: {selectedPayment.proofFileName}</p>
                      <a
                        href={selectedPayment.proofOfPayment}
                        download={selectedPayment.proofFileName}
                        className="text-green-600 hover:underline text-sm mt-2 inline-block"
                      >
                        <Download className="w-4 h-4 inline mr-1" />
                        Download PDF
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Rejection Reason (if rejected) */}
              {selectedPayment.status === 'rejected' && selectedPayment.rejectionReason && (
                <div className="border-t border-gray-100 pt-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Rejection Reason</h3>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800">{selectedPayment.rejectionReason}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              {selectedPayment.status === 'pending' && (
                <div className="flex gap-3 pt-6 border-t border-gray-100">
                  <Button
                    onClick={() => handleApprove(selectedPayment)}
                    disabled={processing}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Payment
                  </Button>
                  <Button
                    onClick={() => {
                      setShowDetailDialog(false);
                      setShowRejectDialog(true);
                    }}
                    disabled={processing}
                    variant="outline"
                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject Payment
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Payment</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this payment. The user will see this message.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a reason for rejecting this payment..."
                rows={4}
                className="w-full"
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectionReason('');
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReject}
                disabled={processing || !rejectionReason.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {processing ? 'Rejecting...' : 'Confirm Rejection'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Approve Payment Confirmation</DialogTitle>
            <DialogDescription>
              Confirm approval of this payment. The user will be notified of the approval status.
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-700 mb-3">
                  Are you sure you want to approve this payment?
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Payment Number:</span>
                    <span className="font-semibold text-gray-900">{selectedPayment.paymentNumber}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">User:</span>
                    <span className="font-semibold text-gray-900">{selectedPayment.userName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-bold text-green-600">
                      Rp {selectedPayment.amount.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowApproveDialog(false);
                    setSelectedPayment(null);
                  }}
                  variant="outline"
                  className="flex-1"
                  disabled={processing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => selectedPayment && handleApprove(selectedPayment)}
                  disabled={processing}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                >
                  {processing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Approving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      OK, Approve
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentManagement;