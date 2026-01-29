import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Check, X, DollarSign, UserPlus, TrendingUp } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  doc,
  updateDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: 'referral_used' | 'payment_approved' | 'commission_earned';
  title: string;
  message: string;
  referralName?: string;
  amount?: number;
  isRead: boolean;
  createdAt: Date;
}

interface AgentNotificationBellProps {
  userId: string;
  className?: string;
}

const AgentNotificationBell: React.FC<AgentNotificationBellProps> = ({ userId, className = '' }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    // Real-time listener untuk notifikasi agen
    // ✅ Try without orderBy first to avoid index issues
    const notifQuery = query(
      collection(db, 'agentNotifications'),
      where('agentId', '==', userId)
    );

    const unsubscribe = onSnapshot(
      notifQuery,
      (snapshot) => {
        const notifData: Notification[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          notifData.push({
            id: docSnap.id,
            type: data.type,
            title: data.title,
            message: data.message,
            referralName: data.referralName,
            amount: data.amount,
            isRead: data.isRead || false,
            createdAt: data.createdAt?.toDate() || new Date(),
          });
        });
        
        // ✅ Sort client-side to avoid Firestore index requirement
        notifData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        
        setNotifications(notifData);
        
        // Hitung unread
        const unread = notifData.filter(n => !n.isRead).length;
        setUnreadCount(unread);
      },
      (error) => {
        console.warn('⚠️ Error listening to agent notifications:', error);
        // Don't show error toast for missing collection (it's normal on first load)
        if (error.code !== 'permission-denied' && error.code !== 'not-found') {
          console.error('Notification listener error details:', error);
        }
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'agentNotifications', notificationId), {
        isRead: true,
        readAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifs = notifications.filter(n => !n.isRead);
      await Promise.all(
        unreadNotifs.map(n => 
          updateDoc(doc(db, 'agentNotifications', n.id), {
            isRead: true,
            readAt: Timestamp.now(),
          })
        )
      );
      toast.success('Semua notifikasi ditandai sudah dibaca');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Gagal menandai notifikasi');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'referral_used':
        return <UserPlus className="w-5 h-5 text-blue-500" />;
      case 'payment_approved':
        return <DollarSign className="w-5 h-5 text-green-500" />;
      case 'commission_earned':
        return <TrendingUp className="w-5 h-5 text-amber-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit yang lalu`;
    if (diffHours < 24) return `${diffHours} jam yang lalu`;
    if (diffDays < 7) return `${diffDays} hari yang lalu`;
    return date.toLocaleDateString('id-ID');
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <Button
        variant="ghost"
        size="icon"
        className={`relative ${className}`}
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
          >
            <span className="text-white text-xs font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </motion.div>
        )}
      </Button>

      {/* Notification Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowDropdown(false)}
            />
            
            {/* Dropdown Card */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 w-96 z-50"
            >
              <Card className="shadow-2xl border-2 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-500 to-yellow-500 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-bold text-lg flex items-center gap-2">
                        <Bell className="w-5 h-5" />
                        Notifikasi
                      </h3>
                      <p className="text-amber-100 text-sm">
                        {unreadCount} notifikasi belum dibaca
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDropdown(false)}
                      className="text-white hover:bg-white/20"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                {/* Notifications List */}
                <ScrollArea className="h-96">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">Belum ada notifikasi</p>
                      <p className="text-gray-400 text-sm mt-1">
                        Notifikasi akan muncul saat ada aktivitas referral
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {notifications.map((notif) => (
                        <motion.div
                          key={notif.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                            !notif.isRead ? 'bg-amber-50' : ''
                          }`}
                          onClick={() => {
                            if (!notif.isRead) {
                              handleMarkAsRead(notif.id);
                            }
                          }}
                        >
                          <div className="flex gap-3">
                            {/* Icon */}
                            <div className="flex-shrink-0 mt-1">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                !notif.isRead ? 'bg-amber-100' : 'bg-gray-100'
                              }`}>
                                {getNotificationIcon(notif.type)}
                              </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className={`font-semibold text-sm ${
                                  !notif.isRead ? 'text-gray-900' : 'text-gray-700'
                                }`}>
                                  {notif.title}
                                </h4>
                                {!notif.isRead && (
                                  <div className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0 mt-1.5" />
                                )}
                              </div>
                              
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {notif.message}
                              </p>

                              {notif.referralName && (
                                <p className="text-sm text-gray-500 mt-1">
                                  <span className="font-medium">{notif.referralName}</span>
                                </p>
                              )}

                              {notif.amount && (
                                <p className="text-sm font-semibold text-green-600 mt-1">
                                  + Rp {notif.amount.toLocaleString('id-ID')}
                                </p>
                              )}

                              <p className="text-xs text-gray-400 mt-2">
                                {formatTimeAgo(notif.createdAt)}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                {/* Footer Actions */}
                {notifications.length > 0 && unreadCount > 0 && (
                  <div className="p-3 border-t bg-gray-50">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleMarkAllAsRead}
                      className="w-full text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Tandai Semua Sudah Dibaca
                    </Button>
                  </div>
                )}
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AgentNotificationBell;