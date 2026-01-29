import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // ✅ NEW
import FloatingAnnouncementWidget from '../../components/FloatingAnnouncementWidget';
import { useAuth } from '../../../contexts/AuthContext';
import { db } from '../../../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import ProfileForm from '../prospective-jamaah/ProfileForm';
import { copyToClipboard } from '../../../utils/clipboard'; // ✅ Import safe clipboard utility
import { autoCreateReferralCode } from '../../../utils/autoCreateReferralCode'; // ✅ NEW: Auto-create referral code
import ReferralListRealtime from '../../components/ReferralListRealtime'; // ✅ NEW: Real-time referral list
import ReferralBalanceCard from '../../components/ReferralBalanceCard'; // ✅ NEW: Real-time balance card
import {
  Award,
  Share2,
  LogOut,
  User,
  Calendar,
  Newspaper,
  Copy,
  CheckCircle,
  Users,
  Gift,
  Star,
  MessageCircle
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label'; // ✅ Added Label
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import ConfirmDialog from '../../components/ConfirmDialog';
import AgentUpgradeDialog from '../../components/AgentUpgradeDialog'; // ✅ NEW: Agent upgrade dialog

// ✅ FALLBACK: Beautiful Islamic gold logo from Unsplash
const sultanahLogo = '/images/logo.png';

interface AlumniDashboardProps {
  onBack?: () => void;
}

interface Referral {
  id: string;
  userId: string;
  code: string;
  totalReferrals: number;
  successfulReferrals: number;
  createdAt: any;
}

const AlumniDashboard: React.FC<AlumniDashboardProps> = () => {
  const { currentUser, userProfile, signOut } = useAuth();
  const navigate = useNavigate(); // ✅ NEW
  const [activeTab, setActiveTab] = useState<'overview' | 'referral' | 'testimonials' | 'news' | 'profile'>('overview');
  const [referralData, setReferralData] = useState<Referral | null>(null);
  const [referralLink, setReferralLink] = useState('');
  // referralDetails removed
  const [copied, setCopied] = useState(false);
  // loading removed
  // showProfileForm removed
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showAgentUpgradeDialog, setShowAgentUpgradeDialog] = useState(false); // ✅ NEW: Agent upgrade dialog

  useEffect(() => {
    if (currentUser) {
      initializeReferral();
      // fetchReferralDetails(); // Removed unused function call
      // ✅ NEW: Show agent upgrade dialog for first-time alumni (check local storage)
      const hasSeenAgentUpgrade = localStorage.getItem(`agent-upgrade-seen-${currentUser.uid}`);
      if (!hasSeenAgentUpgrade) {
        setShowAgentUpgradeDialog(true);
      }
    }
  }, [currentUser]);

  const initializeReferral = async () => {
    if (!currentUser || !userProfile?.uid) return;

    try {
      // ✅ NEW SYSTEM: Auto-create referral code using unified system
      const success = await autoCreateReferralCode(
        userProfile.uid,
        'alumni',
        userProfile.displayName || 'ALUMNI',
        userProfile.email
      );

      if (!success) {
        toast.error('Gagal menginisialisasi kode referral');
        return;
      }

      // ✅ Load referral data from alumniReferrals collection
      const referralRef = doc(db, 'alumniReferrals', userProfile.uid);
      const referralSnap = await getDoc(referralRef);

      if (referralSnap.exists()) {
        const data = referralSnap.data();
        setReferralData({
          id: referralSnap.id,
          ...data
        } as Referral);
        setReferralLink(`https://sultanah.co.id/register?ref=${data.code}`);
      } else {
        console.error('❌ Referral document not created!');
        toast.error('Gagal memuat data referral');
      }
    } catch (error) {
      console.error('Error initializing referral:', error);
      toast.error('Gagal memuat data referral');
    }
  };
  const handleCopyLink = async () => {
    const success = await copyToClipboard(referralLink);
    if (success) {
      setCopied(true);
      toast.success('Referral link copied!');
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('Failed to copy link');
    }
  };

  // ✅ Safe date formatter
  const formatDate = (dateField: any): string => {
    if (!dateField) return new Date().toLocaleDateString();

    // If Firestore Timestamp
    if (dateField.toDate && typeof dateField.toDate === 'function') {
      return dateField.toDate().toLocaleDateString();
    }

    // If Date object
    if (dateField instanceof Date) {
      return dateField.toLocaleDateString();
    }

    // If string or number
    return new Date(dateField).toLocaleDateString();
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-[#FFF9F0]">
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg overflow-hidden bg-white flex-shrink-0 shadow-md">
                <ImageWithFallback src={sultanahLogo} alt="Sultanah Travel" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold">Portal Alumni</h1>
                <p className="text-xs md:text-sm text-white/80 hidden sm:block">Selamat datang kembali, {userProfile?.displayName || 'Tamu'}</p>
              </div>
            </div>
            <Button
              onClick={() => setShowLogoutConfirm(true)}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/20 text-xs md:text-sm px-2 md:px-4"
            >
              <LogOut className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Keluar</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 bg-white shadow-sm sticky top-0 z-10 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-4 md:gap-8 min-w-max md:min-w-0">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors text-sm whitespace-nowrap ${activeTab === 'overview'
                ? 'border-[#D4AF37] text-[#D4AF37]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4" />
                <span className="hidden sm:inline">Ringkasan</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('referral')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors text-sm whitespace-nowrap ${activeTab === 'referral'
                ? 'border-[#D4AF37] text-[#D4AF37]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Program Referral</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('testimonials')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors text-sm whitespace-nowrap ${activeTab === 'testimonials'
                ? 'border-[#D4AF37] text-[#D4AF37]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Testimoni Saya</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('news')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors text-sm whitespace-nowrap ${activeTab === 'news'
                ? 'border-[#D4AF37] text-[#D4AF37]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <div className="flex items-center gap-2">
                <Newspaper className="w-4 h-4" />
                <span className="hidden sm:inline">Berita & Artikel</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors text-sm whitespace-nowrap ${activeTab === 'profile'
                ? 'border-[#D4AF37] text-[#D4AF37]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Profil Saya</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Welcome Card */}
            <Card className="border-2 border-[#D4AF37]/20 bg-gradient-to-br from-white to-[#FFF9F0]">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#D4AF37]/20 to-[#FFD700]/20 flex items-center justify-center">
                    <Award className="w-8 h-8 text-[#D4AF37]" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-2">
                      Assalamu'alaikum, {userProfile?.displayName || 'Guest'}!
                    </h2>
                    <p className="text-gray-600 mb-4">
                      Terima kasih telah menyelesaikan perjalanan umrah bersama kami! Sebagai Alumni, Anda dapat
                      mengakses program referral, berbagi testimonial, dan mendapatkan benefit spesial untuk perjalanan berikutnya.
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>Alumni since {formatDate(userProfile?.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Referrals</p>
                      <p className="text-3xl font-bold text-[#D4AF37]">{referralData?.totalReferrals || 0}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Successful Referrals</p>
                      <p className="text-3xl font-bold text-[#D4AF37]">{referralData?.successfulReferrals || 0}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Alumni Status</p>
                      <p className="text-lg font-bold text-purple-600">Verified</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                      <Star className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-2 border-[#D4AF37]/30 bg-gradient-to-br from-[#FFF9F0] to-white hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/referral')}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4AF37]/20 to-[#FFD700]/20 flex items-center justify-center">
                      <Gift className="w-6 h-6 text-[#D4AF37]" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Program Referral 🎁</h3>
                      <p className="text-sm text-gray-600">Ajak teman & dapatkan komisi!</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('testimonials')}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                      <MessageCircle className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Share Testimonial</h3>
                      <p className="text-sm text-gray-600">Ceritakan pengalaman umrah Anda</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Referral Preview */}
            <Card className="border-2 border-[#D4AF37]/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-[#D4AF37]" />
                  Your Referral Link
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    value={referralLink}
                    readOnly
                    className="flex-1 bg-gray-50 border-[#D4AF37]/30"
                  />
                  <Button
                    onClick={handleCopyLink}
                    className={`${copied
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] hover:opacity-90'
                      } text-white transition-all`}
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Link
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-sm text-gray-600 mt-3">
                  Share this link with friends to earn rewards when they book packages!
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'referral' && currentUser && (
          <div className="space-y-6">
            {/* Referral Code Card */}
            <Card className="border-2 border-[#D4AF37]/30 bg-gradient-to-br from-[#FFF9F0] to-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-[#D4AF37]" />
                  Kode Referral & Link Anda
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Referral Code Display */}
                  <div className="p-6 rounded-lg bg-gradient-to-br from-[#D4AF37]/10 to-[#FFD700]/10 border-2 border-[#D4AF37]/30">
                    <h3 className="text-sm font-semibold mb-3 text-gray-700">Kode Referral Anda</h3>
                    <div className="flex items-center justify-center p-4 bg-white rounded-lg border-2 border-dashed border-[#D4AF37]">
                      <p className="text-2xl md:text-3xl font-bold text-[#D4AF37] tracking-wider">
                        {referralData?.code || 'Loading...'}
                      </p>
                    </div>
                  </div>

                  {/* Referral Link */}
                  <div>
                    <Label className="text-sm font-semibold mb-2 block">Link Referral Anda</Label>
                    <div className="flex gap-2">
                      <Input
                        value={referralLink}
                        readOnly
                        className="flex-1 bg-gray-50 border-[#D4AF37]/30 text-sm"
                      />
                      <Button
                        onClick={handleCopyLink}
                        className={`${copied
                          ? 'bg-green-500 hover:bg-green-600'
                          : 'bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] hover:opacity-90'
                          } text-white transition-all`}
                      >
                        {copied ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* How it Works */}
                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                    <h3 className="font-semibold mb-3 text-blue-900">Cara Kerja Program Referral</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">1</div>
                        <p className="text-blue-800">Bagikan kode atau link referral Anda</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">2</div>
                        <p className="text-blue-800">Teman Anda daftar & bayar paket umrah</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">3</div>
                        <p className="text-blue-800">Admin approve pembayaran → Anda dapat komisi Rp200.000!</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ✅ NEW: Real-time Balance Card */}
            <ReferralBalanceCard
              userId={currentUser.uid}
              userRole="alumni"
            />

            {/* ✅ NEW: Real-time Referral List */}
            <ReferralListRealtime
              userId={currentUser.uid}
              userRole="alumni"
            />
          </div>
        )}

        {activeTab === 'testimonials' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-[#D4AF37]" />
                My Testimonials
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2">Bagikan Pengalaman Anda</h3>
                <p className="text-gray-600 mb-6">Bantu jamaah lain dengan berbagi pengalaman spiritual Anda</p>
                <Button
                  onClick={() => navigate('/create-testimonial')}
                  className="relative overflow-hidden bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] hover:opacity-90 text-white group px-6 py-3"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#FFD700] via-[#D4AF37] to-[#C5A572] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center gap-2">
                    <Star className="w-4 h-4 animate-pulse" />
                    <span>Buat Testimoni</span>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'news' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-[#D4AF37]" />
                News & Articles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <Newspaper className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p>News and articles feature will be available soon.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'profile' && (
          <ProfileForm
            userProfile={userProfile}
            currentUser={currentUser}
            onBack={() => setActiveTab('overview')}
          />
        )}
      </div>

      {/* Floating Announcement Widget */}
      <FloatingAnnouncementWidget userRole="alumni-jamaah" />

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleSignOut}
        title="Sign Out"
        message="Are you sure you want to sign out?"
        confirmText="Sign Out"
        cancelText="Cancel"
      />

      {/* Agent Upgrade Dialog */}
      <AgentUpgradeDialog
        open={showAgentUpgradeDialog}
        onOpenChange={setShowAgentUpgradeDialog}
        currentUser={currentUser}
        autoCreateReferralCode={async (uid, email) => {
          return await autoCreateReferralCode(uid, 'agen', userProfile?.displayName || 'Agen', email);
        }}
      />
    </div>
  );
};




export default AlumniDashboard;