import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Trash2,
    Plus,
    Minus,
    FileText,
    Loader2,
    Users,
    Package,
    Receipt
} from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../../../config/firebase';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { exportBookingInvoicePDF } from './BookingInvoicePDF';

const BookingFlow: React.FC = () => {
    const { packageId } = useParams();
    const navigate = useNavigate();

    const [pkg, setPkg] = useState<any>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [exportingPdf, setExportingPdf] = useState(false);

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
                    toast.error('Paket tidak ditemukan');
                    navigate('/');
                }
            } catch (error) {
                console.error('Error fetching package:', error);
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
            toast.error('Mohon lengkapi data kontak Anda');
            return;
        }

        setIsProcessing(true);
        try {
            const orderId = `SUL-${Date.now()}`;
            const totalAmount = pkg ? (parseInt(pkg.price) * formData.pax) - (formData.voucherCode ? VOUCHER_DISCOUNT : 0) : 0;

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

            // Jika di localhost, kita arahkan ke domain produksi agar Admin bisa buka linknya.
            // Gunakan window.location.origin jika sudah di produksi (Firebase Hosting).
            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const productionUrl = 'https://sultanah-travel-6a382.web.app';
            const invoiceUrl = `${isLocal ? productionUrl : window.location.origin}/invoice/${orderId}`;
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

*Link Invoice Online*:
${invoiceUrl}

Saya akan melakukan transfer ke rekening BSI Sultanah. Mohon bantuannya untuk proses selanjutnya.`;

            const encodedMessage = encodeURIComponent(message);
            const waUrl = `https://wa.me/${waNumber}?text=${encodedMessage}`;

            toast.success('Pemesanan terkirim! Mengalihkan ke WhatsApp...');

            setTimeout(() => {
                window.open(waUrl, '_blank');
                navigate('/');
            }, 1500);
        } catch (error) {
            console.error('WhatsApp Booking Error:', error);
            toast.error('Gagal memproses pesanan.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleExportPDF = () => {
        if (!pkg) { toast.error('Data paket belum dimuat'); return; }
        setExportingPdf(true);
        try {
            exportBookingInvoicePDF({
                name: formData.name || 'Calon Jamaah',
                email: formData.email || '-',
                phone: formData.phone || '-',
                jamaahList: formData.additionalJamaah,
                pax: formData.pax,
                pkg,
                voucherCode: formData.voucherCode,
                voucherDiscount: VOUCHER_DISCOUNT,
                referralCode: formData.referralCode,
            });
        } catch (e) {
            toast.error('Gagal membuat invoice PDF');
        } finally {
            setExportingPdf(false);
        }
    };

    const handleRemoveJamaah = (index: number) => {
        const updated = [...formData.additionalJamaah];
        updated.splice(index, 1);
        setFormData({ ...formData, additionalJamaah: updated });
    };

    const total = pkg
        ? formData.pax * parseInt(pkg.price) - (formData.voucherCode ? VOUCHER_DISCOUNT : 0)
        : 0;

    return (
        <div className="relative min-h-screen py-12 px-4 overflow-y-auto">
            <div
                className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: 'url("/bg-madinah.jpg")' }}
            >
                <div className="absolute inset-0 bg-black/40" />
            </div>

            <div className="relative z-10 max-w-2xl mx-auto">
                <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => navigate('/', { state: { view: 'packageDetail', id: packageId } })}
                    className="mb-8 flex items-center gap-2 text-white/90 hover:text-white transition-colors bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Kembali ke Detail Paket</span>
                </motion.button>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/90 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-2xl border border-white/30 overflow-hidden"
                >
                    {/* ===== FORM SECTION ===== */}
                    <div className="p-5 md:p-7">
                        <h2 className="text-xl font-bold mb-5">Lengkapi Data Booking</h2>
                        <div className="space-y-4">
                            {/* Nama */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Nama Lengkap</label>
                                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white outline-none text-sm" placeholder="Sesuai KTP" />
                            </div>

                            {/* Email + WA */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
                                    <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white outline-none text-sm" placeholder="nama@email.com" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">WhatsApp</label>
                                    <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white outline-none text-sm" placeholder="0812..." />
                                </div>
                            </div>

                            {/* Jumlah Jamaah */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Jumlah Jamaah</label>
                                <div className="flex items-center gap-4">
                                    <button type="button" onClick={() => setFormData({ ...formData, pax: Math.max(1, formData.pax - 1) })} className="w-10 h-10 border rounded-xl flex items-center justify-center bg-white hover:bg-gray-50 transition-colors shadow-sm">
                                        <Minus className="w-5 h-5 text-gray-600" />
                                    </button>
                                    <input type="text" readOnly value={formData.pax} className="w-full h-10 text-center border rounded-xl font-bold bg-white text-lg" />
                                    <button type="button" onClick={() => setFormData({ ...formData, pax: formData.pax + 1 })} className="w-10 h-10 border rounded-xl flex items-center justify-center bg-white hover:bg-gray-50 transition-colors shadow-sm">
                                        <Plus className="w-5 h-5 text-gray-600" />
                                    </button>
                                </div>
                            </div>

                            {/* Additional Jamaah */}
                            <AnimatePresence>
                                {formData.additionalJamaah.map((jamaah, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="p-4 rounded-xl border border-gray-100 bg-gray-50/50"
                                    >
                                        <div className="flex justify-between items-center mb-3">
                                            <h3 className="text-sm font-bold text-gray-700">Data Jamaah {index + 2}</h3>
                                            <button type="button" onClick={() => handleRemoveJamaah(index)} className="text-red-500 hover:text-red-600 transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nama Lengkap</label>
                                        <input type="text" value={jamaah.name} onChange={e => { const updated = [...formData.additionalJamaah]; updated[index].name = e.target.value; setFormData({ ...formData, additionalJamaah: updated }); }} className="w-full p-2.5 rounded-xl border border-gray-200 bg-white outline-none text-sm" placeholder="Sesuai KTP" />
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {/* Kode Referral & Voucher */}
                            <div className="p-4 md:p-5 rounded-2xl bg-[#ecfdf5] border border-emerald-100/50">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                                    <h3 className="text-[10px] md:text-xs font-black text-emerald-800 uppercase tracking-widest">Kode Referral &amp; Kode Voucher (Opsional)</h3>
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
                                            {formData.voucherCode && <p className="absolute -bottom-4 text-[10px] text-emerald-600 font-bold ml-1 whitespace-nowrap">Terpasang!</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* ===== RINGKASAN INVOICE (same card) ===== */}
                    {pkg && (
                        <div className="px-5 md:px-7 pb-2">
                            <div className="border-t border-dashed border-gray-200 mb-5" />

                            <div className="flex items-center gap-2 mb-4">
                                <Receipt className="w-4 h-4 text-emerald-600" />
                                <h3 className="text-xs font-black text-gray-700 uppercase tracking-widest">Ringkasan Invoice</h3>
                            </div>

                            {/* Paket info */}
                            <div className="bg-gray-50 rounded-2xl p-4 mb-3">
                                <div className="flex gap-3 items-center mb-3">
                                    <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
                                        <Package className="w-4 h-4 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Paket Dipilih</p>
                                        <p className="font-extrabold text-gray-900 text-sm leading-tight">{pkg.name}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                    {pkg.departureDate && (<><span className="text-gray-500 font-semibold">Keberangkatan</span><span className="font-bold text-right">{new Date(pkg.departureDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span></>)}
                                    {pkg.duration && (<><span className="text-gray-500 font-semibold">Durasi</span><span className="font-bold text-right">{pkg.duration} Hari</span></>)}
                                    {pkg.hotel && (<><span className="text-gray-500 font-semibold">Hotel</span><span className="font-bold text-right">{pkg.hotel}</span></>)}
                                    {pkg.airline && (<><span className="text-gray-500 font-semibold">Maskapai</span><span className="font-bold text-right">{pkg.airline}</span></>)}
                                </div>
                            </div>

                            {/* Pricing */}
                            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-500 font-semibold">Harga/pax</span>
                                    <span className="font-bold">Rp {parseInt(pkg.price).toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-500 font-semibold flex items-center gap-1.5">
                                        <Users className="w-3.5 h-3.5 text-blue-400" />{formData.pax} Jamaah
                                    </span>
                                    <span className="font-bold">Rp {(formData.pax * parseInt(pkg.price)).toLocaleString('id-ID')}</span>
                                </div>
                                {formData.voucherCode && (
                                    <div className="flex justify-between text-sm mb-2 text-emerald-600">
                                        <span className="font-bold">Diskon Voucher</span>
                                        <span className="font-bold">- Rp {VOUCHER_DISCOUNT.toLocaleString('id-ID')}</span>
                                    </div>
                                )}
                                <div className="border-t border-emerald-200 pt-3 flex justify-between items-center mb-3">
                                    <span className="text-xs font-black text-emerald-700 uppercase tracking-wider">Total Bayar</span>
                                    <p className="text-2xl font-black text-emerald-800 tracking-tighter">
                                        Rp {total.toLocaleString('id-ID')}
                                    </p>
                                </div>
                                {/* BSI Bank Info */}
                                <div className="flex items-center gap-3 bg-blue-50 rounded-xl px-3 py-2.5 border border-blue-100">
                                    <div className="w-10 h-10 bg-white rounded-xl p-1.5 flex items-center justify-center shadow-sm border border-blue-100 shrink-0">
                                        <img src="/images/bsi-logo.png" alt="BSI" className="w-full h-full object-contain" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-black text-blue-700 uppercase tracking-widest mb-0.5">Transfer ke Rekening BSI</p>
                                        <p className="text-base font-black text-slate-800 tracking-tight leading-none">7123456789</p>
                                        <p className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">A.N. PT SULTANAH TRAVEL</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ===== ACTION BUTTONS ===== */}
                    <div className="p-5 md:p-7 pt-4 flex flex-col gap-3">
                        <Button
                            className="w-full bg-blue-600 hover:bg-blue-700 shadow-blue-200 text-white h-12 md:h-14 text-sm md:text-base font-black uppercase tracking-widest shadow-xl"
                            onClick={handleWhatsAppBooking}
                            disabled={isProcessing}
                        >
                            {isProcessing ? <Loader2 className="animate-spin" /> : 'Pesan Sekarang'}
                        </Button>
                        {pkg && (
                            <button
                                onClick={handleExportPDF}
                                disabled={exportingPdf}
                                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#1a3a2a] to-[#2a5a3a] hover:from-[#1a4a35] hover:to-[#2d6a45] text-white font-black uppercase tracking-widest text-xs py-4 rounded-xl shadow-lg shadow-emerald-900/20 transition-all active:scale-[0.99] disabled:opacity-70"
                            >
                                {exportingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4 text-yellow-300" />}
                                Export Invoice PDF
                            </button>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default BookingFlow;
