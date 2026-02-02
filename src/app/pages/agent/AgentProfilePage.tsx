import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { ArrowLeft, Save, User, Crown, LogOut } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../components/ui/alert-dialog';

// ✅ LOGO: Genuine Sultanah Logo
const logoSultanah = '/images/logo.png';

interface AgentProfile {
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  idNumber: string; // KTP/Passport
  createdAt: Date;
  updatedAt: Date;
}

const AgentProfilePage: React.FC = () => {
  const { currentUser, userProfile, updateUserProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [profile, setProfile] = useState<AgentProfile>({
    userId: '',
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    idNumber: '',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  useEffect(() => {
    if (currentUser) {
      loadProfile();
    }
  }, [currentUser]);

  const loadProfile = async () => {
    if (!userProfile) return;

    try {
      setLoading(true);
      // ✅ Use centralized userProfile from useAuth
      setProfile({
        userId: userProfile.uid || '',
        fullName: userProfile.identityInfo?.fullName || '',
        email: userProfile.email || '',
        phone: userProfile.phoneNumber || '',
        address: userProfile.identityInfo?.streetAddress || '',
        city: userProfile.identityInfo?.city || '',
        province: userProfile.identityInfo?.state || '',
        postalCode: userProfile.identityInfo?.postalCode || '',
        idNumber: userProfile.identityInfo?.idNumber || '',
        createdAt: userProfile.createdAt ? new Date(userProfile.createdAt) : new Date(),
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Gagal memuat profil');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof AgentProfile, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;

    // Validation
    if (!profile.fullName || !profile.phone) {
      toast.error('Nama lengkap dan nomor telepon wajib diisi');
      return;
    }

    try {
      setSaving(true);

      setSaving(true);

      await updateUserProfile({
        phoneNumber: profile.phone,
        identityInfo: {
          fullName: profile.fullName,
          idNumber: profile.idNumber,
          streetAddress: profile.address,
          city: profile.city,
          state: profile.province,
          postalCode: profile.postalCode,
        },
        profileComplete: true
      } as any);

      toast.success('Profil berhasil disimpan!');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Gagal menyimpan profil');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Berhasil logout');
      navigate('/');
    } catch (error) {
      toast.error('Gagal logout');
    }
  };

  const getRoleTitle = () => {
    switch (userProfile?.role) {
      case 'affiliator':
        return 'Affiliator';
      case 'influencer':
        return 'Influencer';
      case 'agen':
        return 'Agen Syiar';
      case 'brand_ambassador':
        return 'Brand Ambassador';
      default:
        return 'Marketing Partner';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Memuat profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Beautiful Mecca Background Image - Same as Dashboard */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(/images/mecca-background.jpg)`,
          zIndex: 0
        }}
      />
      {/* Dark overlay for better text contrast */}
      <div className="fixed inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" style={{ zIndex: 1 }} />

      {/* Content Container */}
      <div className="relative" style={{ zIndex: 2 }}>
        {/* Premium Glassmorphism Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white/10 backdrop-blur-xl border-b border-white/20 shadow-2xl sticky top-0"
          style={{ zIndex: 50 }}>
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-5 md:py-6">
            <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
              <Button
                onClick={() => navigate('/agent/dashboard')}
                variant="ghost"
                className="text-white hover:bg-white/20 backdrop-blur-sm p-2 sm:p-3">
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>

              {/* ✨ LOGO SULTANAH */}
              <img
                src={logoSultanah}
                alt="Sultanah Logo"
                className="h-12 sm:h-14 md:h-16 w-auto drop-shadow-lg"
              />

              {/* Title */}
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white drop-shadow-lg flex items-center gap-2">
                  <Crown className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-[#D4AF37]" />
                  Profil {getRoleTitle()}
                </h1>
                <p className="text-white/90 text-xs sm:text-sm hidden sm:block">Lengkapi informasi profil Anda</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8 md:py-12">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}>
            <Card className="bg-white/10 backdrop-blur-2xl shadow-2xl border border-white/20 text-white">
              <CardHeader className="border-b border-white/10 pb-4 sm:pb-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#FFD700] flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white text-lg sm:text-xl md:text-2xl">Informasi Pribadi</CardTitle>
                    <CardDescription className="text-white/70 text-xs sm:text-sm">Data pribadi untuk keperluan administrasi</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6 pt-4 sm:pt-6 px-4 sm:px-6 pb-6 sm:pb-8">
                {/* Personal Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-white text-sm sm:text-base">
                      Nama Lengkap <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="fullName"
                      value={profile.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      placeholder="Masukkan nama lengkap"
                      className="bg-white/20 border-white/30 text-white placeholder:text-white/50 focus:bg-white/30 focus:border-[#D4AF37] transition-all text-sm sm:text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white text-sm sm:text-base">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      disabled
                      className="bg-white/10 border-white/20 text-white/70 cursor-not-allowed text-sm sm:text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-white text-sm sm:text-base">
                      Nomor Telepon <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="08123456789"
                      className="bg-white/20 border-white/30 text-white placeholder:text-white/50 focus:bg-white/30 focus:border-[#D4AF37] transition-all text-sm sm:text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="idNumber" className="text-white text-sm sm:text-base">Nomor KTP/Passport</Label>
                    <Input
                      id="idNumber"
                      value={profile.idNumber}
                      onChange={(e) => handleInputChange('idNumber', e.target.value)}
                      placeholder="Masukkan nomor identitas"
                      className="bg-white/20 border-white/30 text-white placeholder:text-white/50 focus:bg-white/30 focus:border-[#D4AF37] transition-all text-sm sm:text-base"
                    />
                  </div>
                </div>

                {/* Address Information */}
                <div className="space-y-3 sm:space-y-4 pt-4 sm:pt-6 border-t border-white/10">
                  <h3 className="font-semibold text-white text-base sm:text-lg">Alamat</h3>

                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-white text-sm sm:text-base">Alamat Lengkap</Label>
                    <Input
                      id="address"
                      value={profile.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Jalan, RT/RW, Kelurahan, Kecamatan"
                      className="bg-white/20 border-white/30 text-white placeholder:text-white/50 focus:bg-white/30 focus:border-[#D4AF37] transition-all text-sm sm:text-base"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-white text-sm sm:text-base">Kota/Kabupaten</Label>
                      <Input
                        id="city"
                        value={profile.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        placeholder="Contoh: Jakarta"
                        className="bg-white/20 border-white/30 text-white placeholder:text-white/50 focus:bg-white/30 focus:border-[#D4AF37] transition-all text-sm sm:text-base"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="province" className="text-white text-sm sm:text-base">Provinsi</Label>
                      <Input
                        id="province"
                        value={profile.province}
                        onChange={(e) => handleInputChange('province', e.target.value)}
                        placeholder="Contoh: DKI Jakarta"
                        className="bg-white/20 border-white/30 text-white placeholder:text-white/50 focus:bg-white/30 focus:border-[#D4AF37] transition-all text-sm sm:text-base"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="postalCode" className="text-white text-sm sm:text-base">Kode Pos</Label>
                      <Input
                        id="postalCode"
                        value={profile.postalCode}
                        onChange={(e) => handleInputChange('postalCode', e.target.value)}
                        placeholder="12345"
                        className="bg-white/20 border-white/30 text-white placeholder:text-white/50 focus:bg-white/30 focus:border-[#D4AF37] transition-all text-sm sm:text-base"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 sm:pt-6 border-t border-white/10">
                  <Button
                    onClick={() => navigate('/agent/dashboard')}
                    variant="outline"
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm text-sm sm:text-base py-2 sm:py-3"
                  >
                    Batal
                  </Button>
                  <Button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex-1 bg-gradient-to-r from-[#D4AF37] to-[#FFD700] hover:from-[#C5A572] hover:to-[#D4AF37] text-white border-0 shadow-lg text-sm sm:text-base py-2 sm:py-3"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Simpan Profil
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Logout Section */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-6 sm:mt-8">
              <Button
                onClick={() => setShowLogoutDialog(true)}
                variant="outline"
                className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30 backdrop-blur-sm py-6 sm:py-8 rounded-2xl flex items-center justify-center gap-3 text-lg font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]">
                <LogOut className="w-5 h-5 sm:w-6 sm:h-6" />
                Keluar dari Akun
              </Button>
            </motion.div>
          </motion.div>
        </div>

        {/* Logout Confirmation */}
        <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
          <AlertDialogContent className="bg-slate-900/90 backdrop-blur-xl border-white/10 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle>Konfirmasi Logout</AlertDialogTitle>
              <AlertDialogDescription className="text-white/70">
                Apakah Anda yakin ingin keluar dari akun? Anda perlu login kembali untuk mengakses dashboard.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-white/10 border-white/20 text-white hover:bg-white/20">Batal</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout} className="bg-red-500 hover:bg-red-600 border-0">
                Ya, Keluar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default AgentProfilePage;