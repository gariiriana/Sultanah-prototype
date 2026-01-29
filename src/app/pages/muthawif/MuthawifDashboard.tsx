import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Book, 
  Users, 
  Calendar, 
  Package, 
  UserCheck, 
  ChevronRight,
  MapPin,
  Clock,
  Award,
  LogOut,
  Settings,
  Bell,
  Star,
  TrendingUp
} from 'lucide-react';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';

// ✅ NEW: Import Itinerary Section & Package Detail Modal
import MuthawifItinerarySection from './sections/MuthawifItinerarySection';
import MuthawifPackageDetailModal from './MuthawifPackageDetailModal';

interface PackageData {
  id: string;
  name: string;
  type: string;
  departureDate: string;
  returnDate?: string; // ✅ NEW: For modal
  duration: number;
  maxParticipants: number;
  availableSlots: number;
  price: number; // ✅ NEW: For modal
  description?: string; // ✅ NEW: For modal
  tourLeaderId?: string;
  tourLeaderName?: string;
  muthawifId?: string;
  image?: string;
  registeredJamaah?: number; // ✅ NEW: Actual registered jamaah count from bookings
}

type TabType = 'packages' | 'itinerary'; // ✅ NEW: Tab types

const MuthawifDashboard = () => {
  const { userProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('packages'); // ✅ NEW: Active tab state
  const [selectedPackage, setSelectedPackage] = useState<PackageData | null>(null); // ✅ NEW: Selected package for modal
  const [showPackageDetail, setShowPackageDetail] = useState(false); // ✅ NEW: Show package detail modal
  const [stats, setStats] = useState({
    totalPackages: 0,
    totalJamaah: 0,
    upcomingTrips: 0
  });

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Berhasil logout');
      navigate('/');
    } catch (error) {
      toast.error('Gagal logout');
    }
  };

  useEffect(() => {
    if (userProfile?.uid) {
      fetchMuthawifData();
    }
  }, [userProfile]);

  const fetchMuthawifData = async () => {
    if (!userProfile?.uid) return;

    try {
      setLoading(true);
      console.log('🔍 Fetching Muthawif data for UID:', userProfile.uid);

      // Fetch Muthawif profile
      const profileRef = doc(db, 'muthawifProfiles', userProfile.uid);
      const profileSnap = await getDoc(profileRef);
      if (profileSnap.exists()) {
        setProfileData(profileSnap.data());
        console.log('✅ Muthawif profile loaded:', profileSnap.data());
      } else {
        console.warn('⚠️ No Muthawif profile found');
      }

      // Fetch packages assigned to this muthawif
      const packagesQuery = query(
        collection(db, 'packages'),
        where('muthawifId', '==', userProfile.uid)
      );
      const packagesSnapshot = await getDocs(packagesQuery);
      console.log('📦 Packages found:', packagesSnapshot.size);
      
      // ✅ DIAGNOSTIC MODE: Fetch ALL bookings and payments to analyze structure
      let allBookings: any[] = [];
      let allPayments: any[] = [];
      let hasPermissionError = false;
      
      try {
        console.log('\n🔬 DIAGNOSTIC MODE: Fetching ALL bookings...');
        const allBookingsSnapshot = await getDocs(collection(db, 'bookings'));
        allBookings = allBookingsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log(`📋 Total bookings in database: ${allBookings.length}`);
        
        if (allBookings.length > 0) {
          console.log('📋 Sample booking structure:', allBookings[0]);
          console.log('📋 Available fields in bookings:', Object.keys(allBookings[0]));
        }
      } catch (bookingError: any) {
        console.error('❌ Cannot access bookings collection:', bookingError?.code, bookingError?.message);
        if (bookingError?.code === 'permission-denied') {
          hasPermissionError = true;
          console.error('\n🚨🚨🚨 PERMISSION DENIED ERROR DETECTED! 🚨🚨🚨');
          console.error('Firestore Rules belum di-deploy ke Firebase Console!');
          console.error('\n📋 CARA DEPLOY FIRESTORE RULES:');
          console.error('1. Buka: https://console.firebase.google.com/');
          console.error('2. Pilih project Sultanah');
          console.error('3. Sidebar → Firestore Database');
          console.error('4. Tab "Rules"');
          console.error('5. Copy isi file /firestore.rules');
          console.error('6. Paste ke editor');
          console.error('7. Klik "Publish"');
          console.error('8. Logout & login lagi di dashboard Muthawif');
          
          toast.error('🚨 Firestore Rules Belum Di-Deploy!', {
            description: 'Muthawif tidak bisa akses bookings. Buka Console (F12) untuk instruksi deploy rules!',
            duration: 15000,
          });
        }
      }

      try {
        console.log('\n🔬 DIAGNOSTIC MODE: Fetching ALL payments...');
        const allPaymentsSnapshot = await getDocs(collection(db, 'payments'));
        allPayments = allPaymentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log(`💳 Total payments in database: ${allPayments.length}`);
        
        if (allPayments.length > 0) {
          console.log('💳 Sample payment structure:', allPayments[0]);
          console.log('💳 Available fields in payments:', Object.keys(allPayments[0]));
        }
      } catch (paymentError: any) {
        console.error('❌ Cannot access payments collection:', paymentError?.code, paymentError?.message);
        if (paymentError?.code === 'permission-denied') {
          hasPermissionError = true;
        }
      }

      // ✅ If permission error, show big warning and stop
      if (hasPermissionError) {
        console.error('\n⛔⛔⛔ CRITICAL: Cannot proceed due to permission errors ⛔⛔⛔');
        console.error('Action required: Deploy Firestore Rules to Firebase Console');
        
        toast.error('⛔ Action Required!', {
          description: 'Deploy firestore.rules ke Firebase Console. Lihat Console (F12) untuk panduan lengkap.',
          duration: 20000,
        });
        
        // Still show packages but with 0 jamaah
        const packagesData = packagesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          registeredJamaah: 0
        } as PackageData));
        
        setPackages(packagesData);
        setLoading(false);
        return; // Stop processing
      }

      // ✅ ENHANCED: Multi-source jamaah counting with auto field detection
      const packagesData = await Promise.all(
        packagesSnapshot.docs.map(async (packageDoc) => {
          const packageData = {
            id: packageDoc.id,
            ...packageDoc.data()
          } as PackageData;

          console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
          console.log(`📦 Processing package: ${packageDoc.id}`);
          console.log('Package name:', packageData.name);

          let jamaahCount = 0;
          const packageId = packageDoc.id;

          // ✅ AUTO-DETECT: Try all possible field name variations
          const possiblePackageIdFields = [
            'packageId',
            'package_id', 
            'packageID',
            'package',
            'paketId',
            'paket_id',
            'tourPackageId',
            'tour_package_id'
          ];

          const possibleStatusFields = [
            'status',
            'paymentStatus',
            'bookingStatus',
            'state',
            'statusPayment'
          ];

          const validStatuses = [
            'active', 'confirmed', 'completed', 
            'approved', 'paid', 'success', 
            'verified', 'done'
          ];

          // Method: Try bookings with auto field detection
          console.log('\n🔍 SMART SEARCH: Analyzing bookings...');
          const matchingBookings = allBookings.filter(booking => {
            // Try all possible package ID field names
            for (const field of possiblePackageIdFields) {
              if (booking[field] === packageId) {
                console.log(`  ✅ Found match using field "${field}"`);
                console.log(`  📋 Booking data:`, booking);
                
                // Check status
                let hasValidStatus = false;
                for (const statusField of possibleStatusFields) {
                  const status = booking[statusField]?.toLowerCase?.();
                  if (status && validStatuses.includes(status)) {
                    hasValidStatus = true;
                    console.log(`  ✅ Valid status: "${booking[statusField]}" in field "${statusField}"`);
                    break;
                  }
                }
                
                if (!hasValidStatus) {
                  console.log(`  ⚠️ Status check: no status field or invalid status`, booking);
                }
                
                return true; // Include regardless of status for now
              }
            }
            return false;
          });

          console.log(`📋 Matching bookings found: ${matchingBookings.length}`);
          jamaahCount = matchingBookings.length;

          // Method: Try payments with auto field detection
          if (jamaahCount === 0) {
            console.log('\n🔍 SMART SEARCH: Analyzing payments...');
            const matchingPayments = allPayments.filter(payment => {
              // Try all possible package ID field names
              for (const field of possiblePackageIdFields) {
                if (payment[field] === packageId) {
                  console.log(`  ✅ Found match using field "${field}"`);
                  console.log(`  💳 Payment data:`, payment);
                  
                  // Check status
                  let hasValidStatus = false;
                  for (const statusField of possibleStatusFields) {
                    const status = payment[statusField]?.toLowerCase?.();
                    if (status && validStatuses.includes(status)) {
                      hasValidStatus = true;
                      console.log(`  ✅ Valid status: "${payment[statusField]}" in field "${statusField}"`);
                      break;
                    }
                  }
                  
                  if (!hasValidStatus) {
                    console.log(`  ⚠️ Status check: no status field or invalid status`, payment);
                  }
                  
                  return true;
                }
              }
              return false;
            });

            console.log(`💳 Matching payments found: ${matchingPayments.length}`);
            jamaahCount = matchingPayments.length;
          }

          // Method: Try users collection (jamaah with this package)
          if (jamaahCount === 0) {
            try {
              console.log('\n🔍 SMART SEARCH: Checking users collection...');
              const usersSnapshot = await getDocs(collection(db, 'users'));
              const jamaahUsers = usersSnapshot.docs.filter(userDoc => {
                const userData = userDoc.data();
                // Check if user has this package assigned
                return userData.packageId === packageId || 
                       userData.assignedPackageId === packageId ||
                       userData.package === packageId;
              });
              
              console.log(`👥 Users with this package: ${jamaahUsers.length}`);
              if (jamaahUsers.length > 0) {
                jamaahUsers.forEach((userDoc, i) => {
                  console.log(`  👤 User ${i + 1}:`, userDoc.data());
                });
              }
              jamaahCount = jamaahUsers.length;
            } catch (userError: any) {
              console.error('❌ Error checking users:', userError?.code);
            }
          }

          // ✅ Final count assignment
          packageData.registeredJamaah = jamaahCount;

          console.log(`\n✅ FINAL COUNT for package "${packageData.name}": ${jamaahCount} jamaah`);
          console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

          // Show detailed diagnostics if still zero
          if (jamaahCount === 0) {
            console.warn('\n⚠️⚠️⚠️ NO JAMAAH FOUND - DIAGNOSTIC REPORT ⚠️⚠️⚠️');
            console.log(`Package ID: ${packageId}`);
            console.log(`Package Name: ${packageData.name}`);
            console.log(`\nTotal bookings checked: ${allBookings.length}`);
            console.log(`Total payments checked: ${allPayments.length}`);
            console.log(`\nPossible issues:`);
            console.log(`1. No data exists for this package`);
            console.log(`2. Data uses different package ID value`);
            console.log(`3. Data stored in different collection`);
            console.log(`\nAction required:`);
            console.log(`→ Check Firebase Console → Firestore`);
            console.log(`→ Look for documents with packageId/package_id field`);
            console.log(`→ Verify the package ID matches: "${packageId}"`);
            
            toast.warning('⚠️ Tidak Ada Data Jamaah', {
              description: `Package "${packageData.name}" belum memiliki jamaah terdaftar. Check Console (F12) untuk detail.`,
              duration: 8000,
            });
          }

          return packageData;
        })
      );

      setPackages(packagesData);
      console.log('\n✅ All packages processed:', packagesData);

      // ✅ Calculate stats
      const totalJamaah = packagesData.reduce((sum, pkg) => {
        return sum + (pkg.registeredJamaah || 0);
      }, 0);

      const now = new Date();
      const upcomingTrips = packagesData.filter(pkg => {
        const departureDate = new Date(pkg.departureDate);
        return departureDate > now;
      }).length;

      setStats({
        totalPackages: packagesData.length,
        totalJamaah,
        upcomingTrips
      });

      console.log('\n📊 FINAL STATS:', { 
        totalPackages: packagesData.length, 
        totalJamaah, 
        upcomingTrips 
      });

      // Show summary
      if (totalJamaah === 0 && packagesData.length > 0) {
        console.log('\n📋 DATABASE SUMMARY:');
        console.log(`Total packages assigned to you: ${packagesData.length}`);
        console.log(`Total bookings in database: ${allBookings.length}`);
        console.log(`Total payments in database: ${allPayments.length}`);
        console.log(`\nTo fix: Ensure jamaah data has correct packageId field matching your package IDs`);
      }

    } catch (error: any) {
      console.error('\n❌ CRITICAL ERROR fetching muthawif data:', error);
      console.error('Error code:', error?.code);
      console.error('Error message:', error?.message);
      
      // Show user-friendly error
      if (error?.code === 'permission-denied') {
        toast.error('⚠️ Akses Ditolak!', {
          description: 'Firestore rules belum di-deploy. Deploy file /firestore.rules ke Firebase Console.',
          duration: 10000,
        });
      } else {
        toast.error('❌ Error Memuat Data', {
          description: error?.message || 'Terjadi kesalahan. Buka Console untuk detail.',
          duration: 8000,
        });
      }
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-[#D4AF37]/5 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-[#D4AF37]/5">
      {/* Premium Header with Background Image */}
      <div className="relative bg-gradient-to-br from-[#1a1a2e] via-[#2d2d44] to-[#16213e] overflow-hidden">
        {/* Background Image - Kaaba */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1720549973451-018d3623b55a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrYWabiSUyMG1lY2NhJTIwc2F1ZGklMjBhcmFiaWF8ZW58MXx8fHwxNzY3MjU4NjU5fDA&ixlib=rb-4.1.0&q=80&w=1080')`
          }}
        ></div>
        
        {/* Overlay Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e]/95 via-[#2d2d44]/90 to-[#16213e]/95"></div>
        
        {/* Decorative Elements */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iI0Q0QUYzNyIgc3Ryb2tlLW9wYWNpdHk9Ii4xIi8+PC9nPjwvc3ZnPg==')] opacity-30"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-[#D4AF37]/10 to-transparent rounded-full blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Top Bar with Actions */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#C19B2B] flex items-center justify-center shadow-lg shadow-[#D4AF37]/20">
                <Book className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">Dashboard Muthawif</h1>
                  <div className="px-3 py-1 rounded-full bg-gradient-to-r from-[#D4AF37]/20 to-[#C19B2B]/20 border border-[#D4AF37]/30">
                    <p className="text-xs font-semibold text-[#D4AF37]">MUTHAWIF</p>
                  </div>
                </div>
                <p className="text-sm text-gray-300 mt-1">
                  Selamat datang, <span className="font-semibold text-[#D4AF37]">{profileData?.fullName || userProfile?.displayName || 'Muthawif'}</span>
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Button
                onClick={() => navigate('/muthawif-profile')}
                className="hidden sm:flex bg-white/10 backdrop-blur-sm border border-[#D4AF37]/50 text-white hover:bg-[#D4AF37] hover:border-[#D4AF37] transition-all shadow-lg"
              >
                <UserCheck className="w-4 h-4 mr-2" />
                Lengkapi Profil
              </Button>
              
              <Button
                onClick={() => setShowLogoutConfirm(true)}
                className="bg-white/10 backdrop-blur-sm border border-red-400/50 text-white hover:bg-red-500 hover:border-red-500 transition-all shadow-lg"
              >
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>

          {/* Profile Quick Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Paket</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.totalPackages}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center">
                  <Package className="w-6 h-6 text-blue-400" />
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1 text-xs text-blue-400">
                <TrendingUp className="w-3 h-3" />
                <span>Paket yang dibimbing</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Jamaah</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.totalJamaah}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-400" />
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1 text-xs text-green-400">
                <TrendingUp className="w-3 h-3" />
                <span>Jamaah terdaftar</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Keberangkatan</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.upcomingTrips}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#D4AF37]/20 to-[#C19B2B]/20 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-[#D4AF37]" />
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1 text-xs text-[#D4AF37]">
                <TrendingUp className="w-3 h-3" />
                <span>Jadwal mendatang</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Info */}
        {profileData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <Card className="border-2 border-[#D4AF37]/20 bg-gradient-to-br from-white to-[#D4AF37]/5 shadow-lg">
              <CardHeader className="border-b border-[#D4AF37]/10">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#C19B2B] flex items-center justify-center shadow-md">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-[#D4AF37] to-[#C19B2B] bg-clip-text text-transparent">
                    Informasi Profesional Muthawif
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="w-4 h-4 text-blue-600" />
                      <p className="text-sm font-medium text-blue-900">Sertifikat</p>
                    </div>
                    <p className="font-bold text-blue-900">{profileData.certificateNumber || '-'}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="w-4 h-4 text-purple-600" />
                      <p className="text-sm font-medium text-purple-900">Spesialisasi</p>
                    </div>
                    <p className="font-bold text-purple-900">{profileData.specialization || '-'}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-green-600" />
                      <p className="text-sm font-medium text-green-900">Pengalaman</p>
                    </div>
                    <p className="font-bold text-green-900">{profileData.experience ? `${profileData.experience} tahun` : '-'}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200/50">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-amber-600" />
                      <p className="text-sm font-medium text-amber-900">Bahasa</p>
                    </div>
                    <p className="font-bold text-amber-900">{profileData.languages || '-'}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-[#D4AF37]/10 to-[#D4AF37]/20 border border-[#D4AF37]/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-[#D4AF37]" />
                      <p className="text-sm font-medium text-gray-900">Total Jamaah</p>
                    </div>
                    <p className="font-bold text-[#D4AF37]">{profileData.totalPilgrims ? Number(profileData.totalPilgrims).toLocaleString('id-ID') : '-'}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-200/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Book className="w-4 h-4 text-indigo-600" />
                      <p className="text-sm font-medium text-indigo-900">Pendidikan</p>
                    </div>
                    <p className="font-bold text-indigo-900">{profileData.education || '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setActiveTab('packages')}
              className={`flex-1 py-2 px-4 rounded-lg ${activeTab === 'packages' ? 'bg-[#D4AF37] text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Paket Umrah
            </Button>
            <Button
              onClick={() => setActiveTab('itinerary')}
              className={`flex-1 py-2 px-4 rounded-lg ${activeTab === 'itinerary' ? 'bg-[#D4AF37] text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Itinerari
            </Button>
          </div>
        </div>

        {/* Packages List */}
        {activeTab === 'packages' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Paket Umrah yang Saya Bimbing</h2>

            {packages.length === 0 ? (
              <Card className="border-2 border-[#D4AF37]/20 bg-gradient-to-br from-white to-[#D4AF37]/5 shadow-lg">
                <CardContent className="py-16 text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-6">
                    <Package className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Belum Ada Paket</h3>
                  <p className="text-gray-600 max-w-md mx-auto mb-6">
                    Anda belum ditugaskan untuk membimbing paket apapun. Silakan hubungi admin untuk informasi lebih lanjut.
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 border border-blue-200">
                    <Bell className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-900">Admin akan menugaskan paket kepada Anda</span>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {packages.map((pkg, index) => (
                  <motion.div
                    key={pkg.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <Card className="group border-2 border-gray-200 hover:border-[#D4AF37] hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden bg-white">
                      {/* Package Image */}
                      {pkg.image && (
                        <div className="relative w-full h-56 overflow-hidden">
                          <img 
                            src={pkg.image} 
                            alt={pkg.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                          <div className="absolute top-4 right-4">
                            <div className="px-4 py-2 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#C19B2B] shadow-lg">
                              <p className="text-sm font-bold text-white">{pkg.duration} Hari</p>
                            </div>
                          </div>
                          <div className="absolute bottom-4 left-4 right-4">
                            <h3 className="text-2xl font-bold text-white mb-1 drop-shadow-lg">{pkg.name}</h3>
                            <p className="text-sm text-white/90 uppercase tracking-wide">{pkg.type}</p>
                          </div>
                        </div>
                      )}
                      
                      <CardContent className="p-6">
                        {!pkg.image && (
                          <div className="mb-4">
                            <h3 className="text-2xl font-bold text-gray-900 mb-1">{pkg.name}</h3>
                            <p className="text-sm text-gray-600 uppercase tracking-wide">{pkg.type}</p>
                          </div>
                        )}

                        <div className="space-y-3 mb-6">
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <Calendar className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-xs text-blue-600 font-medium">Keberangkatan</p>
                              <p className="text-sm font-bold text-blue-900">{formatDate(pkg.departureDate)}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-100">
                            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                              <Users className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                              <p className="text-xs text-green-600 font-medium">Jamaah Terdaftar</p>
                              <p className="text-sm font-bold text-green-900">
                                {pkg.registeredJamaah || 0} / {pkg.maxParticipants} Orang
                              </p>
                            </div>
                          </div>

                          {/* Tour Leader */}
                          {pkg.tourLeaderName && (
                            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                <UserCheck className="w-4 h-4 text-purple-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-purple-600 font-medium">Tour Leader</p>
                                <p className="text-sm font-bold text-purple-900 truncate">{pkg.tourLeaderName}</p>
                              </div>
                              {/* ✅ NEW: Detail Info Button */}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedPackage(pkg);
                                  setShowPackageDetail(true);
                                }}
                                className="flex-shrink-0 h-8 px-3 text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 border border-purple-200"
                              >
                                <UserCheck className="w-3.5 h-3.5 mr-1.5" />
                                Detail Info
                              </Button>
                            </div>
                          )}
                        </div>

                        <Button
                          onClick={() => {
                            setSelectedPackage(pkg);
                            setShowPackageDetail(true);
                          }}
                          className="w-full bg-gradient-to-r from-[#D4AF37] to-[#C19B2B] hover:from-[#C19B2B] hover:to-[#D4AF37] text-white shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105"
                        >
                          Lihat Detail Paket
                          <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Itinerary Section */}
        {activeTab === 'itinerary' && (
          <MuthawifItinerarySection />
        )}
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            {/* Header with Gradient */}
            <div className="relative bg-gradient-to-r from-[#1a1a2e] via-[#2d2d44] to-[#16213e] p-6 overflow-hidden">
              {/* Background Elements */}
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iI0Q0QUYzNyIgc3Ryb2tlLW9wYWNpdHk9Ii4xIi8+PC9nPjwvc3ZnPg==')] opacity-30"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#D4AF37]/20 to-transparent rounded-full blur-2xl"></div>
              
              {/* Icon */}
              <div className="relative flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/30">
                  <LogOut className="w-8 h-8 text-white" />
                </div>
              </div>
              
              {/* Title */}
              <h3 className="relative text-2xl font-bold text-white text-center mb-2">
                Konfirmasi Logout
              </h3>
              <p className="relative text-sm text-gray-300 text-center">
                Apakah Anda yakin ingin keluar dari dashboard?
              </p>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200/50 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bell className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-amber-900 mb-1">Pastikan semua pekerjaan tersimpan</p>
                    <p className="text-xs text-amber-700">
                      Anda akan keluar dari sesi ini dan harus login kembali untuk mengakses dashboard.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all shadow-md"
                >
                  Batal
                </Button>
                <Button
                  onClick={handleLogout}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white transition-all shadow-lg hover:shadow-xl"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Ya, Logout
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Package Detail Modal */}
      {showPackageDetail && selectedPackage && (
        <MuthawifPackageDetailModal
          packageData={selectedPackage}
          onClose={() => setShowPackageDetail(false)}
        />
      )}
    </div>
  );
};

export default MuthawifDashboard;