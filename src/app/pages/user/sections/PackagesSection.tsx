import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, Users, Clock, Check, Star, MapPin } from 'lucide-react';
import { Button } from '../../../components/ui/button';

import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../../config/firebase';
import { useAuth } from '../../../../contexts/AuthContext';
import { toast } from 'sonner';
import { Package } from '../../../../types';

interface PackagesSectionProps {
  onViewPackageDetail: (packageId: string) => void;
  onViewAllPackages?: () => void; // ✅ NEW: Optional handler for "Lihat Semua"
}

const PackagesSection: React.FC<PackagesSectionProps> = ({ onViewPackageDetail, onViewAllPackages }) => {
  const { currentUser } = useAuth();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const q = query(collection(db, 'packages'), where('status', '==', 'active'));
        const querySnapshot = await getDocs(q);
        const packagesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Package[];
        setPackages(packagesData);
      } catch (error) {
        console.error('Error fetching packages:', error);
        toast.error('Failed to load packages');
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  const handleBookNow = (packageId: string) => {
    // Navigasi langsung ke halaman detail paket (Alur Tamu)
    onViewPackageDetail(packageId);
  };



  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <section id="packages" className="relative py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat paket...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="packages" className="relative py-24 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1571909552531-1601eaec8f79?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWNjYSUyMGdyYW5kJTIwbW9zcXVlfGVufDF8fHx8MTc2ODE4NDU1MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Mecca Grand Mosque - Beautiful View"
          className="w-full h-full object-cover"
        />
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/70 via-slate-900/60 to-blue-900/70" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/90 to-white/95" />
      </div>

      {/* Background Elements */}
      <div className="absolute inset-0 z-0 opacity-15">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4AF37' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Floating orbs - More visible */}
      <motion.div
        animate={{ y: [0, -20, 0], x: [0, 15, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-32 right-20 w-64 h-64 bg-gradient-to-br from-[#FFD700]/20 to-[#D4AF37]/20 rounded-full blur-3xl z-0"
      />
      <motion.div
        animate={{ y: [0, 25, 0], x: [0, -15, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-32 left-20 w-56 h-56 bg-gradient-to-tl from-[#F4D03F]/20 to-[#C5A572]/20 rounded-full blur-3xl z-0"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-block mb-4"
          >
            <span className="px-4 py-2 rounded-full bg-gradient-to-r from-[#D4AF37]/10 to-[#FFD700]/10 border border-[#D4AF37]/20 text-[#D4AF37] font-medium text-sm">
              Paket Pilihan
            </span>
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-light mb-4">
            Paket <span className="font-semibold bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] bg-clip-text text-transparent">Umrah Kami</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Pilih paket yang sempurna untuk perjalanan spiritual Anda dengan akomodasi dan layanan premium
          </p>
        </motion.div>

        {/* Packages Grid - Optimized for 2 columns on mobile */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-8">
          {packages.length === 0 ? (
            // Empty state
            <div className="col-span-3 text-center py-20">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-[#D4AF37]/10 to-[#FFD700]/10 border-2 border-[#D4AF37]/20 mb-6">
                <svg className="w-12 h-12 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] bg-clip-text text-transparent mb-2">
                Belum Ada Paket Tersedia
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Paket Umrah eksklusif kami akan segera hadir. Silakan cek kembali nanti atau hubungi kami untuk informasi lebih lanjut.
              </p>
            </div>
          ) : (
            // ✅ UPDATED: Show only first 3 packages
            packages.slice(0, 3).map((pkg, index) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ y: -10 }}
                className="group h-full"
              >
                <div className="relative h-full flex flex-col rounded-3xl bg-white border border-gray-200 hover:border-[#D4AF37]/40 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden">
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/0 to-[#FFD700]/0 group-hover:from-[#D4AF37]/5 group-hover:to-[#FFD700]/5 transition-all duration-500 pointer-events-none" />

                  {/* Package Image */}
                  {(pkg.image || pkg.photo) && (
                    <div className="relative h-28 sm:h-56 overflow-hidden">
                      <motion.img
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.6 }}
                        src={pkg.image || pkg.photo}
                        alt={pkg.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                      {/* Badge */}
                      <div className="absolute top-2 right-2 sm:top-4 sm:right-4">
                        <span className="px-2 sm:px-4 py-1 rounded-full bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] text-white text-[10px] sm:text-sm font-semibold shadow-lg">
                          {pkg.type.toUpperCase()}
                        </span>
                      </div>

                      {/* Rating */}
                      <div className="absolute bottom-4 left-4 flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm">
                        <Star className="w-4 h-4 text-[#FFD700] fill-[#FFD700]" />
                        <span className="text-sm font-semibold">{(pkg as any).rating || 4.9}</span>
                      </div>
                    </div>
                  )}

                  {/* Content */}
                  <div className="relative flex-grow flex flex-col p-2.5 sm:p-6">
                    <div className="flex-grow">
                      <h3 className="text-sm sm:text-2xl font-semibold mb-1 sm:mb-2 text-gray-900 group-hover:text-[#D4AF37] transition-colors line-clamp-1 sm:line-clamp-none">
                        {pkg.name}
                      </h3>

                      {/* Price */}
                      <div className="mb-6">
                        <div className="text-[10px] sm:text-sm text-gray-500 mb-0.5 select-none">Mulai dari</div>
                        <div className="text-base sm:text-3xl font-bold bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] bg-clip-text text-transparent leading-none sm:leading-normal">
                          {formatCurrency(pkg.price)}
                        </div>
                        <div className="text-[9px] sm:text-sm text-gray-500">per orang</div>
                      </div>

                      {/* Info Cards - Mobile Optimized */}
                      <div className="grid grid-cols-3 gap-1 sm:gap-2 mb-2 sm:mb-6">
                        <div className="flex flex-col items-center p-1 sm:p-3 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/50">
                          <Clock className="w-3 h-3 sm:w-5 sm:h-5 text-blue-600 mb-0.5 sm:mb-1" />
                          <span className="text-[8px] sm:text-xs font-semibold text-blue-900">{pkg.duration}D</span>
                        </div>
                        <div className="flex flex-col items-center p-1 sm:p-3 rounded-xl bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200/50">
                          <Calendar className="w-3 h-3 sm:w-5 sm:h-5 text-green-600 mb-0.5 sm:mb-1" />
                          <span className="text-[8px] sm:text-xs font-semibold text-green-900">{new Date(pkg.departureDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                        <div className="flex flex-col items-center p-1 sm:p-3 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200/50">
                          <Users className="w-3 h-3 sm:w-5 sm:h-5 text-purple-600 mb-0.5 sm:mb-1" />
                          <span className="text-[8px] sm:text-xs font-semibold text-purple-900">{pkg.availableSlots}</span>
                        </div>
                      </div>

                      {/* Features - Hidden or very small on mobile */}
                      <div className="hidden sm:block border-t border-gray-200 pt-4">
                        <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                          <Check className="w-4 h-4 mr-1 text-[#D4AF37]" />
                          Fasilitas Paket:
                        </p>
                        <ul className="space-y-2">
                          {pkg.features.slice(0, 4).map((feature, i) => (
                            <li key={i} className="flex items-start text-sm text-gray-600">
                              <Check className="w-4 h-4 mr-2 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Book Button */}
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="mt-2 sm:mt-6">
                      <Button
                        onClick={() => handleBookNow(pkg.id)}
                        disabled={pkg.availableSlots === 0}
                        className="w-full h-8 sm:h-12 bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] hover:opacity-90 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg text-[10px] sm:text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {pkg.availableSlots === 0 ? 'Penuh' : '✓ Beli'}
                      </Button>

                      {/* ✅ NEW: Profile incomplete warning */}
                      {currentUser && pkg.availableSlots > 0 && (
                        <div className="mt-2 text-xs text-amber-600 flex items-center justify-center gap-1">
                          <span>⚠️</span>
                          <span>Harap lengkapi profil di halaman profil</span>
                        </div>
                      )}
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* ✅ NEW: "Lihat Semua Paket" Button - Only show if more than 3 packages */}
        {packages.length > 3 && onViewAllPackages && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <button
              onClick={() => {
                onViewAllPackages(); // ✅ Navigate to All Packages page
              }}
              className="group inline-flex items-center gap-3 px-8 py-4 bg-white hover:bg-emerald-50 border-2 border-emerald-600 rounded-xl text-emerald-700 font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <span>Lihat Semua Paket</span>
              <span className="text-2xl group-hover:translate-x-2 transition-transform duration-300">→</span>
            </button>
            <p className="text-sm text-gray-600 mt-3">
              Menampilkan 3 dari {packages.length} paket tersedia
            </p>
          </motion.div>
        )}

        {/* Empty State */}
        {packages.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 px-8 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-200"
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#D4AF37]/20 to-[#FFD700]/20 flex items-center justify-center">
              <MapPin className="w-10 h-10 text-[#D4AF37]" />
            </div>
            <p className="text-xl font-semibold text-gray-700 mb-2">Belum ada paket tersedia saat ini</p>
            <p className="text-gray-500">Silakan cek kembali nanti untuk perjalanan mendatang kami</p>
          </motion.div>
        )}
      </div>

    </section>
  );
};

export default PackagesSection;