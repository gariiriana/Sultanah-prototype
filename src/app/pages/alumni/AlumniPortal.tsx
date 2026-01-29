import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { LogOut } from 'lucide-react';
import AlumniBottomNav from './AlumniBottomNav';
import ConfirmDialog from '../../components/ConfirmDialog';

// ✅ BEAUTIFUL IMAGES: Kaaba Aerial View & Logo
const kaabaImage = 'https://images.unsplash.com/photo-1629971138860-4ff46dfb714f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrYWFiYSUyMGFlcmlhbCUyMHZpZXd8ZW58MXx8fHwxNzY4MTg0NTQ5fDA&ixlib=rb-4.1.0&q=80&w=1080';
const sultanahLogo = '/images/logo.png';

interface AlumniPortalProps {
  onNavigateToProfile: () => void;
}

const AlumniPortal: React.FC<AlumniPortalProps> = ({
  onNavigateToProfile,
}) => {
  const { signOut } = useAuth();
  const [activeSection, setActiveSection] = useState('home');
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleBottomNavClick = (sectionId: string) => {
    setActiveSection(sectionId);

    if (sectionId === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Background Kaaba with Overlay */}
      <div className="fixed inset-0 z-0">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url(${kaabaImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/60 to-white/80" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header Navbar */}
        <nav className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-b border-[#D4AF37]/20 shadow-lg">
          <div className="h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 md:h-20">
              {/* Logo + Title */}
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg overflow-hidden bg-white flex-shrink-0 shadow-md">
                  <img src={sultanahLogo} alt="Sultanah Travel" className="w-full h-full object-contain" />
                </div>
                <div>
                  <div className="text-xs md:text-sm text-gray-500 font-light">
                    Welcome to
                  </div>
                  <div className="text-sm md:text-base font-bold bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#F4D03F] bg-clip-text text-transparent">
                    Alumni Jamaah Umroh Portal
                  </div>
                </div>
              </div>

              {/* Logout Button - Desktop */}
              <button
                onClick={() => setShowLogoutDialog(true)}
                className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar</span>
              </button>
            </div>
          </div>
        </nav>
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <AlumniBottomNav
        activeSection={activeSection}
        onNavigate={handleBottomNavClick}
        onProfileClick={onNavigateToProfile}
      />

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
        onConfirm={handleLogout}
        title="Konfirmasi Keluar"
        message="Apakah Anda yakin ingin keluar dari Alumni Portal?"
        confirmText="Ya, Keluar"
        cancelText="Batal"
      />
    </div>
  );
};

export default AlumniPortal;