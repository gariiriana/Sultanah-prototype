import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Filter,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Shield,
  User,
  Award,
  Trash2
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { toast } from 'sonner';
import { collection, getDocs, query, updateDoc, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../../config/firebase';
import { User as UserType, UserRole } from '../../../../types';
import VerificationRequestModal from './VerificationRequestModal';
import UserProfileDetailModal from './UserProfileDetailModal'; // ✅ NEW: Import profile detail modal
import { autoCreateReferralCode } from '../../../../utils/autoCreateReferralCode'; // ✅ NEW: Auto-create referral code
import ConfirmDialog from '../../../components/ui/ConfirmDialog';

interface UserWithVerification extends UserType {
  verificationRequest?: {
    type: 'upgrade-to-current' | 'upgrade-to-alumni';
    proofImage: string;
    message?: string;
    requestedAt: string;
    status: 'pending' | 'approved' | 'rejected';
  };
}

export default function UserManagementNew() {
  const [users, setUsers] = useState<UserWithVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithVerification | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  // ✅ NEW: State for approval confirmation dialog
  const [showApprovalConfirm, setShowApprovalConfirm] = useState(false);
  const [userToApprove, setUserToApprove] = useState<{ id: string; email: string; name: string; role: string } | null>(null);

  // ✅ NEW: State for profile detail modal
  const [showProfileDetail, setShowProfileDetail] = useState(false);
  const [profileDetailUser, setProfileDetailUser] = useState<{ userId: string; email: string; role: string; name: string } | null>(null);

  // ✅ NEW: State for deletion confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; userId: string | null; email: string | null }>({
    isOpen: false,
    userId: null,
    email: null
  });

  useEffect(() => {
    fetchUsers();
  }, []); // ✅ FIX: Only fetch once on mount, not on selectedRole change

  const fetchUsers = async () => {
    try {
      setLoading(true);

      // ✅ FIX: Always fetch ALL users, then filter client-side
      const q = query(collection(db, 'users'));

      const querySnapshot = await getDocs(q);
      const usersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserWithVerification[];

      // ✅ DEBUG: Log influencer data to check approval status
      const influencerUsers = usersData.filter(u => u.role === 'agen' || u.role === 'influencer');
      if (influencerUsers.length > 0) {
        console.log('🔍 INFLUENCER DATA DEBUG:', influencerUsers.map(u => ({
          email: u.email,
          role: u.role,
          approvalStatus: u.approvalStatus,
          hasApprovalStatus: 'approvalStatus' in u
        })));
      }

      // ✅ DEBUG: Log ALL user roles
      console.log('📊 ALL USERS ROLE BREAKDOWN:', {
        total: usersData.length,
        prospective: usersData.filter(u => u.role === 'prospective-jamaah').length,
        current: usersData.filter(u => u.role === 'current-jamaah').length,
        alumni: usersData.filter(u => u.role === 'alumni').length,
        agen: usersData.filter(u => u.role === 'agen').length,
        tourLeader: usersData.filter(u => u.role === 'tour-leader').length,
        mutawwif: usersData.filter(u => u.role === 'mutawwif').length,
        other: usersData.filter(u => !['prospective-jamaah', 'current-jamaah', 'alumni', 'agen', 'tour-leader', 'mutawwif', 'admin'].includes(u.role || '')).length
      });

      // ✅ Filter out admin users and store ALL users
      setUsers(usersData.filter(u => u.role !== 'admin'));
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAccount = async (userId: string, userEmail: string) => {
    try {
      // Get user data first to get role and displayName
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        toast.error('User not found');
        return;
      }

      const userData = userDoc.data();
      const userRole = userData.role;
      const displayName = userData.displayName || 'User';

      // Update approval status
      await updateDoc(userDocRef, {
        approvalStatus: 'approved',
        approvedAt: new Date().toISOString(),
      });

      // ✅ ENHANCED: Auto-create referral code for Alumni & Influencer with better feedback
      if (userRole === 'alumni' || userRole === 'agen' || userRole === 'influencer') {
        console.log('🔗 [ADMIN-APPROVAL] Auto-creating referral code for approved user...', {
          userId,
          userEmail,
          userRole,
          displayName
        });

        const result = await autoCreateReferralCode(userId, userRole, displayName, userEmail);

        if (result) {
          console.log('✅ [ADMIN-APPROVAL] Referral code auto-created successfully!');
          toast.success(`Account approved for ${userEmail} with referral code!`);
        } else {
          console.warn('⚠️ [ADMIN-APPROVAL] Failed to auto-create referral code, but approval still succeeded');
          toast.success(`Account approved for ${userEmail}(Referral code will be created on first login)`);
        }
      } else {
        toast.success(`Account approved for ${userEmail}`);
      }

      fetchUsers();
    } catch (error) {
      console.error('Error approving account:', error);
      toast.error('Failed to approve account');
    }
  };

  const handleRejectAccount = async (userId: string, userEmail: string, reason: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        approvalStatus: 'rejected',
        rejectionReason: reason,
        rejectedAt: new Date().toISOString(),
      });

      toast.success(`Account rejected for ${userEmail}`);
      fetchUsers();
    } catch (error) {
      console.error('Error rejecting account:', error);
      toast.error('Failed to reject account');
    }
  };

  const handleViewVerification = (user: UserWithVerification) => {
    setSelectedUser(user);
    setShowVerificationModal(true);
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    try {
      // 1. Cleanup associated referral data if any
      const collectionsToCleanup = ['agenReferrals', 'alumniReferrals', 'referralTracking'];
      for (const colName of collectionsToCleanup) {
        try {
          await deleteDoc(doc(db, colName, userId));
        } catch (e) {
          console.warn(`Could not delete from ${colName}:`, e);
        }
      }

      // 2. Delete the user record
      await deleteDoc(doc(db, 'users', userId));

      toast.success(`User ${userEmail} has been deleted successfully`);
      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      // Better error message for the user
      const errorMessage = error.code === 'permission-denied'
        ? 'Permission denied: Only supervisors or owners can delete users.'
        : `Failed to delete user: ${error.message || 'Unknown error'}`;
      toast.error(errorMessage);
    }
  };

  const purgeAgenUsers = async () => {
    // Hidden functionality - can be manually triggered if needed from console, but removed from UI button
    const agenUsers = users.filter(u => u.role === 'agen');
    if (agenUsers.length === 0) {
      toast.info('No legacy "Agen" users to purge');
      return;
    }

    if (!confirm(`Are you sure you want to delete ALL ${agenUsers.length} users with "agen" role? This cannot be undone.`)) {
      return;
    }

    let successCount = 0;
    let failCount = 0;

    toast.info(`Purging ${agenUsers.length} "Agen" users...`);

    for (const user of agenUsers) {
      try {
        await deleteDoc(doc(db, 'users', user.id));
        successCount++;
      } catch (error) {
        console.error(`Failed to delete user ${user.email}:`, error);
        failCount++;
      }
    }

    toast.success(`Purge completed: ${successCount} deleted, ${failCount} failed`);
    fetchUsers();
  };

  const filteredUsers = users.filter(user => {
    // ✅ FIX: Filter by role - if influencer is selected, show both influencer and agen
    const matchesRole =
      selectedRole === 'all' ||
      (selectedRole === 'influencer' && (user.role === 'influencer' || user.role === 'agen' || user.role === 'reseller_agen')) ||
      user.role === selectedRole;

    const matchesSearch =
      user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phoneNumber?.includes(searchQuery);

    return matchesRole && matchesSearch;
  });

  const getRoleBadge = (role: UserRole) => {
    const config = {
      'prospective-jamaah': { label: 'Calon Jamaah', color: 'bg-blue-100 text-blue-700', icon: User },
      'current-jamaah': { label: 'Jamaah Umroh', color: 'bg-green-100 text-green-700', icon: Users },
      'alumni': { label: 'Alumni Jamaah', color: 'bg-purple-100 text-purple-700', icon: Award },
      'tour-leader': { label: 'Tour Leader', color: 'bg-amber-100 text-amber-700', icon: Shield },
      'mutawwif': { label: 'Mutawwif', color: 'bg-teal-100 text-teal-700', icon: Shield },
      'admin': { label: 'Admin', color: 'bg-red-100 text-red-700', icon: Shield },
      'staff': { label: 'Staff', color: 'bg-gray-100 text-gray-700', icon: Shield },
      'supervisor': { label: 'Supervisor', color: 'bg-indigo-100 text-indigo-700', icon: Shield },
      'direktur': { label: 'Direktur', color: 'bg-pink-100 text-pink-700', icon: Shield },
      'brand_ambassador': { label: 'Brand Ambassador', color: 'bg-cyan-100 text-cyan-700', icon: Shield },
      'agen': { label: 'Influencer', color: 'bg-cyan-100 text-cyan-700', icon: Shield }, // ✅ RENAMED: Use Influencer label for agen role
      'influencer': { label: 'Influencer', color: 'bg-indigo-100 text-indigo-700', icon: Award },
      'super_admin': { label: 'Super Admin', color: 'bg-black text-white', icon: Shield },
      'jamaah': { label: 'Jamaah', color: 'bg-slate-100 text-slate-700', icon: Users },
      'alumni_jamaah': { label: 'Alumni', color: 'bg-purple-100 text-purple-700', icon: Award },
      'reseller_agen': { label: 'Influencer', color: 'bg-cyan-100 text-cyan-700', icon: Shield },
      'mitra_biro': { label: 'Mitra Biro', color: 'bg-blue-100 text-blue-700', icon: Shield },
      'influencer_affiliator': { label: 'Influencer', color: 'bg-indigo-100 text-indigo-700', icon: Award },
      'affiliator': { label: 'Affiliator', color: 'bg-indigo-100 text-indigo-700', icon: Award },
      'corporate_client': { label: 'Corporate Client', color: 'bg-indigo-100 text-indigo-700', icon: Shield },
      'travel_consultant': { label: 'Travel Consultant', color: 'bg-teal-100 text-teal-700', icon: Shield },
      'content_creator': { label: 'Content Creator', color: 'bg-rose-100 text-rose-700', icon: Shield },
      'owner': { label: 'Owner', color: 'bg-black text-white', icon: Shield },
    };

    const { label, color, icon: Icon } = config[role] || config['prospective-jamaah'];

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        <Icon className="w-3 h-3" />
        {label}
      </span>
    );
  };

  const getApprovalStatusBadge = (status: 'pending' | 'approved' | 'rejected' | undefined) => {
    if (!status) return null;

    const config = {
      pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: Clock },
      approved: { label: 'Approved', color: 'bg-green-100 text-green-700', icon: CheckCircle },
      rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle },
    };

    const { label, color, icon: Icon } = config[status];

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        <Icon className="w-3 h-3" />
        {label}
      </span>
    );
  };

  const getVerificationBadge = (user: UserWithVerification) => {
    if (!user.verificationRequest) return null;

    const { status, type } = user.verificationRequest;

    const typeLabel = type === 'upgrade-to-current' ? 'Upgrade → Jamaah' : 'Upgrade → Alumni';

    const config = {
      pending: { color: 'bg-amber-100 text-amber-700 border-amber-300', icon: Clock },
      approved: { color: 'bg-green-100 text-green-700 border-green-300', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-700 border-red-300', icon: XCircle },
    };

    const { color, icon: Icon } = config[status];

    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border ${color}`}>
        <Icon className="w-3 h-3" />
        <span>{typeLabel}</span>
        <span className="opacity-60">• {status}</span>
      </div>
    );
  };

  const roleOptions = [
    { value: 'all', label: '👥 All Users', count: users.length },
    { value: 'prospective-jamaah', label: '🕌 Calon Jamaah', count: users.filter(u => u.role === 'prospective-jamaah').length },
    { value: 'current-jamaah', label: '✈️ Jamaah Umroh', count: users.filter(u => u.role === 'current-jamaah').length },
    { value: 'alumni', label: '🏆 Alumni Jamaah', count: users.filter(u => u.role === 'alumni').length },
    { value: 'tour-leader', label: '🧑‍✈️ Tour Leader', count: users.filter(u => u.role === 'tour-leader').length },
    { value: 'mutawwif', label: '📿 Mutawwif', count: users.filter(u => u.role === 'mutawwif').length },
    { value: 'brand_ambassador', label: '💠 Brand Ambassador', count: users.filter(u => u.role === 'brand_ambassador').length },
    { value: 'influencer', label: '🤳 Influencer', count: users.filter(u => u.role === 'influencer' || u.role === 'agen').length },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-16 h-16 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">User Management</h3>
          <p className="text-sm text-gray-600 mt-1">Manage all users and approval requests</p>
        </div>

        {/* ✅ NEW: Refresh & Utility Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={() => {
              console.log('🔄 Manual refresh triggered');
              fetchUsers();
            }}
            className="bg-gradient-to-r from-[#D4AF37] to-[#FFD700] hover:opacity-90 text-white"
          >
            🔄 Refresh Data
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 bg-gray-50 border-gray-300 focus:border-[#D4AF37] focus:ring-[#D4AF37]/30"
            />
          </div>

          {/* Role Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as any)}
              className="pl-10 pr-4 h-12 bg-gray-50 border border-gray-300 rounded-xl focus:border-[#D4AF37] focus:ring-[#D4AF37]/30 focus:outline-none appearance-none cursor-pointer min-w-[220px]"
            >
              {roleOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label} ({option.count})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  User Info
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Verification
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="w-12 h-12 text-gray-300" />
                      <p className="text-gray-500 font-medium">No users found</p>
                      <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {/* User Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#C5A572] to-[#D4AF37] rounded-full flex items-center justify-center text-white font-semibold">
                          {user.displayName?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.displayName || 'No Name'}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <p className="text-xs text-gray-500">{user.phoneNumber || 'No phone'}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-6 py-4">
                      {getRoleBadge(user.role as UserRole)}
                    </td>

                    {/* Account Status */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {/* For Tour Leader, Mutawwif, Influencer & Brand Ambassador - show approval status */}
                        {(user.role === 'tour-leader' || user.role === 'mutawwif' || user.role === 'agen' || user.role === 'influencer' || user.role === 'brand_ambassador') && (
                          <>
                            {/* ✅ FIXED: Show "Setup Required" if no approvalStatus */}
                            {!user.approvalStatus ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-300">
                                <AlertCircle className="w-3 h-3" />
                                Setup Required
                              </span>
                            ) : (
                              <>
                                {getApprovalStatusBadge(user.approvalStatus)}
                                {user.approvalStatus === 'rejected' && user.rejectionReason && (
                                  <p className="text-xs text-red-600 mt-1">
                                    Reason: {user.rejectionReason}
                                  </p>
                                )}
                              </>
                            )}
                          </>
                        )}

                        {/* For regular jamaah - show profile completion */}
                        {!['tour-leader', 'mutawwif', 'agen', 'influencer', 'brand_ambassador'].includes(user.role) && (() => {
                          // ✅ CRITICAL FIX: Proper complete/incomplete logic
                          // - prospective-jamaah: Check profileCompleted field
                          // - current-jamaah: ALWAYS complete (can't become current-jamaah without completing profile)
                          // - alumni: ALWAYS complete (upgraded from current-jamaah who already completed)
                          const isComplete =
                            user.role === 'current-jamaah' ||
                            user.role === 'alumni' ||
                            user.profileComplete === true;

                          return (
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${isComplete
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                              }`}>
                              {isComplete ? (
                                <>
                                  <CheckCircle className="w-3 h-3" />
                                  Complete
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3 h-3" />
                                  Incomplete
                                </>
                              )}
                            </span>
                          );
                        })()}
                      </div>
                    </td>

                    {/* Verification Request */}
                    <td className="px-6 py-4">
                      {getVerificationBadge(user)}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {/* ✅ FIXED: Setup button for influencer/BA/tour-leader/mutawwif without approvalStatus */}
                        {(user.role === 'tour-leader' || user.role === 'mutawwif' || user.role === 'agen' || user.role === 'influencer' || user.role === 'brand_ambassador') && !user.approvalStatus && (
                          <Button
                            onClick={async () => {
                              try {
                                await updateDoc(doc(db, 'users', user.id), {
                                  approvalStatus: 'pending',
                                  approvalRequestedAt: user.createdAt || new Date().toISOString(),
                                });
                                toast.success(`Status set to pending for ${user.email}`);
                                fetchUsers();
                              } catch (error: any) {
                                console.error('Error setting status:', error);
                                toast.error('Failed to set status');
                              }
                            }}
                            size="sm"
                            className="h-8 px-3 bg-orange-500 hover:bg-orange-600 text-white"
                          >
                            <AlertCircle className="w-4 h-4 mr-1" />
                            Set as Pending
                          </Button>
                        )}

                        {/* Approve/Reject for Tour Leader, Mutawwif, Influencer & Brand Ambassador */}
                        {(user.role === 'tour-leader' || user.role === 'mutawwif' || user.role === 'agen' || user.role === 'influencer' || user.role === 'brand_ambassador') && user.approvalStatus === 'pending' && (
                          <>
                            <Button
                              onClick={() => {
                                setUserToApprove({ id: user.id, email: user.email, name: user.displayName || 'User', role: user.role });
                                setShowApprovalConfirm(true);
                              }}
                              size="sm"
                              className="h-8 px-3 bg-green-500 hover:bg-green-600 text-white"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              onClick={() => {
                                const reason = prompt('Enter rejection reason:');
                                if (reason) {
                                  handleRejectAccount(user.id, user.email, reason);
                                }
                              }}
                              size="sm"
                              variant="outline"
                              className="h-8 px-3 border-red-300 text-red-600 hover:bg-red-50"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}

                        {/* View Verification Request */}
                        {user.verificationRequest && user.verificationRequest.status === 'pending' && (
                          <Button
                            onClick={() => handleViewVerification(user)}
                            size="sm"
                            className="h-8 px-3 bg-blue-500 hover:bg-blue-600 text-white"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Review
                          </Button>
                        )}

                        {/* ✅ NEW: View Profile Details - Available for ALL users */}
                        <Button
                          onClick={() => {
                            setProfileDetailUser({ userId: user.id, email: user.email, role: user.role, name: user.displayName || 'User' });
                            setShowProfileDetail(true);
                          }}
                          size="sm"
                          variant="outline"
                          className="h-8 px-3 border-blue-300 text-blue-600 hover:bg-blue-50"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Detail
                        </Button>

                        {/* ✅ NEW: Delete User Button */}
                        <Button
                          onClick={() => setDeleteConfirm({ isOpen: true, userId: user.id, email: user.email })}
                          size="sm"
                          variant="outline"
                          className="h-8 px-3 border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verification Modal */}
      {selectedUser && (
        <VerificationRequestModal
          open={showVerificationModal}
          onClose={() => {
            setShowVerificationModal(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
          onApprove={() => {
            fetchUsers();
            setShowVerificationModal(false);
            setSelectedUser(null);
          }}
          onReject={() => {
            fetchUsers();
            setShowVerificationModal(false);
            setSelectedUser(null);
          }}
        />
      )}

      {/* Approval Confirmation Dialog */}
      <AnimatePresence>
        {showApprovalConfirm && userToApprove && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowApprovalConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 px-6 py-5 border-b border-amber-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">Konfirmasi Approval</h4>
                    <p className="text-sm text-gray-600">Pastikan data sudah benar</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-5">
                <div className="space-y-4">
                  <p className="text-gray-700">
                    Apakah Anda yakin ingin menyetujui akun berikut?
                  </p>

                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 space-y-2 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Nama:</span>
                      <span className="font-semibold text-gray-900">{userToApprove.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Email:</span>
                      <span className="text-sm text-gray-900">{userToApprove.email}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Role:</span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                        {userToApprove.role === 'tour-leader' ? '🧑‍✈️ Tour Leader' : userToApprove.role === 'mutawwif' ? '📿 Mutawwif' : userToApprove.role === 'brand_ambassador' ? '💠 Brand Ambassador' : '🤳 Influencer'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-xs text-amber-800">
                      ⚠️ Setelah disetujui, user akan mendapat akses penuh ke dashboard mereka dan tidak bisa dibatalkan secara otomatis.
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-200">
                <Button
                  onClick={() => {
                    setShowApprovalConfirm(false);
                    setUserToApprove(null);
                  }}
                  size="sm"
                  variant="outline"
                  className="h-10 px-6 border-gray-300 hover:bg-gray-100"
                >
                  Batal
                </Button>
                <Button
                  onClick={() => {
                    handleApproveAccount(userToApprove.id, userToApprove.email);
                    setShowApprovalConfirm(false);
                    setUserToApprove(null);
                  }}
                  size="sm"
                  className="h-10 px-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Ya, Setujui
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Detail Modal */}
      {showProfileDetail && profileDetailUser && (
        <UserProfileDetailModal
          userId={profileDetailUser.userId}
          userEmail={profileDetailUser.email}
          userRole={profileDetailUser.role as UserRole}
          userName={profileDetailUser.name}
          isOpen={showProfileDetail}
          onClose={() => {
            setShowProfileDetail(false);
            setProfileDetailUser(null);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, userId: null, email: null })}
        onConfirm={async () => {
          if (deleteConfirm.userId && deleteConfirm.email) {
            await handleDeleteUser(deleteConfirm.userId, deleteConfirm.email);
          }
        }}
        title="Delete User"
        message={`Are you sure you want to delete user ${deleteConfirm.email}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}