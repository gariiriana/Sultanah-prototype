import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom'; // ✅ ADDED FOR ITINERARY
import EducationDetail from './EducationDetail';
import PromoDetail from '../prospective-jamaah/PromoDetail';
import PaymentForm from './PaymentForm';
// ❌ REMOVED: PaymentStatusTracking - Direct redirect to Pesanan Saya after payment
import ArticleSubmissionForm from './ArticleSubmissionForm';
// ❌ REMOVED: AlumniUpgradeForm - Upgrade is now automatic when tour leader completes trip
import ProfileForm from '../prospective-jamaah/ProfileForm';
import ArticlesPage from '../user/ArticlesPage';
import ArticleDetailPage from '../user/ArticleDetailPage';
import PackageDetailPage from './PackageDetailPage';
import ItineraryViewer from './ItineraryViewer';  // ✅ Itinerary viewer
// ❌ REMOVED: RequestItemsForm and MyItemRequests - Permintaan Item Paket feature deleted
// ❌ REMOVED: MarketplaceOrderTracking - Now using unified PesananPage instead
import PesananPage from './PesananPage'; // ✅ Combined pesanan page (payments + marketplace orders)
import AllPackagesPage from '../prospective-jamaah/AllPackagesPage';
import AllPromosPage from '../prospective-jamaah/AllPromosPage';
import AllEducationPage from '../prospective-jamaah/AllEducationPage';
import AllTestimonialsPage from '../user/AllTestimonialsPage'; // ✅ NEW
import FloatingAnnouncementWidget from '../../components/FloatingAnnouncementWidget';
// ✅ NEW: Shared components for unified UI
import TestimonialSection from '../../components/shared/TestimonialSection';
import WelcomeNotification from '../../components/WelcomeNotification'; // ✅ NEW: Post-payment notification
import ArticleSection from '../../components/shared/ArticleSection';
import { useAuth } from '../../../contexts/AuthContext';
import { db } from '../../../config/firebase';
import { collection, query, where, getDocs, orderBy, limit, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { Promo } from '../../../types';

// ✅ BEAUTIFUL IMAGE: Mecca Pilgrims
const jamaahHeroImage = '/images/jamaah-dashboard-bg.jpg';
import {
  User,
  Home, // ✅ ADDED: Home icon
  MapPin,
  Calendar,
  Package,
  Newspaper,
  MessageCircle,
  Clock,
  TrendingUp,
  ShoppingBag,
  ShoppingCart,
  Star,
  Users,
  Check,
  Gift,
  Tag,
  Sparkles,
  GraduationCap,
  BookOpen,
  PenSquare,
  Send,
  Phone,
  Mail,
  Clock3,
  Facebook,
  Instagram,
  Twitter,
  Menu // ✅ ADDED: Menu icon for mobile sidebar
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '../../components/ui/sheet'; // ✅ ADDED: Sheet components

// Import Sultanah logo
// ✅ LOGO: Mosque dome with gold
const sultanahLogo = '/images/logo.png';

const CurrentJamaahDashboard = () => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate(); // ✅ ADDED FOR ITINERARY NAVIGATION
  const [showProfilePage, setShowProfilePage] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  // ❌ REMOVED: showPaymentStatus - Direct redirect to Pesanan Saya after payment
  const [showUpgradeStatus, setShowUpgradeStatus] = useState(false);
  const [showArticleSubmission, setShowArticleSubmission] = useState(false);
  // ❌ REMOVED: showAlumniUpgrade - Upgrade is now automatic
  const [showItinerary, setShowItinerary] = useState(false);  // ✅ Itinerary state
  // ❌ REMOVED: showRequestItems and showMyRequests - Permintaan Item Paket feature deleted
  // ❌ REMOVED: showMarketplaceOrders - Now using unified PesananPage instead
  const [showPesananPage, setShowPesananPage] = useState(false); // ✅ Combined pesanan page
  const [showArticlesPage, setShowArticlesPage] = useState(false);
  const [showArticleDetail, setShowArticleDetail] = useState(false);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [showPackageDetail, setShowPackageDetail] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [selectedPackageForPayment, setSelectedPackageForPayment] = useState<any | null>(null);

  // Package states
  const [packages, setPackages] = useState<any[]>([]);

  // Testimonials states
  const [testimonials, setTestimonials] = useState<any[]>([]);

  // Education states
  const [educations, setEducations] = useState<any[]>([]);

  // Promo states
  const [promos, setPromos] = useState<Promo[]>([]);
  const [selectedPromo, setSelectedPromo] = useState<Promo | null>(null);
  const [showPromoDetail, setShowPromoDetail] = useState(false);

  // Article states
  const [articles, setArticles] = useState<any[]>([]);

  // Contact form states
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [sendingMessage, setSendingMessage] = useState(false);

  // Education detail page state
  const [showEducationDetail, setShowEducationDetail] = useState(false);
  const [selectedEducationId, setSelectedEducationId] = useState<string | null>(null);

  // ✅ NEW: "View All" page states
  const [showAllPackagesPage, setShowAllPackagesPage] = useState(false);
  const [showAllPromosPage, setShowAllPromosPage] = useState(false);
  const [showAllEducationPage, setShowAllEducationPage] = useState(false);
  const [showAllTestimonialsPage, setShowAllTestimonialsPage] = useState(false);

  // ✅ NEW: Welcome notification state
  const [showWelcomeNotification, setShowWelcomeNotification] = useState(false);
  const [welcomeBookingData, setWelcomeBookingData] = useState<any>(null);

  // Refs for scroll
  const dashboardRef = useRef<HTMLDivElement>(null);
  const packagesRef = useRef<HTMLDivElement>(null);
  const promosRef = useRef<HTMLDivElement>(null);
  const educationRef = useRef<HTMLDivElement>(null);
  const newsRef = useRef<HTMLDivElement>(null);
  const testimonialsRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);

  // ✅ NEW: Check for welcome notification on mount
  useEffect(() => {
    const shouldShowWelcome = localStorage.getItem('showWelcomeNotification');
    const bookingDataStr = localStorage.getItem('welcomeBookingData');

    if (shouldShowWelcome === 'true' && bookingDataStr) {
      try {
        const bookingData = JSON.parse(bookingDataStr);
        setWelcomeBookingData(bookingData);
        setShowWelcomeNotification(true);

        // Clear flags after showing
        localStorage.removeItem('showWelcomeNotification');
        localStorage.removeItem('welcomeBookingData');
      } catch (error) {
        console.error('Failed to parse booking data:', error);
      }
    }
  }, []);

  useEffect(() => {
    fetchPackages();
    fetchPromos();
    fetchTestimonials();
    fetchEducations();
    fetchArticles();
  }, [currentUser]);

  // ✅ DEBUG & AUTO-CARE: Check if user should be Alumni
  useEffect(() => {
    const checkAndUpgradeToAlumni = async () => {
      if (!userProfile || !userProfile.id) return;

      // Stop if already alumni
      if (userProfile.role === 'alumni') return;
      // Stop if not a jamaah role
      if (userProfile.role !== 'current-jamaah' && userProfile.role !== 'prospective-jamaah' && userProfile.role !== 'jamaah') return;

      try {
        console.log('🔄 [Auto-Upgrade] Checking for completed trips...');

        // 1. Find approved payments for this user
        // Using collection() instead of collectionGroup() for cost efficiency, assuming 'payments' is root
        const paymentsQuery = query(
          collection(db, 'payments'),
          where('userId', '==', userProfile.id),
          where('status', '==', 'approved')
        );

        const paymentsSnap = await getDocs(paymentsQuery);
        console.log('💰 [Auto-Upgrade] Approved payments count:', paymentsSnap.size);

        if (paymentsSnap.empty) {
          console.log('ℹ️ [Auto-Upgrade] No approved payments found.');
          return;
        }

        const packageIds = Array.from(new Set(paymentsSnap.docs.map(doc => doc.data().packageId).filter(Boolean)));

        if (packageIds.length === 0) {
          console.log('ℹ️ [Auto-Upgrade] No package IDs found in payments.');
          return;
        }

        console.log('📦 [Auto-Upgrade] Checking packages:', packageIds);

        // 2. Check for ANY completed itinerary linked to these packages
        let foundCompletedItinerary = false;

        // Use logic: Filter itineraries by packageId AND status 'completed'
        // Since 'in' query is limited to 10, we slice.
        const itinerariesQuery = query(
          collection(db, 'itineraries'),
          where('packageId', 'in', packageIds.slice(0, 10)),
          where('status', '==', 'completed')
        );

        const itinerariesSnap = await getDocs(itinerariesQuery);

        // Also try manual filter if 'status' field is missing or different case
        if (!itinerariesSnap.empty) {
          foundCompletedItinerary = true;
          console.log('✅ [Auto-Upgrade] Found completed itinerary via Status Query:', itinerariesSnap.docs[0].id);
        } else {
          // Fallback: Query by packageId only and check status manually
          // This handles cases where status might be undefined or 'Completed' vs 'completed'
          const fallbackQuery = query(
            collection(db, 'itineraries'),
            where('packageId', 'in', packageIds.slice(0, 10))
          );
          const fallbackSnap = await getDocs(fallbackQuery);
          fallbackSnap.forEach(doc => {
            const data = doc.data();
            console.log('📋 [Auto-Upgrade] Checking itinerary status:', doc.id, data.status);
            // Check various 'completed' indicators
            if (data.status === 'completed' || data.status === 'Completed' || data.status === 'finished') {
              foundCompletedItinerary = true;
              console.log('✅ [Auto-Upgrade] Found completed itinerary via Fallback Check:', doc.id);
            }
          });
        }



        if (foundCompletedItinerary) {
          console.log('🚀 [Auto-Upgrade] Upgrading user to Alumni...');

          const userRef = doc(db, 'users', userProfile.id);
          await updateDoc(userRef, {
            role: 'alumni',
            upgradedToAlumniAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          });

          toast.success("Alhamdulillah! Perjalanan Anda selesai. Selamat datang di keluarga Alumni Sultanah Travel. 🌙✨", {
            duration: 8000,
          });
        }

      } catch (error) {
        console.error('⚠️ [Auto-Upgrade] Error checking status:', error);
      }
    };

    checkAndUpgradeToAlumni();
  }, [userProfile]);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const fetchPackages = async () => {
    try {
      const q = query(
        collection(db, 'packages'),
        where('status', '==', 'active')
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPackages(data);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
  };

  const fetchPromos = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'promos'));
      const promosData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Promo[];
      setPromos(promosData);
    } catch (error) {
      console.error('Error fetching promos:', error);
    }
  };

  const fetchTestimonials = async () => {
    try {
      // ✅ FIXED: Fetch all testimonials first, then filter client-side (no index needed!)
      const q = query(
        collection(db, 'testimonials'),
        orderBy('createdAt', 'desc'),
        limit(50) // Fetch more to ensure we have enough verified ones
      );
      const querySnapshot = await getDocs(q);

      // Get all testimonials and filter verified ones client-side
      const allTestimonials = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filter only verified testimonials client-side
      const verifiedTestimonials = allTestimonials.filter((t: any) => t.verified === true);

      console.log('📊 Jamaah Umroh - All Testimonials:', allTestimonials.length);
      console.log('✅ Jamaah Umroh - Verified Testimonials:', verifiedTestimonials.length);
      console.log('🔍 Jamaah Umroh - Sample data:', verifiedTestimonials[0]);

      setTestimonials(verifiedTestimonials);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
    }
  };

  const fetchEducations = async () => {
    try {
      const q = query(
        collection(db, 'education'),
        where('status', '==', 'active')
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Sort by createdAt descending on client-side
        data.sort((a: any, b: any) => {
          const dateA = a.createdAt?.toDate?.() || new Date(0);
          const dateB = b.createdAt?.toDate?.() || new Date(0);
          return dateB.getTime() - dateA.getTime();
        });

        setEducations(data);
      }
    } catch (error) {
      console.error('Error fetching educations:', error);
    }
  };

  const fetchArticles = async () => {
    try {
      // ✅ Simplified query - removed orderBy to avoid composite index requirement
      const q = query(
        collection(db, 'articles'),
        where('status', '==', 'approved')
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const data = querySnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter((article: any) => article.deleted !== true); // Filter out deleted articles

        // ✅ Sort by createdAt on client-side
        data.sort((a: any, b: any) => {
          const dateA = a.createdAt?.toMillis?.() || 0;
          const dateB = b.createdAt?.toMillis?.() || 0;
          return dateB - dateA; // Descending order
        });

        setArticles(data.slice(0, 6)); // Limit to 6 articles after sorting
        console.log('✅ Fetched approved articles:', data.length);
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
    }
  };

  // Format currency untuk Rupiah
  const formatCurrency = (amount: number | string): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numAmount);
  };

  // Unused functions removed: getInitials, getColorClass, handleSignOut, handleCreateTestimonial
  const formatDate = (dateField: any): string => {
    if (!dateField) return new Date().toLocaleDateString();

    // If Firestore Timestamp
    if (dateField.toDate && typeof dateField.toDate === 'function') {
      return dateField.toDate().toLocaleDateString();
    }

    // If Date object
    if (dateField instanceof Date) {
      return dateField.toLocaleDateString();
    }

    // If string or number
    return new Date(dateField).toLocaleDateString();
  };

  // handleCreateTestimonial removed


  const handleViewEducation = (educationId: string) => {
    console.log('📚 View Education clicked! ID:', educationId);
    setSelectedEducationId(educationId);
    setShowEducationDetail(true);
  };

  // If showing article detail page
  if (showArticleDetail && selectedArticleId) {
    return (
      <ArticleDetailPage
        articleId={selectedArticleId}
        onBack={() => {
          setShowArticleDetail(false);
          setSelectedArticleId(null);
        }}
      />
    );
  }

  // If showing articles page
  if (showArticlesPage) {
    return (
      <ArticlesPage
        onBack={() => setShowArticlesPage(false)}
        onShowArticleDetail={(articleId) => {
          setSelectedArticleId(articleId);
          setShowArticlesPage(false);
          setShowArticleDetail(true);
        }}
        onShowCreateArticle={() => {
          setShowArticlesPage(false);
          setShowArticleSubmission(true);
        }}
      />
    );
  }

  // If showing article submission page
  if (showArticleSubmission) {
    return (
      <ArticleSubmissionForm
        onBack={() => setShowArticleSubmission(false)}
      />
    );
  }

  // If showing education detail page
  if (showEducationDetail && selectedEducationId) {
    return (
      <EducationDetail
        educationId={selectedEducationId}
        onBack={() => {
          setShowEducationDetail(false);
          setSelectedEducationId(null);
        }}
      />
    );
  }

  // ✅ NEW: Show All Packages Page
  if (showAllPackagesPage) {
    return (
      <AllPackagesPage
        packages={packages}
        onBack={() => setShowAllPackagesPage(false)}
        onSelectPackage={(pkg) => {
          setSelectedPackageId(pkg.id);
          setShowPackageDetail(true);
          setShowAllPackagesPage(false);
        }}
        formatCurrency={formatCurrency}
      />
    );
  }

  // ✅ NEW: Show All Promos Page
  if (showAllPromosPage) {
    return (
      <AllPromosPage
        promos={promos}
        onBack={() => setShowAllPromosPage(false)}
        onSelectPromo={(promo) => {
          setSelectedPromo(promo);
          setShowPromoDetail(true);
          setShowAllPromosPage(false);
        }}
      />
    );
  }

  // ✅ NEW: Show All Education Page
  if (showAllEducationPage) {
    return (
      <AllEducationPage
        educations={educations}
        onBack={() => setShowAllEducationPage(false)}
        onSelectEducation={(education) => {
          setSelectedEducationId(education.id);
          setShowEducationDetail(true);
          setShowAllEducationPage(false);
        }}
      />
    );
  }

  // ✅ NEW: Show All Testimonials Page
  if (showAllTestimonialsPage) {
    return (
      <AllTestimonialsPage
        onBack={() => setShowAllTestimonialsPage(false)}
      />
    );
  }

  // If showing package detail page
  if (showPackageDetail && selectedPackageId) {
    return (
      <PackageDetailPage
        packageId={selectedPackageId}
        onBack={() => {
          setShowPackageDetail(false);
          setSelectedPackageId(null);
        }}
        onBookNow={(packageData) => {
          setSelectedPackageForPayment(packageData);
          setShowPackageDetail(false);
          setShowPaymentForm(true);
        }}
      />
    );
  }

  // If showing payment form page
  if (showPaymentForm) {
    return (
      <PaymentForm
        selectedPackage={selectedPackageForPayment}
        onBack={() => {
          setShowPaymentForm(false);
          setSelectedPackageForPayment(null);
        }}
        onViewStatus={() => {
          // ✅ NEW: Direct redirect to Pesanan Saya after payment success
          setShowPaymentForm(false);
          setShowPesananPage(true); // Direct to "Pesanan Saya" page
          setSelectedPackageForPayment(null);
        }}
      />
    );
  }

  // ❌ REMOVED: PaymentStatusTracking page - Users now directly redirected to Pesanan Saya

  // If showing promo detail page
  if (showPromoDetail && selectedPromo) {
    return (
      <PromoDetail
        promoData={selectedPromo}
        onBack={() => {
          setShowPromoDetail(false);
          setSelectedPromo(null);
        }}
      />
    );
  }

  // ❌ REMOVED: Alumni upgrade form - Upgrade is now automatic when tour leader completes trip

  // If showing upgrade status page (Note: This feature might need implementation for current-jamaah)
  if (showUpgradeStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-[#FFF9F0]">
        {/* Top Navbar */}
        <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
                  <img src={sultanahLogo} alt="Sultanah Travel" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h1 className="font-bold text-gray-900 text-sm md:text-base">Upgrade Status</h1>
                  <p className="text-xs text-gray-600 hidden sm:block">Jamaah Umroh Sultanah</p>
                </div>
              </div>
              <Button
                onClick={() => setShowUpgradeStatus(false)}
                variant="ghost"
                className="bg-white/50 hover:bg-white/80 text-gray-700 border border-gray-300"
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        </nav>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card className="bg-white/95 backdrop-blur-sm shadow-lg">
            <CardContent className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#D4AF37]/20 to-[#FFD700]/20 flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-10 h-10 text-[#D4AF37]" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">Upgrade Feature</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Upgrade features for current jamaah will be available soon. Please contact admin for upgrade options.
              </p>
              <Button
                onClick={() => setShowUpgradeStatus(false)}
                className="bg-gradient-to-r from-[#D4AF37] to-[#C5A572] hover:opacity-90 text-white border-0 shadow-md"
              >
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ❌ REMOVED: Marketplace orders tracking - Now using unified PesananPage

  // If showing combined pesanan page (payments + marketplace orders)
  if (showPesananPage) {
    return (
      <PesananPage
        onBack={() => setShowPesananPage(false)}
      />
    );
  }

  // If showing profile page
  if (showProfilePage) {
    return (
      <ProfileForm
        userProfile={userProfile}
        currentUser={currentUser}
        onBack={() => setShowProfilePage(false)}
      />
    );
  }

  // Main Dashboard with Scroll Sections
  return (
    <div className="min-h-screen bg-white">
      {/* Professional Navbar - Sticky */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Title */}
            <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
                <img src={sultanahLogo} alt="Sultanah Travel" className="w-full h-full object-contain" />
              </div>
              <div className="block ml-2">
                <h1 className="font-bold text-gray-900 text-xs md:text-sm leading-tight">Jamaah Umroh Sultanah</h1>
                <p className="text-[10px] md:text-xs text-gray-600 leading-tight">Selamat datang, {userProfile?.displayName ? userProfile.displayName.split(' ')[0] : 'Tamu'}</p>
              </div>
            </div>

            {/* Center Navigation Links */}
            <div className="hidden lg:flex items-center gap-3 flex-1 justify-center max-w-[600px]">
              <button
                onClick={() => scrollToSection(dashboardRef)}
                className="text-gray-700 hover:text-[#D4AF37] transition-all text-sm font-medium relative group whitespace-nowrap px-2"
              >
                <span className="relative z-10">Beranda</span>
                <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-[#D4AF37] to-[#C5A572] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
              </button>
              <button
                onClick={() => scrollToSection(educationRef)}
                className="text-gray-700 hover:text-[#D4AF37] transition-all text-sm font-medium relative group whitespace-nowrap px-2"
              >
                <span className="relative z-10">Edukasi</span>
                <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-[#D4AF37] to-[#C5A572] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
              </button>
              <button
                onClick={() => scrollToSection(newsRef)}
                className="text-gray-700 hover:text-[#D4AF37] transition-all text-sm font-medium relative group whitespace-nowrap px-2"
              >
                <span className="relative z-10">Artikel</span>
                <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-[#D4AF37] to-[#C5A572] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
              </button>
              <button
                onClick={() => scrollToSection(testimonialsRef)}
                className="text-gray-700 hover:text-[#D4AF37] transition-all text-sm font-medium relative group whitespace-nowrap px-2"
              >
                <span className="relative z-10">Testimoni</span>
                <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-[#D4AF37] to-[#C5A572] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
              </button>
              <button
                onClick={() => scrollToSection(contactRef)}
                className="text-gray-700 hover:text-[#D4AF37] transition-all text-sm font-medium relative group whitespace-nowrap px-2"
              >
                <span className="relative z-10">Kontak</span>
                <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-[#D4AF37] to-[#C5A572] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
              </button>
            </div>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Pesanan Saya Button - Combined Page (Payments + Marketplace) */}
              <Button
                onClick={() => setShowPesananPage(true)}
                size="sm"
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-sm hover:shadow-md transition-all px-3 py-2 h-9 text-xs font-semibold rounded-lg whitespace-nowrap"
              >
                <ShoppingBag className="w-4 h-4 md:mr-1.5" />
                <span className="hidden md:inline">Pesanan</span>
              </Button>

              {/* Marketplace Button ✅ NEW */}
              <Button
                onClick={() => navigate('/marketplace')}
                size="sm"
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-0 shadow-sm hover:shadow-md transition-all px-3 py-2 h-9 text-xs font-semibold rounded-lg whitespace-nowrap"
              >
                <ShoppingCart className="w-4 h-4 md:mr-1.5" />
                <span className="hidden md:inline">Marketplace</span>
              </Button>

              {/* Jadwal (Itinerary) Button */}
              <Button
                onClick={() => setShowItinerary(true)}
                size="sm"
                className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white border-0 shadow-sm hover:shadow-md transition-all px-3 py-2 h-9 text-xs font-semibold rounded-lg whitespace-nowrap"
              >
                <Calendar className="w-4 h-4 md:mr-1.5" />
                <span className="hidden md:inline">Jadwal</span>
              </Button>

              {/* ❌ REMOVED: Upgrade button - Upgrade is now automatic when tour leader completes trip */}

              {/* Profile Button - Separated with divider */}
              <div className="ml-2 pl-2 border-l-2 border-gray-200">
                <Button
                  onClick={() => setShowProfilePage(true)}
                  size="sm"
                  className="bg-gradient-to-r from-[#D4AF37] to-[#C5A572] hover:from-[#C5A572] hover:to-[#B8944E] text-white border-0 shadow-sm hover:shadow-md transition-all px-3 py-2 h-9 text-xs font-semibold rounded-lg whitespace-nowrap"
                >
                  <User className="w-4 h-4 md:mr-1.5" />
                  <span className="hidden md:inline">Profil</span>
                </Button>
              </div>

              {/* Mobile Menu Button - Visible ONLY on Mobile */}
              <div className="flex lg:hidden items-center ml-2">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-gray-700 hover:text-[#D4AF37]">
                      <Menu className="h-6 w-6" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[85vw] sm:w-[400px] overflow-y-auto">
                    <SheetHeader className="mb-6 text-left">
                      <SheetTitle className="text-xl font-bold flex items-center gap-2">
                        <img src={sultanahLogo} alt="Sultanah Travel" className="w-8 h-8 rounded-lg" />
                        <span>Menu Navigasi</span>
                      </SheetTitle>
                      <SheetDescription>
                        Akses cepat ke semua fitur dashboard
                      </SheetDescription>
                    </SheetHeader>

                    <div className="flex flex-col gap-6">
                      {/* User Info Mobile */}
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37]">
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{userProfile?.displayName || 'Tamu'}</p>
                            <p className="text-xs text-gray-500">Jamaah Umroh</p>
                          </div>
                        </div>
                        <Button
                          onClick={() => setShowProfilePage(true)}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-[#D4AF37] border-[#D4AF37]/30 hover:bg-[#D4AF37]/5"
                        >
                          <User className="w-4 h-4 mr-2" />
                          Edit Profil
                        </Button>
                      </div>

                      {/* Navigation Links Mobile */}
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-gray-500 pl-1 mb-2">MENU UTAMA</p>

                        <Button onClick={() => scrollToSection(dashboardRef)} variant="ghost" className="w-full justify-start text-lg h-12 hover:text-[#D4AF37] hover:bg-[#D4AF37]/5">
                          <Home className="w-5 h-5 mr-3" /> Beranda
                        </Button>
                        <Button onClick={() => scrollToSection(packagesRef)} variant="ghost" className="w-full justify-start text-lg h-12 hover:text-[#D4AF37] hover:bg-[#D4AF37]/5">
                          <Package className="w-5 h-5 mr-3" /> Paket
                        </Button>
                        <Button onClick={() => scrollToSection(promosRef)} variant="ghost" className="w-full justify-start text-lg h-12 hover:text-[#D4AF37] hover:bg-[#D4AF37]/5">
                          <Tag className="w-5 h-5 mr-3" /> Promo
                        </Button>
                        <Button onClick={() => scrollToSection(educationRef)} variant="ghost" className="w-full justify-start text-lg h-12 hover:text-[#D4AF37] hover:bg-[#D4AF37]/5">
                          <GraduationCap className="w-5 h-5 mr-3" /> Edukasi
                        </Button>
                        <Button onClick={() => scrollToSection(newsRef)} variant="ghost" className="w-full justify-start text-lg h-12 hover:text-[#D4AF37] hover:bg-[#D4AF37]/5">
                          <Newspaper className="w-5 h-5 mr-3" /> Artikel
                        </Button>
                        <Button onClick={() => scrollToSection(testimonialsRef)} variant="ghost" className="w-full justify-start text-lg h-12 hover:text-[#D4AF37] hover:bg-[#D4AF37]/5">
                          <MessageCircle className="w-5 h-5 mr-3" /> Testimoni
                        </Button>
                        <Button onClick={() => scrollToSection(contactRef)} variant="ghost" className="w-full justify-start text-lg h-12 hover:text-[#D4AF37] hover:bg-[#D4AF37]/5">
                          <Phone className="w-5 h-5 mr-3" /> Kontak
                        </Button>
                      </div>

                      {/* Quick Actions Mobile */}
                      <div className="space-y-3 pt-4 border-t border-gray-100">
                        <p className="text-sm font-semibold text-gray-500 pl-1 mb-2">AKSES CEPAT</p>

                        <Button
                          onClick={() => setShowPesananPage(true)}
                          className="w-full bg-blue-50 text-blue-600 hover:bg-blue-100 justify-start h-12"
                        >
                          <ShoppingBag className="w-5 h-5 mr-3" /> Pesanan Saya
                        </Button>

                        <Button
                          onClick={() => navigate('/marketplace')}
                          className="w-full bg-purple-50 text-purple-600 hover:bg-purple-100 justify-start h-12"
                        >
                          <ShoppingCart className="w-5 h-5 mr-3" /> Marketplace
                        </Button>

                        <Button
                          onClick={() => setShowItinerary(true)}
                          className="w-full bg-teal-50 text-teal-600 hover:bg-teal-100 justify-start h-12"
                        >
                          <Calendar className="w-5 h-5 mr-3" /> Jadwal Perjalanan
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero/Dashboard Section with Premium Jamaah Photo Background */}
      <section
        ref={dashboardRef}
        className="relative min-h-[60vh] md:min-h-screen bg-slate-900 bg-cover bg-center bg-no-repeat flex items-center justify-center transition-all duration-700"
        style={{ backgroundImage: `url(${jamaahHeroImage})` }}
      >
        {/* Premium Gradient Overlay - More vibrant for exclusive feel */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70"></div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-white w-full -mt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-3xl md:text-6xl font-bold mb-3 md:mb-6 drop-shadow-lg">
              السلام عليكم, {userProfile?.displayName || 'Jamaah'}!
            </h1>
            <p className="text-base md:text-2xl mb-4 md:mb-8 max-w-3xl mx-auto drop-shadow-md">
              Selamat datang di Portal Jamaah Umroh. Nikmati fitur lengkap untuk mempermudah
              perjalanan spiritual Anda.
            </p>

            {/* CTA Buttons - REMOVED for Current Jamaah */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6 md:mb-8">
              {/* Buttons removed as per user request */}
            </div>

            <div className="flex items-center justify-center gap-2 text-xs md:text-sm">
              <Calendar className="w-3 h-3 md:w-4 md:h-4" />
              <span>Jamaah aktif sejak {formatDate(userProfile?.createdAt)}</span>
            </div>
          </motion.div>
        </div>
      </section>





      {/* Education Section */}
      <section
        ref={educationRef}
        className="relative min-h-screen bg-cover bg-center bg-no-repeat py-20"
        style={{ backgroundImage: `url(https://images.unsplash.com/photo-1647221467105-a851179dccda?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3NxdWUlMjBpbnRlcmlvciUyMGFyY2hpdGVjdHVyZXxlbnwxfHx8fDE3NjcwNzUxODV8MA&ixlib=rb-4.1.0&q=80&w=1080)` }}
      >
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#C5A572] mb-6 shadow-lg">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">Edukasi Umrah</h2>
            <p className="text-xl text-white/90 max-w-3xl mx-auto drop-shadow-md">
              Pelajari panduan lengkap seputar ibadah umrah untuk mempersiapkan perjalanan spiritual Anda dengan lebih baik
            </p>
          </div>

          {educations.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* ✅ UPDATED: Show only first 3 educations */}
                {educations.slice(0, 3).map((education, index) => (
                  <motion.div
                    key={education.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className="group"
                  >
                    <Card className="bg-white/95 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 overflow-hidden h-full flex flex-col border-2 border-transparent hover:border-[#D4AF37]/20">
                      {/* Image */}
                      {education.imageUrl && (
                        <div className="relative h-56 overflow-hidden">
                          <motion.img
                            whileHover={{ scale: 1.1 }}
                            transition={{ duration: 0.6 }}
                            src={education.imageUrl}
                            alt={education.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                          {/* Category Badge */}
                          {education.category && (
                            <div className="absolute top-4 left-4">
                              <span className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#C5A572] text-white text-sm font-semibold shadow-lg">
                                {education.category}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Content */}
                      <CardContent className="p-6 flex-grow flex flex-col">
                        <div className="flex-grow">
                          <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-[#D4AF37] transition-colors line-clamp-2">
                            {education.title}
                          </h3>

                          <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                            {education.description}
                          </p>

                          {/* Meta Info */}
                          <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                            {education.duration && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>{education.duration}</span>
                              </div>
                            )}
                            {education.level && (
                              <div className="flex items-center gap-1">
                                <BookOpen className="w-4 h-4" />
                                <span>{education.level}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Read More Button */}
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <button
                            onClick={() => handleViewEducation(education.id)}
                            className="w-full py-3 px-4 bg-gradient-to-r from-[#D4AF37] to-[#C5A572] hover:opacity-90 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
                          >
                            <BookOpen className="w-4 h-4" />
                            Baca Selengkapnya
                          </button>
                        </motion.div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* ✅ NEW: "Lihat Semua Edukasi" Button - Only show if more than 3 educations */}
              {educations.length > 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center mt-12"
                >
                  <button
                    onClick={() => setShowAllEducationPage(true)}
                    className="group inline-flex items-center gap-3 px-8 py-4 bg-white hover:bg-emerald-50 border-2 border-emerald-600 rounded-xl text-emerald-700 font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <span>Lihat Semua Edukasi</span>
                    <span className="text-2xl group-hover:translate-x-2 transition-transform duration-300">→</span>
                  </button>
                  <p className="text-sm text-white/80 mt-3">
                    Menampilkan 3 dari {educations.length} panduan edukasi tersedia
                  </p>
                </motion.div>
              )}
            </>
          ) : (
            <Card className="bg-white/95 backdrop-blur-sm max-w-2xl mx-auto">
              <CardContent className="text-center py-16">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#D4AF37]/20 to-[#C5A572]/20 flex items-center justify-center mx-auto mb-6">
                  <GraduationCap className="w-10 h-10 text-[#D4AF37]" />
                </div>
                <h3 className="text-2xl font-semibold mb-3">Konten Edukasi Segera Hadir</h3>
                <p className="text-gray-600 text-lg">Materi edukasi umrah akan segera tersedia untuk Anda.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* News & Articles Section */}
      <section
        ref={newsRef}
        className="relative min-h-screen bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(https://images.unsplash.com/photo-1736240624842-c13db7ba4275?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrYWFiYSUyMG1lY2NhJTIwaGFqanxlbnwxfHx8fDE3NjcwOTM5NTB8MA&ixlib=rb-4.1.0&q=80&w=1080)` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Berita & Artikel</h2>
            <p className="text-xl text-white/90">Bagikan pengalaman spiritual Anda dengan jamaah lainnya</p>
          </div>

          {/* ✅ SHARED COMPONENT: Unified Article Section - Show only 3 articles */}
          <ArticleSection
            articles={articles.map((article) => ({
              ...article,
              imageUrl: article.image,
              author: article.author?.name || 'Anonymous',
            }))}
            loading={false}
            emptyMessage="Segera Hadir"
            maxItems={3}
            onArticleClick={(articleId) => {
              setSelectedArticleId(articleId);
              setShowArticleDetail(true);
            }}
            showSubmitButton={false}
            onSubmitClick={() => setShowArticleSubmission(true)}
          />

          {/* ✅ "Lihat Semua Artikel" + "Submit Article" Buttons */}
          {articles.length > 3 && (
            <div className="flex flex-wrap justify-center gap-4 mt-12">
              <button
                onClick={() => setShowArticlesPage(true)}
                className="group inline-flex items-center gap-3 px-8 py-4 bg-white hover:bg-[#D4AF37] border-2 border-[#D4AF37] rounded-xl text-[#D4AF37] hover:text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Newspaper className="w-5 h-5" />
                <span>Lihat Semua Artikel</span>
                <span className="text-2xl group-hover:translate-x-2 transition-transform duration-300">→</span>
              </button>
              <button
                onClick={() => setShowArticleSubmission(true)}
                className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#D4AF37] to-[#C5A572] hover:opacity-90 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <PenSquare className="w-5 h-5" />
                <span>Kirim Artikel</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Testimonials Section */}
      <section
        ref={testimonialsRef}
        className="relative min-h-screen bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(https://images.unsplash.com/photo-1647221467105-a851179dccda?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpc2xhbWljJTIwbW9zcXVlJTIwaW50ZXJpb3J8ZW58MXx8fHwxNzY3MTA3NzEyfDA&ixlib=rb-4.1.0&q=80&w=1080)` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Testimoni Jamaah</h2>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Dengarkanlah kisah inspiratif dari ribuan jamaah yang telah merasakan pengalaman spiritual luar biasa bersama kami
            </p>
          </div>

          {/* ✅ SHARED COMPONENT: Unified Testimonial Section */}
          <TestimonialSection
            testimonials={testimonials.map((testimonial) => ({
              ...testimonial,
              content: testimonial.comment || testimonial.review || '',
              userName: testimonial.userName || testimonial.name || 'Anonymous',
            }))}
            loading={false}
            emptyMessage="Belum Ada Testimoni"
            showSubmitButton={false}
            maxItems={3}
            onViewAllTestimonials={() => setShowAllTestimonialsPage(true)}
          />
        </div>
      </section>




      {/* Contact Section */}
      <section
        ref={contactRef}
        className="relative min-h-screen bg-gradient-to-br from-gray-50 via-white to-[#FFF9F0] py-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-block px-4 py-1.5 bg-gradient-to-r from-[#D4AF37]/20 to-[#C5A572]/20 rounded-full mb-4">
              <span className="text-sm font-medium text-[#D4AF37]\">Hubungi Kami</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Mari <span className="bg-gradient-to-r from-[#D4AF37] to-[#FFD700] bg-clip-text text-transparent">Berdiskusi</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Ada pertanyaan? Tim kami siap membantu Anda merencanakan perjalanan spiritual yang sempurna
            </p>
          </div>



          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">

            {/* Left: Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Card className="shadow-xl border-2 border-[#D4AF37]/10">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#C5A572] flex items-center justify-center">
                      <Send className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Kirim Pesan</h3>
                      <p className="text-sm text-gray-600">Isi formulir di bawah ini dan kami akan segera menghubungi Anda</p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <Label htmlFor="contact-name">Nama Lengkap</Label>
                      <Input
                        id="contact-name"
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        placeholder="Ahmad Hidayat"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="contact-email">Alamat Email</Label>
                      <Input
                        id="contact-email"
                        type="email"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        placeholder="ahmad@example.com"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="contact-phone">Nomor Telepon</Label>
                      <Input
                        id="contact-phone"
                        value={contactForm.phone}
                        onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                        placeholder="+62 812-3456-7890"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="contact-message">Pesan</Label>
                      <Textarea
                        id="contact-message"
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        placeholder="Ceritakan kepada kami tentang rencana perjalanan Anda dan pertanyaan yang ingin diajukan..."
                        rows={5}
                        className="mt-1"
                      />
                    </div>

                    <Button
                      onClick={() => {
                        if (!contactForm.name || !contactForm.email || !contactForm.phone || !contactForm.message) {
                          toast.error('Mohon lengkapi semua field');
                          return;
                        }
                        setSendingMessage(true);
                        setTimeout(() => {
                          toast.success('Pesan berhasil dikirim! Kami akan segera menghubungi Anda.');
                          setContactForm({ name: '', email: '', phone: '', message: '' });
                          setSendingMessage(false);
                        }, 1500);
                      }}
                      disabled={sendingMessage}
                      className="w-full bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] hover:opacity-90 text-white font-semibold py-6"
                    >
                      {sendingMessage ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Mengirim...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          Kirim Pesan
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Right: Contact Info Cards */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-4"
            >
              {/* WhatsApp */}
              <a href="https://wa.me/6281234700116" target="_blank" rel="noopener noreferrer" className="block transform transition-transform hover:scale-102">
                <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-2 border-green-200 hover:shadow-lg transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center flex-shrink-0 shadow-md">
                        <MessageCircle className="w-7 h-7 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 mb-1">WhatsApp</h3>
                        <p className="text-lg font-semibold text-green-700 mb-0.5">+62 812-3470-0116</p>
                        <p className="text-sm text-green-600">Respon cepat 24/7</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </a>

              {/* Telepon */}
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-2 border-blue-200 hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center flex-shrink-0 shadow-md">
                      <Phone className="w-7 h-7 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-1">Telepon</h3>
                      <p className="text-lg font-semibold text-blue-700 mb-0.5">+62 812-3470-0116</p>
                      <p className="text-sm text-blue-600">Senin-Jumat 09:00-18:00</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Email */}
              <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-2 border-orange-200 hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center flex-shrink-0 shadow-md">
                      <Mail className="w-7 h-7 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-1">Email</h3>
                      <p className="text-lg font-semibold text-orange-700 mb-0.5">info@sultanahtravel.com</p>
                      <p className="text-sm text-orange-600">Balas dalam 24 jam</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Kantor */}
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-2 border-purple-200 hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center flex-shrink-0 shadow-md">
                      <MapPin className="w-7 h-7 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-1">Kantor</h3>
                      <p className="text-lg font-semibold text-purple-700 mb-0.5">Jakarta, Indonesia</p>
                      <p className="text-sm text-purple-600">Kunjungi untuk konsultasi</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Jam Operasional */}
              <Card className="bg-gradient-to-br from-[#D4AF37]/10 to-[#F4D03F]/10 border-2 border-[#D4AF37]/30 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center flex-shrink-0 shadow-md">
                      <Clock3 className="w-7 h-7 text-[#D4AF37]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg">Jam Operasional</h3>
                    </div>
                  </div>
                  <div className="space-y-2 pl-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Senin - Jumat</span>
                      <span className="font-semibold text-[#D4AF37]">09:00 - 18:00</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Sabtu</span>
                      <span className="font-semibold text-[#D4AF37]">09:00 - 14:00</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Minggu</span>
                      <span className="font-semibold text-red-600">Tutup</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-b from-gray-900 to-black text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-8">

            {/* Company Info */}
            <div>
              <h3 className="text-2xl font-bold mb-4">
                <span className="bg-gradient-to-r from-[#D4AF37] to-[#FFD700] bg-clip-text text-transparent">Sultanah Travel</span>
              </h3>
              <p className="text-gray-400 leading-relaxed mb-6">
                Mitra terpercaya Anda untuk perjalanan Umrah dan wisata halal. Rasakan perjalanan spiritual seumur hidup dengan layanan premium dan bimbingan ahli kami.
              </p>
              <div className="flex gap-3">
                <a href="#" className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#D4AF37] transition-colors flex items-center justify-center">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#D4AF37] transition-colors flex items-center justify-center">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#D4AF37] transition-colors flex items-center justify-center">
                  <Twitter className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-bold mb-4 text-[#D4AF37]">Tautan Cepat</h4>
              <ul className="space-y-2">
                <li>
                  <button onClick={() => scrollToSection(dashboardRef)} className="text-gray-400 hover:text-[#D4AF37] transition-colors">
                    Beranda
                  </button>
                </li>

                <li>
                  <button onClick={() => scrollToSection(educationRef)} className="text-gray-400 hover:text-[#D4AF37] transition-colors">
                    Edukasi
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection(newsRef)} className="text-gray-400 hover:text-[#D4AF37] transition-colors">
                    Berita & Artikel
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection(testimonialsRef)} className="text-gray-400 hover:text-[#D4AF37] transition-colors">
                    Testimonials
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection(contactRef)} className="text-gray-400 hover:text-[#D4AF37] transition-colors">
                    Kontak
                  </button>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-lg font-bold mb-4 text-[#D4AF37]">Hubungi Kami</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <a href="https://wa.me/6281234700116" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-400 hover:text-[#D4AF37] transition-colors">
                    <MessageCircle className="w-5 h-5 text-[#D4AF37]" />
                    <span>+62 812-3470-0116</span>
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <a href="tel:+6281234700116" className="flex items-center gap-3 text-gray-400 hover:text-[#D4AF37] transition-colors">
                    <Phone className="w-5 h-5 text-[#D4AF37]" />
                    <span>+62 812-3470-0116</span>
                  </a>
                </li>
                <li className="flex items-center gap-3 text-gray-400">
                  <Mail className="w-5 h-5 text-[#D4AF37]" />
                  <span>info@sultanahtravel.com</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-400 text-sm">
              © 2025 Sultanah Travel. Hak Cipta Dilindungi.
            </p>
          </div>
        </div>
      </footer>

      {/* Floating Announcement Widget */}
      <FloatingAnnouncementWidget userRole="current-jamaah" />

      {/* ✅ Itinerary Viewer Modal */}
      {showItinerary && (
        <ItineraryViewer onClose={() => setShowItinerary(false)} />
      )}

      {/* ✅ NEW: Welcome Notification for post-payment users */}
      {welcomeBookingData && (
        <WelcomeNotification
          isOpen={showWelcomeNotification}
          onClose={() => setShowWelcomeNotification(false)}
          onAction={() => {
            setShowWelcomeNotification(false);
            setShowProfilePage(true);
          }}
          actionLabel="Lengkapi Dokumen"
          bookingData={welcomeBookingData}
        />
      )}

      {/* ❌ REMOVED: Request Items and My Requests modals - Permintaan Item Paket feature deleted */}
    </div>
  );
};

export default CurrentJamaahDashboard;