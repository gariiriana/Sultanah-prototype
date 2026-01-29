import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Users, MapPin, Clock, ArrowRight, X, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useNavigate } from 'react-router-dom';

const FamilyTrackingPage = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResult, setSearchResult] = useState<any>(null);

    // MOCK DATA for demonstration
    // In a real app, this would query the 'users' collection where role='jamaah'
    const mockJamaahDB = [
        {
            id: 'jamaah-1',
            name: 'Heri Setiawan',
            tourLeader: 'Ust. Ahmad Zulkarnain',
            groupName: 'Keberangkatan 15 Februari 2025',
            status: 'Sedang di Makkah',
            lastActivity: 'City Tour Makkah',
            lastUpdate: '2 jam yang lalu',
            package: 'Paket Sultanah Royal',
            departureDate: '15 Feb 2025',
            returnDate: '25 Feb 2025',
        },
        {
            id: 'jamaah-2',
            name: 'Siti Aminah',
            tourLeader: 'Ust. Hanan Attaki',
            groupName: 'Keberangkatan 1 Maret 2025',
            status: 'Persiapan Keberangkatan',
            lastActivity: 'Manasik Umroh',
            lastUpdate: '1 hari yang lalu',
            package: 'Paket Sultanah VIP',
            departureDate: '01 Mar 2025',
            returnDate: '10 Mar 2025',
        }
    ];

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        setSearchResult(null);

        // Simulate API delay
        setTimeout(() => {
            const result = mockJamaahDB.find(j =>
                j.name.toLowerCase().includes(searchQuery.toLowerCase())
            );

            setSearchResult(result || 'not-found');
            setIsSearching(false);
        }, 1500);
    };

    const handleClear = () => {
        setSearchQuery('');
        setSearchResult(null);
    };

    return (
        <div className="relative min-h-screen pt-24 pb-12 overflow-hidden">
            {/* Background Image with Overlay */}
            <div
                className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: 'url("/images/bg-premium.jpg")' }}
            >
                <div className="absolute inset-0 bg-black/30" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back Button */}
                <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => navigate('/')}
                    className="mb-8 flex items-center gap-2 text-white/90 hover:text-white transition-colors bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Kembali ke Beranda</span>
                </motion.button>

                {/* Header Section */}
                <div className="text-center mb-12 max-w-2xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full font-medium text-sm mb-4"
                    >
                        <Users className="w-4 h-4" />
                        Fitur Pantau Keluarga
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-emerald-900 mb-4"
                    >
                        Lacak Perjalanan Ibadah Keluarga Anda
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-gray-600 text-lg"
                    >
                        Cari nama jamaah untuk melihat update terkini, foto kegiatan, dan informasi Tour Leader secara real-time.
                    </motion.p>
                </div>

                {/* Search Box with Glassmorphism */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="max-w-xl mx-auto bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl p-6 mb-12 border border-white/30"
                >
                    <form onSubmit={handleSearch} className="relative">
                        <div className="relative flex items-center">
                            <Search className="absolute left-4 w-6 h-6 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Masukkan nama jamaah..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-12 pr-12 h-14 text-lg border-gray-200 focus:border-emerald-500 focus:ring-emerald-200 rounded-xl"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={handleClear}
                                    className="absolute right-4 p-1 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            )}
                        </div>

                        <Button
                            type="submit"
                            disabled={isSearching || !searchQuery.trim()}
                            className="w-full mt-4 h-12 text-lg font-medium bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 shadow-lg"
                        >
                            {isSearching ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Mencari data...
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
                                <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 p-6 sm:p-8 text-white">
                                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-3xl font-bold border-2 border-white/30">
                                                {searchResult.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-medium text-emerald-100 mb-1">Data Jamaah Ditemukan</h3>
                                                <h2 className="text-3xl font-bold mb-1">{searchResult.name}</h2>
                                                <div className="flex items-center gap-2 text-emerald-50 text-sm">
                                                    <span className="bg-white/20 px-2 py-0.5 rounded text-xs">{searchResult.package}</span>
                                                    <span>•</span>
                                                    <span>{searchResult.groupName}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur rounded-xl p-4 min-w-[200px] border border-white/10">
                                            <p className="text-emerald-100 text-xs mb-2">Status Saat Ini</p>
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                                <span className="font-bold">{searchResult.status}</span>
                                            </div>
                                            <p className="text-sm opacity-90">{searchResult.lastActivity}</p>
                                            <p className="text-xs text-emerald-200 mt-2">Update: {searchResult.lastUpdate}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Result Content */}
                                <div className="p-6 sm:p-8">
                                    <div className="grid md:grid-cols-2 gap-8 mb-8">
                                        {/* Tour Leader Info */}
                                        <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                                            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                                <Users className="w-5 h-5 text-emerald-600" />
                                                Informasi Pemandu (Tour Leader)
                                            </h4>
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700">
                                                    <Users className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 font-medium">Nama Tour Leader</p>
                                                    <p className="font-bold text-gray-800 text-lg">{searchResult.tourLeader}</p>
                                                    <p className="text-sm text-emerald-600 cursor-pointer hover:underline mt-1">
                                                        Lihat Profil & Kontak
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Timeline Info */}
                                        <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                                            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                                <Clock className="w-5 h-5 text-emerald-600" />
                                                Jadwal Perjalanan
                                            </h4>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                                                    <span className="text-gray-500 text-sm">Keberangkatan</span>
                                                    <span className="font-bold text-gray-800">{searchResult.departureDate}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-500 text-sm">Kepulangan</span>
                                                    <span className="font-bold text-gray-800">{searchResult.returnDate}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="flex justify-end">
                                        <Button
                                            onClick={() => navigate('/gallery')}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-14 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all w-full md:w-auto text-lg flex items-center justify-center gap-3"
                                        >
                                            <MapPin className="w-5 h-5" />
                                            Lihat Galeri & update Kegiatan
                                            <ArrowRight className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>

                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

            </div>
        </div>
    );
};

export default FamilyTrackingPage;
