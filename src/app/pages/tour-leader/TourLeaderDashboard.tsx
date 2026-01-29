import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import FloatingAnnouncementWidget from '../../components/FloatingAnnouncementWidget';
import {
  Users,
  MapPin,
  Clock,
  LogOut,
  Sparkles,
  User, // ✅ NEW: Import User icon for Profile button
  HeartPulse,
  Image
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useNavigate } from 'react-router-dom'; // ✅ NEW: Import useNavigate
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';

// ✅ LOGO: Mosque dome with gold
const sultanahLogo = '/images/logo.png';

// Import section components
import JamaahListSection from './sections/JamaahListSection';
import ItinerarySectionNew from './sections/ItinerarySectionNew';
import FeedbackSection from './sections/FeedbackSection';
import MuthawifTeamSection from './sections/MuthawifTeamSection';
import MedicalSection from './sections/MedicalSection'; // ✅ NEW
import TripGallerySection from './sections/TripGallerySection'; // ✅ NEW


type TabType = 'jamaah' | 'itinerary' | 'muthawif' | 'medical' | 'gallery' | 'feedback'; // ✅ UPDATED

const TourLeaderDashboard = () => {
  const { userProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('jamaah');
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ activeTrips: 1, completedTrips: 12, totalJamaah: 45 });

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const tabs = [
    {
      id: 'jamaah' as TabType,
      label: 'Daftar Jamaah',
      icon: Users,
    },
    {
      id: 'medical' as TabType, // ✅ NEW
      label: 'Medis',
      icon: HeartPulse, // Need to import HeartPulse
    },
    {
      id: 'itinerary' as TabType,
      label: 'Jadwal',
      icon: MapPin,
    },
    {
      id: 'gallery' as TabType, // ✅ NEW
      label: 'Galeri',
      icon: Image, // Need to import Image
    },
    {
      id: 'muthawif' as TabType,
      label: 'Tim Muthawif',
      icon: Users,
    },
    {
      id: 'feedback' as TabType,
      label: 'Feedback',
      icon: Sparkles,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Hero Header with Background Image */}
      <div
        className="relative h-64 overflow-hidden"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1728747723398-0e0ce211bb29?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXNqaWRpbCUyMGhhcmFtJTIwbWVjY2ElMjBhZXJpYWx8ZW58MXx8fHwxNzY3NjM3MDQ5fDA&ixlib=rb-4.1.0&q=80&w=1080)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Gradient Overlay - Emerald & Gold */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/90 via-emerald-800/85 to-[#D4AF37]/80"></div>

        {/* Decorative Islamic Pattern Overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>

        <div className="relative max-w-7xl mx-auto px-6 h-full flex flex-col justify-between py-6">
          {/* Top Bar - Logo & Actions */}
          <div className="flex items-center justify-between">
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
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <Button
                onClick={() => navigate('/tour-leader-profile')}
                className="bg-white/15 hover:bg-white/25 border border-white/30 text-white font-medium px-5 py-2.5 rounded-xl transition-all backdrop-blur-md shadow-lg hover:shadow-xl"
              >
                <User className="w-4 h-4 mr-2" />
                Profil Saya
              </Button>

              <Button
                onClick={() => setShowLogoutDialog(true)}
                className="bg-white/15 hover:bg-white/25 border border-white/30 text-white font-medium px-5 py-2.5 rounded-xl transition-all backdrop-blur-md shadow-lg hover:shadow-xl"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </motion.div>
          </div>

          {/* Hero Content - Welcome Message */}
          <div className="space-y-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20"
            >
              <div className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse"></div>
              <span className="text-emerald-100 text-sm font-medium">Tour Leader Dashboard</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl md:text-5xl font-bold text-white flex items-center gap-3"
            >
              <Sparkles className="w-8 h-8 text-[#F4D03F]" />
              Assalamu'alaikum, {userProfile?.displayName || 'Tour Leader'}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-emerald-100/90 text-lg"
            >
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </motion.p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Total Jamaah - Blue */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-lg text-white relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-8 -translate-x-8"></div>
            <div className="relative">
              <Users className="w-12 h-12 mb-4 opacity-90" />
              <p className="text-white/90 text-sm font-medium mb-1">Total Jamaah</p>
              <p className="text-5xl font-bold">
                {loading ? '...' : stats.totalJamaah}
              </p>
            </div>
          </motion.div>

          {/* Active Trips - Green */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 shadow-lg text-white relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-8 -translate-x-8"></div>
            <div className="relative">
              <MapPin className="w-12 h-12 mb-4 opacity-90" />
              <p className="text-white/90 text-sm font-medium mb-1">Perjalanan Aktif</p>
              <p className="text-5xl font-bold">
                {loading ? '...' : stats.activeTrips}
              </p>
            </div>
          </motion.div>

          {/* Completed - Gray */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-gray-600 to-gray-700 rounded-2xl p-6 shadow-lg text-white relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-8 -translate-x-8"></div>
            <div className="relative">
              <Clock className="w-12 h-12 mb-4 opacity-90" />
              <p className="text-white/90 text-sm font-medium mb-1">Selesai</p>
              <p className="text-5xl font-bold">
                {loading ? '...' : stats.completedTrips}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-2 mb-8">
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${isActive
                    ? 'bg-gradient-to-r from-[#C5A572] to-[#D4AF37] text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl shadow-md border border-gray-200 p-8"
        >
          {activeTab === 'jamaah' && <JamaahListSection />}
          {activeTab === 'medical' && <MedicalSection />}
          {activeTab === 'itinerary' && <ItinerarySectionNew />}
          {activeTab === 'gallery' && <TripGallerySection />}
          {activeTab === 'muthawif' && <MuthawifTeamSection />}
          {activeTab === 'feedback' && <FeedbackSection />}
        </motion.div>
      </div>

      {/* Floating Announcement Widget */}
      <FloatingAnnouncementWidget userRole="tour-leader" />

      {/* Logout Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin keluar? Sesi Anda akan berakhir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>
              Keluar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TourLeaderDashboard;