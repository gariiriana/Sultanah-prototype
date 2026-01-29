import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // ✅ NEW: For navigation
import { Bell, Search, Users, Package, BookOpen, Tag, CreditCard, Newspaper, Calendar, X, AlertCircle, Clock, FileText, CheckCircle, Store, Gift, ShoppingCart } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { motion, AnimatePresence } from 'motion/react';

interface PendingItem {
  id: string;
  type: 'payment' | 'marketplace-payment' | 'marketplace-order' | 'withdrawal' | 'article' | 'user' | 'upgrade';
  title: string;
  description: string;
  amount?: number;
  timestamp: any;
  link?: string;
}

interface StatCard {
  title: string;
  value: string | number;
  icon: React.ElementType;
  gradient: string;
  iconBg: string;
}

interface AdminTopbarProps {
  pageTitle: string;
  pageSubtitle?: string;
  stats?: {
    totalUsers: number;
    activePackages: number;
    netFlow: number;
    totalEducation: number;
    totalPromos: number;
    totalArticles: number;
    totalItineraries: number;
    totalMarketplaceItems: number;
    totalReferrals: number;
    // ❌ REMOVED: totalItemRequests - Card sudah dihapus
  };
  onNotificationClick?: (type: 'payment' | 'booking' | 'request', itemId?: string) => void;
}

const AdminTopbar: React.FC<AdminTopbarProps> = ({ pageTitle, pageSubtitle, stats, onNotificationClick }) => {
  const { userProfile } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [totalPending, setTotalPending] = useState(0);
  const navigate = useNavigate(); // ✅ NEW: For navigation

  // ✅ FIXED: Real-time listeners for ALL pending items from multiple sources
  useEffect(() => {
    const unsubscribers: Array<() => void> = [];

    // Helper cache to store pending items from different sources
    const pendingItemsCache: Record<string, PendingItem[]> = {
      payments: [],
      marketplacePayments: [],
      withdrawals: [],
      articles: [],
      users: [],
      upgrades: []
    };

    // Helper function to merge pending items from different sources
    function updatePendingItems(source: string, items: PendingItem[]) {
      pendingItemsCache[source] = items;
      
      // Merge all pending items
      const allItems = [
        ...pendingItemsCache.payments,
        ...pendingItemsCache.marketplacePayments,
        ...pendingItemsCache.withdrawals,
        ...pendingItemsCache.articles,
        ...pendingItemsCache.users,
        ...pendingItemsCache.upgrades
      ];
      
      // Sort by timestamp (newest first)
      allItems.sort((a, b) => {
        const dateA = a.timestamp?.toDate?.() || new Date(a.timestamp || 0);
        const dateB = b.timestamp?.toDate?.() || new Date(b.timestamp || 0);
        return dateB.getTime() - dateA.getTime();
      });
      
      setPendingItems(allItems);
      setTotalPending(allItems.length);
      
      console.log('✅ Pending items updated:', {
        payments: pendingItemsCache.payments.length,
        marketplacePayments: pendingItemsCache.marketplacePayments.length,
        withdrawals: pendingItemsCache.withdrawals.length,
        articles: pendingItemsCache.articles.length,
        users: pendingItemsCache.users.length,
        upgrades: pendingItemsCache.upgrades.length,
        total: allItems.length
      });
    }

    // 1️⃣ PEMBAYARAN PAKET UMROH (pending)
    const paymentsQuery = query(
      collection(db, 'payments'),
      where('status', '==', 'pending')
    );
    const unsubPayments = onSnapshot(
      paymentsQuery,
      (snapshot) => {
        const payments: PendingItem[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            type: 'payment' as const,
            title: `Payment ${data.paymentNumber || 'N/A'}`,
            description: `${data.userName || 'Unknown'} - Rp ${data.amount?.toLocaleString('id-ID') || '0'}`,
            amount: data.amount,
            timestamp: data.submittedAt,
            link: '/admin/payment-management'
          };
        });
        
        // Merge with other pending items
        updatePendingItems('payments', payments);
      },
      (error) => {
        if (error.code !== 'unavailable' && !error.message.includes('transport')) {
          console.error('Payments listener error:', error);
        }
      }
    );
    unsubscribers.push(unsubPayments);

    // 2️⃣ PEMBAYARAN MARKETPLACE (pending)
    const marketplacePaymentsQuery = query(
      collection(db, 'marketplaceOrders'),
      where('status', '==', 'pending')
    );
    const unsubMarketplacePayments = onSnapshot(
      marketplacePaymentsQuery,
      (snapshot) => {
        const marketplacePayments: PendingItem[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            type: 'marketplace-payment' as const,
            title: `Marketplace Order ${data.orderNumber || 'N/A'}`,
            description: `${data.userName || 'Unknown'} - Rp ${data.totalAmount?.toLocaleString('id-ID') || '0'}`,
            amount: data.totalAmount,
            timestamp: data.createdAt,
            link: '/admin/marketplace-orders'
          };
        });
        
        updatePendingItems('marketplacePayments', marketplacePayments);
      },
      (error) => {
        if (error.code !== 'unavailable' && !error.message.includes('transport')) {
          console.error('Marketplace payments listener error:', error);
        }
      }
    );
    unsubscribers.push(unsubMarketplacePayments);

    // 3️⃣ WITHDRAWAL KOMISI (pending or not paid)
    const withdrawalsQuery = query(
      collection(db, 'commissionWithdrawals'), // ✅ FIXED: Changed from 'withdrawals' to 'commissionWithdrawals'
      where('status', 'in', ['pending', 'requested'])
    );
    const unsubWithdrawals = onSnapshot(
      withdrawalsQuery,
      (snapshot) => {
        const withdrawals: PendingItem[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            type: 'withdrawal' as const,
            title: `Withdrawal Request`,
            description: `${data.userName || data.userEmail || 'Unknown'} - Rp ${data.amount?.toLocaleString('id-ID') || '0'}`,
            amount: data.amount,
            timestamp: data.createdAt || data.requestedAt || data.requestDate, // ✅ FIXED: Added requestDate
            link: '/admin/commission-withdrawals' // ✅ FIXED: Changed from referral-program to commission-withdrawals
          };
        });
        
        updatePendingItems('withdrawals', withdrawals);
      },
      (error) => {
        if (error.code !== 'unavailable' && !error.message.includes('transport')) {
          console.error('Withdrawals listener error:', error);
        }
      }
    );
    unsubscribers.push(unsubWithdrawals);

    // 4️⃣ ARTIKEL (draft or pending)
    const articlesQuery = query(
      collection(db, 'articles'),
      where('status', 'in', ['draft', 'pending'])
    );
    const unsubArticles = onSnapshot(
      articlesQuery,
      (snapshot) => {
        const articles: PendingItem[] = snapshot.docs.map(doc => {
          const data = doc.data();
          // ✅ FIX: Use correct author structure from articles collection
          const authorName = data.author?.name || data.authorName || 'Unknown';
          return {
            id: doc.id,
            type: 'article' as const,
            title: `Article: ${data.title || 'Untitled'}`,
            description: `By ${authorName} - ${data.status || 'draft'}`,
            timestamp: data.createdAt,
            link: '/admin/artikel'
          };
        });
        
        updatePendingItems('articles', articles);
      },
      (error) => {
        if (error.code !== 'unavailable' && !error.message.includes('transport')) {
          console.error('Articles listener error:', error);
        }
      }
    );
    unsubscribers.push(unsubArticles);

    // 5️⃣ USERS (pending approval)
    const usersQuery = query(
      collection(db, 'users'),
      where('isApproved', '==', false)
    );
    const unsubUsers = onSnapshot(
      usersQuery,
      (snapshot) => {
        const users: PendingItem[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            type: 'user' as const,
            title: `User Registration`,
            description: `${data.displayName || data.email || 'Unknown'} - ${data.role || 'user'}`,
            timestamp: data.createdAt,
            link: '/admin/users'
          };
        });
        
        updatePendingItems('users', users);
      },
      (error) => {
        if (error.code !== 'unavailable' && !error.message.includes('transport')) {
          console.error('Users listener error:', error);
        }
      }
    );
    unsubscribers.push(unsubUsers);

    // 6️⃣ UPGRADE REQUESTS (Calon Jamaah → Jamaah)
    const upgradesQuery = query(
      collection(db, 'upgradeRequests'),
      where('status', '==', 'pending')
    );
    const unsubUpgrades = onSnapshot(
      upgradesQuery,
      (snapshot) => {
        const upgrades: PendingItem[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            type: 'upgrade' as const,
            title: `Upgrade Request`,
            description: `${data.userName || 'Unknown'}: ${data.fromRole || 'Calon'} → ${data.toRole || 'Jamaah'}`,
            timestamp: data.createdAt,
            link: '/admin/users'
          };
        });
        
        updatePendingItems('upgrades', upgrades);
      },
      (error) => {
        if (error.code !== 'unavailable' && !error.message.includes('transport')) {
          console.error('Upgrades listener error:', error);
        }
      }
    );
    unsubscribers.push(unsubUpgrades);

    // Cleanup all listeners
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return CreditCard;
      case 'marketplace-payment':
      case 'marketplace-order':
        return ShoppingCart;
      case 'withdrawal':
        return Gift;
      case 'article':
        return Newspaper;
      case 'user':
        return Users;
      case 'upgrade':
        return Package;
      case 'booking':
        return Package;
      case 'request':
        return FileText;
      default:
        return AlertCircle;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'payment':
        return 'bg-green-100 text-green-700';
      case 'marketplace-payment':
      case 'marketplace-order':
        return 'bg-purple-100 text-purple-700';
      case 'withdrawal':
        return 'bg-yellow-100 text-yellow-700';
      case 'article':
        return 'bg-gray-100 text-gray-700';
      case 'user':
        return 'bg-blue-100 text-blue-700';
      case 'upgrade':
        return 'bg-indigo-100 text-indigo-700';
      case 'booking':
        return 'bg-blue-100 text-blue-700';
      case 'request':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // ✅ NEW: Navigation handler for each notification type
  const handleNotificationClick = (item: PendingItem) => {
    console.log('🔔 Notification clicked:', item.type, item.id);
    
    setShowNotifications(false);
    
    // Navigate based on item type
    switch (item.type) {
      case 'payment':
        // Pembayaran Umroh → Payment Management page
        navigate('/admin/payment-management');
        console.log('→ Navigating to Payment Management');
        break;
        
      case 'marketplace-payment':
      case 'marketplace-order':
        // Marketplace Order → Marketplace Orders page
        navigate('/admin/marketplace-orders');
        console.log('→ Navigating to Marketplace Orders');
        break;
        
      case 'withdrawal':
        // Withdrawal → Commission Withdrawals page
        navigate('/admin/commission-withdrawals'); // ✅ FIXED: Changed from referral-program to commission-withdrawals
        console.log('→ Navigating to Commission Withdrawals');
        break;
        
      case 'article':
        // Article → Artikel page
        navigate('/admin/artikel');
        console.log('→ Navigating to Artikel');
        break;
        
      case 'user':
      case 'upgrade':
        // User registration or upgrade → Users page
        navigate('/admin/users');
        console.log('→ Navigating to Users');
        break;
        
      default:
        // Fallback to item.link if provided
        if (item.link) {
          navigate(item.link);
          console.log('→ Navigating to:', item.link);
        } else {
          console.warn('No navigation route for type:', item.type);
        }
    }
    
    // Also call optional callback if provided
    if (onNotificationClick) {
      onNotificationClick(item.type as any, item.id);
    }
  };

  // Default stats if not provided
  const statsData = stats || {
    totalUsers: 0,
    activePackages: 0,
    netFlow: 0,
    totalEducation: 0,
    totalPromos: 0,
    totalArticles: 0,
    totalItineraries: 0,
    totalMarketplaceItems: 0,
    totalReferrals: 0,
    // ❌ REMOVED: totalItemRequests - Card sudah dihapus
  };

  const statCards: StatCard[] = [
    {
      title: 'Total Users',
      value: statsData.totalUsers,
      icon: Users,
      gradient: 'from-blue-500 to-blue-600',
      iconBg: 'from-blue-100 to-blue-200'
    },
    {
      title: 'Active Packages',
      value: statsData.activePackages,
      icon: Package,
      gradient: 'from-green-500 to-emerald-600',
      iconBg: 'from-green-100 to-emerald-200'
    },
    {
      title: 'Net Flow',
      value: `Rp ${statsData.netFlow.toLocaleString('id-ID')}`,
      icon: CreditCard,
      gradient: 'from-purple-500 to-purple-600',
      iconBg: 'from-purple-100 to-purple-200'
    },
    {
      title: 'Total Education',
      value: statsData.totalEducation,
      icon: BookOpen,
      gradient: 'from-orange-500 to-orange-600',
      iconBg: 'from-orange-100 to-orange-200'
    },
    {
      title: 'Total Promos',
      value: statsData.totalPromos,
      icon: Tag,
      gradient: 'from-pink-500 to-pink-600',
      iconBg: 'from-pink-100 to-pink-200'
    },
    {
      title: 'Total Articles',
      value: statsData.totalArticles,
      icon: Newspaper,
      gradient: 'from-gray-500 to-gray-600',
      iconBg: 'from-gray-100 to-gray-200'
    },
    {
      title: 'Total Itineraries',
      value: statsData.totalItineraries,
      icon: Calendar,
      gradient: 'from-indigo-500 to-indigo-600',
      iconBg: 'from-indigo-100 to-indigo-200'
    },
    {
      title: 'Total Marketplace Items',
      value: statsData.totalMarketplaceItems,
      icon: Store,
      gradient: 'from-red-500 to-red-600',
      iconBg: 'from-red-100 to-red-200'
    },
    {
      title: 'Total Referrals',
      value: statsData.totalReferrals,
      icon: Gift,
      gradient: 'from-yellow-500 to-yellow-600',
      iconBg: 'from-yellow-100 to-yellow-200'
    },
    // ❌ REMOVED: Card "Total Item Requests" - tidak diperlukan lagi
  ];

  return (
    <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-xl border-b border-gray-200 shadow-sm">
      {/* Top Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          {/* Page Title */}
          <div>
            <h1 className="text-2xl font-bold">
              <span className="bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#D4AF37] bg-clip-text text-transparent">
                {pageTitle}
              </span>
            </h1>
            {pageSubtitle && (
              <p className="text-sm text-gray-500 mt-1">{pageSubtitle}</p>
            )}
          </div>

          {/* Right Section - Search & Notifications */}
          <div className="flex items-center gap-3">
            {/* Search Bar - Hidden on mobile */}
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl border border-gray-200 hover:border-[#D4AF37]/30 transition-colors">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400 w-48"
              />
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 group ${
                  totalPending > 0 
                    ? 'bg-red-50 hover:bg-red-100 border-2 border-red-200' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <Bell className={`w-5 h-5 transition-colors ${
                  totalPending > 0 
                    ? 'text-red-600 group-hover:text-red-700' 
                    : 'text-gray-600 group-hover:text-[#D4AF37]'
                }`} />
                {/* Notification Badge */}
                {totalPending > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center"
                  >
                    <span className="text-[10px] font-bold text-white">{totalPending}</span>
                  </motion.span>
                )}
              </button>

              {/* Notification Dropdown */}
              <AnimatePresence>
                {showNotifications && (
                  <>
                    {/* Backdrop */}
                    <div 
                      className="fixed inset-0 z-30" 
                      onClick={() => setShowNotifications(false)}
                    />
                    
                    {/* Notification Panel */}
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 top-12 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-40"
                    >
                      {/* Header */}
                      <div className="bg-gradient-to-r from-red-500 to-red-600 px-5 py-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-bold text-white text-lg">Pending Approvals</h3>
                            <p className="text-red-100 text-xs mt-0.5">Items that need your attention</p>
                          </div>
                          <button
                            onClick={() => setShowNotifications(false)}
                            className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                          >
                            <X className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="max-h-[400px] overflow-y-auto notification-scrollbar">
                        {pendingItems.length === 0 ? (
                          <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                              <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <p className="font-semibold text-gray-900 mb-1">All Caught Up!</p>
                            <p className="text-sm text-gray-500">No pending items require your attention</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-100">
                            {pendingItems.map((item, index) => {
                              const TypeIcon = getTypeIcon(item.type);
                              return (
                                <motion.button
                                  key={item.id}
                                  type="button"
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleNotificationClick(item);
                                  }}
                                  className="flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors cursor-pointer group w-full text-left"
                                >
                                  <div className={`w-10 h-10 rounded-xl ${getTypeColor(item.type)} flex items-center justify-center flex-shrink-0`}>
                                    <TypeIcon className="w-5 h-5" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-900 text-sm mb-1 group-hover:text-red-600 transition-colors">
                                      {item.title}
                                    </p>
                                    <p className="text-xs text-gray-600 mb-2">
                                      {item.description}
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <Clock className="w-3 h-3 text-gray-400" />
                                      <span className="text-xs text-gray-500">{formatDate(item.timestamp)}</span>
                                    </div>
                                  </div>
                                  <div className="flex-shrink-0">
                                    <div className="w-2 h-2 bg-red-500 rounded-full group-hover:scale-125 transition-transform" />
                                  </div>
                                </motion.button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      {pendingItems.length > 0 && (
                        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
                          <a
                            href="/admin/payment-management"
                            onClick={() => setShowNotifications(false)}
                            className="text-sm font-semibold text-red-600 hover:text-red-700 transition-colors flex items-center justify-center gap-2"
                          >
                            View All Pending Items
                            <AlertCircle className="w-4 h-4" />
                          </a>
                        </div>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* User Avatar */}
            <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-[#D4AF37]/10 to-[#FFD700]/10 rounded-xl border border-[#D4AF37]/20">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#FFD700] flex items-center justify-center text-white font-bold text-sm">
                {userProfile?.name?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-gray-800 leading-tight">
                  {userProfile?.name || 'Admin'}
                </p>
                <p className="text-xs text-gray-500 capitalize leading-tight">
                  {userProfile?.role || 'admin'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-6 py-4 bg-gradient-to-br from-gray-50/50 to-white border-b border-gray-100">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-10 gap-3">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="group relative overflow-hidden rounded-xl bg-white border border-gray-200 hover:border-[#D4AF37]/40 transition-all duration-200 hover:shadow-md cursor-pointer"
              >
                {/* Gradient Background - appears on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-3 transition-opacity duration-200`} />
                
                <div className="relative p-3.5">
                  <div className="flex items-center gap-3 mb-2">
                    {/* Icon */}
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${stat.iconBg} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200`}>
                      <Icon className="w-4.5 h-4.5" style={{ 
                        color: stat.gradient === 'from-blue-500 to-blue-600' ? '#3B82F6' :
                               stat.gradient === 'from-green-500 to-emerald-600' ? '#10B981' :
                               stat.gradient === 'from-purple-500 to-purple-600' ? '#A855F7' :
                               stat.gradient === 'from-orange-500 to-orange-600' ? '#F97316' :
                               stat.gradient === 'from-pink-500 to-pink-600' ? '#EC4899' :
                               stat.gradient === 'from-gray-500 to-gray-600' ? '#6B7280' :
                               stat.gradient === 'from-indigo-500 to-indigo-600' ? '#6366F1' :
                               '#D4AF37'
                      }} />
                    </div>
                  </div>
                  
                  {/* Text */}
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1.5 leading-tight">{stat.title}</p>
                    <p className={`text-lg font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-200 inline-block leading-tight`}>
                      {stat.value}
                    </p>
                  </div>
                  
                  {/* Bottom accent line */}
                  <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${stat.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left`} />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminTopbar;