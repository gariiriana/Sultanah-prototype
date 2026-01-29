import { db } from '../config/firebase';
import { collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc, increment, runTransaction } from 'firebase/firestore';
import { REFERRAL_STATUS, getCommissionAmount } from '../constants/commissionRates'; // ✅ Import constants
import { createReferralUsedNotification, createPaymentApprovedNotification, createCommissionEarnedNotification } from './agentNotificationHelper'; // ✅ Import notification helper

interface ReferralProcessResult {
  success: boolean;
  error?: string;
  referrerId?: string;
  referrerName?: string;
  referrerRole?: string;
}

/**
 * 🔥 FIXED REFERRAL PROCESSOR - COMPLETE LIFECYCLE
 * Process referral code during user registration
 * 
 * ✅ CORRECT FLOW:
 * 1. Validate referral code in referralCodes collection (MASTER)
 * 2. IMMEDIATELY create referralTracking with status "registered"
 * 3. Alumni INSTANTLY sees new referral in dashboard
 * 4. Commission ONLY granted when payment approved by Admin
 * 
 * STATUS LIFECYCLE:
 * - registered: User signed up with referral code
 * - upgraded: User upgraded from Calon Jamaah to Jamaah
 * - approved: Payment approved by Admin → COMMISSION GRANTED
 */
export async function processReferralCode(
  referralCode: string,
  newUserId: string,
  newUserEmail: string,
  newUserName: string
): Promise<ReferralProcessResult> {
  try {
    console.log('🔍 [REFERRAL] Starting referral code processing...', {
      referralCode,
      newUserId,
      newUserEmail,
      newUserName
    });

    // 1. Validate referral code format
    if (!referralCode || referralCode.trim() === '') {
      console.log('❌ [REFERRAL] Kode referral kosong');
      return { success: false, error: 'Kode referral kosong' };
    }

    const cleanCode = referralCode.trim().toUpperCase();
    console.log('✅ [REFERRAL] Clean code:', cleanCode);

    // 2. ✅ Find referral code in MASTER collection (referralCodes)
    console.log('🔍 [REFERRAL] Searching in referralCodes master collection...');
    const codeRef = doc(db, 'referralCodes', cleanCode);
    const codeSnap = await getDoc(codeRef);

    console.log('📊 [REFERRAL] Master query result:', {
      exists: codeSnap.exists(),
      docId: cleanCode
    });

    // 🔥 FALLBACK: If not in master, try to find in alumniReferrals and auto-migrate
    if (!codeSnap.exists()) {
      console.log('⚠️ [REFERRAL] Code not in master collection, attempting auto-migration...');
      
      // Search in alumniReferrals collection
      const alumniQuery = query(
        collection(db, 'alumniReferrals'),
        where('referralCode', '==', cleanCode)
      );
      const alumniSnapshot = await getDocs(alumniQuery);
      
      if (!alumniSnapshot.empty) {
        const alumniDoc = alumniSnapshot.docs[0];
        const alumniData = alumniDoc.data();
        const ownerId = alumniDoc.id;
        
        console.log('✅ [REFERRAL] Found in alumniReferrals, migrating to master...');
        
        // Get user data for complete info
        const userDoc = await getDoc(doc(db, 'users', ownerId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const ownerRole = userData.role;
          const commissionAmount = getCommissionAmount(ownerRole);
          
          // Create in master collection
          await setDoc(doc(db, 'referralCodes', cleanCode), {
            code: cleanCode,
            ownerId: ownerId,
            ownerEmail: userData.email,
            ownerName: userData.displayName || userData.email,
            ownerRole: ownerRole,
            commissionPerPaidUser: commissionAmount,
            isActive: true,
            createdAt: alumniData.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          
          console.log('✅ [REFERRAL] Auto-migration successful! Code now in master collection.');
          
          // Now continue with normal flow - re-fetch from master
          const migratedCodeSnap = await getDoc(codeRef);
          if (migratedCodeSnap.exists()) {
            const migratedCodeData = migratedCodeSnap.data();
            const referrerId = migratedCodeData.ownerId;
            const referrerRole = migratedCodeData.ownerRole;
            const commissionAmount = migratedCodeData.commissionPerPaidUser;
            const isActive = migratedCodeData.isActive;
            
            console.log('✅ [REFERRAL] Using migrated code:', {
              code: cleanCode,
              ownerId: referrerId,
              ownerRole: referrerRole,
              commission: commissionAmount,
              isActive
            });
            
            // Continue with referral processing (skip to step 3)
            const referrerUserDoc = await getDoc(doc(db, 'users', referrerId));
            if (!referrerUserDoc.exists()) {
              console.log('❌ [REFERRAL] User referrer tidak ditemukan:', referrerId);
              return { success: false, error: 'Data referrer tidak ditemukan' };
            }

            const referrerData = referrerUserDoc.data();
            const referrerName = referrerData.displayName || referrerData.email;

            console.log('✅ [REFERRAL] Kode referral valid! Referrer:', {
              name: referrerName,
              role: referrerRole,
              email: referrerData.email
            });

            // Validate role
            if (referrerRole !== 'alumni' && referrerRole !== 'agen') {
              console.log('⚠️ [REFERRAL] Role tidak eligible untuk komisi:', referrerRole);
              return { success: false, error: 'Kode referral tidak valid untuk komisi' };
            }

            // Create tracking (jump to step 4)
            const trackingId = `${referrerId}_${newUserId}_${Date.now()}`;
            console.log('📝 [REFERRAL] Creating referral tracking record:', trackingId);
            
            const trackingData = {
              referralCode: cleanCode,
              referrerId: referrerId,
              referrerEmail: referrerData.email,
              referrerName: referrerName,
              referrerRole: referrerRole,
              referredUserId: newUserId,
              referredUserEmail: newUserEmail,
              referredUserName: newUserName,
              
              status: 'registered',
              hasUpgraded: false,
              hasPaid: false,
              paymentApproved: false,
              commissionGranted: false,
              
              commissionAmount: commissionAmount,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            
            await setDoc(doc(db, 'referralTracking', trackingId), trackingData);

            console.log('✅ [REFERRAL] Referral tracking created with COMPLETE structure:', trackingData);

            // Update stats - ✅ FIX: Dynamic collection
            const autoMigrationCollection = referrerRole === 'agen' ? 'agenReferrals' : 'alumniReferrals';
            const referralDocRef = doc(db, autoMigrationCollection, referrerId);
            console.log(`📝 [REFERRAL] Updating referrer stats in ${autoMigrationCollection} - incrementing totalReferrals...`);
            
            await updateDoc(referralDocRef, {
              totalReferrals: increment(1),
              updatedAt: new Date().toISOString(),
            });

            console.log('✅ [REFERRAL] Referrer stats updated - totalReferrals +1');
            console.log('🎉 [REFERRAL] ===== REFERRAL PROCESSING COMPLETE (AUTO-MIGRATED) =====');
            console.log(
              `%c✅ REFERRAL TRACKED (AUTO-MIGRATED)!\\n` +
              `Referrer: ${referrerName} (${referrerRole})\\n` +
              `New User: ${newUserName}\\n` +
              `Status: REGISTERED (Belum Bayar)\\n` +
              `Expected Commission: Rp${commissionAmount.toLocaleString('id-ID')}\\n` +
              `Alumni can see this referral IMMEDIATELY in dashboard!`,
              'color: green; font-weight: bold; font-size: 14px; background: #e8f5e9; padding: 10px; border-radius: 5px;'
            );

            return {
              success: true,
              referrerId,
              referrerName,
              referrerRole,
            };
          }
        }
      }
      
      // 🔥 FALLBACK LAYER 3: Search in users collection
      console.log('⚠️ [REFERRAL] Not found in alumniReferrals, trying users collection...');
      
      const usersQuery = query(
        collection(db, 'users'),
        where('referralCode', '==', cleanCode)
      );
      const usersSnapshot = await getDocs(usersQuery);
      
      if (!usersSnapshot.empty) {
        const userDoc = usersSnapshot.docs[0];
        const userData = userDoc.data();
        const ownerId = userDoc.id;
        const ownerRole = userData.role;
        
        console.log('✅ [REFERRAL] Found code owner in users collection:', {
          userId: ownerId,
          email: userData.email,
          role: ownerRole
        });
        
        // Validate role can have referral code
        if (ownerRole !== 'alumni' && ownerRole !== 'agen') {
          console.log('⚠️ [REFERRAL] User role not eligible for referral:', ownerRole);
          return { success: false, error: 'Kode referral tidak valid untuk komisi' };
        }
        
        const commissionAmount = getCommissionAmount(ownerRole);
        
        // AUTO-CREATE EVERYTHING: referralCodes + alumniReferrals
        console.log('🔧 [REFERRAL] Auto-creating referral system for user...');
        
        // 1. Create master referralCodes
        await setDoc(doc(db, 'referralCodes', cleanCode), {
          code: cleanCode,
          ownerId: ownerId,
          ownerEmail: userData.email,
          ownerName: userData.displayName || userData.email,
          ownerRole: ownerRole,
          commissionPerPaidUser: commissionAmount,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        
        console.log('✅ [REFERRAL] Created referralCodes master record');
        
        // 2. Create/Update role-specific collection - ✅ FIX: Dynamic collection
        const autoSetupCollection = ownerRole === 'agen' ? 'agenReferrals' : 'alumniReferrals';
        const roleRefDoc = doc(db, autoSetupCollection, ownerId);
        const existingRoleRef = await getDoc(roleRefDoc);
        
        if (!existingRoleRef.exists()) {
          await setDoc(roleRefDoc, {
            userId: ownerId,
            referralCode: cleanCode,
            totalReferrals: 0,
            successfulReferrals: 0,
            totalCommission: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          console.log(`✅ [REFERRAL] Created ${autoSetupCollection} record`);
        } else {
          console.log(`ℹ️ [REFERRAL] ${autoSetupCollection} already exists, skipping creation`);
        }
        
        // 3. Now continue with normal referral tracking flow
        const referrerName = userData.displayName || userData.email;
        
        console.log('✅ [REFERRAL] Auto-setup complete! Proceeding with referral tracking...');
        
        // Create tracking
        const trackingId = `${ownerId}_${newUserId}_${Date.now()}`;
        console.log('📝 [REFERRAL] Creating referral tracking record:', trackingId);
        
        const trackingData = {
          referralCode: cleanCode,
          referrerId: ownerId,
          referrerEmail: userData.email,
          referrerName: referrerName,
          referrerRole: ownerRole,
          referredUserId: newUserId,
          referredUserEmail: newUserEmail,
          referredUserName: newUserName,
          
          status: 'registered',
          hasUpgraded: false,
          hasPaid: false,
          paymentApproved: false,
          commissionGranted: false,
          
          commissionAmount: commissionAmount,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        await setDoc(doc(db, 'referralTracking', trackingId), trackingData);

        console.log('✅ [REFERRAL] Referral tracking created with COMPLETE structure:', trackingData);

        // Update stats - ✅ FIX: Dynamic collection
        const autoSetupStatsCollection = ownerRole === 'agen' ? 'agenReferrals' : 'alumniReferrals';
        const referralDocRef = doc(db, autoSetupStatsCollection, ownerId);
        console.log(`📝 [REFERRAL] Updating referrer stats in ${autoSetupStatsCollection} - incrementing totalReferrals...`);
        
        await updateDoc(referralDocRef, {
          totalReferrals: increment(1),
          updatedAt: new Date().toISOString(),
        });

        console.log('✅ [REFERRAL] Referrer stats updated - totalReferrals +1');
        console.log('🎉 [REFERRAL] ===== REFERRAL PROCESSING COMPLETE (AUTO-SETUP) =====');
        console.log(
          `%c✅ REFERRAL TRACKED (AUTO-SETUP)!\n` +
          `Referrer: ${referrerName} (${ownerRole})\n` +
          `New User: ${newUserName}\n` +
          `Status: REGISTERED (Belum Bayar)\n` +
          `Expected Commission: Rp${commissionAmount.toLocaleString('id-ID')}\n` +
          `Alumni can see this referral IMMEDIATELY in dashboard!`,
          'color: green; font-weight: bold; font-size: 14px; background: #e8f5e9; padding: 10px; border-radius: 5px;'
        );

        return {
          success: true,
          referrerId: ownerId,
          referrerName,
          referrerRole: ownerRole,
        };
      }
      
      // If still not found after ALL fallback attempts
      console.log('❌ [REFERRAL] Kode referral tidak ditemukan di semua collection:', cleanCode);
      console.log('💡 [REFERRAL] Possible reasons:');
      console.log('   1. Code does not exist (typo?)');
      console.log('   2. Code owner has not been created yet');
      console.log('   3. Invalid or expired code');
      console.log('   4. User needs to login first to auto-create referral code');
      console.log('📋 [REFERRAL] Searched in:');
      console.log('   - referralCodes (master): Not found');
      console.log('   - alumniReferrals (legacy): Not found');
      console.log('   - users.referralCode: Not found');
      console.log('');
      console.log('🔧 [REFERRAL] TROUBLESHOOTING STEPS:');
      console.log('   1. Pastikan Alumni/Agen sudah LOGIN minimal 1x (auto-create referral code)');
      console.log('   2. Pastikan kode tidak typo (case-insensitive)');
      console.log('   3. Verifikasi kode di Firebase Console:');
      console.log(`      - referralCodes/${cleanCode}`);
      console.log('   4. Jika masalah persists, contact admin untuk manual create');
      console.log('   5. Admin dapat gunakan: /manual-referral-code-creator.html');
      return { 
        success: false, 
        error: `Kode referral "${cleanCode}" tidak ditemukan. Kemungkinan:\n\n` +
               `1️⃣ Pemilik kode belum login ke system (minta mereka login dulu)\n` +
               `2️⃣ Kode salah/typo (cek ulang kode yang diberikan)\n` +
               `3️⃣ Kode belum dibuat di system (hubungi admin)\n\n` +
               `Jika yakin kode benar, hubungi admin untuk verifikasi.`
      };
    }

    // Get referral master data
    const codeData = codeSnap.data();
    const referrerId = codeData.ownerId;
    const referrerRole = codeData.ownerRole;
    const commissionAmount = codeData.commissionPerPaidUser;
    const isActive = codeData.isActive;

    console.log('✅ [REFERRAL] Found referral in master collection:', {
      code: cleanCode,
      ownerId: referrerId,
      ownerRole: referrerRole,
      commission: commissionAmount,
      isActive
    });

    // ✅ Validate if code is active
    if (!isActive) {
      console.log('⚠️ [REFERRAL] Kode referral tidak aktif:', cleanCode);
      return { success: false, error: 'Kode referral sudah tidak aktif' };
    }

    // 3. Get referrer profile info
    console.log('🔍 [REFERRAL] Fetching referrer user profile...');
    const referrerUserDoc = await getDoc(doc(db, 'users', referrerId));
    if (!referrerUserDoc.exists()) {
      console.log('❌ [REFERRAL] User referrer tidak ditemukan:', referrerId);
      return { success: false, error: 'Data referrer tidak ditemukan' };
    }

    const referrerData = referrerUserDoc.data();
    const referrerName = referrerData.displayName || referrerData.email;

    console.log('✅ [REFERRAL] Kode referral valid! Referrer:', {
      name: referrerName,
      role: referrerRole,
      email: referrerData.email
    });

    // ✅ Validate role - only Alumni & Agen can earn commission
    if (referrerRole !== 'alumni' && referrerRole !== 'agen') {
      console.log('⚠️ [REFERRAL] Role tidak eligible untuk komisi:', referrerRole);
      return { success: false, error: 'Kode referral tidak valid untuk komisi' };
    }

    // 4. 🔥 CREATE REFERRAL TRACKING IMMEDIATELY - NEW STRUCTURE
    const trackingId = `${referrerId}_${newUserId}_${Date.now()}`;
    console.log('📝 [REFERRAL] Creating referral tracking record:', trackingId);
    
    // ✅ CORRECT LIFECYCLE: Status "registered" with complete fields
    const trackingData = {
      referralCode: cleanCode,
      referrerId: referrerId,
      referrerEmail: referrerData.email,
      referrerName: referrerName,
      referrerRole: referrerRole,
      referredUserId: newUserId,
      referredUserEmail: newUserEmail,
      referredUserName: newUserName,
      
      // 🔥 LIFECYCLE STATUS - CLEAR & COMPLETE
      status: 'registered', // ✅ User baru register dengan kode referral
      hasUpgraded: false, // ✅ Belum upgrade dari Calon Jamaah ke Jamaah
      hasPaid: false, // ✅ Belum bayar
      paymentApproved: false, // ✅ Admin belum approve payment
      commissionGranted: false, // ✅ Komisi belum diberikan
      
      commissionAmount: commissionAmount, // Expected amount when paid
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await setDoc(doc(db, 'referralTracking', trackingId), trackingData);

    console.log('✅ [REFERRAL] Referral tracking created with COMPLETE structure:', trackingData);

    // 5. Update referrer's referral stats (increment totalReferrals only)
    // ✅ FIX: Dynamic collection based on referrer role (Alumni or Agen)
    const referralCollection = referrerRole === 'agen' ? 'agenReferrals' : 'alumniReferrals';
    const referralDocRef = doc(db, referralCollection, referrerId);
    console.log(`📝 [REFERRAL] Updating referrer stats in ${referralCollection} - incrementing totalReferrals...`);
    
    await updateDoc(referralDocRef, {
      totalReferrals: increment(1), // ✅ Total yang daftar (termasuk belum bayar)
      updatedAt: new Date().toISOString(),
    });

    console.log('✅ [REFERRAL] Referrer stats updated - totalReferrals +1');
    console.log('🎉 [REFERRAL] ===== REFERRAL PROCESSING COMPLETE =====');
    console.log(
      `%c✅ REFERRAL TRACKED!\\n` +
      `Referrer: ${referrerName} (${referrerRole})\\n` +
      `New User: ${newUserName}\\n` +
      `Status: REGISTERED (Belum Bayar)\\n` +
      `Expected Commission: Rp${commissionAmount.toLocaleString('id-ID')}\\n` +
      `Alumni can see this referral IMMEDIATELY in dashboard!`,
      'color: green; font-weight: bold; font-size: 14px; background: #e8f5e9; padding: 10px; border-radius: 5px;'
    );

    // ✅ Send notification to referrer (non-blocking - don't fail if this errors)
    try {
      if (referrerRole === 'agen') {
        await createReferralUsedNotification(referrerId, newUserId, newUserName, cleanCode);
      }
    } catch (notifError) {
      console.warn('⚠️ Failed to send referral notification (non-critical):', notifError);
    }

    return {
      success: true,
      referrerId,
      referrerName,
      referrerRole,
    };
  } catch (error) {
    console.error('❌ [REFERRAL] Error processing referral code:', error);
    console.error('❌ [REFERRAL] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return {
      success: false,
      error: 'Gagal memproses kode referral',
    };
  }
}

/**
 * 💰 COMMISSION PROCESSOR - FIXED & IMPROVED
 * Called when payment is approved by Admin
 * 
 * SOP Pencairan Komisi:
 * 1. Admin approve payment → Find referral tracking
 * 2. Update referralTracking: status = "paid", paid = true, commissionGranted = true
 * 3. Calculate commission: Alumni Rp200k, Agen Rp500k
 * 4. Update/Create referralBalances - add to balance
 * 5. Update alumniReferrals successfulReferrals counter
 */
export async function processReferralCommission(
  referredUserId: string,
  paymentId: string
): Promise<boolean> {
  try {
    console.log('💰 [COMMISSION] Starting commission processing...', {
      referredUserId,
      paymentId
    });

    // 1. Find referral tracking record for this user
    const trackingQuery = query(
      collection(db, 'referralTracking'),
      where('referredUserId', '==', referredUserId)
    );
    const trackingSnapshot = await getDocs(trackingQuery);

    if (trackingSnapshot.empty) {
      console.log('ℹ️ [COMMISSION] No referral found for user:', referredUserId);
      return false; // Not an error - user might not use referral code
    }

    const trackingDoc = trackingSnapshot.docs[0];
    const trackingData = trackingDoc.data();
    
    // ✅ FIXED: Check using new lifecycle fields
    if (trackingData.paymentApproved === true || trackingData.commissionGranted === true) {
      console.log('⚠️ [COMMISSION] Commission already granted, skipping...');
      return true;
    }

    const referrerId = trackingData.referrerId;
    const referrerRole = trackingData.referrerRole;

    console.log('✅ [COMMISSION] Found referral tracking:', {
      trackingId: trackingDoc.id,
      referrerId,
      referrerRole,
      currentStatus: trackingData.status,
      hasPaid: trackingData.hasPaid,
      paymentApproved: trackingData.paymentApproved
    });

    // 2. Calculate commission based on referrer role
    const commissionAmount = getCommissionAmount(referrerRole);
    
    if (commissionAmount === 0) {
      console.log('⚠️ [COMMISSION] No commission for role:', referrerRole);
      return false;
    }

    console.log('💰 [COMMISSION] Commission calculated:', {
      role: referrerRole,
      amount: commissionAmount,
      formatted: new Intl.NumberFormat('id-ID', { 
        style: 'currency', 
        currency: 'IDR' 
      }).format(commissionAmount)
    });

    // 3. Use transaction to ensure atomicity
    await runTransaction(db, async (transaction) => {
      // ✅ CRITICAL: ALL READS MUST HAPPEN FIRST (before any writes)
      const balanceRef = doc(db, 'referralBalances', referrerId);
      const balanceDoc = await transaction.get(balanceRef);
      
      // ✅ READ referral doc to check if approvedCommission field exists
      const commissionCollection = referrerRole === 'agen' ? 'agenReferrals' : 'alumniReferrals';
      const referralDocRef = doc(db, commissionCollection, referrerId);
      const referralDocSnap = await transaction.get(referralDocRef);
      
      // ✅ NOW DO ALL WRITES (after all reads are complete)
      
      // 1. UPDATE REFERRAL TRACKING - COMPLETE LIFECYCLE
      const trackingRef = doc(db, 'referralTracking', trackingDoc.id);
      transaction.update(trackingRef, {
        status: 'approved', // ✅ FINAL STATUS: approved
        hasPaid: true, // ✅ User sudah bayar
        paymentApproved: true, // ✅ Admin sudah approve payment
        commissionGranted: true, // ✅ Komisi sudah diberikan
        paidAt: new Date().toISOString(),
        paymentId: paymentId,
        updatedAt: new Date().toISOString(),
      });

      // 2. Update/Create referralBalances - Add commission to balance
      if (balanceDoc.exists()) {
        // Increment existing balance
        transaction.update(balanceRef, {
          balance: increment(commissionAmount),
          updatedAt: new Date().toISOString(),
        });
        console.log('✅ [COMMISSION] Updated existing balance +', commissionAmount);
      } else {
        // Create new balance record
        transaction.set(balanceRef, {
          userId: referrerId,
          role: referrerRole,
          balance: commissionAmount,
          totalEarned: commissionAmount,
          totalWithdrawn: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        console.log('✅ [COMMISSION] Created new balance:', commissionAmount);
      }

      // 3. CRITICAL FIX: Also update users.commissionBalance for dashboard display
      const userRef = doc(db, 'users', referrerId);
      transaction.update(userRef, {
        commissionBalance: increment(commissionAmount),
        updatedAt: new Date().toISOString(),
      });
      console.log('✅ [COMMISSION] Updated users.commissionBalance +', commissionAmount);

      // 4. Update referrer's role-specific referral collection - ✅ HANDLE MISSING FIELD
      if (referralDocSnap.exists()) {
        const data = referralDocSnap.data();
        const currentApproved = data.approvedCommission || 0;
        const newApproved = currentApproved + commissionAmount;
        
        console.log('💰 [COMMISSION] Updating commission fields:', {
          currentApproved,
          adding: commissionAmount,
          newApproved
        });
        
        transaction.update(referralDocRef, {
          successfulReferrals: increment(1), // ✅ Jumlah referral yang sudah bayar & approved
          totalCommission: increment(commissionAmount), // ✅ Total komisi (for legacy compatibility)
          approvedCommission: newApproved, // ✅ FIXED: Set exact value instead of increment!
          withdrawnCommission: data.withdrawnCommission || 0, // ✅ Initialize if missing
          updatedAt: new Date().toISOString(),
        });
        console.log(`✅ [COMMISSION] Updated ${commissionCollection} stats - successfulReferrals +1, totalCommission +${commissionAmount}, approvedCommission = ${newApproved}`);
      } else {
        console.error('❌ [COMMISSION] Referral document not found!');
        throw new Error('Referral document not found');
      }
    });

    console.log('✅ [COMMISSION] Transaction completed successfully');
    console.log('🎉 [COMMISSION] ===== COMMISSION PROCESSING COMPLETE =====');
    console.log(
      `%c💰 COMMISSION ACTIVATED!\\n` +
      `Referrer: ${trackingData.referrerName} (${referrerRole})\\n` +
      `Amount: Rp${commissionAmount.toLocaleString('id-ID')}\\n` +
      `Jamaah: ${trackingData.referredUserName}\\n` +
      `Status: Available for withdrawal`,
      'color: green; font-weight: bold; font-size: 14px; background: #e8f5e9; padding: 10px; border-radius: 5px;'
    );

    // ✅ Send notifications to referrer (non-blocking - don't fail if this errors)
    try {
      if (referrerRole === 'agen') {
        await createPaymentApprovedNotification(referrerId, trackingData.referredUserName, 'Paket Umroh', commissionAmount);
        await createCommissionEarnedNotification(referrerId, trackingData.referredUserName, commissionAmount);
      }
    } catch (notifError) {
      console.warn('⚠️ Failed to send commission notifications (non-critical):', notifError);
    }

    return true;
  } catch (error) {
    console.error('❌ [COMMISSION] Error processing commission:', error);
    console.error('❌ [COMMISSION] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return false;
  }
}

/**
 * 💸 WITHDRAWAL PROCESSOR - CREATE PENDING REQUEST
 * Process commission withdrawal request
 * - Validates withdrawal amount <= balance
 * - Creates withdrawal request with status 'pending'
 * - Balance TIDAK dikurangi saat pending
 * - Balance BARU dikurangi saat admin APPROVE
 * - If rejected, balance tetap utuh (tidak perlu refund)
 */
export async function processWithdrawalRequest(
  userId: string,
  amount: number,
  bankName: string,
  accountNumber: string,
  accountName: string
): Promise<{ success: boolean; error?: string; withdrawalId?: string }> {
  try {
    console.log('💸 [WITHDRAWAL] Processing withdrawal request...', {
      userId,
      amount,
      bankName,
      accountNumber: accountNumber.replace(/.(?=.{4})/g, '*'), // Mask account number
    });

    // 1. Validate amount
    if (amount <= 0) {
      return { success: false, error: 'Jumlah penarikan harus lebih dari 0' };
    }

    // Minimum withdrawal Rp50.000
    if (amount < 50000) {
      return { success: false, error: 'Minimum penarikan Rp50.000' };
    }

    // 2. Check if balance is sufficient (validation only, no deduction yet!)
    const balanceRef = doc(db, 'referralBalances', userId);
    const balanceDoc = await getDoc(balanceRef);

    if (!balanceDoc.exists()) {
      return { success: false, error: 'Saldo tidak ditemukan' };
    }

    const currentBalance = balanceDoc.data().balance || 0;

    // Validate sufficient balance
    if (amount > currentBalance) {
      return { 
        success: false, 
        error: `Saldo tidak cukup. Saldo Anda: Rp${currentBalance.toLocaleString('id-ID')}` 
      };
    }

    // 3. Create withdrawal request with status 'pending'
    // ✅ IMPORTANT: Balance is NOT deducted here!
    // ✅ Balance will be deducted only when admin APPROVES the withdrawal
    const withdrawalRef = doc(collection(db, 'commissionWithdrawals'));
    const withdrawalId = withdrawalRef.id;

    const userData = balanceDoc.data();
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userProfile = userDoc.exists() ? userDoc.data() : null;
    
    await setDoc(withdrawalRef, {
      userId: userId,
      userName: userProfile?.displayName || userProfile?.email || 'Unknown',
      userEmail: userProfile?.email || '',
      userType: userData.role || 'alumni',
      amount: amount,
      // Bank info
      bankName: bankName,
      accountNumber: accountNumber,
      accountName: accountName,
      // Status
      status: 'pending', // ✅ Pending - waiting for admin approval
      requestDate: new Date(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    console.log('✅ [WITHDRAWAL] Withdrawal request created (balance NOT deducted yet):', {
      withdrawalId,
      amount,
      currentBalance, // Balance tetap sama
      status: 'pending'
    });

    return {
      success: true,
      withdrawalId
    };
  } catch (error) {
    console.error('❌ [WITHDRAWAL] Error processing withdrawal:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gagal memproses penarikan'
    };
  }
}

/**
 * 🔄 REFUND WITHDRAWAL - Called when admin rejects withdrawal
 * Refunds the withdrawal amount back to user's balance
 */
export async function refundWithdrawal(
  withdrawalId: string,
  userId: string,
  amount: number
): Promise<boolean> {
  try {
    console.log('🔄 [REFUND] Processing withdrawal refund...', {
      withdrawalId,
      userId,
      amount
    });

    await runTransaction(db, async (transaction) => {
      // Add amount back to balance
      const balanceRef = doc(db, 'referralBalances', userId);
      transaction.update(balanceRef, {
        balance: increment(amount), // ✅ Return money
        updatedAt: new Date().toISOString(),
      });

      // Update withdrawal status to rejected
      const withdrawalRef = doc(db, 'commissionWithdrawals', withdrawalId);
      transaction.update(withdrawalRef, {
        status: 'rejected',
        rejectedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });

    console.log('✅ [REFUND] Withdrawal refunded successfully');
    return true;
  } catch (error) {
    console.error('❌ [REFUND] Error refunding withdrawal:', error);
    return false;
  }
}

/**
 * 📈 UPDATE REFERRAL ON ROLE UPGRADE
 * Called when user upgrades from Calon Jamaah to Jamaah
 * Updates referral tracking status from "registered" to "upgraded"
 * 
 * @param userId - User ID who is upgrading
 * @returns true if successful, false if error or no referral
 */
export async function updateReferralOnUpgrade(userId: string): Promise<boolean> {
  try {
    console.log('📈 [UPGRADE] Updating referral tracking for user upgrade...', { userId });

    // Find referral tracking for this user
    const trackingQuery = query(
      collection(db, 'referralTracking'),
      where('referredUserId', '==', userId)
    );
    const trackingSnapshot = await getDocs(trackingQuery);

    if (trackingSnapshot.empty) {
      console.log('ℹ️ [UPGRADE] No referral found for user:', userId);
      return false; // Not an error - user might not use referral code
    }

    const trackingDoc = trackingSnapshot.docs[0];
    const trackingData = trackingDoc.data();

    // Update to "upgraded" status
    await updateDoc(doc(db, 'referralTracking', trackingDoc.id), {
      status: 'upgraded',
      hasUpgraded: true,
      upgradedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    console.log('✅ [UPGRADE] Referral tracking updated:', {
      trackingId: trackingDoc.id,
      referredUser: trackingData.referredUserName,
      referrer: trackingData.referrerName,
      previousStatus: trackingData.status,
      newStatus: 'upgraded'
    });

    console.log(
      `%c📈 REFERRAL UPGRADED!\\n` +
      `User: ${trackingData.referredUserName}\\n` +
      `Referrer: ${trackingData.referrerName}\\n` +
      `Status: Calon Jamaah → Jamaah\\n` +
      `Next: Waiting for payment approval`,
      'color: blue; font-weight: bold; font-size: 14px; background: #e3f2fd; padding: 10px; border-radius: 5px;'
    );

    return true;
  } catch (error) {
    console.error('❌ [UPGRADE] Error updating referral on upgrade:', error);
    return false;
  }
}