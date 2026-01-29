import React from 'react';
import {
  ArrowLeft,
  Star,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  MapPin,
  Plane,
  FileText,
  MessageCircle,
  XCircle,
  Navigation,
  Download,
  UserCheck,
  Award,
  Building2
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

interface PackageDetailProps {
  packageData: any;
  onBack: () => void;
}

const PackageDetail: React.FC<PackageDetailProps> = ({ packageData, onBack }) => {
  const handleConfirmBooking = () => {
    // Format WhatsApp message with package details
    const message = `Halo, saya tertarik untuk booking paket umroh:\\n\\n` +
      `📦 *${packageData.name}*\\n` +
      `💰 Harga: Rp ${packageData.price?.toLocaleString('id-ID')}\\n` +
      `📅 Keberangkatan: ${packageData.departureDate}\\n` +
      `⏱️ Durasi: ${packageData.duration} Hari\\n\\n` +
      `Mohon informasi lebih lanjut dan cara pembayarannya. Terima kasih!`;

    const whatsappUrl = `https://api.whatsapp.com/send/?phone=6281234700116&text=${encodeURIComponent(message)}&type=phone_number&app_absent=0`;
    window.open(whatsappUrl, '_blank');
  };

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
            <span>Kembali ke Paket</span>
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero Image & Title */}
        <div className="relative rounded-2xl overflow-hidden mb-8 shadow-2xl">
          <img
            src={packageData.image || packageData.photo || 'https://via.placeholder.com/1200x400?text=Package+Image'}
            alt={packageData.name}
            className="w-full h-[400px] object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

          {/* Badge & Info Overlay */}
          <div className="absolute top-4 right-4 flex gap-2">
            <Badge className="bg-[#D4AF37] text-white px-4 py-1 text-sm uppercase">
              {packageData.type}
            </Badge>
            {packageData.packageClass && (
              <Badge className="bg-white/90 text-gray-800 px-4 py-1 text-sm uppercase">
                {packageData.packageClass}
              </Badge>
            )}
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <h1 className="text-4xl font-bold mb-2">{packageData.name}</h1>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{packageData.duration} Hari</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{new Date(packageData.departureDate).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{packageData.availableSlots}/{packageData.maxParticipants} Slot</span>
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
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Deskripsi Paket</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {(packageData as any).detailDescription || packageData.description || 'Deskripsi paket tidak tersedia.'}
                </p>
              </CardContent>
            </Card>

            {/* ✅ Package Features - Basic features list from admin */}
            {packageData.features && packageData.features.length > 0 && (
              <Card className="border-2 border-[#D4AF37]/30">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-[#D4AF37]" />
                    Fasilitas Paket
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {packageData.features.map((feature: string, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-gradient-to-r from-green-50 to-transparent rounded-lg border border-green-200">
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ✅ Package Includes */}
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

            {/* ✅ Package Excludes */}
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

            {/* ✅ Itinerary */}
            {packageData.itinerary && packageData.itinerary.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                    <MapPin className="w-6 h-6 text-[#D4AF37]" />
                    Itinerary Perjalanan
                  </h2>
                  <div className="space-y-4">
                    {packageData.itinerary.map((day: string, index: number) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#D4AF37] to-[#FFD700] rounded-full flex items-center justify-center text-white font-bold">
                            {index + 1}
                          </div>
                          {index < packageData.itinerary!.length - 1 && (
                            <div className="w-0.5 h-full bg-gradient-to-b from-[#D4AF37] to-transparent mt-2"></div>
                          )}
                        </div>
                        <div className="flex-1 pb-6">
                          <h3 className="font-semibold text-gray-800 mb-1">Hari {index + 1}</h3>
                          <p className="text-gray-600 text-sm">{day}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ✅ Highlights */}
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

            {/* ✅ Tour Leader & Muthawif Information */}
            {(((packageData as any).tourLeaderName && (packageData as any).tourLeaderName.trim() !== '') ||
              ((packageData as any).muthawifName && (packageData as any).muthawifName.trim() !== '')) && (
                <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
                  <CardContent className="p-6">
                    <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                      <UserCheck className="w-6 h-6 text-purple-600" />
                      Tim Pembimbing Perjalanan
                    </h2>
                    <div className="space-y-4">
                      {(packageData as any).tourLeaderName && (packageData as any).tourLeaderName.trim() !== '' && (
                        <div className="flex items-center gap-4 p-4 bg-white rounded-lg border-2 border-purple-200 hover:border-purple-400 transition-all">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                            <UserCheck className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-purple-600 font-medium">Tour Leader</p>
                            <p className="font-bold text-gray-800 text-lg">{(packageData as any).tourLeaderName}</p>
                            <p className="text-xs text-gray-500 mt-1">Pembimbing perjalanan berpengalaman</p>
                          </div>
                          <Award className="w-6 h-6 text-purple-400" />
                        </div>
                      )}
                      {(packageData as any).muthawifName && (packageData as any).muthawifName.trim() !== '' && (
                        <div className="flex items-center gap-4 p-4 bg-white rounded-lg border-2 border-emerald-200 hover:border-emerald-400 transition-all">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                            <Award className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-emerald-600 font-medium">Muthawif</p>
                            <p className="font-bold text-gray-800 text-lg">{(packageData as any).muthawifName}</p>
                            <p className="text-xs text-gray-500 mt-1">Pembimbing ibadah di Tanah Suci</p>
                          </div>
                          <Award className="w-6 h-6 text-emerald-400" />
                        </div>
                      )}
                    </div>
                    <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-emerald-50 border border-purple-200 rounded-lg">
                      <p className="text-xs text-gray-700">
                        🌟 <strong>Dipandu oleh profesional:</strong> Perjalanan Anda akan dibimbing oleh tim berpengalaman yang siap membantu Anda di setiap langkah perjalanan ibadah.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

            {/* ✅ Package Items (Perlengkapan dalam Paket) */}
            {(packageData as any).packageItems && (packageData as any).packageItems.length > 0 && (
              <Card className="border-2 border-[#D4AF37]/30 bg-gradient-to-br from-[#FFF9F0] to-white">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#FFD700] flex items-center justify-center">
                      <Star className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">Perlengkapan yang Sudah Termasuk</h2>
                      <p className="text-sm text-gray-600">Item-item ini sudah termasuk dalam harga paket</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(packageData as any).packageItems.map((item: any, index: number) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-[#D4AF37]/20 hover:border-[#D4AF37] transition-all">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Star className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">{item.itemName}</p>
                          <p className="text-xs text-gray-500">Jumlah: {item.quantity}x</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
                    <Star className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-700">
                      💡 <strong>All-in pricing:</strong> Semua perlengkapan di atas sudah termasuk dalam harga paket. Anda tidak perlu membayar tambahan!
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ✅ Hotel & Airlines Info */}
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

            {/* ✅ Meeting Point */}
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

            {/* ✅ File Downloads (Package File & Schedule File) - Base64 */}
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

            {/* ✅ Terms & Conditions */}
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
          </div>

          {/* Sidebar - Pricing & CTA */}
          <div className="lg:col-span-1">
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

                {/* CTA Button - Booking via WhatsApp (No payment info for prospective jamaah) */}
                <Button
                  onClick={handleConfirmBooking}
                  className="w-full bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:opacity-90 text-white py-6 text-lg font-semibold shadow-lg mb-4"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Konsultasi via WhatsApp
                </Button>

                <p className="text-xs text-gray-600 text-center">
                  Hubungi tim kami untuk konsultasi dan informasi lebih lanjut tentang paket ini.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackageDetail;