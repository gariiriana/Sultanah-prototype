import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import ProfileForm from './ProfileForm';
import PackageDetail from './PackageDetail';
import PromoDetail from './PromoDetail';
import EducationDetail from './EducationDetail';
import ArticlesPage from '../user/ArticlesPage';
import ArticleDetailPage from '../user/ArticleDetailPage';
import AllPackagesPage from './AllPackagesPage';
import AllPromosPage from './AllPromosPage';
import AllEducationPage from './AllEducationPage';
import AllTestimonialsPage from './AllTestimonialsPage';
import TestimonialDetailDialog from '../../components/TestimonialDetailDialog';
import FloatingAnnouncementWidget from '../../components/FloatingAnnouncementWidget';
import AdsBanner from '../../components/AdsBanner'; // ✅ NEW: Ads Banner
import { useAuth } from '../../../contexts/AuthContext';
import { db } from '../../../config/firebase';
import { doc, updateDoc, collection, addDoc, query, where, getDocs, getDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { toast } from 'sonner';
import { Promo } from '../../../types';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Upload,
  FileText,
  User,
  Calendar,
  Package,
  Newspaper,
  TrendingUp,
  Phone,
  Mail,
  GraduationCap,
  BookOpen,
  MapPin,
  MessageCircle,
  Star,
  Home,
  Quote,
  ThumbsUp,
  Users,
  Check,
  Gift,
  Tag,
  Sparkles,
  Send,
  Clock3,
  Facebook,
  Instagram,
  Twitter,
  XCircle
} from 'lucide-react';

import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Input } from '../../components/ui/input';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog';

// Import Kaaba background image - UPDATED with beautiful Masjid al-Haram view
// ✅ BEAUTIFUL IMAGES: Mecca Grand Mosque & Logo
const kaabaImage = 'https://images.unsplash.com/photo-1571909552531-1601eaec8f79?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWNjYSUyMGdyYW5kJTIwbW9zcXVlfGVufDF8fHx8MTc2ODE4NDU1MHww&ixlib=rb-4.1.0&q=80&w=1080';
const sultanahLogo = '/images/logo.png';

interface UpgradeRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  targetRole: 'current-jamaah';
  requestDate: any;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewDate?: any;
  rejectionReason?: string;
}

const ProspectiveJamaahDashboard = () => {
  const { currentUser, userProfile } = useAuth();
  const [showUpgradeStatus, setShowUpgradeStatus] = useState(false); // For separate upgrade page
  const [showProfilePage, setShowProfilePage] = useState(false); // For separate profile page
  const [loading, setLoading] = useState(false);
  const [upgradeRequest, setUpgradeRequest] = useState<UpgradeRequest | null>(null);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  // ✅ NEW: State for user documents from separate collection
  const [userDocuments, setUserDocuments] = useState<any>(null);

  // Form states for upgrade request
  const [upgradeName, setUpgradeName] = useState('');
  const [upgradeEmail, setUpgradeEmail] = useState('');
  const [upgradePhone, setUpgradePhone] = useState('');

  // Profile form states
  const [formData, setFormData] = useState({
    displayName: userProfile?.displayName || '',
    phoneNumber: userProfile?.phoneNumber || '',
    fullName: userProfile?.identityInfo?.fullName || '',
    idNumber: userProfile?.identityInfo?.idNumber || '',
    birthDate: userProfile?.identityInfo?.birthDate || '',
    address: userProfile?.identityInfo?.address || '',
    passportNumber: userProfile?.travelDocuments?.passportNumber || '',
    passportExpiry: userProfile?.travelDocuments?.passportExpiry || '',
    emergencyName: userProfile?.emergencyContact?.name || '',
    emergencyPhone: userProfile?.emergencyContact?.phone || '',
    emergencyRelationship: userProfile?.emergencyContact?.relationship || '',
  });

  // Package states
  const [packages, setPackages] = useState<any[]>([]);
  const [showProfileDialog, setShowProfileDialog] = useState(false);

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
  const [showArticlesPage, setShowArticlesPage] = useState(false);
  const [showArticleDetail, setShowArticleDetail] = useState(false);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);

  // ✅ NEW: "View All" page states
  const [showAllPackagesPage, setShowAllPackagesPage] = useState(false);
  const [showAllPromosPage, setShowAllPromosPage] = useState(false);
  const [showAllEducationPage, setShowAllEducationPage] = useState(false);
  const [showAllTestimonialsPage, setShowAllTestimonialsPage] = useState(false);
  const [showTestimonialDetail, setShowTestimonialDetail] = useState(false);
  const [selectedTestimonial, setSelectedTestimonial] = useState<any>(null);

  // Contact form states
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [sendingMessage, setSendingMessage] = useState(false);

  // Refs for scroll
  const dashboardRef = useRef<HTMLDivElement>(null);
  const packagesRef = useRef<HTMLDivElement>(null);
  const promosRef = useRef<HTMLDivElement>(null);
  const educationRef = useRef<HTMLDivElement>(null);
  const newsRef = useRef<HTMLDivElement>(null);
  const testimonialsRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);


  // Profile completion dialog state
  const [showProfileIncompleteDialog, setShowProfileIncompleteDialog] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);

  // Package detail page state
  const [showPackageDetail, setShowPackageDetail] = useState(false);

  // Education detail page state
  const [showEducationDetail, setShowEducationDetail] = useState(false);
  const [selectedEducationId, setSelectedEducationId] = useState<string | null>(null);

  useEffect(() => {
    fetchUpgradeRequest();
    fetchPackages();
    fetchPromos();
    fetchTestimonials();
    fetchEducations();
    fetchArticles();
  }, [currentUser]);

  // ✅ NEW: Fetch user documents from separate collection
  useEffect(() => {
    const fetchUserDocuments = async () => {
      if (!currentUser) return;

      try {
        const userDocsRef = doc(db, 'userDocuments', currentUser.uid);
        const userDocsSnap = await getDoc(userDocsRef);

        if (userDocsSnap.exists()) {
          setUserDocuments(userDocsSnap.data());
          console.log('✅ User documents loaded for validation:', {
            hasPassport: !!userDocsSnap.data().documents?.passportPhoto,
            hasKTP: !!userDocsSnap.data().documents?.ktpPhoto,
            totalDocs: Object.keys(userDocsSnap.data().documents || {}).length
          });
        } else {
          setUserDocuments(null);
          console.log('📝 No documents found - profile incomplete');
        }
      } catch (error) {
        console.error('Error fetching user documents:', error);
        setUserDocuments(null);
      }
    };

    fetchUserDocuments();
  }, [currentUser]);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const fetchUpgradeRequest = async () => {
    if (!currentUser) return;

    try {
      const q = query(
        collection(db, 'upgradeRequests'),
        where('userId', '==', currentUser.uid),
        where('targetRole', '==', 'current-jamaah')
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const data = querySnapshot.docs[0].data() as UpgradeRequest;
        // spread data first, then overwrite id if needed
        setUpgradeRequest({
          ...data,
          id: querySnapshot.docs[0].id
        });
      } else {
        // No upgrade request found - this is normal for new users
        setUpgradeRequest(null);
      }
    } catch (error: any) {
      // If permission denied, it might be because there's no data yet
      // This is expected for new users who haven't created a request
      if (error?.code === 'permission-denied') {
        console.log('No upgrade request found (permission denied on empty collection)');
        setUpgradeRequest(null);
      } else {
        console.error('Error fetching upgrade request:', error);
      }
    }
  };

  // Calculate profile completion
  const calculateProfileCompletion = () => {
    const fields = [
      userProfile?.displayName,
      userProfile?.phoneNumber,
      userProfile?.identityInfo?.fullName,
      userProfile?.identityInfo?.idNumber,
      userProfile?.identityInfo?.birthDate,
      userProfile?.identityInfo?.country,
      userProfile?.identityInfo?.state,
      userProfile?.identityInfo?.city,
      userProfile?.identityInfo?.postalCode,
      userProfile?.identityInfo?.streetAddress,
      // ✅ FIXED: Read from userDocuments state instead of userProfile.travelDocuments
      userDocuments?.passportNumber,
      userDocuments?.passportExpiry,
      userDocuments?.documents?.passportPhoto,
      userDocuments?.documents?.ktpPhoto,
      userDocuments?.documents?.kkPhoto,
      userDocuments?.documents?.birthCertificate,
      userDocuments?.documents?.visaDocument,
      userDocuments?.documents?.flightTicket,
      userDocuments?.documents?.vaccinationCertificate,
      userProfile?.emergencyContact?.name,
      userProfile?.emergencyContact?.phone,
      userProfile?.emergencyContact?.relationship
    ];

    const filledFields = fields.filter(field => field && field !== '').length;
    const completion = Math.round((filledFields / fields.length) * 100);
    return { completion, total: fields.length, filled: filledFields };
  };

  // Get missing fields list
  const getMissingFields = () => {
    const fieldNames = [
      { key: userProfile?.displayName, label: 'Display Name' },
      { key: userProfile?.phoneNumber, label: 'Phone Number' },
      { key: userProfile?.identityInfo?.fullName, label: 'Full Name' },
      { key: userProfile?.identityInfo?.idNumber, label: 'ID Number (KTP/Passport)' },
      { key: userProfile?.identityInfo?.birthDate, label: 'Birth Date' },
      { key: userProfile?.identityInfo?.country, label: 'Country' },
      { key: userProfile?.identityInfo?.state, label: 'State/Province' },
      { key: userProfile?.identityInfo?.city, label: 'City' },
      { key: userProfile?.identityInfo?.postalCode, label: 'Postal Code' },
      { key: userProfile?.identityInfo?.streetAddress, label: 'Street Address' },
      // ✅ FIXED: Read from userDocuments state instead of userProfile.travelDocuments
      { key: userDocuments?.passportNumber, label: 'Passport Number' },
      { key: userDocuments?.passportExpiry, label: 'Passport Expiry' },
      { key: userDocuments?.documents?.passportPhoto, label: 'Passport Photo' },
      { key: userDocuments?.documents?.ktpPhoto, label: 'KTP Photo' },
      { key: userDocuments?.documents?.kkPhoto, label: 'KK Document' },
      { key: userDocuments?.documents?.birthCertificate, label: 'Birth Certificate' },
      { key: userDocuments?.documents?.visaDocument, label: 'Visa Document' },
      { key: userDocuments?.documents?.flightTicket, label: 'Flight Ticket' },
      { key: userDocuments?.documents?.vaccinationCertificate, label: 'Vaccination Certificate' },
      { key: userProfile?.emergencyContact?.name, label: 'Emergency Contact Name' },
      { key: userProfile?.emergencyContact?.phone, label: 'Emergency Contact Phone' },
      { key: userProfile?.emergencyContact?.relationship, label: 'Emergency Contact Relationship' }
    ];

    return fieldNames.filter(field => !field.key || field.key === '').map(field => field.label);
  };

  const handleSubmitUpgrade = async () => {
    if (!currentUser) return;

    // Check profile completion first
    const { completion } = calculateProfileCompletion();
    if (completion < 100) {
      toast.error('Profil belum lengkap!', {
        description: `Lengkapi profil Anda (${completion}%) sebelum upgrade ke Jamaah Umroh`
      });
      setShowUpgradeDialog(false);
      setShowProfileIncompleteDialog(true);
      return;
    }

    // Validate required fields
    if (!upgradeName.trim()) {
      toast.error('Nama wajib diisi');
      return;
    }

    if (!upgradeEmail.trim()) {
      toast.error('Email wajib diisi');
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(upgradeEmail)) {
      toast.error('Format email tidak valid');
      return;
    }

    if (!upgradePhone.trim()) {
      toast.error('No WhatsApp wajib diisi');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'upgradeRequests'), {
        userId: currentUser.uid,
        userName: upgradeName.trim(),
        userEmail: upgradeEmail.trim(),
        userPhone: upgradePhone.trim(),
        targetRole: 'current-jamaah',
        requestDate: serverTimestamp(),
        status: 'pending'
      });

      toast.success('Upgrade request submitted!', {
        description: 'Admin akan meninjau request Anda segera.'
      });

      setShowUpgradeDialog(false);
      setUpgradeName('');
      setUpgradeEmail('');
      setUpgradePhone('');
      fetchUpgradeRequest();
    } catch (error) {
      console.error('Error submitting upgrade request:', error);
      toast.error('Failed to submit request');
    } finally {
      setLoading(false);
    }
  };



  // Check if profile is complete for booking
  const checkProfileComplete = () => {
    if (!userProfile) {
      console.log('❌ Profile check: No userProfile');
      return false;
    }

    const requiredFields = [
      userProfile?.displayName,
      userProfile?.phoneNumber,
      userProfile?.identityInfo?.fullName,
      userProfile?.identityInfo?.idNumber,
      userProfile?.identityInfo?.birthDate,
      userProfile?.identityInfo?.country,
      userProfile?.identityInfo?.state,
      userProfile?.identityInfo?.city,
      userProfile?.identityInfo?.postalCode,
      userProfile?.identityInfo?.streetAddress,
    ];

    const requiredDocuments = [
      userProfile?.travelDocuments?.passportNumber,
      userProfile?.travelDocuments?.passportExpiry,
      userProfile?.travelDocuments?.passportPhoto,
      userProfile?.travelDocuments?.ktpPhoto,
      userProfile?.travelDocuments?.kkPhoto,
      userProfile?.travelDocuments?.birthCertificate,
      userProfile?.travelDocuments?.visaDocument,
      userProfile?.travelDocuments?.flightTicket,
      userProfile?.travelDocuments?.vaccinationCertificate,
    ];

    const requiredEmergencyContact = [
      userProfile?.emergencyContact?.name,
      userProfile?.emergencyContact?.phone,
      userProfile?.emergencyContact?.relationship,
    ];

    const allFieldsFilled = requiredFields.every(field => field && field !== '');
    const allDocumentsUploaded = requiredDocuments.every(doc => doc && doc !== '');
    const emergencyContactFilled = requiredEmergencyContact.every(field => field && field !== '');

    console.log('✅ Profile check results:', {
      allFieldsFilled,
      allDocumentsUploaded,
      emergencyContactFilled,
      totalComplete: allFieldsFilled && allDocumentsUploaded && emergencyContactFilled
    });

    return allFieldsFilled && allDocumentsUploaded && emergencyContactFilled;
  };

  // Handle book now click
  const handleBookNow = (pkg: any) => {
    console.log('🎯 Book Now clicked!');
    console.log('📦 Package data:', pkg);

    if (!pkg) {
      console.error('❌ No package data!');
      toast.error('Package data not available');
      return;
    }

    const isComplete = checkProfileComplete();

    console.log('📊 Profile complete status:', isComplete);

    if (!isComplete) {
      console.log('⚠️ Profile incomplete, showing dialog...');
      setSelectedPackage(pkg);
      setShowProfileIncompleteDialog(true);

      // Force trigger dialog after short delay to ensure state update
      setTimeout(() => {
        console.log('Dialog state after 100ms:', showProfileIncompleteDialog);
      }, 100);
    } else {
      // Profile is complete, proceed to package detail page
      console.log('✅ Profile complete, showing package detail...');
      setSelectedPackage(pkg);
      setShowPackageDetail(true);
    }
  };

  // Handle view promo click
  const handleViewPromo = (promo: Promo) => {
    console.log('🎁 View Promo clicked!');
    console.log('🎫 Promo data:', promo);

    if (!promo) {
      console.error('❌ No promo data!');
      toast.error('Promo data not available');
      return;
    }

    const isComplete = checkProfileComplete();

    console.log('📊 Profile complete status:', isComplete);

    if (!isComplete) {
      console.log('⚠️ Profile incomplete, showing dialog...');
      setSelectedPromo(promo);
      setShowProfileIncompleteDialog(true);
    } else {
      // Profile is complete, proceed to promo detail
      console.log('✅ Profile complete, showing promo detail...');
      setSelectedPromo(promo);
      setShowPromoDetail(true);
    }
  };

  // Handle view education click
  const handleViewEducation = (educationId: string) => {
    console.log('📚 View Education clicked! ID:', educationId);
    setSelectedEducationId(educationId);
    setShowEducationDetail(true);
  };

  // Handle complete profile click
  const handleCompleteProfile = () => {
    setShowProfileIncompleteDialog(false);
    setShowProfilePage(true);
  };

  // ✅ Safe date formatter
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm font-medium flex items-center gap-1">
            <Clock className="w-4 h-4" />
            Pending Review
          </span>
        );
      case 'approved':
        return (
          <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium flex items-center gap-1">
            <CheckCircle className="w-4 h-4" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="px-3 py-1 rounded-full bg-red-100 text-red-800 text-sm font-medium flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            Rejected
          </span>
        );
      default:
        return null;
    }
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

  const handleProfileSubmit = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        displayName: formData.displayName,
        phoneNumber: formData.phoneNumber,
        identityInfo: {
          fullName: formData.fullName,
          idNumber: formData.idNumber,
          birthDate: formData.birthDate,
          address: formData.address
        },
        travelDocuments: {
          passportNumber: formData.passportNumber,
          passportExpiry: formData.passportExpiry
        },
        emergencyContact: {
          name: formData.emergencyName,
          phone: formData.emergencyPhone,
          relationship: formData.emergencyRelationship
        }
      });

      toast.success('Profile updated successfully!');
      setShowProfileDialog(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchTestimonials = async () => {
    try {
      // ✅ FIXED: Fetch all testimonials first, then filter client-side (no index needed!)
      const q = query(
        collection(db, 'testimonials'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);

      // Get all testimonials and filter verified ones client-side
      const allTestimonials = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data
        } as any; // Cast to any or Review to allow property access for debug logging
      });

      // Filter only verified testimonials client-side
      const verifiedTestimonials = allTestimonials.filter((t: any) => t.verified === true);

      console.log('📊 Calon Jamaah - All Testimonials:', allTestimonials.length);
      console.log('✅ Calon Jamaah - Verified Testimonials:', verifiedTestimonials.length);
      console.log('🔍 Calon Jamaah - Sample data:', verifiedTestimonials[0]);
      console.log('📸 Calon Jamaah - Photo field check:', {
        imageUrl: verifiedTestimonials[0]?.imageUrl,
        photo: verifiedTestimonials[0]?.photo,
        allKeys: verifiedTestimonials[0] ? Object.keys(verifiedTestimonials[0]) : []
      });

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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getColorClass = (index: number) => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-purple-500 to-purple-600',
      'from-green-500 to-green-600',
      'from-pink-500 to-pink-600',
      'from-orange-500 to-orange-600',
      'from-teal-500 to-teal-600',
    ];
    return colors[index % colors.length];
  };

  // ✅ Helper function to get comment text (supports multiple field names)
  const getCommentText = (testimonial: any): string => {
    const possibleFields = [
      testimonial.content,
      testimonial.comment,
      testimonial.description,
      testimonial.review,
      testimonial.text,
      testimonial.testimonial,
      testimonial.message,
      testimonial.feedback
    ];

    const commentText = possibleFields.find(field => field && typeof field === 'string' && field.trim() !== '' && field !== '..');

    return commentText || 'Testimoni jamaah yang sangat puas dengan pelayanan kami';
  };

  // If showing upgrade status page
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
                  <h1 className="font-bold text-gray-900 text-sm md:text-base">Calon Jamaah Sultanah</h1>
                  <p className="text-xs text-gray-600 hidden sm:block">Welcome, {userProfile?.displayName || 'Guest'}</p>
                </div>
              </div>
              <Button
                onClick={() => setShowUpgradeStatus(false)}
                variant="ghost"
                className="bg-white/50 hover:bg-white/80 text-gray-700 border border-gray-300"
              >
                <Home className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </div>
        </nav>

        {/* Upgrade Status Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h2 className="text-3xl font-bold mb-2">Upgrade Status Tracker</h2>
            <p className="text-gray-600">Track your upgrade request to become Jamaah Umroh</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#D4AF37]" />
                Your Upgrade Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upgradeRequest ? (
                <div className="space-y-6">
                  {/* Status Timeline */}
                  <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-[#FFF9F0] to-white border-2 border-[#D4AF37]/20">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${upgradeRequest.status === 'pending' ? 'bg-yellow-100' :
                        upgradeRequest.status === 'approved' ? 'bg-green-100' :
                          'bg-red-100'
                        }`}>
                        {upgradeRequest.status === 'pending' && <Clock className="w-6 h-6 text-yellow-600" />}
                        {upgradeRequest.status === 'approved' && <CheckCircle className="w-6 h-6 text-green-600" />}
                        {upgradeRequest.status === 'rejected' && <AlertCircle className="w-6 h-6 text-red-600" />}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">
                          {upgradeRequest.status === 'pending' && 'Pengajuan Sedang Diproses'}
                          {upgradeRequest.status === 'approved' && 'Pengajuan Diterima'}
                          {upgradeRequest.status === 'rejected' && 'Pengajuan Ditolak'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Submitted on {formatDate(upgradeRequest.requestDate)}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(upgradeRequest.status)}
                  </div>

                  {/* Request Details */}
                  <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                    <h4 className="font-semibold mb-3">Request Details</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Request ID:</span>
                        <p className="font-medium">{upgradeRequest.id.slice(0, 8)}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Target Role:</span>
                        <p className="font-medium">Jamaah Umroh</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Nama:</span>
                        <p className="font-medium">{upgradeRequest.userName}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Email:</span>
                        <p className="font-medium">{upgradeRequest.userEmail}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">No WhatsApp:</span>
                        <p className="font-medium">{upgradeRequest.userPhone}</p>
                      </div>
                      {upgradeRequest.reviewDate && (
                        <div>
                          <span className="text-gray-600">Reviewed on:</span>
                          <p className="font-medium">
                            {formatDate(upgradeRequest.reviewDate)}
                          </p>
                        </div>
                      )}
                    </div>

                    {upgradeRequest.status === 'rejected' && upgradeRequest.rejectionReason && (
                      <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-red-900 text-sm">Rejection Reason:</p>
                            <p className="text-sm text-red-800 mt-1">{upgradeRequest.rejectionReason}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Resubmit if rejected */}
                  {upgradeRequest.status === 'rejected' && (
                    <Button
                      onClick={() => setShowUpgradeDialog(true)}
                      className="w-full bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] hover:opacity-90 text-white"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Submit New Request
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#D4AF37]/20 to-[#FFD700]/20 flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-10 h-10 text-[#D4AF37]" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No Upgrade Request Yet</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Ingin upgrade status menjadi Jamaah Umroh? Isi form untuk submit request upgrade ke admin.
                  </p>

                  {/* Profile Completion Progress */}
                  {(() => {
                    const { completion, filled, total } = calculateProfileCompletion();
                    return (
                      <div className="mb-6 max-w-md mx-auto">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Kelengkapan Profil</span>
                          <span className={`text-sm font-bold ${completion === 100 ? 'text-green-600' : 'text-amber-600'}`}>
                            {completion}%
                          </span>
                        </div>
                        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${completion === 100
                              ? 'bg-gradient-to-r from-green-500 to-green-600'
                              : 'bg-gradient-to-r from-amber-500 to-amber-600'
                              }`}
                            style={{ width: `${completion}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{filled} dari {total} field telah diisi</p>

                        {completion < 100 && (
                          <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                              <p className="text-xs text-amber-800">
                                Profil harus lengkap 100% sebelum bisa submit upgrade request
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  <Button
                    onClick={() => {
                      const { completion } = calculateProfileCompletion();
                      if (completion < 100) {
                        setShowProfileIncompleteDialog(true);
                      } else {
                        setShowUpgradeDialog(true);
                      }
                    }}
                    className="bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] hover:opacity-90 text-white"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Submit Upgrade Request
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Upgrade Request Dialog */}
        <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
          <DialogContent className="sm:max-w-lg bg-gradient-to-br from-white to-[#FFF9F0]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-2xl">
                <TrendingUp className="w-6 h-6 text-[#D4AF37]" />
                Upgrade to Jamaah Umroh
              </DialogTitle>
              <DialogDescription>
                Isi form berikut untuk submit request upgrade ke admin
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-4">
              {/* Nama */}
              <div className="space-y-2">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <User className="w-4 h-4 text-[#D4AF37]" />
                  Nama Lengkap <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={upgradeName}
                  onChange={(e) => setUpgradeName(e.target.value)}
                  placeholder="John Doe"
                  className="border-[#D4AF37]/30 focus:border-[#D4AF37]"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#D4AF37]" />
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="email"
                  value={upgradeEmail}
                  onChange={(e) => setUpgradeEmail(e.target.value)}
                  placeholder="johndoe@example.com"
                  className="border-[#D4AF37]/30 focus:border-[#D4AF37]"
                />
              </div>

              {/* No WhatsApp */}
              <div className="space-y-2">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#D4AF37]" />
                  No WhatsApp <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={upgradePhone}
                  onChange={(e) => setUpgradePhone(e.target.value)}
                  placeholder="08123456789"
                  className="border-[#D4AF37]/30 focus:border-[#D4AF37]"
                />
              </div>

              {/* Info Box */}
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Informasi</p>
                    <p className="text-sm text-blue-800 mt-1">
                      Admin akan menghubungi Anda melalui WhatsApp untuk proses verifikasi upgrade status.
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 justify-end pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowUpgradeDialog(false);
                    setUpgradeName('');
                    setUpgradeEmail('');
                    setUpgradePhone('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitUpgrade}
                  disabled={loading || !upgradeName || !upgradeEmail || !upgradePhone}
                  className="bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] hover:opacity-90 text-white"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Request
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Profile Incomplete Warning Dialog */}
        <Dialog open={showProfileIncompleteDialog} onOpenChange={setShowProfileIncompleteDialog}>
          <DialogContent className="sm:max-w-2xl bg-gradient-to-br from-white to-[#FFF9F0] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-2xl">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-white" />
                </div>
                <span>Profil Belum Lengkap</span>
              </DialogTitle>
              <DialogDescription>
                Untuk submit upgrade request ke Jamaah Umroh, profil Anda harus lengkap 100%
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-4">
              {/* Progress Bar */}
              {(() => {
                const { completion, filled, total } = calculateProfileCompletion();
                return (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700">Kelengkapan Profil Anda</span>
                      <span className="text-lg font-bold text-red-600">{completion}%</span>
                    </div>
                    <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-500"
                        style={{ width: `${completion}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500">{filled} dari {total} field telah diisi ({total - filled} field masih kosong)</p>
                  </div>
                );
              })()}

              {/* Warning Box */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-red-50 to-red-100/50 border-2 border-red-200">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900 mb-1">Perhatian!</p>
                  <p className="text-sm text-red-800">
                    Anda harus melengkapi semua field di bawah ini sebelum bisa submit request upgrade ke Jamaah Umroh
                  </p>
                </div>
              </div>

              {/* Missing Fields List */}
              {(() => {
                const missingFields = getMissingFields();
                if (missingFields.length === 0) return null;

                return (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-[#D4AF37]" />
                      Field yang Belum Diisi ({missingFields.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-3 rounded-lg bg-gray-50 border border-gray-200">
                      {missingFields.map((field, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2 rounded-lg bg-white border border-red-200 text-sm"
                        >
                          <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                          <span className="text-gray-700">{field}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Instructions */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-blue-900 mb-2">Langkah Selanjutnya:</p>
                    <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                      <li>Klik tombol "Lengkapi Profil" di bawah</li>
                      <li>Isi semua field yang masih kosong</li>
                      <li>Upload semua dokumen yang diperlukan</li>
                      <li>Simpan perubahan profil Anda</li>
                      <li>Kembali ke halaman ini dan submit upgrade request</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowProfileIncompleteDialog(false)}
                  className="flex-1 border-2 border-gray-300 hover:bg-gray-50"
                >
                  Nanti Saja
                </Button>
                <Button
                  onClick={handleCompleteProfile}
                  className="flex-1 bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] hover:opacity-90 text-white shadow-lg"
                >
                  <User className="w-4 h-4 mr-2" />
                  Lengkapi Profil Sekarang
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

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
      // Calon Jamaah cannot create articles - read only
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
          setSelectedPackage(pkg);
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
        testimonials={testimonials}
        onBack={() => setShowAllTestimonialsPage(false)}
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

  // If showing package detail page
  if (showPackageDetail && selectedPackage) {
    return (
      <PackageDetail
        packageData={selectedPackage}
        onBack={() => {
          setShowPackageDetail(false);
          setSelectedPackage(null);
        }}
      />
    );
  }

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

  // Main Dashboard with Scroll Sections
  return (
    <div className="min-h-screen bg-white">
      {/* Professional Navbar - Sticky */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16 gap-8">
            {/* Logo/Title */}
            <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
                <img src={sultanahLogo} alt="Sultanah Travel" className="w-full h-full object-contain" />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-bold text-gray-900 text-sm">Calon Jamaah Sultanah</h1>
                <p className="text-xs text-gray-500">Welcome, {userProfile?.displayName || 'Guest'}</p>
              </div>
            </div>

            {/* Center Navigation Links */}
            <div className="hidden lg:flex items-center gap-5">
              <button
                onClick={() => scrollToSection(dashboardRef)}
                className="text-gray-700 hover:text-[#D4AF37] transition-all text-sm font-medium relative group whitespace-nowrap px-2.5"
              >
                <span className="relative z-10">Dashboard</span>
                <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-[#D4AF37] to-[#C5A572] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
              </button>
              <button
                onClick={() => scrollToSection(packagesRef)}
                className="text-gray-700 hover:text-[#D4AF37] transition-all text-sm font-medium relative group whitespace-nowrap px-2.5"
              >
                <span className="relative z-10">Packages</span>
                <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-[#D4AF37] to-[#C5A572] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
              </button>
              <button
                onClick={() => scrollToSection(promosRef)}
                className="text-gray-700 hover:text-[#D4AF37] transition-all text-sm font-medium relative group whitespace-nowrap px-2.5"
              >
                <span className="relative z-10">Promos</span>
                <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-[#D4AF37] to-[#C5A572] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
              </button>
              <button
                onClick={() => scrollToSection(educationRef)}
                className="text-gray-700 hover:text-[#D4AF37] transition-all text-sm font-medium relative group whitespace-nowrap px-2.5"
              >
                <span className="relative z-10">Education</span>
                <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-[#D4AF37] to-[#C5A572] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
              </button>
              <button
                onClick={() => scrollToSection(newsRef)}
                className="text-gray-700 hover:text-[#D4AF37] transition-all text-sm font-medium relative group whitespace-nowrap px-2.5"
              >
                <span className="relative z-10">News & Articles</span>
                <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-[#D4AF37] to-[#C5A572] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
              </button>
              <button
                onClick={() => scrollToSection(testimonialsRef)}
                className="text-gray-700 hover:text-[#D4AF37] transition-all text-sm font-medium relative group whitespace-nowrap px-2.5"
              >
                <span className="relative z-10">Testimonials</span>
                <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-[#D4AF37] to-[#C5A572] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
              </button>
              <button
                onClick={() => scrollToSection(contactRef)}
                className="text-gray-700 hover:text-[#D4AF37] transition-all text-sm font-medium relative group whitespace-nowrap px-2.5"
              >
                <span className="relative z-10">Contact Us</span>
                <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-[#D4AF37] to-[#C5A572] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
              </button>
            </div>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-2 md:gap-3 flex-shrink-0 min-w-fit">
              {/* Action Buttons Group */}
              <div className="flex items-center gap-1.5 md:gap-2">
                {/* Upgrade Status Button */}
                <Button
                  onClick={() => setShowUpgradeStatus(true)}
                  size="sm"
                  className="bg-gradient-to-r from-[#D4AF37] to-[#C5A572] hover:opacity-90 text-white border-0 shadow-md px-2 md:px-3 py-1.5 h-8 text-xs"
                >
                  <TrendingUp className="w-4 h-4 md:mr-1.5" />
                  <span className="hidden md:inline">Upgrade</span>
                </Button>
              </div>

              {/* Separator */}
              <div className="h-6 w-px bg-gray-300 hidden md:block"></div>

              {/* Profile Button - Separated */}
              <Button
                onClick={() => setShowProfilePage(true)}
                size="sm"
                className="bg-white/50 hover:bg-white/80 text-gray-700 border border-gray-300 shadow-sm px-2 md:px-3 py-1.5 h-8 text-xs"
              >
                <User className="w-4 h-4 md:mr-1.5" />
                <span className="hidden md:inline">Profile</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero/Dashboard Section with Kaaba Background */}
      <section
        ref={dashboardRef}
        className="relative min-h-[60vh] md:min-h-screen bg-cover bg-center bg-no-repeat flex items-start"
        style={{ backgroundImage: `url(${kaabaImage})` }}
      >
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/50"></div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 md:pt-40 pb-12 md:pb-0 text-white w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-3xl md:text-6xl font-bold mb-3 md:mb-6 drop-shadow-lg">
              Assalamu'alaikum, {userProfile?.displayName || 'Guest'}!
            </h1>
            <p className="text-base md:text-2xl mb-4 md:mb-8 max-w-3xl mx-auto drop-shadow-md">
              Selamat datang di Portal Calon Jamaah! Wujudkan impian umroh Anda dengan mudah.
              Jelajahi paket terbaik, pelajari panduan lengkap, dan persiapkan perjalanan spiritual Anda bersama kami.
            </p>
            <div className="flex items-center justify-center gap-2 text-xs md:text-sm mb-4 md:mb-8">
              <Calendar className="w-3 h-3 md:w-4 md:h-4" />
              <span>Member since {formatDate(userProfile?.createdAt)}</span>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 mt-4 md:mt-8">
              {/* Konsultasi Gratis Button */}
              <Button
                onClick={() => window.open('https://api.whatsapp.com/send/?phone=6281234700116&text=Halo%20Sultanah%20Travel%2C%20saya%20ingin%20konsultasi%20gratis%20tentang%20paket%20umrah&type=phone_number&app_absent=0', '_blank')}
                className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 hover:from-yellow-500 hover:via-yellow-600 hover:to-yellow-700 text-gray-900 font-semibold px-4 md:px-8 py-3 md:py-6 rounded-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 text-sm md:text-base"
              >
                💬 Konsultasi Gratis Sekarang
              </Button>

              {/* Lihat Paket Button */}
              <Button
                onClick={() => packagesRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:from-blue-600 hover:via-blue-700 hover:to-blue-800 text-white font-semibold px-4 md:px-8 py-3 md:py-6 rounded-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2 text-sm md:text-base"
              >
                ✈️ Jelajahi Paket Umroh
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ads Banner Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 md:-mt-16 mb-12 relative z-30">
        <AdsBanner role="prospective-jamaah" />
      </div>

      {/* Packages Section with Umrah Background */}
      <section
        ref={packagesRef}
        className="relative min-h-screen bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(https://images.unsplash.com/photo-1676200928665-8b97df7ab979?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bXJhaCUyMHBpbGdyaW1hZ2UlMjBtb3NxdWV8ZW58MXx8fHwxNzY3MTE2MzU0fDA&ixlib=rb-4.1.0&q=80&w=1080)` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Paket Umroh Terbaik untuk Anda
            </h2>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Wujudkan impian ibadah umroh Anda bersama kami. Nikmati pelayanan terbaik,
              akomodasi nyaman, dan bimbingan spiritual yang mendalam.
            </p>
          </div>

          {packages.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* ✅ UPDATED: Show only first 3 packages */}
                {packages.slice(0, 3).map((pkg, index) => (
                  <motion.div
                    key={pkg.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    whileHover={{ y: -10 }}
                    className="group h-full"
                  >
                    <div className="relative h-full flex flex-col rounded-3xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_20px_60px_rgba(212,175,55,0.25)] transition-all duration-500 overflow-hidden group-hover:scale-[1.02]">
                      {/* Subtle top gradient accent */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                      {/* Package Image */}
                      {(pkg.image || pkg.photo) && (
                        <div className="relative h-56 overflow-hidden">
                          <motion.img
                            whileHover={{ scale: 1.1 }}
                            transition={{ duration: 0.6 }}
                            src={pkg.image || pkg.photo}
                            alt={pkg.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                          {/* Badge */}
                          {pkg.type && (
                            <div className="absolute top-4 right-4">
                              <span className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] text-white text-sm font-semibold shadow-2xl backdrop-blur-sm border border-white/20">
                                {pkg.type.toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Content */}
                      <div className="relative flex-grow flex flex-col p-6 bg-gradient-to-b from-white to-gray-50/30">
                        <div className="flex-grow">
                          <h3 className="text-2xl font-semibold mb-2 text-gray-900 group-hover:text-[#D4AF37] transition-colors">
                            {pkg.name}
                          </h3>

                          {/* Price */}
                          <div className="mb-6">
                            <div className="text-sm text-gray-500 mb-1">Starting from</div>
                            <div className="text-3xl font-bold bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] bg-clip-text text-transparent">
                              {formatCurrency(pkg.price)}
                            </div>
                            <div className="text-sm text-gray-500">per person</div>
                          </div>

                          {/* Info Cards */}
                          <div className="grid grid-cols-3 gap-3 mb-6">
                            <div className="flex flex-col items-center p-3 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                              <Clock className="w-5 h-5 text-blue-600 mb-1" />
                              <span className="text-xs font-semibold text-blue-900">{pkg.duration}D</span>
                            </div>
                            <div className="flex flex-col items-center p-3 rounded-xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
                              <Calendar className="w-5 h-5 text-green-600 mb-1" />
                              <span className="text-xs font-semibold text-green-900">{pkg.departureDate ? new Date(pkg.departureDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD'}</span>
                            </div>
                            <div className="flex flex-col items-center p-3 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
                              <Users className="w-5 h-5 text-purple-600 mb-1" />
                              <span className="text-xs font-semibold text-purple-900">{pkg.availableSlots || 0}</span>
                            </div>
                          </div>

                          {/* Features */}
                          {pkg.features && pkg.features.length > 0 && (
                            <div className="border-t border-gray-200 pt-4 mt-4">
                              <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                                <Check className="w-4 h-4 mr-1 text-[#D4AF37]" />
                                Fasilitas Paket:
                              </p>
                              <ul className="space-y-2">
                                {pkg.features.slice(0, 3).map((feature: string, i: number) => (
                                  <li key={i} className="flex items-start text-sm text-gray-600">
                                    <Check className="w-4 h-4 mr-2 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                                    <span className="line-clamp-1">{feature}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {/* Book Button */}
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="mt-6">
                          <Button
                            onClick={() => handleBookNow(pkg)}
                            disabled={pkg.availableSlots === 0}
                            className="w-full h-12 bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] hover:from-[#B89560] hover:via-[#C5A045] hover:to-[#E3C034] text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {pkg.availableSlots === 0 ? '✕ Kuota Penuh' : '🕌 Pesan Sekarang'}
                          </Button>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* ✅ NEW: "Lihat Semua Paket" Button - Only show if more than 3 packages */}
              {packages.length > 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center mt-12"
                >
                  <button
                    onClick={() => setShowAllPackagesPage(true)}
                    className="group inline-flex items-center gap-3 px-8 py-4 bg-white hover:bg-emerald-50 border-2 border-emerald-600 rounded-xl text-emerald-700 font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <span>Lihat Semua Paket</span>
                    <span className="text-2xl group-hover:translate-x-2 transition-transform duration-300">→</span>
                  </button>
                  <p className="text-sm text-white/80 mt-3">
                    Menampilkan 3 dari {packages.length} paket tersedia
                  </p>
                </motion.div>
              )}
            </>
          ) : (
            <Card className="bg-white/95 backdrop-blur-sm">
              <CardContent className="text-center py-12">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#D4AF37]/20 to-[#FFD700]/20 flex items-center justify-center mx-auto mb-4">
                  <Package className="w-10 h-10 text-[#D4AF37]" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Paket Sedang Disiapkan</h3>
                <p className="text-gray-600">Kami sedang menyiapkan paket umroh terbaik untuk Anda. Nantikan segera!</p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Promo Section */}
      <section
        ref={promosRef}
        className="relative min-h-screen bg-cover bg-center bg-no-repeat py-20"
        style={{ backgroundImage: `url(https://images.unsplash.com/photo-1720482229376-d5574ffeb0c8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWNjYSUyMGthYWJhJTIwYWVyaWFsJTIwdmlld3xlbnwxfHx8fDE3NjcxMjY1MjJ8MA&ixlib=rb-4.1.0&q=80&w=1080)` }}
      >
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/65 to-black/75"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#C5A572] mb-6 shadow-lg">
              <Gift className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
              Penawaran Terbaik Untuk Anda
            </h2>
            <p className="text-xl text-white/90 max-w-3xl mx-auto drop-shadow-md">
              Dapatkan harga spesial dengan berbagai promo menarik kami
            </p>
          </div>

          {promos.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* ✅ UPDATED: Show only first 3 promos */}
                {promos.slice(0, 3).map((promo, index) => {
                  // Dynamic color mapping
                  const colorMap: Record<string, { bg: string; border: string; text: string; badge: string }> = {
                    blue: {
                      bg: 'from-blue-500 to-blue-600',
                      border: 'border-blue-300',
                      text: 'text-blue-800',
                      badge: 'bg-blue-600'
                    },
                    gold: {
                      bg: 'from-[#D4AF37] to-[#C5A572]',
                      border: 'border-[#D4AF37]/30',
                      text: 'text-[#C5A572]',
                      badge: 'bg-[#D4AF37]'
                    },
                    green: {
                      bg: 'from-green-500 to-green-600',
                      border: 'border-green-300',
                      text: 'text-green-800',
                      badge: 'bg-green-600'
                    }
                  };

                  const colors = colorMap[promo.color || 'gold'];

                  return (
                    <motion.div
                      key={promo.id}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1, duration: 0.5 }}
                      whileHover={{ y: -10 }}
                      className="group"
                    >
                      <div className="relative h-full flex flex-col rounded-3xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_20px_60px_rgba(212,175,55,0.25)] transition-all duration-500 overflow-hidden group-hover:scale-[1.02]">
                        {/* Top accent bar */}
                        <div className={`h-2 bg-gradient-to-r ${colors.bg}`} />

                        {/* Badge */}
                        {promo.badge && (
                          <div className="absolute top-6 right-6 z-10">
                            <span className={`px-4 py-1.5 rounded-full ${colors.badge} text-white text-xs font-bold shadow-lg uppercase tracking-wide`}>
                              {promo.badge}
                            </span>
                          </div>
                        )}

                        {/* Promo Image */}
                        {promo.image && (
                          <div className="relative h-48 overflow-hidden">
                            <motion.img
                              whileHover={{ scale: 1.1 }}
                              transition={{ duration: 0.6 }}
                              src={promo.image}
                              alt={promo.title}
                              className="w-full h-full object-cover"
                            />
                            <div className={`absolute inset-0 bg-gradient-to-t ${colors.bg} opacity-10`} />
                          </div>
                        )}

                        {/* Content */}
                        <div className="relative flex-grow flex flex-col p-6">
                          <div className="flex-grow">
                            <h3 className="text-2xl font-bold mb-3 text-gray-900 group-hover:text-[#D4AF37] transition-colors">
                              {promo.title}
                            </h3>

                            {/* Discount Badge */}
                            <div className="mb-4">
                              <div className={`inline-flex items-center px-4 py-2 rounded-xl bg-gradient-to-r ${colors.bg} text-white font-bold text-3xl shadow-lg`}>
                                <Tag className="w-6 h-6 mr-2" />
                                {promo.discount}
                              </div>
                            </div>

                            {/* Description */}
                            <p className="text-gray-600 mb-4 line-clamp-2">
                              {promo.description}
                            </p>

                            {/* Valid Until */}
                            <div className="flex items-center text-sm text-gray-500 mb-4">
                              <Clock className="w-4 h-4 mr-2" />
                              <span>Berlaku hingga {promo.validUntil}</span>
                            </div>
                          </div>

                          {/* View Promo Button */}
                          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="mt-4">
                            <Button
                              onClick={() => handleViewPromo(promo)}
                              className={`w-full h-12 bg-gradient-to-r ${colors.bg} hover:opacity-90 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl font-semibold`}
                            >
                              <Sparkles className="w-4 h-4 mr-2" />
                              Lihat Promo
                            </Button>
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* ✅ NEW: "Lihat Semua Promo" Button - Only show if more than 3 promos */}
              {promos.length > 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center mt-12"
                >
                  <button
                    onClick={() => setShowAllPromosPage(true)}
                    className="group inline-flex items-center gap-3 px-8 py-4 bg-white hover:bg-emerald-50 border-2 border-emerald-600 rounded-xl text-emerald-700 font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <span>Lihat Semua Promo</span>
                    <span className="text-2xl group-hover:translate-x-2 transition-transform duration-300">→</span>
                  </button>
                  <p className="text-sm text-white/80 mt-3">
                    Menampilkan 3 dari {promos.length} promo tersedia
                  </p>
                </motion.div>
              )}
            </>
          ) : (
            <Card className="bg-white/95 backdrop-blur-sm">
              <CardContent className="text-center py-12">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#D4AF37]/20 to-[#FFD700]/20 flex items-center justify-center mx-auto mb-4">
                  <Gift className="w-10 h-10 text-[#D4AF37]" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Belum Ada Promo</h3>
                <p className="text-gray-600">Promo menarik akan segera hadir untuk Anda. Nantikan!</p>
              </CardContent>
            </Card>
          )}
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
        style={{ backgroundImage: `url(https://images.unsplash.com/photo-1707386928396-512474ae6d30?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYWRpbmFoJTIwbmFiYXdpJTIwbW9zcXVlJTIwbmlnaHR8ZW58MXx8fHwxNzY3MTI2NTIyfDA&ixlib=rb-4.1.0&q=80&w=1080)` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/65 to-black/75"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Berita & Artikel</h2>
            <p className="text-xl text-white/90">Dapatkan informasi terbaru seputar dunia umroh dan perjalanan spiritual</p>
          </div>

          {articles.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* ✅ Show only first 3 articles */}
                {articles.slice(0, 3).map((article, index) => (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.6 }}
                    viewport={{ once: true }}
                  >
                    <Card
                      onClick={() => {
                        setSelectedArticleId(article.id);
                        setShowArticleDetail(true);
                      }}
                      className="bg-white/95 backdrop-blur-sm hover:shadow-2xl transition-all h-full overflow-hidden group cursor-pointer"
                    >
                      {/* Article Image */}
                      {article.image && (
                        <div className="relative h-48 overflow-hidden">
                          <img
                            src={article.image}
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="18" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';
                            }}
                          />
                          <div className="absolute top-3 left-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${article.category === 'news' ? 'bg-green-500' : 'bg-blue-500'
                              }`}>
                              {article.category === 'news' ? '📰 Berita' : '📝 Artikel'}
                            </span>
                          </div>
                        </div>
                      )}

                      <CardContent className="p-6">
                        {/* Title */}
                        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-[#D4AF37] transition-colors">
                          {article.title}
                        </h3>

                        {/* Content Preview */}
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                          {article.content?.substring(0, 150)}...
                        </p>

                        {/* Author & Date */}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-2">
                            <User className="w-3 h-3" />
                            <span className="font-medium text-[#D4AF37]">
                              {article.author?.name || 'Anonymous'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(article.createdAt)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* ✅ "Lihat Semua Artikel" Button - Show if more than 3 articles */}
              {articles.length > 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center mt-12"
                >
                  <button
                    onClick={() => setShowArticlesPage(true)}
                    className="group inline-flex items-center gap-3 px-8 py-4 bg-white hover:bg-[#D4AF37] border-2 border-[#D4AF37] rounded-xl text-[#D4AF37] hover:text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Newspaper className="w-5 h-5" />
                    <span>Lihat Semua Artikel</span>
                    <span className="text-2xl group-hover:translate-x-2 transition-transform duration-300">→</span>
                  </button>
                  <p className="text-sm text-white/80 mt-3">
                    Menampilkan 3 dari {articles.length} artikel tersedia
                  </p>
                </motion.div>
              )}
            </>
          ) : (
            <Card className="bg-white/95 backdrop-blur-sm max-w-3xl mx-auto">
              <CardContent className="text-center py-16">
                <Newspaper className="w-20 h-20 mx-auto mb-6 text-[#D4AF37]" />
                <h3 className="text-2xl font-semibold mb-3">Segera Hadir</h3>
                <p className="text-gray-600 text-lg">Berita dan artikel terbaru seputar dunia umroh akan segera tersedia untuk Anda.</p>
              </CardContent>
            </Card>
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

          {testimonials.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* ✅ UPDATED: Show only first 3 testimonials */}
                {testimonials.slice(0, 3).map((testimonial, index) => (
                  <motion.div
                    key={testimonial.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.6 }}
                    viewport={{ once: true }}
                  >
                    <Card
                      onClick={() => {
                        setSelectedTestimonial(testimonial);
                        setShowTestimonialDetail(true);
                      }}
                      className="bg-white/95 backdrop-blur-sm hover:shadow-2xl transition-all h-full cursor-pointer group"
                    >
                      <CardContent className="p-6">
                        {/* Quote Icon */}
                        <Quote className="w-10 h-10 text-[#D4AF37] mb-4 opacity-30" />

                        {/* Rating Stars */}
                        <div className="flex mb-4">
                          {[...Array(testimonial.rating || 5)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-[#FFD700] text-[#FFD700]" />
                          ))}
                        </div>

                        {/* Comment */}
                        <p className="text-gray-700 mb-4 italic leading-relaxed line-clamp-3">
                          "{getCommentText(testimonial)}"
                        </p>

                        {/* Photo if available */}
                        {(testimonial.imageUrl || testimonial.photo) && (
                          <div className="mb-4">
                            <img
                              src={testimonial.imageUrl || testimonial.photo}
                              alt="Testimonial"
                              className="w-full h-32 object-cover rounded-lg"
                            />
                          </div>
                        )}

                        {/* Package badge */}
                        {testimonial.packageName && (
                          <div className="mb-4">
                            <span className="text-xs px-3 py-1 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] font-medium border border-[#D4AF37]/20">
                              📦 {testimonial.packageName}
                            </span>
                          </div>
                        )}

                        {/* Divider */}
                        <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mb-4" />

                        {/* Author Info */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {/* Avatar */}
                            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getColorClass(index)} flex items-center justify-center text-white font-semibold text-sm shadow-md`}>
                              {getInitials(testimonial.userName || testimonial.name || 'U')}
                            </div>

                            {/* Name & City */}
                            <div>
                              <div className="font-semibold text-gray-900 text-sm">{testimonial.userName || testimonial.name}</div>
                              <div className="text-xs text-gray-500">{testimonial.userCity || testimonial.city || 'Indonesia'}</div>
                            </div>
                          </div>

                          {/* Verified Badge */}
                          {testimonial.verified && (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 border border-green-200">
                              <ThumbsUp className="w-3 h-3 text-green-600" />
                              <span className="text-xs text-green-700 font-medium">Verified</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* ✅ NEW: "Lihat Semua Testimoni" Button - Only show if more than 3 testimonials */}
              {testimonials.length > 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center mt-12"
                >
                  <button
                    onClick={() => setShowAllTestimonialsPage(true)}
                    className="group inline-flex items-center gap-3 px-8 py-4 bg-white hover:bg-emerald-50 border-2 border-emerald-600 rounded-xl text-emerald-700 font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <span>Lihat Semua Testimoni</span>
                    <span className="text-2xl group-hover:translate-x-2 transition-transform duration-300">→</span>
                  </button>
                  <p className="text-sm text-white/80 mt-3">
                    Menampilkan 3 dari {testimonials.length} testimoni tersedia
                  </p>
                </motion.div>
              )}
            </>
          ) : (
            <Card className="bg-white/95 backdrop-blur-sm">
              <CardContent className="text-center py-12">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#D4AF37]/20 to-[#FFD700]/20 flex items-center justify-center mx-auto mb-4">
                  <Star className="w-10 h-10 text-[#D4AF37]" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Testimoni Segera Hadir</h3>
                <p className="text-gray-600">Kisah inspiratif dari jamaah kami akan segera tersedia untuk Anda.</p>
              </CardContent>
            </Card>
          )}
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
              <span className="text-sm font-medium text-[#D4AF37]">Hubungi Kami</span>
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
              <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-2 border-green-200 hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center flex-shrink-0 shadow-md">
                      <MessageCircle className="w-7 h-7 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-1">WhatsApp</h3>
                      <p className="text-lg font-semibold text-green-700 mb-0.5">+62 857-2337-5324</p>
                      <p className="text-sm text-green-600">Respon cepat 24/7</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Telepon */}
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-2 border-blue-200 hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center flex-shrink-0 shadow-md">
                      <Phone className="w-7 h-7 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-1">Telepon</h3>
                      <p className="text-lg font-semibold text-blue-700 mb-0.5">+62 21 1234 5678</p>
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
                    Dashboard
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection(packagesRef)} className="text-gray-400 hover:text-[#D4AF37] transition-colors">
                    Paket
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection(promosRef)} className="text-gray-400 hover:text-[#D4AF37] transition-colors">
                    Promo
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
                <li className="flex items-center gap-3 text-gray-400">
                  <Phone className="w-5 h-5 text-[#D4AF37]" />
                  <span>+62 21 1234 5678</span>
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

      {/* Profile Edit Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="sm:max-w-2xl bg-gradient-to-br from-white to-[#FFF9F0] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <User className="w-6 h-6 text-[#D4AF37]" />
              Edit Profile
            </DialogTitle>
            <DialogDescription>
              Update your personal information
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Display Name *</Label>
                <Input
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="Enter your display name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Phone Number *</Label>
                <Input
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="Enter your phone number"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Full Name *</Label>
                <Input
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Enter your full name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>ID Number *</Label>
                <Input
                  value={formData.idNumber}
                  onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                  placeholder="Enter your ID number"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Birth Date *</Label>
                <Input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Passport Number *</Label>
                <Input
                  value={formData.passportNumber}
                  onChange={(e) => setFormData({ ...formData, passportNumber: e.target.value })}
                  placeholder="Enter passport number"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Passport Expiry *</Label>
                <Input
                  type="date"
                  value={formData.passportExpiry}
                  onChange={(e) => setFormData({ ...formData, passportExpiry: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Emergency Contact Name *</Label>
                <Input
                  value={formData.emergencyName}
                  onChange={(e) => setFormData({ ...formData, emergencyName: e.target.value })}
                  placeholder="Enter emergency contact name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Emergency Contact Phone *</Label>
                <Input
                  value={formData.emergencyPhone}
                  onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                  placeholder="Enter emergency contact phone"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Emergency Relationship *</Label>
                <Input
                  value={formData.emergencyRelationship}
                  onChange={(e) => setFormData({ ...formData, emergencyRelationship: e.target.value })}
                  placeholder="E.g., Spouse, Parent"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label>Address *</Label>
              <Textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter your complete address"
                rows={3}
                className="mt-1"
              />
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setShowProfileDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleProfileSubmit}
                disabled={loading}
                className="bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] hover:opacity-90 text-white"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile Incomplete Warning Dialog */}
      <Dialog open={showProfileIncompleteDialog} onOpenChange={setShowProfileIncompleteDialog}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-white to-[#FFF9F0]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <AlertCircle className="w-6 h-6 text-orange-500" />
              Profile Incomplete
            </DialogTitle>
            <DialogDescription>
              Please complete your profile to {selectedPromo ? 'view promo details' : 'book a package'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-orange-50 border border-orange-200">
              <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-gray-700 mb-2">
                  To {selectedPromo ? 'access' : 'book'} the <span className="font-semibold text-[#D4AF37]">{selectedPromo?.title || selectedPackage?.name}</span> {selectedPromo ? 'promo' : 'package'}, you need to complete:
                </p>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>Personal Information (Name, Phone, Address, etc.)</li>
                  <li>Required Documents (Passport, KTP, KK, etc.)</li>
                  <li>Emergency Contact Details</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowProfileIncompleteDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCompleteProfile}
                className="flex-1 bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] hover:opacity-90 text-white"
              >
                <User className="w-4 h-4 mr-2" />
                Complete Profile
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ✅ Testimonial Detail Dialog */}
      <TestimonialDetailDialog
        open={showTestimonialDetail}
        onClose={() => {
          setShowTestimonialDetail(false);
          setSelectedTestimonial(null);
        }}
        testimonial={selectedTestimonial}
      />

      {/* Floating Announcement Widget */}
      <FloatingAnnouncementWidget userRole="prospective-jamaah" />
    </div>
  );
};

export default ProspectiveJamaahDashboard;