import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
    Users,
    Search,
    Eye,
    Package,
    ArrowRight
} from 'lucide-react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../../../config/firebase';
import { useAuth } from '../../../../contexts/AuthContext';
import { Badge } from '../../../components/ui/badge';
import UserProfileDetailModal from './UserProfileDetailModal';

interface AssistedBooking {
    id: string;
    packageName: string;
    userName?: string;
    paxCount: number;
    totalAmount: number;
    status: string;
    createdAt: any;
    jamaah: any[];
    userId: string;
    userEmail?: string;
}

const AssistedBookingsSection: React.FC = () => {
    const { userProfile } = useAuth();
    const [bookings, setBookings] = useState<AssistedBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showProfileDetail, setShowProfileDetail] = useState(false);
    const [profileUser, setProfileUser] = useState<{ userId: string; email: string; role: any; name: string } | null>(null);

    useEffect(() => {
        if (userProfile?.uid) {
            fetchAssistedBookings();
        }
    }, [userProfile?.uid]);

    const fetchAssistedBookings = async () => {
        try {
            setLoading(true);
            const q = query(
                collection(db, 'bookings'),
                where('registeredByAdmin.adminId', '==', userProfile?.uid),
                orderBy('createdAt', 'desc')
            );

            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as AssistedBooking[];

            setBookings(data);
        } catch (error) {
            console.error('Error fetching assisted bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredBookings = bookings.filter(b =>
        b.packageName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.userName && b.userName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (b.id && b.id.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getStatusBadge = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'completed':
            case 'confirmed':
            case 'approved':
                return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Terbayar</Badge>;
            case 'pending_payment':
            case 'pending':
                return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Menunggu Bayar</Badge>;
            case 'cancelled':
            case 'rejected':
                return <Badge className="bg-red-100 text-red-700 border-red-200">Dibatalkan</Badge>;
            default:
                return <Badge className="bg-gray-100 text-gray-700 border-gray-200">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Search & Filter */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cari nama jamaah atau paket..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                    />
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <Users className="w-4 h-4" />
                    Total: {filteredBookings.length} Jamaah Binaan
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                    <p className="text-sm font-medium text-gray-500">Memuat data jamaah binaan...</p>
                </div>
            ) : filteredBookings.length === 0 ? (
                <div className="bg-white rounded-2xl border-2 border-dashed border-gray-100 py-16 flex flex-col items-center justify-center text-center px-4">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <Users className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Belum ada jamaah binaan</h3>
                    <p className="text-sm text-gray-500 max-w-sm mt-1">
                        Jamaah yang Anda bantu proses pendaftaran dan pembayarannya akan muncul di sini.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredBookings.map((booking) => (
                        <motion.div
                            key={booking.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden group"
                        >
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                                            <Package className="w-4 h-4 text-indigo-600" />
                                        </div>
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{booking.id}</span>
                                    </div>
                                    {getStatusBadge(booking.status)}
                                </div>

                                <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{booking.packageName}</h3>
                                <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                                    <p>Customer: <span className="font-bold text-gray-700">{booking.userName || 'Guest User'}</span></p>
                                </div>

                                <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl mb-4 text-xs">
                                    <div>
                                        <p className="text-gray-400 font-bold uppercase tracking-tighter mb-0.5">Jumlah Jamaah</p>
                                        <p className="font-black text-gray-900">{booking.paxCount} Orang</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-gray-400 font-bold uppercase tracking-tighter mb-0.5">Total Bayar</p>
                                        <p className="font-black text-indigo-600">Rp {booking.totalAmount?.toLocaleString()}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        setProfileUser({
                                            userId: booking.userId,
                                            email: booking.userEmail || '',
                                            role: 'current-jamaah',
                                            name: booking.userName || ''
                                        });
                                        setShowProfileDetail(true);
                                    }}
                                    className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-all uppercase tracking-wider"
                                >
                                    <Eye className="w-3.5 h-3.5" />
                                    Lihat Detail Profil
                                    <ArrowRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {showProfileDetail && profileUser && (
                <UserProfileDetailModal
                    isOpen={showProfileDetail}
                    onClose={() => setShowProfileDetail(false)}
                    userId={profileUser.userId}
                    userEmail={profileUser.email}
                    userRole={profileUser.role}
                    userName={profileUser.name}
                />
            )}
        </div>
    );
};

export default AssistedBookingsSection;
