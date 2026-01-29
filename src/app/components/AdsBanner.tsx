import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

interface AdBanner {
    id: string;
    imageUrl: string;
    linkUrl?: string;
    title?: string;
    isActive: boolean;
    order: number;
}

interface AdsBannerProps {
    role: string;
}

const AdsBanner: React.FC<AdsBannerProps> = ({ role }) => {
    const [ads, setAds] = useState<AdBanner[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAds();
    }, [role]);

    // Auto-rotate
    useEffect(() => {
        if (ads.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % ads.length);
        }, 5000); // 5 seconds

        return () => clearInterval(interval);
    }, [ads.length]);

    const fetchAds = async () => {
        try {
            // In a real app, you might filter by role in Firestore or client-side
            // For now, let's fetch all active ads and assume they are for everyone or filter client-side
            const q = query(
                collection(db, 'ads'),
                where('isActive', '==', true),
                orderBy('order', 'asc')
            );

            const querySnapshot = await getDocs(q);
            const adsData: AdBanner[] = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                // Optional: Filter by targetRoles if field exists
                if (!data.targetRoles || data.targetRoles.includes(role) || data.targetRoles.includes('all')) {
                    adsData.push({ id: doc.id, ...data } as AdBanner);
                }
            });

            // FALLBACK MOCK DATA if Firestore is empty (for demonstration)
            if (adsData.length === 0) {
                adsData.push(
                    {
                        id: 'promo-1',
                        imageUrl: 'https://images.unsplash.com/photo-1565552629477-ff72c7d9c6e9?q=80&w=1920&auto=format&fit=crop', // Umroh promo
                        title: 'Promo Umroh Ramadhan',
                        linkUrl: '/booking/ramadhan-package',
                        isActive: true,
                        order: 1
                    },
                    {
                        id: 'promo-2',
                        imageUrl: 'https://images.unsplash.com/photo-1596525737525-4c0175b28d05?q=80&w=1920&auto=format&fit=crop', // Exclusive service
                        title: 'Layanan Premium Sultanah',
                        isActive: true,
                        order: 2
                    }
                );
            }

            setAds(adsData);
        } catch (error) {
            console.error('Error fetching ads:', error);
            // Fallback on error too
            setAds([
                {
                    id: 'promo-1',
                    imageUrl: 'https://images.unsplash.com/photo-1565552629477-ff72c7d9c6e9?q=80&w=1920&auto=format&fit=crop', // Umroh promo
                    title: 'Promo Umroh Ramadhan',
                    linkUrl: '/booking/ramadhan-package',
                    isActive: true,
                    order: 1
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % ads.length);
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + ads.length) % ads.length);
    };

    if (loading || ads.length === 0) return null;

    return (
        <div className="relative w-full overflow-hidden rounded-2xl shadow-lg group aspect-[21/9] md:aspect-[3/1]">
            <AnimatePresence mode='wait'>
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 w-full h-full"
                >
                    {ads[currentIndex].linkUrl ? (
                        <a href={ads[currentIndex].linkUrl} className="block w-full h-full relative">
                            <img
                                src={ads[currentIndex].imageUrl}
                                alt={ads[currentIndex].title || 'Ad Banner'}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-emerald-800 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                Lihat Promo <ExternalLink className="w-3 h-3" />
                            </div>
                        </a>
                    ) : (
                        <img
                            src={ads[currentIndex].imageUrl}
                            alt={ads[currentIndex].title || 'Ad Banner'}
                            className="w-full h-full object-cover"
                        />
                    )}

                    {/* Gradient Overlay for Text Visibility (Optional) */}
                    {ads[currentIndex].title && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none flex items-end">
                            <div className="p-4 md:p-6 text-white">
                                <h3 className="text-lg md:text-2xl font-bold">{ads[currentIndex].title}</h3>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons (only if > 1) */}
            {ads.length > 1 && (
                <>
                    <button
                        onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>

                    {/* Dots */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {ads.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                                className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex ? 'bg-white w-6' : 'bg-white/50'
                                    }`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default AdsBanner;
