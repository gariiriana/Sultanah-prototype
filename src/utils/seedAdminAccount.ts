/**
 * ═══════════════════════════════════════════════════════════════
 * 🌟 SEED ADMIN ACCOUNT - SULTANAH TRAVEL
 * ═══════════════════════════════════════════════════════════════
 * 
 * Script untuk membuat admin account default secara otomatis.
 * 
 * CARA MENGGUNAKAN:
 * 1. Buka browser console (F12)
 * 2. Jalankan: window.seedAdminAccount()
 * 3. Admin account akan dibuat otomatis
 * 
 * CREDENTIALS YANG DIBUAT:
 * Email: adminSultanah@gmail.com
 * Password: Sultanah@536!
 * Role: admin
 */

import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { UserProfile } from '../types';

export const DEFAULT_ADMIN_EMAIL = 'adminSultanah@gmail.com';
export const DEFAULT_ADMIN_PASSWORD = 'Sultanah@536!';

/**
 * Seed Admin Account - Create default admin
 */
export const seedAdminAccount = async () => {
  try {
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🌱 SEEDING ADMIN ACCOUNT...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    // Create admin user in Firebase Auth
    console.log('📝 Creating admin user in Firebase Auth...');
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      DEFAULT_ADMIN_EMAIL,
      DEFAULT_ADMIN_PASSWORD
    );

    const uid = userCredential.user.uid;
    console.log('✅ Admin user created! UID:', uid);

    // Create admin profile in Firestore
    console.log('📝 Creating admin profile in Firestore...');
    const adminProfile: UserProfile = {
      id: uid,
      email: DEFAULT_ADMIN_EMAIL,
      role: 'admin',
      name: 'Admin Sultanah',
      phoneNumber: '+62 812 3456 7890',
      profileComplete: true,
      documentsApproved: true,
      approvalStatus: 'approved',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'users', uid), adminProfile);
    console.log('✅ Admin profile created!');

    // Also create in admins collection for quick lookup
    await setDoc(doc(db, 'admins', DEFAULT_ADMIN_EMAIL), {
      uid: uid,
      email: DEFAULT_ADMIN_EMAIL,
      role: 'admin',
      createdAt: new Date().toISOString(),
    });
    console.log('✅ Admin lookup created!');

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ ADMIN ACCOUNT CREATED SUCCESSFULLY!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('📧 Email:    ' + DEFAULT_ADMIN_EMAIL);
    console.log('🔑 Password: ' + DEFAULT_ADMIN_PASSWORD);
    console.log('');
    console.log('🎯 You can now login with these credentials!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    return {
      success: true,
      uid: uid,
      email: DEFAULT_ADMIN_EMAIL,
    };
  } catch (error: any) {
    console.error('');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ ERROR CREATING ADMIN ACCOUNT');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('');

    if (error.code === 'auth/email-already-in-use') {
      console.error('⚠️  Admin account already exists!');
      console.error('');
      console.error('📧 Email:    ' + DEFAULT_ADMIN_EMAIL);
      console.error('🔑 Password: ' + DEFAULT_ADMIN_PASSWORD);
      console.error('');
      console.error('🎯 Try logging in with these credentials.');
      console.error('');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('');
      
      return {
        success: false,
        error: 'already-exists',
        message: 'Admin account already exists',
      };
    }

    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    console.error('');
    console.error('💡 TROUBLESHOOTING:');
    console.error('');
    console.error('1. Check Firebase Configuration:');
    console.error('   - Make sure Firebase project is properly configured');
    console.error('   - Check /src/config/firebase.ts');
    console.error('');
    console.error('2. Check Firestore Rules:');
    console.error('   - Go to Firebase Console > Firestore Database > Rules');
    console.error('   - Make sure rules allow writes to users collection');
    console.error('');
    console.error('3. Manual Setup:');
    console.error('   - Go to Firebase Console > Authentication > Users');
    console.error('   - Click "Add User"');
    console.error('   - Email: ' + DEFAULT_ADMIN_EMAIL);
    console.error('   - Password: ' + DEFAULT_ADMIN_PASSWORD);
    console.error('   - Then manually create user document in Firestore');
    console.error('');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('');

    return {
      success: false,
      error: error.code,
      message: error.message,
    };
  }
};

/**
 * Display seed instructions
 */
export const displaySeedInstructions = () => {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║           🌱 SEED ADMIN ACCOUNT INSTRUCTIONS              ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('To create default admin account, run:');
  console.log('');
  console.log('  window.seedAdminAccount()');
  console.log('');
  console.log('Or import and call from your code:');
  console.log('');
  console.log('  import { seedAdminAccount } from "./utils/seedAdminAccount"');
  console.log('  await seedAdminAccount()');
  console.log('');
  console.log('Default credentials:');
  console.log('  📧 Email:    adminSultanah@gmail.com');
  console.log('  🔑 Password: Sultanah@536!');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
};

// Make available globally for console access
if (typeof window !== 'undefined') {
  (window as any).seedAdminAccount = seedAdminAccount;
  (window as any).showSeedInstructions = displaySeedInstructions;
}
