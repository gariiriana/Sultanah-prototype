import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Clock, Calendar, Users, Star, MapPin, Plane, Building2, XCircle, FileText, Navigation, Download, CreditCard, CheckCircle2, UserCheck, Award } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { Package } from '../../../types';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'sonner';

interface PackageDetailPageProps {
  packageId: string;
  onBack: () => void;
}

const PackageDetailPage: React.FC<PackageDetailPageProps> = ({ packageId, onBack }) => {
  const { } = useAuth();
  const navigate = useNavigate();
  const [packageData, setPackageData] = useState<Package | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPackageDetail();
  }, [packageId]);

  const fetchPackageDetail = async () => {
    try {
      const docRef = doc(db, 'packages', packageId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as Package;
        setPackageData(data);
      } else {
        toast.error('Package not found');
        onBack();
      }
    } catch (error) {
      console.error('Error fetching package:', error);
      toast.error('Failed to load package details');
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = () => {
    navigate(`/booking/${packageId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading package details...</p>
        </div>
      </div>
    );
  }

  if (!packageData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Package not found</p>
          <Button onClick={onBack} className="mt-4">Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-12">
      {/* Header with Back Button */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 md:py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs md:text-sm text-gray-600 hover:text-[#D4AF37] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
            <span>Kembali ke Paket</span>
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero Image & Title */}
        <div className="relative rounded-xl md:rounded-2xl overflow-hidden mb-6 md:mb-8 shadow-2xl">
          <img
            src={packageData.image || packageData.photo || 'https://via.placeholder.com/1200x400?text=Package+Image'}
            alt={packageData.name}
            className="w-full h-[300px] md:h-[400px] object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>

          {/* Badge & Info Overlay */}
          <div className="absolute top-3 right-3 md:top-4 md:right-4 flex gap-1.5 md:gap-2">
            <Badge className="bg-[#D4AF37] text-white px-2.5 md:px-4 py-0.5 md:py-1 text-[10px] md:text-sm uppercase font-bold">
              {packageData.type}
            </Badge>
            {packageData.packageClass && (
              <Badge variant="secondary" className="bg-white/90 text-gray-800 px-2.5 md:px-4 py-0.5 md:py-1 text-[10px] md:text-sm uppercase font-bold">
                {packageData.packageClass}
              </Badge>
            )}
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 text-white">
            <h1 className="text-2xl md:text-4xl font-black mb-2 md:mb-3 drop-shadow-lg leading-tight">{packageData.name}</h1>
            <div className="flex flex-wrap items-center gap-3 md:gap-4 text-[11px] md:text-sm font-medium">
              <div className="flex items-center gap-1.5 md:gap-2 bg-black/30 backdrop-blur-sm px-2 md:px-0 py-1 md:py-0 rounded-lg md:bg-transparent">
                <Clock className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span>{packageData.duration} Hari</span>
              </div>
              <div className="flex items-center gap-1.5 md:gap-2 bg-black/30 backdrop-blur-sm px-2 md:px-0 py-1 md:py-0 rounded-lg md:bg-transparent">
                <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span>{new Date(packageData.departureDate).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}</span>
              </div>
              <div className="flex items-center gap-1.5 md:gap-2 bg-black/30 backdrop-blur-sm px-2 md:px-0 py-1 md:py-0 rounded-lg md:bg-transparent">
                <Users className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span>{packageData.availableSlots}/{packageData.maxParticipants} <span className="hidden xs:inline">Slot</span></span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card className="border-none md:border md:border-gray-200 shadow-sm md:shadow-md">
              <CardContent className="p-4 md:p-6">
                <h2 className="text-lg md:text-2xl font-bold mb-3 md:mb-4 text-gray-800">Deskripsi Paket</h2>
                <p className="text-gray-600 text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                  {(packageData as any).detailDescription || packageData.description || 'Deskripsi paket tidak tersedia.'}
                </p>
              </CardContent>
            </Card>

            {/* Package Features */}
            {packageData.features && packageData.features.length > 0 && (
              <Card className="border-2 border-[#D4AF37]/30 shadow-md">
                <CardContent className="p-4 md:p-6">
                  <h2 className="text-lg md:text-2xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-[#D4AF37]" />
                    Fasilitas Paket
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                    {packageData.features.map((feature: string, index: number) => (
                      <div key={index} className="flex items-center gap-2.5 p-2.5 md:p-3 bg-gradient-to-r from-green-50 to-transparent rounded-lg border border-green-200/50">
                        <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-green-600 flex-shrink-0" />
                        <span className="text-gray-700 text-[11px] md:text-sm font-medium">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Package Includes */}
            {packageData.includes && packageData.includes.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                    <Star className="w-6 h-6 text-[#D4AF37]" />
                    Paket Termasuk
                  </h2>
                  <ul className="space-y-3">
                    {packageData.includes.map((item: string, index: number) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-[#D4AF37] rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Package Excludes */}
            {packageData.excludes && packageData.excludes.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                    <XCircle className="w-6 h-6 text-red-500" />
                    Tidak Termasuk
                  </h2>
                  <ul className="space-y-3">
                    {packageData.excludes.map((item: string, index: number) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Itinerary */}
            {packageData.itinerary && packageData.itinerary.length > 0 && (
              <Card className="shadow-sm">
                <CardContent className="p-4 md:p-6">
                  <h2 className="text-lg md:text-2xl font-bold mb-4 md:mb-6 text-gray-800 flex items-center gap-2">
                    <MapPin className="w-5 h-5 md:w-6 md:h-6 text-[#D4AF37]" />
                    Itinerary Perjalanan
                  </h2>
                  <div className="space-y-4 md:space-y-6">
                    {packageData.itinerary.map((day: string, index: number) => (
                      <div key={index} className="flex gap-3 md:gap-4 group">
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-[#D4AF37] to-[#FFD700] rounded-full flex items-center justify-center text-white text-xs md:text-base font-bold flex-shrink-0 shadow-md">
                            {index + 1}
                          </div>
                          {index < packageData.itinerary!.length - 1 && (
                            <div className="w-0.5 h-full bg-gradient-to-b from-[#D4AF37] via-[#D4AF37]/30 to-transparent my-1"></div>
                          )}
                        </div>
                        <div className="flex-1 pb-4 md:pb-6 border-b border-gray-100 md:border-none">
                          <h3 className="font-bold text-gray-800 text-sm md:text-base mb-1">Hari {index + 1}</h3>
                          <p className="text-gray-600 text-[11px] md:text-sm leading-relaxed">{day}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Highlights */}
            {packageData.highlight && packageData.highlight.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4 text-gray-800">Highlight Paket</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {packageData.highlight.map((item: string, index: number) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gradient-to-r from-[#D4AF37]/10 to-transparent rounded-lg">
                        <div className="w-8 h-8 bg-[#D4AF37] rounded-full flex items-center justify-center flex-shrink-0">
                          <Star className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-gray-700 text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tour Leader & Muthawif Information */}
            <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white overflow-hidden shadow-lg">
              <div className="bg-purple-600 px-4 md:px-6 py-2.5 md:py-3 flex items-center gap-2">
                <UserCheck className="w-4 h-4 md:w-5 md:h-5 text-white" />
                <h2 className="text-sm md:text-lg font-bold text-white uppercase tracking-tight">Tim Pembimbing Perjalanan</h2>
              </div>
              <CardContent className="p-4 md:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  {/* Tour Leader Card */}
                  <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-white rounded-xl border-2 border-purple-100 shadow-sm hover:border-purple-300 transition-all">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-inner">
                      <UserCheck className="w-6 h-6 md:w-7 md:h-7 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-purple-600 font-bold uppercase tracking-wider">Tour Leader</p>
                      <p className="font-bold text-gray-900 text-sm md:text-lg truncate">
                        {(packageData as any).tourLeaderName && (packageData as any).tourLeaderName.trim() !== ''
                          ? (packageData as any).tourLeaderName
                          : 'Akan Segera Diumumkan'}
                      </p>
                      <p className="text-[9px] md:text-[10px] text-gray-500">Pembimbing Teknis</p>
                    </div>
                  </div>

                  {/* Muthawif Card */}
                  <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-white rounded-xl border-2 border-emerald-100 shadow-sm hover:border-emerald-300 transition-all">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-inner">
                      <Award className="w-6 h-6 md:w-7 md:h-7 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Muthawif</p>
                      <p className="font-bold text-gray-900 text-sm md:text-lg truncate">
                        {(packageData as any).muthawifName && (packageData as any).muthawifName.trim() !== ''
                          ? (packageData as any).muthawifName
                          : 'Akan Segera Diumumkan'}
                      </p>
                      <p className="text-[9px] md:text-[10px] text-gray-500">Pembimbing Ibadah</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 md:mt-6 p-3 md:p-4 bg-gradient-to-r from-purple-50 to-emerald-50 border border-purple-200 rounded-xl flex items-start gap-2.5 md:gap-3">
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Star className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#D4AF37]" />
                  </div>
                  <p className="text-[11px] md:text-xs text-gray-700 leading-relaxed italic md:not-italic">
                    🌟 <strong>Partner Ibadah:</strong> Tim kami memastikan perjalanan ibadah Anda berjalan lancar, nyaman, dan sesuai sunnah.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Package Items (Perlengkapan dalam Paket) */}
            {(packageData as any).packageItems && (packageData as any).packageItems.length > 0 && (
              <Card className="border-2 border-[#D4AF37]/30 bg-gradient-to-br from-[#FFF9F0] to-white shadow-md">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#FFD700] flex items-center justify-center flex-shrink-0">
                      <Star className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg md:text-2xl font-bold text-gray-800">Perlengkapan Paket</h2>
                      <p className="text-[11px] md:text-sm text-gray-600 mt-0.5">Sudah termasuk dalam harga paket</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                    {(packageData as any).packageItems.map((item: any, index: number) => (
                      <div key={index} className="flex items-center gap-3 p-2.5 md:p-3 bg-white rounded-lg border border-[#D4AF37]/20 hover:border-[#D4AF37] transition-all">
                        <div className="w-7 h-7 md:w-8 md:h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-800 text-[11px] md:text-sm truncate">{item.itemName}</p>
                          <p className="text-[10px] md:text-xs text-gray-500">Jumlah: {item.quantity}x</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Hotel & Airlines Info */}
            {(packageData.hotel || packageData.airline) && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4 text-gray-800">Akomodasi & Transportasi</h2>
                  <div className="space-y-4">
                    {packageData.hotel && (
                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                        <Building2 className="w-6 h-6 text-[#D4AF37]" />
                        <div>
                          <p className="text-sm text-gray-500">Hotel</p>
                          <p className="font-semibold text-gray-800">{packageData.hotel}</p>
                        </div>
                      </div>
                    )}
                    {packageData.airline && (
                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                        <Plane className="w-6 h-6 text-[#D4AF37]" />
                        <div>
                          <p className="text-sm text-gray-500">Maskapai</p>
                          <p className="font-semibold text-gray-800">{packageData.airline}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Meeting Point */}
            {packageData.meetingPoint && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                    <Navigation className="w-6 h-6 text-[#D4AF37]" />
                    Titik Keberangkatan
                  </h2>
                  <div className="p-4 bg-gradient-to-r from-[#D4AF37]/10 to-transparent rounded-lg">
                    <p className="text-gray-700 font-medium">{packageData.meetingPoint}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* File Downloads */}
            {((packageData as any).packageFileBase64 || (packageData as any).scheduleFileBase64) && (
              <Card className="border-2 border-[#D4AF37]/30 bg-gradient-to-br from-[#FFF9F0] to-white">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#FFD700] flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">Informasi Lengkap Paket</h2>
                      <p className="text-sm text-gray-600">Klik untuk download file</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(packageData as any).packageFileBase64 && (
                      <a
                        href={(packageData as any).packageFileBase64}
                        download={(packageData as any).packageFileName || 'detail-paket.pdf'}
                        className="group"
                      >
                        <div className="flex items-center gap-3 p-4 bg-white rounded-lg border-2 border-[#D4AF37]/20 hover:border-[#D4AF37] hover:shadow-lg transition-all cursor-pointer">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText className="w-6 h-6 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800 group-hover:text-[#D4AF37] transition-colors">File Detail Paket</p>
                            <p className="text-xs text-gray-500">{(packageData as any).packageFileName || 'Klik untuk download'}</p>
                          </div>
                          <Download className="w-5 h-5 text-[#D4AF37] group-hover:scale-110 transition-transform" />
                        </div>
                      </a>
                    )}
                    {(packageData as any).scheduleFileBase64 && (
                      <a
                        href={(packageData as any).scheduleFileBase64}
                        download={(packageData as any).scheduleFileName || 'jadwal-pemberangkatan.pdf'}
                        className="group"
                      >
                        <div className="flex items-center gap-3 p-4 bg-white rounded-lg border-2 border-[#D4AF37]/20 hover:border-[#D4AF37] hover:shadow-lg transition-all cursor-pointer">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Calendar className="w-6 h-6 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800 group-hover:text-[#D4AF37] transition-colors">File Jadwal Pemberangkatan</p>
                            <p className="text-xs text-gray-500">{(packageData as any).scheduleFileName || 'Klik untuk download'}</p>
                          </div>
                          <Download className="w-5 h-5 text-[#D4AF37] group-hover:scale-110 transition-transform" />
                        </div>
                      </a>
                    )}
                  </div>
                  <div className="mt-4 p-3 bg-gradient-to-br from-yellow-50 to-orange-50/50 border border-yellow-200 rounded-lg flex items-start gap-2">
                    <FileText className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-yellow-700">
                      📄 <strong>Informasi Lengkap:</strong> File-file di atas berisi informasi detail paket dan jadwal perjalanan secara lengkap. Klik untuk download dan melihat.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Terms & Conditions */}
            {packageData.terms && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                    <FileText className="w-6 h-6 text-[#D4AF37]" />
                    Syarat & Ketentuan
                  </h2>
                  <div className="prose max-w-none text-gray-600 whitespace-pre-wrap">
                    {packageData.terms}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Custom Detail Content */}
            {packageData.detailContent && (
              <Card>
                <CardContent className="p-6">
                  <div
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: packageData.detailContent }}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Pricing & CTA (Hidden on Mobile as we have Sticky Bar) */}
          <div className="hidden lg:block lg:col-span-1">
            <Card className="sticky top-24 shadow-xl border-2 border-[#D4AF37]/20">
              <CardContent className="p-6">
                {/* Price */}
                <div className="mb-6">
                  <p className="text-sm text-gray-500 mb-1">Harga Mulai Dari</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold bg-gradient-to-r from-[#D4AF37] to-[#FFD700] bg-clip-text text-transparent">
                      Rp {packageData.price.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">per orang</p>
                </div>

                {/* Quick Info */}
                <div className="space-y-3 mb-6 pb-6 border-b">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Durasi
                    </span>
                    <span className="font-semibold">{packageData.duration} Hari</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Keberangkatan
                    </span>
                    <span className="font-semibold">
                      {new Date(packageData.departureDate).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Slot Tersedia
                    </span>
                    <span className="font-semibold">{packageData.availableSlots}/{packageData.maxParticipants}</span>
                  </div>
                </div>

                {/* CTA Button - Book Now */}
                <Button
                  onClick={handleBookNow}
                  className="w-full bg-gradient-to-r from-[#D4AF37] to-[#FFD700] hover:opacity-90 text-white py-6 text-lg font-semibold shadow-lg"
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  Booking Sekarang
                </Button>
              </CardContent>
            </Card>

            {/* Manual Payment Instructions Removed - Using Booking Flow */}
          </div>
        </div>
      </div>

      {/* ✅ NEW: Sticky Mobile Booking Bar (Psychological Trigger) */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-10px_30px_rgba(0,0,0,0.1)] flex items-center justify-between z-[60] lg:hidden safe-area-bottom"
      >
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Mulai Dari</span>
          <p className="text-xl font-black text-emerald-700 leading-none">
            Rp {packageData.price.toLocaleString()}
          </p>
          <span className="text-[10px] text-gray-400 italic">Per Jamaah</span>
        </div>

        <Button
          onClick={handleBookNow}
          className="bg-gradient-to-r from-[#D4AF37] to-[#FFD700] hover:opacity-90 text-white px-8 py-6 rounded-xl font-bold shadow-lg text-sm"
        >
          Booking Sekarang
        </Button>
      </motion.div>

      {/* Hide Global WhatsApp Button on Mobile for this page */}
      <style>{`
        @media (max-width: 1024px) {
          #whatsapp-floating-button {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PackageDetailPage;