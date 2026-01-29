import React from 'react';
import { Button } from '../../../components/ui/button';
import { motion } from 'motion/react';


// ✅ HERO IMAGE: Mecca Kaaba at Night - Stunning & Beautiful
const kaabaImage = '/images/hero-bg-v2.jpg';

interface HeroSectionProps {
}

const HeroSection: React.FC<HeroSectionProps> = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Beautiful Kaaba Image Background */}
      <div className="absolute inset-0 z-0">
        <img
          src={kaabaImage}
          alt="Kaaba Mecca"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Stronger Gradient for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />

        {/* Subtle Gold Tint */}
        <div className="absolute inset-0 bg-[#D4AF37]/3" />
      </div>

      {/* Content - Center Left Aligned */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-5 sm:space-y-8 max-w-4xl -mt-32 sm:mt-0"
        >
          {/* Main Heading - Left Aligned */}
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl text-white tracking-tight font-light leading-tight"
          >
            Travel Haji, Umroh dan
            <br />
            <span className="bg-gradient-to-r from-[#D4AF37] to-[#FFD700] bg-clip-text text-transparent font-semibold">
              Halal Tours
            </span>
          </motion.h1>

          {/* Subtitle - Marketing Messaging - Left Aligned */}
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="text-sm sm:text-lg md:text-xl text-white/95 max-w-2xl leading-relaxed font-normal"
          >
            Wujudkan niat suci Anda menuju Baitullah dengan layanan premium yang aman dan nyaman. Jangan tunda lagi, <span className="text-[#FFD700] font-semibold">booking paket pilihan Anda sekarang</span> dan nikmati kemudahan ibadah bersama Sultanah Travel!
          </motion.p>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-row items-center justify-start gap-3 sm:gap-4 pt-4 sm:pt-4"
          >
            {/* Primary Button - Konsultasi Gratis */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={() => window.open('https://api.whatsapp.com/send/?phone=6281234700116&text=Halo%20Sultanah%20Travel%2C%20saya%20ingin%20konsultasi%20gratis%20untuk%20paket%20umroh&type=phone_number&app_absent=0', '_blank')}
                size="lg"
                className="bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] hover:opacity-90 text-white text-[10px] xs:text-xs sm:text-lg px-4 xs:px-5 sm:px-10 py-3 sm:py-6 h-auto rounded-lg shadow-2xl hover:shadow-3xl transition-all duration-300 font-semibold whitespace-nowrap"
              >
                Konsultasi Gratis
              </Button>
            </motion.div>

            {/* Secondary Button - Lihat Paket */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={() => document.getElementById('packages')?.scrollIntoView({ behavior: 'smooth' })}
                size="lg"
                variant="ghost"
                className="bg-transparent hover:bg-white/10 text-white text-[10px] xs:text-xs sm:text-lg px-4 xs:px-5 sm:px-10 py-3 sm:py-6 h-auto rounded-lg transition-all duration-300 font-semibold whitespace-nowrap"
              >
                Beli Paket ↗
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* Jamaah Couple Image - Bottom Right on Mobile & Desktop */}
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
        className="absolute bottom-0 right-0 z-10 block pointer-events-none"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            delay: 1.5,
            duration: 0.5,
            type: "spring",
            stiffness: 260,
            damping: 20
          }}
          className="absolute top-4 sm:top-[2rem] lg:top-[4rem] right-2 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 z-20 whitespace-nowrap"
        >
          <motion.div
            animate={{
              y: [0, -5, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="relative px-2 sm:px-5 py-1 sm:py-2.5 rounded-xl sm:rounded-2xl bg-white/95 backdrop-blur-md border border-[#D4AF37] shadow-[0_10px_30px_rgba(212,175,55,0.4)] flex items-center gap-1 sm:gap-2"
          >
            <div className="absolute -bottom-1.5 left-1/2 sm:left-1/2 -translate-x-1/2 w-3 h-3 sm:w-4 sm:h-4 bg-white border-b border-r border-[#D4AF37] rotate-45" />
            <span className="text-[8px] sm:text-sm font-bold bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] bg-clip-text text-transparent italic">
              "Labbaik Allahumma Labbaik..."
            </span>
            <span className="text-[8px] sm:text-sm font-extrabold text-blue-900">
              Yuk Berangkat! 🕋
            </span>
          </motion.div>
        </motion.div>

        <motion.img
          src="/images/jamaah-couple.png"
          alt="Jamaah Sultanah Travel"
          className="max-h-[35vh] sm:max-h-[65vh] lg:max-h-[85vh] w-auto object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
          animate={{
            y: [0, -10, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Subtle Glow behind the couple */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent -z-10" />
      </motion.div>
    </section>
  );
};

export default HeroSection;