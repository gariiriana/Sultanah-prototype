// Announcement Type Definition
export interface Announcement {
  id: string;
  title: string;
  message: string;
  isUrgent: boolean;
  isActive: boolean;
  targetRoles: string[]; // ['guest', 'prospective-jamaah', 'current-jamaah', 'alumni-jamaah', 'tour-leader', 'muthawif', 'admin', 'manager', 'supervisor']
  createdAt: any; // Firestore Timestamp
  createdBy: string; // Admin UID
  createdByName: string;
  updatedAt?: any;
  updatedBy?: string;
  publishDate?: any;
  expiryDate?: any;
}

export interface AnnouncementFormData {
  title: string;
  message: string;
  isUrgent: boolean;
  isActive: boolean;
  targetRoles: string[];
  publishDate?: Date;
  expiryDate?: Date;
}
