import React from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Tag,
  Clock,
  CheckCircle2,
  MessageCircle,
  Gift,
  Sparkles,
  X as XIcon
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Promo } from '../../../types';

interface PromoDetailProps {
  promoData: Promo;
  onBack: () => void;
}

const PromoDetail: React.FC<PromoDetailProps> = ({ promoData, onBack }) => {
  const handleConsultation = () => {
    // Format WhatsApp message with promo details
    const message = `Halo, saya tertarik dengan promo:\\n\\n` +
      `🎁 *${promoData.title}*\\n` +
      `💰 Diskon: ${promoData.discount}\\n` +
      `📅 Berlaku hingga: ${promoData.validUntil}\\n\\n` +
      `Mohon informasi lebih lanjut tentang promo ini. Terima kasih!`;

    const whatsappUrl = `https://api.whatsapp.com/send/?phone=6281234700116&text=${encodeURIComponent(message)}&type=phone_number&app_absent=0`;
    window.open(whatsappUrl, '_blank');
  };

  // Dynamic color mapping
  const colorMap: Record<string, { bg: string; text: string; badge: string }> = {
    blue: {
      bg: 'from-blue-500 to-blue-600',
      text: 'text-blue-800',
      badge: 'bg-blue-600'
    },
    gold: {
      bg: 'from-[#D4AF37] to-[#C5A572]',
      text: 'text-[#C5A572]',
      badge: 'bg-[#D4AF37]'
    },
    green: {
      bg: 'from-green-500 to-green-600',
      text: 'text-green-800',
      badge: 'bg-green-600'
    }
  };

  const colors = colorMap[promoData.color || 'gold'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F0] via-white to-gray-50">
      {/* Top Navbar */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button
              onClick={onBack}
              variant="ghost"
              className="text-gray-700 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Promo
            </Button>
            {promoData.badge && (
              <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full ${colors.badge} text-white font-bold text-sm shadow-lg`}>
                <Sparkles className="w-4 h-4" />
                {promoData.badge}
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Image */}
        {promoData.image && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="relative h-96 rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={promoData.image}
                alt={promoData.title}
                className="w-full h-full object-cover"
              />
              <div className={`absolute inset-0 bg-gradient-to-t ${colors.bg} opacity-10`} />
              <div className={`absolute top-4 right-4 bg-gradient-to-r ${colors.bg} text-white px-6 py-3 rounded-full font-bold shadow-lg text-2xl`}>
                {promoData.discount}
              </div>
            </div>
          </motion.div>
        )}

        {/* Promo Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Promo Title */}
            <Card>
              <CardContent className="p-6">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">{promoData.title}</h1>
                <div className="flex items-center gap-3 mb-6">
                  <div className={`inline-flex items-center px-6 py-3 rounded-xl bg-gradient-to-r ${colors.bg} text-white font-bold text-3xl shadow-lg`}>
                    <Tag className="w-8 h-8 mr-3" />
                    {promoData.discount}
                  </div>
                </div>

                {/* Quick Info */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Clock className="w-5 h-5 text-[#D4AF37]" />
                    <div>
                      <p className="text-sm text-gray-500">Berlaku Hingga</p>
                      <p className="font-semibold">{promoData.validUntil}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Gift className="w-5 h-5 text-[#D4AF37]" />
                    <div>
                      <p className="text-sm text-gray-500">Promo Spesial</p>
                      <p className="font-semibold">Terbatas</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Deskripsi Promo</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {promoData.detailDescription || promoData.description}
                </p>
              </CardContent>
            </Card>

            {/* What's Included */}
            {promoData.includes && promoData.includes.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <CheckCircle2 className="w-6 h-6 text-green-600 mr-2" />
                    Yang Termasuk
                  </h2>
                  <ul className="space-y-3">
                    {promoData.includes.map((item, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* What's Excluded */}
            {promoData.excludes && promoData.excludes.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <XIcon className="w-6 h-6 text-red-600 mr-2" />
                    Tidak Termasuk
                  </h2>
                  <ul className="space-y-3">
                    {promoData.excludes.map((item, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <XIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Terms & Conditions */}
            {promoData.terms && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Syarat & Ketentuan</h2>
                  <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line">
                    {promoData.terms}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Right Side */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* Consultation Card */}
              <Card className="border-2 border-[#D4AF37]/20">
                <CardContent className="p-6">
                  <div className="text-center mb-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#C5A572] mb-4">
                      <MessageCircle className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Tertarik dengan promo ini?</h3>
                    <p className="text-sm text-gray-600">
                      Hubungi kami sekarang untuk informasi lebih lanjut dan konfirmasi promo
                    </p>
                  </div>

                  <Button
                    onClick={handleConsultation}
                    className="w-full h-12 bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:opacity-90 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl font-semibold"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Konsultasi via WhatsApp
                  </Button>
                </CardContent>
              </Card>

              {/* Info Card */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                    <Sparkles className="w-5 h-5 text-[#D4AF37] mr-2" />
                    Informasi Penting
                  </h3>
                  <ul className="space-y-3 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Promo terbatas waktu</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Berlaku untuk pendaftaran baru</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Syarat dan ketentuan berlaku</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Hubungi CS untuk detail lengkap</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromoDetail;
