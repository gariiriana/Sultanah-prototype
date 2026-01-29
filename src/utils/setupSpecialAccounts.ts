/**
 * Setup Special Accounts untuk Role Staff, Supervisor, dan Direktur
 * 
 * INSTRUKSI SETUP:
 * 1. Login ke Firebase Console
 * 2. Buka Authentication > Users
 * 3. Buat 3 user baru dengan credential berikut:
 * 
 * STAFF:
 * - Email: StaffSultanah@umroh.com
 * - Password: Staff@1039
 * - Setelah dibuat, copy UID user tersebut
 * 
 * SUPERVISOR:
 * - Email: Supervisor/management@umroh34.com  
 * - Password: SPVMNGMENT@#
 * - Setelah dibuat, copy UID user tersebut
 * 
 * DIREKTUR:
 * - Email: Direkturown_er@gmail.com
 * - Password: CEOUmroh sultanah
 * - Setelah dibuat, copy UID user tersebut
 * 
 * 4. Setelah dapat semua UID, jalankan function setupSpecialAccounts() 
 *    dari browser console atau admin panel
 */

import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { User, UserRole } from '../types';

interface SpecialAccount {
  email: string;
  role: UserRole;
  displayName: string;
  uid?: string; // Will be filled after creating in Firebase Auth
}

export const SPECIAL_ACCOUNTS: SpecialAccount[] = [
  {
    email: 'StaffSultanah@umroh.com',
    role: 'staff',
    displayName: 'Staff Sultanah Travel'
  },
  {
    email: 'Supervisor/management@umroh34.com',
    role: 'supervisor',
    displayName: 'Supervisor Sultanah Travel'
  },
  {
    email: 'Direkturown_er@gmail.com',
    role: 'direktur',
    displayName: 'Direktur Sultanah Travel'
  }
];

/**
 * Setup user document di Firestore untuk special accounts
 * Dipanggil setelah user dibuat di Firebase Authentication
 */
export const setupSpecialAccountDocument = async (
  uid: string,
  email: string,
  role: UserRole,
  displayName: string
): Promise<void> => {
  try {
    // Check if user document already exists
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      console.log(`User document for ${email} already exists. Skipping...`);
      return;
    }

    // Create user document
    const userData: Partial<User> = {
      id: uid,
      email: email,
      role: role,
      displayName: displayName,
      profileComplete: true,
      documentsApproved: true,
      createdAt: new Date().toISOString()
    };

    await setDoc(userRef, userData);
    console.log(`✅ Successfully created user document for ${email} with role ${role}`);
  } catch (error) {
    console.error(`❌ Error setting up user document for ${email}:`, error);
    throw error;
  }
};

/**
 * Check if special account exists in Firestore
 */
export const checkSpecialAccount = async (email: string): Promise<boolean> => {
  try {
    // This is a simplified check - in real implementation, 
    // you'd query users collection by email
    console.log(`Checking for account: ${email}`);
    return false; // Return false to indicate manual setup needed
  } catch (error) {
    console.error('Error checking special account:', error);
    return false;
  }
};

/**
 * Get role display info
 */
export const getRoleDisplayInfo = (role: UserRole): { label: string; color: string; permissions: string[] } => {
  const roleInfo = {
    'staff': {
      label: 'Staff',
      color: 'text-blue-600',
      permissions: [
        'Manage daily operations',
        'Handle customer inquiries',
        'Process bookings',
        'Update content'
      ]
    },
    'supervisor': {
      label: 'Supervisor / Management',
      color: 'text-purple-600',
      permissions: [
        'All Staff permissions',
        'Review & approve staff actions',
        'Access analytics & reports',
        'Manage packages & pricing',
        'Handle escalations'
      ]
    },
    'direktur': {
      label: 'Direktur / Owner',
      color: 'text-gold',
      permissions: [
        'Full system access',
        'All Supervisor permissions',
        'Manage all users & roles',
        'Financial oversight',
        'Strategic decisions',
        'System configuration'
      ]
    },
    'admin': {
      label: 'Admin',
      color: 'text-red-600',
      permissions: [
        'Manage users',
        'Manage content',
        'Approve applications',
        'System settings'
      ]
    },
    'tour-leader': {
      label: 'Tour Leader',
      color: 'text-green-600',
      permissions: [
        'Manage assigned groups',
        'Update trip status',
        'Collect feedback'
      ]
    },
    'mutawwif': {
      label: 'Mutawwif',
      color: 'text-indigo-600',
      permissions: [
        'Provide religious guidance',
        'Manage jamaah spiritually',
        'Share knowledge'
      ]
    },
    'prospective-jamaah': {
      label: 'Calon Jamaah',
      color: 'text-gray-600',
      permissions: [
        'View packages',
        'Register interest',
        'Access information'
      ]
    },
    'current-jamaah': {
      label: 'Jamaah Aktif',
      color: 'text-orange-600',
      permissions: [
        'View trip details',
        'Upload documents',
        'Request items',
        'Access support'
      ]
    },
    'alumni': {
      label: 'Alumni',
      color: 'text-teal-600',
      permissions: [
        'Share experiences',
        'Access alumni group',
        'View exclusive offers'
      ]
    }
  };

  return roleInfo[role] || roleInfo['prospective-jamaah'];
};

/**
 * Check if user has permission based on role hierarchy
 */
export const hasPermission = (userRole: UserRole, requiredRole: UserRole): boolean => {
  const roleHierarchy: Record<UserRole, number> = {
    'prospective-jamaah': 1,
    'current-jamaah': 2,
    'alumni': 2,
    'tour-leader': 3,
    'mutawwif': 3,
    'staff': 4,
    'admin': 5,
    'supervisor': 6,
    'direktur': 7
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

/**
 * Display instructions for manual setup
 */
export const displaySetupInstructions = (): void => {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                     SETUP AKUN KHUSUS - INSTRUKSI                         ║
╚═══════════════════════════════════════════════════════════════════════════╝

📝 LANGKAH-LANGKAH:

1️⃣  Buka Firebase Console (https://console.firebase.google.com)
2️⃣  Pilih project Anda
3️⃣  Buka Authentication > Users
4️⃣  Klik "Add User" untuk setiap akun berikut:

┌───────────────────────────────────────────────────────────────────────────┐
│ 👔 AKUN STAFF                                                             │
├───────────────────────────────────────────────────────────────────────────┤
│ Email    : StaffSultanah@umroh.com                                        │
│ Password : Staff@1039                                                     │
│ Role     : staff                                                          │
└───────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────┐
│ 👨‍💼 AKUN SUPERVISOR/MANAGEMENT                                            │
├───────────────────────────────────────────────────────────────────────────┤
│ Email    : Supervisor/management@umroh34.com                              │
│ Password : SPVMNGMENT@#                                                   │
│ Role     : supervisor                                                     │
└───────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────┐
│ 🎯 AKUN DIREKTUR/OWNER                                                    │
├───────────────────────────────────────────────────────────────────────────┤
│ Email    : Direkturown_er@gmail.com                                       │
│ Password : CEOUmroh sultanah                                              │
│ Role     : direktur                                                       │
└───────────────────────────────────────────────────────────────────────────┘

5️⃣  Setelah membuat semua user, login menggunakan akun Admin
6️⃣  Buka halaman Admin > User Management
7️⃣  Cari user berdasarkan email dan update role mereka
8️⃣  Verify bahwa role telah diupdate dengan benar

⚠️  PENTING:
   - Pastikan email diketik dengan BENAR (case-sensitive untuk password)
   - Jangan share credential ini ke siapapun
   - Simpan di tempat yang aman
   - Consider using password manager

✅ Setelah selesai, test login dengan masing-masing akun!

  `);
};

// Auto-display instructions when imported
displaySetupInstructions();
