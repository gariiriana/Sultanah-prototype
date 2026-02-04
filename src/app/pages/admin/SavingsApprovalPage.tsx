import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    CheckCircle,
    XCircle,
    Eye,
    FileText
} from 'lucide-react';
import { db } from '../../../config/firebase';
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    doc,
    updateDoc,
    getDoc,
    increment,
    setDoc,
    where
} from 'firebase/firestore';
import { SavingsTransaction } from '../../../types';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';

const SavingsApprovalPage: React.FC = () => {
    const [transactions, setTransactions] = useState<SavingsTransaction[]>([]);
    const [filterStatus, setFilterStatus] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
    const [selectedTx, setSelectedTx] = useState<SavingsTransaction | null>(null);
    const [rejectingTx, setRejectingTx] = useState<SavingsTransaction | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    // State for Link Jamaah Tab
    const [savingsAccounts, setSavingsAccounts] = useState<any[]>([]);

    useEffect(() => {
        // Fetch Savings Accounts for "List Jamaah" tab
        const q = query(
            collection(db, 'savingsAccounts'),
            orderBy('balance', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const accounts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setSavingsAccounts(accounts);
        }, (error) => {
            console.error("Error fetching savings accounts:", error);
            toast.error("Gagal mengambil data rekening tabungan");
        });

        return () => unsubscribe();
    }, []);

    // ... existing transactions useEffect ...
    useEffect(() => {
        const q = query(
            collection(db, 'savingsTransactions'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const txs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as SavingsTransaction[];
            setTransactions(txs);
        });

        return () => unsubscribe();
    }, []);

    const [approvingTx, setApprovingTx] = useState<SavingsTransaction | null>(null);

    const handleApprove = (tx: SavingsTransaction) => {
        setApprovingTx(tx);
    };

    const confirmApproval = async () => {
        if (!approvingTx) return;
        setIsProcessing(true);

        try {
            // 1. Update Transaction Status
            const txRef = doc(db, 'savingsTransactions', approvingTx.id);
            await updateDoc(txRef, {
                status: 'approved',
                approvedAt: new Date().toISOString(),
                approvedBy: 'Admin' // Should be current admin ID
            });

            // 2. Update User Savings Balance (Atomic Increment)
            const accountRef = doc(db, 'savingsAccounts', approvingTx.userId);
            const accountSnap = await getDoc(accountRef);

            if (!accountSnap.exists()) {
                await setDoc(accountRef, {
                    userId: approvingTx.userId,
                    userName: approvingTx.userName,
                    balance: increment(approvingTx.amount),
                    lastUpdated: new Date().toISOString(),
                    status: 'active'
                }, { merge: true });
            } else {
                await updateDoc(accountRef, {
                    balance: increment(approvingTx.amount),
                    lastUpdated: new Date().toISOString(),
                    userName: approvingTx.userName
                });
            }

            setSelectedTx(null);
            setApprovingTx(null);
            toast.success(`Tabungan ${approvingTx.userName} sebesar Rp ${approvingTx.amount.toLocaleString()} berhasil disetujui.`);
        } catch (error) {
            console.error("Error approving:", error);
            toast.error("Gagal menyetujui transaksi.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = (tx: SavingsTransaction) => {
        setRejectingTx(tx);
        setRejectionReason("");
    };

    const submitRejection = async () => {
        if (!rejectingTx || !rejectionReason.trim()) return;

        setIsProcessing(true);
        try {
            const txRef = doc(db, 'savingsTransactions', rejectingTx.id);
            await updateDoc(txRef, {
                status: 'rejected',
                notes: rejectionReason, // Store reason in notes
                approvedAt: new Date().toISOString(),
                approvedBy: 'Admin'
            });
            setRejectingTx(null);
            toast.info(`Transaksi ${rejectingTx.userName} ditolak.`);
        } catch (error) {
            console.error("Error rejecting:", error);
            toast.error("Gagal menolak transaksi.");
        } finally {
            setIsProcessing(false);
        }
    };

    const filteredTransactions = transactions.filter(tx =>
        filterStatus === 'all' ? true : tx.status === filterStatus
    );

    const [activeTab, setActiveTab] = useState<'list' | 'approval'>('list');

    // State for Jamaah Detail View
    const [selectedJamaah, setSelectedJamaah] = useState<any | null>(null);
    const [jamaahTransactions, setJamaahTransactions] = useState<SavingsTransaction[]>([]);

    useEffect(() => {
        if (!selectedJamaah) return;

        // FIXED: Only use ONE specific listener and return its cleanup
        const specificQ = query(
            collection(db, 'savingsTransactions'),
            where('userId', '==', selectedJamaah.userId), // Ensure 'userId' exists on transactions
            orderBy('createdAt', 'desc')
        );

        // Let's use the specific query
        const specificUnsubscribe = onSnapshot(specificQ, (snapshot) => {
            const txs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as SavingsTransaction[];
            setJamaahTransactions(txs);
        });

        // ✅ Correctly cleanup the listener
        return () => specificUnsubscribe();
    }, [selectedJamaah]);


    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Tabungan Jamaah</h1>
                    <p className="text-gray-500">
                        {selectedJamaah ? `Riwayat Tabungan - ${selectedJamaah.userName || 'User'}` : 'Kelola data tabungan dan approval setoran'}
                    </p>
                </div>

                {/* Tab Navigation (Hidden when viewing detail) */}
                {!selectedJamaah && (
                    <div className="bg-white p-1 rounded-xl border border-gray-200 flex shadow-sm">
                        <button
                            onClick={() => setActiveTab('list')}
                            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === 'list'
                                ? 'bg-emerald-600 text-white shadow-md'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            List Jamaah
                        </button>
                        <button
                            onClick={() => setActiveTab('approval')}
                            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${activeTab === 'approval'
                                ? 'bg-emerald-600 text-white shadow-md'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            Approval Setoran
                            {transactions.filter(t => t.status === 'pending').length > 0 && (
                                <span className="w-5 h-5 flex items-center justify-center bg-red-500 text-white text-xs rounded-full">
                                    {transactions.filter(t => t.status === 'pending').length}
                                </span>
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* Content Switcher */}
            {activeTab === 'list' ? (
                selectedJamaah ? (
                    // DETAIL VIEW
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <Button
                                onClick={() => setSelectedJamaah(null)}
                                variant="outline"
                                className="border-gray-300 text-gray-700 hover:bg-gray-50"
                            >
                                ← Kembali
                            </Button>
                        </div>

                        {/* Summary Card */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Total Saldo Terkumpul</p>
                                <h2 className="text-3xl font-bold text-emerald-600">
                                    Rp {selectedJamaah.balance?.toLocaleString('id-ID') || 0}
                                </h2>
                            </div>
                            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                                <FileText className="w-6 h-6" />
                            </div>
                        </div>

                        {/* Transaction History Table */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-4 border-b border-gray-200 bg-gray-50">
                                <h3 className="font-semibold text-gray-900">Riwayat Transaksi</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-200">
                                            <th className="px-6 py-4 text-sm font-semibold text-gray-900">Tanggal</th>
                                            <th className="px-6 py-4 text-sm font-semibold text-gray-900">Tipe</th>
                                            <th className="px-6 py-4 text-sm font-semibold text-gray-900">Nominal</th>
                                            <th className="px-6 py-4 text-sm font-semibold text-gray-900">Metode</th>
                                            <th className="px-6 py-4 text-sm font-semibold text-gray-900">Bukti</th>
                                            <th className="px-6 py-4 text-sm font-semibold text-gray-900 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {jamaahTransactions.length > 0 ? (
                                            jamaahTransactions.map((tx) => (
                                                <tr key={tx.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 text-sm text-gray-600">
                                                        {new Date(tx.createdAt).toLocaleDateString('id-ID', {
                                                            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                                        })}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                        Setoran
                                                    </td>
                                                    <td className="px-6 py-4 font-bold text-gray-900">
                                                        Rp {tx.amount.toLocaleString('id-ID')}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500 uppercase">
                                                        {tx.paymentMethod.replace('_', ' ')}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {tx.proofUrl && (
                                                            <button
                                                                onClick={() => setSelectedTx(tx)}
                                                                className="text-blue-600 hover:underline text-xs flex items-center gap-1"
                                                            >
                                                                <Eye className="w-3 h-3" /> Lihat
                                                            </button>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${tx.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                            tx.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                                                'bg-red-100 text-red-700'
                                                            }`}>
                                                            {tx.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                                    Belum ada riwayat transaksi.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : (
                    // LIST VIEW
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="px-6 py-4 text-sm font-semibold text-gray-900">Nama Jamaah</th>
                                        <th className="px-6 py-4 text-sm font-semibold text-gray-900">Total Saldo</th>
                                        <th className="px-6 py-4 text-sm font-semibold text-gray-900">Terakhir Update</th>
                                        <th className="px-6 py-4 text-sm font-semibold text-gray-900 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {savingsAccounts.length > 0 ? (
                                        savingsAccounts.map((account) => (
                                            <tr
                                                key={account.id}
                                                onClick={() => setSelectedJamaah(account)}
                                                className="hover:bg-gray-50 transition-colors cursor-pointer group"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs group-hover:bg-emerald-200 transition-colors">
                                                            {account.userName ? account.userName.charAt(0) : 'U'}
                                                        </div>
                                                        <span className="font-medium text-gray-900 group-hover:text-emerald-700 transition-colors">
                                                            {account.userName || 'User ID: ' + account.userId.substring(0, 8)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-bold text-emerald-600">
                                                    Rp {account.balance?.toLocaleString('id-ID') || 0}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {account.lastUpdated ? new Date(account.lastUpdated).toLocaleDateString('id-ID') : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                                        ACTIVE
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                                <div className="flex flex-col items-center">
                                                    <FileText className="w-8 h-8 text-gray-300 mb-2" />
                                                    <p>Belum ada data tabungan.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
            ) : (
                // Existing Approval Content
                <>
                    <div className="flex justify-end mb-6">
                        <div className="flex gap-2 bg-white p-1 rounded-lg border border-gray-200">
                            {(['pending', 'approved', 'rejected', 'all'] as const).map(status => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filterStatus === status
                                        ? 'bg-blue-50 text-blue-600'
                                        : 'text-gray-600 hover:bg-gray-50'
                                        } capitalize`}
                                >
                                    {status === 'all' ? 'Semua' : status}
                                </button>
                            ))}
                        </div>
                    </div>


                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTransactions.map(tx => (
                            <motion.div
                                layout
                                key={tx.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                            >
                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold">
                                                {tx.userName.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900 line-clamp-1">{tx.userName}</h3>
                                                <p className="text-xs text-gray-500">
                                                    {new Date(tx.createdAt).toLocaleDateString('id-ID')}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${tx.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                            tx.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                            {tx.status}
                                        </span>
                                    </div>

                                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                        <p className="text-xs text-gray-500 mb-1">Nominal Setoran</p>
                                        <div className="text-xl font-bold text-gray-900 flex items-center gap-1">
                                            <span className="text-sm font-normal text-gray-500">Rp</span>
                                            {tx.amount.toLocaleString('id-ID')}
                                        </div>
                                        <div className="mt-2 text-xs flex items-center gap-1 text-gray-500">
                                            <span className="uppercase">{tx.paymentMethod.replace('_', ' ')}</span>
                                        </div>
                                    </div>

                                    {tx.status === 'pending' && (
                                        <>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => handleReject(tx)}
                                                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-colors"
                                                >
                                                    <XCircle className="w-4 h-4 mr-1.5" />
                                                    Tolak
                                                </Button>
                                                <Button
                                                    onClick={() => handleApprove(tx)}
                                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 shadow-sm"
                                                >
                                                    <CheckCircle className="w-4 h-4 mr-1.5" />
                                                    Terima
                                                </Button>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setSelectedTx(tx)}
                                                className="w-full mt-2 text-gray-500 text-xs hover:text-blue-600 hover:bg-blue-50"
                                            >
                                                <Eye className="w-3.5 h-3.5 mr-1.5" />
                                                Lihat Bukti Transfer
                                            </Button>
                                        </>
                                    )}
                                    {tx.status !== 'pending' && (
                                        <Button
                                            variant="ghost"
                                            onClick={() => setSelectedTx(tx)}
                                            className="w-full mt-2 text-gray-500"
                                        >
                                            Lihat Detail
                                        </Button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Modal Detail / Proof Check */}
                    <AnimatePresence>
                        {selectedTx && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
                                >
                                    <div className="p-6">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-xl font-bold">Bukti Transfer</h3>
                                            <button onClick={() => setSelectedTx(null)} className="text-gray-400 hover:text-gray-600">
                                                <XCircle className="w-6 h-6" />
                                            </button>
                                        </div>

                                        <div className="mb-6 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center min-h-[200px]">
                                            {selectedTx.proofUrl ? (
                                                <img src={selectedTx.proofUrl} alt="Bukti Transfer" className="max-w-full max-h-[400px] object-contain" />
                                            ) : (
                                                <div className="text-gray-400 flex flex-col items-center">
                                                    <FileText className="w-12 h-12 mb-2" />
                                                    <p>Tidak ada lampiran gambar</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex justify-between text-sm border-b pb-2">
                                                <span className="text-gray-500">Nama Pengirim</span>
                                                <span className="font-semibold">{selectedTx.userName}</span>
                                            </div>
                                            <div className="flex justify-between text-sm border-b pb-2">
                                                <span className="text-gray-500">Nominal</span>
                                                <span className="font-bold text-emerald-600">Rp {selectedTx.amount.toLocaleString()}</span>
                                            </div>
                                        </div>

                                        {selectedTx.status === 'pending' && (
                                            <div className="grid grid-cols-2 gap-3 mt-8">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => {
                                                        setSelectedTx(null);
                                                        handleReject(selectedTx);
                                                    }}
                                                    className="border-red-200 text-red-600 hover:bg-red-50"
                                                    disabled={isProcessing}
                                                >
                                                    Tolak
                                                </Button>
                                                <Button
                                                    onClick={() => handleApprove(selectedTx)}
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                                    disabled={isProcessing}
                                                >
                                                    {isProcessing ? 'Memproses...' : 'Setujui Pembayaran'}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>

                    {/* NEW: Approval Check Modal */}
                    <AnimatePresence>
                        {approvingTx && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center"
                                >
                                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
                                        <CheckCircle className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">Setujui Setoran?</h3>
                                    <p className="text-gray-500 mb-6">
                                        Anda akan menyetujui setoran sebesar <br />
                                        <span className="font-bold text-gray-900">Rp {approvingTx.amount.toLocaleString()}</span> dari <span className="font-bold text-gray-900">{approvingTx.userName}</span>.
                                    </p>

                                    <div className="grid grid-cols-2 gap-3">
                                        <Button
                                            variant="ghost"
                                            onClick={() => setApprovingTx(null)}
                                            className="text-gray-500"
                                        >
                                            Batal
                                        </Button>
                                        <Button
                                            onClick={confirmApproval}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                            disabled={isProcessing}
                                        >
                                            {isProcessing ? 'Memproses...' : 'Ya, Setujui'}
                                        </Button>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>

                    {/* NEW: Rejection Check Modal */}
                    <AnimatePresence>
                        {rejectingTx && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
                                >
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">Tolak Transaksi?</h3>
                                    <p className="text-gray-500 mb-4">
                                        Berikan alasan penolakan untuk transaksi dari <span className="font-semibold">{rejectingTx.userName}</span>.
                                    </p>

                                    <textarea
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        placeholder="Contoh: Bukti transfer buram, Nominal tidak sesuai..."
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none min-h-[100px] mb-4"
                                        autoFocus
                                    />

                                    <div className="flex justify-end gap-3">
                                        <Button
                                            variant="ghost"
                                            onClick={() => setRejectingTx(null)}
                                            className="text-gray-500"
                                        >
                                            Batal
                                        </Button>
                                        <Button
                                            onClick={submitRejection}
                                            className="bg-red-600 hover:bg-red-700 text-white"
                                            disabled={!rejectionReason.trim() || isProcessing}
                                        >
                                            {isProcessing ? 'Menolak...' : 'Kirim Penolakan'}
                                        </Button>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>
                </>
            )}
        </div>
    );
};

export default SavingsApprovalPage;
