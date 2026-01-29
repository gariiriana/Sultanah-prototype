import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Upload, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Calendar,
  Building2,
  User,
  Smartphone,
  Wallet,
  CreditCard,
  X
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { toast } from 'sonner';
import { useAuth } from '../../../contexts/AuthContext';

interface Payment {
  id: string;
  paymentNumber: string;
  booking: string;
  amount: number;
  paymentType?: 'full' | 'installment';
  totalInstallments?: number;
  currentInstallment?: number;
  paidInstallments?: number;
  totalPackagePrice?: number;
}

interface PayNextInstallmentModalProps {
  payment: Payment;
  onClose: () => void;
  onSuccess: () => void;
}

const PayNextInstallmentModal: React.FC<PayNextInstallmentModalProps> = ({ 
  payment, 
  onClose, 
  onSuccess 
}) => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadedProof, setUploadedProof] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');

  const nextInstallment = (payment.paidInstallments || 0) + 1;
  const totalPackagePrice = payment.totalPackagePrice || payment.amount * (payment.totalInstallments || 1);
  const installmentAmount = Math.ceil(totalPackagePrice / (payment.totalInstallments || 1));
  const alreadyPaid = installmentAmount * (payment.paidInstallments || 0);
  const remainingAfterThis = totalPackagePrice - (installmentAmount * nextInstallment);

  const [formData, setFormData] = useState({
    paymentMethod: 'Bank Transfer',
    bankName: '',
    accountNumber: '',
    accountName: '',
    ewalletProvider: '',
    phoneNumber: '',
    transferDateTime: '',
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload JPG, PNG, or PDF.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size too large. Maximum 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedProof(reader.result as string);
      setUploadedFileName(file.name);
      toast.success('File uploaded successfully!');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.paymentMethod === 'Bank Transfer' && (!formData.bankName || !formData.accountNumber || !formData.accountName)) {
      toast.error('Please fill in all transfer details');
      return;
    }
    if (formData.paymentMethod === 'E-Wallet' && (!formData.ewalletProvider || !formData.phoneNumber)) {
      toast.error('Please fill in all e-wallet details');
      return;
    }
    if (!formData.transferDateTime) {
      toast.error('Please select transfer date & time');
      return;
    }
    if (!uploadedProof) {
      toast.error('Please upload proof of payment');
      return;
    }

    setLoading(true);

    try {
      const newPaymentNumber = `PAY${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      
      const paymentData = {
        paymentNumber: newPaymentNumber,
        booking: payment.booking,
        userId: userProfile?.id || userProfile?.email,
        userEmail: userProfile?.email,
        userName: userProfile?.displayName || 'Unknown',
        amount: installmentAmount,
        paymentMethod: formData.paymentMethod,
        paymentType: 'installment',
        totalInstallments: payment.totalInstallments,
        currentInstallment: nextInstallment,
        paidInstallments: payment.paidInstallments || 0,
        totalPackagePrice: totalPackagePrice,
        parentPaymentId: payment.id, // Link to original payment
        parentPaymentNumber: payment.paymentNumber,
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        accountName: formData.accountName,
        ewalletProvider: formData.ewalletProvider,
        phoneNumber: formData.phoneNumber,
        transferDateTime: Timestamp.fromDate(new Date(formData.transferDateTime)),
        proofOfPayment: uploadedProof,
        proofFileName: uploadedFileName,
        status: 'pending',
        rejectionReason: '',
        submittedAt: Timestamp.now(),
        reviewedAt: null,
        reviewedBy: '',
      };

      await addDoc(collection(db, 'payments'), paymentData);

      toast.success('Pembayaran cicilan berhasil diajukan!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error submitting installment payment:', error);
      toast.error('Failed to submit payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#C5A572] to-[#D4AF37] p-6 text-white flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">Bayar Cicilan Berikutnya</h2>
            <p className="text-white/90 text-sm">Cicilan ke-{nextInstallment} dari {payment.totalInstallments}</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Installment Info Card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-blue-900 mb-3">Rincian Cicilan</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Total Harga Paket:</span>
                    <span className="font-semibold text-blue-900">Rp {totalPackagePrice.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Cicilan per Bulan:</span>
                    <span className="font-semibold text-blue-900">Rp {installmentAmount.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Sudah Dibayar ({payment.paidInstallments || 0}x):</span>
                    <span className="font-semibold text-blue-900">Rp {alreadyPaid.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="border-t border-blue-200 pt-2 flex justify-between">
                    <span className="text-blue-700 font-medium">Pembayaran Sekarang:</span>
                    <span className="font-bold text-blue-900 text-lg">Rp {installmentAmount.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Sisa Setelah Pembayaran Ini:</span>
                    <span className="font-semibold text-blue-900">Rp {Math.max(0, remainingAfterThis).toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-blue-700 mb-1">
                    <span>Progress Cicilan</span>
                    <span>{nextInstallment} / {payment.totalInstallments}</span>
                  </div>
                  <div className="w-full h-2 bg-blue-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 transition-all duration-500"
                      style={{ width: `${(nextInstallment / (payment.totalInstallments || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Package Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paket
            </label>
            <input
              type="text"
              value={payment.booking}
              disabled
              className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 font-semibold"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent appearance-none bg-white"
                required
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="E-Wallet">E-Wallet</option>
              </select>
            </div>
          </div>

          {/* Bank Transfer Fields */}
          {formData.paymentMethod === 'Bank Transfer' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    placeholder="e.g., BCA, Mandiri, BNI"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  placeholder="Account number"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.accountName}
                  onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                  placeholder="Account holder name"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                  required
                />
              </div>
            </div>
          )}

          {/* E-Wallet Fields */}
          {formData.paymentMethod === 'E-Wallet' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-Wallet Provider <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    value={formData.ewalletProvider}
                    onChange={(e) => setFormData({ ...formData, ewalletProvider: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent appearance-none bg-white"
                    required
                  >
                    <option value="">Select provider</option>
                    <option value="GoPay">GoPay</option>
                    <option value="OVO">OVO</option>
                    <option value="Dana">Dana</option>
                    <option value="ShopeePay">ShopeePay</option>
                    <option value="LinkAja">LinkAja</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    placeholder="08xxxxxxxxxx"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.accountName}
                    onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                    placeholder="Account holder name"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Transfer Date & Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transfer Date & Time <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="datetime-local"
                value={formData.transferDateTime}
                onChange={(e) => setFormData({ ...formData, transferDateTime: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Upload Proof */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Proof of Payment <span className="text-red-500">*</span>
            </label>

            {!uploadedProof ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#D4AF37] transition-colors">
                <input
                  type="file"
                  id="proof-upload"
                  className="hidden"
                  accept="image/jpeg,image/png,image/jpg,application/pdf"
                  onChange={handleFileUpload}
                />
                <label htmlFor="proof-upload" className="cursor-pointer">
                  <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-1">
                    Drag & Drop your files or{' '}
                    <span className="text-[#D4AF37] font-semibold">Browse</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports: JPG, PNG, PDF (max 5MB)
                  </p>
                </label>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{uploadedFileName}</p>
                      <p className="text-xs text-gray-500">File uploaded successfully</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setUploadedProof('');
                      setUploadedFileName('');
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Remove
                  </Button>
                </div>

                {uploadedProof.startsWith('data:image') && (
                  <div className="mt-3">
                    <img
                      src={uploadedProof}
                      alt="Payment proof"
                      className="max-w-full h-auto rounded-lg border border-gray-200"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-[#C5A572] to-[#D4AF37] text-white"
            >
              {loading ? 'Submitting...' : 'Submit Payment'}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default PayNextInstallmentModal;
