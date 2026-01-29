// TypeScript types for the application

export interface Package {
  id: string;
  name: string;
  type: 'umrah' | 'hajj' | 'ziarah';
  packageClass?: 'reguler' | 'vip' | 'vvip' | 'super-vvip';
  price: number;
  duration: number; // in days
  departureDate: string;
  maxParticipants: number;
  availableSlots: number;
  status: 'active' | 'inactive';
  features: string[];
  photo?: string; // Base64 (deprecated, use 'image' instead)
  image?: string; // Base64 (new consistent field name)
  description: string;
  // Enhanced details for better UI
  hotel?: string;
  airline?: string;
  includes?: string[]; // Detailed includes list
  excludes?: string[]; // What's not included
  itinerary?: string[]; // Day-by-day itinerary
  highlight?: string[]; // Main highlight/selling point
  terms?: string; // Terms and conditions
  meetingPoint?: string; // Meeting point for departure
  whatsappNumber?: string; // WhatsApp number for consultation
  // Tour Leader Assignment
  assignedTourLeaderId?: string; // Tour Leader User ID (deprecated, use tourLeaderId)
  tourLeaderId?: string; // Tour Leader User ID (new consistent field name)
  tourLeaderName?: string; // Tour Leader Display Name
  // DETAIL PAGE CONTENT - Created by Admin
  detailContent?: string; // Rich HTML content for detail page
  detailDescription?: string; // Long description for detail page
  createdAt: string;
  updatedAt: string;
}

export interface EducationContent {
  id: string;
  title: string;
  category: string;
  slot: number;
  description: string;
  image: string; // Base64
  displaySettings: {
    featured: boolean;
    order: number;
  };
  seo: {
    metaTitle: string;
    metaDescription: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Promo {
  id: string;
  title: string;
  description: string;
  discount: string; // e.g., "15%", "20%", "80%"
  validUntil: string; // e.g., "31 Maret 2025"
  featured?: boolean;
  image?: string; // Base64 promo banner image
  color?: 'blue' | 'gold' | 'green'; // Card color
  icon?: 'clock' | 'gift' | 'users'; // Card icon
  badge?: string; // Badge text for highlight
  // DETAIL PAGE CONTENT - Created by Admin
  detailDescription?: string; // Long description for detail page
  includes?: string[]; // What's included in promo
  excludes?: string[]; // What's not included
  terms?: string; // Terms and conditions
  meetingPoint?: string; // Meeting point (if applicable)
  whatsappNumber?: string; // WhatsApp number for consultation
  detailContent?: string; // Rich HTML content for detail page (legacy)
  termsAndConditions?: string; // T&C for promo (legacy)
  createdAt: string;
  updatedAt?: string;
}

// CONSULTATION TRACKING - Replaces Booking System
export interface Consultation {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  type: 'package' | 'promo'; // What they're consulting about
  itemId: string; // Package ID or Promo ID
  itemName: string; // Package name or Promo title
  status: 'pending' | 'contacted' | 'converted' | 'cancelled';
  notes?: string; // Admin notes
  contactedAt?: string;
  convertedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhoto?: string; // User profile photo
  packageId?: string; // Optional - jika testimoni untuk package tertentu
  packageName?: string; // Optional - nama package
  rating: number; // 1-5 stars
  comment: string; // Testimoni text
  photo?: string; // Base64 optional - foto pengalaman user
  status: 'pending' | 'approved' | 'rejected'; // Admin approval status
  approvedAt?: string; // Tanggal approved
  approvedBy?: string; // Admin ID yang approve
  rejectedReason?: string; // Alasan jika ditolak
  createdAt: string;
  updatedAt: string;
}

// ========== NEW: ARTICLE & NEWS SYSTEM ==========
export interface Article {
  id: string;
  title: string;
  slug?: string; // URL-friendly title
  category: 'tips-umroh' | 'pengalaman-jamaah' | 'informasi-terbaru' | 'panduan-ibadah' | 'news' | 'article';
  content: string; // Rich text content
  excerpt?: string; // Short summary
  thumbnail?: string; // Base64 image
  image?: string; // Base64 image (alternative field name)
  author?: {
    id?: string;
    name?: string;
    role?: string;
    email?: string;
    phone?: string;
    socialMedia?: string;
  };
  status: 'draft' | 'pending' | 'published' | 'rejected' | 'approved';
  featured?: boolean; // Featured article
  tags?: string[]; // Search tags
  viewCount?: number;
  views?: number; // Alternative field name
  likes?: number;
  likedBy?: string[]; // Array of user IDs who liked
  comments?: ArticleComment[];
  publishedAt?: string;
  rejectedReason?: string;
  createdAt: any; // Firestore timestamp
  updatedAt?: any; // Firestore timestamp
  deleted?: boolean; // Soft delete flag
}

export interface ArticleComment {
  id: string;
  articleId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  comment: string;
  createdAt: string;
}

// ========== NEW: REFERRAL SYSTEM ==========
export interface Referral {
  id: string;
  userId: string; // User yang memiliki referral code
  code: string; // Unique referral code
  totalReferrals: number; // Jumlah yang berhasil mendaftar
  referredUsers: ReferredUser[];
  rewards?: {
    points?: number;
    bonuses?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface ReferredUser {
  userId: string;
  userName: string;
  email: string;
  joinedAt: string;
  status: 'registered' | 'verified' | 'converted'; // Converted = sudah booking
}

// ========== NEW: BANNER & ANNOUNCEMENT SYSTEM ==========
export interface Banner {
  id: string;
  title: string;
  image: string; // Base64
  link?: string; // Optional link when clicked
  order: number; // Display order
  active: boolean;
  validFrom?: string;
  validUntil?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'urgent';
  active: boolean;
  displayLocation: 'home' | 'dashboard' | 'all';
  validFrom?: string;
  validUntil?: string;
  createdAt: string;
  updatedAt: string;
}

// ========== NEW: USER ROLES & PERMISSIONS ==========
export type UserRole =
  | 'admin'
  | 'super_admin'        // ✅ ADDED: Super Admin role
  | 'prospective-jamaah'
  | 'current-jamaah'
  | 'alumni'             // ✅ Alumni Jamaah (eligible for referral commission)
  | 'agen'               // ✅ Reseller Agen (higher commission rate)
  | 'tour-leader'
  | 'mutawwif'
  | 'staff'              // NEW: Staff role
  | 'supervisor'         // NEW: Supervisor/Management role
  | 'direktur'           // NEW: Direktur/Owner role
  | 'jamaah'             // ✅ ADDED: Legacy/General Jamaah role
  | 'alumni_jamaah'      // ✅ ADDED: Legacy Alumni Jamaah (backward compatibility)
  | 'reseller_agen'      // ✅ ADDED: Legacy Reseller Agen (backward compatibility)
  | 'mitra_biro'         // ✅ ADDED: Mitra Biro
  | 'influencer_affiliator'  // ✅ ADDED: Influencer Affiliator
  | 'corporate_client'   // ✅ ADDED: Corporate Client
  | 'travel_consultant'  // ✅ ADDED: Travel Consultant
  | 'content_creator'    // ✅ ADDED: Content Creator
  | 'owner'              // ✅ NEW: Owner role (God Mode)
  | 'affiliator'         // ✅ NEW: Affiliator role
  | 'brand_ambassador'   // ✅ NEW: Brand Ambassador role
  | 'influencer';        // ✅ NEW: Influencer role

export interface UserExtended extends User {
  role: UserRole;
  jamaahInfo?: {
    packageId?: string;
    packageName?: string;
    departureDate?: string;
    returnDate?: string;
    status?: 'pending' | 'confirmed' | 'departed' | 'completed';
  };
  tourLeaderInfo?: {
    assignedGroups?: string[];
    activeTrips?: number;
  };
  mutawwifInfo?: {
    specialization?: string[];
    language?: string[];
  };
}

// ========== NEW: ACCOUNT APPROVAL SYSTEM ==========
export interface AccountApproval {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  requestedRole: 'tour-leader' | 'mutawwif';
  currentRole: UserRole;
  applicationData: {
    fullName: string;
    phoneNumber?: string;
    experience?: string;          // Years of experience
    certifications?: string[];    // Certifications/licenses
    languages?: string[];         // Languages spoken
    specialization?: string[];    // For mutawwif
    motivation?: string;          // Why they want this role
    references?: string;          // References/recommendations
    documents?: {
      cv?: string;                // Base64 CV
      certificates?: string[];    // Base64 certificates
      idCard?: string;            // Base64 ID
    };
  };
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;            // Admin ID who reviewed
  reviewNotes?: string;
  rejectedReason?: string;
  appliedAt: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  role: UserRole; // Updated to use UserRole type
  displayName?: string;
  phoneNumber?: string;
  profilePhoto?: string;
  identityInfo?: {
    fullName?: string;
    idNumber?: string;
    birthDate?: string;
    address?: string | {
      street?: string;
      city?: string;
      province?: string;
      country?: string;
      postalCode?: string;
    };
    // ✅ NEW: Direct address fields for easier access/flattened structure
    streetAddress?: string;
    city?: string;
    state?: string; // Using 'state' to match dashboard usage (province)
    country?: string;
    postalCode?: string;
  };
  travelDocuments?: {
    passportNumber?: string;
    passportExpiry?: string;
    passportPhoto?: string | { base64: string }; // ✅ FIXED: Support both formats
    ktpPhoto?: string | { base64: string }; // ✅ FIXED: Support both formats
    kkPhoto?: string | { base64: string }; // ✅ FIXED: Support both formats
    marriageCertificate?: string | { base64: string }; // Base64 - Buku Nikah (Optional)
    birthCertificate?: string | { base64: string }; // Base64 - Akta Lahir
    umrahVisa?: string | { base64: string }; // Base64 - Visa Umroh
    flightTicket?: string | { base64: string }; // Base64 - Tiket Pesawat
    vaccinationCertificate?: string | { base64: string }; // Base64 - Sertifikat Vaksinasi
    healthCertificate?: string | { base64: string }; // Base64 - LEGACY, keeping for backward compatibility
    visaDocument?: string | { base64: string }; // ✅ NEW: Visa document
  };
  emergencyContact?: {
    name?: string;
    relationship?: string;
    phone?: string;
  };
  profileComplete?: boolean;
  documentsApproved?: boolean;
  // ✅ NEW: Approval status for tour-leader & mutawwif
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approvalRequestedAt?: string;
  approvedAt?: string;
  approvedBy?: string; // Admin ID who approved
  rejectionReason?: string;
  // NEW: Referral tracking
  referralCode?: string; // User's own referral code
  referredBy?: string; // Who referred this user
  // NEW: Role-specific info
  jamaahInfo?: {
    packageId?: string;
    packageName?: string;
    departureDate?: string;
    returnDate?: string;
    status?: 'pending' | 'confirmed' | 'departed' | 'completed';
  };
  tourLeaderInfo?: {
    assignedGroups?: string[];
    activeTrips?: number;
  };
  mutawwifInfo?: {
    specialization?: string[];
    language?: string[];
  };
  createdAt: string;
  // ✅ NEW: Family Members (One account for multiple pax)
  familyMembers?: FamilyMember[];
}

// ========== NEW: FAMILY MEMBER SYSTEM ==========
export interface FamilyMember {
  id: string; // uuid
  fullName: string;
  relationship: 'spouse' | 'child' | 'parent' | 'sibling' | 'other';
  birthDate: string;
  identityNumber?: string; // NIK
  passportNumber?: string;
  passportExpiry?: string;
  documents?: {
    passportPhoto?: string;
    ktpPhoto?: string;
    photo?: string;
  };
}

// ========== NEW: SAVINGS (TABUNGAN) SYSTEM ==========
export interface SavingsAccount {
  userId: string;
  balance: number;
  lastUpdated: string;
  accountNumber: string; // Virtual account number or Unique ID
  status: 'active' | 'frozen';
}

export interface SavingsTransaction {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'payment'; // Payment = bayar paket pakai tabungan
  paymentMethod: 'transfer_manual' | 'midtrans_va' | 'cash';
  status: 'pending' | 'approved' | 'rejected';
  proofUrl?: string; // Base64 or URL
  notes?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string; // ISO String
}

// ========== NEW: MEDICAL RECORDS ==========
export interface MedicalHistory {
  userId: string; // Can be main user or family member ID
  conditions: string[]; // e.g., ["Diabetes", "Hipertensi"]
  medications: string[]; // Obat yang rutin dikonsumsi
  allergies: string[];
  bloodType?: string;
  emergencyContact: {
    name: string;
    phone: string;
    relation: string;
  };
  notes?: string; // Catatan khusus untuk TL
  updatedAt: string;
}

// ========== NEW: ITEM REQUEST SYSTEM (Perlengkapan Umroh) ==========

// Mandatory items that come with each package
export interface PackageItem {
  id: string;
  packageId: string;
  packageName: string;
  itemName: string;
  itemType: 'mandatory' | 'optional' | 'purchasable';
  category: 'clothing' | 'document' | 'consumable' | 'equipment' | 'other';
  description?: string;
  quantity: number;
  price?: number; // For purchasable items
  imageUrl?: string;
  supplier?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Jamaah's request for additional items
export interface ItemRequest {
  id: string;
  requestNumber: string; // REQ-001, REQ-002, etc
  jamaahId: string;
  jamaahName: string;
  jamaahEmail: string;
  packageId: string;
  packageName: string;
  items: RequestedItem[];
  totalAmount: number;
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed';
  requestType: 'additional' | 'replacement' | 'upgrade';
  notes?: string;
  adminNotes?: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RequestedItem {
  itemName: string;
  category: 'clothing' | 'document' | 'consumable' | 'equipment' | 'other';
  quantity: number;
  price: number;
  totalPrice: number;
  description?: string;
  urgency: 'low' | 'medium' | 'high';
}

// Admin's checklist for items to prepare for each package
export interface ItemChecklist {
  id: string;
  packageId: string;
  packageName: string;
  departureDate: string;
  items: ChecklistItem[];
  totalJamaah: number;
  preparedBy?: string;
  preparedByName?: string;
  status: 'not-started' | 'in-progress' | 'completed';
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistItem {
  itemName: string;
  category: 'clothing' | 'document' | 'consumable' | 'equipment' | 'other';
  quantityNeeded: number;
  quantityPrepared: number;
  quantityPerJamaah: number;
  checked: boolean;
  checkedAt?: string;
  checkedBy?: string;
  notes?: string;
  supplier?: string;
  estimatedCost?: number;
}