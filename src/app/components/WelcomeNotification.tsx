import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Package, Users, FileText, X } from 'lucide-react';
import { Button } from '../components/ui/button';

interface WelcomeNotificationProps {
    isOpen: boolean;
    onClose: () => void;
    bookingData: {
        packageName: string;
        totalAmount: number;
        paxCount: number;
        orderId: string;
    };
}

export default function WelcomeNotification({ isOpen, onClose, bookingData }: WelcomeNotificationProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg mx-4"
                    >
                        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden">
                            {/* Header */}
                            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 relative">
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>

                                <div className="flex items-center justify-center mb-4">
                                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                                        <CheckCircle className="w-10 h-10 text-white" />
                                    </div>
                                </div>

                                <h2 className="text-2xl font-bold text-white text-center mb-2">
                                    Pembayaran Berhasil! 🎉
                                </h2>
                                <p className="text-emerald-50 text-center text-sm">
                                    Terima kasih telah mempercayai Sultanah Travel
                                </p>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-4">
                                {/* Order Details */}
                                <div className="bg-emerald-50 rounded-2xl p-4 space-y-3">
                                    <div className="flex items-start gap-3">
                                        <Package className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-xs text-emerald-700 font-semibold mb-1">Paket Umroh</p>
                                            <p className="text-sm font-bold text-emerald-900">{bookingData.packageName}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <Users className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-xs text-emerald-700 font-semibold mb-1">Jumlah Jamaah</p>
                                            <p className="text-sm font-bold text-emerald-900">{bookingData.paxCount} Orang</p>
                                        </div>
                                    </div>

                                    <div className="border-t border-emerald-200 pt-3 mt-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-emerald-700 font-semibold">Total Pembayaran</span>
                                            <span className="text-lg font-black text-emerald-900">
                                                Rp {bookingData.totalAmount.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="bg-white/60 rounded-xl p-3 border border-emerald-100">
                                        <p className="text-xs text-emerald-700">
                                            <span className="font-bold">Order ID:</span> {bookingData.orderId}
                                        </p>
                                    </div>
                                </div>

                                {/* Document Reminder */}
                                <div className="bg-amber-50 rounded-2xl p-4 border-2 border-dashed border-amber-200">
                                    <div className="flex items-start gap-3">
                                        <FileText className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm font-bold text-amber-900 mb-1">
                                                Jangan Lupa Upload Dokumen! 📄
                                            </p>
                                            <p className="text-xs text-amber-700 leading-relaxed">
                                                Segera lengkapi dokumen perjalanan Anda (KTP, Paspor, Foto, dll)
                                                agar proses keberangkatan berjalan lancar.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-2">
                                    <Button
                                        onClick={onClose}
                                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-sm font-bold uppercase tracking-wide shadow-lg shadow-emerald-200"
                                    >
                                        Lihat Dashboard
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
