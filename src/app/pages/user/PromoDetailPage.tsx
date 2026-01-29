import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, MessageCircle, Phone, AlertCircle, Star, XCircle, FileText, Navigation } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { Promo } from '../../../types';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'sonner';

interface PromoDetailPageProps {
  promoId: string;
  onBack: () => void;
}

const PromoDetailPage: React.FC<PromoDetailPageProps> = ({ promoId, onBack }) => {
  const { userProfile } = useAuth();
  const [promoData, setPromoData] = useState<Promo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPromoDetail();
  }, [promoId]);

  const fetchPromoDetail = async () => {
    try {
      const docRef = doc(db, 'promos', promoId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setPromoData({ id: docSnap.id, ...docSnap.data() } as Promo);
      } else {
        toast.error('Promo not found');
        onBack();
      }
    } catch (error) {
      console.error('Error fetching promo:', error);
      toast.error('Failed to load promo details');
    } finally {
      setLoading(false);
    }
  };

  const handleConsultation = async () => {
    if (!userProfile) {
      toast.error('Silakan login terlebih dahulu');
      return;
    }

    // Check profile completion - ALL fields must be filled
    const isProfileComplete =
      userProfile.displayName &&
      userProfile.phoneNumber &&
      (userProfile as any).address &&
      (userProfile as any).ktpBase64 &&
      (userProfile as any).passportBase64 &&
      (userProfile as any).kkBase64;

    if (!isProfileComplete) {
      toast.error(
        'Lengkapi profil Anda terlebih dahulu!',
        {
          description: 'Isi semua data: Nama, Telepon, Alamat, dan upload semua dokumen (KTP, Passport, KK) di menu Profil.',
          duration: 5000,
        }
      );
      return;
    }

    if (!promoData) return;

    try {
      // Get user ID from auth or userProfile
      const userId = userProfile.uid || userProfile.id || 'anonymous';
      const userName = userProfile.displayName || userProfile.email || 'User';
      const userEmail = userProfile.email || '';
      const userPhone = userProfile.phoneNumber || '';

      // Create consultation record
      await addDoc(collection(db, 'consultations'), {
        userId: userId,
        userName: userName,
        userEmail: userEmail,
        userPhone: userPhone,
        type: 'promo',
        itemId: promoData.id,
        itemName: promoData.title,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Redirect to WhatsApp - Use default number
      const phoneNumber = '6281234700116';
      const message = encodeURIComponent(
        `Halo, saya tertarik dengan promo ${promoData.title}.\n\n` +
        `Nama: ${userName}\n` +
        `Email: ${userEmail}\n` +
        `Phone: ${userPhone || '-'}\n\n` +
        `Mohon informasi lebih lanjut. Terima kasih!`
      );

      window.open(`https://api.whatsapp.com/send/?phone=${phoneNumber}&text=${message}&type=phone_number&app_absent=0`, '_blank');
      toast.success('Mengarahkan ke WhatsApp...');
    } catch (error) {
      console.error('Error creating consultation:', error);
      toast.error('Gagal membuat konsultasi');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading promo details...</p>
        </div>
      </div>
    );
  }

  if (!promoData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Promo not found</p>
          <Button onClick={onBack} className="mt-4">Go Back</Button>
        </div>
      </div>
    );
  }

  // Color mapping for promo cards
  const colorClass = {
    blue: 'from-blue-600 via-blue-700 to-blue-800',
    gold: 'from-yellow-500 via-yellow-600 to-yellow-700',
    green: 'from-green-600 via-green-700 to-green-800',
  }[promoData.color || 'blue'];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-12">
      {/* Header with Back Button */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-[#D4AF37] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Kembali ke Promo</span>
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero Section with Discount Badge */}
        <div className="relative rounded-2xl overflow-hidden mb-8 shadow-2xl">
          {promoData.image ? (
            <>
              <img
                src={promoData.image}
                alt={promoData.title}
                className="w-full h-[400px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
            </>
          ) : (
            <div className={`w-full h-[400px] bg-gradient-to-br ${colorClass}`}></div>
          )}

          {/* Discount Badge */}
          <div className="absolute top-8 right-8">
            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-[#D4AF37] to-[#FFD700] rounded-full blur-xl opacity-75 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-red-500 to-red-600 text-white rounded-full px-8 py-6 text-center shadow-2xl">
                <div className="text-5xl font-black leading-none">{promoData.discount}</div>
                <div className="text-xs font-semibold mt-1 uppercase tracking-wider">OFF</div>
              </div>
            </div>
          </div>

          {/* Badge - Featured/Badge Text */}
          {promoData.badge && (
            <div className="absolute top-8 left-8">
              <Badge className="bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-white px-4 py-2 text-sm font-bold uppercase shadow-lg">
                ✨ {promoData.badge}
              </Badge>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <h1 className="text-4xl font-bold mb-2">{promoData.title}</h1>
            <p className="text-lg text-white/90 mb-3">{promoData.description}</p>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Berlaku hingga {promoData.validUntil}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Deskripsi Promo</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {promoData.detailDescription || promoData.description}
                </p>
              </CardContent>
            </Card>

            {/* Promo Includes */}
            {promoData.includes && promoData.includes.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                    <Star className="w-6 h-6 text-[#D4AF37]" />
                    Yang Termasuk dalam Promo
                  </h2>
                  <ul className="space-y-3">
                    {promoData.includes.map((item, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-[#D4AF37] rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Promo Excludes */}
            {promoData.excludes && promoData.excludes.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                    <XCircle className="w-6 h-6 text-red-500" />
                    Tidak Termasuk
                  </h2>
                  <ul className="space-y-3">
                    {promoData.excludes.map((item, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Custom Detail Content (if admin created HTML content) */}
            {promoData.detailContent && (
              <Card>
                <CardContent className="p-6">
                  <div
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: promoData.detailContent }}
                  />
                </CardContent>
              </Card>
            )}

            {/* Meeting Point */}
            {promoData.meetingPoint && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                    <Navigation className="w-6 h-6 text-[#D4AF37]" />
                    Titik Keberangkatan
                  </h2>
                  <div className="p-4 bg-gradient-to-r from-[#D4AF37]/10 to-transparent rounded-lg">
                    <p className="text-gray-700 font-medium">{promoData.meetingPoint}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Terms & Conditions */}
            {promoData.terms && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                    <FileText className="w-6 h-6 text-[#D4AF37]" />
                    Syarat & Ketentuan
                  </h2>
                  <div className="prose max-w-none text-gray-600 whitespace-pre-wrap">
                    {promoData.terms}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Promo Info & CTA */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 shadow-xl border-2 border-[#D4AF37]/20">
              <CardContent className="p-6">
                {/* Discount Display */}
                <div className="mb-6 text-center">
                  <div className="relative inline-block">
                    <div className="absolute -inset-2 bg-gradient-to-r from-[#D4AF37] to-[#FFD700] rounded-full blur opacity-30"></div>
                    <div className="relative bg-gradient-to-br from-red-500 to-red-600 text-white rounded-full px-10 py-8 shadow-xl">
                      <div className="text-6xl font-black leading-none">{promoData.discount}</div>
                      <div className="text-sm font-semibold mt-2 uppercase tracking-wider">DISKON</div>
                    </div>
                  </div>
                </div>

                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{promoData.title}</h3>
                  <p className="text-sm text-gray-600">{promoData.description}</p>
                </div>

                {/* Validity */}
                <div className="space-y-3 mb-6 pb-6 border-b">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Berlaku Hingga
                    </span>
                    <span className="font-semibold">{promoData.validUntil}</span>
                  </div>
                </div>

                {/* Important Notice */}
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-800">
                      Promo terbatas! Hubungi kami segera untuk memanfaatkan penawaran spesial ini sebelum berakhir.
                    </p>
                  </div>
                </div>

                {/* CTA Button - Konsultasi Gratis */}
                <Button
                  onClick={handleConsultation}
                  className="w-full bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:opacity-90 text-white py-6 text-lg font-semibold shadow-lg"
                  disabled={!userProfile}
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Konsultasi Gratis via WhatsApp
                </Button>

                {!userProfile && (
                  <p className="text-xs text-center text-red-500 mt-2">
                    Login diperlukan untuk konsultasi
                  </p>
                )}

                {/* Contact Info */}
                <div className="mt-6 pt-6 border-t">
                  <p className="text-xs text-gray-500 text-center mb-3">
                    Atau hubungi kami langsung:
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
                    <Phone className="w-4 h-4 text-[#D4AF37]" />
                    <span className="font-semibold">+62 812 3456 7890</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromoDetailPage;