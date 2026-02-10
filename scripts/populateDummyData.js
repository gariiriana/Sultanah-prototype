// Script to populate dummy data for Owner Dashboard
// This creates realistic data for mutawwif, tour-leader, influencer, affiliator, and brand_ambassador

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, setDoc, doc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

// Firebase config (same as your main config)
const firebaseConfig = {
    apiKey: "AIzaSyBm80jrty9X28t90CsuJmwIwSKju2WStyc",
    authDomain: "sultanah-travel-6a382.firebaseapp.com",
    projectId: "sultanah-travel-6a382",
    storageBucket: "sultanah-travel-6a382.firebasestorage.app",
    messagingSenderId: "696046595036",
    appId: "1:696046595036:web:394daa46627958b1487d19"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Helper function to generate random date in the past 6 months
function randomDate() {
    const start = new Date();
    start.setMonth(start.getMonth() - 6);
    const end = new Date();
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Helper function to generate random referral code
function generateReferralCode(name) {
    return name.substring(0, 3).toUpperCase() + Math.floor(Math.random() * 10000);
}

async function populateDummyData() {
    console.log('🚀 Starting dummy data population...');

    try {
        // ============================================================
        // 1. CREATE DUMMY USERS
        // ============================================================

        const dummyUsers = [
            // MUTAWWIF
            {
                email: 'mutawwif1@sultanah.com',
                password: 'Mutawwif123!',
                profile: {
                    displayName: 'Ahmad Al-Mutawwif',
                    phoneNumber: '081234567890',
                    role: 'mutawwif',
                    approvalStatus: 'approved',
                    createdAt: randomDate().toISOString(),
                }
            },
            {
                email: 'mutawwif2@sultanah.com',
                password: 'Mutawwif123!',
                profile: {
                    displayName: 'Muhammad Hadi',
                    phoneNumber: '081234567891',
                    role: 'mutawwif',
                    approvalStatus: 'approved',
                    createdAt: randomDate().toISOString(),
                }
            },

            // TOUR LEADER
            {
                email: 'tourleader1@sultanah.com',
                password: 'TourLeader123!',
                profile: {
                    displayName: 'Fatimah Tour Leader',
                    phoneNumber: '081234567892',
                    role: 'tour-leader',
                    approvalStatus: 'approved',
                    createdAt: randomDate().toISOString(),
                }
            },
            {
                email: 'tourleader2@sultanah.com',
                password: 'TourLeader123!',
                profile: {
                    displayName: 'Zahra Tour Leader',
                    phoneNumber: '081234567893',
                    role: 'tour-leader',
                    approvalStatus: 'approved',
                    createdAt: randomDate().toISOString(),
                }
            },

            // INFLUENCER
            {
                email: 'influencer1@sultanah.com',
                password: 'Influencer123!',
                profile: {
                    displayName: 'Sarah Influencer',
                    phoneNumber: '081234567894',
                    role: 'influencer',
                    approvalStatus: 'approved',
                    createdAt: randomDate().toISOString(),
                }
            },

            // AFFILIATOR
            {
                email: 'affiliator1@sultanah.com',
                password: 'Affiliator123!',
                profile: {
                    displayName: 'Budi Affiliator',
                    phoneNumber: '081234567895',
                    role: 'affiliator',
                    approvalStatus: 'approved',
                    createdAt: randomDate().toISOString(),
                }
            },

            // BRAND AMBASSADOR
            {
                email: 'ba1@sultanah.com',
                password: 'BrandAmbassador123!',
                profile: {
                    displayName: 'Rina Brand Ambassador',
                    phoneNumber: '081234567896',
                    role: 'brand_ambassador',
                    approvalStatus: 'approved',
                    createdAt: randomDate().toISOString(),
                }
            },
        ];

        console.log('📝 Creating users...');
        const createdUsers = [];

        for (const user of dummyUsers) {
            try {
                // Try to create auth user
                const userCredential = await createUserWithEmailAndPassword(auth, user.email, user.password);
                const uid = userCredential.user.uid;

                // Create Firestore profile
                await setDoc(doc(db, 'users', uid), {
                    uid,
                    email: user.email,
                    ...user.profile,
                });

                createdUsers.push({ uid, ...user });
                console.log(`✅ Created user: ${user.profile.displayName} (${user.profile.role})`);
            } catch (error) {
                if (error.code === 'auth/email-already-in-use') {
                    console.log(`⚠️ User already exists: ${user.email}`);

                    // ✅ FIXED: Fetch the existing user from Firestore
                    try {
                        const { getDocs, query, collection, where } = await import('firebase/firestore');
                        const usersQuery = query(collection(db, 'users'), where('email', '==', user.email));
                        const usersSnapshot = await getDocs(usersQuery);

                        if (!usersSnapshot.empty) {
                            const existingUser = usersSnapshot.docs[0];
                            const uid = existingUser.id;
                            createdUsers.push({ uid, ...user });
                            console.log(`✅ Loaded existing user: ${user.profile.displayName} (${user.profile.role})`);
                        }
                    } catch (fetchError) {
                        console.error(`❌ Error fetching existing user ${user.email}:`, fetchError.message);
                    }
                } else {
                    console.error(`❌ Error creating user ${user.email}:`, error.message);
                }
            }
        }

        // ============================================================
        // 2. CREATE DUMMY BOOKINGS
        // ============================================================

        console.log('\n📝 Creating bookings...');

        const mutawwifUsers = createdUsers.filter(u => u.profile.role === 'mutawwif');
        const tourLeaderUsers = createdUsers.filter(u => u.profile.role === 'tour-leader');
        const influencerUser = createdUsers.find(u => u.profile.role === 'influencer');
        const affiliatorUser = createdUsers.find(u => u.profile.role === 'affiliator');
        const baUser = createdUsers.find(u => u.profile.role === 'brand_ambassador');

        // Create bookings for Mutawwif (3 groups each)
        for (const mutawwif of mutawwifUsers) {
            for (let i = 0; i < 3; i++) {
                const bookingId = `BOOK-MUT-${mutawwif.uid.substring(0, 6)}-${i + 1}`;
                const paxCount = Math.floor(Math.random() * 20) + 10; // 10-30 jamaah per group

                await setDoc(doc(db, 'bookings', bookingId), {
                    id: bookingId,
                    userId: `dummy-user-${i}`,
                    packageId: 'pkg-umroh-gold',
                    packageName: 'Umroh Gold Package',
                    packagePrice: 25000000,
                    paxCount: paxCount,
                    totalAmount: 25000000 * paxCount,
                    status: 'completed',
                    mutawwifId: mutawwif.uid,
                    mutawwifName: mutawwif.profile.displayName,
                    jamaah: Array.from({ length: paxCount }, (_, idx) => ({
                        name: `Jamaah ${idx + 1}`,
                        email: `jamaah${idx}@example.com`,
                        phone: `08123456${String(idx).padStart(4, '0')}`,
                        documentsUploaded: true
                    })),
                    createdAt: randomDate(),
                    midtransOrderId: `MDT-${bookingId}`,
                    midtransData: { payment_type: 'bank_transfer' },
                });

                console.log(`✅ Created booking for Mutawwif ${mutawwif.profile.displayName}: ${paxCount} jamaah`);
            }
        }

        // Create bookings for Tour Leader (4 groups each)
        for (const tourLeader of tourLeaderUsers) {
            for (let i = 0; i < 4; i++) {
                const bookingId = `BOOK-TL-${tourLeader.uid.substring(0, 6)}-${i + 1}`;
                const paxCount = Math.floor(Math.random() * 25) + 15; // 15-40 jamaah per group

                await setDoc(doc(db, 'bookings', bookingId), {
                    id: bookingId,
                    userId: `dummy-user-tl-${i}`,
                    packageId: 'pkg-umroh-platinum',
                    packageName: 'Umroh Platinum Package',
                    packagePrice: 35000000,
                    paxCount: paxCount,
                    totalAmount: 35000000 * paxCount,
                    status: 'completed',
                    tourLeaderId: tourLeader.uid,
                    tourLeaderName: tourLeader.profile.displayName,
                    jamaah: Array.from({ length: paxCount }, (_, idx) => ({
                        name: `Jamaah TL ${idx + 1}`,
                        email: `jamaah-tl${idx}@example.com`,
                        phone: `08123457${String(idx).padStart(4, '0')}`,
                        documentsUploaded: true
                    })),
                    createdAt: randomDate(),
                    midtransOrderId: `MDT-${bookingId}`,
                    midtransData: { payment_type: 'bank_transfer' },
                });

                console.log(`✅ Created booking for Tour Leader ${tourLeader.profile.displayName}: ${paxCount} jamaah`);
            }
        }

        // ============================================================
        // 2.5. CREATE PERSONAL BOOKINGS FOR INFLUENCER, AFFILIATOR, BA
        // ============================================================

        console.log('\n📝 Creating personal bookings for marketing roles...');

        const marketingUsers = [
            { user: influencerUser, bookingCount: 2 },
            { user: affiliatorUser, bookingCount: 2 },
            { user: baUser, bookingCount: 3 },
        ];

        for (const { user, bookingCount } of marketingUsers) {
            if (!user) continue;

            for (let i = 0; i < bookingCount; i++) {
                const bookingId = `BOOK-USER-${user.uid.substring(0, 6)}-${i + 1}`;
                const packageType = i % 2 === 0 ? 'gold' : 'platinum';
                const packagePrice = packageType === 'gold' ? 25000000 : 35000000;
                const paxCount = Math.floor(Math.random() * 3) + 1; // 1-3 pax per booking
                const statuses = ['completed', 'completed', 'pending'];
                const status = statuses[i] || 'completed';

                await setDoc(doc(db, 'bookings', bookingId), {
                    id: bookingId,
                    userId: user.uid,
                    userEmail: user.email,
                    userName: user.profile.displayName,
                    packageId: `pkg-umroh-${packageType}`,
                    packageName: `Umroh ${packageType.charAt(0).toUpperCase() + packageType.slice(1)} Package`,
                    packagePrice: packagePrice,
                    paxCount: paxCount,
                    totalAmount: packagePrice * paxCount,
                    status: status,
                    jamaah: Array.from({ length: paxCount }, (_, idx) => ({
                        name: idx === 0 ? user.profile.displayName : `${user.profile.displayName} +${idx}`,
                        email: user.email,
                        phone: user.profile.phoneNumber || '081234567890',
                        documentsUploaded: status === 'completed',
                    })),
                    createdAt: randomDate(),
                    midtransOrderId: `MDT-${bookingId}`,
                    midtransData: { payment_type: 'bank_transfer' },
                });

                console.log(`✅ Created personal booking for ${user.profile.displayName}: ${paxCount} pax (${status})`);

                // ✅ CREATE PAYMENT RECORD for completed bookings (so totalSpent shows correctly)
                if (status === 'completed') {
                    const paymentId = `PAY-${bookingId}`;
                    await setDoc(doc(db, 'payments', paymentId), {
                        id: paymentId,
                        bookingId: bookingId,
                        userId: user.uid,
                        userEmail: user.email,
                        userName: user.profile.displayName,
                        amount: packagePrice * paxCount,
                        paymentType: 'full',
                        status: 'approved',
                        proofUrl: 'https://example.com/dummy-proof.jpg',
                        approvedAt: randomDate(),
                        approvedBy: 'admin',
                        createdAt: randomDate(),
                        updatedAt: randomDate(),
                    });
                    console.log(`    💰 Created payment for ${user.profile.displayName}: Rp ${(packagePrice * paxCount).toLocaleString('id-ID')}`);
                }
            }
        }

        // ============================================================
        // 3. CREATE REFERRAL DATA FOR INFLUENCER, AFFILIATOR, BA
        // ============================================================

        console.log('\n📝 Creating referral data...');

        const referralUsers = [
            { user: influencerUser, referralCount: 8, commissionRate: 0.05 },
            { user: affiliatorUser, referralCount: 12, commissionRate: 0.06 },
            { user: baUser, referralCount: 15, commissionRate: 0.07 },
        ];

        for (const { user, referralCount, commissionRate } of referralUsers) {
            if (!user) continue;

            const referralCode = generateReferralCode(user.profile.displayName);

            // Update user with referral code
            await setDoc(doc(db, 'users', user.uid), {
                referralCode: referralCode,
            }, { merge: true });

            // Create referral tracking document
            const totalCommissionEarned = referralCount * 25000000 * commissionRate;
            const pendingCommission = Math.floor(totalCommissionEarned * 0.3); // 30% pending

            await setDoc(doc(db, 'referralTracking', user.uid), {
                userId: user.uid,
                referralCode: referralCode,
                totalReferrals: referralCount,
                successfulReferrals: referralCount,
                totalCommissionEarned: totalCommissionEarned,
                pendingCommission: pendingCommission,
                withdrawnCommission: totalCommissionEarned - pendingCommission,
                lastUpdated: new Date().toISOString(),
            });

            // Create dummy bookings with referral codes
            for (let i = 0; i < referralCount; i++) {
                const bookingId = `BOOK-REF-${user.uid.substring(0, 6)}-${i + 1}`;
                const paxCount = Math.floor(Math.random() * 3) + 1; // 1-4 pax
                const packagePrice = 25000000;
                const totalAmount = packagePrice * paxCount;
                const commission = totalAmount * commissionRate;

                await setDoc(doc(db, 'bookings', bookingId), {
                    id: bookingId,
                    userId: `referred-user-${i}`,
                    packageId: 'pkg-umroh-silver',
                    packageName: 'Umroh Silver Package',
                    packagePrice: packagePrice,
                    paxCount: paxCount,
                    totalAmount: totalAmount,
                    status: i < referralCount * 0.7 ? 'completed' : 'pending_payment',
                    referralCode: referralCode,
                    referrerId: user.uid,
                    referrerName: user.profile.displayName,
                    commissionAmount: commission,
                    commissionPaid: i < referralCount * 0.7,
                    jamaah: Array.from({ length: paxCount }, (_, idx) => ({
                        name: `Referral Jamaah ${idx + 1}`,
                        email: `ref-jamaah${i}-${idx}@example.com`,
                        phone: `08123458${String(i * 10 + idx).padStart(4, '0')}`,
                        documentsUploaded: true
                    })),
                    createdAt: randomDate(),
                    midtransOrderId: `MDT-${bookingId}`,
                    midtransData: { payment_type: 'bank_transfer' },
                });
            }

            console.log(`✅ Created referral data for ${user.profile.displayName}: ${referralCount} referrals, ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalCommissionEarned)} commission`);
        }

        // ============================================================
        // 4. CREATE MARKETPLACE ORDERS
        // ============================================================

        console.log('\n📝 Creating marketplace orders...');

        const marketplaceOrders = [
            {
                id: 'dummy-mp-1',
                orderNumber: 'ORD-MP-20240201-001',
                userName: 'Hendra Setiawan',
                userEmail: 'hendra.s@example.com',
                totalAmount: 1150000,
                status: 'paid',
                createdAt: new Date('2024-02-01T10:30:00').toISOString(),
            },
            {
                id: 'dummy-mp-2',
                orderNumber: 'ORD-MP-20240202-045',
                userName: 'Siti Aminah',
                userEmail: 'siti.aminah@example.com',
                totalAmount: 1500000,
                status: 'pending',
                createdAt: new Date('2024-02-02T14:15:00').toISOString(),
            },
            {
                id: 'dummy-mp-3',
                orderNumber: 'ORD-MP-20240128-099',
                userName: 'Budi Santoso',
                userEmail: 'budi.santoso88@gmail.com',
                totalAmount: 750000,
                status: 'paid',
                createdAt: new Date('2024-01-28T09:00:00').toISOString(),
            },
            {
                id: 'dummy-mp-5',
                orderNumber: 'ORD-MP-20240203-007',
                userName: 'Umar Bakri',
                userEmail: 'umar.bakri@example.com',
                totalAmount: 800000,
                status: 'paid',
                createdAt: new Date('2024-02-03T11:20:00').toISOString(),
            }
        ];

        for (const order of marketplaceOrders) {
            await setDoc(doc(db, 'marketplaceOrders', order.id), {
                ...order,
                items: [
                    { itemName: 'Dummy Item', price: order.totalAmount, quantity: 1, subtotal: order.totalAmount }
                ],
                updatedAt: new Date().toISOString()
            });
            console.log(`✅ Created marketplace order: ${order.orderNumber} (Rp ${order.totalAmount.toLocaleString('id-ID')})`);
        }

        console.log('\n🎉 Dummy data population completed successfully!');
        console.log('\n📊 Summary:');
        console.log(`- ${mutawwifUsers.length} Mutawwif users with ${mutawwifUsers.length * 3} groups`);
        console.log(`- ${tourLeaderUsers.length} Tour Leader users with ${tourLeaderUsers.length * 4} groups`);
        console.log(`- ${referralUsers.length} users with referral data (Influencer, Affiliator, BA)`);
        console.log(`- ${marketplaceOrders.length} Marketplace orders`);
        console.log('\n✅ All data is now visible in Owner Dashboard and Admin Panel!');

    } catch (error) {
        console.error('❌ Error populating dummy data:', error);
    }
}

// Run the script
populateDummyData().then(() => {
    console.log('\n✅ Script execution completed. You can now check the Owner Dashboard.');
    process.exit(0);
}).catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
});
