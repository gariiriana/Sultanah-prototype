import React from 'react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import AppContent from './AppContent';
import ErrorBoundary from './components/ErrorBoundary';
import { Toaster } from 'sonner';
import { initializeAdmin, displayAdminCredentials } from '../utils/initAdmin';
import WhatsAppFloating from './components/WhatsAppFloating';
import FloatingAnnouncementWidget from './components/FloatingAnnouncementWidget';
import NetworkStatus from './components/NetworkStatus'; // ✅ NEW: Network status indicator
import '../utils/verifyAdminSystem'; // Make verifyAdminSystem() available in console
import '../utils/quickFixAdmin'; // Make quickFixAdminRole() available in console
import '../utils/suppressFirestoreWarnings'; // Suppress BloomFilter warnings
import '../utils/checkUserRole'; // Make checkUserRole() and updateUserRole() available in console
import '../utils/fixAgenApprovalStatus'; // Make fixAgenApprovalStatus() available in console
import '../utils/verifyReferralSetup'; // Make referral verification functions available in console
import '../utils/debugAlumniUpgrade'; // ✅ NEW: Make alumni upgrade debug functions available in console
import '../utils/oneClickAlumniFix'; // ✅ NEW: One-click fix for alumni testing

// Wrapper to access auth context
function AppWithWidgets() {
  const { userProfile } = useAuth();
  
  return (
    <>
      <AppContent />
      {/* Only render FloatingAnnouncementWidget when userProfile is loaded */}
      <FloatingAnnouncementWidget userRole={userProfile?.role || 'guest'} />
      {/* ✅ NEW: Network status indicator */}
      <NetworkStatus />
    </>
  );
}

export default function App() {
  // ✅ AUTO-FIX ADMIN on app load - NO MANUAL INTERVENTION NEEDED
  React.useEffect(() => {
    // Display helpful console commands
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🛠️  DEVELOPER TOOLS AVAILABLE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('✅ Firestore BloomFilter warnings: SUPPRESSED');
    console.log('   (Harmless cache optimization warnings are hidden)');
    console.log('');
    console.log('📌 Quick Fix Admin Role:');
    console.log('   quickFixAdminRole()   ← Fix admin role to lowercase');
    console.log('');
    console.log('📌 Verify Admin System:');
    console.log('   verifyAdminSystem()   ← Check admin setup');
    console.log('');
    console.log('📌 Check User Role (NEW):');
    console.log('   checkUserRole("user@example.com")   ← Check any user role');
    console.log('');
    console.log('📌 Update User Role (NEW):');
    console.log('   updateUserRole("user@example.com", "staff")   ← Change user role');
    console.log('   Valid roles: admin, staff, supervisor, direktur, tour-leader,');
    console.log('                mutawwif, agen, prospective-jamaah, current-jamaah, alumni');
    console.log('');
    console.log('📌 Fix Agen Approval Status (NEW):');
    console.log('   fixAgenApprovalStatus()   ← Set approval status for existing agen');
    console.log('   approveAgen(\"agen@gmail.com\")   ← Manually approve agen');
    console.log('   rejectAgen(\"agen@gmail.com\", \"reason\")   ← Manually reject agen');
    console.log('');
    console.log('📌 Verify Referral System (NEW):');
    console.log('   quickTestReferral()   ← Quick test with default code');
    console.log('   verifyReferralSetup("SULTANAH-AGT0027")   ← Test specific code');
    console.log('');
    console.log('📌 Alumni Upgrade Debug (NEW):');
    console.log('   debugAlumniSystem()   ← Check current user role & alumni status');
    console.log('   manualUpgradeToAlumni("USER_UID")   ← Manually upgrade user to alumni');
    console.log('   checkItineraries()   ← Check all itineraries completion status');
    console.log('   resetAgentUpgradeDialog()   ← Reset pop-up for current user');
    console.log('   quickUpgradeEko()   ← Quick upgrade Eko to alumni');
    console.log('');
    console.log('📌 One-Click Alumni Fix (RECOMMENDED):');
    console.log('   oneClickAlumniFix()   ← Auto upgrade Eko + logout + redirect');
    console.log('   verifyEkoStatus()     ← Verify Eko role & pop-up status');
    console.log('   manualLoginAsAlumni() ← Clear cache + reload (use after Firebase Console update)');
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎯 QUICK START (TEST ALUMNI → AGEN FLOW):');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('1. Run: oneClickAlumniFix()');
    console.log('2. Wait for auto-logout & redirect');
    console.log('3. Login as: eko@gmail.com');
    console.log('4. ✅ Pop-up "Selamat! Anda Telah Menjadi Alumni" will appear!');
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    
    const setupAdmin = async () => {
      try {
        const result = await initializeAdmin();
        
        // Only display credentials if admin was just created
        if (result.created) {
          displayAdminCredentials();
        }
      } catch (error: any) {
        // Silent fail - admin init is optional, app should still work
        if (error.code === 'permission-denied') {
          console.log('ℹ️  Admin auto-initialization skipped (requires authentication)');
          console.log('   Admin will be auto-fixed on first login if needed');
        } else {
          console.warn('Admin initialization:', error.message);
        }
      }
    };
    
    // Run admin initialization (silent fail if permission denied)
    setupAdmin();
  }, []);

  return (
    <>
      <ErrorBoundary>
        <AuthProvider>
          <AppWithWidgets />
        </AuthProvider>
      </ErrorBoundary>
      <Toaster position="bottom-left" richColors />
      <WhatsAppFloating />
    </>
  );
}