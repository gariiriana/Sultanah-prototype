import { useState, useEffect } from 'react';
// import { Card, CardContent } from '../../components/ui/card'; // ❌ REMOVED: Unused imports
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import PackageManagement from './components/PackageManagement';
import UserManagementNew from './components/UserManagementNew';
import EducationManagement from './components/EducationManagement';

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
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminTopbar from '../../components/admin/AdminTopbar';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('packages');
  const [stats, setStats] = useState({
    totalUsers: 0,
    activePackages: 0,
    netFlow: 0,
    totalEducation: 0,

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

  // ❌ REMOVED: unused statCards variable

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-[#FFF9F0]/30">
      {/* Sidebar */}
      <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 transition-all duration-300">
        {/* Top Navbar with Stats */}
        <AdminTopbar
          pageTitle={activeTab === 'packages' ? 'Manajemen Paket' :
            activeTab === 'payments' ? 'Manajemen Pembayaran' :
              activeTab === 'upgrade-requests' ? 'Permintaan Upgrade' :
                activeTab === 'users' ? 'Manajemen Pengguna' :
                  activeTab === 'education' ? 'Manajemen Edukasi' :
                    activeTab === 'articles' ? 'Manajemen Artikel' :
                      activeTab === 'itineraries' ? 'Manajemen Jadwal Pemberangkatan' :
                        activeTab === 'item-requests' ? 'Pesanan Marketplace' : // ✅ RENAMED: Only Marketplace Orders
                          activeTab === 'marketplace' ? 'Manajemen Marketplace' :
                            activeTab === 'referrals' ? 'Referral & Voucher Program' :
                              activeTab === 'commission-withdrawals' ? 'Pencairan Profit' :
                                activeTab === 'savings-approval' ? 'Tabungan' : // Updated title
                                  'Dashboard'}
          pageSubtitle="Kelola bisnis perjalanan Anda dengan mudah"
          stats={stats}
          onNotificationClick={(type, _itemId) => {
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