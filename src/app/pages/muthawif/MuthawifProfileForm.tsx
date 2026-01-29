import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Book, 
  Award,
  Save,
  Loader2,
  Camera,
  IdCard,
  ArrowLeft
} from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const MuthawifProfileForm = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    dateOfBirth: '',
    placeOfBirth: '',
    // Muthawif specific fields
    certificateNumber: '',
    certificateIssuedBy: '',
    certificateYear: '',
    specialization: '', // Fiqih, Manasik, dll
    experience: '', // dalam tahun
    totalPilgrims: '', // total jamaah yang sudah dibimbing
    languages: '', // Bahasa yang dikuasai (Arab, Inggris, dll)
    education: '',
    bio: '',
    expertise: '' // Keahlian khusus
  });

  useEffect(() => {
    fetchProfile();
  }, [userProfile]);

  const fetchProfile = async () => {
    if (!userProfile?.uid) return;

    try {
      setFetching(true);
      const profileRef = doc(db, 'muthawifProfiles', userProfile.uid);
      const profileSnap = await getDoc(profileRef);

      if (profileSnap.exists()) {
        setFormData(profileSnap.data() as any);
      } else {
        // Set default from userProfile
        setFormData(prev => ({
          ...prev,
          fullName: userProfile.displayName || '',
          email: userProfile.email || ''
        }));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Gagal memuat data profil');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userProfile?.uid) {
      toast.error('User tidak ditemukan');
      return;
    }

    setLoading(true);

    try {
      const profileRef = doc(db, 'muthawifProfiles', userProfile.uid);
      const dataToSave = {
        ...formData,
        userId: userProfile.uid,
        role: 'muthawif',
        updatedAt: new Date().toISOString()
      };

      await setDoc(profileRef, dataToSave, { merge: true });

      toast.success('✅ Profil Muthawif berhasil disimpan!');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Gagal menyimpan profil');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Button
            onClick={() => navigate('/muthawif-dashboard')}
            variant="outline"
            className="border-2 border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white hover:border-[#D4AF37] transition-all shadow-md hover:shadow-lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Dashboard
          </Button>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative bg-gradient-to-r from-[#1a1a2e] via-[#2d2d44] to-[#16213e] rounded-2xl shadow-xl p-8 mb-8 overflow-hidden"
        >
          {/* Background Image - Kaaba (subtle) */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1720549973451-018d3623b55a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrYWabiYSUyMG1lY2NhJTIwc2F1ZGklMjBhcmFiaWF8ZW58MXx8fHwxNzY3MjU4NjU5fDA&ixlib=rb-4.1.0&q=80&w=1080')`
            }}
          ></div>
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a2e]/90 via-[#2d2d44]/85 to-[#16213e]/90"></div>
          
          {/* Gold Accent Blur */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-3xl"></div>
          
          <div className="relative flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-[#D4AF37] to-[#C19B2B] rounded-full flex items-center justify-center backdrop-blur-sm shadow-lg shadow-[#D4AF37]/20">
              <User className="w-8 h-8 text-white" />
            </div>
            <div className="text-white">
              <h1 className="text-3xl font-bold">Profil Muthawif</h1>
              <p className="text-gray-300 mt-1">Lengkapi informasi profil Anda sebagai pembimbing ibadah</p>
            </div>
          </div>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Data Pribadi */}
            <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <IdCard className="w-6 h-6 text-purple-600" />
                Data Pribadi
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="fullName" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Nama Lengkap *
                  </Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    placeholder="Nama lengkap Anda"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email *
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    No. Telepon *
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    placeholder="08xxxxxxxxxx"
                  />
                </div>

                <div>
                  <Label htmlFor="dateOfBirth">Tanggal Lahir</Label>
                  <Input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <Label htmlFor="placeOfBirth">Tempat Lahir</Label>
                  <Input
                    id="placeOfBirth"
                    name="placeOfBirth"
                    value={formData.placeOfBirth}
                    onChange={handleChange}
                    placeholder="Kota tempat lahir"
                  />
                </div>

                <div>
                  <Label htmlFor="city" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Kota
                  </Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Kota domisili"
                  />
                </div>

                <div>
                  <Label htmlFor="province">Provinsi</Label>
                  <Input
                    id="province"
                    name="province"
                    value={formData.province}
                    onChange={handleChange}
                    placeholder="Provinsi"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="address">Alamat Lengkap</Label>
                  <Textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Alamat lengkap"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Sertifikasi & Keahlian */}
            <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Award className="w-6 h-6 text-purple-600" />
                Sertifikasi & Keahlian Muthawif
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="certificateNumber">No. Sertifikat Muthawif *</Label>
                  <Input
                    id="certificateNumber"
                    name="certificateNumber"
                    value={formData.certificateNumber}
                    onChange={handleChange}
                    required
                    placeholder="Nomor sertifikat"
                  />
                </div>

                <div>
                  <Label htmlFor="certificateIssuedBy">Dikeluarkan Oleh *</Label>
                  <Input
                    id="certificateIssuedBy"
                    name="certificateIssuedBy"
                    value={formData.certificateIssuedBy}
                    onChange={handleChange}
                    required
                    placeholder="Kemenag/Lembaga"
                  />
                </div>

                <div>
                  <Label htmlFor="certificateYear">Tahun Sertifikat *</Label>
                  <Input
                    id="certificateYear"
                    name="certificateYear"
                    type="number"
                    value={formData.certificateYear}
                    onChange={handleChange}
                    required
                    placeholder="2020"
                  />
                </div>

                <div>
                  <Label htmlFor="education">Pendidikan Terakhir *</Label>
                  <Input
                    id="education"
                    name="education"
                    value={formData.education}
                    onChange={handleChange}
                    required
                    placeholder="S1 Syariah, dll"
                  />
                </div>

                <div>
                  <Label htmlFor="specialization">Spesialisasi *</Label>
                  <Input
                    id="specialization"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    required
                    placeholder="Fiqih, Manasik, dll"
                  />
                </div>

                <div>
                  <Label htmlFor="experience">Pengalaman (Tahun) *</Label>
                  <Input
                    id="experience"
                    name="experience"
                    type="number"
                    value={formData.experience}
                    onChange={handleChange}
                    required
                    placeholder="5"
                  />
                </div>

                <div>
                  <Label htmlFor="totalPilgrims">Total Jamaah Dibimbing *</Label>
                  <Input
                    id="totalPilgrims"
                    name="totalPilgrims"
                    type="number"
                    value={formData.totalPilgrims}
                    onChange={handleChange}
                    required
                    placeholder="500"
                  />
                </div>

                <div>
                  <Label htmlFor="languages">Bahasa yang Dikuasai *</Label>
                  <Input
                    id="languages"
                    name="languages"
                    value={formData.languages}
                    onChange={handleChange}
                    required
                    placeholder="Arab, Inggris, Indonesia"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="expertise">Keahlian Khusus</Label>
                  <Textarea
                    id="expertise"
                    name="expertise"
                    value={formData.expertise}
                    onChange={handleChange}
                    placeholder="Misal: Ahli dalam membimbing ibadah umrah, menguasai doa-doa haji, dll"
                    rows={3}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="bio">Biodata Singkat</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Ceritakan tentang diri Anda sebagai Muthawif..."
                    rows={4}
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 px-8 py-6 text-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Simpan Profil
                  </>
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default MuthawifProfileForm;