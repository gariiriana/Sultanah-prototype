import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Package as PackageIcon, Star, Clock, Calendar, Users, Check, Sparkles, Crown, ArrowDownAZ, CalendarDays, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../../contexts/AuthContext';
import { Package } from '../../../types';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../../../config/firebase';

const sultanahLogo = '/images/logo.png';

interface PackageBrowsePageProps {
    packages?: Package[]; // ✅ CHANGED: Optional
    onBack: () => void;
    onSelectPackage: (pkg: Package) => void;
    formatCurrency: (amount: number | string) => string;
}

// ✅ NEW: Countdown Timer Component for Limited Edition
const CountdownTimer: React.FC<{ expiryDate: string }> = ({ expiryDate }) => {
    const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = new Date(expiryDate).getTime() - new Date().getTime();
            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60),
                });
            } else {
                setTimeLeft(null);
            }
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);
        return () => clearInterval(timer);
    }, [expiryDate]);

    if (!timeLeft) return null;

    return (
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-black/80 to-transparent backdrop-blur-[2px] flex items-center justify-between px-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                <span className="text-[10px] font-bold text-white tracking-wider uppercase">Berakhir Dalam:</span>
            </div>
            <div className="flex gap-2 items-center">
                <div className="flex flex-col items-center">
                    <span className="text-[14px] font-black text-white leading-none tabular-nums">{timeLeft.days}</span>
                    <span className="text-[6px] text-white/70 uppercase font-bold tracking-tighter">Hari</span>
                </div>
                <span className="text-white/50 text-xs font-bold leading-none mb-1">:</span>
                <div className="flex flex-col items-center">
                    <span className="text-[14px] font-black text-white leading-none tabular-nums">{timeLeft.hours.toString().padStart(2, '0')}</span>
                    <span className="text-[6px] text-white/70 uppercase font-bold tracking-tighter">Jam</span>
                </div>
                <span className="text-white/50 text-xs font-bold leading-none mb-1">:</span>
                <div className="flex flex-col items-center">
                    <span className="text-[14px] font-black text-white leading-none tabular-nums">{timeLeft.minutes.toString().padStart(2, '0')}</span>
                    <span className="text-[6px] text-white/70 uppercase font-bold tracking-tighter">Mnt</span>
                </div>
                <span className="text-white/50 text-xs font-bold leading-none mb-1">:</span>
                <div className="flex flex-col items-center">
                    <span className="text-[14px] font-black text-orange-400 leading-none tabular-nums animate-pulse">{timeLeft.seconds.toString().padStart(2, '0')}</span>
                    <span className="text-[6px] text-white/70 uppercase font-bold tracking-tighter text-orange-400">Dtk</span>
                </div>
            </div>
        </div>
    );
};

type CategoryTab = 'all' | 'reguler' | 'promo' | 'limited-edition';

const PackageBrowsePage: React.FC<PackageBrowsePageProps> = ({
    packages: initialPackages,
    onBack,
    onSelectPackage,
    formatCurrency
}) => {
    const { currentUser } = useAuth();
    const userName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Jamaah';

    const [activeTab, setActiveTab] = useState<CategoryTab>('all');
    const [packages, setPackages] = useState<Package[]>(initialPackages || []);
    const [filteredPackages, setFilteredPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(!initialPackages || initialPackages.length === 0);

    // Filter & Sort State
    const [showFilters, setShowFilters] = useState(false);
    const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'date-asc' | 'none'>('none');
    const [priceRange, setPriceRange] = useState<'all' | 'under-25' | '25-35' | 'over-35'>('all');
    const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
    const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
    const [durationFilter, setDurationFilter] = useState<'all' | '9' | '12' | '15+'>('all');

    // ✅ NEW: Fetch packages if not provided as prop or empty (for guest view)
    useEffect(() => {
        if (!initialPackages || initialPackages.length === 0) {
            const fetchPackages = async () => {
                console.log('🔍 Fetching packages for guest view...');
                try {
                    const q = query(collection(db, 'packages'));
                    const snapshot = await getDocs(q);
                    const allData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Package[];

                    // Filter by status in memory to be more resilient
                    const data = allData.filter(p => p.status === 'active');

                    console.log('✅ Fetched packages (active):', data.length);
                    setPackages(data);
                } catch (error) {
                    console.error('Error fetching packages:', error);
                } finally {
                    setLoading(false);
                }
            };
            fetchPackages();
        }
    }, [initialPackages]);

    useEffect(() => {
        let result = [...packages];

        // 1. Filter by Category Tab
        if (activeTab !== 'all') {
            result = result.filter(pkg => (pkg.packageCategory || 'reguler') === activeTab);
        }

        // ✅ NEW: Filter out expired Limited Edition packages
        const now = new Date().getTime();
        result = result.filter(pkg => {
            if (pkg.packageCategory === 'limited-edition' && pkg.expiryDate) {
                return new Date(pkg.expiryDate).getTime() > now;
            }
            return true;
        });

        // 2. Filter by Price Range
        if (priceRange !== 'all') {
            result = result.filter(pkg => {
                const price = pkg.price / 1000000; // in millions
                if (priceRange === 'under-25') return price < 25;
                if (priceRange === '25-35') return price >= 25 && price <= 35;
                if (priceRange === 'over-35') return price > 35;
                return true;
            });
        }

        // 3. Filter by Month & Year
        if (selectedMonth !== 'all' || selectedYear !== 'all') {
            result = result.filter(pkg => {
                if (!pkg.departureDate) return false;
                const d = new Date(pkg.departureDate);
                const monthMatch = selectedMonth === 'all' || d.getMonth() === selectedMonth;
                const yearMatch = selectedYear === 'all' || d.getFullYear() === selectedYear;
                return monthMatch && yearMatch;
            });
        }

        // 4. Filter by Duration
        if (durationFilter !== 'all') {
            result = result.filter(pkg => {
                if (durationFilter === '9') return pkg.duration <= 9;
                if (durationFilter === '12') return pkg.duration > 9 && pkg.duration <= 12;
                if (durationFilter === '15+') return pkg.duration > 12;
                return true;
            });
        }

        // 5. Sorting
        if (sortBy === 'price-asc') result.sort((a, b) => a.price - b.price);
        if (sortBy === 'price-desc') result.sort((a, b) => b.price - a.price);
        if (sortBy === 'date-asc') {
            result.sort((a, b) => {
                const dateA = a.departureDate ? new Date(a.departureDate).getTime() : Infinity;
                const dateB = b.departureDate ? new Date(b.departureDate).getTime() : Infinity;
                return dateA - dateB;
            });
        }

        setFilteredPackages(result);
    }, [activeTab, packages, sortBy, priceRange, selectedMonth, selectedYear, durationFilter]);

    const resetFilters = () => {
        setSortBy('none');
        setPriceRange('all');
        setSelectedMonth('all');
        setSelectedYear('all');
        setDurationFilter('all');
        setActiveTab('all');
    };

    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const currentYear = new Date().getFullYear();
    const years = [currentYear, currentYear + 1, currentYear + 2];

    const getCategoryIcon = (category: CategoryTab) => {
        switch (category) {
            case 'all':
                return <PackageIcon className="w-4 h-4" />;
            case 'reguler':
                return <Check className="w-4 h-4" />;
            case 'promo':
                return <Sparkles className="w-4 h-4" />;
            case 'limited-edition':
                return <Crown className="w-4 h-4" />;
        }
    };

    const getCategoryLabel = (category: CategoryTab) => {
        switch (category) {
            case 'all':
                return 'Semua Paket';
            case 'reguler':
                return 'Paket Reguler';
            case 'promo':
                return 'Paket Promo';
            case 'limited-edition':
                return 'Limited Edition';
        }
    };

    const tabs: CategoryTab[] = ['all', 'reguler', 'promo', 'limited-edition'];

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Memuat paket...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Beautiful Header with Background Image */}
            <div className="relative h-48 md:h-52 overflow-hidden">
                {/* Background Image - Mecca Kaaba */}
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                        backgroundImage: `url(https://images.unsplash.com/photo-1668304521248-0dd0cc00fbfc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWNjYSUyMGthYWJhJTIwbmlnaHR8ZW58MXx8fHwxNzY3NzcyODk2fDA&ixlib=rb-4.1.0&q=80&w=1080)`
                    }}
                >
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60" />
                </div>

                {/* Content on top of image */}
                <div className="relative z-10 h-full max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6 flex flex-col justify-between">
                    {/* Top: Logo, Welcome Text, and Back Button */}
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
                            {/* Logo */}
                            <img src={sultanahLogo} alt="Sultanah" className="w-10 h-10 md:w-12 md:h-12 object-contain drop-shadow-2xl flex-shrink-0" />

                            {/* Welcome Text */}
                            <div className="min-w-0">
                                <h1 className="text-lg md:text-2xl font-bold text-white drop-shadow-lg truncate">
                                    Jelajahi Paket Umrah
                                </h1>
                                <p className="text-[10px] md:text-sm text-white/90 mt-0.5 drop-shadow truncate">
                                    Halo, {userName}
                                </p>
                            </div>
                        </div>

                        {/* Back Button */}
                        <Button
                            onClick={onBack}
                            variant="secondary"
                            size="sm"
                            className="bg-white/95 backdrop-blur-sm hover:bg-white text-gray-900 h-8 md:h-9 px-3 md:px-4 text-[10px] md:text-sm shadow-lg flex items-center gap-1.5 md:gap-2 flex-shrink-0"
                        >
                            <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            <span className="hidden xs:inline">Kembali</span>
                            <span className="xs:hidden">Back</span>
                        </Button>
                    </div>

                    {/* Bottom: Category Tabs - Ultra compact on mobile, spacious and premium on desktop */}
                    <div className="flex gap-1 md:gap-6 lg:gap-8 -mx-2 px-2 md:mx-0 md:px-0 justify-center">
                        {tabs.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`
                                    px-2 md:px-6 py-1.5 md:py-3 rounded-md md:rounded-xl transition-all flex items-center gap-1 md:gap-3 whitespace-nowrap
                                    ${activeTab === tab
                                        ? 'bg-[#D4AF37] text-white shadow-xl scale-110 z-10'
                                        : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'
                                    }
                                `}
                            >
                                <span className="flex-shrink-0 scale-[0.7] md:scale-110 origin-center">
                                    {getCategoryIcon(tab)}
                                </span>
                                <span className="text-[8px] sm:text-[9px] md:text-sm font-bold uppercase tracking-tighter md:tracking-normal">
                                    <span className="md:hidden">
                                        {tab === 'all' ? 'Semua' :
                                            tab === 'reguler' ? 'Reguler' :
                                                tab === 'promo' ? 'Promo' : 'Limited'}
                                    </span>
                                    <span className="hidden md:inline">
                                        {getCategoryLabel(tab)}
                                    </span>
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content & Filters */}
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
                {/* Advanced Filter Bar */}
                <div className="mb-6 md:mb-8 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowFilters(!showFilters)}
                                className={`h-9 md:h-10 border-gray-200 gap-2 font-semibold ${showFilters ? 'bg-gray-100 border-[#D4AF37]' : 'bg-white'}`}
                            >
                                <SlidersHorizontal className={`w-4 h-4 ${showFilters ? 'text-[#D4AF37]' : ''}`} />
                                <span className="text-xs md:text-sm">{showFilters ? 'Tutup Filter' : 'Filter Paket'}</span>
                            </Button>

                            {(sortBy !== 'none' || priceRange !== 'all' || selectedMonth !== 'all' || selectedYear !== 'all' || durationFilter !== 'all') && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={resetFilters}
                                    className="h-9 md:h-10 text-gray-500 hover:text-red-500 gap-1.5 text-xs font-semibold"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    Reset
                                </Button>
                            )}
                        </div>

                        {/* Quick Sort Dropdown */}
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider hidden sm:inline">Urutkan:</span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="h-9 md:h-10 bg-white border border-gray-200 rounded-lg px-3 text-xs md:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] appearance-none cursor-pointer"
                            >
                                <option value="none">Default</option>
                                <option value="price-asc">Harga Terendah</option>
                                <option value="price-desc">Harga Tertinggi</option>
                                <option value="date-asc">Keberangkatan Terdekat</option>
                            </select>
                        </div>
                    </div>

                    {/* Expandable Filter Options */}
                    <AnimatePresence>
                        {showFilters && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 p-4 md:p-5 bg-white border border-gray-100 rounded-2xl shadow-sm">
                                    {/* Month Filter */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                                            <CalendarDays className="w-3 h-3" /> Bulan
                                        </label>
                                        <select
                                            value={selectedMonth}
                                            onChange={(e) => setSelectedMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                                            className="w-full h-9 md:h-10 bg-gray-50/50 border border-gray-100 rounded-xl px-3 text-xs md:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/10"
                                        >
                                            <option value="all">Semua Bulan</option>
                                            {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
                                        </select>
                                    </div>

                                    {/* Year Filter */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                                            <Sparkles className="w-3 h-3" /> Tahun
                                        </label>
                                        <select
                                            value={selectedYear}
                                            onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                                            className="w-full h-9 md:h-10 bg-gray-50/50 border border-gray-100 rounded-xl px-3 text-xs md:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/10"
                                        >
                                            <option value="all">Semua Tahun</option>
                                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                                        </select>
                                    </div>

                                    {/* Price Filter */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                                            <ArrowDownAZ className="w-3 h-3" /> Budget (IDR)
                                        </label>
                                        <select
                                            value={priceRange}
                                            onChange={(e) => setPriceRange(e.target.value as any)}
                                            className="w-full h-9 md:h-10 bg-gray-50/50 border border-gray-100 rounded-xl px-3 text-xs md:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/10"
                                        >
                                            <option value="all">Semua Harga</option>
                                            <option value="under-25">&lt; 25 Juta</option>
                                            <option value="25-35">25 - 35 Juta</option>
                                            <option value="over-35">&gt; 35 Juta</option>
                                        </select>
                                    </div>

                                    {/* Duration Filter */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                                            <Clock className="w-3 h-3" /> Durasi
                                        </label>
                                        <select
                                            value={durationFilter}
                                            onChange={(e) => setDurationFilter(e.target.value as any)}
                                            className="w-full h-9 md:h-10 bg-gray-50/50 border border-gray-100 rounded-xl px-3 text-xs md:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/10"
                                        >
                                            <option value="all">Semua Durasi</option>
                                            <option value="9">S/D 9 Hari</option>
                                            <option value="12">10 - 12 Hari</option>
                                            <option value="15+">13+ Hari</option>
                                        </select>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Package Count */}
                <div className="mb-4 md:mb-6">
                    <p className="text-[11px] md:text-sm font-semibold text-gray-600">
                        {filteredPackages.length} Paket Tersedia di {getCategoryLabel(activeTab)}
                    </p>
                </div>

                {/* Packages Grid */}
                <AnimatePresence mode="wait">
                    {filteredPackages.length > 0 ? (
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            {filteredPackages.map((pkg, index) => (
                                <motion.div
                                    key={pkg.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05, duration: 0.3 }}
                                    className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                                >
                                    {/* Image */}
                                    <div className="relative h-44 md:h-48 bg-gray-100">
                                        <img
                                            src={pkg.image || pkg.photo || 'https://images.unsplash.com/photo-1591604129939-f1efa4d8f7ec?q=80&w=1200'}
                                            alt={pkg.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = 'https://images.unsplash.com/photo-1591604129939-f1efa4d8f7ec?q=80&w=1200'; // Reliable fallback
                                                target.onerror = null; // Prevent infinite loop
                                            }}
                                        />

                                        {/* Type Badge */}
                                        {pkg.type && (
                                            <div className="absolute top-2 right-2 md:top-3 md:right-3">
                                                <span className="px-2 md:px-3 py-1 rounded bg-[#D4AF37] text-white text-[10px] md:text-xs font-bold uppercase">
                                                    {pkg.type}
                                                </span>
                                            </div>
                                        )}

                                        {/* Category Badge */}
                                        {pkg.packageCategory && pkg.packageCategory !== 'reguler' && (
                                            <div className="absolute top-2 left-2 md:top-3 md:left-3">
                                                <span className={`
                                                    px-2 md:px-3 py-1 rounded text-white text-[10px] md:text-xs font-bold uppercase flex items-center gap-1
                                                    ${pkg.packageCategory === 'promo' ? 'bg-orange-500' : 'bg-purple-600'}
                                                `}>
                                                    {pkg.packageCategory === 'promo' ? <Sparkles className="w-2.5 h-2.5 md:w-3 h-3" /> : <Crown className="w-2.5 h-2.5 md:w-3 h-3" />}
                                                    {pkg.packageCategory === 'promo' ? 'PROMO' : 'LIMITED'}
                                                </span>
                                            </div>
                                        )}

                                        {/* Premium Banner Timer for Limited Edition (Bottom) */}
                                        {pkg.packageCategory === 'limited-edition' && pkg.expiryDate && (
                                            <CountdownTimer expiryDate={pkg.expiryDate} />
                                        )}

                                        {/* Rating - Decision-based positioning to avoid clash with timer */}
                                        <div className={`
                                            absolute left-2 md:left-3 flex items-center gap-1.5 px-2 md:px-2.5 py-1 md:py-1.5 rounded-full bg-white/95 backdrop-blur-sm shadow-xl z-20 border border-black/5
                                            ${pkg.packageCategory === 'limited-edition' && pkg.expiryDate ? 'bottom-12 md:bottom-14' : 'bottom-2 md:bottom-3'}
                                        `}>
                                            <Star className="w-3 h-3 md:w-3.5 md:h-3.5 text-yellow-500 fill-yellow-500" />
                                            <span className="text-[10px] md:text-xs font-bold text-gray-900">4.9</span>
                                            <span className="text-[10px] md:text-xs text-gray-400 font-medium border-l border-gray-200 pl-1.5">(150)</span>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-3 md:p-4">
                                        <h3 className="font-bold text-gray-900 text-sm md:text-base mb-1.5 md:mb-2 line-clamp-1">
                                            {pkg.name}
                                        </h3>

                                        {/* Price */}
                                        <div className="mb-2.5 md:mb-3 p-2.5 md:p-3 rounded bg-orange-50/50">
                                            <div className="text-[10px] md:text-xs text-gray-600">Mulai dari</div>
                                            <div className="text-lg md:text-xl font-bold text-[#D4AF37]">
                                                {formatCurrency(pkg.price)}
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="grid grid-cols-3 gap-1.5 md:gap-2 mb-2.5 md:mb-3">
                                            <div className="text-center p-1.5 md:p-2 rounded bg-gray-50/80">
                                                <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-600 mx-auto mb-0.5" />
                                                <div className="text-[9px] md:text-xs font-semibold">{pkg.duration} Hari</div>
                                            </div>
                                            <div className="text-center p-1.5 md:p-2 rounded bg-gray-50/80">
                                                <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-600 mx-auto mb-0.5" />
                                                <div className="text-[9px] md:text-xs font-semibold">
                                                    {pkg.departureDate ? new Date(pkg.departureDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : 'Flexible'}
                                                </div>
                                            </div>
                                            <div className="text-center p-1.5 md:p-2 rounded bg-gray-50/80">
                                                <Users className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-600 mx-auto mb-0.5" />
                                                <div className="text-[9px] md:text-xs font-semibold">{pkg.availableSlots || 0} Slot</div>
                                            </div>
                                        </div>

                                        {/* Features - Hide on very small screens to save space if needed, or keep compact */}
                                        {pkg.features && pkg.features.length > 0 && (
                                            <div className="mb-3 pb-3 border-b border-gray-100/50">
                                                <ul className="space-y-1">
                                                    {pkg.features.slice(0, 2).map((feature: string, i: number) => (
                                                        <li key={i} className="flex items-start text-[10px] md:text-[11px] text-gray-600">
                                                            <Check className="w-2.5 h-2.5 text-green-500 mr-1 mt-0.5 flex-shrink-0" />
                                                            <span className="line-clamp-1">{feature}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Button */}
                                        <Button
                                            onClick={() => onSelectPackage(pkg)}
                                            className="w-full bg-[#D4AF37] hover:bg-[#C5A572] text-white h-9 md:h-10 text-xs md:text-sm font-semibold shadow-sm"
                                        >
                                            Lihat Detail
                                        </Button>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key={`empty-${activeTab}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="text-center py-20"
                        >
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                                {getCategoryIcon(activeTab)}
                            </div>
                            <h3 className="font-bold text-gray-900 mb-2">Belum Ada Paket {getCategoryLabel(activeTab)}</h3>
                            <p className="text-sm text-gray-600">Paket untuk kategori ini akan segera hadir.</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default PackageBrowsePage;
