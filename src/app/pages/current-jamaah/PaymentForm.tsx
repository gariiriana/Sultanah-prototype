import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  Upload, 
  DollarSign, 
  CreditCard, 
  Building2, 
  User, 
  Calendar,
  FileText,
  CheckCircle,
  AlertCircle,
  Package,
  Smartphone,
  Wallet,
  Calculator,
  TrendingDown
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { collection, addDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { toast } from 'sonner';

interface PaymentFormProps {
  onBack: () => void;
  onViewStatus?: () => void;
  selectedPackage?: any;
}

interface Package {
  id: string;
  name: string;
  price: number;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ onBack, onViewStatus, selectedPackage }) => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState<Package[]>([]);
  const [uploadedProof, setUploadedProof] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');

  const [formData, setFormData] = useState({
    paymentNumber: `PAY${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    booking: selectedPackage?.name || '',
    user: userProfile?.email || '',
    amount: selectedPackage?.price?.toString() || '',
    paymentMethod: 'Bank Transfer',
    paymentType: 'full', // 'full' or 'installment'
    totalInstallments: 1,
    currentInstallment: 1,
    // Bank Transfer fields
    bankName: '',
    accountNumber: '',
    accountName: '',
    // E-Wallet fields
    ewalletProvider: '',
    phoneNumber: '',
    transferDateTime: '',
  });

  useEffect(() => {
    if (!selectedPackage) {
      fetchPackages();
    }
  }, [selectedPackage]);

  const fetchPackages = async () => {
    try {
      const packagesSnapshot = await getDocs(collection(db, 'packages'));
      const packagesData = packagesSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        price: doc.data().price,
      }));
      setPackages(packagesData);
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload JPG, PNG, or PDF.');
      return;
    }

    // Validate file size (max 5MB)
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

    // Validation
    if (!formData.booking) {
      toast.error('Please select a booking package');
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
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
      const paymentData = {
        paymentNumber: formData.paymentNumber,
        booking: formData.booking,
        userId: userProfile?.id || userProfile?.email,
        userEmail: userProfile?.email,
        userName: userProfile?.displayName || 'Unknown',
        amount: parseFloat(formData.amount),
        paymentMethod: formData.paymentMethod,
        paymentType: formData.paymentType,
        totalInstallments: formData.totalInstallments,
        currentInstallment: formData.currentInstallment,
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        accountName: formData.accountName,
        ewalletProvider: formData.ewalletProvider,
        phoneNumber: formData.phoneNumber,
        transferDateTime: Timestamp.fromDate(new Date(formData.transferDateTime)),
        proofOfPayment: uploadedProof,
        proofFileName: uploadedFileName,
        status: 'pending', // pending, approved, rejected
        rejectionReason: '',
        submittedAt: Timestamp.now(),
        reviewedAt: null,
        reviewedBy: '',
      };

      console.log('Submitting payment data:', paymentData);
      const docRef = await addDoc(collection(db, 'payments'), paymentData);
      console.log('Payment submitted with ID:', docRef.id);

      toast.success('Pembayaran berhasil diajukan! Mengarahkan ke Pesanan Saya...');

      // Reset form
      setFormData({
        paymentNumber: `PAY${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        booking: '',
        user: userProfile?.email || '',
        amount: '',
        paymentMethod: 'Bank Transfer',
        paymentType: 'full',
        totalInstallments: 1,
        currentInstallment: 1,
        bankName: '',
        accountNumber: '',
        accountName: '',
        ewalletProvider: '',
        phoneNumber: '',
        transferDateTime: '',
      });
      setUploadedProof('');
      setUploadedFileName('');

      // ✅ Redirect to "Pesanan Saya" page after 1.5 seconds
      setTimeout(() => {
        if (onViewStatus) {
          onViewStatus(); // Redirects to Pesanan Saya page
        } else {
          onBack();
        }
      }, 1500);
    } catch (error) {
      console.error('Error submitting payment:', error);
      toast.error('Failed to submit payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-[#FFF9F0]">
      {/* Hero Section with Mecca Background */}
      <div 
        className="relative h-[300px] md:h-[350px] bg-cover bg-center"
        style={{ 
          backgroundImage: `url(https://images.unsplash.com/photo-1704104501136-8f35402af395?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWNjYSUyMGthYWJhJTIwbW9zcXVlJTIwZ29sZGVuJTIwaG91cnxlbnwxfHx8fDE3NjcxOTA5NTZ8MA&ixlib=rb-4.1.0&q=80&w=1080)` 
        }}
      >
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70"></div>
        
        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-between max-w-4xl mx-auto px-6 py-8">
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
              Konfirmasi Pembayaran
            </h1>
            <p className="text-base md:text-lg text-white/90 drop-shadow-md max-w-2xl mx-auto">
              Isi detail pembayaran Anda dan upload bukti transfer untuk melanjutkan proses booking paket umrah
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-12 pb-12 relative z-20">
        {/* Form */}
        <motion.form 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
        >
          {/* Payment Information Section */}
          <div className="p-8 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Payment Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Payment Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment number
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.paymentNumber}
                    disabled
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                  />
                </div>
              </div>

              {/* Booking */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paket yang Dipilih <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  {selectedPackage ? (
                    <input
                      type="text"
                      value={formData.booking}
                      disabled
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 font-semibold"
                    />
                  ) : (
                    <select
                      value={formData.booking}
                      onChange={(e) => setFormData({ ...formData, booking: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent appearance-none bg-white"
                      required
                    >
                      <option value="">Select an option</option>
                      {packages.map((pkg) => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.name} - Rp {pkg.price.toLocaleString('id-ID')}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                {selectedPackage && (
                  <p className="mt-1 text-xs text-gray-500">
                    ✓ Paket sudah dipilih dari halaman detail
                  </p>
                )}
              </div>

              {/* User */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={userProfile?.displayName || userProfile?.email || ''}
                    disabled
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                  />
                </div>
              </div>

              {/* Payment Type */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Tipe Pembayaran <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {/* Full Payment Option */}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, paymentType: 'full', totalInstallments: 1, currentInstallment: 1 })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      formData.paymentType === 'full'
                        ? 'border-[#D4AF37] bg-[#D4AF37]/5'
                        : 'border-gray-200 hover:border-[#D4AF37]/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        formData.paymentType === 'full' ? 'bg-[#D4AF37]/20' : 'bg-gray-100'
                      }`}>
                        <DollarSign className={`w-6 h-6 ${
                          formData.paymentType === 'full' ? 'text-[#D4AF37]' : 'text-gray-500'
                        }`} />
                      </div>
                      <div className="text-left">
                        <p className={`font-semibold ${
                          formData.paymentType === 'full' ? 'text-[#D4AF37]' : 'text-gray-900'
                        }`}>
                          Bayar Penuh
                        </p>
                        <p className="text-sm text-gray-500">Lunas sekali bayar</p>
                      </div>
                    </div>
                  </button>

                  {/* Installment Option */}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, paymentType: 'installment', totalInstallments: 3, currentInstallment: 1 })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      formData.paymentType === 'installment'
                        ? 'border-[#D4AF37] bg-[#D4AF37]/5'
                        : 'border-gray-200 hover:border-[#D4AF37]/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        formData.paymentType === 'installment' ? 'bg-[#D4AF37]/20' : 'bg-gray-100'
                      }`}>
                        <Calculator className={`w-6 h-6 ${
                          formData.paymentType === 'installment' ? 'text-[#D4AF37]' : 'text-gray-500'
                        }`} />
                      </div>
                      <div className="text-left">
                        <p className={`font-semibold ${
                          formData.paymentType === 'installment' ? 'text-[#D4AF37]' : 'text-gray-900'
                        }`}>
                          Cicilan
                        </p>
                        <p className="text-sm text-gray-500">Bayar bertahap</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Installment Options - Show only if installment selected */}
              {formData.paymentType === 'installment' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Jumlah Cicilan <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Calculator className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <select
                        value={formData.totalInstallments}
                        onChange={(e) => setFormData({ ...formData, totalInstallments: parseInt(e.target.value), currentInstallment: 1 })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent appearance-none bg-white"
                        required
                      >
                        <option value={2}>2x Cicilan</option>
                        <option value={3}>3x Cicilan</option>
                        <option value={4}>4x Cicilan</option>
                        <option value={5}>5x Cicilan</option>
                        <option value={6}>6x Cicilan</option>
                        <option value={12}>12x Cicilan</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cicilan Ke-
                    </label>
                    <div className="relative">
                      <TrendingDown className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <select
                        value={formData.currentInstallment}
                        onChange={(e) => setFormData({ ...formData, currentInstallment: parseInt(e.target.value) })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent appearance-none bg-white"
                        required
                      >
                        {Array.from({ length: formData.totalInstallments }, (_, i) => i + 1).map(num => (
                          <option key={num} value={num}>Cicilan ke-{num}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Installment Calculator Info */}
                  {selectedPackage && selectedPackage.price > 0 && (
                    <div className="md:col-span-2">
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Calculator className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-blue-900 mb-2">Rincian Cicilan</p>
                            <div className="space-y-1.5 text-sm">
                              <div className="flex justify-between">
                                <span className="text-blue-700">Total Harga Paket:</span>
                                <span className="font-semibold text-blue-900">Rp {selectedPackage.price.toLocaleString('id-ID')}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-blue-700">Cicilan per Bulan:</span>
                                <span className="font-semibold text-blue-900">
                                  Rp {Math.ceil(selectedPackage.price / formData.totalInstallments).toLocaleString('id-ID')}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-blue-700">Sudah Dibayar:</span>
                                <span className="font-semibold text-blue-900">
                                  Rp {(Math.ceil(selectedPackage.price / formData.totalInstallments) * (formData.currentInstallment - 1)).toLocaleString('id-ID')}
                                </span>
                              </div>
                              <div className="border-t border-blue-200 pt-1.5 flex justify-between">
                                <span className="text-blue-700 font-medium">Sisa Pembayaran:</span>
                                <span className="font-bold text-blue-900">
                                  Rp {Math.max(0, selectedPackage.price - (Math.ceil(selectedPackage.price / formData.totalInstallments) * formData.currentInstallment)).toLocaleString('id-ID')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Amount */}
              <div className={formData.paymentType === 'full' ? 'md:col-span-2' : 'md:col-span-2'}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jumlah Pembayaran <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 font-medium">
                    Rp
                  </div>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0"
                    disabled={!!selectedPackage}
                    className={`w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent ${
                      selectedPackage ? 'bg-gray-50 text-gray-600 font-semibold' : ''
                    }`}
                    required
                  />
                </div>
                {selectedPackage && (
                  <p className="mt-1 text-xs text-gray-500">
                    ✓ Harga paket sudah otomatis terisi
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Transfer Details Section */}
          <div className="p-8 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Transfer Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Payment Method */}
              <div className={formData.paymentMethod === 'Bank Transfer' ? '' : 'md:col-span-2'}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment method <span className="text-red-500">*</span>
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
                <>
                  {/* Bank Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bank name <span className="text-red-500">*</span>
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

                  {/* Account Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.accountNumber}
                      onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                      placeholder="Account number used for transfer"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Account Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account name <span className="text-red-500">*</span>
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
                </>
              )}

              {/* E-Wallet Fields */}
              {formData.paymentMethod === 'E-Wallet' && (
                <>
                  {/* E-Wallet Provider */}
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

                  {/* Phone Number */}
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

                  {/* Account Name for E-Wallet */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account name <span className="text-red-500">*</span>
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
                </>
              )}

              {/* Transfer Date & Time */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transfer Date & Time
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="datetime-local"
                    value={formData.transferDateTime}
                    onChange={(e) => setFormData({ ...formData, transferDateTime: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Proof of Payment Section */}
          <div className="p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Proof of Payment</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Proof <span className="text-red-500">*</span>
              </label>

              {!uploadedProof ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-[#D4AF37] transition-colors">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept="image/jpeg,image/png,image/jpg,application/pdf"
                    onChange={handleFileUpload}
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
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
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{uploadedFileName}</p>
                        <p className="text-sm text-gray-500">File uploaded successfully</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setUploadedProof('');
                        setUploadedFileName('');
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Remove
                    </Button>
                  </div>

                  {/* Preview if image */}
                  {uploadedProof.startsWith('data:image') && (
                    <div className="mt-4">
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
          </div>

          {/* Submit Button */}
          <div className="p-8 bg-gray-50 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <AlertCircle className="w-4 h-4" />
                <span>All fields marked with * are required</span>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-[#C5A572] to-[#D4AF37] text-white px-8 py-3 rounded-lg shadow-md hover:shadow-lg disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Payment'}
              </Button>
            </div>
          </div>
        </motion.form>
      </div>
    </div>
  );
};

export default PaymentForm;