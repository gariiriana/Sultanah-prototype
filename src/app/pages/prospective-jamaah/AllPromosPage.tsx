import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Tag, Clock } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Promo } from '../../../types';
import { useAuth } from '../../../contexts/AuthContext';

// ✅ LOGO: Sultanah local logo
const sultanahLogo = '/images/logo.png';

interface AllPromosPageProps {
  promos: Promo[];
  onBack: () => void;
  onSelectPromo?: (promo: Promo) => void;
}

const AllPromosPage: React.FC<AllPromosPageProps> = ({ promos, onBack, onSelectPromo }) => {
  const { currentUser } = useAuth();
  const userName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Jamaah';

  const getPromoColors = (discount: number): { bg: string; text: string; border: string } => {
    if (discount >= 50) {
      return { bg: 'bg-red-500', text: 'text-red-700', border: 'border-red-200' };
    } else if (discount >= 30) {
      return { bg: 'bg-purple-500', text: 'text-purple-700', border: 'border-purple-200' };
    } else if (discount >= 20) {
      return { bg: 'bg-green-500', text: 'text-green-700', border: 'border-green-200' };
    } else if (discount >= 10) {
      return { bg: 'bg-blue-500', text: 'text-blue-700', border: 'border-blue-200' };
    } else {
      return { bg: 'bg-gray-500', text: 'text-gray-700', border: 'border-gray-200' };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Beautiful Header with Background Image */}
      <div className="relative h-52 overflow-hidden">
        {/* Background Image - Mecca at Night */}
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
        <div className="relative z-10 h-full max-w-7xl mx-auto px-6 py-6 flex flex-col justify-between">
          {/* Top: Logo, Welcome Text, and Back Button */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {/* Logo */}
              <img src={sultanahLogo} alt="Sultanah" className="w-12 h-12 object-contain drop-shadow-2xl" />

              {/* Welcome Text */}
              <div>
                <h1 className="text-2xl font-bold text-white drop-shadow-lg">
                  Welcome Detail Promo
                </h1>
                <p className="text-sm text-white/90 mt-0.5 drop-shadow">
                  Halo, {userName}
                </p>
              </div>
            </div>

            {/* Back Button */}
            <Button
              onClick={onBack}
              className="bg-white/95 backdrop-blur-sm hover:bg-white text-gray-900 h-9 px-4 text-sm shadow-lg flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </Button>
          </div>

          {/* Bottom: Promo Count Badge */}
          <div className="bg-white/95 backdrop-blur-sm rounded-lg px-4 py-2 inline-block self-start shadow-md">
            <p className="text-sm font-semibold text-gray-900">
              {promos.length} Promo Tersedia
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {promos.map((promo, index) => {
            // Parse discount from string "15%" to number 15
            const discountNumber = typeof promo.discount === 'string'
              ? parseInt(promo.discount.replace('%', ''))
              : promo.discount;
            const colors = getPromoColors(discountNumber);

            return (
              <motion.div
                key={promo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Header */}
                <div className={`${colors.bg} p-4 flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <Tag className="w-5 h-5 text-white" />
                    <span className="text-white font-bold text-sm">{promo.discount} OFF</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 mb-2">
                    {promo.title}
                  </h3>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {promo.description}
                  </p>

                  {/* Valid Until */}
                  {promo.validUntil && (
                    <div className="flex items-center gap-2 text-xs text-gray-600 mb-4">
                      <Clock className="w-3 h-3" />
                      <span>
                        Berlaku hingga {new Date(promo.validUntil).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  )}

                  {/* Button */}
                  <Button
                    onClick={() => onSelectPromo && onSelectPromo(promo)}
                    className={`w-full ${colors.bg} hover:opacity-90 text-white`}
                  >
                    Lihat Promo
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Empty State */}
        {promos.length === 0 && (
          <div className="text-center py-12">
            <Tag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="font-bold text-gray-900 mb-1">Tidak Ada Promo Tersedia</h3>
            <p className="text-sm text-gray-600">Promo menarik akan segera hadir.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllPromosPage;