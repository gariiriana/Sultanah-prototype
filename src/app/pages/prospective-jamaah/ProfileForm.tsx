import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { db, auth } from '../../../config/firebase';
import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { toast } from 'sonner';
import {
  User,
  Phone,
  FileText,
  Upload,
  X,
  Check,
  Home,
  Shield,
  AlertCircle,
  LogOut
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { compressImage } from '../../../utils/fileCompression';
import AgentUpgradeDialog from '../../components/AgentUpgradeDialog';
import { autoCreateReferralCode } from '../../../utils/autoCreateReferralCode';

interface ProfileFormProps {
  userProfile: any;
  currentUser: any;
  onBack: () => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ userProfile, currentUser, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [profileCompletion, setProfileCompletion] = useState(0);

  // List of all countries A-Z
  const countries = [
    "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina",
    "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados",
    "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana",
    "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cambodia", "Cameroon", "Canada",
    "Cape Verde", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros",
    "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti",
    "Dominica", "Dominican Republic", "East Timor", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea",
    "Eritrea", "Estonia", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia",
    "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
    "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland",
    "Israel", "Italy", "Ivory Coast", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati",
    "Kosovo", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya",
    "Liechtenstein", "Lithuania", "Luxembourg", "Macedonia", "Madagascar", "Malawi", "Malaysia",
    "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia",
    "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia",
    "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea",
    "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay",
    "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda",
    "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino",
    "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone",
    "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea",
    "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Swaziland", "Sweden", "Switzerland",
    "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Togo", "Tonga", "Trinidad and Tobago",
    "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates",
    "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela",
    "Vietnam", "Yemen", "Zambia", "Zimbabwe"
  ];

  // Personal Information
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [phoneNumber, setPhoneNumber] = useState(userProfile?.phoneNumber || '');
  const [fullName, setFullName] = useState(userProfile?.identityInfo?.fullName || '');
  const [idNumber, setIdNumber] = useState(userProfile?.identityInfo?.idNumber || '');
  const [birthDate, setBirthDate] = useState(userProfile?.identityInfo?.birthDate || '');
  const [country, setCountry] = useState(userProfile?.identityInfo?.country || '');
  const [state, setState] = useState(userProfile?.identityInfo?.state || '');
  const [city, setCity] = useState(userProfile?.identityInfo?.city || '');
  const [postalCode, setPostalCode] = useState(userProfile?.identityInfo?.postalCode || '');
  const [streetAddress, setStreetAddress] = useState(userProfile?.identityInfo?.streetAddress || '');

  // Documents
  const [passportNumber, setPassportNumber] = useState(userProfile?.travelDocuments?.passportNumber || '');
  const [passportExpiry, setPassportExpiry] = useState(userProfile?.travelDocuments?.passportExpiry || '');
  const [passportPhoto, setPassportPhoto] = useState(userProfile?.travelDocuments?.passportPhoto || '');
  const [ktpPhoto, setKtpPhoto] = useState(userProfile?.travelDocuments?.ktpPhoto || '');
  const [kkDocument, setKkDocument] = useState(userProfile?.travelDocuments?.kkPhoto || '');
  const [birthCertificate, setBirthCertificate] = useState(userProfile?.travelDocuments?.birthCertificate || '');
  const [marriageCertificate, setMarriageCertificate] = useState(userProfile?.travelDocuments?.marriageCertificate || '');
  const [visaDocument, setVisaDocument] = useState(userProfile?.travelDocuments?.visaDocument || '');
  const [flightTicket, setFlightTicket] = useState(userProfile?.travelDocuments?.flightTicket || '');
  const [vaccinationCertificate, setVaccinationCertificate] = useState(userProfile?.travelDocuments?.vaccinationCertificate || '');

  // Emergency Contact
  const [emergencyName, setEmergencyName] = useState(userProfile?.emergencyContact?.name || '');
  const [emergencyPhone, setEmergencyPhone] = useState(userProfile?.emergencyContact?.phone || '');
  const [emergencyRelationship, setEmergencyRelationship] = useState(userProfile?.emergencyContact?.relationship || '');

  // Logout confirmation dialog
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // ✅ NEW: Agent upgrade dialog (for alumni only)
  const [showAgentUpgradeDialog, setShowAgentUpgradeDialog] = useState(false);

  // ✅ CRITICAL FIX: Fetch documents from userDocuments collection with AUTO-MIGRATION
  useEffect(() => {
    let isMounted = true; // Prevent state updates after unmount

    const fetchUserDocuments = async () => {
      console.log('🚀 [ProfileForm] useEffect TRIGGERED');

      if (!currentUser?.uid) {
        console.log('⚠️ [ProfileForm] No currentUser.uid, skipping document fetch');
        return;
      }

      console.log('🔍 [ProfileForm] Fetching documents for user:', currentUser.uid);
      console.log('🔍 [ProfileForm] Current user role:', currentUser.role);

      try {
        const userDocsRef = doc(db, 'userDocuments', currentUser.uid);
        console.log('📍 [ProfileForm] Fetching from path:', `userDocuments/${currentUser.uid}`);

        const userDocsSnap = await getDoc(userDocsRef);
        console.log('📦 [ProfileForm] Snapshot exists:', userDocsSnap.exists());

        if (!isMounted) {
          console.log('⚠️ [ProfileForm] Component unmounted, skipping state update');
          return;
        }

        if (userDocsSnap.exists()) {
          const userDocs = userDocsSnap.data();

          console.log('✅ [ProfileForm] UserDocuments RAW DATA:', userDocs);
          console.log('✅ [ProfileForm] Documents object:', userDocs.documents);

          // Load documents into state
          loadDocumentsToState(userDocs, isMounted);

        } else {
          // ✅ NO WARNING YET - Check user profile first before showing any warnings
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const userData = userSnap.data();

            // ✅ FIX: Check if user has completed profile before - if NOT, this is normal!
            const hasCompletedProfile = userData.profileComplete === true;
            const hasIdentityInfo = userData.identityInfo && Object.keys(userData.identityInfo).length > 0;
            const hasEmergencyContact = userData.emergencyContact && Object.keys(userData.emergencyContact).length > 0;

            // ✅ FIX: Also check if user role is empty/undefined - this is also a new user
            const hasValidRole = userData.role && userData.role !== '';

            if (!hasCompletedProfile && !hasIdentityInfo && !hasEmergencyContact) {
              // ✅ NORMAL: New user who hasn't filled profile yet - EXIT SILENTLY!
              console.log('ℹ️ [ProfileForm] New user detected - profile not completed yet (this is normal)');
              console.log('👤 User can start filling their profile now');
              return; // Exit silently - no warnings or errors!
            }

            // ✅ FIX: If user has profileComplete=true but no role, this is also likely a new/incomplete user
            if (!hasValidRole) {
              console.log('ℹ️ [ProfileForm] User has no role assigned yet (this is normal for new users)');
              console.log('👤 User can start filling their profile now');
              return; // Exit silently - no warnings or errors!
            }

            // ✅ User has some profile data - Now check for OLD document structure
            console.log('🔄 [ProfileForm] Initiating automatic document migration process...');
            console.log('📂 [ProfileForm] Checking old storage locations for existing documents...');

            console.log('📦 [ProfileForm] FULL User data:', JSON.stringify(userData, null, 2));
            console.log('📦 [ProfileForm] Available fields in userData:', Object.keys(userData));
            console.log('📦 [ProfileForm] travelDocuments field:', userData.travelDocuments);
            console.log('📦 [ProfileForm] documents field:', userData.documents);
            console.log('📦 [ProfileForm] userDocuments field:', userData.userDocuments);

            // Check multiple possible locations for documents
            let foundDocuments = false;
            let migratedDocs: any = null;

            // Location 1: users.travelDocuments (old structure)
            if (userData.travelDocuments && typeof userData.travelDocuments === 'object') {
              const docs = userData.travelDocuments;
              console.log('🔍 Found documents in users.travelDocuments:', Object.keys(docs));

              // Check if there are actual document files (base64 strings)
              const hasFiles = docs.passportPhoto || docs.ktpPhoto || docs.kkPhoto;

              if (hasFiles) {
                console.log('✅ Found document FILES in travelDocuments!');
                foundDocuments = true;
                migratedDocs = {
                  userId: currentUser.uid,
                  passportNumber: docs.passportNumber || '',
                  passportExpiry: docs.passportExpiry || '',
                  documents: {
                    passportPhoto: docs.passportPhoto || '',
                    ktpPhoto: docs.ktpPhoto || '',
                    kkPhoto: docs.kkPhoto || '',
                    birthCertificate: docs.birthCertificate || '',
                    marriageCertificate: docs.marriageCertificate || '',
                    visaDocument: docs.visaDocument || '',
                    flightTicket: docs.flightTicket || '',
                    vaccinationCertificate: docs.vaccinationCertificate || '',
                  },
                  migratedFrom: 'users.travelDocuments',
                  migratedAt: new Date(),
                  createdAt: userData.createdAt || new Date(),
                  updatedAt: new Date(),
                };
              }
            }

            // Location 2: users.documents (alternative structure)
            if (!foundDocuments && userData.documents && typeof userData.documents === 'object') {
              console.log('🔍 Found documents field in users.documents:', Object.keys(userData.documents));
              const docs = userData.documents;
              const hasFiles = docs.passportPhoto || docs.ktpPhoto || docs.kkPhoto;

              if (hasFiles) {
                console.log('✅ Found document FILES in users.documents!');
                foundDocuments = true;
                migratedDocs = {
                  userId: currentUser.uid,
                  passportNumber: userData.passportNumber || '',
                  passportExpiry: userData.passportExpiry || '',
                  documents: docs,
                  migratedFrom: 'users.documents',
                  migratedAt: new Date(),
                  createdAt: userData.createdAt || new Date(),
                  updatedAt: new Date(),
                };
              }
            }

            // Location 3: Flat structure (documents directly in users root)
            if (!foundDocuments && (userData.passportPhoto || userData.ktpPhoto || userData.kkPhoto)) {
              console.log('🔍 Found documents in FLAT structure (users root)');
              foundDocuments = true;
              migratedDocs = {
                userId: currentUser.uid,
                passportNumber: userData.passportNumber || '',
                passportExpiry: userData.passportExpiry || '',
                documents: {
                  passportPhoto: userData.passportPhoto || '',
                  ktpPhoto: userData.ktpPhoto || '',
                  kkPhoto: userData.kkPhoto || '',
                  birthCertificate: userData.birthCertificate || '',
                  marriageCertificate: userData.marriageCertificate || '',
                  visaDocument: userData.visaDocument || '',
                  flightTicket: userData.flightTicket || '',
                  vaccinationCertificate: userData.vaccinationCertificate || '',
                },
                migratedFrom: 'users (flat structure)',
                migratedAt: new Date(),
                createdAt: userData.createdAt || new Date(),
                updatedAt: new Date(),
              };
            }

            // If documents found, migrate them
            if (foundDocuments && migratedDocs) {
              console.log('🔄 [ProfileForm] MIGRATING documents to userDocuments collection...');
              console.log('📦 Migrated data:', migratedDocs);

              try {
                // Save migrated documents to userDocuments collection
                await setDoc(userDocsRef, migratedDocs);
                console.log('✅ [ProfileForm] Migration SUCCESS! Documents saved to userDocuments collection');

                // Load migrated documents into state
                loadDocumentsToState(migratedDocs, isMounted);

                toast.success('📦 Documents recovered and migrated successfully!');
              } catch (error) {
                console.error('❌ Migration failed:', error);
                toast.error('Failed to migrate documents');
              }
            } else {
              console.error('❌ [ProfileForm] NO DOCUMENTS FOUND IN ANY LOCATION!');
              console.error('📋 [ProfileForm] Diagnostic Report:');
              console.error('  - User ID:', currentUser.uid);
              console.error('  - User Role:', currentUser.role);
              console.error('  - User Email:', currentUser.email);
              console.error('  - Available userData fields:', Object.keys(userData));
              console.error('  - Has travelDocuments field:', !!userData.travelDocuments);
              console.error('  - Has documents field:', !!userData.documents);
              console.error('  - Has passportPhoto (flat):', !!userData.passportPhoto);
              console.error('  - Has ktpPhoto (flat):', !!userData.ktpPhoto);

              if (userData.travelDocuments && typeof userData.travelDocuments === 'object') {
                console.error('  - travelDocuments keys:', Object.keys(userData.travelDocuments));
                console.error('  - travelDocuments.passportPhoto exists:', !!userData.travelDocuments.passportPhoto);
                console.error('  - travelDocuments.ktpPhoto exists:', !!userData.travelDocuments.ktpPhoto);
                console.error('  - travelDocuments.kkPhoto exists:', !!userData.travelDocuments.kkPhoto);
                console.error('  - travelDocuments.kkDocument exists:', !!userData.travelDocuments.kkDocument);
                console.error('  - travelDocuments.kartuKeluarga exists:', !!userData.travelDocuments.kartuKeluarga);
              }
              if (userData.documents && typeof userData.documents === 'object') {
                console.error('  - documents keys:', Object.keys(userData.documents));
                console.error('  - documents.passportPhoto exists:', !!userData.documents.passportPhoto);
                console.error('  - documents.ktpPhoto exists:', !!userData.documents.ktpPhoto);
                console.error('  - documents.kkPhoto exists:', !!userData.documents.kkPhoto);
                console.error('  - documents.kkDocument exists:', !!userData.documents.kkDocument);
                console.error('  - documents.kartuKeluarga exists:', !!userData.documents.kartuKeluarga);
              }

              console.error('❌ Checked locations: users.travelDocuments, users.documents, users (flat)');

              toast.error('⚠️ Documents not found! You can re-upload them below.', {
                duration: 6000,
              });

              // Show helpful message for alumni/current-jamaah
              if (currentUser.role === 'alumni' || currentUser.role === 'current-jamaah') {
                setTimeout(() => {
                  toast.info('💡 Your profile data is safe. Only documents need to be uploaded again.', {
                    duration: 5000,
                  });
                }, 1000);
              }
            }
          } else {
            console.error('❌ [ProfileForm] User document not found in users collection!');
          }
        }
      } catch (error) {
        console.error('❌ [ProfileForm] Error fetching user documents:', error);
      }
    };

    // Helper function to load documents to state
    const loadDocumentsToState = (userDocs: any, isMounted: boolean) => {
      // ✅ Set passport info FIRST
      if (userDocs.passportNumber) {
        console.log('📝 Setting passport number:', userDocs.passportNumber);
        setPassportNumber(userDocs.passportNumber);
      }

      if (userDocs.passportExpiry) {
        console.log('📝 Setting passport expiry:', userDocs.passportExpiry);
        setPassportExpiry(userDocs.passportExpiry);
      }

      // ✅ Load ALL documents with defensive checks
      if (userDocs.documents && typeof userDocs.documents === 'object') {
        console.log('📂 Processing documents object, keys:', Object.keys(userDocs.documents));

        // Force state updates in batches to avoid React batching issues
        setTimeout(() => {
          if (!isMounted) return;

          if (userDocs.documents.passportPhoto) {
            console.log('📷 Setting passport photo, size:', userDocs.documents.passportPhoto.length);
            setPassportPhoto(userDocs.documents.passportPhoto);
          }

          if (userDocs.documents.ktpPhoto) {
            console.log('📷 Setting KTP photo, size:', userDocs.documents.ktpPhoto.length);
            setKtpPhoto(userDocs.documents.ktpPhoto);
          }

          if (userDocs.documents.kkPhoto) {
            console.log('📷 Setting KK photo, size:', userDocs.documents.kkPhoto.length);
            setKkDocument(userDocs.documents.kkPhoto);
          }
        }, 0);

        // Second batch
        setTimeout(() => {
          if (!isMounted) return;

          if (userDocs.documents.birthCertificate) {
            console.log('📷 Setting birth certificate');
            setBirthCertificate(userDocs.documents.birthCertificate);
          }

          if (userDocs.documents.marriageCertificate) {
            console.log('📷 Setting marriage certificate');
            setMarriageCertificate(userDocs.documents.marriageCertificate);
          }

          if (userDocs.documents.visaDocument) {
            console.log('📷 Setting visa document');
            setVisaDocument(userDocs.documents.visaDocument);
          }
        }, 10);

        // Third batch
        setTimeout(() => {
          if (!isMounted) return;

          if (userDocs.documents.flightTicket) {
            console.log('📷 Setting flight ticket');
            setFlightTicket(userDocs.documents.flightTicket);
          }

          if (userDocs.documents.vaccinationCertificate) {
            console.log('📷 Setting vaccination certificate');
            setVaccinationCertificate(userDocs.documents.vaccinationCertificate);
          }

          console.log('✅ [ProfileForm] ALL DOCUMENTS LOADED SUCCESSFULLY');
        }, 20);

      } else {
        console.error('❌ [ProfileForm] documents field is missing or not an object!');
        console.error('❌ [ProfileForm] Available fields:', Object.keys(userDocs));
      }
    };

    fetchUserDocuments();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [currentUser?.uid]); // ✅ Only re-run when UID changes

  // Sync state with userProfile prop when it changes
  useEffect(() => {
    if (userProfile) {
      console.log('🔄 [ProfileForm] Syncing state with userProfile:', JSON.stringify(userProfile, null, 2));

      // ✅ FIX: Only update if new value exists - NEVER overwrite with empty values!
      // This prevents data loss when role changes and userProfile re-fetches

      // Personal Info - Check Nested FIRST, then Flat (Fallback)
      if (userProfile.displayName) setDisplayName(userProfile.displayName);
      if (userProfile.phoneNumber) setPhoneNumber(userProfile.phoneNumber);

      const identity = userProfile.identityInfo || {};

      // Robust Fallback Logic for each field
      const safeFullName = identity.fullName || userProfile.fullName || '';
      if (safeFullName) setFullName(safeFullName);

      const safeIdNumber = identity.idNumber || userProfile.idNumber || '';
      if (safeIdNumber) setIdNumber(safeIdNumber);

      const safeBirthDate = identity.birthDate || userProfile.birthDate || '';
      if (safeBirthDate) setBirthDate(safeBirthDate);

      const safeCountry = identity.country || userProfile.country || '';
      if (safeCountry) setCountry(safeCountry);

      const safeState = identity.state || userProfile.state || '';
      if (safeState) setState(safeState);

      const safeCity = identity.city || userProfile.city || '';
      if (safeCity) setCity(safeCity);

      const safePostalCode = identity.postalCode || userProfile.postalCode || '';
      if (safePostalCode) setPostalCode(safePostalCode);

      const safeStreetAddress = identity.streetAddress || userProfile.streetAddress || userProfile.address || '';
      if (safeStreetAddress) setStreetAddress(safeStreetAddress);

      // Emergency Contact - Check Nested FIRST, then Flat (Fallback)
      const emergency = userProfile.emergencyContact || {};

      const safeEmergencyName = emergency.name || userProfile.emergencyName || '';
      if (safeEmergencyName) setEmergencyName(safeEmergencyName);

      const safeEmergencyPhone = emergency.phone || userProfile.emergencyPhone || '';
      if (safeEmergencyPhone) setEmergencyPhone(safeEmergencyPhone);

      const safeRelationship = emergency.relationship || userProfile.emergencyRelationship || '';
      if (safeRelationship) setEmergencyRelationship(safeRelationship);
    }
  }, [userProfile]);

  useEffect(() => {
    calculateProfileCompletion();
  }, [
    displayName, phoneNumber, fullName, idNumber, birthDate, country, state, city, postalCode, streetAddress,
    passportNumber, passportExpiry, passportPhoto, ktpPhoto, kkDocument, birthCertificate, visaDocument, flightTicket, vaccinationCertificate,
    emergencyName, emergencyPhone, emergencyRelationship
  ]);

  const calculateProfileCompletion = () => {
    const fields = [
      displayName, phoneNumber, fullName, idNumber, birthDate, country, state, city, postalCode, streetAddress,
      passportNumber, passportExpiry, passportPhoto, ktpPhoto, kkDocument, birthCertificate, visaDocument, flightTicket, vaccinationCertificate,
      emergencyName, emergencyPhone, emergencyRelationship
    ];

    const filledFields = fields.filter(field => field && field !== '').length;
    const completion = Math.round((filledFields / fields.length) * 100);
    setProfileCompletion(completion);
  };

  const handleFileUpload = (setter: React.Dispatch<React.SetStateAction<string>>) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // STRICT VALIDATION: Reject files larger than 500KB
    const maxSizeKB = 500;
    if (file.size > maxSizeKB * 1024) {
      toast.error(`File size (${(file.size / 1024).toFixed(0)}KB) exceeds maximum allowed size of ${maxSizeKB}KB. Please choose a smaller file.`);
      // Clear the input
      e.target.value = '';
      return;
    }

    // Check if file is an image
    if (file.type.startsWith('image/')) {
      try {
        toast.loading('Processing image...');
        // Compress to optimize further (target max 200KB for final size)
        const compressedImage = await compressImage(file, 200);

        // Final check after compression
        if (compressedImage.length > 500 * 1024) {
          toast.dismiss();
          toast.error('Compressed file is still too large. Please use a smaller image.');
          e.target.value = '';
          return;
        }

        setter(compressedImage);
        toast.dismiss();
        toast.success(`Image uploaded successfully (${(compressedImage.length / 1024).toFixed(0)}KB)`);
      } catch (error) {
        console.error('Error processing image:', error);
        toast.dismiss();
        toast.error('Failed to process image');
        e.target.value = '';
      }
    } else {
      // For non-image files (PDF, Word, Excel)
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;

        // Final validation for documents
        if (base64.length > 500 * 1024) {
          toast.error('Document file is too large after encoding. Please use a smaller file or compress it first.');
          e.target.value = '';
          return;
        }

        setter(base64);
        toast.success(`Document uploaded successfully (${(base64.length / 1024).toFixed(0)}KB)`);
      };
      reader.onerror = () => {
        toast.error('Failed to read document');
        e.target.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;

    // Validate required fields
    if (!displayName || !phoneNumber || !fullName || !idNumber || !birthDate) {
      toast.error('Please fill in all required personal information fields');
      return;
    }

    if (!country || !state || !city || !postalCode || !streetAddress) {
      toast.error('Please fill in all required address fields');
      return;
    }

    if (!passportNumber || !passportExpiry || !passportPhoto || !ktpPhoto || !kkDocument ||
      !birthCertificate || !visaDocument || !flightTicket || !vaccinationCertificate) {
      toast.error('Please upload all required documents');
      return;
    }

    if (!emergencyName || !emergencyPhone || !emergencyRelationship) {
      toast.error('Please fill in all emergency contact fields');
      return;
    }

    setLoading(true);
    try {
      // ✅ FIX: Split data - Personal info and Documents SEPARATELY

      // 1️⃣ Save personal info to users collection (lightweight - no documents)
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        displayName,
        phoneNumber,
        identityInfo: {
          fullName,
          idNumber,
          birthDate,
          country,
          state,
          city,
          postalCode,
          streetAddress
        },
        emergencyContact: {
          name: emergencyName,
          phone: emergencyPhone,
          relationship: emergencyRelationship
        },
        profileCompleted: true,
        updatedAt: new Date()
      });

      // 2️⃣ Save documents to separate userDocuments collection (heavy - base64 images)
      const documentsRef = doc(db, 'userDocuments', currentUser.uid);
      await setDoc(documentsRef, {
        userId: currentUser.uid,
        passportNumber,
        passportExpiry,
        documents: {
          passportPhoto,
          ktpPhoto,
          kkPhoto: kkDocument,
          birthCertificate,
          marriageCertificate: marriageCertificate || null, // optional
          visaDocument,
          flightTicket,
          vaccinationCertificate
        },
        createdAt: userProfile?.travelDocuments ? userProfile.createdAt : new Date(),
        updatedAt: new Date()
      });

      toast.success('Profile updated successfully! You can now book packages.');

      // Delay to allow Firestore to propagate changes
      setTimeout(() => {
        onBack();
      }, 1000);
    } catch (error: any) {
      console.error('Error updating profile:', error);

      // ✅ Better error handling for document size
      if (error.message && error.message.includes('exceeds the maximum allowed size')) {
        toast.error('Documents are too large. Please compress your images further or use smaller files.');
      } else {
        toast.error('Failed to update profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F0] via-white to-gray-50">
      {/* Top Navbar */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="font-bold text-gray-900">My Profile</h1>
              <p className="text-xs text-gray-600">Complete your profile to book packages</p>
            </div>
            <Button
              onClick={onBack}
              variant="ghost"
              className="bg-white/50 hover:bg-white/80 text-gray-700 border border-gray-300"
            >
              <Home className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Completion */}
        <Card className="mb-6 border-2 border-[#D4AF37]/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Profile Completion</h3>
              <span className={`text-2xl font-bold ${profileCompletion === 100 ? 'text-green-600' : 'text-[#D4AF37]'}`}>
                {profileCompletion}%
              </span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${profileCompletion}%` }}
                transition={{ duration: 0.5 }}
                className={`h-full ${profileCompletion === 100 ? 'bg-green-600' : 'bg-gradient-to-r from-[#C5A572] to-[#D4AF37]'}`}
              />
            </div>
            {profileCompletion < 100 && (
              <p className="text-sm text-gray-600 mt-2">
                Complete all fields to enable package booking
              </p>
            )}
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-[#D4AF37]" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Display Name <span className="text-red-500">*</span></Label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label>Phone Number <span className="text-red-500">*</span></Label>
                <Input
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="08572336532"
                />
              </div>
              <div>
                <Label>Full Name (as per ID) <span className="text-red-500">*</span></Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label>ID Number <span className="text-red-500">*</span></Label>
                <Input
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder="2342343124323435"
                />
                <p className="text-xs text-gray-500 mt-1">6-9 alphanumeric characters (A-Z, 0-9)</p>
              </div>
              <div>
                <Label>Birth Date <span className="text-red-500">*</span></Label>
                <Input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">Must be today or earlier</p>
              </div>
              <div>
                <Label>Country <span className="text-red-500">*</span></Label>
                <Select
                  value={country}
                  onValueChange={(value) => setCountry(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a country">{country}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">Select your country from the list</p>
              </div>
              <div>
                <Label>State/Province <span className="text-red-500">*</span></Label>
                <Input
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="California"
                />
              </div>
              <div>
                <Label>City <span className="text-red-500">*</span></Label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="San Francisco"
                />
              </div>
              <div>
                <Label>Postal Code</Label>
                <Input
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="45671"
                />
              </div>
              <div className="md:col-span-2">
                <Label>Street Address (Detail) <span className="text-red-500">*</span></Label>
                <Textarea
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="Include street name, number, building name, unit, etc."
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">Include street name, number, building name, unit, etc.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#D4AF37]" />
              Required Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Passport Number */}
              <div>
                <Label>Passport Number <span className="text-red-500">*</span></Label>
                <Input
                  value={passportNumber}
                  onChange={(e) => setPassportNumber(e.target.value)}
                  placeholder="A12344432"
                />
                <p className="text-xs text-gray-500 mt-1">6-9 alphanumeric characters (A-Z, 0-9)</p>
              </div>

              {/* Passport Expiry */}
              <div>
                <Label>Passport Expiry <span className="text-red-500">*</span></Label>
                <Input
                  type="date"
                  value={passportExpiry}
                  onChange={(e) => setPassportExpiry(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">Must be a future date</p>
              </div>

              {/* Passport Photo */}
              <div>
                <Label>Passport Photo <span className="text-red-500">*</span></Label>
                <p className="text-xs text-gray-500 mb-2">Max 500KB - Gambar akan otomatis dikompres</p>
                {passportPhoto ? (
                  <div className="relative border-2 border-green-300 rounded-lg p-3 bg-green-50">
                    <button
                      onClick={() => setPassportPhoto('')}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-white">
                        <img src={passportPhoto} alt="Passport" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-green-700 font-medium text-sm">
                          <Check className="w-4 h-4" />
                          Passport Uploaded
                        </div>
                        <p className="text-xs text-green-600 mt-1">{(passportPhoto.length / 1024).toFixed(2)} KB</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPassportPhoto('')}
                          className="text-orange-600 hover:text-orange-700 mt-1 h-auto p-0"
                        >
                          Change File
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#D4AF37] transition-colors cursor-pointer">
                    <input
                      type="file"
                      accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                      onChange={handleFileUpload(setPassportPhoto)}
                      className="hidden"
                      id="passport-upload"
                    />
                    <label htmlFor="passport-upload" className="cursor-pointer">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Click to upload</p>
                    </label>
                  </div>
                )}
              </div>

              {/* KTP Photo */}
              <div>
                <Label>KTP Photo <span className="text-red-500">*</span></Label>
                <p className="text-xs text-gray-500 mb-2">Max 500KB - Gambar akan otomatis dikompres</p>
                {ktpPhoto ? (
                  <div className="relative border-2 border-green-300 rounded-lg p-3 bg-green-50">
                    <button
                      onClick={() => setKtpPhoto('')}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-white">
                        <img src={ktpPhoto} alt="KTP" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-green-700 font-medium text-sm">
                          <Check className="w-4 h-4" />
                          KTP Uploaded
                        </div>
                        <p className="text-xs text-green-600 mt-1">{(ktpPhoto.length / 1024).toFixed(2)} KB</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setKtpPhoto('')}
                          className="text-orange-600 hover:text-orange-700 mt-1 h-auto p-0"
                        >
                          Change File
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#D4AF37] transition-colors cursor-pointer">
                    <input
                      type="file"
                      accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                      onChange={handleFileUpload(setKtpPhoto)}
                      className="hidden"
                      id="ktp-upload"
                    />
                    <label htmlFor="ktp-upload" className="cursor-pointer">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Click to upload</p>
                    </label>
                  </div>
                )}
              </div>

              {/* Similar upload components for other documents */}
              {/* KK Document */}
              <DocumentUpload
                label="Kartu Keluarga (KK)"
                required
                value={kkDocument}
                onChange={handleFileUpload(setKkDocument)}
                onClear={() => setKkDocument('')}
                id="kk-upload"
              />

              {/* Birth Certificate */}
              <DocumentUpload
                label="Akta Lahir"
                required
                value={birthCertificate}
                onChange={handleFileUpload(setBirthCertificate)}
                onClear={() => setBirthCertificate('')}
                id="birth-certificate-upload"
              />

              {/* Marriage Certificate */}
              <DocumentUpload
                label="Buku Nikah"
                required={false}
                value={marriageCertificate}
                onChange={handleFileUpload(setMarriageCertificate)}
                onClear={() => setMarriageCertificate('')}
                id="marriage-certificate-upload"
              />

              {/* Visa Document */}
              <DocumentUpload
                label="Visa Umroh"
                required
                value={visaDocument}
                onChange={handleFileUpload(setVisaDocument)}
                onClear={() => setVisaDocument('')}
                id="visa-upload"
              />

              {/* Flight Ticket */}
              <DocumentUpload
                label="Tiket Pesawat"
                required
                value={flightTicket}
                onChange={handleFileUpload(setFlightTicket)}
                onClear={() => setFlightTicket('')}
                id="flight-ticket-upload"
              />

              {/* Vaccination Certificate */}
              <DocumentUpload
                label="Sertifikat Vaksinasi"
                required
                value={vaccinationCertificate}
                onChange={handleFileUpload(setVaccinationCertificate)}
                onClear={() => setVaccinationCertificate('')}
                id="vaccination-upload"
              />
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-[#D4AF37]" />
              Emergency Contact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label>Contact Name <span className="text-red-500">*</span></Label>
                <Input
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  placeholder="Jane Doe"
                />
              </div>
              <div>
                <Label>Contact Phone <span className="text-red-500">*</span></Label>
                <Input
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  placeholder="345678"
                />
              </div>
              <div>
                <Label>Relationship <span className="text-red-500">*</span></Label>
                <Input
                  value={emergencyRelationship}
                  onChange={(e) => setEmergencyRelationship(e.target.value)}
                  placeholder="Sister"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('🔙 Cancel button clicked - returning to dashboard');
              onBack();
            }}
            className="flex-1 border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 text-gray-700 font-medium transition-all cursor-pointer"
            type="button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveProfile}
            disabled={loading || profileCompletion < 100}
            className="flex-1 bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] hover:opacity-90 text-white"
            type="button"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Save Profile
              </>
            )}
          </Button>
        </div>

        {/* Log Out Button */}
        <div className="mt-3 space-y-3">
          {/* ✅ NEW: Agent Upgrade Button (Alumni Only) */}
          {userProfile?.role === 'alumni' && (
            <Button
              onClick={() => setShowAgentUpgradeDialog(true)}
              className="w-full bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] hover:opacity-90 text-white border-2 border-[#D4AF37]/30"
              disabled={loading}
            >
              <Shield className="w-4 h-4 mr-2" />
              Ready Upgrade Mode Syiar/Agen
            </Button>
          )}

          <Button
            onClick={() => setShowLogoutDialog(true)}
            variant="ghost"
            className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200"
            disabled={loading}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log Out
          </Button>
        </div>

        {profileCompletion < 100 && (
          <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-orange-900">Profile Incomplete</p>
              <p className="text-sm text-orange-700 mt-1">
                Please fill in all required fields (marked with *) to save your profile and enable package booking.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <LogOut className="w-6 h-6 text-red-600" />
            </div>
            <DialogTitle className="text-center text-xl">Konfirmasi Logout</DialogTitle>
            <DialogDescription className="text-center">
              Apakah Anda yakin ingin keluar dari akun? Anda perlu login kembali untuk mengakses dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse sm:flex-row gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowLogoutDialog(false)}
              className="flex-1"
            >
              Batal
            </Button>
            <Button
              onClick={() => {
                setShowLogoutDialog(false);
                handleLogout();
              }}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Ya, Log Out
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Agent Upgrade Dialog */}
      <AgentUpgradeDialog
        open={showAgentUpgradeDialog}
        onOpenChange={setShowAgentUpgradeDialog}
        currentUser={currentUser}
        autoCreateReferralCode={autoCreateReferralCode}
      />
    </div>
  );
};

// Document Upload Component
interface DocumentUploadProps {
  label: string;
  required: boolean;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  id: string;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ label, required, value, onChange, onClear, id }) => {
  return (
    <div>
      <Label>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <p className="text-xs text-gray-500 mb-2">Max 500KB - Gambar akan otomatis dikompres</p>
      {value ? (
        <div className="relative border-2 border-green-300 rounded-lg p-3 bg-green-50">
          <button
            onClick={onClear}
            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
          >
            <X className="w-3 h-3" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-white flex items-center justify-center">
              {value.startsWith('data:image') ? (
                <img src={value} alt={label} className="w-full h-full object-cover" />
              ) : (
                <FileText className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-green-700 font-medium text-sm">
                <Check className="w-4 h-4" />
                {label} Uploaded
              </div>
              <p className="text-xs text-green-600 mt-1">{(value.length / 1024).toFixed(2)} KB</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClear}
                className="text-orange-600 hover:text-orange-700 mt-1 h-auto p-0"
              >
                Change File
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#D4AF37] transition-colors cursor-pointer">
          <input
            type="file"
            accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
            onChange={onChange}
            className="hidden"
            id={id}
          />
          <label htmlFor={id} className="cursor-pointer">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Click to upload</p>
          </label>
        </div>
      )}
    </div>
  );
};

export default ProfileForm;