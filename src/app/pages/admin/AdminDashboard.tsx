import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Users, Package, BookOpen, Tag, CreditCard, Newspaper, Calendar, Store, Gift } from 'lucide-react'; // ❌ REMOVED: ShoppingCart - tidak ada card "Total Item Requests"
import { useAuth } from '../../../contexts/AuthContext';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import PackageManagement from './components/PackageManagement';
import UserManagementNew from './components/UserManagementNew';
import EducationManagement from './components/EducationManagement';
import PromoManagement from './components/PromoManagement';
import PaymentManagement from './PaymentManagement';
import ArticleManagement from './ArticleManagement';
import UpgradeRequestsManagement from './UpgradeRequestsManagement';
// ❌ REMOVED: AlumniUpgradeRequestsManagement - Alumni upgrade is now automatic
import AnnouncementManagement from './AnnouncementManagement';
import ItineraryManagement from './ItineraryManagement';
import AdminItemRequestsManager from './AdminItemRequestsManager'; // ✅ RESTORED: Menu Pesanan Marketplace
import MarketplaceManagement from './components/MarketplaceManagement'; // ✅ Marketplace
import AdminReferralManagement from './AdminReferralManagement'; // ✅ NEW: Referral Management
import CommissionWithdrawalManagement from './components/CommissionWithdrawalManagement'; // ✅ NEW: Commission Withdrawal
import SavingsApprovalPage from './SavingsApprovalPage'; // ✅ NEW: Savings Approval
import ReferralMigrationTool from './ReferralMigrationTool'; // ✅ NEW: Referral Migration Tool
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminTopbar from '../../components/admin/AdminTopbar';

const AdminDashboard = () => {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('packages');
  const [stats, setStats] = useState({
    totalUsers: 0,
    activePackages: 0,
    netFlow: 0,
    totalEducation: 0,
    totalPromos: 0,
    totalArticles: 0,
    totalItineraries: 0,
    totalMarketplaceItems: 0,
    totalReferrals: 0,
    // ❌ REMOVED: totalItemRequests - Permintaan Item Paket feature deleted
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch users count - Get ALL users first, then filter by role
        const usersSnapshot = await getDocs(collection(db, 'users'));

        // Debug: Log all users to check their role field
        console.log('🔍 All users in database:', usersSnapshot.size);
        usersSnapshot.forEach(doc => {
          const userData = doc.data();
          console.log('User:', doc.id, 'Role:', userData.role, 'Email:', userData.email);
        });

        // Count users with role 'USER' (case-insensitive check)
        let totalUsers = 0;
        usersSnapshot.forEach(doc => {
          const userData = doc.data();
          const userRole = userData.role?.toLowerCase();
          // Check if role is 'user' (case-insensitive) or if role doesn't exist but email is not admin
          if (userRole === 'user' || (!userData.role && !userData.email?.includes('admin'))) {
            totalUsers++;
          }
        });

        console.log('✅ Total USER role count:', totalUsers);

        // Fetch active packages count
        const packagesQuery = query(collection(db, 'packages'), where('status', '==', 'active'));
        const packagesSnapshot = await getDocs(packagesQuery);
        const activePackages = packagesSnapshot.size;

        // Fetch approved payments and calculate net flow
        let netFlow = 0;
        try {
          const paymentsSnapshot = await getDocs(collection(db, 'payments'));
          paymentsSnapshot.forEach(doc => {
            const payment = doc.data();
            if (payment.status === 'approved' && payment.amount) {
              netFlow += parseFloat(payment.amount) || 0;
            }
          });
        } catch (paymentError: any) {
          console.warn('Could not fetch payments:', paymentError?.code);
        }

        // Fetch education count
        let totalEducation = 0;
        try {
          const educationSnapshot = await getDocs(collection(db, 'education'));
          totalEducation = educationSnapshot.size;
        } catch (educationError: any) {
          console.warn('Could not fetch education:', educationError?.code);
        }

        // Fetch promos count
        let totalPromos = 0;
        try {
          const promosSnapshot = await getDocs(collection(db, 'promos'));
          totalPromos = promosSnapshot.size;
        } catch (promoError: any) {
          console.warn('Could not fetch promos:', promoError?.code);
        }

        // Fetch articles count
        let totalArticles = 0;
        try {
          const articlesSnapshot = await getDocs(collection(db, 'articles'));
          totalArticles = articlesSnapshot.size;
        } catch (articleError: any) {
          console.warn('Could not fetch articles:', articleError?.code);
        }

        // Fetch itineraries count
        let totalItineraries = 0;
        try {
          const itinerariesSnapshot = await getDocs(collection(db, 'itineraries'));
          totalItineraries = itinerariesSnapshot.size;
        } catch (itineraryError: any) {
          console.warn('Could not fetch itineraries:', itineraryError?.code);
        }

        // Fetch marketplace items count
        let totalMarketplaceItems = 0;
        try {
          const marketplaceSnapshot = await getDocs(collection(db, 'marketplaceItems'));
          totalMarketplaceItems = marketplaceSnapshot.size;
        } catch (marketplaceError: any) {
          console.warn('Could not fetch marketplace items:', marketplaceError?.code);
        }

        // Fetch referrals count
        let totalReferrals = 0;
        try {
          const referralsSnapshot = await getDocs(collection(db, 'referrals'));
          totalReferrals = referralsSnapshot.size;
        } catch (referralError: any) {
          console.warn('Could not fetch referrals:', referralError?.code);
        }

        setStats({
          totalUsers,
          activePackages,
          netFlow,
          totalEducation,
          totalPromos,
          totalArticles,
          totalItineraries,
          totalMarketplaceItems,
          totalReferrals,
        });
      } catch (error: any) {
        console.error('Error fetching stats:', error);
        // Silent fail - keep default stats at 0
        // This can happen if rules haven't propagated yet or user isn't fully initialized
        if (error?.code === 'permission-denied') {
          console.warn('⚠️ Stats fetch blocked by Firestore rules. Ensure user is admin and rules are published.');
        }
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Total Pengguna',
      value: stats.totalUsers,
      icon: Users,
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100',
      iconBg: 'from-blue-100 to-blue-200',
    },
    {
      title: 'Paket Aktif',
      value: stats.activePackages,
      icon: Package,
      gradient: 'from-green-500 to-emerald-600',
      bgGradient: 'from-green-50 to-emerald-100',
      iconBg: 'from-green-100 to-emerald-200',
    },
    {
      title: 'Total Pemasukan',
      value: `Rp ${stats.netFlow.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      icon: CreditCard,
      gradient: 'from-purple-500 to-purple-600',
      bgGradient: 'from-purple-50 to-purple-100',
      iconBg: 'from-purple-100 to-purple-200',
    },
    {
      title: 'Total Edukasi',
      value: stats.totalEducation,
      icon: BookOpen,
      gradient: 'from-orange-500 to-orange-600',
      bgGradient: 'from-orange-50 to-orange-100',
      iconBg: 'from-orange-100 to-orange-200',
    },
    {
      title: 'Total Promo',
      value: stats.totalPromos,
      icon: Tag,
      gradient: 'from-pink-500 to-pink-600',
      bgGradient: 'from-pink-50 to-pink-100',
      iconBg: 'from-pink-100 to-pink-200',
    },
    {
      title: 'Total Artikel',
      value: stats.totalArticles,
      icon: Newspaper,
      gradient: 'from-gray-500 to-gray-600',
      bgGradient: 'from-gray-50 to-gray-100',
      iconBg: 'from-gray-100 to-gray-200',
    },
    {
      title: 'Total Itinerari',
      value: stats.totalItineraries,
      icon: Calendar,
      gradient: 'from-indigo-500 to-indigo-600',
      bgGradient: 'from-indigo-50 to-indigo-100',
      iconBg: 'from-indigo-100 to-indigo-200',
    },
    {
      title: 'Total Item Marketplace',
      value: stats.totalMarketplaceItems,
      icon: Store,
      gradient: 'from-cyan-500 to-cyan-600',
      bgGradient: 'from-cyan-50 to-cyan-100',
      iconBg: 'from-cyan-100 to-cyan-200',
    },
    {
      title: 'Total Referral',
      value: stats.totalReferrals,
      icon: Gift,
      gradient: 'from-amber-500 to-amber-600',
      bgGradient: 'from-amber-50 to-amber-100',
      iconBg: 'from-amber-100 to-amber-200',
    },
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-[#FFF9F0]/30">
      {/* Sidebar */}
      <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 transition-all duration-300">
        {/* Top Navbar with Stats */}
        <AdminTopbar
          pageTitle={activeTab === 'packages' ? 'Manajemen Paket' :
            activeTab === 'promos' ? 'Manajemen Promo' :
              activeTab === 'payments' ? 'Manajemen Pembayaran' :
                activeTab === 'upgrade-requests' ? 'Permintaan Upgrade' :
                  activeTab === 'users' ? 'Manajemen Pengguna' :
                    activeTab === 'education' ? 'Manajemen Edukasi' :
                      activeTab === 'articles' ? 'Manajemen Artikel' :
                        activeTab === 'itineraries' ? 'Manajemen Itinerari' :
                          activeTab === 'item-requests' ? 'Pesanan Marketplace' : // ✅ RENAMED: Only Marketplace Orders
                            activeTab === 'marketplace' ? 'Manajemen Marketplace' :
                              activeTab === 'referrals' ? 'Referral Management' :
                                activeTab === 'commission-withdrawals' ? 'Pencairan Komisi' :
                                  activeTab === 'savings-approval' ? 'Approval Tabungan' : // ✅ NEW
                                    'Dashboard'}
          pageSubtitle="Kelola bisnis perjalanan Anda dengan mudah"
          stats={stats}
          onNotificationClick={(type, itemId) => {
            // ✅ Navigate to correct tab based on notification type
            if (type === 'payment') {
              setActiveTab('payments');
            } else if (type === 'booking') {
              setActiveTab('packages');
            } else if (type === 'request') {
              setActiveTab('upgrade-requests');
            }
          }}
        />

        <div className="p-6">
          {/* Content Panel */}
          <div className="relative overflow-hidden rounded-2xl bg-white shadow-lg border border-gray-200">
            <div className="p-6">
              {activeTab === 'packages' && <PackageManagement />}
              {activeTab === 'promos' && <PromoManagement />}
              {activeTab === 'payments' && <PaymentManagement />}
              {activeTab === 'upgrade-requests' && <UpgradeRequestsManagement />}
              {/* ❌ REMOVED: Alumni upgrade is now automatic when tour leader completes trip */}
              {activeTab === 'users' && <UserManagementNew />}
              {activeTab === 'education' && <EducationManagement />}
              {activeTab === 'articles' && <ArticleManagement />}
              {activeTab === 'announcements' && <AnnouncementManagement />}
              {activeTab === 'itineraries' && <ItineraryManagement />}
              {activeTab === 'marketplace' && <MarketplaceManagement />} {/* ✅ Marketplace Management */}
              {activeTab === 'referrals' && <AdminReferralManagement />} {/* ✅ NEW: Referral Management */}
              {activeTab === 'commission-withdrawals' && <CommissionWithdrawalManagement />} {/* ✅ NEW: Commission Withdrawal */}
              {activeTab === 'savings-approval' && <SavingsApprovalPage />} {/* ✅ NEW: Savings Approval */}
              {activeTab === 'item-requests' && <AdminItemRequestsManager />} {/* ✅ RESTORED: Pesanan Marketplace */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;