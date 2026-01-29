import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Award, 
  Calendar,
  Save,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Building,
  Globe,
  Users,
  FileText,
  Camera,
  Briefcase
} from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';

interface ProfileFormData {
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

const TourLeaderProfileForm = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    fullName: '',
    email: '',
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
  });

  useEffect(() => {
    if (userProfile?.uid) {
      fetchProfileData();
    }
  }, [userProfile]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const profileRef = doc(db, 'tourLeaderProfiles', userProfile!.uid);
      const profileSnap = await getDoc(profileRef);

      if (profileSnap.exists()) {
        const data = profileSnap.data();
        setFormData({
          fullName: data.fullName || userProfile?.displayName || '',
          email: data.email || userProfile?.email || '',
          phoneNumber: data.phoneNumber || '',
          whatsappNumber: data.whatsappNumber || '',
          address: data.address || '',
          city: data.city || '',
          province: data.province || '',
          postalCode: data.postalCode || '',
          certificateNumber: data.certificateNumber || '',
          licenseNumber: data.licenseNumber || '',
          experience: data.experience || '',
          languages: data.languages || '',
          education: data.education || '',
          specialization: data.specialization || '',
          totalTrips: data.totalTrips || '',
          totalPilgrims: data.totalPilgrims || '',
          emergencyContact: data.emergencyContact || '',
          emergencyPhone: data.emergencyPhone || '',
          bloodType: data.bloodType || '',
          bio: data.bio || ''
        });
      } else {
        // Initialize with user data
        setFormData(prev => ({
          ...prev,
          fullName: userProfile?.displayName || '',
          email: userProfile?.email || ''
        }));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Gagal memuat profil');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.fullName || !formData.email || !formData.phoneNumber) {
      toast.error('Mohon lengkapi data wajib', {
        description: 'Nama lengkap, email, dan nomor telepon harus diisi'
      });
      return;
    }

    try {
      setSaving(true);

      const profileRef = doc(db, 'tourLeaderProfiles', userProfile!.uid);
      const profileData = {
        ...formData,
        userId: userProfile!.uid,
        role: 'tour-leader',
        updatedAt: serverTimestamp()
      };

      await setDoc(profileRef, profileData, { merge: true });

      toast.success('✅ Profil Berhasil Disimpan!', {
        description: 'Data profil Tour Leader Anda telah diperbarui'
      });

      // Navigate back to dashboard
      setTimeout(() => {
        navigate('/tour-leader-dashboard');
      }, 1500);

    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast.error('❌ Gagal Menyimpan Profil', {
        description: error?.message || 'Terjadi kesalahan saat menyimpan data'
      });
    } finally {
      setSaving(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-[#D4AF37]/5 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            onClick={() => navigate('/tour-leader-dashboard')}
            className="mb-4 bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Dashboard
          </Button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#C19B2B] flex items-center justify-center shadow-lg">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#D4AF37] to-[#C19B2B] bg-clip-text text-transparent">
                Profil Tour Leader
              </h1>
              <p className="text-gray-600 mt-1">Lengkapi informasi profil profesional Anda</p>
            </div>
          </div>
        </motion.div>

        {/* Info Alert */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-blue-900 mb-1">Informasi Penting</h3>
                  <p className="text-sm text-blue-800">
                    Data profil ini akan <strong>ditampilkan ke Muthawif dan Jamaah</strong> untuk memudahkan koordinasi selama perjalanan umrah. 
                    Pastikan nomor telepon dan WhatsApp yang Anda masukkan aktif dan bisa dihubungi.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Data Pribadi */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-2 border-gray-200 shadow-lg">
              <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100/50">
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-[#D4AF37]" />
                  Data Pribadi
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nama Lengkap <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#D4AF37] focus:outline-none transition-colors"
                      placeholder="Masukkan nama lengkap"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#D4AF37] focus:outline-none transition-colors"
                      placeholder="email@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nomor Telepon <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#D4AF37] focus:outline-none transition-colors"
                      placeholder="08123456789"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nomor WhatsApp
                    </label>
                    <input
                      type="tel"
                      name="whatsappNumber"
                      value={formData.whatsappNumber}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#D4AF37] focus:outline-none transition-colors"
                      placeholder="08123456789"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Alamat Lengkap
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#D4AF37] focus:outline-none transition-colors"
                      placeholder="Jalan, nomor rumah, RT/RW"
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Kota/Kabupaten
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#D4AF37] focus:outline-none transition-colors"
                      placeholder="Nama kota"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Provinsi
                    </label>
                    <input
                      type="text"
                      name="province"
                      value={formData.province}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#D4AF37] focus:outline-none transition-colors"
                      placeholder="Nama provinsi"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Golongan Darah
                    </label>
                    <select
                      name="bloodType"
                      value={formData.bloodType}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#D4AF37] focus:outline-none transition-colors"
                    >
                      <option value="">Pilih golongan darah</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="AB">AB</option>
                      <option value="O">O</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Data Profesional */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-2 border-gray-200 shadow-lg">
              <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-amber-50 to-amber-100/50">
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-[#D4AF37]" />
                  Data Profesional
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nomor Sertifikat Tour Leader
                    </label>
                    <input
                      type="text"
                      name="certificateNumber"
                      value={formData.certificateNumber}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#D4AF37] focus:outline-none transition-colors"
                      placeholder="No. Sertifikat"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nomor Lisensi
                    </label>
                    <input
                      type="text"
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#D4AF37] focus:outline-none transition-colors"
                      placeholder="No. Lisensi"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Pengalaman (Tahun)
                    </label>
                    <input
                      type="number"
                      name="experience"
                      value={formData.experience}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#D4AF37] focus:outline-none transition-colors"
                      placeholder="5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Bahasa yang Dikuasai
                    </label>
                    <input
                      type="text"
                      name="languages"
                      value={formData.languages}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#D4AF37] focus:outline-none transition-colors"
                      placeholder="Indonesia, Arab, Inggris"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Pendidikan Terakhir
                    </label>
                    <input
                      type="text"
                      name="education"
                      value={formData.education}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#D4AF37] focus:outline-none transition-colors"
                      placeholder="S1 Manajemen Haji & Umrah"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Spesialisasi
                    </label>
                    <input
                      type="text"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#D4AF37] focus:outline-none transition-colors"
                      placeholder="Umrah Premium, Umrah Reguler"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Total Trip yang Dipimpin
                    </label>
                    <input
                      type="number"
                      name="totalTrips"
                      value={formData.totalTrips}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#D4AF37] focus:outline-none transition-colors"
                      placeholder="50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Total Jamaah yang Dipimpin
                    </label>
                    <input
                      type="number"
                      name="totalPilgrims"
                      value={formData.totalPilgrims}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#D4AF37] focus:outline-none transition-colors"
                      placeholder="1000"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Bio / Deskripsi Singkat
                    </label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#D4AF37] focus:outline-none transition-colors"
                      placeholder="Ceritakan sedikit tentang pengalaman dan keahlian Anda sebagai Tour Leader..."
                    ></textarea>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Kontak Darurat */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-2 border-gray-200 shadow-lg">
              <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-red-50 to-red-100/50">
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-red-600" />
                  Kontak Darurat
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nama Kontak Darurat
                    </label>
                    <input
                      type="text"
                      name="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#D4AF37] focus:outline-none transition-colors"
                      placeholder="Nama keluarga/kerabat"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nomor Telepon Darurat
                    </label>
                    <input
                      type="tel"
                      name="emergencyPhone"
                      value={formData.emergencyPhone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#D4AF37] focus:outline-none transition-colors"
                      placeholder="08123456789"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-end gap-4"
          >
            <Button
              type="button"
              onClick={() => navigate('/tour-leader-dashboard')}
              className="px-8 py-3 bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="px-8 py-3 bg-gradient-to-r from-[#D4AF37] to-[#C19B2B] hover:from-[#C19B2B] hover:to-[#D4AF37] text-white shadow-lg hover:shadow-xl transition-all"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Simpan Profil
                </>
              )}
            </Button>
          </motion.div>
        </form>
      </div>
    </div>
  );
};

export default TourLeaderProfileForm;
