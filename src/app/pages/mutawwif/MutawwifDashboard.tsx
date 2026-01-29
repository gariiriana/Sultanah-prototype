import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import FloatingAnnouncementWidget from '../../components/FloatingAnnouncementWidget';
import {
  Users,
  BookOpen,
  LogOut,
  User,
  ChevronRight,
  Calendar,
  TrendingUp,
  Star
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../../components/ui/button';

import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import ConfirmDialog from '../../components/ConfirmDialog';

// ✅ LOGO: Mosque dome with gold
const sultanahLogo = '/images/logo.png';

// Import profile section
import MyProfileSection from './sections/MyProfileSection';

type TabType = 'jamaah' | 'guidance' | 'profile';

const MutawwifDashboard: React.FC = () => {
  const { userProfile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('jamaah');
  const [stats, setStats] = useState({
    totalJamaah: 0,
    activeGroups: 0,
    guidanceSessions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // ✅ FIX: Ensure mutawwifId is defined before query
      const mutawwifId = userProfile?.id || userProfile?.email;
      if (!mutawwifId) {
        console.log('No valid mutawwifId for stats fetch');
        setLoading(false);
        return;
      }

      // Fetch jamaah assigned to this mutawwif
      const jamaahQuery = query(
        collection(db, 'users'),
        where('assignedMutawwif', '==', mutawwifId)
      );
      const jamaahSnapshot = await getDocs(jamaahQuery);
      const totalJamaah = jamaahSnapshot.size;

      setStats({
        totalJamaah,
        activeGroups: 0,
        guidanceSessions: 0,
      });

      console.log('📊 Mutawwif Stats:', {
        totalJamaah,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    {
      id: 'jamaah' as TabType,
      label: 'Jamaah List',
      icon: Users,
      description: '0 members'
    },
    {
      id: 'guidance' as TabType,
      label: 'Bimbingan',
      icon: BookOpen,
      description: 'Materi Pembelajaran'
    },
    {
      id: 'profile' as TabType,
      label: 'My Profile',
      icon: User,
      description: 'Kelola Profil'
    },
  ];

  const statCards = [
    {
      title: 'Total Jamaah',
      value: stats.totalJamaah,
      icon: Users,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Active Trips',
      value: stats.activeGroups,
      icon: Calendar,
      color: 'emerald',
      bgColor: 'bg-emerald-50',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
    },
    {
      title: 'Upcoming Trips',
      value: stats.guidanceSessions,
      icon: TrendingUp,
      color: 'amber',
      bgColor: 'bg-amber-50',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
    },
    {
      title: 'Completed',
      value: 0,
      icon: Star,
      color: 'purple',
      bgColor: 'bg-purple-50',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Header */}
      <div className="bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#E5C158]">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            {/* Welcome Section */}
            <div className="flex items-center gap-3 md:gap-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-12 h-12 md:w-14 md:h-14 rounded-lg overflow-hidden bg-white flex-shrink-0 shadow-md"
              >
                <img src={sultanahLogo} alt="Sultanah Travel" className="w-full h-full object-contain" />
              </motion.div>

              <div>
                <motion.h1
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-xl md:text-2xl font-bold text-white"
                >
                  Welcome, {userProfile?.displayName || 'Mutawwif'}!
                </motion.h1>
                <motion.p
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-white/90 text-xs md:text-sm mt-0.5"
                >
                  Mutawwif Dashboard
                </motion.p>
              </div>
            </div>

            {/* Logout Button */}
            <Button
              onClick={() => setShowLogoutConfirm(true)}
              className="bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm rounded-lg px-2 md:px-5 text-xs md:text-sm"
            >
              <LogOut className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 -mt-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group cursor-pointer"
            >
              <div className={`bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all border border-gray-100`}>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-12 h-12 ${stat.iconBg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900">
                  {loading ? (
                    <span className="inline-block w-10 h-8 bg-gray-200 animate-pulse rounded"></span>
                  ) : (
                    stat.value
                  )}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 overflow-hidden"
        >
          <div className="grid grid-cols-3 gap-0">
            {tabs.map((tab, index) => {
              const isActive = activeTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative p-6 text-left transition-all ${isActive
                    ? 'bg-gradient-to-r from-[#C5A572] to-[#D4AF37]'
                    : 'bg-white hover:bg-gray-50'
                    } ${index !== 0 ? 'border-l border-gray-100' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? 'bg-white/20' : 'bg-gray-100'
                      }`}>
                      <tab.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-600'}`} />
                    </div>
                    <div className="flex-1">
                      <p className={`font-semibold ${isActive ? 'text-white' : 'text-gray-900'}`}>
                        {tab.label}
                      </p>
                      <p className={`text-xs ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
                        {tab.description}
                      </p>
                    </div>
                    {isActive && (
                      <ChevronRight className="w-5 h-5 text-white" />
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8"
          >
            {activeTab === 'jamaah' && (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between pb-6 border-b border-gray-100">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                      <Users className="w-6 h-6 text-[#D4AF37]" />
                      Jamaah List
                    </h2>
                    <p className="text-gray-600 mt-1">0 members</p>
                  </div>
                  <Button className="bg-gradient-to-r from-[#C5A572] to-[#D4AF37] text-white shadow-md hover:shadow-lg rounded-lg">
                    Export CSV
                  </Button>
                </div>

                {/* Search & Filter */}
                <div className="flex gap-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Search by name, email, or phone..."
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                    />
                  </div>
                  <Button variant="outline" className="px-6 rounded-lg border-gray-200">
                    All Status
                  </Button>
                </div>

                {/* Empty State */}
                {stats.totalJamaah === 0 ? (
                  <div className="text-center py-16">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4"
                    >
                      <Users className="w-12 h-12 text-gray-400" />
                    </motion.div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No jamaah members found
                    </h3>
                    <p className="text-gray-500">
                      Try adjusting your search or filters
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Jamaah cards will be mapped here */}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'guidance' && (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between pb-6 border-b border-gray-100">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                      <BookOpen className="w-6 h-6 text-[#D4AF37]" />
                      Materi Bimbingan
                    </h2>
                    <p className="text-gray-600 mt-1">Buat dan kelola materi pembelajaran</p>
                  </div>
                  <Button className="bg-gradient-to-r from-[#C5A572] to-[#D4AF37] text-white shadow-md hover:shadow-lg rounded-lg">
                    + Tambah Materi
                  </Button>
                </div>

                {/* Empty State */}
                <div className="text-center py-16">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-24 h-24 mx-auto bg-violet-100 rounded-full flex items-center justify-center mb-4"
                  >
                    <BookOpen className="w-12 h-12 text-violet-600" />
                  </motion.div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Belum Ada Materi
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Mulai buat materi bimbingan untuk jamaah Anda
                  </p>
                  <Button className="bg-gradient-to-r from-[#C5A572] to-[#D4AF37] text-white shadow-md hover:shadow-lg rounded-lg px-8">
                    Mulai Membuat Materi
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div>
                <MyProfileSection />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-8 text-center">
        <p className="text-gray-600 text-sm">
          © 2024 Umrah Travel. Mutawwif Dashboard.
        </p>
      </footer>

      {/* Floating Announcement Widget */}
      <FloatingAnnouncementWidget userRole="muthawif" />

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={signOut}
        title="Logout Confirmation"
        message="Are you sure you want to logout?"
        confirmText="Logout"
        cancelText="Cancel"
      />
    </div>
  );
};

export default MutawwifDashboard;