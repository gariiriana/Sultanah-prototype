import React, { useState, useEffect } from 'react';
import { Menu, X, UserCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';

// Logo removed - using text branding instead

interface NavbarProps {
  onNavigate: (section: string) => void;
  onShowProfile: () => void;
  onShowAuth?: (tab?: 'login' | 'register') => void;
}

const Navbar: React.FC<NavbarProps> = ({ onNavigate, onShowProfile, onShowAuth }) => {
  const { currentUser } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'Beranda', section: 'home' },
    { label: 'Promo', section: 'promo' },
    { label: 'Layanan', section: 'services' },
    { label: 'Paket', section: 'packages' },
    { label: 'Edukasi', section: 'education' },
    { label: 'Pantau Keluarga', section: 'family-tracking' }, // ✅ NEW: Family Tracking
    { label: 'Testimoni', section: 'testimonials' },
    { label: 'Kontak', section: 'contact' },
  ];

  const handleNavigate = (section: string) => {
    onNavigate(section);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
          ? 'bg-white/95 backdrop-blur-3xl shadow-2xl border-b border-[#D4AF37]/20 [&_img]:brightness-100 [&_img]:invert-0'
          : 'bg-white/10 backdrop-blur-2xl border-b border-white/20'
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo - LEFT SIDE - Premium Text Branding */}
            <div className="flex-shrink-0 flex items-center gap-3">
              <div className="flex flex-col">
                <img
                  src="/images/logo.png"
                  alt="Sultanah Travel"
                  className="h-10 sm:h-14 w-auto object-contain drop-shadow-lg transition-all duration-300 rounded-xl"
                />
              </div>
              <div className="flex flex-col items-start">
                <span className={`text-[8px] sm:text-[10px] font-medium tracking-wide leading-none mb-0.5 ${scrolled ? 'text-gray-600' : 'text-white/90'}`}>
                  Selamat datang di
                </span>
                <span className="text-sm sm:text-xl font-bold tracking-widest uppercase text-[#D4AF37]">
                  SULTANAH
                </span>
              </div>
            </div>

            {/* Desktop Navigation - Better Flex Centering to prevent collision */}
            <div className="hidden lg:flex flex-1 items-center justify-center gap-1 px-4">
              {navItems.map((item, index) => (
                <motion.button
                  key={item.section}
                  onClick={() => handleNavigate(item.section)}
                  className={`relative px-4 py-2.5 rounded-lg transition-all duration-300 group ${scrolled
                    ? 'text-gray-700 hover:text-[#D4AF37]'
                    : 'text-white hover:text-[#FFD700]'
                    }`}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <span className="relative z-10 font-semibold text-sm tracking-wide whitespace-nowrap">{item.label}</span>
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 rounded-full bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] group-hover:w-full transition-all duration-300" />
                </motion.button>
              ))}
            </div>

            {/* Action Buttons - Right Aligned */}
            <div className="hidden lg:flex flex-shrink-0 items-center">
              {/* Vertical Separator - Increased Margin for breathing room */}
              <div className={`h-6 w-px mx-6 ${scrolled ? 'bg-gray-300' : 'bg-white/30'}`} />

              <div className="flex items-center gap-4">
                {currentUser ? (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={onShowProfile}
                      className={`rounded-xl font-semibold shadow-lg transition-all text-sm px-5 py-2.5 ${scrolled
                        ? 'bg-white border-2 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white'
                        : 'bg-white/20 backdrop-blur-xl border-2 border-white/40 text-white hover:bg-white/30'
                        }`}
                    >
                      <UserCircle className="w-4 h-4 mr-2" />
                      Profil
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div className="flex items-center gap-3">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={() => onShowAuth?.('login')}
                        className={`rounded-xl font-semibold transition-all text-sm px-6 py-2.5 ${scrolled
                          ? 'bg-transparent border-2 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white'
                          : 'bg-white/20 backdrop-blur-xl border-2 border-white/30 text-white hover:bg-white/40'
                          }`}
                      >
                        Masuk
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={() => onShowAuth?.('register')}
                        className={`rounded-xl font-semibold shadow-lg transition-all text-sm px-5 py-2.5 ${scrolled
                          ? 'bg-[#D4AF37] text-white hover:bg-[#C5A572]'
                          : 'bg-white text-[#D4AF37] hover:bg-gray-100'
                          }`}
                      >
                        Daftar Sekarang
                      </Button>
                    </motion.div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`lg:hidden p-2 rounded-xl transition-all ${scrolled
                ? 'text-gray-700 hover:bg-[#D4AF37]/10'
                : 'text-white hover:bg-white/20 backdrop-blur-xl'
                }`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </motion.button>
          </div>
        </div>

        {/* Animated Gradient Border */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: scrolled ? 1 : 0 }}
          transition={{ duration: 0.5 }}
          className="h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent"
        />
      </motion.nav >

      {/* Mobile Menu */}
      <AnimatePresence>
        {
          mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed inset-0 z-40 bg-gradient-to-br from-white via-gray-50 to-[#D4AF37]/5 backdrop-blur-xl md:hidden"
              style={{ top: '80px' }}
            >
              <div className="flex flex-col items-center py-8 space-y-6">
                {navItems.map((item, index) => (
                  <motion.button
                    key={item.section}
                    onClick={() => handleNavigate(item.section)}
                    className="text-xl text-gray-700 hover:text-[#D4AF37] transition-colors font-medium"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    {item.label}
                  </motion.button>
                ))}

                <div className="border-t border-gray-200 pt-6 w-64 px-4">
                  {currentUser ? (
                    <div className="space-y-4">
                      <Button
                        onClick={() => {
                          onShowProfile();
                          setMobileMenuOpen(false);
                        }}
                        className="w-full bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] shadow-lg hover:shadow-xl transition-all py-3 text-base flex items-center justify-center gap-2"
                      >
                        <UserCircle className="w-5 h-5" />
                        <span className="font-semibold">Profil Saya</span>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Button
                        onClick={() => {
                          onShowAuth?.('login');
                          setMobileMenuOpen(false);
                        }}
                        className="w-full bg-white border-2 border-[#D4AF37] text-[#D4AF37] rounded-xl py-3 font-semibold"
                      >
                        Masuk Ke Akun
                      </Button>
                      <Button
                        onClick={() => {
                          onShowAuth?.('register');
                          setMobileMenuOpen(false);
                        }}
                        className="w-full bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] text-white rounded-xl py-3 font-semibold"
                      >
                        Daftar Sekarang
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )
        }
      </AnimatePresence >
    </>
  );
};

export default Navbar;