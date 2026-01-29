import React from 'react';
import { motion } from 'motion/react';
import { FileSearch, CheckCircle, Plane, Home, ArrowRight } from 'lucide-react';

const JourneyProcessSection: React.FC = () => {
  const steps = [
    {
      number: '01',
      icon: FileSearch,
      title: 'Pilih Paket',
      description: 'Pilih paket umroh yang sesuai dengan kebutuhan dan budget Anda',
      color: 'from-blue-500 to-blue-600',
    },
    {
      number: '02',
      icon: CheckCircle,
      title: 'Registrasi',
      description: 'Lengkapi data diri dan upload dokumen yang diperlukan secara online',
      color: 'from-green-500 to-green-600',
    },
    {
      number: '03',
      icon: FileSearch,
      title: 'Verifikasi',
      description: 'Tim kami akan memproses dokumen dan mengurus visa Anda',
      color: 'from-purple-500 to-purple-600',
    },
    {
      number: '04',
      icon: Plane,
      title: 'Keberangkatan',
      description: 'Berangkat dengan nyaman bersama rombongan dan muthawif profesional',
      color: 'from-[#D4AF37] to-[#F4D03F]',
    },
    {
      number: '05',
      icon: Home,
      title: 'Kepulangan',
      description: 'Pulang dengan membawa kenangan spiritual yang tak terlupakan',
      color: 'from-teal-500 to-teal-600',
    },
  ];

  return (
    <section className="relative py-20 bg-white overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#F4D03F]/5 rounded-full blur-3xl" />
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#D4AF37]/10 to-[#F4D03F]/10 border border-[#D4AF37]/20 mb-4">
            <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-sm font-semibold text-[#D4AF37]">PROSES MUDAH</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Perjalanan Anda
            <span className="bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] bg-clip-text text-transparent"> Dimulai Dari Sini</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Proses booking yang mudah dan transparan. Kami akan memandu Anda di setiap langkah.
          </p>
        </motion.div>

        {/* Desktop Timeline */}
        <div className="hidden md:block relative">
          {/* Connection Line */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-gray-200 via-[#D4AF37]/30 to-gray-200 -translate-y-1/2" />

          <div className="grid grid-cols-5 gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="relative"
                >
                  {/* Step Card */}
                  <div className="relative bg-white rounded-2xl border-2 border-gray-100 p-6 hover:border-[#D4AF37]/30 transition-all duration-300 hover:shadow-xl group">
                    {/* Number Badge */}
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}>
                        <span className="text-white font-bold">{step.number}</span>
                      </div>
                    </div>

                    {/* Icon */}
                    <div className="flex justify-center mt-6 mb-4">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                    </div>

                    {/* Content */}
                    <h3 className="text-lg font-bold text-gray-900 text-center mb-2">{step.title}</h3>
                    <p className="text-sm text-gray-600 text-center leading-relaxed">{step.description}</p>
                  </div>

                  {/* Arrow Connector (except last) */}
                  {index < steps.length - 1 && (
                    <div className="absolute top-1/2 -right-4 -translate-y-1/2 z-10">
                      <ArrowRight className="w-8 h-8 text-[#D4AF37]" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Mobile Timeline */}
        <div className="md:hidden space-y-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative"
              >
                <div className="flex items-start gap-4">
                  {/* Left Side - Number & Line */}
                  <div className="flex flex-col items-center">
                    <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg flex-shrink-0`}>
                      <span className="text-white font-bold">{step.number}</span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className="w-1 h-full min-h-[80px] bg-gradient-to-b from-[#D4AF37]/30 to-gray-200 mt-2" />
                    )}
                  </div>

                  {/* Right Side - Card */}
                  <div className="flex-1 bg-white rounded-2xl border-2 border-gray-100 p-6 hover:border-[#D4AF37]/30 transition-all duration-300 hover:shadow-xl group">
                    {/* Icon */}
                    <div className="mb-4">
                      <div className={`inline-flex w-14 h-14 rounded-xl bg-gradient-to-br ${step.color} items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-8 rounded-2xl bg-gradient-to-r from-[#D4AF37]/10 via-[#F4D03F]/10 to-[#D4AF37]/10 border-2 border-[#D4AF37]/20">
            <div className="text-center sm:text-left">
              <h3 className="text-2xl font-bold text-gray-900 mb-1">Siap Memulai Perjalanan Spiritual Anda?</h3>
              <p className="text-gray-600">Hubungi kami untuk konsultasi gratis dan informasi lebih lanjut</p>
            </div>
            <a
              href="https://api.whatsapp.com/send/?phone=6281234700116&text=Halo%20Sultanah%20Travel%2C%20saya%20ingin%20konsultasi%20tentang%20paket%20umroh&type=phone_number&app_absent=0"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 px-8 py-4 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-white font-semibold rounded-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 flex items-center gap-2"
            >
              Hubungi Kami
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default JourneyProcessSection;