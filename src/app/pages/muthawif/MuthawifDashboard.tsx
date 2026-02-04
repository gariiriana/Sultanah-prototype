import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import FloatingAnnouncementWidget from '../../components/FloatingAnnouncementWidget';
import {
  Users,
  User,
  Calendar,
  Package,
  ChevronRight,
  MapPin,
  Clock,
  Award,
  LogOut,
  Sparkles,
  Menu,
  X,
  UserCheck
} from 'lucide-react';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';

import MuthawifItinerarySection from './sections/MuthawifItinerarySection';
import MuthawifPackageDetailModal from './MuthawifPackageDetailModal';

const sultanahLogo = '/images/logo.png';

interface PackageData {
  id: string;
  name: string;
  type: string;
  departureDate: string;
  returnDate?: string;
  duration: number;
  maxParticipants: number;
  availableSlots: number;
  price: number;
  description?: string;
  tourLeaderId?: string;
  tourLeaderName?: string;
  muthawifId?: string;
  image?: string;
  registeredJamaah?: number;
}

type TabType = 'packages' | 'itinerary';

const MuthawifDashboard = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabType>('packages');
  const [selectedPackage, setSelectedPackage] = useState<PackageData | null>(null);
  const [showPackageDetail, setShowPackageDetail] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    totalPackages: 0,
    totalJamaah: 0,
    upcomingTrips: 0
  });

  useEffect(() => {
    if (userProfile?.uid) {
      fetchData();
    }
  }, [userProfile]);

  const fetchData = async () => {
    if (!userProfile?.uid) return;

    try {
      setLoading(true);

      // Fetch Muthawif Specific Profile Data
      const profileRef = doc(db, 'muthawifProfiles', userProfile.uid);
      const profileSnap = await getDoc(profileRef);
      if (profileSnap.exists()) {
        setProfileData(profileSnap.data());
      }

      // Fetch Assigned Packages
      const packagesRef = collection(db, 'packages');
      const q = query(packagesRef, where('muthawifId', '==', userProfile.uid));
      const querySnapshot = await getDocs(q);

      const fetchedPackages: PackageData[] = [];
      let totalJamaahCount = 0;
      let upcoming = 0;
      const now = new Date();

      querySnapshot.forEach((doc) => {
        const data = doc.data() as PackageData;
        const pkg = { ...data, id: doc.id };
        fetchedPackages.push(pkg);

        totalJamaahCount += (pkg.registeredJamaah || 0);

        if (pkg.departureDate) {
          const depDate = new Date(pkg.departureDate);
          if (depDate > now) upcoming++;
        }
      });

      setPackages(fetchedPackages);
      setStats({
        totalPackages: fetchedPackages.length,
        totalJamaah: totalJamaahCount,
        upcomingTrips: upcoming
      });

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Gagal memuat data dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const tabs = [
    { id: 'packages' as TabType, label: 'Paket Umrah', icon: Package },
    { id: 'itinerary' as TabType, label: 'Jadwal', icon: MapPin },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-[#D4AF37]/5 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Bismillah, Memuat Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50/50 pb-20">
        {/* Modern Glassmorphism Hero Header */}
        <div className="relative h-[280px] sm:h-[350px] overflow-hidden">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?q=80&w=2070&auto=format&fit=crop"
              alt="Makkah"
              className="w-full h-full object-cover scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e]/95 via-[#2d2d44]/85 to-[#D4AF37]/30 backdrop-blur-[2px]"></div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
            {/* Header Top Bar */}
            <div className="flex items-center justify-between mb-8 sm:mb-12">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3"
              >
                <div className="bg-white/10 backdrop-blur-sm p-2 rounded-xl border border-white/20 shadow-lg">
                  <img
                    src={sultanahLogo}
                    alt="Sultanah"
                    className="w-12 h-12 object-contain"
                  />
                </div>
                <div>
                  <h2 className="text-white font-bold text-xl tracking-wide">SULTANAH</h2>
                  <p className="text-emerald-100 text-xs">Umrah & Halal Travel</p>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 sm:gap-3">
                <Button
                  onClick={() => navigate('/muthawif-profile')}
                  className="hidden sm:flex bg-white/15 hover:bg-white/25 border border-white/30 text-white font-medium px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm rounded-xl transition-all backdrop-blur-md shadow-lg hover:shadow-xl items-center"
                >
                  <User className="w-4 h-4 mr-2" />
                  <span>Profil Saya</span>
                </Button>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="sm:hidden p-2 bg-white/10 backdrop-blur-md rounded-xl text-white border border-white/20"
                >
                  <Menu className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Hero Content - Welcome Message */}
            <div className="space-y-1.5 sm:space-y-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-1.5 sm:gap-2 bg-white/10 backdrop-blur-sm px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-full border border-white/20"
              >
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#F4D03F] rounded-full animate-pulse"></div>
                <span className="text-amber-100 text-xs sm:text-sm font-medium">Muthawif Dashboard</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl sm:text-3xl md:text-4xl font-bold text-white flex items-center gap-2 sm:gap-3"
              >
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-[#F4D03F]" />
                <span className="leading-tight">Assalamu'alaikum, {profileData?.fullName || userProfile?.displayName || 'Muthawif'}</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xs sm:text-sm md:text-base text-amber-100/90"
              >
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </motion.p>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-0 sm:-mt-12 relative z-10">
          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-2 sm:gap-6 mb-4 sm:mb-8">
            {/* Total Packages */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -5 }}
              className="bg-white/90 backdrop-blur-xl rounded-xl sm:rounded-2xl p-2 sm:p-4 shadow-lg border border-white/50"
            >
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-[#D4AF37] to-[#C19B2B] rounded-lg flex items-center justify-center mb-1.5 sm:mb-3 shadow-lg">
                <Package className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <p className="text-[9px] sm:text-xs text-gray-600 font-semibold mb-0.5 tracking-wide">Total Paket</p>
              <p className="text-xl sm:text-3xl font-black text-gray-900">{stats.totalPackages}</p>
            </motion.div>

            {/* Total Jamaah */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-white/90 backdrop-blur-xl rounded-xl sm:rounded-2xl p-2 sm:p-4 shadow-lg border border-white/50"
            >
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mb-1.5 sm:mb-3 shadow-lg">
                <Users className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <p className="text-[9px] sm:text-xs text-gray-600 font-semibold mb-0.5 tracking-wide">Total Jamaah</p>
              <p className="text-xl sm:text-3xl font-black text-gray-900">{stats.totalJamaah}</p>
            </motion.div>

            {/* Upcoming Trips */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ y: -5 }}
              className="bg-white/90 backdrop-blur-xl rounded-xl sm:rounded-2xl p-2 sm:p-4 shadow-lg border border-white/50"
            >
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center mb-1.5 sm:mb-3 shadow-lg">
                <Calendar className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <p className="text-[9px] sm:text-xs text-gray-600 font-semibold mb-0.5 tracking-wide">Jadwal Mendatang</p>
              <p className="text-xl sm:text-3xl font-black text-gray-900">{stats.upcomingTrips}</p>
            </motion.div>
          </div>

          {/* Desktop Tab Navigation */}
          <div className="hidden sm:block bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg p-2 mb-8 border border-white/60">
            <div className="flex items-center justify-center gap-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex items-center gap-2.5 px-6 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${isActive ? 'text-white shadow-xl' : 'text-gray-500 hover:text-[#D4AF37]'
                      }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-gradient-to-r from-[#D4AF37] to-[#C19B2B] rounded-2xl"
                      />
                    )}
                    <Icon className="w-5 h-5 relative z-10" />
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-8"
          >
            {activeTab === 'packages' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Package className="w-6 h-6 text-[#D4AF37]" />
                  Paket Umrah yang Saya Bimbing
                </h2>

                {packages.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Package className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mt-4">Belum Ada Paket</h3>
                    <p className="text-gray-500 mt-2">Anda belum ditugaskan untuk membimbing paket apapun.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {packages.map((pkg) => (
                      <Card key={pkg.id} className="group overflow-hidden border-2 border-gray-100 hover:border-[#D4AF37] transition-all duration-300">
                        <div className="relative h-48 overflow-hidden">
                          <img
                            src={pkg.image || "https://images.unsplash.com/photo-1542452582-84950e181533?q=80&w=2070&auto=format&fit=crop"}
                            alt={pkg.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-xs font-bold">
                            {pkg.duration} Hari
                          </div>
                        </div>
                        <CardContent className="p-6">
                          <h3 className="text-xl font-bold text-gray-900 mb-4">{pkg.name}</h3>
                          <div className="space-y-3 mb-6">
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                              <Calendar className="w-4 h-4 text-[#D4AF37]" />
                              <span>{formatDate(pkg.departureDate)}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                              <Users className="w-4 h-4 text-[#D4AF37]" />
                              <span>{pkg.registeredJamaah || 0} / {pkg.maxParticipants} Jamaah</span>
                            </div>
                          </div>
                          <Button
                            onClick={() => {
                              setSelectedPackage(pkg);
                              setShowPackageDetail(true);
                            }}
                            className="w-full bg-[#D4AF37] hover:bg-[#C19B2B] text-white"
                          >
                            Detail Paket
                            <ChevronRight className="w-4 h-4 ml-2" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'itinerary' && <MuthawifItinerarySection />}
          </motion.div>
        </div>

        {/* Mobile Sidebar */}
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] sm:hidden"
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                className="fixed right-0 top-0 bottom-0 w-[280px] bg-white z-[101] shadow-2xl sm:hidden p-6"
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <img src={sultanahLogo} alt="Logo" className="w-10 h-10 object-contain" />
                    <span className="font-bold text-[#D4AF37]">SULTANAH</span>
                  </div>
                  <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-gray-500">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setIsSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all ${activeTab === tab.id ? 'bg-[#D4AF37] text-white shadow-lg' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                      <tab.icon className="w-5 h-5" />
                      {tab.label}
                    </button>
                  ))}
                  <div className="h-px bg-gray-100 my-4" />
                  <button
                    onClick={() => navigate('/muthawif-profile')}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-semibold transition-all bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                  >
                    <User className="w-5 h-5 text-gray-500" />
                    <span>Profil Saya</span>
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Floating Announcement Widget */}
        <FloatingAnnouncementWidget userRole="muthawif" />

        {/* Package Detail Modal */}
        {showPackageDetail && selectedPackage && (
          <MuthawifPackageDetailModal
            onClose={() => setShowPackageDetail(false)}
            packageData={selectedPackage}
          />
        )}
      </div>
    </>
  );
};

export default MuthawifDashboard;
