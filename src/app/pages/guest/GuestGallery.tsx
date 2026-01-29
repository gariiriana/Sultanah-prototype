import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Camera,
    MapPin,
    X,
    Image as ImageIcon,
    Search,
    ArrowLeft,
    Calendar
} from 'lucide-react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useNavigate } from 'react-router-dom';

interface TripPhoto {
    id: string;
    title: string;
    description?: string;
    location: string;
    date: string;
    imageBase64: string;
    uploadedBy: string;
    uploadedByName: string;
    uploadedAt: string;
    category: 'masjid' | 'hotel' | 'activity' | 'group' | 'other';
}

const GuestGallery: React.FC = () => {
    const navigate = useNavigate();
    const [photos, setPhotos] = useState<TripPhoto[]>([]);
    const [filteredPhotos, setFilteredPhotos] = useState<TripPhoto[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPhoto, setSelectedPhoto] = useState<TripPhoto | null>(null);
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchPhotos();
    }, []);

    useEffect(() => {
        filterPhotos();
    }, [photos, activeCategory, searchQuery]);

    const fetchPhotos = async () => {
        try {
            setLoading(true);
            const q = query(
                collection(db, 'tripGallery'),
                orderBy('uploadedAt', 'desc')
            );

            const querySnapshot = await getDocs(q);
            const photosData: TripPhoto[] = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as TripPhoto));

            setPhotos(photosData);
        } catch (error) {
            console.error('Error fetching photos:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterPhotos = () => {
        let filtered = photos;

        if (activeCategory !== 'all') {
            filtered = filtered.filter(photo => photo.category === activeCategory);
        }

        if (searchQuery) {
            filtered = filtered.filter(photo =>
                photo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                photo.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                photo.description?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredPhotos(filtered);
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'masjid': return '🕌';
            case 'hotel': return '🏨';
            case 'activity': return '🎯';
            case 'group': return '👥';
            default: return '📷';
        }
    };

    const categories = [
        { id: 'all', label: 'Semua Momen' },
        { id: 'masjid', label: 'Masjid' },
        { id: 'activity', label: 'Kegiatan' },
        { id: 'group', label: 'Jamaah' },
        { id: 'hotel', label: 'Akomodasi' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Hero Header */}
            <div className="relative bg-[#004D40] text-white">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute inset-0 bg-black/30 w-full h-full object-cover" />
                    <div className="absolute inset-0 opacity-10" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }}></div>
                </div>

                <div className="relative max-w-7xl mx-auto px-6 py-16 text-center">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/')}
                        className="absolute top-4 left-4 text-white hover:bg-white/20"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Kembali
                    </Button>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-4xl md:text-5xl font-bold mb-4 font-serif">
                            Galeri Perjalanan Sultanah
                        </h1>
                        <p className="text-xl text-emerald-100 max-w-2xl mx-auto">
                            Kenangan indah dari setiap perjalanan ibadah bersama Sultanah Travel.
                            Melihat kebahagiaan dan kekhusyukan para jamaah kami.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 -mt-8 relative z-10">
                {/* Search & Filter Card */}
                <div className="bg-white rounded-2xl shadow-xl p-4 md:p-6 mb-8 border border-gray-100">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                                placeholder="Cari momen, lokasi, atau kegiatan..."
                                className="pl-10 h-12 bg-gray-50 border-gray-200 focus:ring-emerald-500 rounded-xl"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${activeCategory === cat.id
                                            ? 'bg-emerald-600 text-white shadow-md'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="text-sm text-gray-500 border-t pt-4 flex items-center gap-2">
                        <Camera className="w-4 h-4" />
                        <span>Menampilkan {filteredPhotos.length} foto momen {activeCategory !== 'all' ? `kategori ${categories.find(c => c.id === activeCategory)?.label}` : ''}</span>
                    </div>
                </div>

                {/* Gallery Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="aspect-[4/3] bg-gray-200 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : filteredPhotos.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ImageIcon className="w-10 h-10 text-gray-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">Tidak ada foto ditemukan</h3>
                        <p className="text-gray-500 mt-2">Coba kata kunci lain atau kategori berbeda</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredPhotos.map((photo, index) => (
                            <motion.div
                                key={photo.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100"
                                onClick={() => setSelectedPhoto(photo)}
                            >
                                {/* Image Container */}
                                <div className="aspect-[4/3] overflow-hidden relative">
                                    <img
                                        src={photo.imageBase64}
                                        alt={photo.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                                        <span className="text-white text-sm font-medium flex items-center gap-2">
                                            <EyeIcon /> Lihat Detail
                                        </span>
                                    </div>
                                    <div className="absolute top-3 right-3">
                                        <span className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold shadow-sm">
                                            {getCategoryIcon(photo.category)}
                                        </span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-4">
                                    <h3 className="font-bold text-gray-900 line-clamp-1 mb-1">{photo.title}</h3>
                                    <div className="flex items-center text-xs text-gray-500 gap-3">
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-3 h-3" /> {photo.location}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" /> {new Date(photo.date).toLocaleDateString('id-ID')}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Lightbox / Modal */}
            <AnimatePresence>
                {selectedPhoto && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm"
                        onClick={() => setSelectedPhoto(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative max-w-6xl w-full max-h-screen flex flex-col md:flex-row bg-white rounded-3xl overflow-hidden shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Close Button */}
                            <button
                                onClick={() => setSelectedPhoto(null)}
                                className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-md transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            {/* Left: Image */}
                            <div className="w-full md:w-2/3 bg-black flex items-center justify-center p-4">
                                <img
                                    src={selectedPhoto.imageBase64}
                                    alt={selectedPhoto.title}
                                    className="max-w-full max-h-[80vh] object-contain"
                                />
                            </div>

                            {/* Right: Details */}
                            <div className="w-full md:w-1/3 p-8 flex flex-col h-full bg-white overflow-y-auto">
                                <div className="mb-6">
                                    <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold mb-3">
                                        {getCategoryIcon(selectedPhoto.category)} {selectedPhoto.category.toUpperCase()}
                                    </span>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedPhoto.title}</h2>
                                    <div className="flex flex-col gap-2 text-gray-500 text-sm">
                                        <span className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-emerald-500" /> {selectedPhoto.location}
                                        </span>
                                        <span className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-emerald-500" />
                                            {new Date(selectedPhoto.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        </span>
                                    </div>
                                </div>

                                <div className="prose prose-sm text-gray-600 mb-8 flex-grow">
                                    <p>{selectedPhoto.description || 'Tidak ada deskripsi.'}</p>
                                </div>

                                <div className="border-t pt-6 mt-auto">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold">
                                            {selectedPhoto.uploadedByName.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">{selectedPhoto.uploadedByName}</p>
                                            <p className="text-xs text-gray-500">Tour Leader</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-3 text-right">
                                        Diunggah pada {new Date(selectedPhoto.uploadedAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
)

export default GuestGallery;
