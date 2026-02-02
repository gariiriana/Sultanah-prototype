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

    // Sync additionalJamaah with pax
    useEffect(() => {
        setFormData(prev => {
            const currentCount = prev.additionalJamaah.length;
            const targetCount = prev.pax - 1;

            if (currentCount === targetCount) return prev;

            if (currentCount < targetCount) {
                // Add new jamaah slots
                const newSlots = Array(targetCount - currentCount).fill(null).map(() => ({ name: '', whatsapp: '' }));
                return { ...prev, additionalJamaah: [...prev.additionalJamaah, ...newSlots] };
            } else {
                // Remove excess slots
                return { ...prev, additionalJamaah: prev.additionalJamaah.slice(0, targetCount) };
            }
        });
    }, [formData.pax]);

    // Automated payment detection is now handled by the Midtrans webhook or Snap success callback
    // (Simulation removed for production-ready integration)

    const [paymentMethod, setPaymentMethod] = useState<string>('');
    const [selectedBank, setSelectedBank] = useState<string>('');
    const [paymentResult, setPaymentResult] = useState<any>(null); // ✅ NEW: Store API response

    // Methods
    const PAYMENT_METHODS = [
        { id: 'bank_transfer', name: 'Virtual Account', icon: CreditCard },
        { id: 'gopay', name: 'GoPay / QRIS', icon: Sparkles }
    ];

    const BANKS = [
        { id: 'bca', name: 'BCA', logo: '/banks/bca.png' },
        { id: 'mandiri', name: 'Mandiri', logo: '/banks/mandiri.png' },
        { id: 'bni', name: 'BNI', logo: '/banks/bni.png' },
        { id: 'bri', name: 'BRI', logo: '/banks/bri.png' },
        { id: 'permata', name: 'Permata', logo: '/banks/permata.png' }
    ];

    const handlePayment = async () => {
        if (!formData.name || !formData.email || !formData.phone) {
            toast.error("Mohon lengkapi data diri");
            return;
        }
        if (!paymentMethod) {
            toast.error("Pilih metode pembayaran");
            return;
        }
        if (paymentMethod === 'bank_transfer' && !selectedBank) {
            toast.error("Pilih bank tujuan");
            return;
        }

        setIsProcessing(true);
        try {
            const orderId = `BOOK-${Date.now()}`;
            const grossAmount = parseInt(pkg.price) * formData.pax - (formData.voucherCode ? VOUCHER_DISCOUNT : 0);

            // 1. Call Core API
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
                    },
                    paymentType: paymentMethod,
                    bank: selectedBank
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Gagal memproses pembayaran");
            }

            // 2. Handle Success Response
            setPaymentResult(data);

            // 3. Register/Save Booking as "Pending Payment"
            await handleBookingSubmission(orderId, grossAmount, data);

            setStep(3); // Move to Instruction Page
            toast.success("Kode pembayaran berhasil dibuat!");

        } catch (error: any) {
            console.error("Payment Error:", error);
            toast.error(error.message || "Gagal membuat transaksi");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleBookingSubmission = async (orderId: string, totalAmount: number, paymentData: any) => {
        try {
            // 1. Register user if new
            const userId = await handleAutoRegister();
            if (!userId) throw new Error("Gagal mendaftar user");

            // 2. Save booking (Status: pending_payment)
            await setDoc(doc(db, 'bookings', orderId), {
                id: orderId,
                userId: userId,
                packageId: pkg.id,
                packageName: pkg.name,
                packagePrice: parseInt(pkg.price),
                paxCount: formData.pax,
                totalAmount: totalAmount,
                status: 'pending_payment', // ✅ CHANGED: Logic pending first
                paymentMethod: paymentMethod,
                bank: selectedBank,
                jamaah: [
                    { name: formData.name, email: formData.email, phone: formData.phone, documentsUploaded: false },
                    ...formData.additionalJamaah.map(j => ({ name: j.name, phone: j.whatsapp, email: '', documentsUploaded: false }))
                ],
                createdAt: new Date(),
                midtransOrderId: orderId,
                midtransData: paymentData, // Save full response for reference
                voucherCode: formData.voucherCode || null,
                referralCode: formData.referralCode || null
            });

            // For dashboard welcome logic
            localStorage.setItem('showWelcomeNotification', 'true');

        } catch (error: any) {
            console.error("Booking Save Error:", error);
            toast.error("Gagal menympan data booking. Hubungi CS.");
        }
    };

    const handleRemoveJamaah = (index: number) => {
        const updated = [...formData.additionalJamaah];
        updated.splice(index, 1);
        setFormData({ ...formData, additionalJamaah: updated });
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
                toast.error(`Gagal mendaftar: ${error.message}`);
                return null;
            }
        }
    };

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
                    {/* ... (Summary logic) ... */}

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
                                    {/* ... (Existing Form Data) ... */}
                                    <h2 className="text-lg font-bold mb-3">Lengkapi Data Booking</h2>
                                    {/* (Keep existing input fields for Step 1) */}
                                    <div className="space-y-4 flex-1">
                                        {/* ... (Same inputs as before: Name, Email, Password, Phone, Pax) ... */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nama Lengkap</label>
                                                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white outline-none text-sm" placeholder="Sesuai KTP" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Email</label>
                                                <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white outline-none text-sm" placeholder="nama@email.com" />
                                            </div>
                                            <div className="md:col-span-2 relative">
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Password Akun</label>
                                                <div className="relative">
                                                    <input type={showPassword ? "text" : "password"} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white outline-none text-sm pr-10" placeholder="••••••••" />
                                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><Eye className="w-4 h-4" /></button>
                                                </div>
                                                <p className="text-[10px] text-gray-400 italic mt-1">*Digunakan untuk login dokumen nanti</p>
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">WhatsApp</label>
                                                <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white outline-none text-sm" placeholder="0812..." />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Jumlah Jamaah</label>
                                                <div className="flex items-center gap-3">
                                                    <button type="button" onClick={() => { /* ... logic ... */
                                                        const newPax = Math.max(1, formData.pax - 1);
                                                        setFormData({ ...formData, pax: newPax });
                                                    }} className="w-10 h-10 border rounded-xl flex items-center justify-center"><Minus className="w-5 h-5" /></button>
                                                    <input type="text" readOnly value={formData.pax} className="w-full h-10 text-center border rounded-xl font-bold" />
                                                    <button type="button" onClick={() => setFormData({ ...formData, pax: formData.pax + 1 })} className="w-10 h-10 border rounded-xl flex items-center justify-center"><Plus className="w-5 h-5" /></button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Additional Jamaah Inputs */}
                                        <AnimatePresence>
                                            {formData.additionalJamaah.map((jamaah, index) => (
                                                <motion.div
                                                    key={index}
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-3"
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <h3 className="text-sm font-bold text-gray-700">Data Jamaah {index + 2}</h3>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveJamaah(index)}
                                                            className="text-red-500 hover:text-red-600 transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nama Lengkap</label>
                                                            <input
                                                                type="text"
                                                                value={jamaah.name}
                                                                onChange={e => {
                                                                    const updated = [...formData.additionalJamaah];
                                                                    updated[index].name = e.target.value;
                                                                    setFormData({ ...formData, additionalJamaah: updated });
                                                                }}
                                                                className="w-full p-2.5 rounded-xl border border-gray-200 bg-white focus:bg-white outline-none text-sm"
                                                                placeholder="Sesuai KTP"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">WhatsApp</label>
                                                            <input
                                                                type="tel"
                                                                value={jamaah.whatsapp}
                                                                onChange={e => {
                                                                    const updated = [...formData.additionalJamaah];
                                                                    updated[index].whatsapp = e.target.value;
                                                                    setFormData({ ...formData, additionalJamaah: updated });
                                                                }}
                                                                className="w-full p-2.5 rounded-xl border border-gray-200 bg-white focus:bg-white outline-none text-sm"
                                                                placeholder="0812..."
                                                            />
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>

                                        {/* Feature Cards */}
                                        {/* Feature Cards */}
                                        {/* Feature Cards */}
                                        <div className="grid grid-cols-3 gap-3 my-4">
                                            <div className="bg-white p-3 rounded-2xl border border-emerald-400 shadow-[0_2px_8px_rgba(16,185,129,0.15)] flex flex-col items-center justify-center text-center gap-1.5 relative overflow-hidden">
                                                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center mb-0.5">
                                                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                                </div>
                                                <span className="text-[9px] font-black text-emerald-900 uppercase leading-none">Keamanan<br />Terjamin</span>
                                            </div>
                                            <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center gap-1.5">
                                                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center mb-0.5">
                                                    <Sparkles className="w-4 h-4 text-emerald-500" />
                                                </div>
                                                <span className="text-[9px] font-bold text-gray-600 uppercase leading-none">Konfirmasi<br />Instan</span>
                                            </div>
                                            <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center gap-1.5">
                                                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center mb-0.5">
                                                    <Heart className="w-4 h-4 text-emerald-500" />
                                                </div>
                                                <span className="text-[9px] font-bold text-gray-600 uppercase leading-none">Layanan<br />Bintang 5</span>
                                            </div>
                                        </div>

                                        {/* Referral & Voucher Section (Green Box) */}
                                        <div className="mt-4 p-5 rounded-3xl bg-[#ecfdf5] border border-emerald-100/50">
                                            <div className="flex items-center gap-2.5 mb-4">
                                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                                                <h3 className="text-xs font-black text-emerald-800 uppercase tracking-widest">Promo & Referral (Opsional)</h3>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1.5 ml-1">Kode Referral</label>
                                                    <input
                                                        type="text"
                                                        value={formData.referralCode}
                                                        onChange={e => setFormData({ ...formData, referralCode: e.target.value.toUpperCase() })}
                                                        className="w-full p-3 rounded-xl border border-emerald-200/60 bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm uppercase placeholder-gray-400 font-medium transition-all shadow-sm"
                                                        placeholder="SYIAR123"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1.5 ml-1">Kode Voucher</label>
                                                    <input
                                                        type="text"
                                                        value={formData.voucherCode}
                                                        onChange={e => setFormData({ ...formData, voucherCode: e.target.value.toUpperCase() })}
                                                        className="w-full p-3 rounded-xl border border-emerald-200/60 bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm uppercase placeholder-gray-400 font-medium transition-all shadow-sm"
                                                        placeholder="DISKON200"
                                                    />
                                                    {formData.voucherCode && (
                                                        <p className="text-[10px] text-emerald-600 font-bold mt-1.5 ml-1">
                                                            Potongan Rp {VOUCHER_DISCOUNT.toLocaleString()} akan aktif!
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-base font-black uppercase tracking-widest shadow-xl shadow-emerald-200"
                                        onClick={() => setStep(2)} // ✅ Go to Payment Selection
                                    >
                                        LANJUT KE PEMBAYARAN
                                    </Button>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="bg-white/90 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-white/30 h-full flex flex-col"
                                >
                                    <h2 className="text-xl font-bold mb-6">Pilih Metode Pembayaran</h2>

                                    <div className="space-y-4 flex-1 overflow-y-auto">
                                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Transfer Virtual Account</p>
                                        <div className="grid grid-cols-1 gap-3">
                                            {BANKS.map((bank) => (
                                                <div
                                                    key={bank.id}
                                                    onClick={() => {
                                                        setPaymentMethod('bank_transfer');
                                                        setSelectedBank(bank.id);
                                                    }}
                                                    className={`p-4 rounded-xl border flex items-center gap-4 cursor-pointer transition-all ${selectedBank === bank.id ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500' : 'border-gray-200 hover:border-emerald-200 hover:bg-gray-50'}`}
                                                >
                                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedBank === bank.id ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'}`}>
                                                        {selectedBank === bank.id && <div className="w-2 h-2 bg-white rounded-full" />}
                                                    </div>
                                                    <CreditCard className="w-6 h-6 text-gray-600" />
                                                    <span className="font-bold text-gray-700">{bank.name} Virtual Account</span>
                                                </div>
                                            ))}
                                        </div>

                                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mt-6">E-Wallet / QRIS</p>
                                        <div
                                            onClick={() => {
                                                setPaymentMethod('gopay');
                                                setSelectedBank('');
                                            }}
                                            className={`p-4 rounded-xl border flex items-center gap-4 cursor-pointer transition-all ${paymentMethod === 'gopay' ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500' : 'border-gray-200 hover:border-emerald-200 hover:bg-gray-50'}`}
                                        >
                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${paymentMethod === 'gopay' ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'}`}>
                                                {paymentMethod === 'gopay' && <div className="w-2 h-2 bg-white rounded-full" />}
                                            </div>
                                            <Sparkles className="w-6 h-6 text-blue-500" />
                                            <span className="font-bold text-gray-700">GoPay / QRIS</span>
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-4 border-t space-y-3">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-600">Total Tagihan</span>
                                            <span className="font-bold text-emerald-700 text-lg">
                                                Rp {(formData.pax * parseInt(pkg.price) - (formData.voucherCode ? VOUCHER_DISCOUNT : 0)).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex gap-3">
                                            <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Kembali</Button>
                                            <Button
                                                className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white"
                                                onClick={handlePayment}
                                                disabled={!paymentMethod || isProcessing}
                                            >
                                                {isProcessing ? <Loader2 className="animate-spin" /> : 'Bayar Sekarang'}
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {step === 3 && paymentResult && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-white/90 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-white/30 h-full flex flex-col"
                                >
                                    <div className="text-center mb-6">
                                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <CheckCircle className="w-8 h-8 text-emerald-600" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-gray-900">Menunggu Pembayaran</h2>
                                        <p className="text-sm text-gray-500 mt-1">Selesaikan pembayaran sebelum {new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>

                                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-6 flex-1 flex flex-col justify-center items-center text-center">
                                        {paymentResult.payment_type === 'bank_transfer' || paymentResult.payment_type === 'echannel' || paymentResult.payment_type === 'permata' ? (
                                            <>
                                                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Nomor Virtual Account</p>
                                                <div className="text-3xl font-mono font-bold text-emerald-600 tracking-wider mb-2 select-all">
                                                    {paymentResult.permata_va_number ||
                                                        paymentResult.va_numbers?.[0]?.va_number ||
                                                        paymentResult.bill_key ||
                                                        "Error"}
                                                </div>
                                                {paymentResult.biller_code && <p className="text-xs text-gray-500">Kode Biller: {paymentResult.biller_code}</p>}
                                                <p className="text-xs text-gray-400 mt-4">Salin nomor di atas dan bayar melalui ATM/M-Banking {selectedBank.toUpperCase()}</p>
                                            </>
                                        ) : paymentResult.payment_type === 'gopay' || paymentResult.payment_type === 'qris' ? (
                                            <>
                                                <img src={paymentResult.actions?.find((a: any) => a.name === 'generate-qr-code')?.url} alt="QR Code" className="w-48 h-48 mx-auto mix-blend-multiply" />
                                                <p className="text-sm font-bold mt-4">Scan QRIS</p>
                                            </>
                                        ) : (
                                            <p>Ikuti instruksi pembayaran yang dikirim ke email Anda.</p>
                                        )}
                                    </div>

                                    <Button
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                                        onClick={() => navigate('/dashboard')}
                                    >
                                        Cek Status di Dashboard
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>



                    {/* Sidebar Summary (Visible only on Desktop) */}
                    {
                        pkg && (
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
                        )
                    }
                </div>
            </div >
        </div >
    );
};

export default BookingFlow;
