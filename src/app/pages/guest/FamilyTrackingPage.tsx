import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Users, MapPin, Clock, X, ArrowLeft, Camera, Calendar, Info, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { toast } from 'sonner';

interface ActivityPhoto {
    imageBase64: string;
    uploadedBy: string;
    uploadedByName: string;
    uploadedAt: string;
}

interface Activity {
    time: string;
    activity: string;
    location: string;
    description?: string;
    photos?: ActivityPhoto[];
}

interface DaySchedule {
    dayNumber: number;
    date: string;
    title: string;
    activities: Activity[];
}

interface ItineraryData {
    id: string;
    packageName: string;
    departureDate: string;
    returnDate: string;
    tourLeaderName?: string;
    days: DaySchedule[];
    completedDays?: number[];
    status?: string;
}

interface JamaahTrackResult {
    id: string;
    name: string;
    packageId: string;
    packageName: string;
    status: string;
    role: string;
    departureDate?: string;
}

const FamilyTrackingPage = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResult, setSearchResult] = useState<JamaahTrackResult | 'not-found' | null>(null);
    const [itinerary, setItinerary] = useState<ItineraryData | null>(null);
    const [loadingItinerary, setLoadingItinerary] = useState(false);
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        setSearchResult(null);
        setItinerary(null);
        setSelectedDay(null);

        try {
            // Step 1: Find User by Name
            // Note: We'll fetch all users with certain roles and filter in memory for fuzzy match
            // because Firestore doesn't support case-insensitive fuzzy search easily
            const usersRef = collection(db, 'users');
            const q = query(
                usersRef,
                where('role', 'in', ['current-jamaah', 'jamaah', 'prospective-jamaah', 'alumni'])
            );

            const querySnapshot = await getDocs(q);
            const foundUsers: any[] = [];

            querySnapshot.forEach(doc => {
                const data = doc.data();
                const fullName = (data.identityInfo?.fullName || data.displayName || '').toLowerCase();
                if (fullName.includes(searchQuery.toLowerCase())) {
                    foundUsers.push({ id: doc.id, ...data });
                }
            });

            if (foundUsers.length === 0) {
                setSearchResult('not-found');
                return;
            }

            // Take the first best match
            const user = foundUsers[0];
            const packageId = user.packageId || (user.payments?.[0]?.packageId) || user.jamaahInfo?.packageId;
            const packageName = user.packageName || user.jamaahInfo?.packageName || user.booking || 'Paket Umroh';

            const result: JamaahTrackResult = {
                id: user.id || user.userId,
                name: user.identityInfo?.fullName || user.displayName || user.userName || 'Jamaah',
                packageId: packageId,
                packageName: packageName,
                status: user.jamaahInfo?.status || 'Active',
                role: user.role,
                departureDate: user.jamaahInfo?.departureDate
            };

            setSearchResult(result);

            // Step 2: Fetch Itinerary if packageId exists
            if (packageId) {
                fetchItinerary(packageId);
            } else {
                toast.info('Data paket jamaah belum tersedia.');
            }

        } catch (error) {
            console.error('Error tracking jamaah:', error);
            toast.error('Terjadi kesalahan saat mencari data.');
        } finally {
            setIsSearching(false);
        }
    };

    const fetchItinerary = async (packageId: string) => {
        setLoadingItinerary(true);
        try {
            const itineraryRef = collection(db, 'itineraries');
            const q = query(itineraryRef, where('packageId', '==', packageId));
            const snap = await getDocs(q);

            if (!snap.empty) {
                const data = snap.docs[0].data();
                setItinerary({
                    id: snap.docs[0].id,
                    ...data
                } as ItineraryData);

                // Auto-select latest day or first day
                if (data.days && data.days.length > 0) {
                    const completedDays = data.completedDays || [];
                    const lastCompleted = completedDays.length > 0 ? Math.max(...completedDays) : 1;
                    setSelectedDay(lastCompleted);
                }
            }
        } catch (error) {
            console.error('Error fetching itinerary:', error);
        } finally {
            setLoadingItinerary(false);
        }
    };

    const handleClear = () => {
        setSearchQuery('');
        setSearchResult(null);
        setItinerary(null);
        setSelectedDay(null);
    };

    return (
        <div className="relative min-h-screen pt-10 sm:pt-24 pb-12 overflow-hidden">
            {/* Background Image with Overlay */}
            <div
                className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: 'url("/images/bg-family-tracking.jpg")' }}
            >
                <div className="absolute inset-0 bg-black/40" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back Button - Fixed Position on Mobile for Precision */}
                <div className="sm:inline-block mb-10 sm:mb-8">
                    <motion.button
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-white/90 hover:text-white transition-colors bg-white/10 backdrop-blur-md px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-white/20 text-xs sm:text-base"
                    >
                        <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>Kembali</span>
                    </motion.button>
                </div>

                {/* Header Section */}
                <div className="text-center mb-6 sm:mb-12 max-w-2xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 sm:px-4 sm:py-2 bg-emerald-100/90 backdrop-blur-sm text-emerald-800 rounded-full font-bold text-[10px] sm:text-sm mb-3 sm:mb-4 shadow-sm"
                    >
                        <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                        FITUR PANTAU KELUARGA
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-2xl sm:text-5xl font-extrabold text-white mb-3 sm:mb-6 px-4 leading-tight tracking-tight"
                    >
                        Lacak Perjalanan <br className="sm:hidden" /> Ibadah Keluarga
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-white/80 text-xs sm:text-lg px-6 leading-relaxed max-w-md mx-auto"
                    >
                        Pantau update kegiatan jamaah secara real-time langsung dari tanah suci.
                    </motion.p>
                </div>

                {/* Search Box with Glassmorphism */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="max-w-xl mx-auto bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-5 sm:p-6 mb-8 sm:mb-12 border border-white/30"
                >
                    <form onSubmit={handleSearch} className="relative">
                        <div className="relative flex items-center">
                            <Search className="absolute left-4 w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Masukkan nama jamaah..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-11 sm:pl-12 pr-11 sm:pr-12 h-12 sm:h-14 text-base sm:text-lg border-gray-200 focus:border-emerald-500 focus:ring-emerald-200 rounded-xl"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={handleClear}
                                    className="absolute right-4 p-1 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                                </button>
                            )}
                        </div>

                        <Button
                            type="submit"
                            disabled={isSearching || !searchQuery.trim()}
                            className="w-full mt-4 h-11 sm:h-12 text-base sm:text-lg font-medium bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 shadow-lg"
                        >
                            {isSearching ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Mencari...
                                </span>
                            ) : 'Cari Jamaah'}
                        </Button>
                    </form>
                </motion.div>

                {/* Search Results */}
                <div className="max-w-4xl mx-auto">
                    <AnimatePresence mode="wait">
                        {searchResult === 'not-found' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="text-center py-12 bg-white/90 backdrop-blur-xl rounded-2xl border border-white/30 shadow-2xl"
                            >
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Users className="w-10 h-10 text-gray-300" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">Data Tidak Ditemukan</h3>
                                <p className="text-gray-500 max-w-md mx-auto">
                                    Mohon pastikan nama yang Anda masukkan sudah benar. Coba gunakan nama lengkap jamaah.
                                </p>
                            </motion.div>
                        )}

                        {searchResult && searchResult !== 'not-found' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/30"
                            >
                                {/* Result Header */}
                                <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 p-5 sm:p-8 text-white">
                                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 sm:gap-6">
                                        <div className="flex items-center gap-3 sm:gap-4">
                                            <div className="w-14 h-14 sm:w-20 sm:h-20 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-xl sm:text-3xl font-bold border-2 border-white/30 text-emerald-50 shrink-0">
                                                {searchResult.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="text-[10px] sm:text-sm font-medium text-emerald-100 mb-0.5 sm:mb-1 uppercase tracking-wider">Data Jamaah Ditemukan</h3>
                                                <h2 className="text-xl sm:text-3xl font-bold mb-1 leading-tight">{searchResult.name}</h2>
                                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-emerald-50 text-[10px] sm:text-sm">
                                                    <span className="bg-white/20 px-1.5 py-0.5 rounded text-[9px] sm:text-xs font-semibold">{searchResult.packageName}</span>
                                                    {searchResult.departureDate && (
                                                        <>
                                                            <span className="hidden sm:inline">•</span>
                                                            <span>Berangkat: {new Date(searchResult.departureDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur rounded-xl p-3 sm:p-4 md:min-w-[200px] border border-white/10">
                                            <p className="text-emerald-100 text-[10px] sm:text-xs mb-1.5 sm:mb-2 uppercase font-medium">Status Jamaah</p>
                                            <div className="flex items-center gap-2 mb-2 sm:mb-3">
                                                <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full animate-pulse ${searchResult.status === 'departed' || searchResult.status === 'confirmed' ? 'bg-green-400' : 'bg-amber-400'}`} />
                                                <span className="font-bold text-xs sm:text-sm uppercase tracking-wider">
                                                    {searchResult.status === 'departed' ? 'Sedang Umroh' :
                                                        searchResult.status === 'completed' ? 'Sudah Selesai' :
                                                            'Menunggu Keberangkatan'}
                                                </span>
                                            </div>
                                            {itinerary && itinerary.tourLeaderName && (
                                                <div className="mt-2 pt-2 border-t border-white/10">
                                                    <p className="text-[9px] sm:text-[10px] text-emerald-200 uppercase font-bold mb-0.5 sm:mb-1">Pemandu (TL)</p>
                                                    <p className="text-xs sm:text-sm font-medium">{itinerary.tourLeaderName}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Result Content - Timeline Logic */}
                                <div className="p-5 sm:p-8">
                                    {!itinerary ? (
                                        <div className="text-center py-10 sm:py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 px-4">
                                            {loadingItinerary ? (
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-8 h-8 sm:w-10 sm:h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                                    <p className="text-sm sm:text-base text-gray-500">Memuat log aktivitas...</p>
                                                </div>
                                            ) : (
                                                <>
                                                    <Info className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 mx-auto mb-3" />
                                                    <p className="text-sm sm:text-base text-gray-600 font-semibold">Jadwal Belum Dipublikasi</p>
                                                    <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-xs mx-auto">Tour Leader belum memperbarui jadwal perjalanan untuk paket ini.</p>
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-6 sm:space-y-8">
                                            {/* Day Tabs */}
                                            <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar -mx-5 sm:mx-0 px-5 sm:px-0">
                                                {itinerary.days.map((day: DaySchedule) => (
                                                    <button
                                                        key={day.dayNumber}
                                                        onClick={() => setSelectedDay(day.dayNumber)}
                                                        className={`flex-shrink-0 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${selectedDay === day.dayNumber
                                                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                            }`}
                                                    >
                                                        Hari {day.dayNumber}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Day Content */}
                                            <AnimatePresence mode="wait">
                                                {selectedDay && (
                                                    <motion.div
                                                        key={selectedDay}
                                                        initial={{ opacity: 0, x: 20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: -20 }}
                                                        className="space-y-5 sm:space-y-6"
                                                    >
                                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                            <div>
                                                                <h4 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">
                                                                    {itinerary.days.find((d: DaySchedule) => d.dayNumber === selectedDay)?.title}
                                                                </h4>
                                                                <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-1.5 mt-1 sm:mt-1.5">
                                                                    <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                                                                    {itinerary.days.find((d: DaySchedule) => d.dayNumber === selectedDay)?.date ?
                                                                        new Date(itinerary.days.find((d: DaySchedule) => d.dayNumber === selectedDay)!.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) :
                                                                        'Tanggal belum diatur'}
                                                                </p>
                                                            </div>
                                                            {itinerary.completedDays?.includes(selectedDay) && (
                                                                <div className="w-fit bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold flex items-center gap-1.5">
                                                                    <CheckCircle2 className="w-3 h-3" />
                                                                    HARI SELESAI
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Activity Timeline */}
                                                        <div className="relative pl-6 sm:pl-8 border-l-2 border-emerald-100 space-y-10 sm:space-y-12 py-3 sm:py-4">
                                                            {itinerary.days.find((d: DaySchedule) => d.dayNumber === selectedDay)?.activities.map((activity: Activity, idx: number) => (
                                                                <div key={idx} className="relative">
                                                                    {/* Timeline Dot */}
                                                                    <div className="absolute -left-[33px] sm:-left-[41px] top-1.5 w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-white border-[3px] sm:border-4 border-emerald-500 z-10 shadow-sm" />

                                                                    <div className="space-y-3 sm:space-y-4">
                                                                        <div className="flex items-start justify-between">
                                                                            <div>
                                                                                <div className="flex items-center gap-1.5 mb-0.5 sm:mb-1">
                                                                                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600" />
                                                                                    <span className="text-emerald-700 font-bold text-[10px] sm:text-sm tracking-widest uppercase">{activity.time}</span>
                                                                                </div>
                                                                                <h5 className="text-base sm:text-lg font-bold text-gray-900 leading-snug">{activity.activity}</h5>
                                                                                {activity.location && (
                                                                                    <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-1 mt-0.5 sm:mt-1">
                                                                                        <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-500" />
                                                                                        {activity.location}
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        {activity.description && (
                                                                            <div className="bg-emerald-50/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-emerald-100/50 text-xs sm:text-sm">
                                                                                <p className="text-gray-700 leading-relaxed italic">"{activity.description}"</p>
                                                                            </div>
                                                                        )}

                                                                        {/* Photo Log */}
                                                                        {activity.photos && activity.photos.length > 0 && (
                                                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                                                                                {activity.photos.map((photo: ActivityPhoto, pIdx: number) => (
                                                                                    <motion.div
                                                                                        key={pIdx}
                                                                                        whileHover={{ scale: 1.02 }}
                                                                                        className="aspect-square rounded-xl sm:rounded-2xl overflow-hidden border-2 sm:border-4 border-white shadow-sm sm:shadow-md cursor-pointer group relative"
                                                                                        onClick={() => setViewingPhoto(photo.imageBase64)}
                                                                                    >
                                                                                        <img
                                                                                            src={photo.imageBase64}
                                                                                            className="w-full h-full object-cover"
                                                                                            alt="Aktivitas Jamaah"
                                                                                        />
                                                                                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-all" />
                                                                                        <div className="absolute bottom-1.5 right-1.5 p-1 sm:p-1.5 bg-white/90 backdrop-blur rounded-lg">
                                                                                            <Camera className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-600" />
                                                                                        </div>
                                                                                    </motion.div>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )}
                                </div>


                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Photo Modal */}
                <AnimatePresence>
                    {viewingPhoto && (
                        <div
                            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
                            onClick={() => setViewingPhoto(null)}
                        >
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white"
                                onClick={() => setViewingPhoto(null)}
                            >
                                <X className="w-6 h-6" />
                            </motion.button>
                            <motion.img
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl"
                                src={viewingPhoto}
                                alt="View Activity"
                            />
                        </div>
                    )}
                </AnimatePresence>

                {/* CSS for no-scrollbar */}
                <style>{`
                    .no-scrollbar::-webkit-scrollbar { display: none; }
                    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                `}</style>
            </div>
        </div>
    );
};

export default FamilyTrackingPage;
