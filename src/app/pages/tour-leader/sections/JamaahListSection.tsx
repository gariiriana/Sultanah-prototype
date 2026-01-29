import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Phone,
  Mail,
  MapPin,
  Search,
  Filter,
  Download,
  User,
  AlertCircle,
  CheckCircle,
  X,
  MessageCircle,
  Heart,
  Pill,
  FileText,
  Building,
  Star,
  Package
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { toast } from 'sonner';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../../config/firebase';

interface JamaahMember {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  passportNumber?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  packageName?: string;
  packageId?: string; // ✅ NEW: Package ID
  muthawifName?: string; // ✅ NEW: Muthawif name
  departureDate?: string;
  status: 'pending' | 'confirmed' | 'departed' | 'completed';
  profilePhoto?: string;
  // Medical Information
  medicalConditions?: string;
  medications?: string;
  healthCertificate?: string; // URL to uploaded health certificate
  // Hotel Package Info
  madinahHotel?: {
    name: string;
    stars: number;
  };
  makkahHotel?: {
    name: string;
    stars: number;
  };
  // Facilities
  facilities?: string[];
}

const JamaahListSection: React.FC = () => {
  const [jamaahList, setJamaahList] = useState<JamaahMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'confirmed' | 'departed' | 'completed'>('all');
  const [selectedJamaah, setSelectedJamaah] = useState<JamaahMember | null>(null);

  useEffect(() => {
    fetchJamaahList();
  }, []);

  const fetchJamaahList = async () => {
    try {
      setLoading(true);

      // Step 1: Fetch all approved payments
      const paymentsQuery = query(
        collection(db, 'payments'),
        where('status', '==', 'approved')
      );
      const paymentsSnapshot = await getDocs(paymentsQuery);

      // Step 2: Get unique user IDs from approved payments
      const approvedUserIds = new Set<string>();
      const paymentDataMap = new Map<string, any>();

      paymentsSnapshot.forEach(doc => {
        const payment = doc.data();
        if (payment.userId) {
          approvedUserIds.add(payment.userId);
          // Store payment data for later use (package name, etc.)
          if (!paymentDataMap.has(payment.userId)) {
            paymentDataMap.set(payment.userId, payment);
          }
        }
      });

      if (approvedUserIds.size === 0) {
        setJamaahList([]);
        setLoading(false);
        return;
      }

      // Step 3: Fetch user details for approved jamaah
      const usersQuery = query(
        collection(db, 'users')
      );
      const usersSnapshot = await getDocs(usersQuery);

      const jamaahData: JamaahMember[] = [];

      usersSnapshot.forEach(doc => {
        const userId = doc.id;

        // Only include users who have approved payments
        if (approvedUserIds.has(userId)) {
          const userData = doc.data();
          const paymentData = paymentDataMap.get(userId);

          jamaahData.push({
            id: userId,
            fullName: userData.identityInfo?.fullName || userData.displayName || paymentData?.userName || 'No Name',
            email: userData.email || paymentData?.userEmail || '',
            phone: userData.phoneNumber || '',
            passportNumber: userData.travelDocuments?.passportNumber,
            emergencyContact: userData.emergencyContact,
            packageName: paymentData?.booking || userData.jamaahInfo?.packageName,
            packageId: paymentData?.packageId, // ✅ NEW: Package ID
            muthawifName: paymentData?.muthawifName, // ✅ NEW: Muthawif name
            departureDate: userData.jamaahInfo?.departureDate,
            status: 'confirmed', // Approved payments means confirmed status
            profilePhoto: userData.profilePhoto,
            // Medical Information
            medicalConditions: userData.medicalInfo?.conditions,
            medications: userData.medicalInfo?.medications,
            healthCertificate: userData.medicalInfo?.healthCertificate,
            // Hotel Package Info
            madinahHotel: userData.hotelInfo?.madinah,
            makkahHotel: userData.hotelInfo?.makkah,
            // Facilities
            facilities: userData.facilities,
          });
        }
      });

      setJamaahList(jamaahData);
      console.log('✅ Fetched approved jamaah:', jamaahData.length);
    } catch (error) {
      console.error('Error fetching jamaah list:', error);
      toast.error('Gagal memuat daftar jamaah');
    } finally {
      setLoading(false);
    }
  };

  const filteredJamaah = jamaahList.filter(jamaah => {
    const matchesSearch = jamaah.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      jamaah.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      jamaah.phone.includes(searchQuery);

    const matchesFilter = filterStatus === 'all' || jamaah.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: {
        bg: 'bg-orange-100',
        text: 'text-orange-700',
        dot: 'bg-orange-500'
      },
      confirmed: {
        bg: 'bg-green-100',
        text: 'text-green-700',
        dot: 'bg-green-500'
      },
      departed: {
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        dot: 'bg-blue-500'
      },
      completed: {
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        dot: 'bg-gray-500'
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const handleExportToCSV = () => {
    const csvContent = [
      ['Name', 'Email', 'Phone', 'Passport', 'Package', 'Departure', 'Status'],
      ...filteredJamaah.map(j => [
        j.fullName,
        j.email,
        j.phone,
        j.passportNumber || '-',
        j.packageName || '-',
        j.departureDate || '-',
        j.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jamaah-list-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    toast.success('Daftar jamaah berhasil diekspor!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 text-sm">Memuat daftar jamaah...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Daftar Jamaah</h2>
            <p className="text-gray-500 text-sm">{filteredJamaah.length} jamaah</p>
          </div>
        </div>

        <Button
          onClick={handleExportToCSV}
          className="bg-gradient-to-r from-[#C5A572] to-[#D4AF37] hover:opacity-90 text-white border-0 shadow-md font-medium"
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama, email, atau telepon..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 h-12 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 focus:outline-none transition-all"
          />
        </div>

        {/* Status Filter */}
        <div className="relative md:w-48">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="w-full pl-12 pr-4 h-12 bg-white border border-gray-300 rounded-xl text-gray-900 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 focus:outline-none appearance-none cursor-pointer transition-all"
          >
            <option value="all">Semua Status</option>
            <option value="pending">Menunggu</option>
            <option value="confirmed">Dikonfirmasi</option>
            <option value="departed">Berangkat</option>
            <option value="completed">Selesai</option>
          </select>
        </div>
      </div>

      {/* Jamaah Cards */}
      <div>
        {filteredJamaah.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-900 font-semibold text-lg mb-1">Tidak ada jamaah ditemukan</p>
            <p className="text-sm text-gray-500">Coba sesuaikan pencarian atau filter Anda</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredJamaah.map((jamaah, index) => (
              <motion.div
                key={jamaah.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer group"
                onClick={() => setSelectedJamaah(jamaah)}
              >
                {/* Header - Gradient Background */}
                <div className="bg-gradient-to-r from-[#C5A572] to-[#D4AF37] p-4">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/50 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-lg">
                      {jamaah.profilePhoto ? (
                        <img src={jamaah.profilePhoto} alt={jamaah.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-7 h-7 text-white" />
                      )}
                    </div>

                    {/* Name & Status */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white truncate mb-1.5 text-lg">{jamaah.fullName}</h3>
                      {getStatusBadge(jamaah.status)}
                    </div>
                  </div>
                </div>

                {/* Body - Info Details */}
                <div className="p-4 space-y-3">
                  {/* Email */}
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Mail className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-0.5 font-medium">Email</p>
                      <p className="text-sm text-gray-900 truncate">{jamaah.email}</p>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-0.5 font-medium">Telepon</p>
                      <p className="text-sm text-gray-900">{jamaah.phone || '-'}</p>
                    </div>
                  </div>

                  {/* Package */}
                  {jamaah.packageName && (
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 mb-0.5 font-medium">Paket</p>
                        <p className="text-sm text-gray-900 truncate font-medium">{jamaah.packageName}</p>
                      </div>
                    </div>
                  )}

                  {/* ✅ MUTHAWIF NAME - Enhanced Design */}
                  {jamaah.muthawifName && (
                    <div className="flex items-start gap-2.5 bg-gradient-to-r from-amber-50 to-yellow-50 -mx-4 -mb-4 px-4 py-3 mt-3 border-t-2 border-amber-100">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#C19B2B] flex items-center justify-center flex-shrink-0 shadow-sm">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-amber-700 mb-0.5 font-bold uppercase tracking-wide">Muthawif</p>
                        <p className="text-sm text-amber-900 font-bold truncate">{jamaah.muthawifName}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer - Quick Actions (Only if no Muthawif) */}
                {!jamaah.muthawifName && (
                  <div className="px-4 pb-4 flex gap-2">
                    <a
                      href={`https://wa.me/${jamaah.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 rounded-lg text-sm font-medium transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp
                    </a>
                    <a
                      href={`mailto:${jamaah.email}`}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-lg text-sm font-medium transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Mail className="w-4 h-4" />
                      Email
                    </a>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedJamaah && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedJamaah(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] p-6 relative">
                <button
                  onClick={() => setSelectedJamaah(null)}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/50 flex items-center justify-center overflow-hidden shadow-lg">
                    {selectedJamaah.profilePhoto ? (
                      <img src={selectedJamaah.profilePhoto} alt={selectedJamaah.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-10 h-10 text-white" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">{selectedJamaah.fullName}</h2>
                    {getStatusBadge(selectedJamaah.status)}
                  </div>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Contact Information */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-lg">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Mail className="w-4 h-4 text-blue-600" />
                    </div>
                    Informasi Kontak
                  </h3>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Email</span>
                      <span className="text-sm font-medium text-gray-900">{selectedJamaah.email}</span>
                    </div>
                    <div className="h-px bg-gray-200"></div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Telepon</span>
                      <span className="text-sm font-medium text-gray-900">{selectedJamaah.phone || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Trip Information */}
                {selectedJamaah.packageName && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-lg">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-green-600" />
                      </div>
                      Informasi Perjalanan
                    </h3>
                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Paket</span>
                        <span className="text-sm font-medium text-gray-900">{selectedJamaah.packageName}</span>
                      </div>
                      {selectedJamaah.departureDate && (
                        <>
                          <div className="h-px bg-gray-200"></div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Keberangkatan</span>
                            <span className="text-sm font-medium text-gray-900">
                              {new Date(selectedJamaah.departureDate).toLocaleDateString('id-ID', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        </>
                      )}
                      {selectedJamaah.passportNumber && (
                        <>
                          <div className="h-px bg-gray-200"></div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Paspor</span>
                            <span className="text-sm font-medium text-gray-900">{selectedJamaah.passportNumber}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Emergency Contact */}
                {selectedJamaah.emergencyContact && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-lg">
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      </div>
                      Kontak Darurat
                    </h3>
                    <div className="bg-red-50 rounded-xl p-4 space-y-3 border border-red-100">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Nama</span>
                        <span className="text-sm font-medium text-gray-900">{selectedJamaah.emergencyContact.name}</span>
                      </div>
                      <div className="h-px bg-red-200"></div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Telepon</span>
                        <span className="text-sm font-medium text-gray-900">{selectedJamaah.emergencyContact.phone}</span>
                      </div>
                      <div className="h-px bg-red-200"></div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Hubungan</span>
                        <span className="text-sm font-medium text-gray-900">{selectedJamaah.emergencyContact.relationship}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Medical Information */}
                {(selectedJamaah.medicalConditions || selectedJamaah.medications || selectedJamaah.healthCertificate) && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-lg">
                      <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                        <Heart className="w-4 h-4 text-pink-600" />
                      </div>
                      Informasi Medis
                    </h3>
                    <div className="bg-pink-50 rounded-xl p-4 space-y-3 border border-pink-100">
                      {selectedJamaah.medicalConditions && (
                        <>
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Heart className="w-4 h-4 text-pink-600" />
                              <span className="text-sm font-medium text-gray-700">Kondisi Medis</span>
                            </div>
                            <p className="text-sm text-gray-900 bg-white p-3 rounded-lg">{selectedJamaah.medicalConditions}</p>
                          </div>
                        </>
                      )}
                      {selectedJamaah.medications && (
                        <>
                          {selectedJamaah.medicalConditions && <div className="h-px bg-pink-200"></div>}
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Pill className="w-4 h-4 text-pink-600" />
                              <span className="text-sm font-medium text-gray-700">Obat-obatan</span>
                            </div>
                            <p className="text-sm text-gray-900 bg-white p-3 rounded-lg">{selectedJamaah.medications}</p>
                          </div>
                        </>
                      )}
                      {selectedJamaah.healthCertificate && (
                        <>
                          {(selectedJamaah.medicalConditions || selectedJamaah.medications) && <div className="h-px bg-pink-200"></div>}
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="w-4 h-4 text-pink-600" />
                              <span className="text-sm font-medium text-gray-700">Sertifikat Kesehatan</span>
                            </div>
                            <a
                              href={selectedJamaah.healthCertificate}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-pink-200 rounded-lg text-sm font-medium text-pink-700 transition-colors"
                            >
                              <FileText className="w-4 h-4" />
                              Lihat Sertifikat
                            </a>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Hotel Package Information */}
                {(selectedJamaah.madinahHotel || selectedJamaah.makkahHotel) && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-lg">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Building className="w-4 h-4 text-purple-600" />
                      </div>
                      Paket Hotel
                    </h3>
                    <div className="bg-purple-50 rounded-xl p-4 space-y-3 border border-purple-100">
                      {selectedJamaah.madinahHotel && (
                        <div className="bg-white p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Hotel Madinah</span>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: selectedJamaah.madinahHotel.stars }).map((_, i) => (
                                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-gray-900 font-medium">{selectedJamaah.madinahHotel.name}</p>
                        </div>
                      )}
                      {selectedJamaah.makkahHotel && (
                        <>
                          {selectedJamaah.madinahHotel && <div className="h-px bg-purple-200"></div>}
                          <div className="bg-white p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">Hotel Makkah</span>
                              <div className="flex items-center gap-1">
                                {Array.from({ length: selectedJamaah.makkahHotel.stars }).map((_, i) => (
                                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                ))}
                              </div>
                            </div>
                            <p className="text-sm text-gray-900 font-medium">{selectedJamaah.makkahHotel.name}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Facilities */}
                {selectedJamaah.facilities && selectedJamaah.facilities.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-lg">
                      <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <Package className="w-4 h-4 text-indigo-600" />
                      </div>
                      Fasilitas & Layanan
                    </h3>
                    <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                      <div className="grid grid-cols-2 gap-2">
                        {selectedJamaah.facilities.map((facility, index) => (
                          <div key={index} className="flex items-center gap-2 bg-white p-3 rounded-lg">
                            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <span className="text-sm text-gray-900">{facility}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="flex gap-3 pt-2">
                  <a
                    href={`https://wa.me/${selectedJamaah.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 h-12 bg-gradient-to-r from-green-500 to-green-600 hover:opacity-90 text-white rounded-xl font-medium transition-all shadow-md hover:shadow-lg"
                  >
                    <MessageCircle className="w-5 h-5" />
                    WhatsApp
                  </a>
                  <a
                    href={`mailto:${selectedJamaah.email}`}
                    className="flex-1 flex items-center justify-center gap-2 h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:opacity-90 text-white rounded-xl font-medium transition-all shadow-md hover:shadow-lg"
                  >
                    <Mail className="w-5 h-5" />
                    Kirim Email
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default JamaahListSection;