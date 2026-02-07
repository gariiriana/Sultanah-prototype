import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Progress } from '../../components/ui/progress';
import { ArrowLeft, User, FileText, Phone, Upload, CheckCircle2, File, Trash2, LogOut, Heart } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'sonner';
import { processFile, formatFileSize } from '../../../utils/fileCompression';
import { AddressInput, type AddressData } from '../../components/AddressInput';
import ConfirmDialog from '../../components/ConfirmDialog';


interface ProfilePageProps {
  onBack: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onBack }) => {
  const { userProfile, updateUserProfile, signOut } = useAuth();

  const [loading, setLoading] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    field: string;
    label: string;
  }>({
    isOpen: false,
    field: '',
    label: '',
  });
  const [logoutConfirmation, setLogoutConfirmation] = useState(false);
  const [formData, setFormData] = useState({
    displayName: userProfile?.displayName || '',
    phoneNumber: userProfile?.phoneNumber || '',
    fullName: userProfile?.identityInfo?.fullName || '',
    idNumber: userProfile?.identityInfo?.idNumber || '',
    birthDate: userProfile?.identityInfo?.birthDate || '',
    address: userProfile?.identityInfo?.address || {
      country: '',
      province: '',
      city: '',
      district: '',
      village: '',
      postalCode: '',
      street: '',
    },
    passportNumber: userProfile?.travelDocuments?.passportNumber || '',
    passportExpiry: userProfile?.travelDocuments?.passportExpiry || '',
    emergencyName: userProfile?.emergencyContact?.name || '',
    emergencyPhone: userProfile?.emergencyContact?.phone || '',
    emergencyRelationship: userProfile?.emergencyContact?.relationship || '',
    medicalConditions: (userProfile as any)?.medicalInfo?.conditions || '',
    medications: (userProfile as any)?.medicalInfo?.medications || '',
    gender: (userProfile as any)?.medicalInfo?.gender || '',
    bloodType: (userProfile as any)?.medicalInfo?.bloodType || '',
    specialNotes: (userProfile as any)?.medicalInfo?.specialNotes || '',
  });

  // Sync formData when userProfile changes
  React.useEffect(() => {
    if (userProfile) {
      setFormData({
        displayName: userProfile.displayName || '',
        phoneNumber: userProfile.phoneNumber || '',
        fullName: userProfile.identityInfo?.fullName || '',
        idNumber: userProfile.identityInfo?.idNumber || '',
        birthDate: userProfile.identityInfo?.birthDate || '',
        address: userProfile.identityInfo?.address || {
          country: '',
          province: '',
          city: '',
          district: '',
          village: '',
          postalCode: '',
          street: '',
        },
        passportNumber: userProfile.travelDocuments?.passportNumber || '',
        passportExpiry: userProfile.travelDocuments?.passportExpiry || '',
        emergencyName: userProfile.emergencyContact?.name || '',
        emergencyPhone: userProfile.emergencyContact?.phone || '',
        emergencyRelationship: userProfile.emergencyContact?.relationship || '',
        medicalConditions: (userProfile as any).medicalInfo?.conditions || '',
        medications: (userProfile as any).medicalInfo?.medications || '',
        gender: (userProfile as any).medicalInfo?.gender || '',
        bloodType: (userProfile as any).medicalInfo?.bloodType || '',
        specialNotes: (userProfile as any).medicalInfo?.specialNotes || '',
      });
    }
  }, [userProfile]);

  const calculateProfileCompletion = () => {
    const basicFields = [
      formData.displayName,
      formData.phoneNumber,
      formData.fullName,
      formData.idNumber,
      formData.birthDate,
      formData.passportNumber,
      formData.passportExpiry,
      formData.emergencyName,
      formData.emergencyPhone,
      formData.emergencyRelationship,
      formData.medicalConditions,
      formData.medications,
      formData.gender,
      formData.bloodType,
    ];

    const addressData = formData.address as AddressData;
    const addressComplete = addressData &&
      typeof addressData === 'object' &&
      addressData.country &&
      addressData.province &&
      addressData.city &&
      addressData.street;

    const requiredDocs = [
      userProfile?.travelDocuments?.passportPhoto,
      userProfile?.travelDocuments?.ktpPhoto,
      userProfile?.travelDocuments?.kkPhoto,
      userProfile?.travelDocuments?.birthCertificate,
      userProfile?.travelDocuments?.umrahVisa,
      userProfile?.travelDocuments?.flightTicket,
      userProfile?.travelDocuments?.vaccinationCertificate,
    ];

    const filledBasicFields = basicFields.filter(field => field && field.toString().trim() !== '').length;
    const totalFields = basicFields.length + 1 + requiredDocs.length;
    const addressCount = addressComplete ? 1 : 0;
    const docsCount = requiredDocs.filter(doc => !!doc).length;

    return Math.round(((filledBasicFields + addressCount + docsCount) / totalFields) * 100);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const processedFile = await processFile(file);
      await updateUserProfile({ [field]: processedFile } as any);
      toast.success('File uploaded successfully');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const openDeleteConfirmation = (field: string, label: string) => {
    setDeleteConfirmation({ isOpen: true, field, label });
  };

  const closeDeleteConfirmation = () => {
    setDeleteConfirmation({ isOpen: false, field: '', label: '' });
  };

  const confirmDeleteFile = async () => {
    const { field, label } = deleteConfirmation;
    try {
      await updateUserProfile({ [field]: null } as any);
      toast.success(`${label} deleted successfully`);
      closeDeleteConfirmation();
    } catch (error: any) {
      toast.error('Failed to delete file');
    }
  };

  const renderFilePreview = (fileData: any, label: string) => {
    if (!fileData) return null;

    const labelToField: { [key: string]: string } = {
      'Passport': 'travelDocuments.passportPhoto',
      'KTP': 'travelDocuments.ktpPhoto',
      'KK': 'travelDocuments.kkPhoto',
      'Birth Certificate': 'travelDocuments.birthCertificate',
      'Marriage Certificate': 'travelDocuments.marriageCertificate',
      'Umrah Visa': 'travelDocuments.umrahVisa',
      'Flight Ticket': 'travelDocuments.flightTicket',
      'Vaccination Certificate': 'travelDocuments.vaccinationCertificate',
    };

    const isNewFormat = typeof fileData === 'object' && fileData.base64;
    const base64 = isNewFormat ? fileData.base64 : fileData;
    const fileName = isNewFormat ? fileData.fileName : `${label.toLowerCase().replace(' ', '-')}.jpg`;
    const fileSize = isNewFormat ? formatFileSize(fileData.fileSize) : 'Unknown size';
    const fileType = isNewFormat ? fileData.fileType : 'image/jpeg';

    let FileIcon = File;
    let iconColor = 'text-gray-600';
    let bgColor = 'bg-gray-100';

    if (fileType.startsWith('image/')) {
      iconColor = 'text-blue-600';
      bgColor = 'bg-blue-100';
    } else if (fileType === 'application/pdf') {
      FileIcon = FileText;
      iconColor = 'text-red-600';
      bgColor = 'bg-red-100';
    }

    return (
      <div className="relative border-2 border-green-300 bg-green-50 rounded-lg p-4">
        <div className="flex items-start gap-3">
          {fileType.startsWith('image/') ? (
            <img src={base64} alt={label} className="w-16 h-16 object-cover rounded-lg border-2 border-green-400" />
          ) : (
            <div className={`w-16 h-16 flex items-center justify-center rounded-lg border-2 border-green-400 ${bgColor}`}>
              <FileIcon className={`w-8 h-8 ${iconColor}`} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="text-sm font-semibold text-green-700">{label} Uploaded</span>
            </div>
            <p className="text-xs text-gray-600 truncate">{fileName}</p>
            <p className="text-xs text-gray-500">{fileSize}</p>
            <div className="flex items-center gap-3 mt-2">
              <label className="text-xs text-[#D4AF37] hover:text-[#C5A572] cursor-pointer font-medium">
                Change File
                <input type="file" className="hidden" onChange={(e) => handleImageUpload(e, labelToField[label])} />
              </label>
              <button type="button" className="text-xs text-red-600 font-medium flex items-center gap-1" onClick={() => openDeleteConfirmation(labelToField[label], label)}>
                <Trash2 className="w-3 h-3" /> Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (formData.birthDate) {
        if (new Date(formData.birthDate) > new Date()) {
          toast.error('Birth date cannot be in the future');
          setLoading(false); return;
        }
      }

      await updateUserProfile({
        displayName: formData.displayName,
        phoneNumber: formData.phoneNumber,
        identityInfo: {
          fullName: formData.fullName,
          idNumber: formData.idNumber,
          birthDate: formData.birthDate,
          address: formData.address as any,
          gender: formData.gender,
        },
        travelDocuments: {
          ...userProfile?.travelDocuments,
          passportNumber: formData.passportNumber.toUpperCase(),
          passportExpiry: formData.passportExpiry,
        },
        emergencyContact: {
          name: formData.emergencyName,
          phone: formData.emergencyPhone,
          relationship: formData.emergencyRelationship,
        },
        medicalInfo: {
          conditions: formData.medicalConditions,
          medications: formData.medications,
          bloodType: formData.bloodType,
          specialNotes: formData.specialNotes,
        },
        profileComplete: calculateProfileCompletion() === 100,
      } as any);

      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button onClick={onBack} variant="ghost" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl mb-2">My <span className="bg-gradient-to-r from-[#D4AF37] to-[#FFD700] bg-clip-text text-transparent">Profile</span></h1>
          <p className="text-gray-600">Complete your profile to book packages</p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span>Profile Completion</span>
              <span>{calculateProfileCompletion()}%</span>
            </div>
            <Progress value={calculateProfileCompletion()} className="h-2" />
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2 text-[#D4AF37]" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input id="displayName" value={formData.displayName} onChange={(e) => setFormData({ ...formData, displayName: e.target.value })} placeholder="Your display name" />
                </div>
                <div>
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input id="phoneNumber" value={formData.phoneNumber} onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })} placeholder="+62 xxx xxxx xxxx" />
                </div>
                <div>
                  <Label htmlFor="fullName">Full Name (as per ID)</Label>
                  <Input id="fullName" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} placeholder="Full name" />
                </div>
                <div>
                  <Label htmlFor="idNumber">ID Number</Label>
                  <Input id="idNumber" value={formData.idNumber} onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })} placeholder="ID/KTP number" />
                </div>
                <div>
                  <Label htmlFor="birthDate">Birth Date</Label>
                  <Input id="birthDate" type="date" value={formData.birthDate} onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })} max={new Date().toISOString().split('T')[0]} />
                </div>

                {/* Medical Information - High Priority Position */}
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                  <div className="space-y-2">
                    <Label className="font-bold flex items-center gap-2">
                      Gender <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex gap-4">
                      {['Laki-laki', 'Perempuan'].map((g) => (
                        <label key={g} className="flex-1">
                          <input type="radio" name="gender" value={g} checked={formData.gender === g} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className="hidden peer" />
                          <div className="text-center py-2 border rounded-xl cursor-pointer peer-checked:bg-[#D4AF37]/10 peer-checked:border-[#D4AF37] peer-checked:text-[#D4AF37] transition-all text-sm font-medium text-gray-600">{g}</div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bloodType" className="font-bold flex items-center gap-2">
                      Golongan Darah <span className="text-red-500">*</span>
                    </Label>
                    <select id="bloodType" value={formData.bloodType} onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })} className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37]">
                      <option value="">Pilih Gol. Darah</option>
                      {['A', 'B', 'AB', 'O'].map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </div>
                </div>

                <div className="md:col-span-2 pt-4 border-t border-dashed border-gray-200">
                  <Label className="text-[#D4AF37] font-bold mb-4 block flex items-center gap-2">
                    <Heart className="w-4 h-4" /> Informasi Medis Penting
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="medicalConditions" className="text-xs text-gray-400 uppercase tracking-wider">Kondisi Medis</Label>
                      <textarea id="medicalConditions" value={formData.medicalConditions} onChange={(e) => setFormData({ ...formData, medicalConditions: e.target.value })} placeholder="Misal: Hipertensi, Diabetes..." className="w-full min-h-[80px] p-3 text-sm border rounded-xl focus:ring-2 focus:ring-[#D4AF37]/20 outline-none" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="medications" className="text-xs text-gray-400 uppercase tracking-wider">Obat-obatan</Label>
                      <textarea id="medications" value={formData.medications} onChange={(e) => setFormData({ ...formData, medications: e.target.value })} placeholder="Misal: Amlodipine, Metformin..." className="w-full min-h-[80px] p-3 text-sm border rounded-xl focus:ring-2 focus:ring-[#D4AF37]/20 outline-none" />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="specialNotes" className="text-xs text-gray-400 uppercase tracking-wider">Catatan Khusus (Kursi Roda, dll)</Label>
                      <textarea id="specialNotes" value={formData.specialNotes} onChange={(e) => setFormData({ ...formData, specialNotes: e.target.value })} placeholder="Misal: Butuh kursi roda saat tawaf..." className="w-full min-h-[60px] p-3 text-sm border border-pink-100 bg-pink-50/20 rounded-xl focus:ring-2 focus:ring-pink-500/20 outline-none italic" />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 pt-4 border-t border-gray-100">
                  <AddressInput value={formData.address as AddressData} onChange={(addressData) => setFormData({ ...formData, address: addressData })} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Travel Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><FileText className="w-5 h-5 mr-2 text-[#D4AF37]" /> Travel Documents </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="passportNumber">Passport Number</Label>
                  <Input id="passportNumber" value={formData.passportNumber} onChange={(e) => setFormData({ ...formData, passportNumber: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })} placeholder="A1234567" maxLength={9} />
                </div>
                <div>
                  <Label htmlFor="passportExpiry">Passport Expiry</Label>
                  <Input id="passportExpiry" type="date" value={formData.passportExpiry} onChange={(e) => setFormData({ ...formData, passportExpiry: e.target.value })} min={new Date().toISOString().split('T')[0]} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Passport Photo</Label>
                  {userProfile?.travelDocuments?.passportPhoto ? renderFilePreview(userProfile.travelDocuments.passportPhoto, 'Passport') : (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-[#D4AF37] hover:bg-[#D4AF37]/5">
                      <Upload className="w-6 h-6 text-gray-400 mb-2" />
                      <span className="text-sm font-medium">Upload Passport</span>
                      <input type="file" className="hidden" onChange={(e) => handleImageUpload(e, 'travelDocuments.passportPhoto')} />
                    </label>
                  )}
                </div>
                <div>
                  <Label>KTP Photo</Label>
                  {userProfile?.travelDocuments?.ktpPhoto ? renderFilePreview(userProfile.travelDocuments.ktpPhoto, 'KTP') : (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-[#D4AF37] hover:bg-[#D4AF37]/5">
                      <Upload className="w-6 h-6 text-gray-400 mb-2" />
                      <span className="text-sm font-medium">Upload KTP</span>
                      <input type="file" className="hidden" onChange={(e) => handleImageUpload(e, 'travelDocuments.ktpPhoto')} />
                    </label>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Kartu Keluarga (KK)</Label>
                  {userProfile?.travelDocuments?.kkPhoto ? renderFilePreview(userProfile.travelDocuments.kkPhoto, 'KK') : (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-[#D4AF37] hover:bg-[#D4AF37]/5">
                      <Upload className="w-6 h-6 text-gray-400 mb-2" />
                      <span className="text-sm font-medium">Upload KK</span>
                      <input type="file" className="hidden" onChange={(e) => handleImageUpload(e, 'travelDocuments.kkPhoto')} />
                    </label>
                  )}
                </div>
                <div>
                  <Label>Akta Lahir</Label>
                  {userProfile?.travelDocuments?.birthCertificate ? renderFilePreview(userProfile.travelDocuments.birthCertificate, 'Birth Certificate') : (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-[#D4AF37] hover:bg-[#D4AF37]/5">
                      <Upload className="w-6 h-6 text-gray-400 mb-2" />
                      <span className="text-sm font-medium">Upload Akta Lahir</span>
                      <input type="file" className="hidden" onChange={(e) => handleImageUpload(e, 'travelDocuments.birthCertificate')} />
                    </label>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Buku Nikah <span className="text-xs text-gray-500">(Optional)</span></Label>
                  {userProfile?.travelDocuments?.marriageCertificate ? renderFilePreview(userProfile.travelDocuments.marriageCertificate, 'Marriage Certificate') : (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-[#D4AF37] hover:bg-[#D4AF37]/5">
                      <Upload className="w-6 h-6 text-gray-400 mb-2" />
                      <span className="text-sm font-medium">Upload Buku Nikah</span>
                      <input type="file" className="hidden" onChange={(e) => handleImageUpload(e, 'travelDocuments.marriageCertificate')} />
                    </label>
                  )}
                </div>
                <div>
                  <Label>Visa Umroh</Label>
                  {userProfile?.travelDocuments?.umrahVisa ? renderFilePreview(userProfile.travelDocuments.umrahVisa, 'Umrah Visa') : (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-[#D4AF37] hover:bg-[#D4AF37]/5">
                      <Upload className="w-6 h-6 text-gray-400 mb-2" />
                      <span className="text-sm font-medium">Upload Visa Umroh</span>
                      <input type="file" className="hidden" onChange={(e) => handleImageUpload(e, 'travelDocuments.umrahVisa')} />
                    </label>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Tiket Pesawat</Label>
                  {userProfile?.travelDocuments?.flightTicket ? renderFilePreview(userProfile.travelDocuments.flightTicket, 'Flight Ticket') : (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-[#D4AF37] hover:bg-[#D4AF37]/5">
                      <Upload className="w-6 h-6 text-gray-400 mb-2" />
                      <span className="text-sm font-medium">Upload Tiket Pesawat</span>
                      <input type="file" className="hidden" onChange={(e) => handleImageUpload(e, 'travelDocuments.flightTicket')} />
                    </label>
                  )}
                </div>
                <div>
                  <Label>Sertifikat Vaksinasi</Label>
                  {userProfile?.travelDocuments?.vaccinationCertificate ? renderFilePreview(userProfile.travelDocuments.vaccinationCertificate, 'Vaccination Certificate') : (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-[#D4AF37] hover:bg-[#D4AF37]/5">
                      <Upload className="w-6 h-6 text-gray-400 mb-2" />
                      <span className="text-sm font-medium">Upload Sertifikat Vaksinasi</span>
                      <input type="file" className="hidden" onChange={(e) => handleImageUpload(e, 'travelDocuments.vaccinationCertificate')} />
                    </label>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><Phone className="w-5 h-5 mr-2 text-[#D4AF37]" /> Emergency Contact </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="emergencyName">Contact Name</Label>
                  <Input id="emergencyName" value={formData.emergencyName} onChange={(e) => setFormData({ ...formData, emergencyName: e.target.value })} placeholder="Emergency contact name" />
                </div>
                <div>
                  <Label htmlFor="emergencyPhone">Contact Phone</Label>
                  <Input id="emergencyPhone" value={formData.emergencyPhone} onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })} placeholder="+62 xxx xxxx" />
                </div>
                <div>
                  <Label htmlFor="emergencyRelationship">Relationship</Label>
                  <Input id="emergencyRelationship" value={formData.emergencyRelationship} onChange={(e) => setFormData({ ...formData, emergencyRelationship: e.target.value })} placeholder="Spouse, Parent, etc." />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-[#D4AF37] to-[#FFD700] hover:opacity-90 py-6 text-lg font-bold">
            {loading ? 'Saving...' : 'Save Profile'}
          </Button>
        </form>

        <div className="mt-6">
          <Button onClick={() => setLogoutConfirmation(true)} variant="outline" className="w-full border-2 border-red-300 text-red-600 hover:bg-red-50 py-3 rounded-xl">
            <LogOut className="w-5 h-5 mr-2" /> Logout
          </Button>
        </div>

        {deleteConfirmation.isOpen && (
          <ConfirmDialog
            isOpen={deleteConfirmation.isOpen}
            onClose={closeDeleteConfirmation}
            onConfirm={confirmDeleteFile}
            title="Konfirmasi Hapus"
            message={`Apakah Anda yakin ingin menghapus file <strong>${deleteConfirmation.label}</strong>?`}
            confirmText="Hapus File"
            cancelText="Batal"
            type="danger"
            icon="delete"
          />
        )}

        {logoutConfirmation && (
          <ConfirmDialog
            isOpen={logoutConfirmation}
            onClose={() => setLogoutConfirmation(false)}
            onConfirm={signOut}
            title="Konfirmasi Logout"
            message="Apakah Anda yakin ingin logout?"
            confirmText="Logout"
            cancelText="Batal"
            type="danger"
            icon="logout"
          />
        )}
      </div>
    </div>
  );
};

export default ProfilePage;