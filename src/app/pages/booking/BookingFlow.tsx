import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Trash2,
    Plus,
    Minus,
    ShieldCheck,
    Loader2
} from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../../../config/firebase';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';

const BookingFlow: React.FC = () => {
    const { packageId } = useParams();
    const navigate = useNavigate();

    const [pkg, setPkg] = useState<any>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        pax: 1,
        additionalJamaah: [] as { name: string }[],
        referralCode: '',
        voucherCode: ''
    });

    const VOUCHER_DISCOUNT = 200000;

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
                const newSlots = Array(targetCount - currentCount).fill(null).map(() => ({ name: '' }));
                return { ...prev, additionalJamaah: [...prev.additionalJamaah, ...newSlots] };
            } else {
                return { ...prev, additionalJamaah: prev.additionalJamaah.slice(0, targetCount) };
            }
        });
    }, [formData.pax]);

    const handleWhatsAppBooking = async () => {
        if (!formData.name || !formData.email || !formData.phone) {
            toast.error("Mohon lengkapi data kontak Anda");
            return;
        }

        setIsProcessing(true);
        try {
            const orderId = `SUL-${Date.now()}`;
            const totalAmount = pkg ? (parseInt(pkg.price) * formData.pax) - (formData.voucherCode ? VOUCHER_DISCOUNT : 0) : 0;

            // Save to Firestore for tracking
            await setDoc(doc(db, 'bookings', orderId), {
                id: orderId,
                userId: auth.currentUser?.uid || 'GUEST',
                packageId: pkg.id,
                packageName: pkg.name,
                packagePrice: parseInt(pkg.price),
                paxCount: formData.pax,
                totalAmount: totalAmount,
                status: 'pending_whatsapp',
                jamaah: [
                    { name: formData.name, email: formData.email, phone: formData.phone, documentsUploaded: false },
                    ...formData.additionalJamaah.map(j => ({ name: j.name, phone: '', email: '', documentsUploaded: false }))
                ],
                createdAt: new Date(),
                referralCode: formData.referralCode || null,
                voucherCode: formData.voucherCode || null,
                isGuest: !auth.currentUser
            });

            const waNumber = '6281234700116';
            const message = `Assalamu'alaikum Sultanah Travel, saya ingin memesan paket:
*Paket*: ${pkg.name}
*Total Jamaah*: ${formData.pax} Orang

*Data Pemesan*:
Nama: ${formData.name}
Email: ${formData.email}
No. Telp: ${formData.phone}

${formData.additionalJamaah.length > 0 ? `*Tambahan Jamaah* (${formData.additionalJamaah.length} Orang):\n${formData.additionalJamaah.map((j, i) => `${i + 1}. ${j.name}`).join('\n')}\n` : ''}
*Kode Referral*: ${formData.referralCode || '-'}
*Kode Voucher*: ${formData.voucherCode || '-'}

*Total Pembayaran*: Rp ${totalAmount.toLocaleString('id-ID')}
Saya akan melakukan transfer ke rekening BSI Sultanah. Mohon bantuannya untuk proses selanjutnya.`;

            const encodedMessage = encodeURIComponent(message);
            const waUrl = `https://wa.me/${waNumber}?text=${encodedMessage}`;

            toast.success("Pemesanan terkirim! Mengalihkan ke WhatsApp...");

            setTimeout(() => {
                window.open(waUrl, '_blank');
                navigate('/');
            }, 1500);

        } catch (error) {
            console.error("WhatsApp Booking Error:", error);
            toast.error("Gagal memproses pesanan.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRemoveJamaah = (index: number) => {
        const updated = [...formData.additionalJamaah];
        updated.splice(index, 1);
        setFormData({ ...formData, additionalJamaah: updated });
    };

    return (
        <div className="relative min-h-screen py-12 px-4 overflow-y-auto">
            <div
                className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: 'url("/bg-madinah.jpg")' }}
            >
                <div className="absolute inset-0 bg-black/40" />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto">
                <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => navigate('/', { state: { view: 'packageDetail', id: packageId } })}
                    className="mb-8 flex items-center gap-2 text-white/90 hover:text-white transition-colors bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Kembali ke Detail Paket</span>
                </motion.button>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start max-w-6xl mx-auto">
                    <div className="h-full">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white/90 backdrop-blur-xl p-5 md:p-6 rounded-2xl md:rounded-3xl shadow-2xl border border-white/30 h-full flex flex-col overflow-y-auto custom-scrollbar"
                        >
                            <h2 className="text-xl font-bold mb-4">Lengkapi Data Booking</h2>
                            <div className="space-y-4 flex-1">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Nama Lengkap</label>
                                        <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white outline-none text-sm" placeholder="Sesuai KTP" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
                                        <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white outline-none text-sm" placeholder="nama@email.com" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">WhatsApp</label>
                                        <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white outline-none text-sm" placeholder="0812..." />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Jumlah Jamaah</label>
                                        <div className="flex items-center gap-4">
                                            <button type="button" onClick={() => {
                                                const newPax = Math.max(1, formData.pax - 1);
                                                setFormData({ ...formData, pax: newPax });
                                            }} className="w-10 h-10 border rounded-xl flex items-center justify-center bg-white hover:bg-gray-50 transition-colors shadow-sm"><Minus className="w-5 h-5 text-gray-600" /></button>
                                            <input type="text" readOnly value={formData.pax} className="w-full h-10 text-center border rounded-xl font-bold bg-white text-lg" />
                                            <button type="button" onClick={() => setFormData({ ...formData, pax: formData.pax + 1 })} className="w-10 h-10 border rounded-xl flex items-center justify-center bg-white hover:bg-gray-50 transition-colors shadow-sm"><Plus className="w-5 h-5 text-gray-600" /></button>
                                        </div>
                                    </div>
                                </div>

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
                                                <button type="button" onClick={() => handleRemoveJamaah(index)} className="text-red-500 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                            <div className="grid grid-cols-1 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nama Lengkap</label>
                                                    <input type="text" value={jamaah.name} onChange={e => { const updated = [...formData.additionalJamaah]; updated[index].name = e.target.value; setFormData({ ...formData, additionalJamaah: updated }); }} className="w-full p-2.5 rounded-xl border border-gray-200 bg-white focus:bg-white outline-none text-sm" placeholder="Sesuai KTP" />
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>


                                <div className="mt-5 p-5 md:p-6 rounded-3xl bg-[#ecfdf5] border border-emerald-100/50">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm" />
                                        <h3 className="text-[10px] md:text-xs font-black text-emerald-800 uppercase tracking-widest">KODE REFERRAL & KODE VOUCHER (OPSIONAL)</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[9px] md:text-[10px] font-bold text-emerald-600 uppercase mb-1.5">Kode Referral</label>
                                            <input type="text" value={formData.referralCode} onChange={e => setFormData({ ...formData, referralCode: e.target.value.toUpperCase() })} className="w-full p-3 rounded-xl border border-emerald-200/60 bg-white outline-none text-sm uppercase placeholder-gray-400 font-medium" placeholder="SYIAR123" />
                                        </div>
                                        <div>
                                            <label className="block text-[9px] md:text-[10px] font-bold text-emerald-600 uppercase mb-1.5">Kode Voucher</label>
                                            <div className="relative">
                                                <input type="text" value={formData.voucherCode} onChange={e => setFormData({ ...formData, voucherCode: e.target.value.toUpperCase() })} className="w-full p-3 rounded-xl border border-emerald-200/60 bg-white outline-none text-sm uppercase placeholder-gray-400 font-medium" placeholder="DISKON200" />
                                                {formData.voucherCode && <p className="absolute -bottom-4 text-[8px] md:text-[10px] text-emerald-600 font-bold ml-1 whitespace-nowrap">Terpasang!</p>}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* BSI Bank Info */}
                                <div className="mt-6 p-5 md:p-6 rounded-3xl bg-[#f0f9ff] border border-blue-100 flex items-center gap-5 shadow-sm">
                                    <div className="w-16 h-16 bg-white rounded-2xl p-2 flex items-center justify-center shadow-md border border-blue-50/50 shrink-0">
                                        <img src="/images/bsi-logo.png" alt="BSI Logo" className="w-full h-full object-contain" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                            Informasi Pembayaran BSI
                                        </h3>
                                        <p className="text-lg md:text-xl font-black text-slate-800 tracking-tight leading-none truncate">7123456789</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase mt-1.5 truncate">A.N. PT SULTANAH TRAVEL</p>
                                    </div>
                                </div>
                            </div>

                            <Button
                                className="w-full mt-6 bg-blue-600 hover:bg-blue-700 shadow-blue-200 text-white h-12 md:h-14 text-sm md:text-base font-black uppercase tracking-widest shadow-xl shrink-0"
                                onClick={handleWhatsAppBooking}
                                disabled={isProcessing}
                            >
                                {isProcessing ? <Loader2 className="animate-spin" /> : 'PESAN SEKARANG'}
                            </Button>
                        </motion.div>
                    </div>

                    {/* Summary Sidebar */}
                    {pkg && (
                        <div className="h-full">
                            <div className="bg-white/95 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-2xl border border-white/30 h-full flex flex-col overflow-hidden">
                                <div className="bg-[#1a4a3a] p-3 md:p-4 text-center text-white font-bold uppercase text-xs">Ringkasan Pesanan</div>
                                <div className="p-4 md:p-6 flex-1 flex flex-col">
                                    <img src={pkg.image || pkg.photo || 'https://via.placeholder.com/400'} alt={pkg.name} className="w-full aspect-video object-cover rounded-2xl mb-4 shadow-md border-2 border-white" />
                                    <h4 className="font-extrabold text-gray-900 text-base md:text-lg leading-tight mb-4">{pkg.name}</h4>
                                    <div className="space-y-2.5 text-xs md:text-sm flex-1">
                                        <div className="flex justify-between"><span className="text-gray-500 font-bold">Keberangkatan</span><span className="font-bold">{new Date(pkg.departureDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500 font-bold">Durasi</span><span className="font-bold">{pkg.duration} Hari</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500 font-bold">Jamaah</span><span className="font-bold">{formData.pax} Orang</span></div>
                                        <div className="border-t border-dashed my-4" />
                                        <p className="text-[10px] md:text-xs font-black text-emerald-700 uppercase mb-2">Akomodasi</p>
                                        {pkg.hotel && <p className="text-gray-700">Hotel: {pkg.hotel}</p>}
                                        {pkg.airline && <p className="text-gray-700">Maskapai: {pkg.airline}</p>}
                                    </div>
                                    <div className="bg-emerald-50 p-4 md:p-6 rounded-2xl border border-emerald-100 mt-6">
                                        <div className="flex justify-between items-center mb-1.5 text-[10px] md:text-xs text-emerald-700 font-black uppercase"><span>Total Bayar</span><ShieldCheck className="w-3.5 h-3.5" /></div>
                                        {formData.voucherCode && <div className="flex justify-between text-[10px] md:text-xs text-emerald-600 font-bold mb-1"><span>Voucher Diskon</span><span>- Rp {VOUCHER_DISCOUNT.toLocaleString()}</span></div>}
                                        <p className="text-2xl md:text-3xl font-black text-emerald-800 tracking-tighter">Rp {(formData.pax * parseInt(pkg.price) - (formData.voucherCode ? VOUCHER_DISCOUNT : 0)).toLocaleString()}</p>
                                    </div>
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
