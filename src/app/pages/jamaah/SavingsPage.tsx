import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Wallet,
    Upload,
    History,
    Copy,
    ArrowRight,
    CheckCircle,
    Clock,
    XCircle,
    CreditCard,
    AlertCircle
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { db, storage } from '../../../config/firebase';
import {
    collection,
    query,
    where,
    orderBy,
    addDoc,
    onSnapshot,
    Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { SavingsTransaction } from '../../../types';
import { Button } from '../../components/ui/button';

const SULTANAH_BSI_ACCOUNT = {
    bank: 'Bank Syariah Indonesia (BSI)',
    number: '777-123-4567', // Dummy Account
    name: 'PT SULTANAH WISATA INTERNASIONAL'
};

const SavingsPage: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'deposit' | 'history'>('deposit');
    const [amount, setAmount] = useState('');
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [proofPreview, setProofPreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [transactions, setTransactions] = useState<SavingsTransaction[]>([]);
    const [balance, setBalance] = useState(0);
    const [copied, setCopied] = useState(false);

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
            // Real balance should be calculated via Cloud Functions/Backend or stored in savingsAccount doc
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
        setTimeout(() => setCopied(false), 2000);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setProofFile(file);
            setProofPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !amount || !proofFile) return;

        setIsSubmitting(true);

        try {
            // 1. Upload Proof Image
            const storageRef = ref(storage, `savings_proofs/${user.uid}/${Date.now()}_${proofFile.name}`);
            const uploadResult = await uploadBytes(storageRef, proofFile);
            const downloadURL = await getDownloadURL(uploadResult.ref);

            // 2. Create Transaction Record
            const newTransaction: Omit<SavingsTransaction, 'id'> = {
                userId: user.uid,
                userName: user.displayName || 'Jamaah',
                amount: parseFloat(amount.replace(/\D/g, '')), // Remove non-digits
                type: 'deposit',
                paymentMethod: 'transfer_manual',
                status: 'pending',
                proofUrl: downloadURL,
                createdAt: new Date().toISOString(),
                notes: 'Tabungan Umroh via Manual BSI'
            };

            await addDoc(collection(db, 'savingsTransactions'), newTransaction);

            // Reset Form
            setAmount('');
            setProofFile(null);
            setProofPreview(null);
            setActiveTab('history');

        } catch (error) {
            console.error("Error submitting savings:", error);
            alert("Gagal mengirim bukti transfer. Silakan coba lagi.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Format IDR
    const formatIDR = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(val);
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 text-white pt-8 pb-16 px-6 rounded-b-[2.5rem] shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                <div className="relative z-10 max-w-lg mx-auto md:max-w-4xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
                            <Wallet className="w-6 h-6 text-emerald-100" />
                        </div>
                        <h1 className="text-xl font-bold">Tabungan Umroh</h1>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <p className="text-emerald-100 text-sm mb-1">Total Tabungan Anda</p>
                            <h2 className="text-4xl font-bold tracking-tight">{formatIDR(balance)}</h2>
                        </div>

                        <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-lg border border-white/20 text-xs font-medium text-emerald-50 inline-flex items-center gap-2">
                            <CheckCircle className="w-3 h-3" />
                            Dana Aman & Transparan
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-lg mx-auto md:max-w-4xl px-4 -mt-8 relative z-20">

                {/* Navigation Tabs */}
                <div className="bg-white p-1.5 rounded-xl shadow-sm border border-gray-100 flex mb-6">
                    <button
                        onClick={() => setActiveTab('deposit')}
                        className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === 'deposit'
                                ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <Upload className="w-4 h-4" />
                        Setor Tabungan
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === 'history'
                                ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <History className="w-4 h-4" />
                        Riwayat
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'deposit' ? (
                        <motion.div
                            key="deposit"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-6"
                        >
                            {/* Step 1: Account Info Card */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative overflow-hidden group hover:shadow-md transition-shadow">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50 group-hover:scale-110 transition-transform"></div>

                                <h3 className="text-gray-900 font-semibold mb-4 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">1</span>
                                    Transfer ke Rekening Resmi
                                </h3>

                                <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-5 relative">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">{SULTANAH_BSI_ACCOUNT.bank}</p>
                                            <p className="font-mono text-xl md:text-2xl font-bold text-gray-800 tracking-wider">
                                                {SULTANAH_BSI_ACCOUNT.number}
                                            </p>
                                        </div>
                                        <button
                                            onClick={handleCopyAccount}
                                            className="p-2 hover:bg-gray-100 rounded-lg text-emerald-600 transition-colors"
                                            title="Salin Nomor Rekening"
                                        >
                                            {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="text-sm">
                                            <p className="text-gray-500 text-xs">Atas Nama</p>
                                            <p className="font-semibold text-gray-900">{SULTANAH_BSI_ACCOUNT.name}</p>
                                        </div>
                                        {/* BSI Logo placeholder text or imported image */}
                                        <div className="ml-auto font-bold text-emerald-700 italic opacity-50">BSI</div>
                                    </div>
                                </div>

                                <div className="mt-4 flex items-start gap-3 p-3 bg-blue-50 text-blue-700 rounded-lg text-xs md:text-sm">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    <p>
                                        Transfer manual <strong>tanpa biaya admin</strong>. Pastikan transfer ke nomor rekening diatas atas nama PT Sultanah.
                                    </p>
                                </div>
                            </div>

                            {/* Step 2: Upload Form */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-gray-900 font-semibold mb-6 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">2</span>
                                    Konfirmasi Transfer
                                </h3>

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Nominal Transfer (Rp)
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">Rp</span>
                                            <input
                                                type="number"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                placeholder="Contoh: 100000"
                                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all font-semibold text-gray-900"
                                                required
                                                min="10000"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Bukti Transfer
                                        </label>
                                        <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${proofPreview ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
                                            }`}>
                                            <input
                                                type="file"
                                                id="proof-upload"
                                                onChange={handleFileChange}
                                                accept="image/*"
                                                className="hidden"
                                                required
                                            />

                                            {proofPreview ? (
                                                <div className="relative inline-block">
                                                    <img
                                                        src={proofPreview}
                                                        alt="Preview"
                                                        className="max-h-48 rounded-lg shadow-sm"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setProofPreview(null);
                                                            setProofFile(null);
                                                        }}
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                    <p className="text-xs text-emerald-600 mt-2 font-medium">Siap diupload</p>
                                                </div>
                                            ) : (
                                                <label htmlFor="proof-upload" className="cursor-pointer flex flex-col items-center">
                                                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                                                        <Upload className="w-6 h-6" />
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-900">Klik untuk upload foto bukti</span>
                                                    <span className="text-xs text-gray-500 mt-1">JPG, PNG maksimal 5MB</span>
                                                </label>
                                            )}
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-emerald-200 hover:shadow-xl transition-all"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Mengirim...' : 'Kirim Bukti Transfer'}
                                    </Button>
                                </form>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="history"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                        >
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="font-semibold text-gray-900">Riwayat Transaksi</h3>
                                <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                    {transactions.length} transaksi
                                </span>
                            </div>

                            {transactions.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <History className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <h4 className="text-gray-900 font-medium mb-1">Belum ada transaksi</h4>
                                    <p className="text-sm text-gray-500">Mulai menabung untuk perjalanan ibadah Anda.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {transactions.map((tx) => (
                                        <div key={tx.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.status === 'approved'
                                                        ? 'bg-emerald-100 text-emerald-600'
                                                        : tx.status === 'pending'
                                                            ? 'bg-amber-100 text-amber-600'
                                                            : 'bg-red-100 text-red-600'
                                                    }`}>
                                                    {tx.status === 'approved' ? (
                                                        <CheckCircle className="w-5 h-5" />
                                                    ) : tx.status === 'pending' ? (
                                                        <Clock className="w-5 h-5" />
                                                    ) : (
                                                        <XCircle className="w-5 h-5" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">
                                                        {tx.type === 'deposit' ? 'Setoran Tabungan' : 'Penarikan'}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(tx.createdAt).toLocaleDateString('id-ID', {
                                                            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <p className={`font-bold ${tx.type === 'deposit' ? 'text-emerald-600' : 'text-gray-900'
                                                    }`}>
                                                    {tx.type === 'deposit' ? '+' : '-'} {formatIDR(tx.amount)}
                                                </p>
                                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full inline-block mt-1 ${tx.status === 'approved'
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : tx.status === 'pending'
                                                            ? 'bg-amber-100 text-amber-700'
                                                            : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {tx.status === 'pending' ? 'Menunggu Approval' :
                                                        tx.status === 'approved' ? 'Berhasil' : 'Ditolak'}
                                                </span>
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
    );
};

export default SavingsPage;
