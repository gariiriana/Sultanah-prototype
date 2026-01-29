import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    CheckCircle,
    XCircle,
    Search,
    Filter,
    Eye,
    AlertTriangle,
    FileText,
    DollarSign
} from 'lucide-react';
import { db } from '../../../config/firebase';
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    doc,
    updateDoc,
    serverTimestamp,
    getDoc,
    increment // ✅ Use increment for atomic update
} from 'firebase/firestore';
import { SavingsTransaction } from '../../../types';
import { Button } from '../../components/ui/button'; // Assuming this exists or use standard button

const SavingsApprovalPage: React.FC = () => {
    const [transactions, setTransactions] = useState<SavingsTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
    const [selectedTx, setSelectedTx] = useState<SavingsTransaction | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

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
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleApprove = async (tx: SavingsTransaction) => {
        if (!confirm(`Setujui deposit Rp ${tx.amount.toLocaleString()} dari ${tx.userName}?`)) return;
        setIsProcessing(true);

        try {
            // 1. Update Transaction Status
            const txRef = doc(db, 'savingsTransactions', tx.id);
            await updateDoc(txRef, {
                status: 'approved',
                approvedAt: new Date().toISOString(),
                approvedBy: 'Admin' // Should be current admin ID
            });

            // 2. Update User Savings Balance (Atomic Increment)
            // Check if savingsAccount exists first
            const accountRef = doc(db, 'savingsAccounts', tx.userId);
            const accountSnap = await getDoc(accountRef);

            if (!accountSnap.exists()) {
                // Create new account doc if not exists (although update with increment might fail if doc doesn't exist? No, usually set with merge or separate create needed)
                // SetDoc with merge is safer
                // Actually Firestore update() fails if doc doesn't exist. set() creates it.
                // Let's use setDoc logic or check existence.
                // For simplicity here, let's assume we use set with merge for the balance update or a specific function.
                // Since we are using client SDK, we can't do multi-doc transaction easily without more logic.
                // Simple approach:
                const { setDoc } = await import('firebase/firestore');
                await setDoc(accountRef, {
                    userId: tx.userId,
                    balance: increment(tx.amount), // Atomic increment
                    lastUpdated: new Date().toISOString(),
                    status: 'active'
                }, { merge: true });
            } else {
                await updateDoc(accountRef, {
                    balance: increment(tx.amount),
                    lastUpdated: new Date().toISOString()
                });
            }

            setSelectedTx(null);
            // Success toast
        } catch (error) {
            console.error("Error approving:", error);
            alert("Gagal menyetujui transaksi.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = async (tx: SavingsTransaction) => {
        const reason = prompt("Alasan penolakan:");
        if (!reason) return;

        setIsProcessing(true);
        try {
            const txRef = doc(db, 'savingsTransactions', tx.id);
            await updateDoc(txRef, {
                status: 'rejected',
                notes: reason, // Store reason in notes
                approvedAt: new Date().toISOString(), // Use approvedAt for processed time
                approvedBy: 'Admin'
            });
            setSelectedTx(null);
        } catch (error) {
            console.error("Error rejecting:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    const filteredTransactions = transactions.filter(tx =>
        filterStatus === 'all' ? true : tx.status === filterStatus
    );

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Approval Tabungan</h1>
                    <p className="text-gray-500">Kelola setoran tabungan jamaah</p>
                </div>

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
                                <div className="grid grid-cols-2 gap-2 mt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => setSelectedTx(tx)}
                                        className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
                                    >
                                        <Eye className="w-4 h-4 mr-2" />
                                        Cek Bukti
                                    </Button>
                                    <Button
                                        onClick={() => handleApprove(tx)}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Terima
                                    </Button>
                                </div>
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
                                            onClick={() => handleReject(selectedTx)}
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
        </div>
    );
};

export default SavingsApprovalPage;
