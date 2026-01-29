import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Tag, Clock, Gift, Users } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../../config/firebase';
import { Promo } from '../../../../types';

interface PromoBannerSectionProps {
  onViewPromoDetail: (promoId: string) => void;
  onViewAllPromos?: () => void; // ✅ NEW: Handler for "Lihat Semua"
}

const PromoBannerSection: React.FC<PromoBannerSectionProps> = ({ onViewPromoDetail, onViewAllPromos }) => {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPromos = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'promos'));
        const promosData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Promo[];
        setPromos(promosData);
      } catch (error: any) {
        console.error('Error fetching promos:', error);

        // More detailed error logging for debugging
        if (error.code === 'permission-denied') {
          console.error('🔒 FIREBASE PERMISSION DENIED - Please check Firestore Security Rules!');
          console.error('📋 Solution: Go to Firebase Console → Firestore Database → Rules');
          console.error('📄 See FIREBASE_SECURITY_RULES.md for complete setup instructions');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPromos();
  }, []);

  const colorConfig = {
    blue: {
      gradient: 'from-blue-600 to-blue-700',
      bgColor: 'bg-blue-50',
    },
    gold: {
      gradient: 'from-[#D4AF37] to-[#F4D03F]',
      bgColor: 'bg-yellow-50',
    },
    green: {
      gradient: 'from-green-600 to-green-700',
      bgColor: 'bg-green-50',
    },
  };

  const iconConfig = {
    clock: Clock,
    gift: Gift,
    users: Users,
  };

  return (
    <section className="relative py-16 bg-gradient-to-br from-gray-50 via-white to-gray-50 overflow-hidden">
      {/* Decorative Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-64 h-64 bg-[#D4AF37] rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#F4D03F] rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#D4AF37]/10 to-[#F4D03F]/10 border border-[#D4AF37]/20 mb-4">
            <Tag className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-sm font-semibold text-[#D4AF37]">PROMO SPESIAL</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Penawaran Terbaik
            <span className="bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] bg-clip-text text-transparent"> Untuk Anda</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Dapatkan harga spesial dengan berbagai promo menarik kami
          </p>
        </motion.div>

        {/* Promos Grid - Optimized for 2 columns on mobile */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-8">
          {loading ? (
            // Loading skeleton
            [1, 2, 3].map((i) => (
              <div key={i} className="h-80 rounded-2xl bg-gray-200 animate-pulse" />
            ))
          ) : promos.length === 0 ? (
            // Empty state - sama kayak Education section
            <div className="col-span-3 text-center py-20">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-[#D4AF37]/10 to-[#F4D03F]/10 border-2 border-[#D4AF37]/20 mb-6">
                <Tag className="w-12 h-12 text-[#D4AF37]/60" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-700 mb-2">Belum Ada Promo Tersedia</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Promo spesial akan segera hadir. Pantau terus untuk penawaran menarik!
              </p>
            </div>
          ) : (
            promos.slice(0, 3).map((promo, index) => { // ✅ LIMIT: Show only 3 cards
              const Icon = iconConfig[promo.icon as keyof typeof iconConfig] || Tag;
              const config = colorConfig[promo.color as keyof typeof colorConfig] || colorConfig.gold;
              const hasBadge = promo.badge && promo.badge.trim() !== '';

              return (
                <motion.div
                  key={promo.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="relative group"
                >
                  {/* Featured Badge - Moved to top-left to avoid collision with top-right discount info */}
                  {hasBadge && (
                    <div className="absolute -top-2 -left-2 z-10">
                      <div className="bg-gradient-to-r from-red-500 to-red-600 text-white text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-lg flex items-center gap-1 border border-white/20">
                        <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        {promo.badge}
                      </div>
                    </div>
                  )}

                  <div className={`relative h-full rounded-2xl ${config.bgColor} border-2 ${hasBadge ? 'border-[#D4AF37]' : 'border-gray-200'} overflow-hidden transition-all duration-300 group-hover:shadow-2xl`}>
                    {/* Card Header with Gradient OR Image Background */}
                    <div className={`relative p-3 sm:p-6 text-white overflow-hidden ${promo.image ? 'h-32 sm:h-64' : ''}`}>
                      {/* Background Image OR Gradient */}
                      {promo.image ? (
                        <>
                          <img
                            src={promo.image}
                            alt={promo.title}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                          <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-80`} />
                        </>
                      ) : (
                        <div className={`absolute inset-0 bg-gradient-to-r ${config.gradient}`} />
                      )}

                      {/* Decorative Pattern */}
                      <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
                      </div>

                      <div className="relative z-10 pt-2 sm:pt-0">
                        <div className="flex items-center justify-between mb-1 sm:mb-3">
                          <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <Icon className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                          </div>
                          <div className="text-right">
                            <div className="text-base sm:text-3xl font-bold leading-tight">{promo.discount}</div>
                            <div className="text-[7px] sm:text-xs text-white/80">OFF</div>
                          </div>
                        </div>
                        <h3 className="text-xs sm:text-xl font-bold mb-0.5 line-clamp-1">{promo.title}</h3>
                        <p className="text-[9px] sm:text-sm text-white/90 line-clamp-2 leading-tight">{promo.description}</p>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-2 sm:p-6">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-3">
                        <div className="text-[8px] sm:text-xs text-gray-500">
                          Hingga <span className="font-semibold text-gray-700 block sm:inline">{promo.validUntil}</span>
                        </div>
                        <button
                          onClick={() => onViewPromoDetail(promo.id)}
                          className="text-[9px] sm:text-sm font-semibold text-[#D4AF37] hover:text-[#F4D03F] transition-colors flex items-center gap-0.5 group-hover:gap-2 duration-300"
                        >
                          Detail
                          <svg className="w-2.5 h-2.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 text-center space-y-6"
        >
          {/* ✅ NEW: Lihat Semua Promo Button with Login Gate - SAME STYLE AS PACKAGES */}
          {onViewAllPromos && promos.length > 0 && (
            <div>
              <button
                onClick={() => {
                  onViewAllPromos(); // Navigate to All Promos page
                }}
                className="group inline-flex items-center gap-3 px-8 py-4 bg-white hover:bg-emerald-50 border-2 border-emerald-600 rounded-xl text-emerald-700 font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <span>Lihat Semua Promo</span>
                <span className="text-2xl group-hover:translate-x-2 transition-transform duration-300">→</span>
              </button>
            </div>
          )}

          <p className="text-gray-600">
            Ingin tahu lebih banyak tentang promo kami?
          </p>
          <a
            href="https://api.whatsapp.com/send/?phone=6281234700116&text=Halo%20Sultanah%20Travel%2C%20saya%20ingin%20tanya%20tentang%20promo%20yang%20tersedia&type=phone_number&app_absent=0"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-white font-semibold rounded-xl hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <Sparkles className="w-5 h-5" />
            Hubungi Kami
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default PromoBannerSection;