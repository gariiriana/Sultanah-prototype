import React from 'react';
import { motion } from 'motion/react';
import { Check, Package as PackageIcon } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import kaabaFamily from '@/assets/images/kaaba-family.jpg';

interface PackagesSectionProps {
  onViewPackageDetail: (packageId: string) => void;
  onViewAllPackages?: () => void;
}

const PackagesSection: React.FC<PackagesSectionProps> = ({ onViewAllPackages }) => {
  return (
    <section
      id="packages"
      className="relative py-24 overflow-hidden"
    >
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1765892272462-bad4a8ba0fb9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpbmElMjBtb3NxdWUlMjBncmVlbiUyMGRvbWV8ZW58MXx8fHwxNzY4MTg1ODc3fDA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Medina Mosque with Green Dome"
          className="w-full h-full object-cover"
        />
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/75 via-pink-900/65 to-rose-900/75" />
        <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/90 to-white/95" />
      </div>

      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4AF37' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Floating Orbs */}
      <motion.div
        animate={{ y: [0, -20, 0], rotate: [0, 180, 360] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-20 right-20 w-64 h-64 bg-gradient-to-br from-pink-300/20 to-rose-300/20 rounded-full blur-3xl z-0"
      />
      <motion.div
        animate={{ y: [0, 25, 0], x: [0, -20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-32 left-16 w-72 h-72 bg-gradient-to-tl from-purple-300/20 to-pink-300/20 rounded-full blur-3xl z-0"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

          {/* Left Column: Image with Frame */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative"
          >
            <div className="relative z-10 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-[#D4AF37]/20">
              <img
                src={kaabaFamily}
                alt="Family at Kaaba"
                className="w-full aspect-[4/5] lg:aspect-square object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>

            {/* Decorative Frame Elements */}
            <div className="absolute -top-6 -left-6 w-24 h-24 border-t-4 border-l-4 border-[#D4AF37]/30 rounded-tl-3xl z-0" />
            <div className="absolute -bottom-6 -right-6 w-24 h-24 border-b-4 border-r-4 border-[#D4AF37]/30 rounded-br-3xl z-0" />
          </motion.div>

          {/* Right Column: Content */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="flex flex-col space-y-8"
          >
            <div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                Khidmat Ibadah <br />
                <span className="bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#D4AF37] bg-clip-text text-transparent">Terbaik & Amanah</span>
              </h2>
              <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
                Menemani perjalanan spiritual Anda dengan pelayanan penuh kekhusyukan dan kenyamanan dari hati.
              </p>
            </div>

            {/* Benefit List - 2x3 Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                "Hotel berbintang dekat Masjidil Haram & Nabawi",
                "Transportasi AC yang nyaman dan aman",
                "Pembimbing ibadah berpengalaman & berilmu",
                "Makanan halal bergizi & bervariasi",
                "Asuransi perjalanan komprehensif",
                "Handling keberangkatan & kepulangan"
              ].map((benefit, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 + (idx * 0.1) }}
                  className="flex items-start gap-3 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-[#D4AF37]/10 hover:border-[#D4AF37]/30 hover:shadow-md transition-all"
                >
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#FFD700] flex items-center justify-center shadow-sm mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm md:text-base text-gray-800 font-medium leading-relaxed">{benefit}</span>
                </motion.div>
              ))}
            </div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 1.1 }}
              className="pt-6"
            >
              <Button
                onClick={() => onViewAllPackages?.()}
                className="group relative px-10 py-7 bg-gradient-to-r from-[#D4AF37] to-[#C5A572] hover:from-[#C5A572] hover:to-[#D4AF37] text-white rounded-2xl text-xl font-bold transition-all duration-300 shadow-[0_10px_40px_rgba(212,175,55,0.3)] hover:shadow-[0_15px_50px_rgba(212,175,55,0.4)] overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-3">
                  <PackageIcon className="w-6 h-6" />
                  Lihat Detail Paket
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    →
                  </motion.span>
                </span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </Button>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default PackagesSection;
