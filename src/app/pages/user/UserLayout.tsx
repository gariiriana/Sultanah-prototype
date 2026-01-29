import React, { useRef, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom'; // ✅ CLEANED
import { doc, setDoc } from 'firebase/firestore'; // ✅ CLEANED
import { db } from '../../../config/firebase';
import { toast } from 'sonner'; // ✅ NEW
import HeroSection from './sections/HeroSection';
import PromoBannerSection from './sections/PromoBannerSection';
import JourneyProcessSection from './sections/JourneyProcessSection';
import ServicesSection from './sections/ServicesSection';
import PackagesSection from './sections/PackagesSection';
import EducationSection from './sections/EducationSection';
import TestimonialsSection from './sections/TestimonialsSection';
import ContactSection from './sections/ContactSection';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import PackageDetailPage from './PackageDetailPage';
import PromoDetailPage from './PromoDetailPage';
import EducationDetailPage from './EducationDetailPage';
import AllPackagesPage from './AllPackagesPage'; // ✅ NEW: Import All Pages
import AllPromosPage from './AllPromosPage';
import AllEducationPage from './AllEducationPage';
import AllTestimonialsPage from './AllTestimonialsPage';
import FloatingAnnouncementWidget from '../../components/FloatingAnnouncementWidget';

interface UserLayoutProps {
  onShowAuth?: (tab?: 'login' | 'register') => void;
  onShowProfile: () => void;
}

const UserLayout: React.FC<UserLayoutProps> = ({ onShowProfile, onShowAuth }) => {
  const location = useLocation(); // ✅ NEW
  const [currentView, setCurrentView] = useState<
    'home' |
    'packageDetail' |
    'promoDetail' |
    'educationDetail' |
    'allPackages' |
    'allPromos' |
    'allEducation' |
    'allArticles' |
    'allTestimonials'
  >('home');
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [selectedPromoId, setSelectedPromoId] = useState<string>('');
  const [selectedEducationId, setSelectedEducationId] = useState<string>('');

  const homeRef = useRef<HTMLDivElement>(null);
  const promoRef = useRef<HTMLDivElement>(null);
  const servicesRef = useRef<HTMLDivElement>(null);
  const packagesRef = useRef<HTMLDivElement>(null);
  const educationRef = useRef<HTMLDivElement>(null);
  const testimonialsRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);

  // ✅ NEW: Track referral clicks
  useEffect(() => {
    const trackReferralClick = async () => {
      const searchParams = new URLSearchParams(location.search);
      const referralCode = searchParams.get('ref');

      if (referralCode) {
        try {
          // Store referral code in localStorage for later use during registration
          localStorage.setItem('referralCode', referralCode);

          // Track the click in Firestore
          const clickId = `${referralCode}_${Date.now()}_${Math.random().toString(36).substr(2, 9)} `;
          const clickRef = doc(db, 'referralUsage', clickId);

          await setDoc(clickRef, {
            referralCode: referralCode,
            clickedAt: new Date().toISOString(),
            converted: false,
            commissionAmount: 0
          });

          // Update total clicks in alumniReferrals
          // Note: We'll need to query to find the alumni by referralCode
          // For now, we just save the click

          console.log('✅ Referral click tracked:', referralCode);
          toast.success('🎉 Link referral terdeteksi! Daftar sekarang untuk mendapatkan benefit spesial!');
        } catch (error) {
          console.error('Error tracking referral click:', error);
        }
      }
    };

    trackReferralClick();
  }, [location]);

  // ✅ NEW: Handle incoming navigation state (e.g., from Booking Back Button)
  useEffect(() => {
    if (location.state && (location.state as any).view === 'packageDetail') {
      const { id } = location.state as any;
      if (id) {
        setSelectedPackageId(id);
        setCurrentView('packageDetail');
        // Clear state to prevent re-triggering on manual refresh
        window.history.replaceState({}, document.title);
      }
    }
  }, [location]);

  const scrollToSection = (section: string) => {
    const refs = {
      home: homeRef,
      promo: promoRef,
      services: servicesRef,
      packages: packagesRef,
      education: educationRef,
      testimonials: testimonialsRef,
      contact: contactRef,
    };

    const ref = refs[section as keyof typeof refs];
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleViewPackageDetail = (packageId: string) => {
    setSelectedPackageId(packageId);
    setCurrentView('packageDetail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewPromoDetail = (promoId: string) => {
    setSelectedPromoId(promoId);
    setCurrentView('promoDetail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewEducationDetail = (educationId: string) => {
    setSelectedEducationId(educationId);
    setCurrentView('educationDetail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToHome = () => {
    setCurrentView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ✅ NEW: Handlers for "Lihat Semua" navigation
  const handleViewAllPackages = () => {
    setCurrentView('allPackages');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewAllPromos = () => {
    setCurrentView('allPromos');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewAllEducation = () => {
    setCurrentView('allEducation');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewAllTestimonials = () => {
    setCurrentView('allTestimonials');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ✅ NEW: Show "All" pages
  if (currentView === 'allPackages') {
    return (
      <AllPackagesPage
        onBack={handleBackToHome}
        onViewPackageDetail={handleViewPackageDetail}
      />
    );
  }

  if (currentView === 'allPromos') {
    return (
      <AllPromosPage
        onBack={handleBackToHome}
        onViewPromoDetail={handleViewPromoDetail}
      />
    );
  }

  if (currentView === 'allEducation') {
    return (
      <AllEducationPage
        onBack={handleBackToHome}
        onViewEducationDetail={handleViewEducationDetail}
      />
    );
  }

  if (currentView === 'allTestimonials') {
    return <AllTestimonialsPage onBack={handleBackToHome} />;
  }

  // Show detail pages
  if (currentView === 'packageDetail' && selectedPackageId) {
    return <PackageDetailPage packageId={selectedPackageId} onBack={handleBackToHome} />;
  }

  if (currentView === 'promoDetail' && selectedPromoId) {
    return <PromoDetailPage promoId={selectedPromoId} onBack={handleBackToHome} />;
  }

  if (currentView === 'educationDetail' && selectedEducationId) {
    return <EducationDetailPage educationId={selectedEducationId} onBack={handleBackToHome} />;
  }

  // Show home layout
  return (
    <div className="min-h-screen bg-white">
      <Navbar
        onNavigate={scrollToSection}
        onShowProfile={onShowProfile}
        onShowAuth={onShowAuth}
      />

      <div ref={homeRef}>
        <HeroSection />
      </div>

      {/* NEW: Promo Banner - Easy access to promotions */}
      <div ref={promoRef}>
        <PromoBannerSection
          onViewPromoDetail={handleViewPromoDetail}
          onViewAllPromos={handleViewAllPromos}
        />
      </div>

      {/* Services Section - Why Choose Us + Journey Process */}
      <div ref={servicesRef}>
        {/* Step 1: Why Choose Us - 6 benefits cards */}
        <ServicesSection />

        {/* Step 2: Journey Process - Clear step-by-step guide */}
        <JourneyProcessSection />
      </div>

      <div ref={packagesRef} data-section="packages">
        <PackagesSection
          onViewPackageDetail={handleViewPackageDetail}
          onViewAllPackages={handleViewAllPackages}
        />
      </div>

      <div ref={educationRef}>
        <EducationSection
          onViewEducationDetail={handleViewEducationDetail}
          onViewAllEducation={handleViewAllEducation}
        />
      </div>

      <div ref={testimonialsRef}>
        <TestimonialsSection
          onViewAllTestimonials={handleViewAllTestimonials}
        />
      </div>

      <div ref={contactRef} data-section="contact">
        <ContactSection />
      </div>

      <Footer onNavigate={scrollToSection} />

      {/* Floating Announcement Widget for Guests */}
      <FloatingAnnouncementWidget userRole="guest" />
    </div>
  );
};

export default UserLayout;