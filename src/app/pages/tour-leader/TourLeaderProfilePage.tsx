import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  User,
  Phone,
  Mail,
  Briefcase,
  Edit,
  ArrowLeft,
  Save,
  X,
  Shield,
  AlertCircle,
  LogOut
} from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';

interface ProfileData {
  fullName: string;
  email: string;
  phoneNumber: string;
  whatsappNumber: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  certificateNumber: string;
  licenseNumber: string;
  experience: string;
  languages: string;
  education: string;
  specialization: string;
  totalTrips: string;
  totalPilgrims: string;
  emergencyContact: string;
  emergencyPhone: string;
  bloodType: string;
  bio: string;
}

const TourLeaderProfilePage = () => {
  const { userProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [editData, setEditData] = useState<ProfileData | null>(null);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  useEffect(() => {
    if (userProfile?.uid) {
      fetchProfileData();
    }
  }, [userProfile]);

  const fetchProfileData = async () => {
    if (!userProfile?.uid) return;

    try {
      setLoading(true);
      const profileRef = doc(db, 'tourLeaderProfiles', userProfile.uid);
      const profileSnap = await getDoc(profileRef);

      if (profileSnap.exists()) {
        const data = profileSnap.data() as ProfileData;
        setProfileData(data);
        setEditData(data);
      } else {
        // Initialize with user data
        const initialData: ProfileData = {
          fullName: userProfile?.displayName || '',
          email: userProfile?.email || '',
          phoneNumber: '',
          whatsappNumber: '',
          address: '',
          city: '',
          province: '',
          postalCode: '',
          certificateNumber: '',
          licenseNumber: '',
          experience: '',
          languages: '',
          education: '',
          specialization: '',
          totalTrips: '',
          totalPilgrims: '',
          emergencyContact: '',
          emergencyPhone: '',
          bloodType: '',
          bio: ''
        };
        setProfileData(initialData);
        setEditData(initialData);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Gagal memuat profil');
    } finally {
      setLoading(false);
    }
  };
  const handleSave = async () => {
    if (!editData || !userProfile?.uid) return;

    // Validation
    if (!editData.fullName || !editData.email || !editData.phoneNumber) {
      toast.error('Mohon lengkapi data wajib', {
        description: 'Nama lengkap, email, dan nomor telepon harus diisi'
      });
      return;
    }

    try {
      setSaving(true);
      const uid = userProfile.uid;

      const profileRef = doc(db, 'tourLeaderProfiles', uid);
      const saveData = {
        ...editData,
        userId: uid,
        role: 'tour-leader',
        updatedAt: serverTimestamp()
      };

      await setDoc(profileRef, saveData, { merge: true });

      setProfileData(editData);
      setIsEditing(false);

      toast.success('✅ Profil Berhasil Disimpan!', {
        description: 'Data profil Anda telah diperbarui'
      });

    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast.error('❌ Gagal Menyimpan Profil', {
        description: error?.message || 'Terjadi kesalahan saat menyimpan data'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData(profileData);
    setIsEditing(false);
  };

  const handleChange = (field: keyof ProfileData, value: string) => {
    if (editData) {
      setEditData({
        ...editData,
        [field]: value
      });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Gagal logout');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-[#D4AF37]/5 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat profil...</p>
        </div>
      </div>
    );
  }

  const data = isEditing ? editData : profileData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-[#D4AF37]/5">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a1a2e] via-[#2d2d44] to-[#16213e] relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iI0Q0QUYzNyIgc3Ryb2tlLW9wYWNpdHk9Ii4xIi8+PC9nPjwvc3ZnPg==')] opacity-30"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#D4AF37]/20 to-transparent rounded-full blur-3xl"></div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative">
          <Button
            onClick={() => navigate('/tour-leader-dashboard')}
            className="mb-6 bg-white/10 border border-white/20 text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Dashboard
          </Button>

          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4 sm:gap-6 text-center sm:text-left">
              {/* Avatar */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#C19B2B] flex items-center justify-center shadow-xl flex-shrink-0">
                <span className="text-3xl sm:text-4xl font-bold text-white">
                  {data?.fullName?.charAt(0).toUpperCase() || 'T'}
                </span>
              </div>

              {/* Info */}
              <div className="flex flex-col items-center sm:items-start">
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">
                  {data?.fullName || 'Tour Leader'}
                </h1>
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-white/80">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="text-xs sm:text-sm">{data?.email || '-'}</span>
                  </div>
                  {data?.phoneNumber && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="text-xs sm:text-sm">{data.phoneNumber}</span>
                    </div>
                  )}
                </div>
                {data?.bio && !isEditing && (
                  <p className="text-white/70 text-xs sm:text-sm mt-1 sm:mt-2 max-w-2xl text-center sm:text-left">{data.bio}</p>
                )}
              </div>
            </div>

            {/* Edit Button */}
            {!isEditing && (
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-[#D4AF37] hover:bg-[#C19B2B] text-white w-full sm:w-auto text-xs sm:text-sm shadow-lg"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Profil
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alert Info */}
        {!profileData?.phoneNumber && !isEditing && (
          <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50 mb-6">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-amber-900 mb-1">Lengkapi Profil Anda</h3>
                  <p className="text-sm text-amber-800">
                    Mohon lengkapi informasi profil Anda agar Muthawif dan Jamaah dapat menghubungi Anda dengan mudah.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          {/* Data Pribadi */}
          <Card className="border-2 border-gray-200 shadow-lg">
            <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100/50">
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-[#D4AF37]" />
                Data Pribadi
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoField
                  label="Nama Lengkap"
                  value={data?.fullName}
                  isEditing={isEditing}
                  required
                  onChange={(val) => handleChange('fullName', val)}
                />
                <InfoField
                  label="Email"
                  value={data?.email}
                  isEditing={isEditing}
                  required
                  type="email"
                  onChange={(val) => handleChange('email', val)}
                />
                <InfoField
                  label="Nomor Telepon"
                  value={data?.phoneNumber}
                  isEditing={isEditing}
                  required
                  onChange={(val) => handleChange('phoneNumber', val)}
                />
                <InfoField
                  label="Nomor WhatsApp"
                  value={data?.whatsappNumber}
                  isEditing={isEditing}
                  onChange={(val) => handleChange('whatsappNumber', val)}
                />
                <div className="md:col-span-2">
                  <InfoField
                    label="Alamat"
                    value={data?.address}
                    isEditing={isEditing}
                    multiline
                    onChange={(val) => handleChange('address', val)}
                  />
                </div>
                <InfoField
                  label="Kota/Kabupaten"
                  value={data?.city}
                  isEditing={isEditing}
                  onChange={(val) => handleChange('city', val)}
                />
                <InfoField
                  label="Provinsi"
                  value={data?.province}
                  isEditing={isEditing}
                  onChange={(val) => handleChange('province', val)}
                />
                <InfoField
                  label="Golongan Darah"
                  value={data?.bloodType}
                  isEditing={isEditing}
                  onChange={(val) => handleChange('bloodType', val)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Data Profesional */}
          <Card className="border-2 border-gray-200 shadow-lg">
            <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-amber-50 to-amber-100/50">
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#D4AF37]" />
                Data Profesional
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoField
                  label="Nomor Sertifikat"
                  value={data?.certificateNumber}
                  isEditing={isEditing}
                  onChange={(val) => handleChange('certificateNumber', val)}
                />
                <InfoField
                  label="Nomor Lisensi"
                  value={data?.licenseNumber}
                  isEditing={isEditing}
                  onChange={(val) => handleChange('licenseNumber', val)}
                />
                <InfoField
                  label="Pengalaman (Tahun)"
                  value={data?.experience}
                  isEditing={isEditing}
                  type="number"
                  onChange={(val) => handleChange('experience', val)}
                />
                <InfoField
                  label="Bahasa yang Dikuasai"
                  value={data?.languages}
                  isEditing={isEditing}
                  placeholder="Indonesia, Arab, Inggris"
                  onChange={(val) => handleChange('languages', val)}
                />
                <InfoField
                  label="Pendidikan Terakhir"
                  value={data?.education}
                  isEditing={isEditing}
                  onChange={(val) => handleChange('education', val)}
                />
                <InfoField
                  label="Spesialisasi"
                  value={data?.specialization}
                  isEditing={isEditing}
                  placeholder="Umrah Premium, Reguler"
                  onChange={(val) => handleChange('specialization', val)}
                />
                <InfoField
                  label="Total Trip Dipimpin"
                  value={data?.totalTrips}
                  isEditing={isEditing}
                  type="number"
                  onChange={(val) => handleChange('totalTrips', val)}
                />
                <InfoField
                  label="Total Jamaah Dipimpin"
                  value={data?.totalPilgrims}
                  isEditing={isEditing}
                  type="number"
                  onChange={(val) => handleChange('totalPilgrims', val)}
                />
                <div className="md:col-span-2">
                  <InfoField
                    label="Bio / Deskripsi"
                    value={data?.bio}
                    isEditing={isEditing}
                    multiline
                    placeholder="Ceritakan pengalaman Anda sebagai Tour Leader..."
                    onChange={(val) => handleChange('bio', val)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Kontak Darurat */}
          <Card className="border-2 border-gray-200 shadow-lg">
            <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-red-50 to-red-100/50">
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-600" />
                Kontak Darurat
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoField
                  label="Nama Kontak Darurat"
                  value={data?.emergencyContact}
                  isEditing={isEditing}
                  onChange={(val) => handleChange('emergencyContact', val)}
                />
                <InfoField
                  label="Nomor Telepon Darurat"
                  value={data?.emergencyPhone}
                  isEditing={isEditing}
                  onChange={(val) => handleChange('emergencyPhone', val)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex items-center justify-end gap-4">
              <Button
                onClick={handleCancel}
                disabled={saving}
                className="px-8 py-3 bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <X className="w-4 h-4 mr-2" />
                Batal
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="px-8 py-3 bg-gradient-to-r from-[#D4AF37] to-[#C19B2B] hover:from-[#C19B2B] hover:to-[#D4AF37] text-white shadow-lg"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Simpan Perubahan
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Logout Section - At Bottom */}
          {!isEditing && (
            <div className="mt-8">
              <div className="border-t border-gray-200 pt-6">
                <Button
                  onClick={() => setShowLogoutDialog(true)}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 shadow-lg flex items-center justify-center gap-2"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </Button>
              </div>
            </div>
          )}

          {/* Logout Confirmation Dialog */}
          {showLogoutDialog && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                    <LogOut className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Konfirmasi Logout</h3>
                    <p className="text-sm text-gray-600">Apakah Anda yakin ingin keluar?</p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    onClick={() => setShowLogoutDialog(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
                  >
                    Batal
                  </Button>
                  <Button
                    onClick={handleLogout}
                    className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Ya, Logout
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// InfoField Component
interface InfoFieldProps {
  label: string;
  value?: string;
  isEditing: boolean;
  required?: boolean;
  type?: string;
  multiline?: boolean;
  placeholder?: string;
  onChange?: (value: string) => void;
}

const InfoField: React.FC<InfoFieldProps> = ({
  label,
  value,
  isEditing,
  required,
  type = 'text',
  multiline,
  placeholder,
  onChange
}) => {
  return (
    <div className="space-y-1.5 sm:space-y-2">
      <label className="block text-xs sm:text-sm font-semibold text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {isEditing ? (
        multiline ? (
          <textarea
            value={value || ''}
            onChange={(e) => onChange?.(e.target.value)}
            rows={4}
            placeholder={placeholder}
            className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:border-[#D4AF37] focus:outline-none transition-colors"
          />
        ) : (
          <input
            type={type}
            value={value || ''}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:border-[#D4AF37] focus:outline-none transition-colors"
          />
        )
      ) : (
        <div className="px-3 py-2.5 sm:px-4 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm sm:text-base text-gray-900">{value || '-'}</p>
        </div>
      )}
    </div>
  );
};

export default TourLeaderProfilePage;