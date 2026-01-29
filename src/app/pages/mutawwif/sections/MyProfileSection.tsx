import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Award,
  Book,
  Languages,
  Briefcase,
  Image as ImageIcon,
  Save,
  Edit3,
  CheckCircle
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { useAuth } from '../../../../contexts/AuthContext';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../../config/firebase';
import { toast } from 'sonner';
import { compressImage, validateImageFile } from '../../../../utils/imageCompression';

interface MutawwifProfile {
  userId: string;
  displayName: string;
  email: string;
  phoneNumber: string;
  photoURL?: string;
  bio?: string;
  address?: string;
  birthDate?: string;
  gender?: string;
  expertise?: string[];
  languages?: string[];
  certifications?: string;
  experience?: string;
  education?: string;
  specialization?: string;
  isPublic: boolean;
  updatedAt: any;
}

const MyProfileSection: React.FC = () => {
  const { userProfile } = useAuth();
  const [profile, setProfile] = useState<MutawwifProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    phoneNumber: '',
    photoURL: '',
    bio: '',
    address: '',
    birthDate: '',
    gender: 'male',
    expertise: [] as string[],
    languages: [] as string[],
    certifications: '',
    experience: '',
    education: '',
    specialization: '',
    isPublic: true,
  });

  useEffect(() => {
    fetchProfile();
  }, [userProfile?.id]);

  const fetchProfile = async () => {
    if (!userProfile?.id) return;

    try {
      setLoading(true);
      
      // Fetch from user's own document
      const userRef = doc(db, 'users', userProfile.id);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        const data = userData.mutawwifProfile || {};
        
        setFormData({
          displayName: userData.displayName || userProfile.displayName || '',
          phoneNumber: userData.phoneNumber || userProfile.phoneNumber || '',
          photoURL: data.photoURL || userData.photoURL || '',
          bio: data.bio || '',
          address: data.address || '',
          birthDate: data.birthDate || '',
          gender: data.gender || 'male',
          expertise: data.expertise || [],
          languages: data.languages || [],
          certifications: data.certifications || '',
          experience: data.experience || '',
          education: data.education || '',
          specialization: data.specialization || '',
          isPublic: data.isPublic !== false,
        });

        if (data.displayName) {
          setProfile({
            userId: userProfile.id,
            email: userData.email || userProfile.email || '',
            displayName: data.displayName || userData.displayName || '',
            phoneNumber: data.phoneNumber || userData.phoneNumber || '',
            photoURL: data.photoURL || '',
            bio: data.bio || '',
            address: data.address || '',
            birthDate: data.birthDate || '',
            gender: data.gender || '',
            expertise: data.expertise || [],
            languages: data.languages || [],
            certifications: data.certifications || '',
            experience: data.experience || '',
            education: data.education || '',
            specialization: data.specialization || '',
            isPublic: data.isPublic !== false,
            updatedAt: data.updatedAt,
          });
        }
      } else {
        // Initialize with default data from userProfile
        setFormData({
          ...formData,
          displayName: userProfile.displayName || '',
          phoneNumber: userProfile.phoneNumber || '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Gagal memuat profil');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      validateImageFile(file);
      const compressed = await compressImage(file, 400, 0.85);
      setFormData({ ...formData, photoURL: compressed });
      toast.success('Foto berhasil diupload');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSave = async () => {
    if (!userProfile?.id) return;

    try {
      setSaving(true);

      const profileData = {
        displayName: formData.displayName,
        phoneNumber: formData.phoneNumber,
        photoURL: formData.photoURL,
        bio: formData.bio,
        address: formData.address,
        birthDate: formData.birthDate,
        gender: formData.gender,
        expertise: formData.expertise,
        languages: formData.languages,
        certifications: formData.certifications,
        experience: formData.experience,
        education: formData.education,
        specialization: formData.specialization,
        isPublic: formData.isPublic,
        updatedAt: Timestamp.now(),
      };

      // Save to user document under mutawwifProfile field
      const userRef = doc(db, 'users', userProfile.id);
      await setDoc(userRef, {
        displayName: formData.displayName,
        phoneNumber: formData.phoneNumber,
        photoURL: formData.photoURL,
        mutawwifProfile: profileData,
      }, { merge: true });

      setProfile({
        userId: userProfile.id,
        email: userProfile.email || '',
        ...profileData,
      });
      
      setIsEditing(false);
      toast.success('Profil berhasil disimpan!');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Gagal menyimpan profil');
    } finally {
      setSaving(false);
    }
  };

  const addExpertise = (value: string) => {
    if (value && !formData.expertise.includes(value)) {
      setFormData({ ...formData, expertise: [...formData.expertise, value] });
    }
  };

  const removeExpertise = (value: string) => {
    setFormData({ 
      ...formData, 
      expertise: formData.expertise.filter(e => e !== value) 
    });
  };

  const addLanguage = (value: string) => {
    if (value && !formData.languages.includes(value)) {
      setFormData({ ...formData, languages: [...formData.languages, value] });
    }
  };

  const removeLanguage = (value: string) => {
    setFormData({ 
      ...formData, 
      languages: formData.languages.filter(l => l !== value) 
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-16 h-16 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-8 border border-gray-200 shadow-lg">
        <div className="flex items-start gap-8">
          {/* Photo Section */}
          <div className="relative group">
            {formData.photoURL ? (
              <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-[#D4AF37] shadow-xl">
                <img 
                  src={formData.photoURL} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-[#C5A572] to-[#D4AF37] flex items-center justify-center border-4 border-[#D4AF37] shadow-xl">
                <User className="w-16 h-16 text-white" />
              </div>
            )}
            
            {isEditing && (
              <label className="absolute inset-0 bg-black/60 rounded-3xl flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                <ImageIcon className="w-8 h-8 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Info Section */}
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <Label>Nama Lengkap *</Label>
                  <Input
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    placeholder="Masukkan nama lengkap"
                    className="rounded-xl"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Email</Label>
                    <Input
                      value={userProfile?.email || ''}
                      disabled
                      className="rounded-xl bg-gray-100"
                    />
                  </div>
                  <div>
                    <Label>No. Telepon *</Label>
                    <Input
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      placeholder="+62"
                      className="rounded-xl"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">{profile?.displayName || 'Nama Belum Diisi'}</h3>
                <div className="flex flex-wrap gap-4 text-gray-600">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#D4AF37]" />
                    <span>{userProfile?.email}</span>
                  </div>
                  {profile?.phoneNumber && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-[#D4AF37]" />
                      <span>{profile.phoneNumber}</span>
                    </div>
                  )}
                </div>
                {profile?.bio && (
                  <p className="mt-4 text-gray-700 leading-relaxed">{profile.bio}</p>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div>
            {isEditing ? (
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setIsEditing(false);
                    fetchProfile();
                  }}
                  variant="outline"
                  className="rounded-xl"
                >
                  Batal
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-gradient-to-r from-[#C5A572] to-[#D4AF37] text-white rounded-xl shadow-lg"
                >
                  {saving ? 'Menyimpan...' : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Simpan
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-gradient-to-r from-[#C5A572] to-[#D4AF37] text-white rounded-xl shadow-lg"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Profil
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Information */}
      {isEditing ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Bio */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-md">
              <Label className="flex items-center gap-2 mb-3">
                <User className="w-5 h-5 text-[#D4AF37]" />
                Bio Singkat
              </Label>
              <Textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Ceritakan tentang diri Anda..."
                rows={4}
                className="rounded-xl"
              />
            </div>

            {/* Personal Info */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-md space-y-4">
              <h4 className="font-bold text-gray-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#D4AF37]" />
                Informasi Pribadi
              </h4>
              <div>
                <Label>Alamat</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Alamat lengkap"
                  className="rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tanggal Lahir</Label>
                  <Input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label>Jenis Kelamin</Label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  >
                    <option value="male">Laki-laki</option>
                    <option value="female">Perempuan</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Education */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-md">
              <Label className="flex items-center gap-2 mb-3">
                <Book className="w-5 h-5 text-[#D4AF37]" />
                Pendidikan
              </Label>
              <Textarea
                value={formData.education}
                onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                placeholder="Riwayat pendidikan..."
                rows={3}
                className="rounded-xl"
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Experience */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-md">
              <Label className="flex items-center gap-2 mb-3">
                <Briefcase className="w-5 h-5 text-[#D4AF37]" />
                Pengalaman
              </Label>
              <Textarea
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                placeholder="Pengalaman sebagai mutawwif..."
                rows={4}
                className="rounded-xl"
              />
            </div>

            {/* Specialization */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-md">
              <Label className="flex items-center gap-2 mb-3">
                <Award className="w-5 h-5 text-[#D4AF37]" />
                Spesialisasi
              </Label>
              <Input
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                placeholder="Spesialisasi bimbingan"
                className="rounded-xl"
              />
            </div>

            {/* Certifications */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-md">
              <Label className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-[#D4AF37]" />
                Sertifikasi
              </Label>
              <Textarea
                value={formData.certifications}
                onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                placeholder="Sertifikasi yang dimiliki..."
                rows={3}
                className="rounded-xl"
              />
            </div>

            {/* Languages */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-md">
              <Label className="flex items-center gap-2 mb-3">
                <Languages className="w-5 h-5 text-[#D4AF37]" />
                Bahasa yang Dikuasai
              </Label>
              <div className="flex gap-2 mb-3">
                <Input
                  placeholder="Tambah bahasa..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addLanguage((e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                  className="rounded-xl"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.languages.map((lang, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-[#D4AF37]/10 text-[#D4AF37] rounded-lg text-sm font-medium flex items-center gap-2 cursor-pointer hover:bg-[#D4AF37]/20"
                    onClick={() => removeLanguage(lang)}
                  >
                    {lang}
                    <span className="text-xs">✕</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - View Mode */}
          <div className="space-y-6">
            {profile?.address && (
              <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-md">
                <h4 className="font-bold text-gray-900 flex items-center gap-2 mb-3">
                  <MapPin className="w-5 h-5 text-[#D4AF37]" />
                  Alamat
                </h4>
                <p className="text-gray-700">{profile.address}</p>
              </div>
            )}

            {profile?.education && (
              <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-md">
                <h4 className="font-bold text-gray-900 flex items-center gap-2 mb-3">
                  <Book className="w-5 h-5 text-[#D4AF37]" />
                  Pendidikan
                </h4>
                <p className="text-gray-700 whitespace-pre-line">{profile.education}</p>
              </div>
            )}

            {profile?.languages && profile.languages.length > 0 && (
              <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-md">
                <h4 className="font-bold text-gray-900 flex items-center gap-2 mb-3">
                  <Languages className="w-5 h-5 text-[#D4AF37]" />
                  Bahasa yang Dikuasai
                </h4>
                <div className="flex flex-wrap gap-2">
                  {profile.languages.map((lang, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-[#D4AF37]/10 text-[#D4AF37] rounded-lg text-sm font-medium"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - View Mode */}
          <div className="space-y-6">
            {profile?.experience && (
              <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-md">
                <h4 className="font-bold text-gray-900 flex items-center gap-2 mb-3">
                  <Briefcase className="w-5 h-5 text-[#D4AF37]" />
                  Pengalaman
                </h4>
                <p className="text-gray-700 whitespace-pre-line">{profile.experience}</p>
              </div>
            )}

            {profile?.specialization && (
              <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-md">
                <h4 className="font-bold text-gray-900 flex items-center gap-2 mb-3">
                  <Award className="w-5 h-5 text-[#D4AF37]" />
                  Spesialisasi
                </h4>
                <p className="text-gray-700">{profile.specialization}</p>
              </div>
            )}

            {profile?.certifications && (
              <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-md">
                <h4 className="font-bold text-gray-900 flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-[#D4AF37]" />
                  Sertifikasi
                </h4>
                <p className="text-gray-700 whitespace-pre-line">{profile.certifications}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isEditing && !profile && (
        <div className="text-center py-20">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-28 h-28 mx-auto bg-gradient-to-br from-gray-100 to-gray-50 rounded-3xl flex items-center justify-center mb-6 shadow-inner"
          >
            <User className="w-14 h-14 text-gray-400" />
          </motion.div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">
            Profil Belum Lengkap
          </h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Lengkapi profil Anda agar jamaah dapat mengenal Anda lebih baik
          </p>
          <Button
            onClick={() => setIsEditing(true)}
            className="bg-gradient-to-r from-[#C5A572] to-[#D4AF37] text-white shadow-lg hover:shadow-xl rounded-xl px-8 py-3"
          >
            Lengkapi Profil
          </Button>
        </div>
      )}
    </div>
  );
};

export default MyProfileSection;