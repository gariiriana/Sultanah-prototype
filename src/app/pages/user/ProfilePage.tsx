import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Progress } from '../../components/ui/progress';
import { ArrowLeft, User, FileText, Phone, Upload, CheckCircle2, File, FileSpreadsheet, Trash2, AlertTriangle, X, LogOut, Star } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'sonner';
import { processFile, getFileTypeCategory, formatFileSize } from '../../../utils/fileCompression';
import { AddressInput, formatAddressToString, type AddressData } from '../../components/AddressInput';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useNavigate } from 'react-router-dom';

interface ProfilePageProps {
  onBack: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onBack }) => {
  const { userProfile, updateUserProfile, signOut } = useAuth();
  const navigate = useNavigate();
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
  });

  // Debug: Log userProfile to check data
  React.useEffect(() => {
    console.log('🔍 Current userProfile:', userProfile);
    console.log('📍 Address data:', userProfile?.identityInfo?.address);
    console.log('📍 Address type:', typeof userProfile?.identityInfo?.address);
    console.log('📸 Passport Photo:', userProfile?.travelDocuments?.passportPhoto);
    console.log('📸 KTP Photo:', userProfile?.travelDocuments?.ktpPhoto);
  }, [userProfile]);

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
      });
    }
  }, [userProfile]);

  const calculateProfileCompletion = () => {
    // Count basic text fields
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
    ];
    
    // Count address fields (structured object)
    const addressData = formData.address as AddressData;
    const addressComplete = addressData && 
      typeof addressData === 'object' && 
      addressData.country && 
      addressData.province && 
      addressData.city && 
      addressData.street;
    
    // Count uploaded documents (required documents only - exclude optional marriage certificate)
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
    const totalFields = basicFields.length + 1 + requiredDocs.length; // +1 for address, +7 for required docs
    const addressCount = addressComplete ? 1 : 0;
    const docsCount = requiredDocs.filter(doc => !!doc).length;
    
    return Math.round(((filledBasicFields + addressCount + docsCount) / totalFields) * 100);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const processedFile = await processFile(file);
      
      await updateUserProfile({
        [field]: processedFile,
      });
      
      toast.success('File uploaded successfully');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // Open delete confirmation modal
  const openDeleteConfirmation = (field: string, label: string) => {
    setDeleteConfirmation({
      isOpen: true,
      field,
      label,
    });
  };

  // Close delete confirmation modal
  const closeDeleteConfirmation = () => {
    setDeleteConfirmation({
      isOpen: false,
      field: '',
      label: '',
    });
  };

  // Confirm delete file
  const confirmDeleteFile = async () => {
    const { field, label } = deleteConfirmation;
    
    try {
      // Update userProfile to remove the file
      await updateUserProfile({
        [field]: null,
      });
      
      toast.success(`${label} deleted successfully`);
      closeDeleteConfirmation();
    } catch (error: any) {
      toast.error('Failed to delete file');
    }
  };

  // Helper function to render file preview with appropriate icon
  const renderFilePreview = (fileData: any, label: string) => {
    if (!fileData) return null;

    // Mapping label to Firestore field name
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

    // Check if it's the new format (object with base64, fileName, etc.) or legacy format (just base64 string)
    const isNewFormat = typeof fileData === 'object' && fileData.base64;
    const base64 = isNewFormat ? fileData.base64 : fileData;
    const fileName = isNewFormat ? fileData.fileName : `${label.toLowerCase().replace(' ', '-')}.jpg`;
    const fileSize = isNewFormat ? formatFileSize(fileData.fileSize) : 'Unknown size';
    const fileType = isNewFormat ? fileData.fileType : 'image/jpeg';

    // Determine file type category
    let FileIcon = File;
    let iconColor = 'text-gray-600';
    let bgColor = 'bg-gray-100';
    
    if (fileType.startsWith('image/')) {
      FileIcon = File;
      iconColor = 'text-blue-600';
      bgColor = 'bg-blue-100';
    } else if (fileType === 'application/pdf') {
      FileIcon = FileText;
      iconColor = 'text-red-600';
      bgColor = 'bg-red-100';
    } else if (fileType.includes('word')) {
      FileIcon = FileText;
      iconColor = 'text-blue-700';
      bgColor = 'bg-blue-100';
    } else if (fileType.includes('sheet') || fileType.includes('excel')) {
      FileIcon = FileSpreadsheet;
      iconColor = 'text-green-700';
      bgColor = 'bg-green-100';
    }

    return (
      <div className="relative border-2 border-green-300 bg-green-50 rounded-lg p-4">
        <div className="flex items-start gap-3">
          {/* File Preview/Icon */}
          {fileType.startsWith('image/') ? (
            <img 
              src={base64} 
              alt={label} 
              className="w-16 h-16 object-cover rounded-lg border-2 border-green-400"
            />
          ) : (
            <div className={`w-16 h-16 flex items-center justify-center rounded-lg border-2 border-green-400 ${bgColor}`}>
              <FileIcon className={`w-8 h-8 ${iconColor}`} />
            </div>
          )}
          
          {/* File Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="text-sm font-semibold text-green-700">{label} Uploaded</span>
            </div>
            <p className="text-xs text-gray-600 truncate" title={fileName}>{fileName}</p>
            <p className="text-xs text-gray-500">{fileSize}</p>
            <div className="flex items-center gap-3 mt-2">
              <label className="text-xs text-[#D4AF37] hover:text-[#C5A572] cursor-pointer font-medium">
                Change File
                <input
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                  className="hidden"
                  onChange={(e) => handleImageUpload(e, labelToField[label])}
                />
              </label>
              <span className="text-gray-300">|</span>
              <button
                type="button"
                className="text-xs text-red-600 hover:text-red-800 cursor-pointer font-medium flex items-center gap-1"
                onClick={() => openDeleteConfirmation(labelToField[label], label)}
              >
                <Trash2 className="w-3 h-3" />
                Delete
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
      // Debug log before save
      console.log('💾 Saving profile with address:', formData.address);
      console.log('💾 Address type:', typeof formData.address);
      
      // Validate Birth Date - tidak boleh di masa depan
      if (formData.birthDate) {
        const birthDate = new Date(formData.birthDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to start of day
        
        if (birthDate > today) {
          toast.error('Birth date cannot be in the future');
          setLoading(false);
          return;
        }
      }

      // Validate Passport Number - harus 6-9 karakter alphanumeric
      if (formData.passportNumber && formData.passportNumber.trim() !== '') {
        const passportRegex = /^[A-Z0-9]{6,9}$/i;
        if (!passportRegex.test(formData.passportNumber)) {
          toast.error('Passport number must be 6-9 alphanumeric characters (A-Z, 0-9)');
          setLoading(false);
          return;
        }
      }

      await updateUserProfile({
        displayName: formData.displayName,
        phoneNumber: formData.phoneNumber,
        identityInfo: {
          fullName: formData.fullName,
          idNumber: formData.idNumber,
          birthDate: formData.birthDate,
          address: formData.address, // Save as object, not string!
        },
        travelDocuments: {
          ...userProfile?.travelDocuments,
          passportNumber: formData.passportNumber.toUpperCase(), // Normalize to uppercase
          passportExpiry: formData.passportExpiry,
        },
        emergencyContact: {
          name: formData.emergencyName,
          phone: formData.emergencyPhone,
          relationship: formData.emergencyRelationship,
        },
        profileComplete: calculateProfileCompletion() === 100,
      });

      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('❌ Error saving profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button
          onClick={onBack}
          variant="ghost"
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl mb-2">
            My <span className="bg-gradient-to-r from-[#D4AF37] to-[#FFD700] bg-clip-text text-transparent">Profile</span>
          </h1>
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
                  <Input
                    id="displayName"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    placeholder="Your display name"
                  />
                </div>
                <div>
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    placeholder="+62 xxx xxxx xxxx"
                  />
                </div>
                <div>
                  <Label htmlFor="fullName">Full Name (as per ID)</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <Label htmlFor="idNumber">ID Number</Label>
                  <Input
                    id="idNumber"
                    value={formData.idNumber}
                    onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                    placeholder="ID/KTP number"
                  />
                </div>
                <div>
                  <Label htmlFor="birthDate">Birth Date</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    max={new Date().toISOString().split('T')[0]}
                    title="Birth date cannot be in the future"
                  />
                  <p className="text-xs text-gray-500 mt-1">Must be today or earlier</p>
                </div>
                <div className="md:col-span-2">
                  <AddressInput
                    value={formData.address as AddressData}
                    onChange={(addressData) => setFormData({ ...formData, address: addressData })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Travel Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2 text-[#D4AF37]" />
                Travel Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="passportNumber">Passport Number</Label>
                  <Input
                    id="passportNumber"
                    value={formData.passportNumber}
                    onChange={(e) => {
                      // Only allow alphanumeric characters
                      const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                      setFormData({ ...formData, passportNumber: value });
                    }}
                    placeholder="A1234567"
                    maxLength={9}
                    pattern="[A-Z0-9]{6,9}"
                    title="Passport number must be 6-9 alphanumeric characters"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    6-9 alphanumeric characters (A-Z, 0-9)
                  </p>
                </div>
                <div>
                  <Label htmlFor="passportExpiry">Passport Expiry</Label>
                  <Input
                    id="passportExpiry"
                    type="date"
                    value={formData.passportExpiry}
                    onChange={(e) => setFormData({ ...formData, passportExpiry: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    title="Passport must be valid (not expired)"
                  />
                  <p className="text-xs text-gray-500 mt-1">Must be a future date</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Passport Photo</Label>
                  <p className="text-xs text-gray-500 mb-2">Max 3MB untuk gambar, 500KB untuk PDF/Word/Excel</p>
                  <div className="mt-2">
                    {userProfile?.travelDocuments?.passportPhoto ? (
                      /* File Uploaded State */
                      renderFilePreview(userProfile.travelDocuments.passportPhoto, 'Passport')
                    ) : (
                      /* Empty State - Upload Button */
                      <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 transition-all">
                        <Upload className="w-6 h-6 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600 font-medium mb-1">Upload Passport</span>
                        <span className="text-xs text-gray-400">JPG, PNG, PDF (max 3MB/500KB)</span>
                        <input
                          type="file"
                          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                          className="hidden"
                          onChange={(e) => handleImageUpload(e, 'travelDocuments.passportPhoto')}
                        />
                      </label>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label>KTP Photo</Label>
                  <p className="text-xs text-gray-500 mb-2">Max 3MB untuk gambar, 500KB untuk PDF/Word/Excel</p>
                  <div className="mt-2">
                    {userProfile?.travelDocuments?.ktpPhoto ? (
                      /* File Uploaded State */
                      renderFilePreview(userProfile.travelDocuments.ktpPhoto, 'KTP')
                    ) : (
                      /* Empty State - Upload Button */
                      <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 transition-all">
                        <Upload className="w-6 h-6 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600 font-medium mb-1">Upload KTP</span>
                        <span className="text-xs text-gray-400">JPG, PNG, PDF (max 3MB/500KB)</span>
                        <input
                          type="file"
                          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                          className="hidden"
                          onChange={(e) => handleImageUpload(e, 'travelDocuments.ktpPhoto')}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* Row 2: KK & Birth Certificate */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Kartu Keluarga (KK)</Label>
                  <p className="text-xs text-gray-500 mb-2">Max 3MB untuk gambar, 500KB untuk PDF/Word/Excel</p>
                  <div className="mt-2">
                    {userProfile?.travelDocuments?.kkPhoto ? (
                      renderFilePreview(userProfile.travelDocuments.kkPhoto, 'KK')
                    ) : (
                      <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 transition-all">
                        <Upload className="w-6 h-6 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600 font-medium mb-1">Upload KK</span>
                        <span className="text-xs text-gray-400">JPG, PNG, PDF (max 3MB/500KB)</span>
                        <input
                          type="file"
                          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                          className="hidden"
                          onChange={(e) => handleImageUpload(e, 'travelDocuments.kkPhoto')}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Akta Lahir</Label>
                  <p className="text-xs text-gray-500 mb-2">Max 3MB untuk gambar, 500KB untuk PDF/Word/Excel</p>
                  <div className="mt-2">
                    {userProfile?.travelDocuments?.birthCertificate ? (
                      renderFilePreview(userProfile.travelDocuments.birthCertificate, 'Birth Certificate')
                    ) : (
                      <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 transition-all">
                        <Upload className="w-6 h-6 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600 font-medium mb-1">Upload Akta Lahir</span>
                        <span className="text-xs text-gray-400">JPG, PNG, PDF (max 3MB/500KB)</span>
                        <input
                          type="file"
                          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                          className="hidden"
                          onChange={(e) => handleImageUpload(e, 'travelDocuments.birthCertificate')}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* Row 3: Marriage Certificate & Umrah Visa */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Buku Nikah <span className="text-xs text-gray-500">(Optional)</span></Label>
                  <p className="text-xs text-gray-500 mb-2">Max 3MB untuk gambar, 500KB untuk PDF/Word/Excel</p>
                  <div className="mt-2">
                    {userProfile?.travelDocuments?.marriageCertificate ? (
                      renderFilePreview(userProfile.travelDocuments.marriageCertificate, 'Marriage Certificate')
                    ) : (
                      <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 transition-all">
                        <Upload className="w-6 h-6 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600 font-medium mb-1">Upload Buku Nikah</span>
                        <span className="text-xs text-gray-400">JPG, PNG, PDF (max 3MB/500KB)</span>
                        <input
                          type="file"
                          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                          className="hidden"
                          onChange={(e) => handleImageUpload(e, 'travelDocuments.marriageCertificate')}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Visa Umroh</Label>
                  <p className="text-xs text-gray-500 mb-2">Max 3MB untuk gambar, 500KB untuk PDF/Word/Excel</p>
                  <div className="mt-2">
                    {userProfile?.travelDocuments?.umrahVisa ? (
                      renderFilePreview(userProfile.travelDocuments.umrahVisa, 'Umrah Visa')
                    ) : (
                      <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 transition-all">
                        <Upload className="w-6 h-6 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600 font-medium mb-1">Upload Visa Umroh</span>
                        <span className="text-xs text-gray-400">JPG, PNG, PDF (max 3MB/500KB)</span>
                        <input
                          type="file"
                          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                          className="hidden"
                          onChange={(e) => handleImageUpload(e, 'travelDocuments.umrahVisa')}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* Row 4: Flight Ticket & Vaccination Certificate */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Tiket Pesawat</Label>
                  <p className="text-xs text-gray-500 mb-2">Max 3MB untuk gambar, 500KB untuk PDF/Word/Excel</p>
                  <div className="mt-2">
                    {userProfile?.travelDocuments?.flightTicket ? (
                      renderFilePreview(userProfile.travelDocuments.flightTicket, 'Flight Ticket')
                    ) : (
                      <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 transition-all">
                        <Upload className="w-6 h-6 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600 font-medium mb-1">Upload Tiket Pesawat</span>
                        <span className="text-xs text-gray-400">JPG, PNG, PDF (max 3MB/500KB)</span>
                        <input
                          type="file"
                          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                          className="hidden"
                          onChange={(e) => handleImageUpload(e, 'travelDocuments.flightTicket')}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Sertifikat Vaksinasi</Label>
                  <p className="text-xs text-gray-500 mb-2">Max 3MB untuk gambar, 500KB untuk PDF/Word/Excel</p>
                  <div className="mt-2">
                    {userProfile?.travelDocuments?.vaccinationCertificate ? (
                      renderFilePreview(userProfile.travelDocuments.vaccinationCertificate, 'Vaccination Certificate')
                    ) : (
                      <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 transition-all">
                        <Upload className="w-6 h-6 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600 font-medium mb-1">Upload Sertifikat Vaksinasi</span>
                        <span className="text-xs text-gray-400">JPG, PNG, PDF (max 3MB/500KB)</span>
                        <input
                          type="file"
                          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                          className="hidden"
                          onChange={(e) => handleImageUpload(e, 'travelDocuments.vaccinationCertificate')}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Phone className="w-5 h-5 mr-2 text-[#D4AF37]" />
                Emergency Contact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="emergencyName">Contact Name</Label>
                  <Input
                    id="emergencyName"
                    value={formData.emergencyName}
                    onChange={(e) => setFormData({ ...formData, emergencyName: e.target.value })}
                    placeholder="Emergency contact name"
                  />
                </div>
                <div>
                  <Label htmlFor="emergencyPhone">Contact Phone</Label>
                  <Input
                    id="emergencyPhone"
                    value={formData.emergencyPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                    placeholder="+62 xxx xxxx xxxx"
                  />
                </div>
                <div>
                  <Label htmlFor="emergencyRelationship">Relationship</Label>
                  <Input
                    id="emergencyRelationship"
                    value={formData.emergencyRelationship}
                    onChange={(e) => setFormData({ ...formData, emergencyRelationship: e.target.value })}
                    placeholder="e.g., Spouse, Parent"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#D4AF37] to-[#FFD700] hover:opacity-90"
          >
            {loading ? 'Saving...' : 'Save Profile'}
          </Button>
        </form>

        {/* Logout Button */}
        <div className="mt-6">
          <Button
            onClick={() => setLogoutConfirmation(true)}
            variant="outline"
            className="w-full border-2 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 hover:text-red-700 font-semibold py-3 rounded-xl transition-all"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Logout
          </Button>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirmation.isOpen && (
          <ConfirmDialog
            isOpen={deleteConfirmation.isOpen}
            onClose={closeDeleteConfirmation}
            onConfirm={confirmDeleteFile}
            title="Konfirmasi Hapus"
            message={`Apakah Anda yakin ingin menghapus file <span class="font-bold text-red-600">${deleteConfirmation.label}</span>?<br/><span class="text-sm text-gray-600 mt-2">File yang dihapus tidak dapat dikembalikan.</span>`}
            confirmText="Hapus File"
            cancelText="Batal"
            type="danger"
            icon="delete"
          />
        )}

        {/* Logout Confirmation Modal */}
        {logoutConfirmation && (
          <ConfirmDialog
            isOpen={logoutConfirmation}
            onClose={() => setLogoutConfirmation(false)}
            onConfirm={signOut}
            title="Konfirmasi Logout"
            message="Apakah Anda yakin ingin logout? Anda akan keluar dari akun Anda."
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