import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { UserRole } from '../types'; // ✅ Import UserRole type
import { processReferralCode } from '../utils/referralProcessor'; // ✅ NEW: Import referral processor
import { autoCreateReferralCode } from '../utils/autoCreateReferralCode'; // ✅ NEW: Auto-create referral code on login

interface UserProfile {
  uid?: string; // Firebase user UID
  id?: string; // Alias for uid (backward compatibility)
  email: string;
  role: UserRole; // ✅ Changed from 'admin' | 'user' to UserRole
  displayName?: string;
  phoneNumber?: string;
  profilePhoto?: string;
  identityInfo?: {
    fullName?: string;
    idNumber?: string;
    birthDate?: string;
    address?: string;
    // ✅ NEW: Direct address fields
    streetAddress?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  travelDocuments?: {
    passportNumber?: string;
    passportExpiry?: string;
    passportPhoto?: string;
    ktpPhoto?: string;
    kkPhoto?: string; // Kartu Keluarga
    marriageCertificate?: string; // Buku Nikah (Optional)
    birthCertificate?: string; // Akta Lahir
    umrahVisa?: string; // Visa Umroh
    visaDocument?: string; // ✅ NEW: Visa Document
    flightTicket?: string; // Tiket Pesawat
    vaccinationCertificate?: string; // Sertifikat Vaksinasi
  };
  emergencyContact?: {
    name?: string;
    relationship?: string;
    phone?: string;
  };
  profileComplete?: boolean;
  // ✅ NEW: Approval fields
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approvalRequestedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  referralCode?: string; // ✅ NEW: User's own referral code
  referredBy?: string; // ✅ NEW: Who referred this user
  createdAt: string;
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string, phoneNumber?: string, role?: UserRole, referralCode?: string) => Promise<void>; // ✅ Added referralCode parameter
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  isAdmin: boolean;
  isManagement: boolean; // ✅ NEW: Check if user has management access
  getRoleDisplayName: () => string; // ✅ NEW: Get role display name
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // During hot module reload, context might be temporarily undefined
    // Return a safe default to prevent crashes during HMR
    if (import.meta.env.DEV) {
      // Silently return safe default during HMR - no console warning
      return {
        currentUser: null,
        userProfile: null,
        loading: true,
        signUp: async () => { },
        signIn: async () => { },
        signOut: async () => { },
        resetPassword: async () => { },
        updateUserProfile: async () => { },
        isAdmin: false,
        isManagement: false,
        getRoleDisplayName: () => 'User',
      } as AuthContextType;
    }
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Check if user is admin
  const isAdmin = userProfile?.role === 'admin';

  // ✅ NEW: Check if user has management access (Staff, Admin, Supervisor, Direktur)
  const isManagement = userProfile?.role
    ? ['staff', 'admin', 'supervisor', 'direktur'].includes(userProfile.role)
    : false;

  // ✅ NEW: Get role display name
  const getRoleDisplayName = (): string => {
    const roleNames: Record<UserRole, string> = {
      'admin': 'Admin',
      'staff': 'Staff',
      'supervisor': 'Supervisor / Management',
      'direktur': 'Direktur / Owner',
      'tour-leader': 'Tour Leader',
      'mutawwif': 'Mutawwif',
      'agen': 'Agen',
      'prospective-jamaah': 'Calon Jamaah',
      'current-jamaah': 'Jamaah Aktif',
      'alumni': 'Alumni',
      'super_admin': 'Super Admin',
      'jamaah': 'Jamaah',
      'alumni_jamaah': 'Alumni Jamaah (Legacy)',
      'reseller_agen': 'Reseller Agen (Legacy)',
      'mitra_biro': 'Mitra Biro',
      'influencer_affiliator': 'Influencer / Affiliator',
      'corporate_client': 'Corporate Client',
      'travel_consultant': 'Travel Consultant',
      'content_creator': 'Content Creator',
      'owner': 'Owner', // ✅ NEW
      'affiliator': 'Affiliator', // ✅ NEW
      'brand_ambassador': 'Brand Ambassador', // ✅ NEW
      'influencer': 'Influencer' // ✅ NEW
    };
    return userProfile?.role ? roleNames[userProfile.role] : 'User';
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        // ✅ Setup real-time listener for user profile
        const userDocRef = doc(db, 'users', user.uid);

        const unsubscribeSnapshot = onSnapshot(userDocRef, (docSnapshot) => {
          if (docSnapshot.exists()) {
            const profileData = docSnapshot.data() as UserProfile;

            // ✅ ADD UID to profile data
            profileData.uid = user.uid;
            profileData.id = user.uid; // Also add as 'id' for backward compatibility

            // ✅ LOG UPDATED DATA FROM FIRESTORE
            console.log('🔄 Real-time profile update from Firestore:', {
              email: profileData.email,
              role: profileData.role,
              profileCompleted: profileData.profileComplete,
              uid: profileData.uid
            });

            setUserProfile(profileData);

            // ✅ NEW: Auto-create referral code for Alumni & Agen
            if ((profileData.role === 'alumni' || profileData.role === 'agen') && profileData.approvalStatus === 'approved') {
              autoCreateReferralCode(
                user.uid,
                profileData.role,
                profileData.displayName || 'User',
                profileData.email // ✅ Pass email for better tracking
              ).catch(error => {
                console.warn('⚠️ Failed to auto-create referral code:', error);
                // Don't throw - this is a non-critical feature
              });
            }
          } else {
            // 🔧 User document not found - This is normal for first-time users
            // Auto-creating default profile...

            const defaultProfile: UserProfile = {
              email: user.email || '',
              role: 'prospective-jamaah', // ✅ Changed from 'user' to 'prospective-jamaah'
              profileComplete: false,
              createdAt: new Date().toISOString(),
              displayName: user.displayName || '',
              phoneNumber: user.phoneNumber || '',
              uid: user.uid,
              id: user.uid,
            };

            setDoc(userDocRef, defaultProfile)
              .then(() => {
                console.log('✅ New user profile initialized:', {
                  email: defaultProfile.email,
                  role: defaultProfile.role,
                  uid: defaultProfile.uid
                });
              })
              .catch((createError) => {
                console.error('❌ Failed to create user profile in Firestore:', createError);
                // ⚠️ FALLBACK: Set profile in state even if Firestore fails
                setUserProfile(defaultProfile);
                console.warn('⚠️ User profile initialized in memory only (Firestore write failed)');
              });
          }

          setLoading(false);
        }, (error) => {
          console.error('❌ Error listening to user profile:', error);
          setLoading(false);
        });

        // Store the snapshot unsubscribe function to clean up later
        return () => {
          unsubscribeSnapshot();
        };
      } else {
        setUserProfile(null);
        console.log('🚪 User logged out');
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const signUp = async (email: string, password: string, displayName?: string, phoneNumber?: string, role?: UserRole, referralCode?: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    const selectedRole = role || 'prospective-jamaah';

    // ✅ NEW: Set approval status for tour-leader, mutawwif & agen
    const requiresApproval = selectedRole === 'tour-leader' || selectedRole === 'mutawwif' || selectedRole === 'agen';

    // Create user profile in Firestore
    const userProfile: UserProfile = {
      email,
      role: selectedRole,
      profileComplete: false,
      createdAt: new Date().toISOString(),
      displayName,
      phoneNumber,
      // ✅ Set approval status if required
      ...(requiresApproval && {
        approvalStatus: 'pending',
        approvalRequestedAt: new Date().toISOString(),
      }),
    };

    await setDoc(doc(db, 'users', userCredential.user.uid), userProfile);

    // ✅ NEW: Process referral code if provided (before logout for roles requiring approval)
    if (referralCode && referralCode.trim() !== '') {
      console.log('🔗 Processing referral code:', referralCode);
      const result = await processReferralCode(
        referralCode.trim().toUpperCase(),
        userCredential.user.uid,
        email,
        displayName || 'User'
      );

      if (result.success) {
        console.log('✅ Referral processed successfully! Referrer:', result.referrerName);
        console.log('✅ Referral details:', {
          referrerId: result.referrerId,
          referrerRole: result.referrerRole,
          newUserId: userCredential.user.uid,
          newUserEmail: email
        });
        // ✅ Show success message in console for debugging
        console.log(
          `%c✅ REFERRAL SUCCESS!\n` +
          `Code: ${referralCode}\n` +
          `Referrer: ${result.referrerName} (${result.referrerRole})\n` +
          `New User: ${displayName} (${email})\n` +
          `Check dashboard for real-time update!`,
          'color: green; font-weight: bold; font-size: 14px; background: #e8f5e9; padding: 10px; border-radius: 5px;'
        );
      } else {
        console.warn('⚠️ Referral processing failed:', result.error);
        console.warn(
          `%c⚠️ REFERRAL FAILED!\n` +
          `Code: ${referralCode}\n` +
          `Error: ${result.error}\n` +
          `Registration will continue, but referral not tracked.`,
          'color: orange; font-weight: bold; font-size: 14px; background: #fff3e0; padding: 10px; border-radius: 5px;'
        );
        // Note: We don't throw error here - registration should still succeed even if referral fails
      }
    }

    // ✅ FIX: DON'T auto logout users anymore
    // They will stay logged in and AppContent routing will show WaitingApprovalPage for pending users
    console.log('✅ Sign up completed for:', email, '- Role:', selectedRole, '- Approval Required:', requiresApproval);
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Sign in to Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // ✅ NEW: Check if user requires approval
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as UserProfile;

        // Check if user is tour-leader, mutawwif or agen with REJECTED approval
        const requiresApproval = userData.role === 'tour-leader' || userData.role === 'mutawwif' || userData.role === 'agen';

        // ✅ FIX: Only block REJECTED users, NOT pending users
        // Pending users should be allowed to login and see WaitingApprovalPage
        if (requiresApproval && userData.approvalStatus === 'rejected') {
          // Force logout for rejected users only
          await firebaseSignOut(auth);
          throw new Error('Akun Anda ditolak: ' + (userData.rejectionReason || 'Aplikasi Anda ditolak oleh admin'));
        }

        // ✅ Pending users can login and will see WaitingApprovalPage via AppContent routing
        // ✅ All other users (prospective-jamaah, current-jamaah, alumni, admin, etc.) can login normally
        console.log('✅ Login successful for:', userData.email, '- Role:', userData.role, '- Approval Status:', userData.approvalStatus || 'N/A');
      }

      // If all checks pass, user remains logged in via onAuthStateChanged
    } catch (error: any) {
      // ✅ Enhanced error handling with user-friendly messages
      console.error('❌ Login error:', error);

      // If it's already our custom error, throw it as-is
      if (error.message && !error.code) {
        throw error;
      }

      // Handle Firebase auth errors
      switch (error.code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
          throw new Error('Email atau password salah. Silakan coba lagi.');

        case 'auth/invalid-email':
          throw new Error('Format email tidak valid.');

        case 'auth/user-disabled':
          throw new Error('Akun ini telah dinonaktifkan oleh admin.');

        case 'auth/too-many-requests':
          throw new Error('Terlalu banyak percobaan login. Silakan coba lagi nanti.');

        case 'auth/network-request-failed':
          throw new Error('Koneksi internet bermasalah. Periksa koneksi Anda.');

        default:
          throw new Error(error.message || 'Login gagal. Silakan coba lagi.');
      }
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUserProfile(null);
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!currentUser) return;

    // Deep merge helper function for nested objects
    const deepMerge = (target: any, source: any): any => {
      const output = { ...target };

      for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          // If both are objects, merge them recursively
          output[key] = deepMerge(target[key] || {}, source[key]);
        } else {
          // Otherwise, use the source value (including null to delete)
          output[key] = source[key];
        }
      }

      return output;
    };

    // Handle nested field updates (e.g., 'travelDocuments.passportPhoto')
    const updatedData: any = {};

    // Fetch current profile from Firestore to ensure we have the latest data
    const currentDoc = await getDoc(doc(db, 'users', currentUser.uid));
    const currentProfile = currentDoc.exists() ? currentDoc.data() : {};

    Object.entries(data).forEach(([key, value]) => {
      if (key.includes('.')) {
        // Handle nested fields like 'travelDocuments.passportPhoto'
        const parts = key.split('.');
        if (!updatedData[parts[0]]) {
          updatedData[parts[0]] = { ...(currentProfile[parts[0]] || {}) };
        }
        updatedData[parts[0]][parts[1]] = value;
      } else {
        updatedData[key] = value;
      }
    });

    // Update Firestore with merge option to preserve existing fields
    await updateDoc(doc(db, 'users', currentUser.uid), updatedData);

    // Re-fetch from Firestore to ensure sync
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    if (userDoc.exists()) {
      const profileData = userDoc.data() as UserProfile;
      // Add uid and id
      profileData.uid = currentUser.uid;
      profileData.id = currentUser.uid;
      setUserProfile(profileData);
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const value: AuthContextType = {
    currentUser,
    userProfile,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateUserProfile,
    isAdmin,
    isManagement,
    getRoleDisplayName
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Add displayName for better debugging and hot reload support
AuthProvider.displayName = 'AuthProvider';

// Export types for external use
export type { UserProfile, AuthContextType };