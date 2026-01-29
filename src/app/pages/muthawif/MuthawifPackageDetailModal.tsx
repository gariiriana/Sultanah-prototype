import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Calendar, 
  Users, 
  MapPin, 
  Clock, 
  DollarSign,
  User,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  FileText,
  UserCheck,
  MessageCircle
} from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { toast } from 'sonner';

interface PackageData {
  id: string;
  name: string;
  type: string;
  departureDate: string;
  returnDate?: string;
  duration: number;
  maxParticipants: number;
  price: number;
  description?: string;
  tourLeaderId?: string; // ✅ NEW: Tour Leader ID
  tourLeaderName?: string;
  image?: string;
  registeredJamaah?: number;
}

interface JamaahData {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  status: string;
  bookingDate: string;
  paymentStatus?: string;
}

// ✅ NEW: Tour Leader Profile Interface
interface TourLeaderProfile {
  fullName: string;
  phoneNumber: string;
  whatsappNumber?: string;
  email: string;
  experience?: string;
  languages?: string;
  totalTrips?: string;
  totalPilgrims?: string;
  bio?: string;
}

interface MuthawifPackageDetailModalProps {
  packageData: PackageData;
  onClose: () => void;
}

const MuthawifPackageDetailModal: React.FC<MuthawifPackageDetailModalProps> = ({ packageData, onClose }) => {
  const [jamaahList, setJamaahList] = useState<JamaahData[]>([]);
  const [tourLeaderProfile, setTourLeaderProfile] = useState<TourLeaderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'jamaah'>('info');

  useEffect(() => {
    fetchJamaahList();
    if (packageData.tourLeaderId) {
      fetchTourLeaderProfile();
    }
  }, [packageData.id]);

  const fetchJamaahList = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching jamaah list for package:', packageData.id);

      let jamaahData: JamaahData[] = [];

      // ✅ METHOD 1: Try bookings collection with status filter
      try {
        console.log('🔍 Modal Method 1: Checking bookings with status filter');
        const bookingsQuery = query(
          collection(db, 'bookings'),
          where('packageId', '==', packageData.id),
          where('status', 'in', ['active', 'confirmed', 'completed'])
        );

        const bookingsSnapshot = await getDocs(bookingsQuery);
        console.log(`✅ Modal Method 1: ${bookingsSnapshot.size} bookings found`);

        jamaahData = bookingsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            userId: data.userId || '',
            userName: data.userName || data.userDisplayName || 'Jamaah',
            userEmail: data.userEmail || '-',
            userPhone: data.userPhone || '-',
            status: data.status || 'active',
            bookingDate: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            paymentStatus: data.paymentStatus || 'pending'
          };
        });
      } catch (error: any) {
        console.error('❌ Modal Method 1 Failed:', error?.code, error?.message);
      }

      // ✅ METHOD 2: Try payments collection (fallback)
      if (jamaahData.length === 0) {
        try {
          console.log('🔍 Modal Method 2: Checking payments collection');
          const paymentsQuery = query(
            collection(db, 'payments'),
            where('packageId', '==', packageData.id),
            where('status', '==', 'approved')
          );

          const paymentsSnapshot = await getDocs(paymentsQuery);
          console.log(`✅ Modal Method 2: ${paymentsSnapshot.size} payments found`);

          jamaahData = paymentsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              userId: data.userId || data.userEmail || '',
              userName: data.userName || data.userDisplayName || data.fullName || 'Jamaah',
              userEmail: data.userEmail || '-',
              userPhone: data.userPhone || data.phoneNumber || '-',
              status: 'confirmed',
              bookingDate: data.createdAt?.toDate?.()?.toISOString() || data.paymentDate || new Date().toISOString(),
              paymentStatus: data.status || 'approved'
            };
          });
        } catch (error: any) {
          console.error('❌ Modal Method 2 Failed:', error?.code, error?.message);
        }
      }

      // ✅ METHOD 3: Try all bookings without status filter
      if (jamaahData.length === 0) {
        try {
          console.log('🔍 Modal Method 3: Checking ALL bookings (no status filter)');
          const allBookingsQuery = query(
            collection(db, 'bookings'),
            where('packageId', '==', packageData.id)
          );

          const allBookingsSnapshot = await getDocs(allBookingsQuery);
          console.log(`✅ Modal Method 3: ${allBookingsSnapshot.size} total bookings found`);

          if (allBookingsSnapshot.size > 0) {
            allBookingsSnapshot.docs.forEach((doc, index) => {
              const data = doc.data();
              console.log(`  📋 Booking ${index + 1} - Status: "${data.status}"`, data);
            });

            // Filter valid statuses
            const validDocs = allBookingsSnapshot.docs.filter(doc => {
              const status = doc.data().status?.toLowerCase();
              return status === 'active' || 
                     status === 'confirmed' || 
                     status === 'completed' ||
                     status === 'approved' ||
                     status === 'paid';
            });

            jamaahData = validDocs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                userId: data.userId || '',
                userName: data.userName || data.userDisplayName || 'Jamaah',
                userEmail: data.userEmail || '-',
                userPhone: data.userPhone || '-',
                status: data.status || 'active',
                bookingDate: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                paymentStatus: data.paymentStatus || 'pending'
              };
            });

            console.log(`✅ Valid bookings: ${jamaahData.length}`);
          }
        } catch (error: any) {
          console.error('❌ Modal Method 3 Failed:', error?.code, error?.message);
        }
      }

      setJamaahList(jamaahData);
      console.log('✅ Jamaah list loaded:', jamaahData.length, 'jamaah');
      console.log('Jamaah data:', jamaahData);

      if (jamaahData.length === 0) {
        console.warn('⚠️ No jamaah data found in any method!');
        console.log('Possible issues:');
        console.log('1. Firestore Rules not deployed');
        console.log('2. Data stored in different field names or collection');
        console.log('3. Status values do not match expected values');
      }
    } catch (error: any) {
      console.error('❌ Error fetching jamaah list:', error);
      toast.error('Gagal memuat daftar jamaah', {
        description: error?.message || 'Terjadi kesalahan saat mengambil data'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTourLeaderProfile = async () => {
    try {
      if (!packageData.tourLeaderId) {
        console.warn('⚠️ No tour leader ID provided!');
        return;
      }

      console.log('🔍 Fetching tour leader profile for ID:', packageData.tourLeaderId);
      
      // ✅ FIXED: Use correct collection name 'tourLeaderProfiles'
      const tourLeaderDocRef = doc(db, 'tourLeaderProfiles', packageData.tourLeaderId);
      const tourLeaderSnapshot = await getDoc(tourLeaderDocRef);

      if (tourLeaderSnapshot.exists()) {
        const data = tourLeaderSnapshot.data();
        const profile: TourLeaderProfile = {
          fullName: data?.fullName || packageData.tourLeaderName || 'Tour Leader',
          phoneNumber: data?.phoneNumber || '-',
          whatsappNumber: data?.whatsappNumber,
          email: data?.email || '-',
          experience: data?.experience,
          languages: data?.languages,
          totalTrips: data?.totalTrips,
          totalPilgrims: data?.totalPilgrims,
          bio: data?.bio
        };
        setTourLeaderProfile(profile);
        console.log('✅ Tour leader profile loaded:', profile);
      } else {
        console.warn('⚠️ Tour leader profile not found! Tour Leader belum lengkapi profil.');
      }
    } catch (error: any) {
      console.error('❌ Error fetching tour leader profile:', error);
      // Don't show error toast, just log it
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
      'active': { label: 'Aktif', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: CheckCircle },
      'confirmed': { label: 'Terkonfirmasi', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
      'completed': { label: 'Selesai', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: CheckCircle },
      'pending': { label: 'Menunggu', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: AlertCircle },
      'cancelled': { label: 'Dibatalkan', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle }
    };

    const config = statusConfig[status] || statusConfig['pending'];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const handleExportJamaah = () => {
    toast.info('Export Data', {
      description: 'Fitur export daftar jamaah akan segera tersedia',
      duration: 3000
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="relative bg-gradient-to-br from-[#1a1a2e] via-[#2d2d44] to-[#16213e] p-6 overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iI0Q0QUYzNyIgc3Ryb2tlLW9wYWNpdHk9Ii4xIi8+PC9nPjwvc3ZnPg==')] opacity-30"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#D4AF37]/20 to-transparent rounded-full blur-3xl"></div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header Content */}
            <div className="relative">
              <div className="flex items-start gap-4">
                {packageData.image && (
                  <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-white/20 shadow-xl flex-shrink-0">
                    <img src={packageData.image} alt={packageData.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="inline-block px-3 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/30 mb-2">
                    <p className="text-xs font-semibold text-[#D4AF37] uppercase">{packageData.type}</p>
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">{packageData.name}</h2>
                  <div className="flex items-center gap-4 text-sm text-gray-300">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#D4AF37]" />
                      <span>{formatDate(packageData.departureDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#D4AF37]" />
                      <span>{packageData.duration} Hari</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#D4AF37]" />
                      <span>{packageData.registeredJamaah || 0} / {packageData.maxParticipants} Jamaah</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            <button
              onClick={() => setActiveTab('info')}
              className={`flex-1 px-6 py-4 font-semibold transition-all ${
                activeTab === 'info'
                  ? 'text-[#D4AF37] border-b-2 border-[#D4AF37] bg-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FileText className="w-4 h-4" />
                Informasi Paket
              </div>
            </button>
            <button
              onClick={() => setActiveTab('jamaah')}
              className={`flex-1 px-6 py-4 font-semibold transition-all ${
                activeTab === 'jamaah'
                  ? 'text-[#D4AF37] border-b-2 border-[#D4AF37] bg-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Users className="w-4 h-4" />
                Daftar Jamaah ({jamaahList.length})
              </div>
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-280px)] p-6">
            {/* Info Tab */}
            {activeTab === 'info' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-blue-600 font-medium mb-1">Jamaah Terdaftar</p>
                          <p className="text-3xl font-bold text-blue-900">{packageData.registeredJamaah || 0}</p>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                          <Users className="w-6 h-6 text-blue-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-green-600 font-medium mb-1">Sisa Kuota</p>
                          <p className="text-3xl font-bold text-green-900">
                            {packageData.maxParticipants - (packageData.registeredJamaah || 0)}
                          </p>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-[#D4AF37]/30 bg-gradient-to-br from-[#D4AF37]/10 to-[#D4AF37]/20">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-[#C19B2B] font-medium mb-1">Kapasitas Total</p>
                          <p className="text-3xl font-bold text-[#D4AF37]">{packageData.maxParticipants}</p>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-[#D4AF37]/20 flex items-center justify-center">
                          <UserCheck className="w-6 h-6 text-[#D4AF37]" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Package Details */}
                <Card className="border-2 border-gray-200">
                  <CardContent className="p-6 space-y-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Detail Paket</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                        <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Tanggal Keberangkatan</p>
                          <p className="font-semibold text-gray-900">{formatDate(packageData.departureDate)}</p>
                        </div>
                      </div>

                      {packageData.returnDate && (
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                          <Calendar className="w-5 h-5 text-purple-600 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Tanggal Kepulangan</p>
                            <p className="font-semibold text-gray-900">{formatDate(packageData.returnDate)}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                        <Clock className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Durasi</p>
                          <p className="font-semibold text-gray-900">{packageData.duration} Hari</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                        <DollarSign className="w-5 h-5 text-[#D4AF37] mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Harga Paket</p>
                          <p className="font-semibold text-gray-900">{formatCurrency(packageData.price)}</p>
                        </div>
                      </div>

                      {packageData.tourLeaderName && (
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 md:col-span-2">
                          <UserCheck className="w-5 h-5 text-indigo-600 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Tour Leader</p>
                            <p className="font-semibold text-gray-900">{packageData.tourLeaderName}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {packageData.description && (
                      <div className="pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-600 mb-2">Deskripsi Paket</p>
                        <p className="text-sm text-gray-700 leading-relaxed">{packageData.description}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Jamaah Tab */}
            {activeTab === 'jamaah' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                {/* Action Bar */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">
                    Daftar Jamaah Terdaftar ({jamaahList.length})
                  </h3>
                  <Button
                    onClick={handleExportJamaah}
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Excel
                  </Button>
                </div>

                {loading ? (
                  <div className="py-12 text-center">
                    <div className="w-12 h-12 border-4 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Memuat daftar jamaah...</p>
                  </div>
                ) : jamaahList.length === 0 ? (
                  <Card className="border-2 border-gray-200">
                    <CardContent className="py-16 text-center">
                      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-gray-400" />
                      </div>
                      <h4 className="text-xl font-bold text-gray-900 mb-2">Belum Ada Jamaah</h4>
                      <p className="text-gray-600">Belum ada jamaah yang terdaftar untuk paket ini</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {jamaahList.map((jamaah, index) => (
                      <motion.div
                        key={jamaah.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className="border-2 border-gray-200 hover:border-[#D4AF37] hover:shadow-lg transition-all">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 flex-1">
                                {/* Avatar */}
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#C19B2B] flex items-center justify-center text-white font-bold">
                                  {jamaah.userName.charAt(0).toUpperCase()}
                                </div>

                                {/* Info */}
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-bold text-gray-900">{jamaah.userName}</h4>
                                    {getStatusBadge(jamaah.status)}
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-gray-600">
                                    <div className="flex items-center gap-1">
                                      <Mail className="w-3 h-3" />
                                      <span>{jamaah.userEmail}</span>
                                    </div>
                                    {jamaah.userPhone && jamaah.userPhone !== '-' && (
                                      <div className="flex items-center gap-1">
                                        <Phone className="w-3 h-3" />
                                        <span>{jamaah.userPhone}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Booking Date */}
                              <div className="text-right">
                                <p className="text-xs text-gray-500 mb-1">Tanggal Booking</p>
                                <p className="text-sm font-semibold text-gray-900">
                                  {formatDate(jamaah.bookingDate)}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <p>Total Jamaah: <span className="font-bold text-gray-900">{jamaahList.length} orang</span></p>
              </div>
              <Button
                onClick={onClose}
                className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6"
              >
                Tutup
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default MuthawifPackageDetailModal;