import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import UserLayout from './pages/user/UserLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import TourLeaderDashboard from './pages/tour-leader/TourLeaderDashboard';
import TourLeaderProfilePage from './pages/tour-leader/TourLeaderProfilePage'; // ✅ NEW - Tour Leader Profile
import MuthawifDashboard from './pages/muthawif/MuthawifDashboard'; // ✅ UPDATED
import MuthawifProfileForm from './pages/muthawif/MuthawifProfileForm'; // ✅ NEW
import ProspectiveJamaahDashboard from './pages/prospective-jamaah/ProspectiveJamaahDashboard'; // ✅ NEW
import CurrentJamaahDashboard from './pages/current-jamaah/CurrentJamaahDashboardNew'; // ✅ NEW
import AlumniDashboardContainer from './pages/alumni/AlumniDashboardContainer'; // ✅ UPDATED - Portal + Routing
import AlumniReferralDashboard from './pages/alumni/AlumniReferralDashboard'; // ✅ NEW - Referral System
import JamaahItineraryPage from './pages/jamaah/JamaahItineraryPage'; // ✅ NEW - Itinerary Page
import JamaahMarketplacePage from './pages/jamaah/JamaahMarketplacePage'; // ✅ NEW - Marketplace Page
import MarketplaceCheckout from './pages/jamaah/MarketplaceCheckout'; // ✅ NEW - Marketplace Checkout
import GuestGallery from './pages/guest/GuestGallery'; // ✅ NEW - Guest Gallery
import FamilyTrackingPage from './pages/guest/FamilyTrackingPage'; // ✅ NEW - Family Tracking Page
import SavingsManagement from './pages/current-jamaah/SavingsManagement'; // ✅ UPDATED
// ❌ REMOVED: MarketplaceOrderTracking - Now using unified PesananPage instead
import PesananPage from './pages/current-jamaah/PesananPage'; // ✅ NEW - Unified Pesanan Page (Payments + Marketplace)
import AffiliatorDashboard from './pages/affiliator/AffiliatorDashboardNew'; // ✅ NEW - Premium Affiliator Dashboard
import AgentProfilePage from './pages/agent/AgentProfilePage'; // ✅ NEW - Agent Profile
import { LoginPage, RegisterPage } from './pages/auth'; // ✅ Centralized import
import WaitingApprovalPage from './pages/auth/WaitingApprovalPage'; // ✅ NEW - Waiting Approval Page
import BookingFlow from './pages/booking/BookingFlow'; // ✅ NEW: Booking Flow Component
import ProfilePage from './pages/user/ProfilePage';
import ReviewPage from './pages/user/ReviewPage';
import PackageReviewsPage from './pages/user/PackageReviewsPage';
import TestimonialFormPage from './pages/user/TestimonialFormPage';

// Wrapper component to use navigate inside Routes
const AppRoutes = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleLoginSuccess = () => {
    // After successful login, navigate to home (role-based routing will handle)
    navigate('/');
  };

  const handleRegisterSuccess = () => {
    // After successful register, navigate to home (role-based routing will handle)
    navigate('/');
  };

  return (
    <Routes>
      {/* Auth Routes - Public */}
      <Route path="/login" element={
        currentUser ? (
          <Navigate to="/" replace />
        ) : (
          <LoginPage
            onNavigateToRegister={() => navigate('/register')}
            onLoginSuccess={handleLoginSuccess}
            onBackToDashboard={() => navigate('/')}
          />
        )
      } />

      <Route path="/register" element={
        currentUser ? (
          <Navigate to="/" replace />
        ) : (
          <RegisterPage
            onNavigateToLogin={() => navigate('/login')}
            onRegisterSuccess={handleRegisterSuccess}
            onBackToDashboard={() => navigate('/')}
          />
        )
      } />

      {/* User Routes */}
      <Route path="/" element={
        <UserLayout
          onShowProfile={() => {
            if (currentUser) {
              navigate('/profile');
            } else {
              navigate('/login');
            }
          }}
          onShowAuth={(tab) => navigate(tab === 'register' ? '/register' : '/login')}
        />
      } />

      {/* Protected Routes - Require Auth */}
      <Route path="/profile" element={
        currentUser ? (
          <ProfilePage onBack={() => window.history.back()} />
        ) : (
          <Navigate to="/login" replace />
        )
      } />

      <Route path="/review/:packageId" element={
        currentUser ? (
          <ReviewPage />
        ) : (
          <Navigate to="/login" replace />
        )
      } />

      <Route path="/create-testimonial" element={
        currentUser ? (
          <TestimonialFormPage onBack={() => navigate('/')} />
        ) : (
          <Navigate to="/login" replace />
        )
      } />

      {/* ✅ NEW: Waiting Approval Route - Public (no auth required) */}
      <Route path="/waiting-approval" element={<WaitingApprovalPage />} />

      {/* Public Routes */}
      <Route path="/package-reviews/:packageId" element={<PackageReviewsPage />} />
      <Route path="/gallery" element={<GuestGallery />} /> {/* ✅ NEW: Public Gallery */}
      <Route path="/family-tracking" element={<FamilyTrackingPage />} /> {/* ✅ NEW: Family Tracking */}
      <Route path="/booking/:packageId" element={<BookingFlow />} /> {/* ✅ NEW: Booking Flow Route */}

      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Main AppContent component
const AppContent = () => {
  const { isAdmin, isManagement, loading, currentUser, userProfile } = useAuth(); // ✅ Added isManagement

  // ✅ HOOKS MUST BE AT TOP LEVEL - BEFORE ANY EARLY RETURN!
  React.useEffect(() => {
    if (currentUser && userProfile) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔀 ROUTING DECISION:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 Email:', userProfile.email);
      console.log('👤 Role:', userProfile.role);
      console.log('👤 Role Type:', typeof userProfile.role);
      console.log('✅ Approval Status:', userProfile.approvalStatus || 'N/A');
      console.log('🔑 isAdmin:', isAdmin);
      console.log('👔 isManagement:', isManagement);
      console.log('🔍 Management check array:', ['staff', 'admin', 'supervisor', 'direktur']);
      console.log('🔍 Is role in array?', ['staff', 'admin', 'supervisor', 'direktur'].includes(userProfile.role));

      // Determine destination
      let destination = 'USER INTERFACE';
      if (isManagement) {
        destination = 'ADMIN DASHBOARD';
      } else if (userProfile.role === 'tour-leader' && userProfile.approvalStatus === 'approved') {
        destination = 'TOUR LEADER DASHBOARD';
      } else if (userProfile.role === 'mutawwif' && userProfile.approvalStatus === 'approved') {
        destination = 'MUTAWWIF DASHBOARD';
      } else if (userProfile.role === 'prospective-jamaah') {
        destination = 'PROSPECTIVE JAMAAH DASHBOARD';
      } else if (userProfile.role === 'current-jamaah') {
        destination = 'CURRENT JAMAAH DASHBOARD';
      } else if (userProfile.role === 'alumni') {
        destination = 'ALUMNI DASHBOARD';
      } else if (userProfile.role === 'brand_ambassador' || userProfile.role === 'agen') {
        destination = 'BRAND AMBASSADOR DASHBOARD';
      }

      console.log('🎯 Destination:', destination);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      if (userProfile.email === 'adminSultanah@gmail.com' && !isAdmin) {
        console.error('❌ CRITICAL: Admin email detected but isAdmin = false!');
        console.error('   Check role in Firestore - should be "admin" (lowercase)');
        console.error('   Current role:', userProfile.role);
      }
    }
  }, [currentUser, userProfile, isAdmin, isManagement]);

  // Show loading while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-gray-50 to-[#D4AF37]/5">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // ✅ ROUTING LOGIC:
  // 1. Management roles (admin, staff, supervisor, direktur) → Admin Dashboard
  // 2. Tour Leader (approved) → Tour Leader Dashboard / (pending) → Waiting Approval
  // 3. Mutawwif (approved) → Mutawwif Dashboard / (pending) → Waiting Approval
  // 4. Agen (approved) → Agent Dashboard / (pending) → Waiting Approval
  // 5. Prospective Jamaah → Prospective Jamaah Dashboard
  // 6. Current Jamaah → Current Jamaah Dashboard
  // 7. Alumni → Alumni Dashboard
  // 8. Not logged in → User Layout

  // 🔒 CRITICAL: Admin/Management MUST ALWAYS stay in Admin Dashboard
  // This check MUST be first to prevent accidental redirects
  const shouldStayInAdminDashboard = isManagement;

  // Wrap everything with BrowserRouter
  return (
    <BrowserRouter>
      {/* ✅ ALLOW BOOKING & PUBLIC PAGES TO RENDER WITHOUT REDIRECT */}
      {(window.location.pathname.startsWith('/booking') || window.location.pathname.startsWith('/gallery') || window.location.pathname.startsWith('/family-tracking')) ? (
        <AppRoutes />
      ) : shouldStayInAdminDashboard ? (
        <>
          {console.log('✅ ROUTING: Management role detected → Admin Dashboard')}
          {console.log('📋 Management roles: admin, staff, supervisor, direktur')}
          {console.log('🔒 LOCKED: Admin will ALWAYS stay in Admin Dashboard')}
          <AdminDashboard />
        </>
      ) : userProfile?.role === 'tour-leader' ? (
        userProfile?.approvalStatus === 'approved' ? (
          <>
            {console.log('✅ Rendering Tour Leader Dashboard')}
            <Routes>
              <Route path="/" element={<TourLeaderDashboard />} />
              <Route path="/tour-leader-profile" element={<TourLeaderProfilePage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </>
        ) : (
          <>
            {console.log('⏳ Tour Leader pending approval → Waiting Approval Page')}
            {console.log('🔒 PERSISTING on Waiting Approval - NO AUTO REDIRECT')}
            <WaitingApprovalPage />
          </>
        )
      ) : userProfile?.role === 'mutawwif' ? (
        userProfile?.approvalStatus === 'approved' ? (
          <>
            {console.log('✅ Rendering Muthawif Dashboard')}
            <Routes>
              <Route path="/" element={<MuthawifDashboard />} />
              <Route path="/muthawif-profile" element={<MuthawifProfileForm />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </>
        ) : (
          <>
            {console.log('⏳ Muthawif pending approval → Waiting Approval Page')}
            {console.log('🔒 PERSISTING on Waiting Approval - NO AUTO REDIRECT')}
            <WaitingApprovalPage />
          </>
        )
      ) : userProfile?.role === 'prospective-jamaah' ? (
        <>
          {console.log('✅ Rendering Prospective Jamaah Dashboard')}
          <ProspectiveJamaahDashboard />
        </>
      ) : userProfile?.role === 'current-jamaah' ? (
        <>
          {console.log('✅ Rendering Current Jamaah Dashboard with Routes')}
          <Routes>
            <Route path="/" element={<CurrentJamaahDashboard />} />
            <Route path="/itinerary" element={<JamaahItineraryPage />} />
            <Route path="/marketplace" element={<JamaahMarketplacePage />} />
            <Route path="/marketplace/checkout" element={<MarketplaceCheckout />} />
            <Route path="/tabungan" element={<SavingsManagement onBack={() => window.history.back()} />} />
            <Route path="/pesanan" element={<PesananPage onBack={() => window.history.back()} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </>
      ) : userProfile?.role === 'alumni' ? (
        <>
          {console.log('✅ Rendering Alumni Dashboard')}
          <Routes>
            <Route path="/" element={<AlumniDashboardContainer />} />
            <Route path="/referral" element={<AlumniReferralDashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </>
      ) : userProfile?.role === 'affiliator' ? (
        <>
          {console.log('✅ Rendering Affiliator Dashboard (NO APPROVAL REQUIRED)')}
          <Routes>
            <Route path="/" element={<Navigate to="/agent/dashboard" replace />} />
            <Route path="/agent/dashboard" element={<AffiliatorDashboard />} />
            <Route path="/agent/profile" element={<AgentProfilePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </>
      ) : (userProfile?.role === 'brand_ambassador' || userProfile?.role === 'agen' || userProfile?.role === 'influencer') ? (
        userProfile?.approvalStatus === 'approved' ? (
          <>
            {console.log('✅ Rendering Agent/Influencer Dashboard')}
            <Routes>
              <Route path="/" element={<Navigate to="/agent/dashboard" replace />} />
              <Route path="/agent/dashboard" element={<AffiliatorDashboard />} />
              <Route path="/agent/profile" element={<AgentProfilePage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </>
        ) : (
          <>
            {console.log('⏳ Pending approval → Waiting Approval Page')}
            {console.log('🔒 PERSISTING on Waiting Approval - NO AUTO REDIRECT')}
            <WaitingApprovalPage />
          </>
        )
      ) : (
        <AppRoutes />
      )}
    </BrowserRouter>
  );
};

AppContent.displayName = 'AppContent';

export default AppContent;