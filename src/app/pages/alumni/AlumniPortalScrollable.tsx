import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../../../contexts/AuthContext';
import { copyToClipboard } from '../../../utils/clipboard'; // ✅ Import safe clipboard utility
import {
  Users,
  LayoutDashboard,
  Gift,
  Star,
  Newspaper,
  Search,
  MapPin,
  Calendar,
  Award,
  Copy,
  CheckCircle,
  TrendingUp,
  MessageCircle,
  Clock3,
  DollarSign,
  Wallet,
  User,
  PenSquare,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import AlumniBottomNav from './AlumniBottomNav';
import AlumniContactSection from './AlumniContactSection';
import ConfirmDialog from '../../components/ConfirmDialog';

// ✅ BEAUTIFUL IMAGES: Madinah Nabawi Mosque & Logo
const kaabaImage = 'https://images.unsplash.com/photo-1689333532270-7849d33de8aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYWRpbmFoJTIwbmFiYXdpfGVufDF8fHx8MTc2ODE4NDU0OXww&ixlib=rb-4.1.0&q=80&w=1080';
const sultanahLogo = '/images/logo.png';
import { db } from '../../../config/firebase';
import { collection, query, where, getDocs, doc, getDoc, setDoc, addDoc, Timestamp, orderBy } from 'firebase/firestore';
import { toast } from 'sonner';
import CommissionWithdrawalForm, { WithdrawalFormData } from '../../components/CommissionWithdrawalForm';
// ✅ NEW: Shared components for unified UI
import TestimonialSection from '../../components/shared/TestimonialSection';
import ArticleSection from '../../components/shared/ArticleSection';
import ArticleSubmissionForm from '../current-jamaah/ArticleSubmissionForm';
// ✅ NEW: Tour Leader Rating Modal - ALWAYS ACTIVE for Alumni
import TourLeaderRatingModal from '../../components/TourLeaderRatingModal';
// ✅ NEW: Testimonial Submit & Detail
import TestimonialSubmitDialog from '../../components/TestimonialSubmitDialog';
import TestimonialDetailDialog from '../../components/TestimonialDetailDialog';
// ✅ NEW: Article Detail Page & Articles Page
import ArticleDetailPage from '../user/ArticleDetailPage';
import ArticlesPage from '../user/ArticlesPage';
// ✅ NEW: All Testimonials Page
import AllTestimonialsPage from '../user/AllTestimonialsPage';
// ✅ NEW: Agent Upgrade Dialog
import AgentUpgradeDialog from '../../components/AgentUpgradeDialog';
import { autoCreateReferralCode } from '../../../utils/autoCreateReferralCode';

interface AlumniPortalScrollableProps {
  onNavigateToProfile: () => void;
}

interface AlumniUser {
  id: string;
  fullName: string;
  email: string;
  city?: string;
  province?: string;
  createdAt: any;
  packageName?: string;
}

interface Referral {
  id: string;
  userId: string;
  code: string;
  totalReferrals: number;
  successfulReferrals: number;
  commissionPercentage: number; // e.g., 5 for 5%
  commissionPerReferral: number; // Nominal rupiah per successful referral
  totalCommissionEarned: number; // Total komisi yang sudah didapat
  pendingCommission: number; // Komisi yang belum dibayar
  paidCommission: number; // Komisi yang sudah dibayar
  createdAt: any;
}

interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  imageUrl?: string;
  createdAt: any;
  author?: string;
}

interface Testimonial {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  content: string;
  imageUrl?: string; // ✅ ADDED: Photo URL
  packageName?: string;
  verified?: boolean; // ✅ ADDED: Verified status
  createdAt: any;
}

// ✅ UTILITY: Safe string extraction to prevent rendering objects
const safeString = (value: any, fallback: string = ''): string => {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return String(value);
  // If it's an object, return fallback instead of trying to render it
  return fallback;
};

// ✅ UTILITY: Safe name extraction with multiple fallbacks
const safeName = (data: any): string => {
  return safeString(data?.fullName) ||
    safeString(data?.name) ||
    safeString(data?.displayName) ||
    'Alumni';
};

const AlumniPortalScrollable: React.FC<AlumniPortalScrollableProps> = ({
  onNavigateToProfile,
}) => {
  const { currentUser, userProfile, signOut } = useAuth();
  const [activeSection, setActiveSection] = useState('home');
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showAgentUpgradeDialog, setShowAgentUpgradeDialog] = useState(false); // ✅ NEW: Agent upgrade dialog

  // Section Refs
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Alumni List State
  const [searchQuery, setSearchQuery] = useState('');
  const [alumni, setAlumni] = useState<AlumniUser[]>([]);
  const [filteredAlumni, setFilteredAlumni] = useState<AlumniUser[]>([]);
  const [loadingAlumni, setLoadingAlumni] = useState(false);

  // Referral State
  const [referralData, setReferralData] = useState<Referral | null>(null);
  const [referralLink, setReferralLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const [commissionBalance, setCommissionBalance] = useState(0);

  // Articles State
  const [articles, setArticles] = useState<Article[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [showArticleSubmission, setShowArticleSubmission] = useState(false);
  const [showArticleDetail, setShowArticleDetail] = useState(false);
  const [showArticlesPage, setShowArticlesPage] = useState(false);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);

  // Testimonials State
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loadingTestimonials, setLoadingTestimonials] = useState(false);
  const [showTestimonialSubmit, setShowTestimonialSubmit] = useState(false);
  const [showTestimonialDetail, setShowTestimonialDetail] = useState(false);
  const [showAllTestimonialsPage, setShowAllTestimonialsPage] = useState(false); // ✅ NEW
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null);

  // Contact form states
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [sendingMessage, setSendingMessage] = useState(false);

  // ✅ NEW: Tour Leader Rating Modal - ALWAYS ACTIVE
  const [ratingModalOpen, setRatingModalOpen] = useState(false);

  const sections = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Statistik dan informasi lengkap aktivitas Anda',
      icon: LayoutDashboard,
      gradient: 'from-purple-500 to-purple-600',
    },
    {
      id: 'referral',
      title: 'Referral Program',
      description: 'Dapatkan reward dengan mengajak teman & keluarga',
      icon: Gift,
      gradient: 'from-[#D4AF37] to-[#C5A572]',
    },
    {
      id: 'daftar',
      title: 'Daftar Alumni',
      description: 'Lihat daftar lengkap alumni Jamaah Umroh Sultanah',
      icon: Users,
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      id: 'testimonial',
      title: 'Testimonial',
      description: 'Bagikan pengalaman spiritual Anda kepada calon jamaah',
      icon: Star,
      gradient: 'from-amber-500 to-yellow-600',
    },
    {
      id: 'news',
      title: 'News & Article',
      description: 'Baca artikel terbaru seputar ibadah Umroh & Haji',
      icon: Newspaper,
      gradient: 'from-green-500 to-emerald-600',
    },
    {
      id: 'contact',
      title: 'Contact Us',
      description: 'Hubungi kami untuk informasi lebih lanjut',
      icon: MessageCircle,
      gradient: 'from-pink-500 to-rose-600',
    },
  ];

  useEffect(() => {
    if (currentUser) {
      initializeReferral();
      fetchAlumni();
      fetchArticles();
      fetchTestimonials();
      // ✅ NEW: Show agent upgrade dialog for first-time alumni (check local storage)
      const hasSeenAgentUpgrade = localStorage.getItem(`agent-upgrade-seen-${currentUser.uid}`);
      if (!hasSeenAgentUpgrade) {
        setShowAgentUpgradeDialog(true);
      }
    }
  }, [currentUser]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredAlumni(alumni);
    } else {
      const filtered = alumni.filter(user => {
        const searchLower = searchQuery.toLowerCase();
        return safeString(user.fullName).toLowerCase().includes(searchLower) ||
          safeString(user.email).toLowerCase().includes(searchLower) ||
          safeString(user.city).toLowerCase().includes(searchLower);
      });
      setFilteredAlumni(filtered);
    }
  }, [searchQuery, alumni]);

  const generateReferralCode = (userId: string): string => {
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const code = userId.substring(0, 3).toUpperCase();
    return `SULTANAH-${code}${randomNum}`;
  };

  const initializeReferral = async () => {
    if (!currentUser) return;

    try {
      const referralRef = doc(db, 'alumniReferrals', currentUser.uid);
      const referralSnap = await getDoc(referralRef);

      if (referralSnap.exists()) {
        const data = referralSnap.data() as Referral;

        // ✅ MIGRATION: Update old commission rate (50000) to new rate (200000)
        if (data.commissionPerReferral === 50000) {
          const updatedData = {
            ...data,
            commissionPerReferral: 200000 // Update to Rp200.000
          };
          await setDoc(referralRef, updatedData, { merge: true });
          setReferralData(updatedData);
          console.log('✅ Commission rate migrated from Rp50.000 to Rp200.000');
        } else {
          setReferralData(data);
        }

        setReferralLink(`${window.location.origin}?ref=${data.code}`);
      } else {
        const code = generateReferralCode(currentUser.uid);
        const newReferral: Referral = {
          id: currentUser.uid,
          userId: currentUser.uid,
          code: code,
          totalReferrals: 0,
          successfulReferrals: 0,
          commissionPercentage: 5, // 5%
          commissionPerReferral: 200000, // ✅ FIXED: Rp200.000 per successful referral (Alumni Jamaah Umroh)
          totalCommissionEarned: 0,
          pendingCommission: 0,
          paidCommission: 0,
          createdAt: new Date()
        };

        await setDoc(referralRef, newReferral);
        setReferralData(newReferral);
        setReferralLink(`${window.location.origin}?ref=${code}`);
      }

      // ✅ AUTO-INITIALIZE: Load and ensure commissionBalance exists
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();

        // If commissionBalance doesn't exist, initialize it to 0
        if (userData.commissionBalance === undefined || userData.commissionBalance === null) {
          await setDoc(userRef, {
            commissionBalance: 0
          }, { merge: true });

          console.log('✅ Auto-initialized commissionBalance to 0');
          setCommissionBalance(0);
        } else {
          setCommissionBalance(userData.commissionBalance);
        }
      } else {
        // User document doesn't exist - create it with commission balance
        await setDoc(userRef, {
          commissionBalance: 0
        }, { merge: true });

        console.log('✅ Created user document with commissionBalance');
        setCommissionBalance(0);
      }
    } catch (error: any) {
      console.error('Error initializing referral:', error);
      // ✅ Better error message for users
      if (error?.code === 'permission-denied') {
        toast.error('Gagal memuat data referral. Silakan refresh halaman atau hubungi admin jika masalah berlanjut.');
      } else {
        toast.error('Terjadi kesalahan saat memuat data referral');
      }
    }
  };

  const fetchAlumni = async () => {
    try {
      setLoadingAlumni(true);
      const usersRef = collection(db, 'users');
      // ✅ FIX: Query users dengan role 'alumni' (bukan 'alumni-jamaah')
      const q = query(usersRef, where('role', '==', 'alumni'));

      const querySnapshot = await getDocs(q);
      const alumniData: AlumniUser[] = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();

        // ✅ Use utility functions for safe extraction
        alumniData.push({
          id: docSnap.id,
          fullName: safeName(data),
          email: safeString(data.email),
          city: safeString(data.city),
          province: safeString(data.province),
          createdAt: data.createdAt,
          packageName: safeString(data.packageName)
        });
      });

      // Sort manually in frontend
      alumniData.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });

      setAlumni(alumniData);
      setFilteredAlumni(alumniData);
    } catch (error) {
      console.error('Error fetching alumni:', error);
    } finally {
      setLoadingAlumni(false);
    }
  };

  const fetchArticles = async () => {
    try {
      setLoadingArticles(true);
      const articlesRef = collection(db, 'articles');
      // ✅ FIX: Only show approved articles (same as Jamaah Umroh)
      const q = query(articlesRef, where('status', '==', 'approved'));
      const querySnapshot = await getDocs(q);

      const articlesData: Article[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        articlesData.push({
          id: docSnap.id,
          title: safeString(data.title, 'Untitled'),
          content: safeString(data.content),
          category: safeString(data.category, 'Artikel'),
          imageUrl: safeString(data.imageUrl || data.image), // ✅ FIX: Support both imageUrl and image field
          createdAt: data.createdAt,
          author: safeString(data.author, 'Admin')
        });
      });

      // Sort by date
      articlesData.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });

      setArticles(articlesData);
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoadingArticles(false);
    }
  };

  const fetchTestimonials = async () => {
    try {
      setLoadingTestimonials(true);

      // ✅ FIXED: Fetch ALL testimonials (not just user's own), sorted by latest
      const testimonialsRef = collection(db, 'testimonials');
      const q = query(testimonialsRef, orderBy('createdAt', 'desc'));

      const querySnapshot = await getDocs(q);
      const testimonialsData: Testimonial[] = [];

      // ✅ Helper function to get comment text (supports multiple field names)
      const getCommentText = (data: any): string => {
        const possibleFields = [
          data.content,
          data.comment,
          data.description,
          data.review,
          data.text,
          data.testimonial,
          data.message,
          data.feedback
        ];

        const commentText = possibleFields.find(field => field && typeof field === 'string' && field.trim() !== '' && field !== '..');

        return commentText || '';
      };

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        testimonialsData.push({
          id: docSnap.id,
          userId: safeString(data.userId),
          userName: safeString(data.userName),
          rating: typeof data.rating === 'number' ? data.rating : 5,
          content: getCommentText(data), // ✅ Use helper function for multi-field support
          imageUrl: safeString(data.imageUrl), // ✅ ADDED: Include photo URL
          packageName: safeString(data.packageName),
          verified: data.verified || false, // ✅ ADDED: Include verified status
          createdAt: data.createdAt
        });
      });

      // Sort by date (already sorted by query, but keep for safety)
      testimonialsData.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });

      setTestimonials(testimonialsData);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
    } finally {
      setLoadingTestimonials(false);
    }
  };

  // ✅ REMOVED: fetchTourLeaderInfo - No longer needed
  // Rating TL sekarang pakai manual dropdown selection, bukan auto-detect

  const handleSectionClick = (section: typeof sections[0]) => {
    setActiveSection(section.id);
    const sectionElement = sectionRefs.current[section.id];
    if (sectionElement) {
      const navbarHeight = 80;
      const elementPosition = sectionElement.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - navbarHeight - 20;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const handleBottomNavClick = (sectionId: string) => {
    setActiveSection(sectionId);

    if (sectionId === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const sectionElement = sectionRefs.current[sectionId];
      if (sectionElement) {
        const navbarHeight = 80;
        const elementPosition = sectionElement.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - navbarHeight - 20;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }
  };

  const handleCopyLink = async () => {
    const success = await copyToClipboard(referralLink);
    if (success) {
      setCopied(true);
      toast.success('Referral link berhasil disalin!');
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('Gagal menyalin link');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // ✅ NEW: Handle agent upgrade
  // handleAgentUpgrade removed


  // handleAgentUpgrade and handleCancelAgentUpgrade removed as they were unused

  const formatDate = (dateField: any): string => {
    if (!dateField) return new Date().toLocaleDateString('id-ID');
    if (dateField.toDate && typeof dateField.toDate === 'function') {
      return dateField.toDate().toLocaleDateString('id-ID');
    }
    if (dateField instanceof Date) {
      return dateField.toLocaleDateString('id-ID');
    }
    return new Date(dateField).toLocaleDateString('id-ID');
  };

  // ✅ Safe user profile name extraction
  const userDisplayName = safeName(userProfile);
  // userDisplayEmail removed

  // If showing article submission page
  if (showArticleSubmission) {
    return (
      <ArticleSubmissionForm
        onBack={() => setShowArticleSubmission(false)}
      />
    );
  }

  // ✅ Show Articles Page
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

  // ✅ NEW: Show All Testimonials Page
  if (showAllTestimonialsPage) {
    return (
      <AllTestimonialsPage
        onBack={() => setShowAllTestimonialsPage(false)}
      />
    );
  }

  // ✅ NEW: Show Article Detail Page
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Background Kaaba with Overlay */}
      <div className="fixed inset-0 z-0">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url(${kaabaImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/60 to-white/80" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header Navbar */}
        <nav className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-b border-[#D4AF37]/20 shadow-lg">
          <div className="h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              {/* Logo + Title */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-[#D4AF37]/10 to-[#FFD700]/10 p-1.5 flex-shrink-0 shadow-md">
                  <img src={sultanahLogo} alt="Sultanah Travel" className="w-full h-full object-contain" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 font-light tracking-wide">
                    Welcome to
                  </span>
                  <h1 className="text-base font-bold bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#F4D03F] bg-clip-text text-transparent leading-tight">
                    Alumni Jamaah Umroh Portal
                  </h1>
                </div>
              </div>

              {/* Desktop Menu */}
              <div className="hidden lg:flex items-center gap-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => handleSectionClick(section)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap ${activeSection === section.id
                      ? 'text-[#D4AF37] bg-[#D4AF37]/10'
                      : 'text-gray-700 hover:text-[#D4AF37] hover:bg-gray-50'
                      }`}
                  >
                    {section.title}
                  </button>
                ))}

                {/* ✅ Tour Leader Rating Button - Desktop (COMPACT) */}
                {/* ✅ Rating TL Button - ALWAYS ACTIVE for Alumni */}
                <button
                  onClick={() => setRatingModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-300 font-medium text-sm whitespace-nowrap bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:shadow-lg hover:scale-105"
                  title="Beri rating untuk Tour Leader Anda"
                >
                  <Star className="w-4 h-4" />
                  <span className="hidden xl:inline">Rating TL</span>
                </button>

                {/* Profile Button - Desktop */}
                <button
                  onClick={onNavigateToProfile}
                  className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-[#D4AF37] to-[#C5A572] text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-300 font-medium text-sm whitespace-nowrap"
                >
                  <User className="w-4 h-4" />
                  <span>Profil</span>
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* SECTION 1: DASHBOARD */}
        <div
          ref={(el: HTMLDivElement | null) => { sectionRefs.current['dashboard'] = el; }}
          className="min-h-screen pt-24 md:pt-32 pb-16 px-4 sm:px-6 lg:px-8 relative"
        >
          {/* Kaaba Background with Dark Overlay */}
          <div className="absolute inset-0 z-0">
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `url(${kaabaImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 via-gray-800/70 to-gray-900/80" />
          </div>

          <div className="max-w-7xl mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-8"
            >
              <h2 className="text-3xl md:text-4xl font-light mb-3 text-white">
                <span className="bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#F4D03F] bg-clip-text text-transparent">
                  Dashboard Alumni
                </span>
              </h2>
              <p className="text-gray-300">Statistik dan informasi aktivitas Anda</p>
            </motion.div>

            {/* Welcome Card */}
            <Card className="bg-white/10 backdrop-blur-xl border-[#D4AF37]/30 mb-8">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#C5A572] flex items-center justify-center shadow-lg">
                    <Award className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-2 text-white">
                      Assalamu'alaikum, {userDisplayName}!
                    </h3>
                    <p className="text-gray-300 mb-4">
                      Terima kasih telah menyelesaikan perjalanan umrah bersama kami! Sebagai Alumni, Anda dapat
                      mengakses program referral, berbagi testimonial, dan mendapatkan benefit spesial.
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>Alumni sejak {formatDate(userProfile?.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="bg-white/10 backdrop-blur-xl border-blue-400/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-300 mb-1">Total Referrals</p>
                      <p className="text-3xl font-bold text-white">{referralData?.totalReferrals || 0}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-xl border-green-400/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-300 mb-1">Successful</p>
                      <p className="text-3xl font-bold text-white">{referralData?.successfulReferrals || 0}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-xl border-[#D4AF37]/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-300 mb-1">Status</p>
                      <p className="text-lg font-bold text-[#FFD700]">Verified Alumni</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#FFD700] flex items-center justify-center">
                      <Star className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card
                className="bg-white/10 backdrop-blur-xl border-[#D4AF37]/30 hover:bg-white/15 transition-all cursor-pointer"
                onClick={() => handleSectionClick(sections[1])}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#FFD700] flex items-center justify-center">
                      <Gift className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1 text-white">Program Referral 🎁</h3>
                      <p className="text-sm text-gray-300">Ajak teman & dapatkan komisi!</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="bg-white/10 backdrop-blur-xl border-purple-400/30 hover:bg-white/15 transition-all cursor-pointer"
                onClick={() => handleSectionClick(sections[3])}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                      <Star className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1 text-white">Share Testimonial ⭐</h3>
                      <p className="text-sm text-gray-300">Ceritakan pengalaman umrah</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* SECTION 2: REFERRAL PROGRAM */}
        <div
          ref={(el) => { sectionRefs.current['referral'] = el; }}
          className="min-h-screen py-16 px-4 sm:px-6 lg:px-8"
        >
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-8"
            >
              <h2 className="text-3xl md:text-4xl font-light mb-3">
                <span className="bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#F4D03F] bg-clip-text text-transparent">
                  Referral Program
                </span>
              </h2>
              <p className="text-gray-600">Dapatkan reward dengan mengajak teman & keluarga</p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Referral Code Card */}
              <Card className="bg-white/80 backdrop-blur-xl border-[#D4AF37]/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-[#D4AF37]" />
                    Kode Referral Anda
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-6 rounded-lg bg-gradient-to-br from-[#D4AF37]/10 to-[#FFD700]/10 border-2 border-[#D4AF37]/30 mb-6">
                    <div className="flex items-center justify-center p-6 bg-white rounded-lg border-2 border-dashed border-[#D4AF37]">
                      <p className="text-2xl md:text-3xl font-bold text-[#D4AF37] tracking-wider">
                        {referralData?.code || 'Loading...'}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <Label className="text-sm font-semibold mb-2 block">Link Referral Anda</Label>
                    <div className="flex gap-2">
                      <Input
                        value={referralLink}
                        readOnly
                        className="flex-1 bg-gray-50 border-[#D4AF37]/30 text-sm"
                      />
                      <Button
                        onClick={handleCopyLink}
                        className={`${copied
                          ? 'bg-green-500 hover:bg-green-600'
                          : 'bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] hover:opacity-90'
                          } text-white transition-all`}
                      >
                        {copied ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Tersalin!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Salin
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">Total</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-600">{referralData?.totalReferrals || 0}</p>
                    </div>

                    <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-green-900">Sukses</span>
                      </div>
                      <p className="text-2xl font-bold text-green-600">{referralData?.successfulReferrals || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* How it Works */}
              <Card className="bg-white/80 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#D4AF37]" />
                    Cara Kerja
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#FFD700] text-white flex items-center justify-center flex-shrink-0 font-bold text-lg">
                        1
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Bagikan Link Anda</h4>
                        <p className="text-sm text-gray-600">
                          Bagikan link referral unik Anda kepada teman, keluarga, atau komunitas Anda
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#FFD700] text-white flex items-center justify-center flex-shrink-0 font-bold text-lg">
                        2
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Mereka Daftar & Booking</h4>
                        <p className="text-sm text-gray-600">
                          Teman Anda mendaftar menggunakan link referral dan melakukan booking paket umrah
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#FFD700] text-white flex items-center justify-center flex-shrink-0 font-bold text-lg">
                        3
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Dapatkan Reward</h4>
                        <p className="text-sm text-gray-600">
                          Anda mendapatkan komisi dan diskon spesial untuk perjalanan umrah berikutnya
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 p-4 rounded-lg bg-gradient-to-r from-[#D4AF37]/10 to-[#FFD700]/10 border border-[#D4AF37]/30">
                    <h4 className="font-semibold text-[#D4AF37] mb-2">🎁 Benefit Spesial</h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Komisi untuk setiap referral yang berhasil booking</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Diskon eksklusif untuk perjalanan umrah berikutnya</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Prioritas layanan untuk alumni aktif</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Commission Details Section - Full Width */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="mt-8"
            >
              <Card className="bg-gradient-to-br from-[#D4AF37]/5 via-white to-[#FFD700]/5 border-2 border-[#D4AF37]/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#FFD700] flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-white" />
                    </div>
                    <span>Detail Komisi Referral</span>
                  </CardTitle>
                  <p className="text-gray-600 mt-2">Informasi lengkap tentang penghasilan komisi Anda</p>
                </CardHeader>
                <CardContent>
                  {/* Main Commission Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Total Earned */}
                    <div className="p-6 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                          <DollarSign className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xs font-medium text-green-700 bg-green-100 px-3 py-1 rounded-full">
                          Total Earned
                        </span>
                      </div>
                      <h3 className="text-sm font-medium text-green-900 mb-1">Total Komisi Terkumpul</h3>
                      <p className="text-3xl font-bold text-green-700">
                        Rp {(referralData?.totalCommissionEarned || 0).toLocaleString('id-ID')}
                      </p>
                      <p className="text-xs text-green-600 mt-2">
                        Dari {referralData?.successfulReferrals || 0} referral sukses
                      </p>
                    </div>

                    {/* Pending Commission */}
                    <div className="p-6 rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center">
                          <Clock3 className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xs font-medium text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
                          Pending
                        </span>
                      </div>
                      <h3 className="text-sm font-medium text-amber-900 mb-1">Komisi Tertunda</h3>
                      <p className="text-3xl font-bold text-amber-700">
                        Rp {(referralData?.pendingCommission || 0).toLocaleString('id-ID')}
                      </p>
                      <p className="text-xs text-amber-600 mt-2">
                        Menunggu pembayaran
                      </p>
                    </div>

                    {/* Paid Commission */}
                    <div className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xs font-medium text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
                          Paid
                        </span>
                      </div>
                      <h3 className="text-sm font-medium text-blue-900 mb-1">Komisi Telah Dibayar</h3>
                      <p className="text-3xl font-bold text-blue-700">
                        Rp {(referralData?.paidCommission || 0).toLocaleString('id-ID')}
                      </p>
                      <p className="text-xs text-blue-600 mt-2">
                        Sudah ditransfer ke rekening
                      </p>
                    </div>
                  </div>

                  {/* Commission Structure Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Per Referral Commission */}
                    <div className="p-6 rounded-xl border-2 border-[#D4AF37]/30 bg-gradient-to-br from-[#D4AF37]/5 to-[#FFD700]/5">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#FFD700] flex items-center justify-center flex-shrink-0">
                          <Gift className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-2">Komisi Per Referral Sukses</h3>
                          <div className="flex items-baseline gap-2 mb-3">
                            <span className="text-4xl font-bold bg-gradient-to-r from-[#D4AF37] to-[#FFD700] bg-clip-text text-transparent">
                              Rp {(referralData?.commissionPerReferral || 0).toLocaleString('id-ID')}
                            </span>
                          </div>

                          {/* ✅ ENHANCED: Clear explanation about commission flow */}
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
                            <p className="text-sm font-semibold text-amber-900 flex items-center gap-2">
                              <span className="inline-block w-2 h-2 bg-amber-500 rounded-full"></span>
                              Cara Mendapatkan Komisi:
                            </p>

                            <ol className="text-sm text-gray-700 space-y-2 ml-4">
                              <li className="flex items-start gap-2">
                                <span className="font-bold text-[#D4AF37] mt-0.5">1.</span>
                                <span>User daftar menggunakan <strong>kode referral Anda</strong></span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="font-bold text-[#D4AF37] mt-0.5">2.</span>
                                <span>User melakukan <strong>pembayaran paket umrah</strong></span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="font-bold text-[#D4AF37] mt-0.5">3.</span>
                                <span>Admin <strong>approve pembayaran</strong> tersebut</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="font-bold text-green-600 mt-0.5">✓</span>
                                <span><strong className="text-green-600">Komisi Rp200.000 aktif</strong> dan bisa diajukan pencairan</span>
                              </li>
                            </ol>

                            <div className="pt-3 border-t border-amber-200">
                              <p className="text-xs text-gray-600 italic">
                                <strong>Catatan:</strong> Booking saja belum dihitung. Komisi hanya aktif setelah pembayaran di-approve admin.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Commission Percentage */}
                    <div className="p-6 rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
                          <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-2">Persentase Komisi</h3>
                          <div className="flex items-baseline gap-2 mb-3">
                            <span className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                              {referralData?.commissionPercentage || 0}%
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            Dari total nilai paket umrah yang dibooking oleh referral Anda. Semakin banyak yang booking, semakin besar penghasilan Anda!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ✅ NEW: Available Balance & Withdrawal Button */}
                  <div className="mt-6 p-6 rounded-xl bg-gradient-to-br from-green-500 to-green-600 border-2 border-green-400 shadow-lg">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex items-center gap-4 text-white">
                        <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0">
                          <Wallet className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <p className="text-white/90 text-sm font-medium mb-1">💰 Saldo Komisi Tersedia</p>
                          <p className="text-3xl font-bold text-white">
                            Rp {commissionBalance.toLocaleString('id-ID')}
                          </p>
                          <p className="text-white/80 text-xs mt-1">Bisa dicairkan kapan saja</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => setShowWithdrawalForm(true)}
                        disabled={commissionBalance <= 0}
                        className="bg-white text-green-600 hover:bg-white/90 gap-2 px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                      >
                        <Wallet className="w-5 h-5" />
                        Ajukan Pencairan Komisi
                      </Button>
                    </div>
                  </div>

                  {/* Info Banner */}
                  <div className="mt-6 p-6 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                        <DollarSign className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-blue-900 mb-2">💡 Cara Pencairan Komisi</h4>
                        <p className="text-sm text-blue-800 mb-3">
                          Komisi akan dibayarkan setiap bulan untuk referral yang telah berhasil melakukan pelunasan pembayaran paket umrah.
                          Transfer dilakukan ke rekening yang Anda daftarkan di profil.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                            ✓ Pembayaran rutin bulanan
                          </span>
                          <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                            ✓ Tanpa minimum pencairan
                          </span>
                          <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                            ✓ Tracking real-time
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* SECTION 3: DAFTAR ALUMNI */}
        <div
          ref={(el) => { if (el) sectionRefs.current['daftar'] = el; }}
          className="min-h-screen py-16 px-4 sm:px-6 lg:px-8"
        >
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-8"
            >
              <h2 className="text-3xl md:text-4xl font-light mb-3">
                <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                  Daftar Alumni
                </span>
              </h2>
              <p className="text-gray-600">Lihat daftar lengkap alumni Jamaah Umroh Sultanah</p>
            </motion.div>

            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Cari alumni berdasarkan nama, email, atau kota..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/80 backdrop-blur-xl border-blue-200"
                />
              </div>
            </div>

            {/* Alumni List */}
            {loadingAlumni ? (
              <div className="text-center py-12 text-gray-500">
                Memuat daftar alumni...
              </div>
            ) : filteredAlumni.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAlumni.map((user, index) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="bg-white/80 backdrop-blur-xl hover:shadow-xl transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold text-xl flex-shrink-0">
                            {user.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-800 mb-1 truncate">
                              {user.fullName}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2 truncate">
                              {user.email}
                            </p>
                            {user.city && (
                              <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                                <MapPin className="w-3 h-3" />
                                <span className="truncate">{user.city}</span>
                              </div>
                            )}
                            {user.packageName && (
                              <div className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                {user.packageName}
                              </div>
                            )}
                            <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                              <Calendar className="w-3 h-3" />
                              <span>Alumni sejak {formatDate(user.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <Card className="bg-white/80 backdrop-blur-xl">
                <CardContent className="p-12">
                  <div className="text-center">
                    <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-xl font-semibold mb-2">Tidak Ada Alumni</h3>
                    <p className="text-gray-600">
                      {searchQuery ? 'Tidak ditemukan alumni dengan kriteria pencarian tersebut' : 'Belum ada alumni yang terdaftar'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* SECTION 4: TESTIMONIAL - ✅ SAME AS JAMAAH UMROH */}
        <section
          ref={(el) => { sectionRefs.current['testimonial'] = el as HTMLDivElement; }}
          className="relative min-h-screen bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(https://images.unsplash.com/photo-1647221467105-a851179dccda?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpc2xhbWljJTIwbW9zcXVlJTIwaW50ZXJpb3J8ZW58MXx8fHwxNzY3MTA3NzEyfDA&ixlib=rb-4.1.0&q=80&w=1080)` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70"></div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Testimoni Jamaah</h2>
              <p className="text-xl text-white/90 max-w-3xl mx-auto">
                Bagikan pengalaman spiritual Anda kepada calon jamaah
              </p>
            </div>

            {/* Submit Testimonial Button - Positioned above testimonials list */}
            <div className="flex justify-center mb-8">
              <Button
                onClick={() => setShowTestimonialSubmit(true)}
                className="bg-gradient-to-r from-[#D4AF37] to-[#C5A572] hover:opacity-90 text-white border-0 shadow-lg text-lg px-8 py-6 h-auto"
              >
                <Star className="w-5 h-5 mr-2" />
                Tulis Testimoni
              </Button>
            </div>

            {/* ✅ SHARED COMPONENT: Unified Testimonial Section */}
            <TestimonialSection
              testimonials={testimonials}
              loading={loadingTestimonials}
              emptyMessage="Belum Ada Testimoni"
              showSubmitButton={false}
              maxItems={3}
              onTestimonialClick={(testimonial) => {
                setSelectedTestimonial(testimonial);
                setShowTestimonialDetail(true);
              }}
            />

            {/* ✅ NEW: "Lihat Semua Testimoni" Button - Only show if more than 3 testimonials */}
            {testimonials.length > 3 && (
              <div className="flex justify-center mt-12">
                <button
                  onClick={() => setShowAllTestimonialsPage(true)}
                  className="group inline-flex items-center gap-3 px-8 py-4 bg-white hover:bg-emerald-50 border-2 border-emerald-600 rounded-xl text-emerald-700 font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <span>Lihat Semua Testimoni</span>
                  <span className="text-2xl group-hover:translate-x-2 transition-transform duration-300">→</span>
                </button>
              </div>
            )}
          </div>
        </section>

        {/* SECTION 5: NEWS & ARTICLES - ✅ SAME AS JAMAAH UMROH */}
        <section
          ref={(el: HTMLDivElement | null) => { sectionRefs.current['news'] = el; }}
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
              articles={articles}
              loading={loadingArticles}
              emptyMessage="Segera Hadir"
              maxItems={3}
              onArticleClick={(articleId) => {
                setSelectedArticleId(articleId);
                setShowArticleDetail(true);
              }}
              showSubmitButton={false}
              onSubmitClick={() => setShowArticleSubmission(true)}
            />

            {/* ✅ "Lihat Semua Artikel" + "Submit Article" Buttons - Show if more than 3 articles */}
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
                  <span>Submit Article</span>
                </button>
              </div>
            )}
          </div>
        </section>

        {/* SECTION 6: CONTACT US */}
        <div
          ref={(el: HTMLDivElement | null) => { sectionRefs.current['referral'] = el; }}
          className="min-h-screen py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#FFF9F0] via-white to-[#FFF9F0]"
        >
          <AlumniContactSection
            contactForm={contactForm}
            setContactForm={setContactForm}
            sendingMessage={sendingMessage}
            setSendingMessage={setSendingMessage}
          />
        </div>

        {/* Floating WhatsApp Button */}
        <a
          href="https://api.whatsapp.com/send/?phone=6281234700116&text=Halo%20Sultanah%20Travel%2C%20saya%20alumni%20umroh%20ingin%20bertanya&type=phone_number&app_absent=0"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-24 md:bottom-6 right-6 z-40 group"
          aria-label="Chat on WhatsApp"
        >
          <div className="relative">
            {/* Pulsing ring */}
            <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75" />

            {/* Button */}
            <div className="relative w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full shadow-2xl flex items-center justify-center transform transition-all duration-300 hover:scale-110 hover:shadow-[0_0_30px_rgba(34,197,94,0.5)]">
              <MessageCircle className="w-7 h-7 md:w-8 md:h-8 text-white" />
            </div>

            {/* Tooltip */}
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              Chat dengan kami
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full border-8 border-transparent border-l-gray-900" />
            </div>
          </div>
        </a>

        {/* Bottom Padding for Mobile Nav */}
        <div className="h-24 md:h-8" />
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <AlumniBottomNav
        activeSection={activeSection}
        onNavigate={handleBottomNavClick}
        onProfileClick={onNavigateToProfile}
        onRatingClick={() => setRatingModalOpen(true)}
        hasCompletedTrip={true}
      />

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
        onConfirm={handleLogout}
        title="Konfirmasi Keluar"
        message="Apakah Anda yakin ingin keluar dari Alumni Portal?"
        confirmText="Ya, Keluar"
        cancelText="Batal"
      />

      {/* ✅ NEW: Commission Withdrawal Form Dialog */}
      <CommissionWithdrawalForm
        open={showWithdrawalForm}
        onClose={() => setShowWithdrawalForm(false)}
        onSubmit={async (data: WithdrawalFormData) => {
          try {
            if (!currentUser || !userProfile) {
              toast.error('Data user tidak ditemukan');
              return;
            }

            // Create withdrawal request
            await addDoc(collection(db, 'commissionWithdrawals'), {
              userId: currentUser.uid,
              userName: userProfile.displayName || userProfile.identityInfo?.fullName || userProfile.email,
              userEmail: userProfile.email,
              userType: 'alumni',
              amount: data.amount,
              paymentMethod: data.paymentMethod,
              bankName: data.bankName || '',
              accountNumber: data.accountNumber || '',
              accountHolderName: data.accountHolderName || '',
              ewalletProvider: data.ewalletProvider || '',
              ewalletNumber: data.ewalletNumber || '',
              ewalletAccountName: data.ewalletAccountName || '',
              status: 'pending',
              requestDate: Timestamp.now(),
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now(),
            });

            toast.success('Pengajuan pencairan berhasil! Mohon tunggu konfirmasi admin.');
            setShowWithdrawalForm(false);

            // Reload commission balance
            const userRef = doc(db, 'users', currentUser.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              const userData = userSnap.data();
              setCommissionBalance(userData.commissionBalance || 0);
            }
          } catch (error) {
            console.error('Error submitting withdrawal:', error);
            toast.error('Gagal mengajukan pencairan');
          }
        }}
        maxAmount={commissionBalance}
        userType="alumni"
      />

      {/* ✅ NEW: Testimonial Submit Dialog */}
      <TestimonialSubmitDialog
        open={showTestimonialSubmit}
        onClose={() => setShowTestimonialSubmit(false)}
        userId={currentUser?.uid || ''}
        userName={userProfile?.displayName || currentUser?.email || ''}
        userEmail={currentUser?.email || ''}
        packageName={undefined}
      />

      {/* ✅ NEW: Testimonial Detail Dialog */}
      <TestimonialDetailDialog
        open={showTestimonialDetail}
        onClose={() => {
          setShowTestimonialDetail(false);
          setSelectedTestimonial(null);
        }}
        testimonial={selectedTestimonial}
      />

      {/* ✅ NEW: Tour Leader Rating Modal - ALWAYS ACTIVE for Alumni */}
      {currentUser && (
        <TourLeaderRatingModal
          isOpen={ratingModalOpen}
          onClose={() => setRatingModalOpen(false)}
          currentUserId={currentUser.uid}
          currentUserName={userProfile?.displayName || currentUser.email || ''}
        />
      )}

      {/* ✅ NEW: Agent Upgrade Dialog */}
      <AgentUpgradeDialog
        open={showAgentUpgradeDialog}
        onOpenChange={setShowAgentUpgradeDialog}
        currentUser={currentUser}
        autoCreateReferralCode={autoCreateReferralCode}
      />
    </div>
  );
};

export default AlumniPortalScrollable;