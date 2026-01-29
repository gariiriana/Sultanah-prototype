import React, { useState, useEffect } from 'react';
import { 
  X, User, Mail, Shield, Calendar, Hash, Award, Users, 
  CheckCircle, XCircle, AlertCircle, Phone, MapPin, 
  FileText, CreditCard, Image as ImageIcon, Heart, Download
} from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../config/firebase';
import { UserRole } from '../../../../types';

interface UserProfileDetailModalProps {
  userId: string;
  userEmail: string;
  userRole: UserRole;
  userName: string;
  isOpen: boolean;
  onClose: () => void;
}

interface UserStats {
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  totalSpent: number;
  referralCode: string;
  totalReferrals: number;
  pendingCommission: number;
  totalCommissionEarned: number;
  joinedDate: string;
  lastLogin: string;
  verificationStatus: 'verified' | 'unverified' | 'pending';
}

interface UserProfileData {
  displayName: string;
  email: string;
  phoneNumber?: string;
  identityInfo?: {
    fullName?: string;
    idNumber?: string;
    birthDate?: string;
    address?: {
      street?: string;
      city?: string;
      province?: string;
      country?: string;
      postalCode?: string;
    };
  };
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
  travelDocuments?: {
    ktpPhoto?: string | { base64: string };
    kkPhoto?: string | { base64: string };
    passportPhoto?: string | { base64: string };
    passportNumber?: string;
    passportExpiry?: string;
    visaDocument?: string | { base64: string };
    healthCertificate?: string | { base64: string };
  };
}

const UserProfileDetailModal: React.FC<UserProfileDetailModalProps> = ({
  userId,
  userEmail,
  userRole,
  userName,
  isOpen,
  onClose,
}) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && userId) {
      loadUserData();
    }
  }, [isOpen, userId]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user document
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      // ✅ FIX: Check if document exists
      if (!userDoc.exists()) {
        throw new Error('User document not found');
      }
      
      const userData = userDoc.data();

      // ✅ NEW: Fetch documents from userDocuments collection (where actual base64 images are stored)
      let documentsData = null;
      try {
        const userDocumentsRef = doc(db, 'userDocuments', userId);
        const userDocumentsSnap = await getDoc(userDocumentsRef);
        if (userDocumentsSnap.exists()) {
          documentsData = userDocumentsSnap.data();
          console.log('✅ Admin: Loaded documents from userDocuments collection:', {
            userId,
            hasPassportPhoto: !!documentsData.documents?.passportPhoto,
            hasKtpPhoto: !!documentsData.documents?.ktpPhoto,
            hasKkPhoto: !!documentsData.documents?.kkPhoto,
          });
        }
      } catch (docError) {
        console.warn('⚠️ Could not load userDocuments:', docError);
      }

      // Store profile data
      setProfileData({
        displayName: userData?.displayName || userName,
        email: userData?.email || userEmail,
        phoneNumber: userData?.phoneNumber,
        identityInfo: userData?.identityInfo,
        emergencyContact: userData?.emergencyContact,
        // ✅ FIX: Merge travelDocuments from both sources
        travelDocuments: documentsData ? {
          // Passport info from userDocuments
          passportNumber: documentsData.passportNumber,
          passportExpiry: documentsData.passportExpiry,
          // Documents from userDocuments.documents
          passportPhoto: documentsData.documents?.passportPhoto,
          ktpPhoto: documentsData.documents?.ktpPhoto,
          kkPhoto: documentsData.documents?.kkPhoto,
          visaDocument: documentsData.documents?.visaDocument,
          healthCertificate: documentsData.documents?.vaccinationCertificate,
        } : userData?.travelDocuments, // Fallback to legacy format
      });

      // ✅ FIX: Initialize default stats (avoid querying non-existent collections)
      let totalOrders = 0;
      let completedOrders = 0;
      let pendingOrders = 0;
      let cancelledOrders = 0;
      let totalSpent = 0;

      // ✅ FIX: Try to get orders, but handle gracefully if collection doesn't exist
      try {
        // Try bookings first (this collection exists in your system)
        const bookingsQuery = query(
          collection(db, 'bookings'),
          where('userId', '==', userId)
        );
        const bookingsSnapshot = await getDocs(bookingsQuery);
        
        const bookings = bookingsSnapshot.docs.map(doc => doc.data());
        totalOrders = bookings.length;
        completedOrders = bookings.filter(b => b.status === 'approved' || b.status === 'completed').length;
        pendingOrders = bookings.filter(b => b.status === 'pending').length;
        cancelledOrders = bookings.filter(b => b.status === 'rejected' || b.status === 'cancelled').length;
        
        // Calculate from payments instead
        const paymentsQuery = query(
          collection(db, 'payments'),
          where('userId', '==', userId)
        );
        const paymentsSnapshot = await getDocs(paymentsQuery);
        totalSpent = paymentsSnapshot.docs
          .filter(doc => doc.data().status === 'approved')
          .reduce((sum, doc) => sum + (doc.data().amount || 0), 0);
      } catch (ordersError) {
        console.warn('Could not load bookings/payments data:', ordersError);
        // Continue with default values
      }

      // Get referrals if user has referral code
      let totalReferrals = 0;
      let referralCode = '-';
      
      // ✅ FIX: Check referral code from proper collection based on role
      try {
        if (userRole === 'alumni' || userRole === 'agen') {
          const collectionName = userRole === 'alumni' ? 'alumniReferrals' : 'agenReferrals';
          const referralDoc = await getDoc(doc(db, collectionName, userId));
          
          if (referralDoc.exists()) {
            const referralData = referralDoc.data();
            referralCode = referralData?.referralCode || '-';
            totalReferrals = referralData?.totalReferrals || 0;
          }
        } else if (userData?.referralCode) {
          // Fallback to user data
          referralCode = userData.referralCode;
          const referralsQuery = query(
            collection(db, 'referralTracking'),
            where('referrerId', '==', userId)
          );
          const referralsSnapshot = await getDocs(referralsQuery);
          totalReferrals = referralsSnapshot.docs.length;
        }
      } catch (referralError) {
        console.warn('Could not load referral data:', referralError);
        // Continue with default values
      }

      // Get commissions
      let pendingCommission = 0;
      let totalCommissionEarned = 0;
      
      if (userRole === 'alumni' || userRole === 'agen') {
        try {
          // Check referral balance
          const balanceDoc = await getDoc(doc(db, 'referralBalances', userId));
          if (balanceDoc.exists()) {
            const balanceData = balanceDoc.data();
            pendingCommission = balanceData?.balance || 0;
            totalCommissionEarned = balanceData?.totalEarned || 0;
          }
        } catch (commissionError) {
          console.warn('Could not load commission data:', commissionError);
          // Continue with default values
        }
      }

      setStats({
        totalOrders,
        completedOrders,
        pendingOrders,
        cancelledOrders,
        totalSpent,
        referralCode,
        totalReferrals,
        pendingCommission,
        totalCommissionEarned,
        joinedDate: userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString('id-ID') : '-',
        lastLogin: userData?.updatedAt ? new Date(userData.updatedAt).toLocaleDateString('id-ID') : '-',
        verificationStatus: userData?.approvalStatus === 'approved' ? 'verified' : 
                          userData?.approvalStatus === 'pending' ? 'pending' : 'unverified',
      });

    } catch (error: any) {
      console.error('Error loading user data:', error);
      setError(error?.message || 'Failed to load user data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getRoleLabel = (role: UserRole): string => {
    const roleMap: Record<UserRole, string> = {
      super_admin: 'Super Admin',
      admin: 'Admin',
      jamaah: 'Jamaah',
      alumni_jamaah: 'Alumni Jamaah',
      reseller_agen: 'Reseller Agen',
      mitra_biro: 'Mitra Biro',
      influencer_affiliator: 'Influencer Affiliator',
      corporate_client: 'Corporate Client',
      travel_consultant: 'Travel Consultant',
      content_creator: 'Content Creator',
    };
    return roleMap[role] || role;
  };

  const getRoleBadgeColor = (role: UserRole): string => {
    const colorMap: Record<UserRole, string> = {
      super_admin: 'bg-purple-100 text-purple-800',
      admin: 'bg-blue-100 text-blue-800',
      jamaah: 'bg-green-100 text-green-800',
      alumni_jamaah: 'bg-emerald-100 text-emerald-800',
      reseller_agen: 'bg-orange-100 text-orange-800',
      mitra_biro: 'bg-yellow-100 text-yellow-800',
      influencer_affiliator: 'bg-pink-100 text-pink-800',
      corporate_client: 'bg-indigo-100 text-indigo-800',
      travel_consultant: 'bg-teal-100 text-teal-800',
      content_creator: 'bg-rose-100 text-rose-800',
    };
    return colorMap[role] || 'bg-gray-100 text-gray-800';
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Verified</span>
          </div>
        );
      case 'pending':
        return (
          <div className="flex items-center gap-2 text-yellow-600">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Pending</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 text-gray-600">
            <XCircle className="w-5 h-5" />
            <span className="font-medium">Unverified</span>
          </div>
        );
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Helper to extract base64 from document (supports both string and object format)
  const getDocumentUrl = (doc: string | { base64: string } | undefined): string | null => {
    if (!doc) return null;
    if (typeof doc === 'string') return doc;
    if (typeof doc === 'object' && doc.base64) return doc.base64;
    return null;
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-amber-500 to-amber-600 text-white p-6 flex justify-between items-center rounded-t-2xl z-10">
            <div>
              <h2 className="text-2xl font-bold">Profile Detail</h2>
              <p className="text-amber-100 text-sm mt-1">Informasi lengkap user termasuk biodata & dokumen</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading data...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Failed to Load User Data</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={loadUserData}
                  className="px-6 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
                >
                  Retry
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200 text-left max-w-md mx-auto">
                <p className="text-sm text-blue-800 mb-2 font-semibold">⚠️ Common Issues:</p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Firestore Rules belum ter-deploy ke Firebase Console</li>
                  <li>• User document tidak ada di Firestore</li>
                  <li>• Permission error - deploy rules dulu</li>
                </ul>
                <a 
                  href="/DEPLOY-RULES-NOW.html" 
                  target="_blank"
                  className="inline-block mt-3 text-sm text-blue-600 hover:text-blue-800 font-semibold"
                >
                  📋 Deploy Rules Now →
                </a>
              </div>
            </div>
          ) : (stats && profileData) ? (
            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="bg-gradient-to-br from-amber-50 to-white rounded-xl p-6 border border-amber-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-amber-600" />
                  User Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Display Name</p>
                    <p className="font-semibold text-gray-800">{profileData.displayName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Email</p>
                    <p className="font-semibold text-gray-800 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      {profileData.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Phone Number</p>
                    <p className="font-semibold text-gray-800 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      {profileData.phoneNumber || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Role</p>
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(userRole)}`}>
                      <Shield className="w-4 h-4" />
                      {getRoleLabel(userRole)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Verification Status</p>
                    {getVerificationBadge(stats.verificationStatus)}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Joined Date</p>
                    <p className="font-semibold text-gray-800 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      {stats.joinedDate}
                    </p>
                  </div>
                </div>
              </div>

              {/* ✅ NEW: Identity Information */}
              {profileData.identityInfo && (
                <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-6 border border-blue-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    Identity Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Full Name (KTP)</p>
                      <p className="font-semibold text-gray-800">{profileData.identityInfo.fullName || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">ID Number (NIK)</p>
                      <p className="font-semibold text-gray-800 font-mono">{profileData.identityInfo.idNumber || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Birth Date</p>
                      <p className="font-semibold text-gray-800">{profileData.identityInfo.birthDate || '-'}</p>
                    </div>
                    {profileData.identityInfo.address && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-600 mb-1 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Address
                        </p>
                        <p className="font-semibold text-gray-800">
                          {[
                            profileData.identityInfo.address.street,
                            profileData.identityInfo.address.city,
                            profileData.identityInfo.address.province,
                            profileData.identityInfo.address.country,
                            profileData.identityInfo.address.postalCode
                          ].filter(Boolean).join(', ') || '-'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ✅ NEW: Emergency Contact */}
              {profileData.emergencyContact && (
                <div className="bg-gradient-to-br from-red-50 to-white rounded-xl p-6 border border-red-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-600" />
                    Emergency Contact
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Name</p>
                      <p className="font-semibold text-gray-800">{profileData.emergencyContact.name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Phone Number</p>
                      <p className="font-semibold text-gray-800 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        {profileData.emergencyContact.phone || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Relationship</p>
                      <p className="font-semibold text-gray-800">{profileData.emergencyContact.relationship || '-'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ✅ NEW: Travel Documents */}
              {profileData.travelDocuments && (
                <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl p-6 border border-purple-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-600" />
                    Travel Documents
                  </h3>
                  
                  {/* Passport Info */}
                  {(profileData.travelDocuments.passportNumber || profileData.travelDocuments.passportExpiry) && (
                    <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200">
                      <h4 className="font-semibold text-gray-800 mb-2">Passport Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {profileData.travelDocuments.passportNumber && (
                          <div>
                            <p className="text-sm text-gray-600">Passport Number</p>
                            <p className="font-semibold text-gray-800 font-mono">{profileData.travelDocuments.passportNumber}</p>
                          </div>
                        )}
                        {profileData.travelDocuments.passportExpiry && (
                          <div>
                            <p className="text-sm text-gray-600">Expiry Date</p>
                            <p className="font-semibold text-gray-800">{profileData.travelDocuments.passportExpiry}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Document Photos Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* KTP Photo */}
                    {getDocumentUrl(profileData.travelDocuments.ktpPhoto) && (
                      <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <p className="text-sm text-gray-600 mb-2 font-semibold flex items-center gap-2">
                          <ImageIcon className="w-4 h-4" />
                          KTP Photo
                        </p>
                        <div 
                          onClick={() => setSelectedImage(getDocumentUrl(profileData.travelDocuments?.ktpPhoto))}
                          className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                        >
                          <img
                            src={getDocumentUrl(profileData.travelDocuments.ktpPhoto)!}
                            alt="KTP"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}

                    {/* KK Photo */}
                    {getDocumentUrl(profileData.travelDocuments.kkPhoto) && (
                      <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <p className="text-sm text-gray-600 mb-2 font-semibold flex items-center gap-2">
                          <ImageIcon className="w-4 h-4" />
                          KK Photo
                        </p>
                        <div 
                          onClick={() => setSelectedImage(getDocumentUrl(profileData.travelDocuments?.kkPhoto))}
                          className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                        >
                          <img
                            src={getDocumentUrl(profileData.travelDocuments.kkPhoto)!}
                            alt="KK"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}

                    {/* Passport Photo */}
                    {getDocumentUrl(profileData.travelDocuments.passportPhoto) && (
                      <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <p className="text-sm text-gray-600 mb-2 font-semibold flex items-center gap-2">
                          <ImageIcon className="w-4 h-4" />
                          Passport Photo
                        </p>
                        <div 
                          onClick={() => setSelectedImage(getDocumentUrl(profileData.travelDocuments?.passportPhoto))}
                          className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                        >
                          <img
                            src={getDocumentUrl(profileData.travelDocuments.passportPhoto)!}
                            alt="Passport"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}

                    {/* Visa Document */}
                    {getDocumentUrl(profileData.travelDocuments.visaDocument) && (
                      <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <p className="text-sm text-gray-600 mb-2 font-semibold flex items-center gap-2">
                          <ImageIcon className="w-4 h-4" />
                          Visa Document
                        </p>
                        <div 
                          onClick={() => setSelectedImage(getDocumentUrl(profileData.travelDocuments?.visaDocument))}
                          className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                        >
                          <img
                            src={getDocumentUrl(profileData.travelDocuments.visaDocument)!}
                            alt="Visa"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}

                    {/* Health Certificate */}
                    {getDocumentUrl(profileData.travelDocuments.healthCertificate) && (
                      <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <p className="text-sm text-gray-600 mb-2 font-semibold flex items-center gap-2">
                          <ImageIcon className="w-4 h-4" />
                          Health Certificate
                        </p>
                        <div 
                          onClick={() => setSelectedImage(getDocumentUrl(profileData.travelDocuments?.healthCertificate))}
                          className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                        >
                          <img
                            src={getDocumentUrl(profileData.travelDocuments.healthCertificate)!}
                            alt="Health Certificate"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Order Statistics */}
              <div className="bg-gradient-to-br from-green-50 to-white rounded-xl p-6 border border-green-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-green-600" />
                  Order Statistics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.totalOrders}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <p className="text-sm text-gray-600 mb-1">Completed</p>
                    <p className="text-2xl font-bold text-green-600">{stats.completedOrders}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-yellow-200">
                    <p className="text-sm text-gray-600 mb-1">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.pendingOrders}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-red-200">
                    <p className="text-sm text-gray-600 mb-1">Cancelled</p>
                    <p className="text-2xl font-bold text-red-600">{stats.cancelledOrders}</p>
                  </div>
                </div>
                <div className="mt-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg p-4">
                  <p className="text-sm text-amber-100 mb-1">Total Spending</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.totalSpent)}</p>
                </div>
              </div>

              {/* Referral & Commission (if applicable) */}
              {(userRole === 'alumni_jamaah' || userRole === 'reseller_agen' || stats.referralCode !== '-') && (
                <div className="bg-gradient-to-br from-emerald-50 to-white rounded-xl p-6 border border-emerald-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-600" />
                    Referral & Commission
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <p className="text-sm text-gray-600 mb-1 flex items-center gap-2">
                        <Hash className="w-4 h-4" />
                        Referral Code
                      </p>
                      <p className="text-xl font-bold text-gray-800 font-mono">{stats.referralCode}</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-emerald-200">
                      <p className="text-sm text-gray-600 mb-1">Total Referrals</p>
                      <p className="text-2xl font-bold text-emerald-600">{stats.totalReferrals}</p>
                    </div>
                    {(userRole === 'alumni_jamaah' || userRole === 'reseller_agen') && (
                      <>
                        <div className="bg-white rounded-lg p-4 border border-yellow-200">
                          <p className="text-sm text-gray-600 mb-1">Pending Commission</p>
                          <p className="text-xl font-bold text-yellow-600">{formatCurrency(stats.pendingCommission)}</p>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-green-200">
                          <p className="text-sm text-gray-600 mb-1">Total Earned</p>
                          <p className="text-xl font-bold text-green-600">{formatCurrency(stats.totalCommissionEarned)}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="text-gray-600">Failed to load user data</p>
              <button
                onClick={loadUserData}
                className="mt-4 px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ✅ Image Preview Modal */}
      {selectedImage && (
        <div 
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[60] p-4 cursor-zoom-out"
        >
          <div className="relative max-w-6xl max-h-[90vh]">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={selectedImage}
              alt="Document Preview"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default UserProfileDetailModal;