import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { Package } from '../../../types';
import { ArrowLeft, Star, Clock, Calendar, Users, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '../../components/ui/button';

// ✅ LOGO: Genuine Sultanah Logo
const sultanahLogo = '/images/logo.png';

interface AllPackagesPageProps {
  onBack: () => void;
  onViewPackageDetail: (packageId: string) => void;
}

const AllPackagesPage: React.FC<AllPackagesPageProps> = ({ onBack, onViewPackageDetail }) => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);

      const q = query(
        collection(db, 'packages'),
        where('status', '==', 'active')
      );

      const snapshot = await getDocs(q);
      let packagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      })) as Package[];

      // Client-side sorting
      packagesData = packagesData.sort((a, b) => {
        const aDate = (a.createdAt as any)?.toDate?.() || new Date(a.createdAt);
        const bDate = (b.createdAt as any)?.toDate?.() || new Date(b.createdAt);
        return bDate.getTime() - aDate.getTime();
      });

      setPackages(packagesData);
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat paket...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Beautiful Header with Background Image */}
      <div className="relative h-52 overflow-hidden">
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
        <div className="relative z-10 h-full max-w-7xl mx-auto px-6 py-6 flex flex-col justify-between">
          {/* Top: Logo, Welcome Text, and Back Button */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {/* Logo */}
              <img src={sultanahLogo} alt="Sultanah" className="w-12 h-12 object-contain drop-shadow-2xl" />

              {/* Welcome Text */}
              <div>
                <h1 className="text-2xl font-bold text-white drop-shadow-lg">
                  Paket Umrah Pilihan Kami
                </h1>
                <p className="text-sm text-white/90 mt-0.5 drop-shadow">
                  Halo, Tamu
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

          {/* Bottom: Package Count Badge */}
          <div className="bg-white/95 backdrop-blur-sm rounded-lg px-4 py-2 inline-block self-start shadow-md">
            <p className="text-sm font-semibold text-gray-900">
              {packages.length} Paket Tersedia
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg, index) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Image */}
              {(pkg.image || pkg.photo) && (
                <div className="relative h-48">
                  <img
                    src={pkg.image || pkg.photo}
                    alt={pkg.name}
                    className="w-full h-full object-cover"
                  />

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="px-2 py-1 rounded bg-red-500 text-white text-xs font-bold">
                      POPULER
                    </span>
                  </div>

                  {pkg.type && (
                    <div className="absolute top-3 right-3">
                      <span className="px-3 py-1 rounded bg-[#D4AF37] text-white text-xs font-bold">
                        {pkg.type}
                      </span>
                    </div>
                  )}

                  {/* Rating */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 rounded bg-white shadow-sm">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs font-semibold">{(pkg as any).rating || 4.9}</span>
                    <span className="text-xs text-gray-500">({(pkg as any).reviews || 150})</span>
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="p-4">
                <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">
                  {pkg.name}
                </h3>

                {/* Price */}
                <div className="mb-3 p-3 rounded bg-orange-50">
                  <div className="text-xs text-gray-600 mb-1">Mulai dari</div>
                  <div className="text-xl font-bold text-[#D4AF37]">
                    {formatCurrency(pkg.price)}
                  </div>
                  <div className="text-xs text-gray-500">per orang</div>
                </div>

                {/* Info */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="text-center p-2 rounded bg-gray-50">
                    <Clock className="w-4 h-4 text-gray-600 mx-auto mb-1" />
                    <div className="text-xs font-semibold">{pkg.duration} Hari</div>
                  </div>
                  <div className="text-center p-2 rounded bg-gray-50">
                    <Calendar className="w-4 h-4 text-gray-600 mx-auto mb-1" />
                    <div className="text-xs font-semibold">
                      {pkg.departureDate ? new Date(pkg.departureDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : 'Fleksibel'}
                    </div>
                  </div>
                  <div className="text-center p-2 rounded bg-gray-50">
                    <Users className="w-4 h-4 text-gray-600 mx-auto mb-1" />
                    <div className="text-xs font-semibold">{pkg.availableSlots || 0} Slot</div>
                  </div>
                </div>

                {/* Features */}
                {pkg.features && pkg.features.length > 0 && (
                  <div className="mb-3 pb-3 border-b border-gray-100">
                    <ul className="space-y-1">
                      {pkg.features.slice(0, 3).map((feature: string, i: number) => (
                        <li key={i} className="flex items-start text-xs text-gray-600">
                          <Check className="w-3 h-3 text-green-500 mr-1 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-1">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Button */}
                <Button
                  onClick={() => onViewPackageDetail(pkg.id)}
                  className="w-full bg-[#D4AF37] hover:bg-[#C5A572] text-white"
                >
                  Beli Paket
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {packages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="font-bold text-gray-900 mb-1">Tidak Ada Paket Tersedia</h3>
            <p className="text-sm text-gray-600">Paket umrah akan segera hadir.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllPackagesPage;