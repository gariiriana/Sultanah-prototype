import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    CheckCircle,
    CreditCard,
    User,
    ShieldCheck,
    Loader2,
    Calendar,
    Users,
    ArrowLeft,
    Eye,
    EyeOff,
    Trash2,
    Sparkles,
    Heart,
    Plus,
    Minus
} from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'; // Auth functions
import { db, auth } from '../../../config/firebase'; // Ensure auth is exported
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';

declare global {
    interface Window {
        snap: any;
    }
}
const BookingFlow: React.FC = () => {
    const { packageId } = useParams();
    const navigate = useNavigate();

    const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Details & Input, 2: Payment, 3: Success/Register
    const [pkg, setPkg] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Form Data
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '', // ✅ NEW: Password for auto-register
        phone: '',
        pax: 1,
        additionalJamaah: [] as { name: string; whatsapp: string }[],
        referralCode: '', // ✅ NEW: For Affiliator/BA
        voucherCode: ''   // ✅ NEW: For Influence Discount
    });

    const VOUCHER_DISCOUNT = 200000;

    const [isProcessing, setIsProcessing] = useState(false);
    const [showPassword, setShowPassword] = useState(false); // ✅ NEW: Toggle password visibility
    const [regError, setRegError] = useState<string | null>(null); // ✅ NEW: Track registration error

    useEffect(() => {
        const fetchPackage = async () => {
            if (!packageId) return;
            try {
                const docRef = doc(db, 'packages', packageId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setPkg({ id: docSnap.id, ...docSnap.data() });
                } else {
                    toast.error("Paket tidak ditemukan");
                    navigate('/');
                }
            } catch (error) {
                console.error("Error fetching package:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPackage();
    }, [packageId, navigate]);

    // Automated payment detection is now handled by the Midtrans webhook or Snap success callback
    // (Simulation removed for production-ready integration)

    const handleGenerateVA = async () => {
        if (!formData.name || !formData.email || !formData.password || !formData.phone) {
            toast.error("Mohon lengkapi semua data");
            return;
        }

        setIsProcessing(true);
        try {
            const orderId = `BOOK-${Date.now()}`;
            const grossAmount = parseInt(pkg.price) * formData.pax - (formData.voucherCode ? VOUCHER_DISCOUNT : 0);

            // 1. Call our secure API to create transaction
            const response = await fetch('/api/create-transaction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId,
                    grossAmount,
                    customerDetails: {
                        name: formData.name,
                        email: formData.email,
                        phone: formData.phone
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.details || errorData.error || "Gagal menghubungi server pembayaran");
            }

            const data = await response.json();
            const snapToken = data.token;

            // 2. Open Snap Popup
            window.snap.pay(snapToken, {
                onSuccess: async function (result: any) {
                    toast.success("Pembayaran Berhasil!", { icon: "✅" });

                    // Register user and save booking
                    await handlePaymentSuccess(orderId, grossAmount, result);
                },
                onPending: function (_result: any) {
                    toast.info("Menunggu pembayaran Anda...");
                    setStep(2);
                },
                onError: function (_result: any) {
                    toast.error("Pembayaran Gagal. Silakan coba lagi.");
                },
                onClose: function () {
                    toast.info("Silakan selesaikan pembayaran untuk konfirmasi.");
                }
            });

            setIsProcessing(false);
        } catch (error: any) {
            console.error("Midtrans Error:", error);
            toast.error(error.message || "Gagal membuat transaksi");
            setIsProcessing(false);
        }
    };

    const handleRemoveJamaah = (indexToRemove: number) => {
        const updatedAdditional = formData.additionalJamaah.filter((_, index) => index !== indexToRemove);
        setFormData({
            ...formData,
            pax: formData.pax - 1,
            additionalJamaah: updatedAdditional
        });
        toast.info(`Data jamaah telah dihapus.`);
    };

    const handlePaymentSuccess = async (orderId: string, totalAmount: number, paymentResult: any) => {
        setIsProcessing(true);
        try {
            // 1. Register user if new
            const userId = await handleAutoRegister();

            if (!userId) {
                throw new Error("Gagal mendaftarkan user");
            }

            // 2. Save booking to Firestore
            const bookingData = {
                id: orderId,
                userId: userId,
                packageId: pkg.id,
                packageName: pkg.name,
                packagePrice: parseInt(pkg.price),
                paxCount: formData.pax,
                totalAmount: totalAmount,
                status: 'paid',
                paymentMethod: paymentResult.payment_type || 'unknown',
                jamaah: [
                    {
                        name: formData.name,
                        email: formData.email,
                        phone: formData.phone,
                        documentsUploaded: false
                    },
                    ...formData.additionalJamaah.map(j => ({
                        name: j.name,
                        phone: j.whatsapp,
                        email: '',
                        documentsUploaded: false
                    }))
                ],
                createdAt: new Date(),
                paidAt: new Date(),
                midtransOrderId: orderId,
                midtransTransactionId: paymentResult.transaction_id || '',
                voucherCode: formData.voucherCode || null,
                referralCode: formData.referralCode || null
            };

            await setDoc(doc(db, 'bookings', orderId), bookingData);

            // 3. Store welcome notification data in localStorage
            localStorage.setItem('showWelcomeNotification', 'true');
            localStorage.setItem('welcomeBookingData', JSON.stringify({
                packageName: pkg.name,
                totalAmount: totalAmount,
                paxCount: formData.pax,
                orderId: orderId
            }));

            // 4. Redirect to dashboard
            toast.success("Redirecting to dashboard...", { icon: "🚀" });
            setTimeout(() => {
                navigate('/dashboard');
            }, 1000);

        } catch (error: any) {
            console.error("Error saving booking:", error);
            toast.error("Pembayaran sukses, tapi gagal menyimpan data. Hubungi admin.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAutoRegister = async (): Promise<string | null> => {
        try {
            // Attempt to create user with provided credentials
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;
            const userId = user.uid;

            // Update Profile
            await updateProfile(user, { displayName: formData.name });

            // Save User Doc
            await setDoc(doc(db, 'users', userId), {
                email: formData.email,
                displayName: formData.name,
                role: 'current-jamaah', // Paid = Current
                phone: formData.phone,
                createdAt: new Date().toISOString(),
                status: 'active'
            });

            toast.success("Akun Anda berhasil dibuat! Selamat datang di Sultanah Travel 🕋", {
                duration: 4000
            });

            return userId;

        } catch (error: any) {
            if (error.code === 'auth/email-already-in-use') {
                // Email is already in use, sign in and return userId
                try {
                    const { signInWithEmailAndPassword } = await import('firebase/auth');
                    const signInCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
                    toast.info("Email sudah terdaftar. Login otomatis...");
                    return signInCredential.user.uid;
                } catch (signInError: any) {
                    toast.error("Email sudah terdaftar dengan password berbeda. Silakan login.");
                    return null;
                }
            } else {
                setRegError(error.message);
                toast.error(`Gagal mendaftar: ${error.message}`);
                return null;
            }
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
    );

    return (
        <div className="relative min-h-screen py-12 px-4 overflow-y-auto">
            {/* Background Image with Overlay */}
            <div
                className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: 'url("/bg-madinah.jpg")' }}
            >
                <div className="absolute inset-0 bg-black/40" />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto">
                {/* Back Button */}
                <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => navigate('/', { state: { view: 'packageDetail', id: packageId } })}
                    className="mb-8 flex items-center gap-2 text-white/90 hover:text-white transition-colors bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Kembali ke Detail Paket</span>
                </motion.button>
                {/* Progress Steps */}
                <div className="flex items-center justify-center mb-10">
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-500'}`}>1</div>
                        <div className={`h-1 w-16 ${step >= 2 ? 'bg-emerald-600' : 'bg-gray-200'}`}></div>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
                        <div className={`h-1 w-16 ${step >= 3 ? 'bg-emerald-600' : 'bg-gray-200'}`}></div>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 3 ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-500'}`}>3</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch max-w-5xl mx-auto lg:min-h-[calc(100vh-180px)]">
                    {/* Ringkasan Pesanan (Top on Mobile) */}
                    {pkg && (
                        <div className="lg:hidden">
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-lg border border-white/30 flex items-center gap-4"
                            >
                                <img src={pkg.image || pkg.photo || 'https://via.placeholder.com/150'} alt={pkg.name} className="w-16 h-16 object-cover rounded-lg shadow-sm" />
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-gray-900 text-sm truncate">{pkg.name}</h4>
                                    <div className="flex items-center gap-3 text-[10px] text-gray-500 mt-1">
                                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(pkg.departureDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {formData.pax} Jamaah</span>
                                    </div>
                                    <p className="text-emerald-700 font-bold text-sm mt-1">
                                        Rp {(formData.pax * parseInt(pkg.price) - (formData.voucherCode ? VOUCHER_DISCOUNT : 0)).toLocaleString()}
                                        {formData.voucherCode && <span className="text-[10px] text-emerald-500 ml-1">(Hemat 200rb)</span>}
                                    </p>
                                </div>
                            </motion.div>
                        </div>
                    )}

                    <div className="h-full">
                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="bg-white/90 backdrop-blur-xl p-5 rounded-2xl shadow-2xl border border-white/30 h-full flex flex-col overflow-y-auto custom-scrollbar"
                                >
                                    <h2 className="text-lg font-bold mb-3">Lengkapi Data Booking</h2>
                                    <div className="space-y-4 flex-1">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nama Lengkap</label>
                                                <input
                                                    type="text"
                                                    value={formData.name}
                                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                    className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all outline-none text-sm font-medium"
                                                    placeholder="Sesuai KTP"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Email</label>
                                                <input
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                    className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all outline-none text-sm font-medium"
                                                    placeholder="nama@email.com"
                                                />
                                            </div>
                                            <div className="md:col-span-2 relative">
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Password Akun</label>
                                                <div className="relative">
                                                    <input
                                                        type={showPassword ? "text" : "password"}
                                                        value={formData.password}
                                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                                        className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all outline-none text-sm font-medium pr-10"
                                                        placeholder="••••••••"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-500 transition-colors"
                                                    >
                                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                                <p className="text-[9px] text-gray-400 mt-1 italic">*Digunakan untuk login dokumen nanti</p>
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nomor WhatsApp</label>
                                                <input
                                                    type="tel"
                                                    value={formData.phone}
                                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                    className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all outline-none text-sm font-medium"
                                                    placeholder="08123456789"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Jumlah Jamaah</label>
                                                <div className="flex items-center gap-3">
                                                    {/* Minus Button */}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newPax = Math.max(1, formData.pax - 1);
                                                            if (newPax !== formData.pax) {
                                                                const currentAdditional = [...formData.additionalJamaah];
                                                                const needed = newPax - 1;
                                                                if (needed > 0) {
                                                                    currentAdditional.splice(needed);
                                                                } else {
                                                                    currentAdditional.length = 0;
                                                                }
                                                                setFormData({ ...formData, pax: newPax, additionalJamaah: currentAdditional });
                                                            }
                                                        }}
                                                        className="w-10 h-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:border-emerald-500 hover:text-emerald-600 transition-all active:scale-95 shadow-sm"
                                                    >
                                                        <Minus className="w-5 h-5" />
                                                    </button>

                                                    {/* Input Field */}
                                                    <div className="flex-1 relative">
                                                        <input
                                                            type="text"
                                                            inputMode="numeric"
                                                            pattern="[0-9]*"
                                                            value={formData.pax === 0 ? '' : formData.pax}
                                                            onChange={e => {
                                                                const val = e.target.value;
                                                                if (val === '') {
                                                                    setFormData({ ...formData, pax: 0 });
                                                                    return;
                                                                }
                                                                const newPax = parseInt(val);
                                                                if (isNaN(newPax)) return;

                                                                const currentAdditional = [...formData.additionalJamaah];
                                                                const finalPax = Math.max(1, newPax);
                                                                const needed = finalPax - 1;

                                                                if (needed > 0) {
                                                                    if (currentAdditional.length < needed) {
                                                                        const toAdd = needed - currentAdditional.length;
                                                                        for (let i = 0; i < toAdd; i++) {
                                                                            currentAdditional.push({ name: '', whatsapp: '' });
                                                                        }
                                                                    } else if (currentAdditional.length > needed) {
                                                                        currentAdditional.splice(needed);
                                                                    }
                                                                } else {
                                                                    currentAdditional.length = 0;
                                                                }

                                                                setFormData({
                                                                    ...formData,
                                                                    pax: finalPax,
                                                                    additionalJamaah: currentAdditional
                                                                });
                                                            }}
                                                            onBlur={() => {
                                                                if (formData.pax < 1) {
                                                                    setFormData({ ...formData, pax: 1 });
                                                                }
                                                            }}
                                                            className="w-full h-10 text-center border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all outline-none text-sm font-bold"
                                                        />
                                                    </div>

                                                    {/* Plus Button */}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newPax = formData.pax + 1;
                                                            const currentAdditional = [...formData.additionalJamaah];
                                                            currentAdditional.push({ name: '', whatsapp: '' });
                                                            setFormData({ ...formData, pax: newPax, additionalJamaah: currentAdditional });
                                                        }}
                                                        className="w-10 h-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:border-emerald-500 hover:text-emerald-600 transition-all active:scale-95 shadow-sm"
                                                    >
                                                        <Plus className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Additional Jamaah Forms */}
                                        <AnimatePresence>
                                            {formData.additionalJamaah.map((jamaah, index) => (
                                                <motion.div
                                                    key={`jamaah-${index}`}
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-4"
                                                >
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h4 className="text-sm font-bold text-emerald-800 flex items-center gap-2">
                                                            <User className="w-4 h-4" />
                                                            Data Jamaah Ke-{index + 2}
                                                        </h4>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveJamaah(index)}
                                                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Hapus Jamaah"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-600 mb-1">Nama Lengkap (Wajib)</label>
                                                            <input
                                                                type="text"
                                                                value={jamaah.name}
                                                                onChange={e => {
                                                                    const updated = [...formData.additionalJamaah];
                                                                    updated[index].name = e.target.value;
                                                                    setFormData({ ...formData, additionalJamaah: updated });
                                                                }}
                                                                className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 text-sm outline-none"
                                                                placeholder="Sesuai KTP"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-600 mb-1">No. WhatsApp (Opsional)</label>
                                                            <input
                                                                type="tel"
                                                                value={jamaah.whatsapp}
                                                                onChange={e => {
                                                                    const updated = [...formData.additionalJamaah];
                                                                    updated[index].whatsapp = e.target.value;
                                                                    setFormData({ ...formData, additionalJamaah: updated });
                                                                }}
                                                                className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 text-sm outline-none"
                                                                placeholder="08123456789"
                                                            />
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>

                                    {/* ✅ NEW: Trust & Benefits Section (Compact for Mobile) */}
                                    <div className="mt-4 grid grid-cols-3 gap-2">
                                        <div className="p-2 bg-white/50 rounded-xl border border-gray-100 flex flex-col items-center text-center group hover:border-emerald-200 transition-colors">
                                            <div className="p-1.5 bg-emerald-50 rounded-lg mb-1 group-hover:scale-110 transition-transform">
                                                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                            </div>
                                            <span className="text-[8px] md:text-[10px] font-bold text-gray-800 uppercase tracking-tighter leading-none">Keamanan Terjamin</span>
                                        </div>
                                        <div className="p-2 bg-white/50 rounded-xl border border-gray-100 flex flex-col items-center text-center group hover:border-emerald-200 transition-colors">
                                            <div className="p-1.5 bg-emerald-50 rounded-lg mb-1 group-hover:scale-110 transition-transform">
                                                <Sparkles className="w-4 h-4 text-emerald-600" />
                                            </div>
                                            <span className="text-[8px] md:text-[10px] font-bold text-gray-800 uppercase tracking-tighter leading-none">Konfirmasi Instan</span>
                                        </div>
                                        <div className="p-2 bg-white/50 rounded-xl border border-gray-100 flex flex-col items-center text-center group hover:border-emerald-200 transition-colors">
                                            <div className="p-1.5 bg-emerald-50 rounded-lg mb-1 group-hover:scale-110 transition-transform">
                                                <Heart className="w-4 h-4 text-emerald-600" />
                                            </div>
                                            <span className="text-[8px] md:text-[10px] font-bold text-gray-800 uppercase tracking-tighter leading-none">Layanan Bintang 5</span>
                                        </div>
                                    </div>

                                    {/* ✅ REFINED: Referral & Voucher Section */}
                                    <div className="mt-4 p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100/50 space-y-3 group">
                                        <h4 className="text-xs font-black text-emerald-800 uppercase tracking-widest flex items-center gap-2">
                                            <div className="p-1 bg-emerald-100 rounded-lg">
                                                <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse" />
                                            </div>
                                            Promo & Referral (Opsional)
                                        </h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[10px] font-bold text-emerald-700 mb-1 uppercase tracking-tighter">Kode Referral</label>
                                                <input
                                                    type="text"
                                                    value={formData.referralCode}
                                                    onChange={e => setFormData({ ...formData, referralCode: e.target.value.toUpperCase() })}
                                                    className="w-full p-2 rounded-xl border border-emerald-100 bg-white/50 focus:bg-white focus:ring-2 focus:ring-emerald-500 text-xs outline-none font-mono"
                                                    placeholder="SYIAR123"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-emerald-700 mb-1 uppercase tracking-tighter">Kode Voucher</label>
                                                <input
                                                    type="text"
                                                    value={formData.voucherCode}
                                                    onChange={e => setFormData({ ...formData, voucherCode: e.target.value.toUpperCase() })}
                                                    className={`w-full p-2 rounded-xl border focus:ring-2 outline-none text-xs font-mono transition-all ${formData.voucherCode ? 'border-emerald-500 bg-emerald-50' : 'border-emerald-100 bg-white/50'}`}
                                                    placeholder="DISKON200"
                                                />
                                            </div>
                                        </div>
                                        {formData.voucherCode && (
                                            <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold bg-white/60 p-1.5 rounded-lg border border-emerald-100">
                                                <span>✨ Voucher Terpasang:</span>
                                                <span className="text-emerald-700">Potongan Rp 200.000</span>
                                            </div>
                                        )}
                                    </div>

                                    <Button
                                        className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-base font-black uppercase tracking-widest shadow-xl shadow-emerald-200"
                                        onClick={handleGenerateVA}
                                        disabled={isProcessing}
                                    >
                                        {isProcessing ? <Loader2 className="animate-spin" /> : 'Lanjut ke Pembayaran'}
                                    </Button>

                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="bg-white/90 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-white/30"
                                >
                                    <div className="text-center mb-8">
                                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <CreditCard className="w-8 h-8 text-blue-600" />
                                        </div>
                                        <h2 className="text-2xl font-bold">Menunggu Pembayaran</h2>
                                        <p className="text-gray-500">Silakan selesaikan pembayaran pada jendela yang terbuka</p>
                                    </div>

                                    <div className="bg-emerald-50 p-6 rounded-2xl border-2 border-dashed border-emerald-200 mb-8 text-center">
                                        <p className="text-sm text-emerald-800 font-bold mb-2">Instruksi Pembayaran</p>
                                        <p className="text-xs text-emerald-700 leading-relaxed">
                                            Buka kembali jendela Midtrans atau cek aplikasi E-Wallet/Mobile Banking Anda jika Anda sudah memilih metode pembayaran.
                                        </p>
                                    </div>

                                    <div className="bg-white/50 p-4 rounded-xl mb-8 flex items-start gap-3 border border-gray-100">
                                        <ShieldCheck className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                                        <div className="text-sm text-gray-700">
                                            <p className="font-bold mb-1 text-gray-900">Pembayaran Aman</p>
                                            <p>Sistem kami memantau transaksi Anda secara real-time. Halaman ini akan otomatis diperbarui setelah pembayaran sukses.</p>
                                        </div>
                                    </div>

                                    <div className="border-t pt-4 mb-8">
                                        <div className="flex justify-between mb-2">
                                            <span className="text-gray-600">Total Harga ({formData.pax} Pax)</span>
                                            <span className="font-bold">Rp {(formData.pax * (pkg?.price || 0)).toLocaleString()}</span>
                                        </div>
                                        {formData.voucherCode && (
                                            <div className="flex justify-between mb-2 text-emerald-600">
                                                <span className="text-sm">Voucher Diskon</span>
                                                <span className="font-medium">- Rp {VOUCHER_DISCOUNT.toLocaleString()}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-lg font-bold">
                                            <span>Harus Dibayar</span>
                                            <span className="text-emerald-600">
                                                Rp {(formData.pax * (pkg?.price || 0) - (formData.voucherCode ? VOUCHER_DISCOUNT : 0)).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center gap-4">
                                        <div className="flex items-center gap-3 text-sm text-emerald-600 font-bold animate-pulse">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Menunggu pembayaran otomatis terdeteksi...</span>
                                        </div>

                                        <button
                                            onClick={() => setStep(1)}
                                            className="text-gray-400 text-xs hover:text-gray-600 transition-colors"
                                        >
                                            Bukan saya? Kembali
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-white/90 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-white/30 text-center"
                                >
                                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <CheckCircle className="w-10 h-10 text-emerald-600" />
                                    </div>
                                    <h2 className="text-2xl font-bold mb-2">Pembayaran Berhasil!</h2>
                                    <div className="bg-gray-50 p-4 rounded-xl mb-8 text-left">
                                        <p className="text-gray-700 text-sm leading-relaxed">
                                            Terima kasih <strong>{formData.name}</strong>, booking Anda sudah kami terima dan pembayaran lunas terverifikasi.
                                            <br /><br />
                                            {regError === 'email-exists' ? (
                                                <>
                                                    <strong className="text-amber-600">Catatan:</strong> Email Anda sudah pernah terdaftar sebelumnya. Booking ini akan otomatis masuk ke data akun lama Anda.
                                                    <br /><br />
                                                    <strong>Langkah Selanjutnya:</strong>
                                                    <br />
                                                    Silakan <strong>login menggunakan email tersebut</strong> di halaman utama untuk melengkapi dokumen.
                                                </>
                                            ) : (
                                                <>
                                                    <strong>Langkah Selanjutnya:</strong>
                                                    <br />
                                                    Robot CS kami akan mem-follow up Anda via WA untuk segera <strong>login menggunakan email & password</strong> yang Anda buat tadi guna melengkapi dokumen paspor & berkas di halaman Profil.
                                                </>
                                            )}
                                        </p>
                                    </div>

                                    <Button
                                        className="bg-emerald-600 text-white w-full h-14 text-lg font-bold rounded-xl"
                                        onClick={() => navigate('/')}
                                    >
                                        {regError ? 'Halaman Utama & Login' : 'Masuk ke Profil & Dokumen'}
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Sidebar Summary (Visible only on Desktop) */}
                    {pkg && (
                        <div className="hidden lg:block lg:col-span-1 h-full">
                            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 sticky top-6 overflow-hidden h-full flex flex-col">
                                {/* Header Struk */}
                                <div className="bg-gradient-to-r from-[#1a4a3a] to-[#2d6a4f] p-4 text-center">
                                    <h3 className="font-bold text-white uppercase tracking-widest text-sm">Ringkasan Pesanan</h3>
                                </div>

                                <div className="p-4 flex-1 flex flex-col">
                                    <div className="relative aspect-video w-full mb-3 group">
                                        <img
                                            src={pkg.image || pkg.photo || 'https://via.placeholder.com/400'}
                                            alt={pkg.name}
                                            className="absolute inset-0 w-full h-full object-cover rounded-xl shadow-md border-2 border-white transform transition-transform group-hover:scale-[1.02] duration-500"
                                        />
                                    </div>
                                    <h4 className="font-extrabold text-gray-900 text-base leading-tight mb-3">{pkg.name}</h4>

                                    {/* Receipt Content */}
                                    <div className="space-y-4 relative">
                                        {/* Info Utama */}
                                        <div className="space-y-2.5">
                                            <div className="flex justify-between items-start text-xs">
                                                <span className="text-gray-500 uppercase font-bold">Keberangkatan</span>
                                                <span className="text-gray-900 font-bold text-right">
                                                    {new Date(pkg.departureDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-gray-500 uppercase font-bold">Durasi</span>
                                                <span className="text-gray-900 font-bold">{pkg.duration} Hari</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-gray-500 uppercase font-bold">Jamaah</span>
                                                <span className="text-gray-900 font-bold">{formData.pax} Orang</span>
                                            </div>
                                        </div>

                                        {/* Dashed Separator */}
                                        <div className="border-t border-dashed border-gray-200 my-3" />

                                        {/* Detail Fasilitas & Akomodasi */}
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black text-emerald-700 uppercase tracking-wider mb-1">Fasilitas & Akomodasi</p>

                                            {pkg.hotel && (
                                                <div className="flex items-start gap-2 text-xs">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1" />
                                                    <span className="text-gray-700"><strong>Hotel:</strong> {pkg.hotel}</span>
                                                </div>
                                            )}
                                            {pkg.airline && (
                                                <div className="flex items-start gap-2 text-xs">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1" />
                                                    <span className="text-gray-700"><strong>Pesawat:</strong> {pkg.airline}</span>
                                                </div>
                                            )}

                                            {/* Inclusions Snippet */}
                                            {pkg.includes && pkg.includes.length > 0 && (
                                                <div className="mt-2 grid grid-cols-1 gap-1.5">
                                                    {pkg.includes.slice(0, 4).map((item: string, idx: number) => (
                                                        <div key={idx} className="flex items-center gap-2 text-[11px] text-gray-600">
                                                            <CheckCircle className="w-3 h-3 text-emerald-500" />
                                                            <span>{item}</span>
                                                        </div>
                                                    ))}
                                                    {pkg.includes.length > 4 && (
                                                        <p className="text-[10px] text-gray-400 italic pl-5">+ {pkg.includes.length - 4} fasilitas lainnya</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Dashed Separator */}
                                        <div className="border-t border-dashed border-gray-200 my-3" />
                                    </div>
                                </div>

                                {/* Payment Footer */}
                                <div className="bg-emerald-50 p-4 rounded-b-2xl border-t border-emerald-100 mt-auto">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] text-emerald-700 font-black uppercase tracking-widest">Total Bayar</span>
                                        <div className="flex items-center gap-1 bg-emerald-200/50 px-2 py-0.5 rounded-full">
                                            <ShieldCheck className="w-3 h-3 text-emerald-700" />
                                            <span className="text-[9px] text-emerald-800 font-bold uppercase">Terlindungi</span>
                                        </div>
                                    </div>

                                    {formData.voucherCode && (
                                        <div className="flex justify-between items-center mb-0.5 text-emerald-600">
                                            <span className="text-[9px] font-bold">Voucher Diskon</span>
                                            <span className="text-xs font-bold">- Rp {VOUCHER_DISCOUNT.toLocaleString()}</span>
                                        </div>
                                    )}

                                    <p className="text-2xl font-black text-emerald-800 tracking-tighter">
                                        Rp {(formData.pax * parseInt(pkg.price) - (formData.voucherCode ? VOUCHER_DISCOUNT : 0)).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BookingFlow;
