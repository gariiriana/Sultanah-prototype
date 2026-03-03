import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { UserPlus, Search, Users, Package, Receipt, Phone, RefreshCw, Eye, CheckCircle, Clock, XCircle, ChevronDown } from 'lucide-react';
import { collection, getDocs, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../../config/firebase';
import { Badge } from '../../../components/ui/badge';
import { toast } from 'sonner';
import UserProfileDetailModal from './UserProfileDetailModal';

interface GuestUser {
    id: string;
    displayName: string;
    email: string;
    phoneNumber: string;
    createdAt: string;
    role: string;
    interestedPackageName?: string;
    paxCount?: number;
    totalInvoice?: number;
    paymentStatus?: string;
    guestInfo?: {
        paymentStatus?: string;
        packageName?: string;
        paxCount?: number;
        totalInvoice?: number;
    };
}

interface GuestRegistrationPageProps {
    onOpenModal: () => void;
    refreshKey: number;
}

type PaymentStatus = 'belum_bayar' | 'lunas' | 'dibatalkan';

const statusConfig: Record<PaymentStatus, { label: string; badge: string; icon: React.ReactNode }> = {
    belum_bayar: {
        label: 'Belum Bayar',
        badge: 'bg-amber-100 text-amber-700 border-amber-200',
        icon: <Clock className="w-3 h-3" />,
    },
    lunas: {
        label: 'Sudah Bayar',
        badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        icon: <CheckCircle className="w-3 h-3" />,
    },
    dibatalkan: {
        label: 'Dibatalkan',
        badge: 'bg-red-100 text-red-700 border-red-200',
        icon: <XCircle className="w-3 h-3" />,
    },
};

const GuestRegistrationPage: React.FC<GuestRegistrationPageProps> = ({ onOpenModal, refreshKey }) => {
    const [guests, setGuests] = useState<GuestUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showProfile, setShowProfile] = useState(false);
    const [selectedUser, setSelectedUser] = useState<GuestUser | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    useEffect(() => {
        fetchGuests();
    }, [refreshKey]);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = () => setOpenDropdown(null);
        document.addEventListener('click', handler);
        return () => document.removeEventListener('click', handler);
    }, []);

    const fetchGuests = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')));
            const data = snap.docs
                .map(d => ({ id: d.id, ...d.data() } as GuestUser))
                .filter(u => u.role === 'guest' || u.role === 'prospective-jamaah');
            setGuests(data);
        } catch (err) {
            console.error('Failed to fetch guests:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (guestId: string, newStatus: PaymentStatus) => {
        setUpdatingId(guestId);
        setOpenDropdown(null);
        try {
            await updateDoc(doc(db, 'users', guestId), {
                paymentStatus: newStatus,
                'guestInfo.paymentStatus': newStatus,
                updatedAt: new Date().toISOString(),
            });
            setGuests(prev =>
                prev.map(g =>
                    g.id === guestId
                        ? {
                            ...g,
                            paymentStatus: newStatus,
                            guestInfo: { ...g.guestInfo, paymentStatus: newStatus },
                        }
                        : g
                )
            );
            toast.success(`Status diubah ke "${statusConfig[newStatus].label}"`);
        } catch (err) {
            console.error('Failed to update status:', err);
            toast.error('Gagal mengubah status');
        } finally {
            setUpdatingId(null);
        }
    };

    const getCurrentStatus = (guest: GuestUser): PaymentStatus => {
        const raw = guest.guestInfo?.paymentStatus || guest.paymentStatus || 'belum_bayar';
        if (raw === 'lunas' || raw === 'approved') return 'lunas';
        if (raw === 'dibatalkan' || raw === 'cancelled') return 'dibatalkan';
        return 'belum_bayar';
    };

    const filtered = guests.filter(g =>
        g.displayName?.toLowerCase().includes(search.toLowerCase()) ||
        g.email?.toLowerCase().includes(search.toLowerCase()) ||
        g.phoneNumber?.includes(search)
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Daftarkan Calon Jamaah</h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Buat akun guest, pilih paket, dan follow up pembayaran via WhatsApp.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchGuests}
                        className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all"
                        title="Refresh"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onOpenModal}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg hover:from-emerald-600 hover:to-teal-700 transition-all text-sm"
                    >
                        <UserPlus className="w-4 h-4" />
                        Daftarkan Calon Jamaah Baru
                    </button>
                </div>
            </div>

            {/* Search + Count */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cari nama, email, atau no. WA..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                    />
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <Users className="w-4 h-4" />
                    Total: {filtered.length} Calon Jamaah
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin" />
                    <p className="text-sm font-medium text-gray-500">Memuat data...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border-2 border-dashed border-gray-100 py-16 flex flex-col items-center justify-center text-center px-4">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <Users className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Belum ada calon jamaah</h3>
                    <p className="text-sm text-gray-500 max-w-sm mt-1 mb-6">
                        Klik "Daftarkan Calon Jamaah Baru" untuk menambahkan calon jamaah pertama.
                    </p>
                    <button
                        onClick={onOpenModal}
                        className="inline-flex items-center gap-2 bg-emerald-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-emerald-600 transition-all"
                    >
                        <UserPlus className="w-4 h-4" />
                        Daftarkan Sekarang
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filtered.map(guest => {
                        const packageName = guest.guestInfo?.packageName || guest.interestedPackageName || '';
                        const paxCount = guest.guestInfo?.paxCount || guest.paxCount || 1;
                        const totalInvoice = guest.guestInfo?.totalInvoice || guest.totalInvoice || 0;
                        const currentStatus = getCurrentStatus(guest);
                        const cfg = statusConfig[currentStatus];
                        const isUpdating = updatingId === guest.id;
                        const isOpen = openDropdown === guest.id;

                        return (
                            <motion.div
                                key={guest.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all"
                            >
                                <div className="p-5">
                                    {/* Header: name + badge */}
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm flex-shrink-0">
                                                {(guest.displayName || 'G')[0].toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-gray-900 text-sm line-clamp-1">{guest.displayName || '-'}</p>
                                                <p className="text-xs text-gray-400 line-clamp-1">{guest.email}</p>
                                            </div>
                                        </div>
                                        <Badge className={`${cfg.badge} flex items-center gap-1 whitespace-nowrap ml-2`}>
                                            {cfg.icon}
                                            {cfg.label}
                                        </Badge>
                                    </div>

                                    {/* Phone */}
                                    {guest.phoneNumber && (
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
                                            <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                                            <span>{guest.phoneNumber}</span>
                                        </div>
                                    )}

                                    {/* Package & invoice info */}
                                    <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 mb-4">
                                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                            <Package className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                            <span className="font-medium line-clamp-1">{packageName || 'Paket belum dipilih'}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                            <Users className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                            <span>{paxCount} orang</span>
                                        </div>
                                        {totalInvoice > 0 && (
                                            <div className="flex items-center gap-1.5 text-xs font-black text-emerald-700">
                                                <Receipt className="w-3.5 h-3.5 flex-shrink-0" />
                                                <span>Rp {totalInvoice.toLocaleString('id-ID')}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Date */}
                                    <p className="text-[10px] text-gray-400 mb-3">
                                        Didaftarkan: {guest.createdAt ? new Date(guest.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                                    </p>

                                    {/* ✅ Status Dropdown */}
                                    <div className="relative mb-3" onClick={e => e.stopPropagation()}>
                                        <button
                                            disabled={isUpdating}
                                            onClick={() => setOpenDropdown(isOpen ? null : guest.id)}
                                            className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all
                                                ${currentStatus === 'lunas' ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100' :
                                                    currentStatus === 'dibatalkan' ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100' :
                                                        'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'}
                                                ${isUpdating ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                                        >
                                            <span className="flex items-center gap-1.5">
                                                {isUpdating ? (
                                                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                ) : cfg.icon}
                                                Ubah Status: {cfg.label}
                                            </span>
                                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        {isOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden z-50"
                                            >
                                                {(Object.entries(statusConfig) as [PaymentStatus, typeof statusConfig[PaymentStatus]][]).map(([key, val]) => (
                                                    <button
                                                        key={key}
                                                        onClick={() => handleStatusChange(guest.id, key)}
                                                        className={`w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-left transition-all hover:bg-gray-50
                                                            ${currentStatus === key ? 'bg-gray-50 opacity-50 pointer-events-none' : ''}`}
                                                    >
                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${val.badge}`}>
                                                            {val.icon}
                                                            {val.label}
                                                        </span>
                                                        {currentStatus === key && <span className="ml-auto text-gray-400">✓ Aktif</span>}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </div>

                                    {/* Detail Button */}
                                    <button
                                        onClick={() => { setSelectedUser(guest); setShowProfile(true); }}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-600 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600 transition-all uppercase tracking-wider"
                                    >
                                        <Eye className="w-3.5 h-3.5" />
                                        Lihat Detail
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Profile Modal */}
            {showProfile && selectedUser && (
                <UserProfileDetailModal
                    isOpen={showProfile}
                    onClose={() => setShowProfile(false)}
                    userId={selectedUser.id}
                    userEmail={selectedUser.email}
                    userRole={selectedUser.role as any}
                    userName={selectedUser.displayName || ''}
                />
            )}
        </div>
    );
};

export default GuestRegistrationPage;
