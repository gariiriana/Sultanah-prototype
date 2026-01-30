import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import FloatingAnnouncementWidget from '../../components/FloatingAnnouncementWidget';
import {
  Users,
  MapPin,
  Clock,
  LogOut,
  Sparkles,
  User, // ✅ NEW: Import User icon for Profile button
  HeartPulse,
  Image,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../../components/ui/button';

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
  const [loading] = useState(false);
  const [stats] = useState({ activeTrips: 1, completedTrips: 12, totalJamaah: 45 });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // ✅ NEW: Sidebar state

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
    <>
      {/* MOBILE SIDEBAR DRAWER */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />

            {/* Sidebar */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-2xl z-50 flex flex-col"
            >
              {/* Header */}
              <div className="p-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute -top-8 -right-8 w-32 h-32 bg-white rounded-full"></div>
                  <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white rounded-full"></div>
                </div>

                <div className="relative flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">Menu</h2>
                    <p className="text-emerald-100 text-sm mt-1">{userProfile?.displayName || 'Tour Leader'}</p>
                  </div>

                  <motion.button
                    onClick={() => setIsSidebarOpen(false)}
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center hover:bg-white/30 transition-all"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {tabs.map((tab, index) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                      <motion.button
                        key={tab.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => {
                          setActiveTab(tab.id);
                          setIsSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-semibold transition-all ${isActive
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                          }`}
                      >
                        <Icon className={`w-5 h-5 ${isActive ? 'drop-shadow' : ''}`} />
                        <span>{tab.label}</span>
                        {isActive && (
                          <motion.div
                            layoutId="sidebarActiveIndicator"
                            className="ml-auto w-2 h-2 bg-white rounded-full"
                            transition={{ type: 'spring', bounce: 0.3 }}
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Profile & Logout Section - At Bottom */}
              <div className="border-t border-gray-200 bg-gray-50">
                {/* Profile Button */}
                <div className="p-4 pb-2">
                  <button
                    onClick={() => {
                      navigate('/tour-leader-profile');
                      setIsSidebarOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-semibold transition-all bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                  >
                    <User className="w-5 h-5" />
                    <span>Profile</span>
                  </button>
                </div>

                {/* Logout Button */}
                <div className="px-4 pb-4">
                  <Button
                    onClick={() => {
                      setIsSidebarOpen(false);
                      setShowLogoutDialog(true);
                    }}
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-5 h-5" />
                    Logout
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        {/* STICKY MOBILE HEADER */}
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="sm:hidden fixed top-0 left-0 right-0 z-30 bg-gradient-to-r from-emerald-600 to-teal-600 shadow-lg"
        >
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <img src={sultanahLogo} alt="Sultanah" className="w-10 h-10 object-contain rounded-2xl" />
              <div>
                <h1 className="text-white font-bold text-sm tracking-wide">SULTANAH</h1>
                <p className="text-emerald-100 text-[10px]">Umrah & Halal Travel</p>
              </div>
            </div>
            <motion.button
              onClick={() => setIsSidebarOpen(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 shadow-lg"
            >
              <Menu className="w-5 h-5 text-white" />
            </motion.button>
          </div>
          <div className="px-4 pb-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30">
              <div className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-pulse"></div>
              <span className="text-white text-xs font-medium">Tour Leader Dashboard</span>
            </div>
          </div>
        </motion.div>

        {/* Spacer */}
        <div className="sm:hidden h-32"></div>

        {/* Hero Header with Background Image - Hidden on Mobile */}
        <div
          className="hidden sm:block relative h-48 sm:h-56 lg:h-64 overflow-hidden"
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

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 h-full flex flex-col justify-between py-4 sm:py-6">
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
                className="flex items-center gap-2 sm:gap-3"
              >
                {/* Hamburger Menu - Mobile Only */}
                <motion.button
                  onClick={() => setIsSidebarOpen(true)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="sm:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 shadow-lg hover:bg-white/30 transition-all"
                >
                  <Menu className="w-5 h-5 text-white" />
                </motion.button>

                <Button
                  onClick={() => navigate('/tour-leader-profile')}
                  className="hidden sm:flex bg-white/15 hover:bg-white/25 border border-white/30 text-white font-medium px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm rounded-xl transition-all backdrop-blur-md shadow-lg hover:shadow-xl"
                >
                  <User className="w-4 h-4 mr-2" />
                  Profil Saya
                </Button>
              </motion.div>
            </div>

            {/* Hero Content - Welcome Message */}
            <div className="space-y-1.5 sm:space-y-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-1.5 sm:gap-2 bg-white/10 backdrop-blur-sm px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-full border border-white/20"
              >
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-300 rounded-full animate-pulse"></div>
                <span className="text-emerald-100 text-xs sm:text-sm font-medium">Tour Leader Dashboard</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl sm:text-3xl md:text-4xl font-bold text-white flex items-center gap-2 sm:gap-3"
              >
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-[#F4D03F]" />
                <span className="leading-tight">Assalamu'alaikum, {userProfile?.displayName || 'Tour Leader'}</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xs sm:text-sm md:text-base text-emerald-100/90"
              >
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </motion.p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-0 sm:-mt-12 relative z-10">
          {/* Stats Cards - Glassmorphism Design */}
          <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
            {/* Total Jamaah - Emerald Elegant */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0, duration: 0.5 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="group bg-white/90 backdrop-blur-xl rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/50 relative overflow-hidden"
            >
              {/* Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              {/* Decorative Circles */}
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-emerald-400/10 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-teal-400/10 rounded-full blur-2xl"></div>

              <div className="relative">
                {/* Icon Container */}
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>

                {/* Label */}
                <p className="text-[10px] sm:text-xs text-gray-600 font-semibold mb-1 tracking-wide">Total Jamaah</p>

                {/* Value */}
                <p className="text-2xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  {loading ? '...' : stats.totalJamaah}
                </p>

                <div className="mt-1.5 sm:mt-2 flex items-center gap-1 text-emerald-600">
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] sm:text-xs font-medium">Active</span>
                </div>
              </div>
            </motion.div>

            {/* Perjalanan Aktif - Green Premium */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="group bg-white/90 backdrop-blur-xl rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/50 relative overflow-hidden"
            >
              {/* Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              {/* Decorative Circles */}
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-green-400/10 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-emerald-400/10 rounded-full blur-2xl"></div>

              <div className="relative">
                {/* Icon Container */}
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>

                {/* Label */}
                <p className="text-[10px] sm:text-xs text-gray-600 font-semibold mb-1 tracking-wide">Perjalanan Aktif</p>

                {/* Value */}
                <p className="text-2xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {loading ? '...' : stats.activeTrips}
                </p>

                {/* Trend Indicator */}
                <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-green-500/10 border border-green-500/20 text-xs sm:text-sm font-medium text-green-700 mt-1.5 sm:mt-2">
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  Ongoing
                </span>
              </div>
            </motion.div>

            {/* Selesai - Gold Elegant */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="group bg-white/90 backdrop-blur-xl rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/50 relative overflow-hidden"
            >
              {/* Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/20 via-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              {/* Decorative Circles */}
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-[#D4AF37]/10 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-amber-400/10 rounded-full blur-2xl"></div>

              <div className="relative">
                {/* Icon Container */}
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#C5A572] to-[#D4AF37] rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>

                {/* Label */}
                <p className="text-[10px] sm:text-xs text-gray-600 font-semibold mb-1 tracking-wide">Selesai</p>

                {/* Value */}
                <p className="text-2xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-r from-[#C5A572] to-[#D4AF37] bg-clip-text text-transparent">
                  {loading ? '...' : stats.completedTrips}
                </p>

                {/* Trend Indicator */}
                <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-xs sm:text-sm font-medium text-[#A0883C] mt-1.5 sm:mt-2">
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-[#D4AF37] rounded-full"></div>
                  Completed
                </span>
              </div>
            </motion.div>
          </div>

          {/* Tab Navigation - Modern Pill Style */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="hidden sm:block bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/60 p-2 mb-8"
          >
            {/* Scroll Container with Fade Gradients */}
            <div className="relative group">
              {/* Left Fade Gradient */}
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white/80 to-transparent pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity"></div>

              {/* Right Fade Gradient */}
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white/80 to-transparent pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity"></div>

              {/* Scrollable Tabs - Centered for Desktop */}
              <div
                className="flex items-center justify-center gap-3 sm:gap-6 overflow-x-auto overflow-y-hidden pb-2 px-4 scroll-smooth"
                style={{
                  scrollbarWidth: 'none', // Hide scrollbar for cleaner look
                  msOverflowStyle: 'none',
                }}
              >
                {/* Hide scrollbar for Chrome/Safari */}
                <style>{`
                  div::-webkit-scrollbar { display: none; }
                `}</style>

                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <motion.button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className={`
                        relative flex-shrink-0 flex items-center justify-center gap-2.5 px-3 py-2.5 sm:px-6 sm:py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-300
                        ${isActive
                          ? 'text-white shadow-xl'
                          : 'text-gray-500 hover:text-emerald-600 hover:bg-emerald-50/50'
                        }
                      `}
                    >
                      {/* Active Background Gradient */}
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 rounded-2xl shadow-lg shadow-emerald-500/20"
                          transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                        />
                      )}

                      {/* Icon */}
                      <Icon className={`w-4 h-4 sm:w-5 sm:h-5 relative z-10 transition-transform duration-300 ${isActive ? 'drop-shadow scale-110' : ''}`} />

                      {/* Label */}
                      <span className="relative z-10 whitespace-nowrap tracking-wide">{tab.label}</span>

                      {/* Active Indicator Dot - Refined Position */}
                      {isActive && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-gradient-to-tr from-[#D4AF37] to-[#F4D03F] rounded-full border-2 border-white shadow-md z-20"
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Tab Content with Enhanced Animation */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl border border-white/50 p-4 sm:p-6 lg:p-8"
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
    </>
  );
};

export default TourLeaderDashboard;