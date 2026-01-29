import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { ArrowLeft, Save, User } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

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
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    if (!currentUser) return;

    try {
      setLoading(true);
      const profileDoc = await getDoc(doc(db, 'agentProfiles', currentUser.uid));

      if (profileDoc.exists()) {
        const data = profileDoc.data();
        setProfile({
          userId: data.userId || currentUser.uid,
          fullName: data.fullName || '',
          email: data.email || currentUser.email || '',
          phone: data.phone || '',
          address: data.address || '',
          city: data.city || '',
          province: data.province || '',
          postalCode: data.postalCode || '',
          idNumber: data.idNumber || '',
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      } else {
        // Initialize with email
        setProfile(prev => ({
          ...prev,
          userId: currentUser.uid,
          email: currentUser.email || '',
        }));
      }
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

      const profileData = {
        userId: currentUser.uid,
        fullName: profile.fullName,
        email: profile.email,
        phone: profile.phone,
        address: profile.address,
        city: profile.city,
        province: profile.province,
        postalCode: profile.postalCode,
        idNumber: profile.idNumber,
        updatedAt: Timestamp.now(),
        createdAt: profile.createdAt ? Timestamp.fromDate(profile.createdAt) : Timestamp.now(),
      };

      await setDoc(doc(db, 'agentProfiles', currentUser.uid), profileData);

      toast.success('Profil berhasil disimpan!');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Gagal menyimpan profil');
    } finally {
      setSaving(false);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-amber-50 relative overflow-hidden">
      {/* ✨ PREMIUM BACKGROUND PATTERN - Islamic Geometric */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}></div>
      </div>

      {/* ✨ GRADIENT OVERLAY */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#C5A572]/5 via-transparent to-[#D4AF37]/5 pointer-events-none"></div>

      {/* ✨ PREMIUM HEADER with Logo */}
      <div className="relative bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-white shadow-2xl">
        {/* Header Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 0L93.3 25v50L50 100 6.7 75V25z' fill='%23ffffff' fill-opacity='0.3'/%3E%3C/svg%3E")`,
            backgroundSize: '100px 100px'
          }}></div>
        </div>

        <div className="container mx-auto px-4 py-6 relative z-10">
          <div className="flex items-center gap-6">
            <Button
              onClick={() => navigate('/agent/dashboard')}
              variant="ghost"
              className="text-white hover:bg-white/20 backdrop-blur-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>

            {/* ✨ LOGO SULTANAH - Real Image */}
            <img
              src={logoSultanah}
              alt="Sultanah Logo"
              className="h-16 w-auto drop-shadow-lg"
            />

            {/* Title */}
            <div>
              <h1 className="text-3xl font-bold mb-1 drop-shadow-lg">Profil Agen</h1>
              <p className="text-amber-100 text-sm">Lengkapi informasi profil Anda</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-3xl relative z-10">
        <Card className="bg-white/80 backdrop-blur-md shadow-xl border-t-4 border-t-amber-500">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle>Informasi Pribadi</CardTitle>
                <CardDescription>Data pribadi untuk keperluan administrasi</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">
                  Nama Lengkap <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="fullName"
                  value={profile.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder="Masukkan nama lengkap"
                  className="border-slate-300 focus:border-amber-500 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="bg-slate-100 border-slate-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  Nomor Telepon <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  value={profile.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="08123456789"
                  className="border-slate-300 focus:border-amber-500 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="idNumber">Nomor KTP/Passport</Label>
                <Input
                  id="idNumber"
                  value={profile.idNumber}
                  onChange={(e) => handleInputChange('idNumber', e.target.value)}
                  placeholder="Masukkan nomor identitas"
                  className="border-slate-300 focus:border-amber-500 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <h3 className="font-semibold text-slate-900">Alamat</h3>

              <div className="space-y-2">
                <Label htmlFor="address">Alamat Lengkap</Label>
                <Input
                  id="address"
                  value={profile.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Jalan, RT/RW, Kelurahan, Kecamatan"
                  className="border-slate-300 focus:border-amber-500 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Kota/Kabupaten</Label>
                  <Input
                    id="city"
                    value={profile.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Contoh: Jakarta"
                    className="border-slate-300 focus:border-amber-500 focus:ring-amber-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="province">Provinsi</Label>
                  <Input
                    id="province"
                    value={profile.province}
                    onChange={(e) => handleInputChange('province', e.target.value)}
                    placeholder="Contoh: DKI Jakarta"
                    className="border-slate-300 focus:border-amber-500 focus:ring-amber-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postalCode">Kode Pos</Label>
                  <Input
                    id="postalCode"
                    value={profile.postalCode}
                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                    placeholder="12345"
                    className="border-slate-300 focus:border-amber-500 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <Button
                onClick={() => navigate('/agent/dashboard')}
                variant="outline"
                className="flex-1"
              >
                Batal
              </Button>
              <Button
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
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
      </div>
    </div>
  );
};

export default AgentProfilePage;