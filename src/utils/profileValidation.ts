// Profile validation utilities - FIXED & UPDATED

import { User } from '../types';

/**
 * ✅ FIXED: Check if user profile is 100% complete
 * Required fields for booking & testimonial submission:
 * - displayName
 * - phoneNumber
 * - identityInfo: fullName, idNumber, birthDate, address (object)
 * - emergencyContact: name, phone, relationship
 * - travelDocuments: ktpPhoto, kkPhoto
 */
export const isProfileComplete = (user: User | null): boolean => {
  if (!user) return false;

  // Check basic text fields
  const basicFields = [
    user.displayName,
    user.phoneNumber,
    user.identityInfo?.fullName,
    user.identityInfo?.idNumber,
    user.identityInfo?.birthDate,
    user.emergencyContact?.name,
    user.emergencyContact?.phone,
    user.emergencyContact?.relationship,
  ];

  // Check address (it's an object, not a string)
  const address = user.identityInfo?.address;
  const isAddressComplete = address && 
    typeof address === 'object' && 
    address.country && 
    address.province && 
    address.city && 
    address.street;

  // Check required documents (they can be objects with base64 or just base64 strings)
  const requiredDocs = [
    user.travelDocuments?.ktpPhoto,
    user.travelDocuments?.kkPhoto,
  ];

  return (
    basicFields.every(field => field && typeof field === 'string' && field.trim() !== '') &&
    isAddressComplete &&
    requiredDocs.every(doc => {
      if (!doc) return false;
      // Handle both new format (object with base64) and legacy format (string)
      if (typeof doc === 'object' && (doc as any).base64) return true;
      if (typeof doc === 'string') return true;
      return false;
    })
  );
};

/**
 * ✅ FIXED: Get list of missing required fields
 */
export const getMissingProfileFields = (user: User | null): string[] => {
  if (!user) return ['All profile information'];

  const missing: string[] = [];

  if (!user.displayName || user.displayName.trim() === '') {
    missing.push('Display Name');
  }
  if (!user.phoneNumber || user.phoneNumber.trim() === '') {
    missing.push('Phone Number');
  }
  
  // Identity Info checks
  if (!user.identityInfo?.fullName || user.identityInfo.fullName.trim() === '') {
    missing.push('Full Name (KTP)');
  }
  if (!user.identityInfo?.idNumber || user.identityInfo.idNumber.trim() === '') {
    missing.push('ID Number (NIK)');
  }
  if (!user.identityInfo?.birthDate || user.identityInfo.birthDate.trim() === '') {
    missing.push('Birth Date');
  }

  // Address check
  const address = user.identityInfo?.address;
  if (!address || typeof address !== 'object') {
    missing.push('Complete Address');
  } else {
    if (!address.street) missing.push('Street Address');
    if (!address.city) missing.push('City');
    if (!address.province) missing.push('Province');
    if (!address.country) missing.push('Country');
  }

  // Emergency Contact checks
  if (!user.emergencyContact?.name || user.emergencyContact.name.trim() === '') {
    missing.push('Emergency Contact Name');
  }
  if (!user.emergencyContact?.phone || user.emergencyContact.phone.trim() === '') {
    missing.push('Emergency Contact Phone');
  }
  if (!user.emergencyContact?.relationship || user.emergencyContact.relationship.trim() === '') {
    missing.push('Emergency Contact Relationship');
  }

  // Document checks
  const ktpPhoto = user.travelDocuments?.ktpPhoto;
  if (!ktpPhoto || (typeof ktpPhoto === 'object' && !(ktpPhoto as any).base64) || (typeof ktpPhoto === 'string' && ktpPhoto.trim() === '')) {
    missing.push('KTP Photo');
  }

  const kkPhoto = user.travelDocuments?.kkPhoto;
  if (!kkPhoto || (typeof kkPhoto === 'object' && !(kkPhoto as any).base64) || (typeof kkPhoto === 'string' && kkPhoto.trim() === '')) {
    missing.push('Kartu Keluarga Photo');
  }

  return missing;
};

/**
 * ✅ FIXED: Calculate profile completion percentage
 */
export const getProfileCompletionPercentage = (user: User | null): number => {
  if (!user) return 0;

  let totalFields = 0;
  let completedFields = 0;

  // Basic fields (2)
  const basicFields = [user.displayName, user.phoneNumber];
  totalFields += basicFields.length;
  completedFields += basicFields.filter(f => f && f.trim() !== '').length;

  // Identity info fields (3)
  const identityFields = [
    user.identityInfo?.fullName,
    user.identityInfo?.idNumber,
    user.identityInfo?.birthDate,
  ];
  totalFields += identityFields.length;
  completedFields += identityFields.filter(f => f && f.trim() !== '').length;

  // Address (count as 1 field)
  totalFields += 1;
  const address = user.identityInfo?.address;
  if (address && address.street && address.city && address.province && address.country) {
    completedFields += 1;
  }

  // Emergency contact (3)
  const emergencyFields = [
    user.emergencyContact?.name,
    user.emergencyContact?.phone,
    user.emergencyContact?.relationship,
  ];
  totalFields += emergencyFields.length;
  completedFields += emergencyFields.filter(f => f && f.trim() !== '').length;

  // Documents (2 required)
  totalFields += 2;
  if (user.travelDocuments?.ktpPhoto) completedFields += 1;
  if (user.travelDocuments?.kkPhoto) completedFields += 1;

  // Optional but counts (passport)
  if (user.travelDocuments?.passportPhoto) {
    totalFields += 1;
    completedFields += 1;
  }

  return Math.round((completedFields / totalFields) * 100);
};

/**
 * Get user-friendly message for profile completion
 */
export const getProfileCompletionMessage = (user: User | null): string => {
  const percentage = getProfileCompletionPercentage(user);
  
  if (percentage === 100) {
    return 'Profile Complete! ✓';
  } else if (percentage >= 80) {
    return 'Almost there! Please complete your profile.';
  } else if (percentage >= 50) {
    return 'Please complete your profile to book packages.';
  } else {
    return 'Profile incomplete. Please fill in all required information.';
  }
};
