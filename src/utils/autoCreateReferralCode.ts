import { db, auth } from '../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

/**
 * 🔥 AUTO-CREATE REFERRAL CODE - FIXED VERSION
 * Automatically creates referral code for Alumni & Agen users
 * Called on login/approval to ensure referral code exists BEFORE anyone tries to use it
 * 
 * ✅ NEW DESIGN:
 * 1. Creates document in `referralCodes` collection (MASTER - indexed by code)
 * 2. Also creates in `alumniReferrals` or `agenReferrals` collection (role-specific)
 * 
 * @param userId - User ID (uid)
 * @param userRole - User role (must be 'alumni' or 'agen')
 * @param displayName - User display name (for generating code)
 * @param userEmail - User email (optional, for better tracking)
 * @returns true if successful or already exists, false if error
 */
export async function autoCreateReferralCode(
  userId: string,
  userRole: string,
  displayName: string = 'USER',
  userEmail?: string
): Promise<boolean> {
  try {
    // Only create for Alumni & Agen
    if (userRole !== 'alumni' && userRole !== 'agen') {
      console.log('⚠️ [AUTO-REFERRAL] Role not eligible for referral:', userRole);
      return false;
    }

    // ✅ CHECK: User must be authenticated
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error('❌ [AUTO-REFERRAL] User not authenticated! Cannot create referral code.');
      return false;
    }

    // ✅ ENHANCED: Allow Admin to create referral codes for other users
    // This is needed for Admin approval flow (Admin approves Agen → auto-create referral code)
    const isCreatingForSelf = currentUser.uid === userId;
    const isAdminCreatingForOthers = currentUser.uid !== userId;
    
    if (isAdminCreatingForOthers) {
      // Check if current user is admin
      const currentUserDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const currentUserRole = currentUserDoc.exists() ? currentUserDoc.data().role : null;
      
      if (currentUserRole !== 'admin') {
        console.error('❌ [AUTO-REFERRAL] User ID mismatch! Only admin can create referral codes for other users.', {
          currentUser: currentUser.uid,
          currentUserRole,
          requestedUser: userId
        });
        return false;
      }
      
      console.log('✅ [AUTO-REFERRAL] Admin creating referral code for another user:', {
        adminUid: currentUser.uid,
        adminEmail: currentUser.email,
        targetUserId: userId,
        targetRole: userRole
      });
    } else {
      console.log('✅ [AUTO-REFERRAL] User authenticated (creating for self):', {
        uid: currentUser.uid,
        email: currentUser.email,
        role: userRole
      });
    }

    // ✅ If no email provided, fetch from users collection
    let email = userEmail;
    if (!email) {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        email = userSnap.data().email;
      }
    }

    // Check if referral code already exists in alumniReferrals
    const collectionName = userRole === 'agen' ? 'agenReferrals' : 'alumniReferrals';
    const referralRef = doc(db, collectionName, userId);
    const referralSnap = await getDoc(referralRef);

    if (referralSnap.exists()) {
      const existingCode = referralSnap.data().referralCode;
      console.log('✅ [AUTO-REFERRAL] Referral already exists:', existingCode);
      
      // ✅ Ensure it also exists in referralCodes master collection
      const codeRef = doc(db, 'referralCodes', existingCode);
      const codeSnap = await getDoc(codeRef);
      
      if (!codeSnap.exists()) {
        // Create in master collection if missing (migration case)
        const commissionAmount = userRole === 'agen' ? 500000 : 200000;
        await setDoc(codeRef, {
          code: existingCode,
          ownerId: userId,
          ownerEmail: email || '',
          ownerName: displayName,
          ownerRole: userRole,
          commissionPerPaidUser: commissionAmount,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        console.log('✅ [AUTO-REFERRAL] Migrated existing code to master collection:', existingCode);
      }
      
      return true;
    }

    // Generate new referral code
    const referralCode = await generateUniqueReferralCode(displayName);
    const commissionAmount = userRole === 'agen' ? 500000 : 200000;
    
    console.log('🔧 [AUTO-REFERRAL] Creating NEW referral code...', {
      userId,
      userRole,
      displayName,
      email,
      referralCode,
      commissionAmount,
      collectionName
    });

    // ✅ SEQUENTIAL CREATION (avoid transaction permission issues)
    try {
      // 1. Create in referralCodes (MASTER) - docId = code itself
      const codeRef = doc(db, 'referralCodes', referralCode);
      await setDoc(codeRef, {
        code: referralCode,
        ownerId: userId,
        ownerEmail: email || '',
        ownerName: displayName,
        ownerRole: userRole,
        commissionPerPaidUser: commissionAmount,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      console.log('✅ [AUTO-REFERRAL] Step 1/2: Created in referralCodes collection');
      
      // 2. Create in role-specific collection (alumniReferrals OR agenReferrals)
      const roleRef = doc(db, collectionName, userId);
      await setDoc(roleRef, {
        alumniId: userId, // For backward compatibility with Alumni
        userId: userId, // For Agen
        referralCode: referralCode,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalReferrals: 0,
        successfulReferrals: 0,
        totalClicks: 0,
        totalConversions: 0,
        totalCommission: 0,
        pendingCommission: 0,
        paidCommission: 0,
        approvedCommission: 0,
      }, { merge: false }); // ✅ Explicit: Don't merge, create new document
      console.log(`✅ [AUTO-REFERRAL] Step 2/2: Created in ${collectionName} collection`);
      
    } catch (createError: any) {
      console.error('❌ [AUTO-REFERRAL] Error during document creation:', createError);
      console.error('❌ Error code:', createError.code);
      console.error('❌ Error message:', createError.message);
      
      // ✅ DETAILED ERROR LOGGING for debugging
      if (createError.code === 'permission-denied') {
        console.error('🚨 PERMISSION DENIED! Possible causes:');
        console.error('1. Firestore Rules not deployed to Firebase Console');
        console.error('2. User not properly authenticated');
        console.error('3. Auth token expired or invalid');
        console.error('Current user:', {
          uid: auth.currentUser?.uid,
          email: auth.currentUser?.email,
          emailVerified: auth.currentUser?.emailVerified,
        });
        console.error('Target document:', {
          collection: 'referralCodes',
          docId: referralCode,
          ownerId: userId,
        });
      }
      
      throw createError; // Re-throw to be caught by outer try-catch
    }
    
    console.log('✅ [AUTO-REFERRAL] Referral code created successfully in BOTH collections!');
    console.log(`✅ Collections: referralCodes + ${collectionName}`);
    console.log(
      `%c🎉 AUTO-REFERRAL CODE CREATED!\\n` +
      `User: ${displayName}\\n` +
      `Email: ${email || 'N/A'}\\n` +
      `Role: ${userRole}\\n` +
      `Code: ${referralCode}\\n` +
      `Commission: Rp${commissionAmount.toLocaleString('id-ID')}\\n` +
      `Ready for sharing!`,
      'color: blue; font-weight: bold; font-size: 14px; background: #e3f2fd; padding: 10px; border-radius: 5px;'
    );

    return true;
  } catch (error) {
    console.error('❌ [AUTO-REFERRAL] Error creating referral code:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId,
      userRole
    });
    return false;
  }
}

/**
 * Generate unique referral code with retry logic
 * Format: SULTANAH-{PREFIX}{RANDOM4DIGITS}
 * 
 * ✅ CONSISTENT FORMAT ACROSS ALL ROLES:
 * - Alumni: SULTANAH-ABD1234 (first 3 letters of name + 4 random digits)
 * - Agen: SULTANAH-AGE1234 (first 3 letters of name + 4 random digits)
 * 
 * ⚠️ IMPORTANT: All referral code generation MUST use this function
 * to ensure consistency and proper sync to master collection
 */
async function generateUniqueReferralCode(displayName: string, maxRetries: number = 5): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    const firstName = displayName?.split(' ')[0] || 'USER';
    const prefix = firstName.substring(0, 3).toUpperCase();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const code = `SULTANAH-${prefix}${randomNum}`;
    
    // Check if code already exists
    const codeRef = doc(db, 'referralCodes', code);
    const codeSnap = await getDoc(codeRef);
    
    if (!codeSnap.exists()) {
      return code; // Code is unique
    }
    
    console.log('⚠️ [AUTO-REFERRAL] Code collision, regenerating...', code);
  }
  
  // Fallback: use timestamp
  const timestamp = Date.now().toString().slice(-4);
  return `SULTANAH-USR${timestamp}`;
}