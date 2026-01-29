import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../components/ui/dialog';
import { Textarea } from '../../../components/ui/textarea';
import { Label } from '../../../components/ui/label';
import { Wallet, Check, X, Eye, DollarSign, Users, TrendingUp, Upload, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { collection, getDocs, doc, updateDoc, Timestamp, getDoc, query, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import { db, storage } from '../../../../config/firebase';
import { toast } from 'sonner';
import imageCompression from 'browser-image-compression';
import { recalculateAllBalances } from '../../../../utils/balanceRecalculator';

interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userType: 'alumni' | 'agen';
  amount: number;
  status: 'pending' | 'confirmed' | 'rejected'; // ✅ Changed 'approved' to 'confirmed'
  requestDate: Date;
  processedDate?: Date;
  processedBy?: string;
  note?: string;
  transferProofUrl?: string; // ✅ Bukti transfer
  bankName?: string; // ✅ Info rekening
  accountNumber?: string;
  accountName?: string;
  // E-wallet fields
  ewalletProvider?: string;
  ewalletNumber?: string;
  ewalletAccountName?: string;
  paymentMethod?: 'bank' | 'ewallet';
}

const CommissionWithdrawalManagement: React.FC = () => {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [note, setNote] = useState('');
  const [processing, setProcessing] = useState(false);
  
  // ✅ File upload states
  const [transferProofFile, setTransferProofFile] = useState<File | null>(null);
  const [transferProofPreview, setTransferProofPreview] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  
  // ✅ Fix balance state
  const [fixingBalance, setFixingBalance] = useState(false);
  const [needsBalanceFix, setNeedsBalanceFix] = useState(false);

  useEffect(() => {
    loadWithdrawals();
  }, []);

  useEffect(() => {
    // Check if there are any pending/rejected withdrawals that might need balance fix
    const problematicWithdrawals = withdrawals.filter(
      w => w.status === 'pending' || w.status === 'rejected'
    );
    setNeedsBalanceFix(problematicWithdrawals.length > 0);
  }, [withdrawals]);

  const loadWithdrawals = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'commissionWithdrawals'));
      
      const withdrawalList: WithdrawalRequest[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        
        // ✅ BACKWARD COMPATIBILITY: Convert old status to new format
        let status = data.status;
        if (status === 'approved') {
          status = 'confirmed';
        }
        
        return {
          id: doc.id,
          ...data,
          status, // Use converted status
          requestDate: data.requestDate?.toDate() || new Date(),
          processedDate: data.processedDate?.toDate(),
        } as WithdrawalRequest;
      });

      setWithdrawals(withdrawalList.sort((a, b) => b.requestDate.getTime() - a.requestDate.getTime()));
    } catch (error) {
      console.error('Error loading withdrawals:', error);
      toast.error('Gagal memuat data pencairan');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle file upload with AGGRESSIVE compression for speed!
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Hanya file gambar yang diperbolehkan');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB');
      return;
    }

    // Show compression toast
    const startTime = Date.now();
    toast.loading('Memproses gambar...', { id: 'compress' });

    try {
      // ✅ AGGRESSIVE COMPRESSION for base64 storage!
      const options = {
        maxSizeMB: 0.15,        // 150KB - perfect for base64!
        maxWidthOrHeight: 640,   // 640px cukup jelas
        useWebWorker: true,
        fileType: 'image/jpeg',
        initialQuality: 0.65,    // Lower for speed
        maxIteration: 2,         // FAST processing
      };
      
      const compressedFile = await imageCompression(file, options);
      const compressedSizeKB = (compressedFile.size / 1024).toFixed(0);
      const compressionTime = ((Date.now() - startTime) / 1000).toFixed(1);
      
      toast.success(`Siap! ${compressedSizeKB}KB (${compressionTime}s) ⚡`, { id: 'compress' });
      
      setTransferProofFile(compressedFile);
      
      // Create preview (async, non-blocking)
      const reader = new FileReader();
      reader.onloadend = () => {
        setTransferProofPreview(reader.result as string);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error('Error compressing image:', error);
      toast.error('Gagal memproses gambar', { id: 'compress' });
      
      // Fallback: use original file
      setTransferProofFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setTransferProofPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // ✅ Convert to base64 - NO FIREBASE STORAGE NEEDED!
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleApprove = async () => {
    if (!selectedWithdrawal) return;

    try {
      setProcessing(true);

      // ✅ Convert image to base64 if file is selected (NO FIREBASE STORAGE!)
      let transferProofBase64 = null;
      if (transferProofFile) {
        try {
          toast.loading('Menyimpan bukti transfer...', { id: 'save-proof' });
          transferProofBase64 = await convertToBase64(transferProofFile);
          toast.success('Bukti transfer siap!', { id: 'save-proof' });
        } catch (error: any) {
          console.error('Failed to convert image:', error);
          toast.error('Gagal menyimpan bukti transfer', { id: 'save-proof' });
          
          // Ask user if they want to continue without proof
          const continueWithoutProof = window.confirm(
            'Gagal menyimpan bukti transfer. Apakah Anda ingin tetap menyetujui pencairan tanpa bukti transfer?\n\n' +
            'Klik OK untuk melanjutkan tanpa bukti, atau Cancel untuk membatalkan approval.'
          );
          
          if (!continueWithoutProof) {
            setProcessing(false);
            return;
          }
          
          toast.info('Melanjutkan approval tanpa bukti transfer');
        }
      }

      console.log('🔍 Starting approval process for:', selectedWithdrawal);

      // ✅ 1. Update withdrawal status to CONFIRMED
      const updateData: any = {
        status: 'confirmed',
        processedDate: Timestamp.now(),
        note: note || 'Disetujui',
      };

      // ✅ Add transfer proof as base64 if available
      if (transferProofBase64) {
        updateData.transferProofUrl = transferProofBase64;
      }

      await updateDoc(doc(db, 'commissionWithdrawals', selectedWithdrawal.id), updateData);
      console.log('✅ Withdrawal status updated to CONFIRMED');

      // ✅ 2. KURANGI BALANCE saat approve!
      // Cek referralBalances untuk user ini
      const balanceRef = doc(db, 'referralBalances', selectedWithdrawal.userId);
      const balanceSnap = await getDoc(balanceRef);

      if (balanceSnap.exists()) {
        const currentBalance = balanceSnap.data().balance || 0;
        const currentTotalWithdrawn = balanceSnap.data().totalWithdrawn || 0;

        // Validasi: pastikan balance cukup
        if (currentBalance >= selectedWithdrawal.amount) {
          // Update: kurangi balance, tambah totalWithdrawn
          await updateDoc(balanceRef, {
            balance: currentBalance - selectedWithdrawal.amount,
            totalWithdrawn: currentTotalWithdrawn + selectedWithdrawal.amount,
            lastWithdrawalDate: Timestamp.now(),
          });
          console.log(`✅ Balance reduced: ${currentBalance} → ${currentBalance - selectedWithdrawal.amount}`);
          console.log(`✅ Total withdrawn increased: ${currentTotalWithdrawn} → ${currentTotalWithdrawn + selectedWithdrawal.amount}`);
        } else {
          console.warn('⚠️ WARNING: Insufficient balance, but continuing approval');
          toast.warning('Balance tidak cukup, tapi approval tetap dilanjutkan');
        }
      } else {
        console.warn('⚠️ WARNING: No balance document found for user');
        toast.warning('Balance document tidak ditemukan');
      }

      toast.success('Pencairan komisi berhasil disetujui!');
      setShowApproveDialog(false);
      setSelectedWithdrawal(null);
      setNote('');
      setTransferProofFile(null);
      setTransferProofPreview(null);
      loadWithdrawals();
    } catch (error) {
      console.error('❌ Error approving withdrawal:', error);
      toast.error('Gagal menyetujui pencairan');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedWithdrawal || !note) {
      toast.error('Catatan penolakan wajib diisi');
      return;
    }

    try {
      setProcessing(true);

      // ✅ Simply update status to rejected
      // ✅ NO NEED to refund balance because balance was NEVER deducted!
      await updateDoc(doc(db, 'commissionWithdrawals', selectedWithdrawal.id), {
        status: 'rejected',
        processedDate: Timestamp.now(),
        note: note,
      });

      console.log('✅ Withdrawal rejected (no refund needed - balance was never deducted)');

      toast.success('Pencairan komisi ditolak');
      setShowRejectDialog(false);
      setSelectedWithdrawal(null);
      setNote('');
      loadWithdrawals();
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
      toast.error('Gagal menolak pencairan');
    } finally {
      setProcessing(false);
    }
  };

  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');
  const approvedWithdrawals = withdrawals.filter(w => w.status === 'confirmed');
  const rejectedWithdrawals = withdrawals.filter(w => w.status === 'rejected');

  const totalPending = pendingWithdrawals.reduce((sum, w) => sum + w.amount, 0);
  const totalApproved = approvedWithdrawals.reduce((sum, w) => sum + w.amount, 0);

  // ✅ Handle balance recalculation
  const handleRecalculateBalances = async () => {
    if (!window.confirm(
      '⚠️ PERHATIAN: Ini akan recalculate semua balance berdasarkan withdrawal yang CONFIRMED.\n\n' +
      'Balance akan dihitung ulang dengan formula:\n' +
      'Balance = Total Earnings - Total Confirmed Withdrawals\n\n' +
      'Lanjutkan?'
    )) {
      return;
    }

    try {
      setFixingBalance(true);
      toast.loading('Recalculating balances...', { id: 'recalculate' });

      const result = await recalculateAllBalances();

      if (result.success) {
        toast.success(
          `✅ Berhasil recalculate ${result.results.length} user balance!`,
          { id: 'recalculate', duration: 5000 }
        );

        // Show detailed results in console
        console.log('📊 Recalculation Results:');
        console.table(result.results.map(r => ({
          User: r.userName,
          Type: r.userType,
          'Old Balance': r.oldBalance.toLocaleString('id-ID'),
          'New Balance': r.newBalance.toLocaleString('id-ID'),
          'Adjustment': r.adjustmentAmount.toLocaleString('id-ID'),
          'Total Earnings': r.totalEarnings.toLocaleString('id-ID'),
        })));

        // Reload data
        loadWithdrawals();
      } else {
        toast.error(`Gagal recalculate: ${result.error}`, { id: 'recalculate' });
      }
    } catch (error) {
      console.error('Error recalculating balances:', error);
      toast.error('Terjadi kesalahan saat recalculate', { id: 'recalculate' });
    } finally {
      setFixingBalance(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ✅ Fix Balance Alert Banner */}
      {needsBalanceFix && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <RefreshCw className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 mb-1">
                Ada {pendingWithdrawals.length + rejectedWithdrawals.length} withdrawal pending/rejected
              </h3>
              <p className="text-sm text-amber-700 mb-3">
                Jika balance user salah (karena sistem lama), klik tombol di bawah untuk recalculate semua balance berdasarkan withdrawal yang confirmed.
              </p>
              <Button
                onClick={handleRecalculateBalances}
                disabled={fixingBalance}
                className="bg-amber-600 hover:bg-amber-700"
                size="sm"
              >
                {fixingBalance ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Recalculating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Recalculate All Balances
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-t-4 border-t-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-amber-600">
                  Rp {totalPending.toLocaleString('id-ID')}
                </div>
                <p className="text-sm text-slate-500 mt-1">{pendingWithdrawals.length} permintaan</p>
              </div>
              <Wallet className="w-10 h-10 text-amber-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Disetujui</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  Rp {totalApproved.toLocaleString('id-ID')}
                </div>
                <p className="text-sm text-slate-500 mt-1">{approvedWithdrawals.length} pencairan</p>
              </div>
              <DollarSign className="w-10 h-10 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Pencairan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">{withdrawals.length}</div>
                <p className="text-sm text-slate-500 mt-1">permintaan total</p>
              </div>
              <TrendingUp className="w-10 h-10 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Withdrawal List */}
      <Card>
        <CardHeader>
          <CardTitle>Manajemen Pencairan Komisi</CardTitle>
          <CardDescription>Kelola permintaan pencairan komisi dari alumni dan agen</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="pending">
                Pending ({pendingWithdrawals.length})
              </TabsTrigger>
              <TabsTrigger value="approved">
                Disetujui ({approvedWithdrawals.length})
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Ditolak ({rejectedWithdrawals.length})
              </TabsTrigger>
            </TabsList>

            {/* Pending Tab */}
            <TabsContent value="pending">
              {pendingWithdrawals.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Wallet className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Tidak ada permintaan pencairan pending</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingWithdrawals.map((withdrawal) => (
                    <div
                      key={withdrawal.id}
                      className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <p className="font-semibold text-lg">{withdrawal.userName}</p>
                            <Badge className="bg-blue-100 text-blue-700">
                              {withdrawal.userType === 'agen' ? 'Agen' : 'Alumni'}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 mb-1">{withdrawal.userEmail}</p>
                          <div className="flex items-center gap-4 mt-3">
                            <div>
                              <p className="text-xs text-slate-500">Jumlah</p>
                              <p className="text-xl font-bold text-green-600">
                                Rp {withdrawal.amount.toLocaleString('id-ID')}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Tanggal Pengajuan</p>
                              <p className="text-sm text-slate-700">
                                {withdrawal.requestDate.toLocaleDateString('id-ID')}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => {
                              setSelectedWithdrawal(withdrawal);
                              setShowDetailDialog(true);
                            }}
                            variant="outline"
                            size="sm"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => {
                              setSelectedWithdrawal(withdrawal);
                              setShowApproveDialog(true);
                            }}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Setujui
                          </Button>
                          <Button
                            onClick={() => {
                              setSelectedWithdrawal(withdrawal);
                              setShowRejectDialog(true);
                            }}
                            size="sm"
                            variant="destructive"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Tolak
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Approved Tab */}
            <TabsContent value="approved">
              {approvedWithdrawals.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Check className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Belum ada pencairan yang disetujui</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {approvedWithdrawals.map((withdrawal) => (
                    <div
                      key={withdrawal.id}
                      className="border border-green-200 bg-green-50/50 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <p className="font-semibold">{withdrawal.userName}</p>
                            <Badge className="bg-blue-100 text-blue-700">
                              {withdrawal.userType === 'agen' ? 'Agen' : 'Alumni'}
                            </Badge>
                            <Badge className="bg-green-100 text-green-700">Disetujui</Badge>
                          </div>
                          <p className="text-sm text-slate-600 mb-1">{withdrawal.userEmail}</p>
                          <div className="flex items-center gap-4 mt-3">
                            <div>
                              <p className="text-xs text-slate-500">Jumlah</p>
                              <p className="font-bold text-green-600">
                                Rp {withdrawal.amount.toLocaleString('id-ID')}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Diproses</p>
                              <p className="text-sm text-slate-700">
                                {withdrawal.processedDate?.toLocaleDateString('id-ID')}
                              </p>
                            </div>
                          </div>
                          {withdrawal.note && (
                            <p className="text-sm text-slate-600 mt-2 italic">Catatan: {withdrawal.note}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Rejected Tab */}
            <TabsContent value="rejected">
              {rejectedWithdrawals.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <X className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Tidak ada pencairan yang ditolak</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rejectedWithdrawals.map((withdrawal) => (
                    <div
                      key={withdrawal.id}
                      className="border border-red-200 bg-red-50/50 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <p className="font-semibold">{withdrawal.userName}</p>
                            <Badge className="bg-blue-100 text-blue-700">
                              {withdrawal.userType === 'agen' ? 'Agen' : 'Alumni'}
                            </Badge>
                            <Badge className="bg-red-100 text-red-700">Ditolak</Badge>
                          </div>
                          <p className="text-sm text-slate-600 mb-1">{withdrawal.userEmail}</p>
                          <div className="flex items-center gap-4 mt-3">
                            <div>
                              <p className="text-xs text-slate-500">Jumlah</p>
                              <p className="font-bold text-slate-700">
                                Rp {withdrawal.amount.toLocaleString('id-ID')}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Ditolak</p>
                              <p className="text-sm text-slate-700">
                                {withdrawal.processedDate?.toLocaleDateString('id-ID')}
                              </p>
                            </div>
                          </div>
                          {withdrawal.note && (
                            <p className="text-sm text-red-700 mt-2 font-medium">
                              Alasan: {withdrawal.note}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Setujui Pencairan Komisi</DialogTitle>
            <DialogDescription>
              Konfirmasi persetujuan pencairan komisi untuk {selectedWithdrawal?.userName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Info Summary */}
            <div className="bg-slate-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Nama:</span>
                <span className="font-semibold">{selectedWithdrawal?.userName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Jumlah:</span>
                <span className="font-bold text-green-600">
                  Rp {selectedWithdrawal?.amount.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Tipe:</span>
                <span className="font-semibold">
                  {selectedWithdrawal?.userType === 'agen' ? 'Agen' : 'Alumni'}
                </span>
              </div>
            </div>

            {/* Bank Account Info */}
            {selectedWithdrawal?.bankName && (
              <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Bank:</span>
                  <span className="font-semibold uppercase">{selectedWithdrawal.bankName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">No. Rekening:</span>
                  <span className="font-mono font-semibold">{selectedWithdrawal.accountNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Atas Nama:</span>
                  <span className="font-semibold">{selectedWithdrawal.accountName}</span>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="note">Catatan (Opsional)</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Tambahkan catatan..."
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Upload Bukti Transfer */}
            <div className="space-y-2">
              <Label htmlFor="transfer-proof">Bukti Transfer (Opsional)</Label>
              <p className="text-xs text-slate-500">Upload bukti transfer untuk dokumentasi</p>
              
              {/* Upload Button & Preview */}
              <div className="space-y-3">
                {!transferProofPreview ? (
                  <label
                    htmlFor="transfer-proof"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 text-slate-400 mb-2" />
                      <p className="text-sm text-slate-600">
                        <span className="font-semibold">Klik untuk upload</span> atau drag & drop
                      </p>
                      <p className="text-xs text-slate-500 mt-1">PNG, JPG max 5MB</p>
                    </div>
                    <input
                      id="transfer-proof"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={processing}
                    />
                  </label>
                ) : (
                  <div className="relative border-2 border-slate-200 rounded-lg p-2">
                    <img
                      src={transferProofPreview}
                      alt="Preview Bukti Transfer"
                      className="w-full h-auto rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setTransferProofFile(null);
                        setTransferProofPreview(null);
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      disabled={processing}
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="mt-2 text-xs text-slate-600 flex items-center gap-1">
                      <ImageIcon className="w-4 h-4" />
                      <span className="truncate">{transferProofFile?.name}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowApproveDialog(false);
                setNote('');
                setTransferProofFile(null);
                setTransferProofPreview(null);
              }}
              className="flex-1"
              disabled={processing}
            >
              Batal
            </Button>
            <Button
              onClick={handleApprove}
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={processing || uploadingFile}
            >
              {processing ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {uploadingFile ? 'Mengupload...' : 'Memproses...'}
                </span>
              ) : (
                'Setujui'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Pencairan Komisi</DialogTitle>
            <DialogDescription>
              Berikan alasan penolakan untuk {selectedWithdrawal?.userName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-slate-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-600">Nama:</span>
                <span className="font-semibold">{selectedWithdrawal?.userName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Jumlah:</span>
                <span className="font-bold">
                  Rp {selectedWithdrawal?.amount.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                Alasan Penolakan <span className="text-red-500">*</span>
              </Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Jelaskan alasan penolakan..."
                rows={3}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setNote('');
              }}
              className="flex-1"
              disabled={processing}
            >
              Batal
            </Button>
            <Button
              onClick={handleReject}
              variant="destructive"
              className="flex-1"
              disabled={processing || !note}
            >
              {processing ? 'Memproses...' : 'Tolak'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detail Pencairan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-slate-600">Nama</span>
                <span className="font-semibold">{selectedWithdrawal?.userName}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-slate-600">Email</span>
                <span className="font-semibold">{selectedWithdrawal?.userEmail}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-slate-600">Tipe</span>
                <Badge className="bg-blue-100 text-blue-700">
                  {selectedWithdrawal?.userType === 'agen' ? 'Agen' : 'Alumni'}
                </Badge>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-slate-600">Jumlah</span>
                <span className="font-bold text-green-600">
                  Rp {selectedWithdrawal?.amount.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-slate-600">Tanggal Pengajuan</span>
                <span>{selectedWithdrawal?.requestDate.toLocaleDateString('id-ID')}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-slate-600">Status</span>
                <Badge
                  className={
                    selectedWithdrawal?.status === 'confirmed'
                      ? 'bg-green-100 text-green-700'
                      : selectedWithdrawal?.status === 'rejected'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-amber-100 text-amber-700'
                  }
                >
                  {selectedWithdrawal?.status === 'confirmed'
                    ? 'Disetujui'
                    : selectedWithdrawal?.status === 'rejected'
                    ? 'Ditolak'
                    : 'Pending'}
                </Badge>
              </div>

              {/* Bank Account Info */}
              {selectedWithdrawal?.bankName && (
                <div className="py-2">
                  <span className="text-slate-600 font-medium block mb-2">Informasi Rekening</span>
                  <div className="bg-blue-50 p-3 rounded-lg space-y-1">
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-600">Bank:</span>
                      <span className="text-sm font-semibold uppercase">{selectedWithdrawal.bankName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-600">No. Rekening:</span>
                      <span className="text-sm font-mono font-semibold">{selectedWithdrawal.accountNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-600">Atas Nama:</span>
                      <span className="text-sm font-semibold">{selectedWithdrawal.accountName}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedWithdrawal?.note && (
                <div className="py-2">
                  <span className="text-slate-600 font-medium block mb-1">Catatan</span>
                  <p className="text-sm bg-slate-50 p-3 rounded">{selectedWithdrawal.note}</p>
                </div>
              )}

              {/* Transfer Proof */}
              {selectedWithdrawal?.transferProofUrl && (
                <div className="py-2">
                  <span className="text-slate-600 font-medium block mb-2">Bukti Transfer</span>
                  <div className="border-2 border-slate-200 rounded-lg overflow-hidden">
                    <img
                      src={selectedWithdrawal.transferProofUrl}
                      alt="Bukti Transfer"
                      className="w-full h-auto"
                    />
                  </div>
                  <a
                    href={selectedWithdrawal.transferProofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 mt-2"
                  >
                    <Eye className="w-4 h-4" />
                    Lihat ukuran penuh
                  </a>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommissionWithdrawalManagement;