import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Upload,
    History,
    Copy,
    CheckCircle,
    Clock,
    XCircle,
    AlertCircle,
    ShieldCheck,
    Calendar,
    Filter,
    ArrowLeft,
    TrendingUp
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { db, storage } from '../../../config/firebase';
import {
    collection,
    query,
    where,
    orderBy,
    addDoc,
    onSnapshot
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { compressBase64Image } from '../../../utils/imageCompression';
import { SavingsTransaction } from '../../../types';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';

interface SavingsManagementProps {
    onBack: () => void;
}

const SULTANAH_BSI_ACCOUNT = {
    bank: 'Bank Syariah Indonesia (BSI)',
    number: '777-123-4567',
    name: 'SULTANAH TRAVEL'
};

const SavingsManagement: React.FC<SavingsManagementProps> = ({ onBack }) => {
    const { currentUser: user, userProfile } = useAuth();
    const [activeTab, setActiveTab] = useState<'deposit' | 'history'>('deposit');
    const [amount, setAmount] = useState('');
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [proofPreview, setProofPreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [transactions, setTransactions] = useState<SavingsTransaction[]>([]);
    const [balance, setBalance] = useState(0);
    const [copied, setCopied] = useState(false);
    const [compressedProof, setCompressedProof] = useState<string | null>(null);
    const [isCompressing, setIsCompressing] = useState(false);
    const [filterDate, setFilterDate] = useState<string>(''); // YYYY-MM-DD
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

    // Fetch Transaction History & Calculate Balance
    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'savingsTransactions'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const txs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as SavingsTransaction[];

            setTransactions(txs);

            // Simple client-side balance calculation (for display only)
            const currentBal = txs.reduce((acc, curr) => {
                if (curr.status === 'approved') {
                    return curr.type === 'deposit' ? acc + curr.amount : acc - curr.amount;
                }
                return acc;
            }, 0);
            setBalance(currentBal);
        });

        return () => unsubscribe();
    }, [user]);

    const handleCopyAccount = () => {
        navigator.clipboard.writeText(SULTANAH_BSI_ACCOUNT.number.replace(/-/g, ''));
        setCopied(true);
        toast.success("Nomor rekening disalin!");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            // Validation
            const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
            if (!validTypes.includes(file.type)) {
                toast.error('Gunakan format gambar (JPG/PNG)');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Ukuran file maksimal 5MB');
                return;
            }

            setProofFile(file);
            setProofPreview(URL.createObjectURL(file));

            // OPTIMIZATION: Compress immediately in background
            const reader = new FileReader();
            reader.onload = async () => {
                const base64 = reader.result as string;
                setIsCompressing(true);
                try {
                    // One-pass compression is much faster than iterative
                    // Balanced compression: 1024x1024, 0.8 quality (crisp receipt, <500KB)
                    const compressed = await compressBase64Image(base64, 1024, 1024, 0.8);
                    setCompressedProof(compressed);
                } catch (err) {
                    console.error("Compression failed:", err);
                    setCompressedProof(base64); // Fallback to original base64
                } finally {
                    setIsCompressing(false);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !amount || !proofFile) return;

        setIsSubmitting(true);

        try {
            // 1. Get pre-compressed base64 or compress now if not ready
            let finalBase = compressedProof;

            if (!finalBase) {
                // If user hits submit immediately after picking file, we might need to wait or compress now
                const reader = new FileReader();
                const base64Promise = new Promise<string>((resolve, reject) => {
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(proofFile);
                });
                const originalBase64 = await base64Promise;
                finalBase = await compressBase64Image(originalBase64, 1024, 1024, 0.8);
            }

            // 2. Upload Compressed Image (Blob upload is 33% faster than Base64)
            // Convert Base64 to Blob
            const base64Data = finalBase.split(',')[1];
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'image/jpeg' });

            const storageRef = ref(storage, `savings_proofs/${user.uid}/${Date.now()}_proof.jpg`);
            const uploadResult = await uploadBytes(storageRef, blob);
            const downloadURL = await getDownloadURL(uploadResult.ref);

            // 3. Create Transaction Record
            const newTransaction: Omit<SavingsTransaction, 'id'> = {
                userId: user.uid,
                userName: userProfile?.displayName || user.displayName || 'Jamaah',
                amount: parseFloat(amount.replace(/\D/g, '')),
                type: 'deposit',
                paymentMethod: 'transfer_manual',
                status: 'pending',
                proofUrl: downloadURL,
                createdAt: new Date().toISOString(),
                notes: 'Tabungan Umroh via Manual BSI'
            };

            await addDoc(collection(db, 'savingsTransactions'), newTransaction);

            toast.success("Bukti tabungan berhasil dikirim! Menunggu approval admin.");

            // Reset Form
            setAmount('');
            setProofFile(null);
            setProofPreview(null);
            setCompressedProof(null);
            setActiveTab('history');

        } catch (error) {
            console.error("Error submitting savings:", error);
            toast.error("Gagal mengirim bukti transfer. Silakan coba lagi.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // DEBUG TOOLS: Add Dummy Data
    const handleAddDummyData = async () => {
        if (!user) {
            toast.error("User tidak ditemukan/belum login.");
            return;
        }

        console.log("Seeding data for user:", user.uid, user.displayName);

        const dummyTxs = [
            {
                amount: 1000555,
                status: 'pending' as const,
                date: new Date().toISOString()
            },
            {
                amount: 2500555,
                status: 'approved' as const,
                date: new Date(Date.now() - 86400000).toISOString() // 1 day ago
            },
            {
                amount: 500555,
                status: 'rejected' as const,
                date: new Date(Date.now() - 172800000).toISOString() // 2 days ago
            }
        ];

        try {
            for (const tx of dummyTxs) {
                await addDoc(collection(db, 'savingsTransactions'), {
                    userId: user.uid,
                    userName: userProfile?.displayName || user.displayName || 'Jamaah Demo',
                    amount: tx.amount,
                    type: 'deposit',
                    paymentMethod: 'transfer_manual',
                    status: tx.status,
                    proofUrl: 'https://placehold.co/400x600?text=Bukti+Dummy', // Use valid URL format
                    createdAt: tx.date,
                    notes: tx.status === 'rejected' ? 'Bukti transfer buram' : 'Simulasi Transaksi',
                    approvedAt: tx.status !== 'pending' ? new Date().toISOString() : null,
                    approvedBy: tx.status !== 'pending' ? 'System' : null
                });
            }
            toast.success("3 Data Dummy berhasil ditambahkan!");
        } catch (error: any) {
            console.error("Error seeding data:", error);
            toast.error(`Gagal: ${error.message}`);
        }
    };

    const formatIDR = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(val);
    };

    const filteredTransactions = transactions.filter(tx => {
        let matchesDate = true;
        let matchesStatus = true;

        if (filterDate) {
            const txDate = new Date(tx.createdAt);
            const filter = new Date(filterDate);
            matchesDate = (
                txDate.getDate() === filter.getDate() &&
                txDate.getMonth() === filter.getMonth() &&
                txDate.getFullYear() === filter.getFullYear()
            );
        }

        if (filterStatus !== 'all') {
            matchesStatus = tx.status === filterStatus;
        }

        return matchesDate && matchesStatus;
    });

    return (
        <div className="min-h-screen bg-white">
            {/* Header / Hero Section */}
            <div className="relative text-white overflow-hidden min-h-[350px] flex items-center">
                {/* Background Image with Overlay */}
                <div
                    className="absolute inset-0 z-0"
                    style={{
                        backgroundImage: 'url("/images/savings-bg.png")',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                >
                    <div className="absolute inset-0 bg-emerald-900/60 backdrop-blur-[2px]"></div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl z-1"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10 w-full">
                    <div className="flex items-center justify-between mb-8">
                        <button
                            onClick={onBack}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors flex items-center gap-2 text-emerald-50 group"
                        >
                            <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                            <span className="font-medium">Kembali ke Dashboard</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pb-8">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold text-emerald-100 mb-4 border border-white/10">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                Dana Aman & Terjamin
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold mb-4">Tabungan Umroh Sultanah</h1>
                            <p className="text-emerald-100/80 text-lg max-w-md">
                                Wujudkan impian ibadah Anda dengan menabung secara konsisten. Kelola saldo dan riwayat setoran Anda di sini.
                            </p>
                        </div>

                        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 md:p-8">
                            <p className="text-emerald-100 text-sm font-medium mb-1">Saldo Tabungan Saat Ini</p>
                            <div className="flex items-baseline gap-2 mb-4">
                                <h2 className="text-4xl md:text-5xl font-bold tracking-tight">{formatIDR(balance)}</h2>
                            </div>
                            <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                                <div className="flex items-center gap-2 text-emerald-100 text-xs">
                                    <Clock className="w-4 h-4" />
                                    <span>Update otomatis setelah approval</span>
                                </div>
                                <div className="flex items-center gap-2 text-emerald-100 text-xs">
                                    <TrendingUp className="w-4 h-4" />
                                    <span>Tanpa potongan admin</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20 pb-20">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left Side: Tabs & Navigation */}
                    <div className="lg:w-1/3 space-y-4">
                        <div className="bg-white p-2 rounded-2xl shadow-xl shadow-emerald-900/5 border border-gray-100 flex flex-col gap-2">
                            <button
                                onClick={() => setActiveTab('deposit')}
                                className={`flex items-center gap-3 p-4 rounded-xl text-sm font-bold transition-all ${activeTab === 'deposit'
                                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                                    : 'text-gray-500 hover:text-emerald-600 hover:bg-emerald-50'
                                    }`}
                            >
                                <div className={`p-2 rounded-lg ${activeTab === 'deposit' ? 'bg-white/20' : 'bg-gray-100'}`}>
                                    <Upload className="w-5 h-5" />
                                </div>
                                <div>
                                    <p>Setor Tabungan</p>
                                    <p className={`text-[10px] font-normal ${activeTab === 'deposit' ? 'text-emerald-100' : 'text-gray-400'}`}>Kirim bukti transfer baru</p>
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('history')}
                                className={`flex items-center gap-3 p-4 rounded-xl text-sm font-bold transition-all ${activeTab === 'history'
                                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                                    : 'text-gray-500 hover:text-emerald-600 hover:bg-emerald-50'
                                    }`}
                            >
                                <div className={`p-2 rounded-lg ${activeTab === 'history' ? 'bg-white/20' : 'bg-gray-100'}`}>
                                    <History className="w-5 h-5" />
                                </div>
                                <div>
                                    <p>Riwayat Transaksi</p>
                                    <p className={`text-[10px] font-normal ${activeTab === 'history' ? 'text-emerald-100' : 'text-gray-400'}`}>Pantau status setoran Anda</p>
                                </div>
                            </button>
                        </div>

                        {/* Quick Info Card */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <h4 className="font-bold text-gray-900 mb-2">Punya Pertanyaan?</h4>
                            <p className="text-sm text-gray-600 leading-relaxed mb-4">
                                Hubungi Customer Service Sultanah jika ada kendala dalam proses menabung.
                            </p>
                            <Button
                                variant="outline"
                                className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
                                onClick={() => window.open('https://wa.me/6281234700116', '_blank')}
                            >
                                Tanya Admin
                            </Button>
                        </div>
                    </div>

                    {/* Right Side: Tab Content */}
                    <div className="lg:w-2/3">
                        <AnimatePresence mode="wait">
                            {activeTab === 'deposit' ? (
                                <motion.div
                                    key="deposit"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    {/* Bank Info Card */}
                                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                                        <div className="p-6 md:p-8">
                                            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm">1</div>
                                                Informasi Rekening Sultanah
                                            </h3>

                                            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 md:p-8 text-white relative">
                                                {/* Card Chip Decor */}
                                                <div className="w-12 h-10 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-lg mb-8 shadow-inner opacity-80"></div>

                                                <div className="space-y-6">
                                                    <div>
                                                        <p className="text-[10px] uppercase tracking-widest text-emerald-400/80 font-bold mb-1">{SULTANAH_BSI_ACCOUNT.bank}</p>
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-2xl md:text-3xl font-mono font-bold tracking-[0.2em]">
                                                                {SULTANAH_BSI_ACCOUNT.number}
                                                            </p>
                                                            <button
                                                                onClick={handleCopyAccount}
                                                                className="bg-white/10 hover:bg-white/20 p-2.5 rounded-xl backdrop-blur-md transition-all active:scale-95"
                                                            >
                                                                {copied ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">Atas Nama</p>
                                                        <p className="text-lg font-semibold tracking-wide uppercase">{SULTANAH_BSI_ACCOUNT.name}</p>
                                                    </div>
                                                </div>

                                                {/* Bank Brand Logo Decor */}
                                                <div className="absolute bottom-6 right-8 text-3xl font-black italic text-white/5 tracking-tighter select-none">BSI SYARIAH</div>
                                            </div>

                                            <div className="mt-6 flex items-start gap-3 p-4 bg-orange-50 text-orange-700 rounded-2xl border border-orange-100">
                                                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                                <div className="text-xs md:text-sm">
                                                    <p className="font-bold mb-0.5">Penting!</p>
                                                    <p>Mohon gunakan nominal unik (misal: Rp 1.000.521) untuk mempercepat proses verifikasi oleh admin.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Upload Form */}
                                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
                                        <h3 className="text-xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm">2</div>
                                            Konfirmasi Pembayaran
                                        </h3>

                                        <form onSubmit={handleSubmit} className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-bold text-gray-700 mb-3">
                                                        Nominal Setoran (Rp)
                                                    </label>
                                                    <div className="relative group">
                                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold group-focus-within:text-emerald-600 transition-colors">Rp</span>
                                                        <input
                                                            type="number"
                                                            value={amount}
                                                            onChange={(e) => setAmount(e.target.value)}
                                                            placeholder="Contoh: 500000"
                                                            className="w-full pl-12 pr-6 py-4 rounded-2xl border border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-xl text-gray-900"
                                                            required
                                                            min="10000"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-bold text-gray-700 mb-3">
                                                        Upload Bukti Transfer
                                                    </label>
                                                    <div className={`relative border-2 border-dashed rounded-3xl p-10 text-center transition-all ${proofPreview ? 'border-emerald-500 bg-emerald-50/30' : 'border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/10'
                                                        }`}>
                                                        <input
                                                            type="file"
                                                            id="proof-upload"
                                                            onChange={handleFileChange}
                                                            accept="image/*"
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                            required={!proofPreview}
                                                        />

                                                        {proofPreview ? (
                                                            <div className="relative inline-block z-20">
                                                                <img
                                                                    src={proofPreview}
                                                                    alt="Preview"
                                                                    className="max-h-64 rounded-2xl shadow-xl border-4 border-white"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setProofPreview(null);
                                                                        setProofFile(null);
                                                                    }}
                                                                    className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 shadow-lg active:scale-95 transition-all"
                                                                >
                                                                    <XCircle className="w-5 h-5" />
                                                                </button>
                                                                <div className="mt-4 flex items-center justify-center gap-3 text-emerald-600 font-bold text-sm bg-emerald-50/50 py-2 px-4 rounded-full border border-emerald-100/50">
                                                                    {isCompressing ? (
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="w-4 h-4 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin"></div>
                                                                            <span>Sedang Optimasi...</span>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex items-center gap-2">
                                                                            <CheckCircle className="w-4 h-4" />
                                                                            <span>Siap Dikirim (Sudah Teroptimasi)</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-center">
                                                                <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                                    <Upload className="w-10 h-10" />
                                                                </div>
                                                                <span className="text-lg font-bold text-gray-900 mb-1">Klik atau seret file ke sini</span>
                                                                <span className="text-sm text-gray-500">Gunakan format JPG, PNG (Maks 5MB)</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <Button
                                                type="submit"
                                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-emerald-600/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
                                                disabled={isSubmitting || isCompressing || !proofFile}
                                            >
                                                {isSubmitting ? (
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                        Sedang Mengirim...
                                                    </div>
                                                ) : isCompressing ? (
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                        Sedang Mengoptimasi Foto...
                                                    </div>
                                                ) : 'Konfirmasi Setoran Tabungan'}
                                            </Button>
                                        </form>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="history"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
                                >
                                    <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900">Riwayat Transaksi</h3>
                                            <p className="text-sm text-gray-500 mt-1">Status setoran dan pengeluaran tabungan</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleAddDummyData}
                                                    className="hidden md:flex text-xs text-gray-400 border-dashed hover:text-indigo-600 hover:border-indigo-300"
                                                >
                                                    + Data Dummy
                                                </Button>

                                                {/* Status Filter */}
                                                <div className="relative">
                                                    <select
                                                        value={filterStatus}
                                                        onChange={(e) => setFilterStatus(e.target.value as any)}
                                                        className="appearance-none pl-10 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 outline-none focus:border-emerald-500 hover:border-emerald-300 transition-colors shadow-sm cursor-pointer"
                                                    >
                                                        <option value="all">Semua Status</option>
                                                        <option value="pending">Pending</option>
                                                        <option value="approved">Approved</option>
                                                        <option value="rejected">Rejected</option>
                                                    </select>
                                                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                                </div>
                                            </div>

                                            {/* Date Filter */}
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                                <input
                                                    type="date"
                                                    value={filterDate}
                                                    onChange={(e) => setFilterDate(e.target.value)}
                                                    className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 outline-none focus:border-emerald-500 hover:border-emerald-300 transition-colors shadow-sm cursor-pointer"
                                                />
                                            </div>

                                            <div className="hidden md:block px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 shadow-sm whitespace-nowrap">
                                                {filteredTransactions.length} Entri
                                            </div>
                                        </div>
                                    </div>

                                    {filteredTransactions.length === 0 ? (
                                        <div className="p-20 text-center">
                                            <div className="w-24 h-24 bg-gray-50 text-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                                                <History className="w-12 h-12" />
                                            </div>
                                            <h4 className="text-xl font-bold text-gray-900 mb-2">
                                                {filterDate || filterStatus !== 'all' ? 'Tidak Ada Transaksi Ditemukan' : 'Belum Ada Transaksi'}
                                            </h4>
                                            <p className="text-gray-500 max-w-xs mx-auto">
                                                {filterDate || filterStatus !== 'all'
                                                    ? 'Coba ubah tanggal atau status filter untuk melihat hasil lainnya.'
                                                    : 'Anda belum mengirimkan bukti setoran tabungan. Mulai menabung untuk rencana ibadah Anda hari ini!'
                                                }
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-100">
                                            {filteredTransactions.map((tx) => (
                                                <div key={tx.id} className="p-6 hover:bg-gray-50/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                                                    <div className="flex items-center gap-5">
                                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 ${tx.status === 'approved'
                                                            ? 'bg-emerald-500 text-white shadow-emerald-200'
                                                            : tx.status === 'pending'
                                                                ? 'bg-amber-500 text-white shadow-amber-200'
                                                                : 'bg-red-500 text-white shadow-red-200'
                                                            }`}>
                                                            {tx.status === 'approved' ? (
                                                                <CheckCircle className="w-6 h-6" />
                                                            ) : tx.status === 'pending' ? (
                                                                <Clock className="w-6 h-6" />
                                                            ) : (
                                                                <XCircle className="w-6 h-6" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <p className="font-bold text-gray-900">
                                                                    {tx.type === 'deposit' ? 'Setoran Tabungan' : 'Penarikan Dana'}
                                                                </p>
                                                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${tx.status === 'approved'
                                                                    ? 'bg-emerald-100 text-emerald-700'
                                                                    : tx.status === 'pending'
                                                                        ? 'bg-amber-100 text-amber-700'
                                                                        : 'bg-red-100 text-red-700'
                                                                    }`}>
                                                                    {tx.status === 'pending' ? 'Pending' :
                                                                        tx.status === 'approved' ? 'Approved' : 'Rejected'}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-gray-500 flex items-center gap-1.5">
                                                                <Calendar className="w-3.5 h-3.5" />
                                                                {new Date(tx.createdAt).toLocaleDateString('id-ID', {
                                                                    day: 'numeric', month: 'long', year: 'numeric'
                                                                })}
                                                                <span className="mx-1">•</span>
                                                                {new Date(tx.createdAt).toLocaleTimeString('id-ID', {
                                                                    hour: '2-digit', minute: '2-digit'
                                                                })}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="text-left md:text-right pl-19 md:pl-0">
                                                        <p className={`text-xl font-black ${tx.type === 'deposit' ? 'text-emerald-600' : 'text-gray-900'
                                                            }`}>
                                                            {tx.type === 'deposit' ? '+' : '-'} {formatIDR(tx.amount)}
                                                        </p>
                                                        <p className="text-[10px] font-medium text-gray-400 mt-1 uppercase tracking-widest">
                                                            ID: {tx.id.substring(0, 8).toUpperCase()}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SavingsManagement;
