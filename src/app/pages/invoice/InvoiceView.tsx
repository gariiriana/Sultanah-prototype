import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { Button } from '../../components/ui/button';
import { ArrowLeft, Printer, Users, Star, UserCheck, Plane, Building2, Navigation, FileText } from 'lucide-react';
import { exportBookingInvoicePDF } from '../booking/BookingInvoicePDF';
import { motion } from 'motion/react';
import { toast } from 'sonner';

const InvoiceView: React.FC = () => {
    const { bookingId } = useParams<{ bookingId: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState<any>(null);
    const [pkg, setPkg] = useState<any>(null);

    useEffect(() => {
        if (bookingId) {
            fetchData();
        }
    }, [bookingId]);

    const fetchData = async () => {
        try {
            const bSnap = await getDoc(doc(db, 'bookings', bookingId!));
            if (!bSnap.exists()) {
                toast.error('Booking not found');
                setLoading(false);
                return;
            }
            const bData = bSnap.data();
            setBooking({ id: bSnap.id, ...bData });

            if (bData.packageId) {
                const pSnap = await getDoc(doc(db, 'packages', bData.packageId));
                if (pSnap.exists()) {
                    setPkg({ id: pSnap.id, ...pSnap.data() });
                }
            }
        } catch (error) {
            console.error('Error fetching invoice data:', error);
            toast.error('Failed to load invoice');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        if (!booking) return;

        // We reuse the same PDF export logic but passing it the data from our state
        exportBookingInvoicePDF({
            name: booking.userName || 'Calon Jamaah',
            email: booking.userEmail || '-',
            phone: booking.userPhone || booking.phoneNumber || '-',
            jamaahList: (booking.jamaah || []).slice(1), // excluding primary
            pax: booking.paxCount || 1,
            pkg: pkg || { name: booking.packageName, price: booking.packagePrice || booking.totalAmount },
            bookingId: booking.id,
            voucherCode: booking.voucherCode,
            voucherDiscount: booking.voucherDiscount || 0,
            referralCode: booking.referralCode,
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Memuat Invoice...</p>
                </div>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FileText className="w-10 h-10 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Invoice Tidak Ditemukan</h1>
                    <p className="text-gray-600 mb-8">Maaf, kami tidak dapat menemukan data invoice yang Anda cari.</p>
                    <Button onClick={() => navigate('/')} className="w-full bg-[#1a1a1a] hover:bg-black text-white">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Kembali ke Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    const formatRupiah = (n: number) => {
        return 'Rp ' + n.toLocaleString('id-ID');
    };

    const formatDate = (dateStr?: any) => {
        if (!dateStr) return '-';
        const date = dateStr.toDate ? dateStr.toDate() : new Date(dateStr);
        return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Top Bar for Controls */}
            <div className="bg-white border-b sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                    <Button variant="ghost" onClick={() => navigate('/')} className="text-gray-600">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Kembali
                    </Button>
                    <div className="flex gap-2">
                        <Button onClick={handlePrint} className="bg-[#D4AF37] hover:bg-[#B8962F] text-white shadow-lg">
                            <Printer className="w-4 h-4 mr-2" />
                            Cetak / Simpan PDF
                        </Button>
                    </div>
                </div>
            </div>

            {/* Invoice Container */}
            <div className="max-w-4xl mx-auto px-4 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100"
                >
                    {/* Header */}
                    <div className="p-8 md:p-10 border-b-4 border-[#D4AF37] flex flex-col md:flex-row justify-between gap-8">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-[#1a1a1a] rounded-xl flex items-center justify-center overflow-hidden">
                                    <img src="/images/logo.png" alt="Sultanah" className="w-full h-full object-contain p-1" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-black text-gray-900 leading-tight uppercase tracking-tight">Sultanah Travel</h1>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Umroh & Haji Premium</p>
                                </div>
                            </div>
                            <div className="space-y-1 text-sm text-gray-600">
                                <p>PT Sultanah Travel Premium</p>
                                <p>sultanahtravel.id | info@sultanahtravel.id</p>
                            </div>
                        </div>

                        <div className="text-right">
                            <h2 className="text-4xl font-black text-[#D4AF37] mb-2">INVOICE</h2>
                            <p className="text-gray-900 font-bold font-mono uppercase">{booking.id}</p>
                            <p className="text-xs text-gray-500 mt-1">Tanggal: {formatDate(booking.createdAt)}</p>
                            <div className="mt-4 inline-block px-4 py-1.5 bg-amber-100 border-2 border-amber-600 rounded-lg text-amber-700 font-black text-xs uppercase tracking-widest">
                                PENDING WA
                            </div>
                        </div>
                    </div>

                    <div className="p-8 md:p-10">
                        {/* Billing Info */}
                        <div className="flex flex-col md:flex-row justify-between gap-10 mb-12">
                            <div className="flex-1">
                                <h3 className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-4">Tagihan Untuk:</h3>
                                <p className="text-xl font-bold text-gray-900 mb-1">{booking.userName}</p>
                                <p className="text-gray-600">{booking.userEmail}</p>
                                {booking.phoneNumber && <p className="text-gray-600">{booking.phoneNumber}</p>}
                                {booking.referralCode && (
                                    <p className="mt-3 text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full inline-block font-bold">
                                        Referral: {booking.referralCode}
                                    </p>
                                )}
                            </div>
                            <div className="flex-1 md:text-right">
                                <h3 className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-4">Metode Pembayaran:</h3>
                                <p className="text-lg font-bold text-gray-900 mb-1">Bank Syariah Indonesia (BSI)</p>
                                <p className="text-2xl font-black text-blue-700 tracking-wider">7123456789</p>
                                <p className="text-sm text-gray-600 font-bold uppercase tracking-tight">A.N. PT Sultanah Travel</p>
                            </div>
                        </div>

                        {/* Package Summary */}
                        <div className="mb-12 overflow-hidden border border-gray-200 rounded-xl">
                            <table className="w-full text-left">
                                <thead className="bg-[#1a1a1a] text-[#D4AF37] text-[10px] items-center font-bold uppercase tracking-widest">
                                    <tr>
                                        <th className="px-6 py-4">Deskripsi Paket</th>
                                        <th className="px-6 py-4 text-center">Jamaah</th>
                                        <th className="px-6 py-4 text-right">Harga/Pax</th>
                                        <th className="px-6 py-4 text-right">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 italic md:not-italic underline-offset-4">
                                    <tr>
                                        <td className="px-6 py-6 font-bold text-gray-900">
                                            <p className="text-lg mb-1">{booking.packageName}</p>
                                            {pkg && <p className="text-xs text-gray-500 mt-2 font-normal line-clamp-2 leading-relaxed">{pkg.description}</p>}
                                            {pkg && (
                                                <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-4 text-[11px] font-bold text-gray-500 uppercase tracking-tight italic">
                                                    {pkg.duration && <div className="flex gap-2"><span>Durasi:</span> <span className="text-gray-900">{pkg.duration} Hari</span></div>}
                                                    {pkg.departureDate && <div className="flex gap-2"><span>Berangkat:</span> <span className="text-gray-900">{pkg.departureDate}</span></div>}
                                                    {pkg.hotel && <div className="flex gap-2"><span>Hotel:</span> <span className="text-gray-900 truncate">{pkg.hotel}</span></div>}
                                                    {pkg.airline && <div className="flex gap-2"><span>Maskapai:</span> <span className="text-gray-900 truncate">{pkg.airline}</span></div>}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-6 text-center font-black text-gray-900">{booking.paxCount} Orang</td>
                                        <td className="px-6 py-6 text-right font-medium text-gray-600">{formatRupiah(booking.packagePrice || (booking.totalAmount / booking.paxCount))}</td>
                                        <td className="px-6 py-6 text-right font-black text-gray-900 text-lg">{formatRupiah((booking.packagePrice || (booking.totalAmount / booking.paxCount)) * booking.paxCount)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Package Full Details - Grid layout */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                            {/* Features */}
                            {pkg?.features && pkg.features.length > 0 && (
                                <div className="p-6 bg-amber-50/50 border border-amber-200/50 rounded-2xl">
                                    <h4 className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Star className="w-3 h-3" />
                                        Fasilitas Utama
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {pkg.features.map((f: string, i: number) => (
                                            <div key={i} className="px-3 py-1 bg-white border border-amber-200 rounded-full text-xs text-amber-900 font-bold drop-shadow-sm">
                                                ✓ {f}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Tim Pembimbing */}
                            <div className="p-6 bg-purple-50 border border-purple-200/50 rounded-2xl">
                                <h4 className="text-[10px] font-black text-purple-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <UserCheck className="w-3 h-3" />
                                    Tim Pembimbing
                                </h4>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-purple-600 font-bold uppercase">Tour Leader</span>
                                        <span className="text-sm font-black text-gray-900 font-sans">{pkg?.tourLeaderName || 'TBA'}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-purple-600 font-bold uppercase">Muthawif</span>
                                        <span className="text-sm font-black text-gray-900 font-sans">{pkg?.muthawifName || 'TBA'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Akomodasi & Transportasi */}
                            {(pkg?.hotel || pkg?.airline) && (
                                <div className="p-6 bg-blue-50/50 border border-blue-200/50 rounded-2xl">
                                    <h4 className="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Plane className="w-3 h-3" />
                                        Akomodasi & Pesawat
                                    </h4>
                                    <div className="space-y-3 font-sans">
                                        {pkg.hotel && (
                                            <div className="flex gap-3">
                                                <Building2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                                                <div><p className="text-[10px] text-blue-400 font-bold uppercase tracking-tight">Penginapan/Hotel</p><p className="text-sm font-black text-gray-900">{pkg.hotel}</p></div>
                                            </div>
                                        )}
                                        {pkg.airline && (
                                            <div className="flex gap-3">
                                                <Plane className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                                                <div><p className="text-[10px] text-blue-400 font-bold uppercase tracking-tight">Maskapai Penerbangan</p><p className="text-sm font-black text-gray-900">{pkg.airline}</p></div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Keberangkatan */}
                            {pkg?.meetingPoint && (
                                <div className="p-6 bg-emerald-50/50 border border-emerald-200/50 rounded-2xl">
                                    <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Navigation className="w-3 h-3" />
                                        Titik Keberangkatan
                                    </h4>
                                    <p className="text-base font-black text-gray-900">{pkg.meetingPoint}</p>
                                    <p className="text-[10px] text-emerald-600 mt-1 uppercase font-bold tracking-widest">Kumpul di lokasi 4 jam sebelum takeoff</p>
                                </div>
                            )}
                        </div>

                        {/* List Jamaah */}
                        <div className="mb-12">
                            <h3 className="text-[11px] font-black text-[#D4AF37] uppercase tracking-widest mb-4 border-b pb-2 flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Daftar Jamaah yang Berangkat
                            </h3>
                            <div className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-emerald-700 text-emerald-100 text-[9px] uppercase font-black font-sans tracking-widest">
                                            <th className="px-6 py-3 text-center w-12">No.</th>
                                            <th className="px-6 py-3">Nama Lengkap Sesuai KTP</th>
                                            <th className="px-6 py-3">Keterangan</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-emerald-50 text-sm">
                                        {(booking.jamaah || [{ name: booking.userName }]).map((j: any, i: number) => (
                                            <tr key={i}>
                                                <td className="px-6 py-4 text-center text-emerald-800 font-black">{i + 1}</td>
                                                <td className="px-6 py-4 font-bold text-gray-900 text-lg uppercase font-sans tracking-tight">{j.name}</td>
                                                <td className="px-6 py-4 italic text-emerald-600 font-bold text-xs uppercase">{i === 0 ? '(Pemesan Utama)' : ''}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Itinerary */}
                        {pkg?.itinerary && pkg.itinerary.length > 0 && (
                            <div className="mb-12">
                                <h3 className="text-[11px] font-black text-[#D4AF37] uppercase tracking-widest mb-4 border-b pb-2 flex items-center gap-2">
                                    <Navigation className="w-4 h-4" />
                                    Itinerary Perjalanan
                                </h3>
                                <div className="bg-white border-2 border-amber-100 rounded-2xl overflow-hidden shadow-sm">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="bg-amber-500 text-white font-black uppercase text-[10px] tracking-widest">
                                                <th className="px-6 py-4 w-24 text-center">Hari</th>
                                                <th className="px-6 py-4">Kegiatan / Destinasi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-amber-100">
                                            {pkg.itinerary.map((it: string, i: number) => (
                                                <tr key={i} className={i % 2 === 0 ? 'bg-amber-50/20' : 'bg-white'}>
                                                    <td className="px-6 py-4 text-center font-black text-amber-600">Hari {i + 1}</td>
                                                    <td className="px-6 py-4 text-gray-700 leading-relaxed">{it}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Terms */}
                        {pkg?.terms && (
                            <div className="mb-12">
                                <h3 className="text-[11px] font-black text-[#D4AF37] uppercase tracking-widest mb-4 border-b pb-2">
                                    📋 Syarat & Ketentuan
                                </h3>
                                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 italic">
                                    <p className="text-xs text-gray-500 whitespace-pre-wrap leading-loose font-bold">{pkg.terms}</p>
                                </div>
                            </div>
                        )}

                        {/* Summary & Totals */}
                        <div className="flex flex-col md:flex-row justify-between items-start gap-10">
                            <div className="flex-1 max-w-sm">
                                <div className="p-6 bg-amber-50 border-2 border-amber-200 rounded-3xl">
                                    <h4 className="text-lg font-black text-amber-800 mb-2 italic">Informasi Pembayaran:</h4>
                                    <p className="text-xs text-amber-700 leading-relaxed mb-4">
                                        Transfer pembayaran Anda ke rekening resmi Sultanah Travel melalui BSI. Kemudian, kirimkan bukti transfer Anda kepada Admin melalui WhatsApp atau melampirkannya di portal jamaah.
                                    </p>
                                    <div className="space-y-4">
                                        <span className="block text-[10px] text-amber-600 font-black uppercase tracking-widest">Akun Rekening BSI:</span>
                                        <div className="flex items-center justify-between font-sans">
                                            <span className="text-2xl font-black text-gray-900 tracking-wider">7123456789</span>
                                            <Button size="sm" variant="outline" className="h-8 border-amber-300 bg-white" onClick={() => { navigator.clipboard.writeText('7123456789'); toast.success('Nomor rekening disalin!') }}>Salin</Button>
                                        </div>
                                        <p className="text-sm font-bold text-amber-900 uppercase">PT SULTANAH TRAVEL</p>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full md:w-80 space-y-3 font-mono font-sans">
                                <div className="flex justify-between text-sm items-center py-2 px-1 border-b border-gray-100">
                                    <span className="text-gray-500 font-bold uppercase tracking-widest italic">Subtotal</span>
                                    <span className="font-sans font-bold text-gray-900 uppercase">{formatRupiah(booking.totalAmount + (booking.voucherDiscount || 0))}</span>
                                </div>
                                {booking.voucherDiscount > 0 && (
                                    <div className="flex justify-between text-sm items-center py-2 px-1 border-b border-gray-100 text-emerald-600 bg-emerald-50 rounded-lg">
                                        <span className="font-bold uppercase tracking-widest italic pl-2">Voucher ({booking.voucherCode})</span>
                                        <span className="font-sans font-black pr-2 italic">-{formatRupiah(booking.voucherDiscount)}</span>
                                    </div>
                                )}
                                <div className="mt-6 p-6 bg-[#1a1a1a] rounded-3xl text-center shadow-2xl drop-shadow-2xl">
                                    <p className="text-[10px] text-[#D4AF37] font-black uppercase tracking-[0.2em] mb-2 drop-shadow-sm font-sans italic">Total Pembayaran</p>
                                    <p className="text-4xl font-black text-white font-sans scale-105 tracking-tight font-serif italic drop-shadow-lg">
                                        {formatRupiah(booking.totalAmount)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Footer Notes */}
                        <div className="mt-16 pt-8 border-t-2 border-gray-100 flex flex-col md:flex-row justify-between items-end gap-10">
                            <div className="max-w-md">
                                <p className="text-sm font-black text-gray-900 mb-2 uppercase italic font-sans italic tracking-widest">Catatan Penting:</p>
                                <ul className="text-[11px] text-gray-500 space-y-2 leading-relaxed italic font-bold">
                                    <li>1. Invoice ini adalah bukti legal pemesanan awal paket umroh di Sultanah Travel.</li>
                                    <li>2. Segera lakukan pembayaran sesuai instruksi untuk mengamankan slot keberangkatan Anda.</li>
                                    <li>3. Syarat dan ketentuan lengkap berlaku sesuai kontrak yang akan diberikan setela pelunasan.</li>
                                </ul>
                            </div>
                            <div className="text-center w-full md:w-auto">
                                <div className="w-40 h-24 border-b-2 border-gray-900 mx-auto mb-2 flex items-center justify-center italic text-gray-200 select-none">
                                    Digital Signature
                                </div>
                                <p className="text-sm font-black text-gray-900 font-sans italic tracking-widest">Admin Sultanah Travel</p>
                                <p className="text-[9px] text-gray-400 font-black uppercase tracking-tighter">Authorized Invoice Copy</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Closing Theme */}
                <div className="mt-12 text-center p-10 bg-gradient-to-br from-amber-50 to-orange-50 rounded-[3rem] border border-amber-100 shadow-inner">
                    <h3 className="text-2xl font-black text-amber-900 mb-2 font-serif italic drop-shadow-sm italic tracking-widest uppercase">Jazakumullah Khairan 🕌</h3>
                    <p className="text-amber-800 text-sm italic font-bold leading-relaxed mb-6 font-sans italic tracking-widest uppercase">Semoga menjadi ibadah yang mabrur dan langkah awal ke Baitullah bersama keluarga tercinta. Aamiin.</p>
                    <Button variant="outline" className="border-amber-400 text-amber-700 font-black hover:bg-amber-100 rounded-full font-sans italic uppercase font-bold tracking-widest" onClick={() => window.print()}>Cetak Salinan Ini</Button>
                </div>
            </div>
        </div>
    );
};

export default InvoiceView;
