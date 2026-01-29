import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Bell, Volume2, AlertCircle } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Announcement } from '../types/announcement';

// ✅ LOGO: Genuine Sultanah Logo
const sultanahLogo = '/images/logo.png';

interface FloatingAnnouncementWidgetProps {
  userRole: string | null; // 'guest', 'prospective-jamaah', 'current-jamaah', 'alumni-jamaah', 'tour-leader', 'mutawwif', 'admin', 'manager', 'supervisor'
}

export default function FloatingAnnouncementWidget({ userRole }: FloatingAnnouncementWidgetProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [urgentAnnouncementsCount, setUrgentAnnouncementsCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [indexError, setIndexError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Determine user role for query
    const currentRole = userRole || 'guest';

    // Query announcements for current user role
    const q = query(
      collection(db, 'announcements'),
      where('isActive', '==', true),
      where('targetRoles', 'array-contains', currentRole),
      orderBy('createdAt', 'desc')
    );

    // ✅ ENHANCED: Add error handling for WebChannel errors
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        // Clear error on successful query
        setIndexError(null);

        const announcementsData: Announcement[] = [];
        let urgentCount = 0;

        snapshot.forEach((doc) => {
          const data = doc.data() as Announcement;

          // Check if announcement is still valid (not expired)
          const now = Timestamp.now();
          const isExpired = data.expiryDate && data.expiryDate < now;

          if (!isExpired) {
            announcementsData.push({
              ...data,
              id: doc.id,
            });

            if (data.isUrgent) {
              urgentCount++;
            }
          }
        });

        setAnnouncements(announcementsData);
        setUrgentAnnouncementsCount(urgentCount);
        setLoading(false);
      },
      (error) => {
        // ✅ Handle transient connection errors gracefully
        if (error.code === 'unavailable' || error.message.includes('transport')) {
          console.log('Firestore temporarily unavailable, will retry...');
          setLoading(false);
        } else if (error.code === 'failed-precondition') {
          console.log('Index required for announcements query');
          setIndexError('Index required - check Firestore console');
          setLoading(false);
        } else {
          console.error('Firestore listener error:', error);
          setLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, [userRole]);

  // Don't render if no announcements
  if (announcements.length === 0) {
    return null;
  }

  return (
    <>
      {/* Floating Widget - Bottom Left */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, x: -100 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 1 }}
        className="fixed bottom-6 left-6 z-50 cursor-pointer group"
        onClick={() => setIsOpen(true)}
      >
        {/* 3D Image Container */}
        <div className="relative">
          {/* Urgent Badge with Alarm Animation */}
          {urgentAnnouncementsCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2 z-10"
            >
              {/* Alarm Icon with Pulse */}
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  repeatType: 'loop',
                }}
                className="bg-gradient-to-r from-red-500 to-red-600 rounded-full p-2 shadow-lg"
              >
                <Bell className="w-5 h-5 text-white" fill="white" />
              </motion.div>

              {/* Count Badge */}
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </div>
              )}
            </motion.div>
          )}

          {/* 3D Announcement Icon - Beautiful Islamic Design */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative"
          >
            {/* 3D Layered Design with Sultanah Logo */}
            <div className="relative w-32 h-32 md:w-40 md:h-40">
              {/* Background Circle - Layer 3 (Gold Shadow) */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37] to-[#C5A572] rounded-full opacity-20 blur-2xl scale-110"></div>

              {/* Middle Circle - Layer 2 (Glow) */}
              <motion.div
                animate={{
                  scale: [1.05, 1.15, 1.05],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 bg-gradient-to-br from-[#D4AF37] to-[#C5A572] rounded-full opacity-40 blur-md"
              />

              {/* Main Circle - Layer 1 with Logo */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] via-[#2d2d2d] to-[#1a1a1a] rounded-full shadow-2xl flex items-center justify-center group-hover:shadow-[#D4AF37]/50 transition-shadow overflow-hidden">
                {/* Sultanah Logo */}
                <motion.img
                  src={sultanahLogo}
                  alt="Sultanah"
                  className="w-[70%] h-[70%] object-contain drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]"
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />

                {/* Megaphone Icon Overlay (Small) */}
                <div className="absolute bottom-2 right-2 bg-white rounded-full p-1.5 shadow-lg">
                  <Volume2 className="w-4 h-4 md:w-5 md:h-5 text-[#D4AF37]" strokeWidth={2.5} />
                </div>

                {/* Sound Wave Animation */}
                <motion.div
                  animate={{
                    scale: [1, 1.5, 1.5],
                    opacity: [0.8, 0, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeOut"
                  }}
                  className="absolute -right-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border-2 border-[#D4AF37]"
                />
                <motion.div
                  animate={{
                    scale: [1, 1.8, 1.8],
                    opacity: [0.6, 0, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeOut",
                    delay: 0.3
                  }}
                  className="absolute -right-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border-2 border-[#D4AF37]"
                />
              </div>

              {/* Islamic Star Pattern Overlay */}
              <div className="absolute inset-0 rounded-full overflow-hidden opacity-10 pointer-events-none">
                <div className="w-full h-full bg-repeat" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4AF37' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  backgroundSize: '30px 30px'
                }}></div>
              </div>
            </div>

            {/* Floating Sparkles */}
            <motion.div
              animate={{
                y: [-5, -15, -5],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute top-0 right-0 text-2xl"
            >
              ✨
            </motion.div>
            <motion.div
              animate={{
                y: [-5, -15, -5],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5
              }}
              className="absolute top-4 left-0 text-xl"
            >
              💫
            </motion.div>
            <motion.div
              animate={{
                y: [-5, -15, -5],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }}
              className="absolute bottom-2 left-2 text-lg"
            >
              ⭐
            </motion.div>
          </motion.div>

          {/* Urgent Text Label */}
          {urgentAnnouncementsCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg whitespace-nowrap"
            >
              <Volume2 className="w-3 h-3 inline mr-1" />
              BUKA SEKARANG!
            </motion.div>
          )}
        </div>

        {/* Tooltip */}
        <div className="absolute bottom-full left-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap shadow-xl">
            📢 Ada {unreadCount} Pengumuman {urgentAnnouncementsCount > 0 && '(URGENT!)'}
          </div>
        </div>
      </motion.div>

      {/* Modal Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-[#D4AF37] to-[#C5A572] p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-6 h-6" />
                    <h2 className="text-2xl font-bold">📢 Pengumuman Penting</h2>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="hover:bg-white/20 rounded-full p-2 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {announcements.map((announcement, index) => (
                  <motion.div
                    key={announcement.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`mb-4 p-4 rounded-xl border-2 ${announcement.isUrgent
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 bg-gray-50'
                      }`}
                  >
                    {/* Urgent Badge */}
                    {announcement.isUrgent && (
                      <div className="flex items-center gap-2 mb-2">
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"
                        >
                          <Bell className="w-3 h-3" fill="white" />
                          URGENT
                        </motion.div>
                      </div>
                    )}

                    {/* Title */}
                    <h3 className="text-xl font-bold mb-2 text-gray-900">
                      {announcement.title}
                    </h3>

                    {/* Message */}
                    <p className="text-gray-700 mb-3 whitespace-pre-wrap">
                      {announcement.message}
                    </p>

                    {/* Meta Info */}
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-200">
                      <span>
                        📅 {announcement.createdAt?.toDate().toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="font-semibold">
                        {announcement.createdByName}
                      </span>
                    </div>

                    {/* Expiry Info */}
                    {announcement.expiryDate && (
                      <div className="mt-2 text-xs text-gray-500">
                        ⏰ Berlaku hingga: {announcement.expiryDate?.toDate().toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Footer */}
              <div className="bg-gray-100 p-4 text-center">
                <button
                  onClick={() => setIsOpen(false)}
                  className="bg-gradient-to-r from-[#D4AF37] to-[#C5A572] text-white px-6 py-2 rounded-full font-semibold hover:opacity-90 transition-opacity"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}