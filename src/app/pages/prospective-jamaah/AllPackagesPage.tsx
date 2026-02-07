import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Package, Star, Clock, Calendar, Users, Check, ShoppingBag, Tag, Zap } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../../contexts/AuthContext';

// ✅ LOGO: Sultanah local logo
const sultanahLogo = '/images/logo.png';

interface AllPackagesPageProps {
  packages: any[];
  onBack: () => void;
  onSelectPackage: (pkg: any) => void;
  formatCurrency: (amount: number | string) => string;
}

const AllPackagesPage: React.FC<AllPackagesPageProps> = ({ packages, onBack, onSelectPackage, formatCurrency }) => {
  const { currentUser } = useAuth();
  const userName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Jamaah';
  const [activeCategory, setActiveCategory] = useState<'reguler' | 'promo' | 'limited-edition'>('reguler');

  // Filter packages based on active category
  const filteredPackages = useMemo(() => {
    return packages.filter(pkg => {
      // Default to 'reguler' if category is missing
      const category = pkg.packageCategory || 'reguler';
      return category === activeCategory;
    });
  }, [packages, activeCategory]);

  const categories = [
    { id: 'reguler', label: 'Paket Reguler', icon: ShoppingBag, color: 'blue' },
    { id: 'promo', label: 'Paket Promo', icon: Tag, color: 'amber' },
    { id: 'limited-edition', label: 'Limited Edition', icon: Zap, color: 'red' },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Beautiful Header with Background Image */}
      <div className="relative h-64 overflow-hidden">
        {/* Background Image - Mecca Kaaba */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(https://images.unsplash.com/photo-1668304521248-0dd0cc00fbfc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWNjYSUyMGthYWJhJTIwbmlnaHR8ZW58MXx8fHwxNzY3NzcyODk2fDA&ixlib=rb-4.1.0&q=80&w=1080)`
          }}
        >
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        </div>

        {/* Content on top of image */}
        <div className="relative z-10 h-full max-w-7xl mx-auto px-6 py-6 flex flex-col justify-between">
          {/* Top: Logo, Welcome Text, and Back Button */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {/* Logo */}
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md p-2 border border-white/20">
                <img src={sultanahLogo} alt="Sultanah" className="w-full h-full object-contain" />
              </div>

              {/* Welcome Text */}
              <div>
                <h1 className="text-2xl font-bold text-white drop-shadow-lg">
                  Eksplorasi Paket Ibrahim
                </h1>
                <p className="text-sm text-white/90 mt-0.5 drop-shadow">
                  Temukan perjalanan spiritual terbaik Anda, {userName}
                </p>
              </div>
            </div>

            {/* Back Button */}
            <Button
              onClick={onBack}
              className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white border border-white/30 h-10 px-6 rounded-xl shadow-lg flex items-center gap-2 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Dashboard
            </Button>
          </div>

          {/* Bottom: Tabs Navigation */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-2 px-2 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`relative flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 min-w-max ${activeCategory === cat.id
                  ? 'bg-white text-[#D4AF37] shadow-xl scale-105'
                  : 'bg-white/10 text-white backdrop-blur-md hover:bg-white/20 border border-white/10'
                  }`}
              >
                <cat.icon className={`w-4 h-4 ${activeCategory === cat.id ? 'text-[#D4AF37]' : 'text-white'}`} />
                {cat.label}
                {activeCategory === cat.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -bottom-1 left-4 right-4 h-1 bg-[#D4AF37] rounded-full"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {filteredPackages.map((pkg, index) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                whileHover={{ y: -8 }}
                className="group relative flex flex-col bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden border border-gray-100 hover:shadow-[0_20px_50px_rgba(212,175,55,0.15)] transition-all duration-500"
              >
                {/* Image Section */}
                {(pkg.image || pkg.photo) && (
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={pkg.image || pkg.photo}
                      alt={pkg.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                    {/* Status Badge */}
                    <div className="absolute top-4 left-4">
                      <span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase shadow-lg backdrop-blur-md border ${activeCategory === 'limited-edition'
                        ? 'bg-red-500/80 text-white border-red-400'
                        : activeCategory === 'promo'
                          ? 'bg-amber-500/80 text-white border-amber-400'
                          : 'bg-blue-500/80 text-white border-blue-400'
                        }`}>
                        {pkg.packageCategory?.replace('-', ' ') || 'Reguler'}
                      </span>
                    </div>

                    {/* Class Badge */}
                    <div className="absolute top-4 right-4">
                      <span className="px-3 py-1.5 rounded-lg bg-white/90 text-[#D4AF37] text-[10px] font-bold shadow-lg flex items-center gap-1">
                        <Star className="w-3 h-3 fill-[#D4AF37]" />
                        {pkg.packageClass?.toUpperCase() || 'REGULER'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Content Section */}
                <div className="flex-grow p-6 flex flex-col">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-[#D4AF37] transition-colors line-clamp-2 min-h-[3.5rem]">
                    {pkg.name}
                  </h3>

                  {/* Pricing */}
                  <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 shadow-inner">
                    <div className="text-xs text-gray-500 mb-1">Mulai dari</div>
                    <div className="text-3xl font-bold bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] bg-clip-text text-transparent">
                      {formatCurrency(pkg.price)}
                    </div>
                    <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      pax (Sudah Termasuk Pajak)
                    </div>
                  </div>

                  {/* Highlights Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-blue-50/50 border border-blue-100 group-hover:bg-blue-50 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-200">
                        <Clock className="w-4 h-4 text-white" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Durasi</p>
                        <p className="text-xs font-bold text-blue-900">{pkg.duration} Hari</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-amber-50/50 border border-amber-100 group-hover:bg-amber-50 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-200">
                        <Calendar className="w-4 h-4 text-white" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Berangkat</p>
                        <p className="text-xs font-bold text-amber-900 truncate">
                          {pkg.departureDate ? new Date(pkg.departureDate).toLocaleDateString('id-ID', { month: 'short', year: '2-digit' }) : 'Segera'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Mini Features List */}
                  {pkg.features && pkg.features.length > 0 && (
                    <div className="mb-6 space-y-2">
                      {pkg.features.slice(0, 2).map((feat: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                          <Check className="w-3 h-3 text-[#D4AF37] flex-shrink-0" />
                          <span className="line-clamp-1">{feat}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-auto">
                    <Button
                      onClick={() => onSelectPackage(pkg)}
                      className="w-full h-12 bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] hover:from-[#B89560] hover:via-[#C5A045] hover:to-[#E3C034] text-white shadow-lg shadow-amber-200/50 rounded-xl font-bold transition-all duration-300"
                    >
                      🕌 Lihat Penawaran Detail
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Empty State */}
        {filteredPackages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 px-6 bg-white rounded-3xl border border-dashed border-gray-300 shadow-inner mt-8"
          >
            <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-6 shadow-sm">
              <Package className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Belum Ada Paket Tersedia</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Saat ini kategori <span className="font-bold text-[#D4AF37] italic opacity-80">"{activeCategory.replace('-', ' ')}"</span> sedang dalam tahap persiapan.
              Silakan cek kategori lainnya atau hubungi layanan pelanggan kami.
            </p>
            <Button
              onClick={() => setActiveCategory('reguler')}
              variant="outline"
              className="mt-8 border-[#D4AF37] text-[#D4AF37] hover:bg-amber-50"
            >
              Lihat Paket Reguler
            </Button>
          </motion.div>
        )}
      </div>

      {/* Trust Badges */}
      <div className="max-w-7xl mx-auto px-6 border-t border-gray-100 pt-12 text-center">
        <p className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em] mb-8">Pelayanan Terjamin & Amanah</p>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5" /> <span className="font-bold">Izin Kemenag</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5" /> <span className="font-bold">Pembimbing Berpengalaman</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5" /> <span className="font-bold">Hotel Terdekat</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllPackagesPage;