import React from 'react';
import { motion } from 'motion/react';
import { Shield, Users, Award, Headphones, Heart, CheckCircle2 } from 'lucide-react';

const ServicesSection = () => {
  const services = [
    {
      icon: Shield,
      title: 'Terpercaya & Legal',
      description: 'Resmi terdaftar di Kementerian Agama dengan izin lengkap',
      badge: 'PPIU Resmi',
      iconBg: 'from-blue-400 to-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      icon: Users,
      title: 'Berpengalaman',
      description: 'Lebih dari 10 tahun melayani jamaah dengan profesional',
      badge: '10+ Tahun',
      iconBg: 'from-yellow-400 to-yellow-500',
      bgColor: 'bg-yellow-50',
    },
    {
      icon: Award,
      title: 'Fasilitas Premium',
      description: 'Hotel bintang 5 dekat Masjidil Haram & Nabawi',
      badge: 'Hotel Bintang 5',
      iconBg: 'from-purple-400 to-purple-500',
      bgColor: 'bg-purple-50',
    },
    {
      icon: Headphones,
      title: 'Layanan 24/7',
      description: 'Tim support siap membantu kapanpun Anda membutuhkan',
      badge: 'Support 24/7',
      iconBg: 'from-green-400 to-green-500',
      bgColor: 'bg-green-50',
    },
    {
      icon: Heart,
      title: 'Kepuasan Jamaah',
      description: 'Rating 4.9/5 dari ribuan jamaah yang puas',
      badge: '4.9/5 Rating',
      iconBg: 'from-red-400 to-red-500',
      bgColor: 'bg-red-50',
    },
    {
      icon: CheckCircle2,
      title: 'All-Inclusive',
      description: 'Semua biaya transparan, tidak ada biaya tersembunyi',
      badge: 'Harga Transparan',
      iconBg: 'from-teal-400 to-teal-500',
      bgColor: 'bg-teal-50',
    },
  ];

  return (
    <section className="relative py-20 bg-gradient-to-b from-white to-gray-50 overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#F4D03F]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#F4D03F]/20 to-[#F4D03F]/10 border border-[#F4D03F]/30 mb-4">
            <Award className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-sm font-semibold text-[#D4AF37]">KEUNGGULAN KAMI</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Mengapa Memilih
            <span className="bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] bg-clip-text text-transparent"> Kami?</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Kami berkomitmen memberikan pengalaman spiritual terbaik dengan pelayanan premium dan harga terjangkau
          </p>
        </motion.div>

        {/* Services Grid - Optimized for 2 columns on mobile */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-8">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="group"
              >
                <div className={`relative h-full ${service.bgColor} rounded-3xl p-4 sm:p-8 transition-all duration-300 hover:shadow-2xl border-2 border-transparent hover:border-[#D4AF37]/20`}>
                  {/* Icon */}
                  <div className="mb-4 sm:mb-6">
                    <div className={`inline-flex w-10 h-10 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br ${service.iconBg} items-center justify-center transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 shadow-lg`}>
                      <Icon className="w-5 h-5 sm:w-8 sm:h-8 text-white" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="mb-2 sm:mb-6">
                    <h3 className="text-sm sm:text-xl font-bold text-gray-900 mb-1 sm:mb-3">{service.title}</h3>
                    <p className="text-[9px] sm:text-base text-gray-600 leading-tight line-clamp-2 sm:line-clamp-none">{service.description}</p>
                  </div>

                  {/* Badge */}
                  <div className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-0.5 sm:py-2 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm">
                    <div className="w-1 h-1 sm:w-2 sm:h-2 rounded-full bg-[#D4AF37]" />
                    <span className="text-[8px] sm:text-sm font-semibold text-gray-700">{service.badge}</span>
                  </div>

                  {/* Hover Effect - Gradient Accent */}
                  <div className="absolute top-0 right-0 w-0 h-0 border-t-[50px] border-r-[50px] border-t-transparent border-r-[#D4AF37]/0 group-hover:border-r-[#D4AF37]/10 transition-all duration-300 rounded-tr-3xl" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
