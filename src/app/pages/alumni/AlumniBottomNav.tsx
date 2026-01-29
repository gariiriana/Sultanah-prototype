import React from 'react';
import { Home, Users, Gift, Star, Newspaper, User, Award } from 'lucide-react';
import { motion } from 'motion/react';

interface AlumniBottomNavProps {
  activeSection: string;
  onNavigate: (section: string) => void;
  onProfileClick: () => void;
  onRatingClick?: () => void; // ✅ NEW: Rating Tour Leader click handler
  hasCompletedTrip?: boolean; // ✅ NEW: Check if alumni has completed trip
}

const AlumniBottomNav: React.FC<AlumniBottomNavProps> = ({ 
  activeSection, 
  onNavigate, 
  onProfileClick,
  onRatingClick,
  hasCompletedTrip = false,
}) => {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'referral', label: 'Referral', icon: Gift },
    { id: 'testimonial', label: 'Testimoni', icon: Star },
    { id: 'news', label: 'Berita', icon: Newspaper },
  ];

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 backdrop-blur-xl border-t border-[#D4AF37]/30 shadow-2xl md:hidden"
    >
      {/* Premium Gold Gradient Border Top */}
      <div className="h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
      
      <div className="flex items-center justify-around px-2 py-3 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <motion.button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all relative min-w-[60px]"
              whileTap={{ scale: 0.9 }}
            >
              {/* Active Indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/20 to-[#C5A572]/20 rounded-xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              
              <div className={`relative z-10 transition-all ${ 
                isActive 
                  ? 'text-[#D4AF37]' 
                  : 'text-gray-400'
              }`}>
                <Icon className={`${isActive ? 'w-6 h-6' : 'w-5 h-5'}`} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              
              <span className={`relative z-10 text-[10px] font-medium transition-all ${ 
                isActive 
                  ? 'text-[#D4AF37]' 
                  : 'text-gray-400'
              }`}>
                {item.label}
              </span>
            </motion.button>
          );
        })}
        
        {/* ✅ Rating Tour Leader Button - NEW! */}
        {onRatingClick && (
          <motion.button
            onClick={onRatingClick}
            disabled={!hasCompletedTrip}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all relative min-w-[60px] ${
              !hasCompletedTrip ? 'opacity-50' : ''
            }`}
            whileTap={{ scale: hasCompletedTrip ? 0.9 : 1 }}
          >
            {/* Amber Glow for Active */}
            {hasCompletedTrip && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-amber-600/20 rounded-xl"
                animate={{
                  opacity: [0.3, 0.6, 0.3],
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            )}
            
            <div className="relative">
              <div className={`absolute inset-0 rounded-full blur-md opacity-60 ${
                hasCompletedTrip 
                  ? 'bg-gradient-to-br from-amber-500 to-amber-600 animate-pulse' 
                  : 'bg-gray-400'
              }`} />
              
              <div className={`relative p-2 rounded-full shadow-xl ${
                hasCompletedTrip 
                  ? 'bg-gradient-to-br from-amber-500 to-amber-600' 
                  : 'bg-gray-400'
              }`}>
                <Award className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
            </div>
            
            <span className={`text-[10px] font-bold ${
              hasCompletedTrip ? 'text-amber-500' : 'text-gray-400'
            }`}>
              Rating
            </span>
          </motion.button>
        )}
        
        {/* My Profile Button - Special - HIGHLIGHTED! */}
        <motion.button
          onClick={onProfileClick}
          className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all relative min-w-[60px]"
          whileTap={{ scale: 0.9 }}
        >
          {/* Pulsing Effect to Draw Attention */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/20 to-[#C5A572]/20 rounded-xl"
            animate={{
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          <div className="relative">
            {/* Premium Gold Ring with Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37] to-[#C5A572] rounded-full blur-md opacity-60 animate-pulse" />
            
            <div className="relative bg-gradient-to-br from-[#D4AF37] to-[#C5A572] p-2 rounded-full shadow-xl">
              <User className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
          </div>
          
          <span className="text-[10px] font-bold text-[#D4AF37]">
            Profil
          </span>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default AlumniBottomNav;