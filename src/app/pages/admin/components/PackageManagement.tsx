import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../../../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Badge } from '../../../components/ui/badge';
import { Plus, Edit, Trash, Package as PackageIcon, DollarSign, Calendar, Users, Clock, Image as ImageIcon, FileText, List, CheckCircle, Plane, Hotel, Sparkles, AlertTriangle, UserCheck, ShoppingBag, X, File } from 'lucide-react'; // ✅ and Upload/Download removed
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../config/firebase';
import { toast } from 'sonner';
import { Package } from '../../../../types';
import { compressImage, validateImageFile } from '../../../../utils/imageCompression';

const PackageManagement = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState<string | null>(null);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  // ✅ NEW: Tour Leaders state
  const [tourLeaders, setTourLeaders] = useState<any[]>([]);
  // ✅ NEW: Muthawifs state
  const [muthawifs, setMuthawifs] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    type: 'umrah' as 'umrah' | 'hajj', // ✅ REMOVED 'ziarah'
    packageClass: 'reguler' as 'reguler' | 'vip' | 'vvip' | 'super-vvip',
    price: '',
    duration: '',
    departureDate: '',
    maxParticipants: '',
    status: 'active' as 'active' | 'inactive',
    features: '',
    description: '',
    photo: '',
    // Detail page fields
    hotel: '',
    airline: '',
    includes: '',
    excludes: '',
    itinerary: '',
    highlight: '',
    terms: '',
    meetingPoint: '',
    whatsappNumber: '',
    // ✅ NEW: Tour Leader assignment
    assignedTourLeaderId: '',
    // ✅ NEW: Muthawif assignment
    assignedMuthawifId: '',
  });

  // ✅ NEW: Package Items State (separate from formData for easier manipulation)
  const [packageItems, setPackageItems] = useState<Array<{ itemName: string; quantity: string }>>([]);

  // ✅ File upload state - Using Base64 (stored in Firestore directly)
  const [packageFile, setPackageFile] = useState<File | null>(null);
  const [scheduleFile, setScheduleFile] = useState<File | null>(null);
  const [packageFileBase64, setPackageFileBase64] = useState<string>('');
  const [scheduleFileBase64, setScheduleFileBase64] = useState<string>('');
  const [packageFileName, setPackageFileName] = useState<string>('');
  const [scheduleFileName, setScheduleFileName] = useState<string>('');
  const [uploadingFiles, setUploadingFiles] = useState(false);

  useEffect(() => {
    fetchPackages();
    fetchTourLeaders();
    fetchMuthawifs();
  }, []);

  // 🔍 DEBUG: Log muthawifs whenever dialog opens or muthawifs change
  useEffect(() => {
    if (dialogOpen) {
      console.log('📋 Dialog opened. Current muthawifs:', muthawifs);
      console.log('📋 Muthawifs count:', muthawifs.length);
      console.log('📋 Current assignedMuthawifId:', formData.assignedMuthawifId);
    }
  }, [dialogOpen, muthawifs]);

  const fetchPackages = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'packages'));
      const packagesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Package[];
      setPackages(packagesData);
    } catch (error) {
      toast.error('Failed to fetch packages');
    }
  };

  const fetchTourLeaders = async () => {
    try {
      // 🔧 DIRECT FIX: Fetch ALL users first
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);

      const allUsers = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filter by role = tour-leader
      const allTourLeaders = allUsers.filter((user: any) => user.role === 'tour-leader');

      console.log('🔍 Users with role=tour-leader:', allTourLeaders);
      console.log('🔍 Total tour leaders:', allTourLeaders.length);

      // Filter by approvalStatus = approved
      const approvedTourLeaders = allTourLeaders.filter((tl: any) => {
        const status = tl.approvalStatus?.toLowerCase();
        return status === 'approved';
      });

      console.log('✅ APPROVED TOUR LEADERS:', approvedTourLeaders);

      // Show approved tour leaders (or all if none approved)
      const finalTourLeaders = approvedTourLeaders.length > 0 ? approvedTourLeaders : allTourLeaders;

      setTourLeaders(finalTourLeaders);
      console.log('✅ FINAL TOUR LEADERS TO DISPLAY:', finalTourLeaders.length);
    } catch (error) {
      console.error('❌ Error fetching tour leaders:', error);
      toast.error('Failed to fetch tour leaders');
    }
  };

  const fetchMuthawifs = async () => {
    try {
      // 🔧 DIRECT FIX: Fetch ALL users first (same approach as fetchTourLeaders)
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);

      const allUsers = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filter by role = mutawwif (with double 'w')
      const allMuthawifs = allUsers.filter((user: any) => user.role === 'mutawwif');

      console.log('🔍 Users with role=mutawwif:', allMuthawifs);
      console.log('🔍 Total muthawifs:', allMuthawifs.length);

      // Filter by approvalStatus = approved
      const approvedMuthawifs = allMuthawifs.filter((mw: any) => {
        const status = mw.approvalStatus?.toLowerCase();
        return status === 'approved';
      });

      console.log('✅ APPROVED MUTHAWIFS:', approvedMuthawifs);

      // Show approved muthawifs (or all if none approved)
      const finalMuthawifs = approvedMuthawifs.length > 0 ? approvedMuthawifs : allMuthawifs;

      setMuthawifs(finalMuthawifs);
      console.log('✅ FINAL MUTHAWIFS TO DISPLAY:', finalMuthawifs.length);
    } catch (error) {
      console.error('❌ Error fetching muthawifs:', error);
      toast.error('Failed to fetch muthawifs');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      validateImageFile(file);
      const compressed = await compressImage(file, 600, 0.8);
      setFormData({ ...formData, photo: compressed });
      toast.success('Image uploaded');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // ✅ Convert file to Base64 for Firestore storage
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsDataURL(file);
    });
  };

  // ✅ Handle package file upload - Convert to Base64
  const handlePackageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📎 handlePackageFileUpload triggered');
    const file = e.target.files?.[0];
    if (!file) {
      console.log('⚠️ No file selected');
      return;
    }

    // Validate file type (PDF, DOC, DOCX)
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      console.log('❌ Invalid file type:', file.type);
      toast.error('File harus berformat PDF, DOC, atau DOCX');
      return;
    }

    // Validate file size (max 1MB strict limit for Firestore strict mode)
    if (file.size > 1 * 1024 * 1024) {
      console.log('❌ File too large:', file.size);
      toast.error('Ukuran file maksimal 1MB (Batas Database)');
      return;
    }

    console.log('✅ Package file valid:', file.name);
    console.log('🔄 Converting to Base64...');

    try {
      const base64 = await convertFileToBase64(file);
      console.log('✅ Conversion complete, size:', base64.length, 'chars');

      setPackageFile(file);
      setPackageFileBase64(base64);
      setPackageFileName(file.name);
      toast.success('File paket dipilih: ' + file.name);
    } catch (error) {
      console.error('❌ Error converting file:', error);
      toast.error('Gagal memproses file');
    }
  };

  // ✅ Handle schedule file upload - Convert to Base64
  const handleScheduleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📎 handleScheduleFileUpload triggered');
    const file = e.target.files?.[0];
    if (!file) {
      console.log('⚠️ No file selected');
      return;
    }

    // Validate file type (PDF, DOC, DOCX)
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      console.log('❌ Invalid file type:', file.type);
      toast.error('File harus berformat PDF, DOC, atau DOCX');
      return;
    }

    // Validate file size (max 1MB strict limit for Firestore strict mode)
    if (file.size > 1 * 1024 * 1024) {
      console.log('❌ File too large:', file.size);
      toast.error('Ukuran file maksimal 1MB (Batas Database)');
      return;
    }

    console.log('✅ Schedule file valid:', file.name);
    console.log('🔄 Converting to Base64...');

    try {
      const base64 = await convertFileToBase64(file);
      console.log('✅ Conversion complete, size:', base64.length, 'chars');

      setScheduleFile(file);
      setScheduleFileBase64(base64);
      setScheduleFileName(file.name);
      toast.success('File jadwal dipilih: ' + file.name);
    } catch (error) {
      console.error('❌ Error converting file:', error);
      toast.error('Gagal memproses file');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      console.log('🚀 Starting package submission...');
      setUploadingFiles(true);

      // ✅ 1. Upload files to separate collection 'package_files' first
      let packageFileId = '';
      let scheduleFileId = '';

      // Upload Package File
      if (packageFileBase64 && packageFileBase64.length > 0) {
        // Check if it's a full base64 string (starts with data:) - meaning it's a NEW file
        if (packageFileBase64.startsWith('data:')) {
          console.log('📤 Uploading package file to separate collection...');
          const fileDoc = await addDoc(collection(db, 'package_files'), {
            name: packageFileName,
            content: packageFileBase64,
            type: 'package_file',
            createdAt: new Date().toISOString()
          });
          packageFileId = fileDoc.id;
          console.log('✅ Package file saved with ID:', packageFileId);
        } else {
          console.log('ℹ️ Existing package file (or invalid format), skipping separate upload');
        }
      }

      // Upload Schedule File
      if (scheduleFileBase64 && scheduleFileBase64.length > 0) {
        if (scheduleFileBase64.startsWith('data:')) {
          console.log('📤 Uploading schedule file to separate collection...');
          const fileDoc = await addDoc(collection(db, 'package_files'), {
            name: scheduleFileName,
            content: scheduleFileBase64,
            type: 'schedule_file',
            createdAt: new Date().toISOString()
          });
          scheduleFileId = fileDoc.id;
          console.log('✅ Schedule file saved with ID:', scheduleFileId);
        }
      }

      const packageData: any = {
        name: formData.name,
        type: formData.type,
        packageClass: formData.packageClass,
        price: Number(formData.price),
        duration: Number(formData.duration),
        departureDate: formData.departureDate,
        maxParticipants: Number(formData.maxParticipants),
        status: formData.status,
        features: formData.features.split('\n').filter(f => f.trim()),
        description: formData.description,
        image: formData.photo, // ✅ FIX: Rename 'photo' to 'image' for consistency
        updatedAt: new Date().toISOString(),
        // Detail page fields
        hotel: formData.hotel,
        airline: formData.airline,
        includes: formData.includes.split('\n').filter(f => f.trim()),
        excludes: formData.excludes.split('\n').filter(f => f.trim()),
        itinerary: formData.itinerary.split('\n').filter(f => f.trim()),
        highlight: formData.highlight.split('\n').filter(f => f.trim()),
        terms: formData.terms,
        meetingPoint: formData.meetingPoint,
        whatsappNumber: formData.whatsappNumber,
        // ✅ NEW: Tour Leader assignment (consistent field names)
        tourLeaderId: formData.assignedTourLeaderId,
        tourLeaderName: formData.assignedTourLeaderId
          ? (tourLeaders.find(tl => tl.id === formData.assignedTourLeaderId)?.displayName ||
            tourLeaders.find(tl => tl.id === formData.assignedTourLeaderId)?.email || '')
          : '',
        // ✅ NEW: Muthawif assignment (consistent field names)
        muthawifId: formData.assignedMuthawifId,
        muthawifName: formData.assignedMuthawifId
          ? (muthawifs.find(m => m.id === formData.assignedMuthawifId)?.displayName ||
            muthawifs.find(m => m.id === formData.assignedMuthawifId)?.email || '')
          : '',
        // ✅ NEW: Package Items
        packageItems: packageItems
          .filter(item => item.itemName.trim() !== '' && item.quantity.trim() !== '')
          .map(item => ({
            itemName: item.itemName.trim(),
            quantity: Number(item.quantity)
          })),

        // ✅ Store File Names (Display)
        packageFileName: packageFileName || '',
        scheduleFileName: scheduleFileName || '',

        // ✅ Store File IDs (Reference) - Update only if new file uploaded
        ...(packageFileId ? { packageFileId } : {}),
        ...(scheduleFileId ? { scheduleFileId } : {}),

        // ❌ REMOVE Base64 from main doc
        packageFileBase64: null,
        scheduleFileBase64: null
      };

      // Cleanup null values so we don't save fields with null
      delete packageData.packageFileBase64;
      delete packageData.scheduleFileBase64;

      if (editingPackage) {
        console.log('✏️ Updating package:', editingPackage.id);
        // When editing, don't update availableSlots (it's managed by bookings)
        await updateDoc(doc(db, 'packages', editingPackage.id), packageData);
        console.log('✅ Package updated successfully');
        toast.success('Package updated successfully');
      } else {
        console.log('➕ Creating new package...');
        // When creating new package, set availableSlots = maxParticipants (no bookings yet)
        const docRef = await addDoc(collection(db, 'packages'), {
          ...packageData,
          availableSlots: Number(formData.maxParticipants), // Auto set sama dengan maxParticipants
          createdAt: new Date().toISOString(),
        });
        console.log('✅ Package created successfully with ID:', docRef.id);
        toast.success('Package created successfully');
      }

      console.log('🔄 Refreshing packages list...');
      await fetchPackages();
      console.log('✅ Packages list refreshed');

      console.log('🚪 Closing dialog and resetting form...');
      setDialogOpen(false);
      resetForm();
      console.log('✅ All done!');
    } catch (error) {
      console.error('❌ Error in handleSubmit:', error);
      toast.error('Failed to save package: ' + (error as Error).message);
    } finally {
      setUploadingFiles(false);
      console.log('🏁 Upload state reset');
    }
  };

  const handleEdit = (pkg: Package) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      type: (pkg.type === 'umrah' || pkg.type === 'hajj') ? pkg.type : 'umrah',
      packageClass: pkg.packageClass || 'reguler',
      price: pkg.price.toString(),
      duration: pkg.duration.toString(),
      departureDate: pkg.departureDate,
      maxParticipants: pkg.maxParticipants.toString(),
      status: pkg.status,
      features: pkg.features.join('\\n'),
      description: pkg.description,
      photo: pkg.image || pkg.photo || '', // ✅ FIX: Try 'image' first, fallback to 'photo'
      // Detail page fields
      hotel: pkg.hotel || '',
      airline: pkg.airline || '',
      includes: (pkg.includes || []).join('\\n'),
      excludes: (pkg.excludes || []).join('\\n'),
      itinerary: (pkg.itinerary || []).join('\\n'),
      highlight: (pkg.highlight || []).join('\\n'),
      terms: pkg.terms || '',
      meetingPoint: pkg.meetingPoint || '',
      whatsappNumber: pkg.whatsappNumber || '',
      // ✅ FIX: Read from tourLeaderId (what's saved in Firestore)
      assignedTourLeaderId: (pkg as any).tourLeaderId || pkg.assignedTourLeaderId || '',
      // ✅ FIX: Read from muthawifId (what's saved in Firestore)
      assignedMuthawifId: (pkg as any).muthawifId || (pkg as any).assignedMuthawifId || '',
    });
    // ✅ Load package items
    setPackageItems(
      ((pkg as any).packageItems || []).map((item: any) => ({
        itemName: item.itemName,
        quantity: item.quantity.toString()
      }))
    );
    // ✅ Load existing files
    // Check if we have file IDs (New System) or legacy Base64 (Old System)
    setPackageFileName((pkg as any).packageFileName || '');
    setScheduleFileName((pkg as any).scheduleFileName || '');

    // Reset Base64 states first
    setPackageFileBase64('');
    setScheduleFileBase64('');

    // Fetch Package File Content
    if ((pkg as any).packageFileId) {
      console.log('📥 Fetching package file from separate collection:', (pkg as any).packageFileId);
      getDoc(doc(db, 'package_files', (pkg as any).packageFileId)).then(snap => {
        if (snap.exists()) {
          setPackageFileBase64(snap.data().content);
          console.log('✅ Package file content loaded');
        }
      });
    } else if ((pkg as any).packageFileBase64) {
      // Legacy support
      setPackageFileBase64((pkg as any).packageFileBase64);
    }

    // Fetch Schedule File Content
    if ((pkg as any).scheduleFileId) {
      console.log('📥 Fetching schedule file from separate collection:', (pkg as any).scheduleFileId);
      getDoc(doc(db, 'package_files', (pkg as any).scheduleFileId)).then(snap => {
        if (snap.exists()) {
          setScheduleFileBase64(snap.data().content);
          console.log('✅ Schedule file content loaded');
        }
      });
    } else if ((pkg as any).scheduleFileBase64) {
      // Legacy support
      setScheduleFileBase64((pkg as any).scheduleFileBase64);
    }

    // If there's existing file, create a dummy File object for display
    if ((pkg as any).packageFileName) {
      console.log('📄 Loaded existing package file:', (pkg as any).packageFileName);
    }
    if ((pkg as any).scheduleFileName) {
      console.log('📄 Loaded existing schedule file:', (pkg as any).scheduleFileName);
    }

    // 🔧 FIX: Refresh muthawifs and tour leaders data to ensure latest approved users
    fetchMuthawifs();
    fetchTourLeaders();

    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    setPackageToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!packageToDelete) return;

    try {
      await deleteDoc(doc(db, 'packages', packageToDelete));
      toast.success('Package deleted successfully');
      fetchPackages();
      setDeleteDialogOpen(false);
      setPackageToDelete(null);
    } catch (error) {
      toast.error('Failed to delete package');
    }
  };

  const resetForm = () => {
    setEditingPackage(null);
    setFormData({
      name: '',
      type: 'umrah',
      packageClass: 'reguler',
      price: '',
      duration: '',
      departureDate: '',
      maxParticipants: '',
      status: 'active',
      features: '',
      description: '',
      photo: '',
      // Detail page fields
      hotel: '',
      airline: '',
      includes: '',
      excludes: '',
      itinerary: '',
      highlight: '',
      terms: '',
      meetingPoint: '',
      whatsappNumber: '',
      // ✅ NEW: Tour Leader assignment
      assignedTourLeaderId: '',
      // ✅ NEW: Muthawif assignment
      assignedMuthawifId: '',
    });
    // ✅ Clear package items
    setPackageItems([]);
    // ✅ Clear file uploads (Base64)
    setPackageFile(null);
    setScheduleFile(null);
    setPackageFileBase64('');
    setScheduleFileBase64('');
    setPackageFileName('');
    setScheduleFileName('');
  };

  // ✅ NEW: Form validation function
  const isFormValid = () => {
    return (
      formData.name.trim() !== '' &&
      formData.price.trim() !== '' &&
      formData.duration.trim() !== '' &&
      formData.departureDate.trim() !== '' &&
      formData.maxParticipants.trim() !== '' &&
      formData.features.trim() !== '' && // ✅ Features now required
      formData.hotel.trim() !== '' &&
      formData.airline.trim() !== '' &&
      formData.includes.trim() !== '' &&
      formData.excludes.trim() !== '' &&
      formData.itinerary.trim() !== '' &&
      formData.highlight.trim() !== '' &&
      formData.terms.trim() !== '' &&
      formData.meetingPoint.trim() !== '' &&
      formData.whatsappNumber.trim() !== ''
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl">Package Management</h3>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-[#D4AF37] to-[#FFD700]">
              <Plus className="w-4 h-4 mr-2" />
              Add Package
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white/95 via-[#FFF9F0]/95 to-[#F5ECD7]/95 backdrop-blur-xl border-2 border-[#D4AF37]/30 shadow-2xl">
            <DialogHeader className="border-b border-[#D4AF37]/20 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#FFD700] flex items-center justify-center shadow-lg">
                  <PackageIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl bg-gradient-to-r from-[#D4AF37] to-[#C5A572] bg-clip-text text-transparent">
                    {editingPackage ? 'Edit Paket' : 'Tambah Paket Baru'}
                  </DialogTitle>
                  <DialogDescription className="text-gray-600">
                    {editingPackage ? 'Perbarui detail dan informasi paket' : 'Buat paket perjalanan baru untuk jamaah Anda'}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D4AF37]/20 to-[#FFD700]/20 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-[#D4AF37]" />
                  </div>
                  <h4 className="font-semibold text-gray-700">Informasi Dasar</h4>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <PackageIcon className="w-4 h-4 text-[#D4AF37]" />
                      Nama Paket <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="border-[#D4AF37]/30 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20 bg-white/50 backdrop-blur-sm"
                      placeholder="e.g., Umrah Premium 2024"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-[#D4AF37]" />
                      Tipe Paket
                    </Label>
                    <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                      <SelectTrigger className="border-[#D4AF37]/30 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20 bg-white/50 backdrop-blur-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="umrah">🕋 Umrah</SelectItem>
                        <SelectItem value="hajj">🕌 Haji</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                      Kelas Paket
                    </Label>
                    <Select value={formData.packageClass} onValueChange={(value: any) => setFormData({ ...formData, packageClass: value })}>
                      <SelectTrigger className="border-[#D4AF37]/30 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20 bg-white/50 backdrop-blur-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="reguler">⭐ Reguler</SelectItem>
                        <SelectItem value="vip">⭐⭐ VIP</SelectItem>
                        <SelectItem value="vvip">⭐⭐⭐ VVIP</SelectItem>
                        <SelectItem value="super-vvip">⭐⭐⭐⭐ Super VVIP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Pricing & Duration Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D4AF37]/20 to-[#FFD700]/20 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-[#D4AF37]" />
                  </div>
                  <h4 className="font-semibold text-gray-700">Harga & Jadwal</h4>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-[#D4AF37]" />
                      Harga (IDR) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                      className="border-[#D4AF37]/30 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20 bg-white/50 backdrop-blur-sm"
                      placeholder="25000000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#D4AF37]" />
                      Durasi (hari) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      required
                      className="border-[#D4AF37]/30 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20 bg-white/50 backdrop-blur-sm"
                      placeholder="12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#D4AF37]" />
                      Tanggal Keberangkatan <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={formData.departureDate}
                      onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
                      min={new Date().toISOString().split('T')[0]} // ✅ Tidak bisa pilih tanggal sebelumnya
                      required
                      className="border-[#D4AF37]/30 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20 bg-white/50 backdrop-blur-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-[#D4AF37]" />
                      Status
                    </Label>
                    <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                      <SelectTrigger className="border-[#D4AF37]/30 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20 bg-white/50 backdrop-blur-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">✅ Aktif</SelectItem>
                        <SelectItem value="inactive">⏸️ Tidak Aktif</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Capacity Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D4AF37]/20 to-[#FFD700]/20 flex items-center justify-center">
                    <Users className="w-4 h-4 text-[#D4AF37]" />
                  </div>
                  <h4 className="font-semibold text-gray-700">Manajemen Kapasitas</h4>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#D4AF37]" />
                      Maksimum Peserta <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      value={formData.maxParticipants}
                      onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                      required
                      className="border-[#D4AF37]/30 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20 bg-white/50 backdrop-blur-sm"
                      placeholder="40"
                    />
                  </div>
                </div>
              </div>

              {/* Features Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D4AF37]/20 to-[#FFD700]/20 flex items-center justify-center">
                    <List className="w-4 h-4 text-[#D4AF37]" />
                  </div>
                  <h4 className="font-semibold text-gray-700">Fitur Paket</h4>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <List className="w-4 h-4 text-[#D4AF37]" />
                    Fitur (satu per baris) <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    value={formData.features}
                    onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                    required
                    rows={4}
                    placeholder="✈️ Direct flight from Jakarta&#10;🏨 5-star hotel in Makkah&#10;🍽️ Full board meals&#10;🚌 Private transportation"
                    className="border-[#D4AF37]/30 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20 bg-white/50 backdrop-blur-sm"
                  />
                  <p className="text-xs text-gray-500">Tambahkan emoji agar fitur lebih menarik!</p>
                </div>
              </div>

              {/* Description Section */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#D4AF37]" />
                  Deskripsi Paket
                </Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Jelaskan detail paket Anda..."
                  className="border-[#D4AF37]/30 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20 bg-white/50 backdrop-blur-sm"
                />
              </div>

              {/* Photo Upload Section */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[#D4AF37]" />
                  Foto Paket
                </Label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    id="package-photo-upload"
                    className="hidden"
                  />
                  <label
                    htmlFor="package-photo-upload"
                    className="flex items-center gap-3 p-4 border-2 border-dashed border-[#D4AF37]/30 rounded-xl bg-white/50 backdrop-blur-sm cursor-pointer hover:border-[#D4AF37] hover:bg-[#FFF9F0]/50 transition-all"
                  >
                    <ImageIcon className="w-5 h-5 text-[#D4AF37]" />
                    <div>
                      <p className="text-sm font-medium text-[#D4AF37] hover:underline">
                        Pilih file
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formData.photo ? '✓ Gambar diunggah' : 'PNG, JPG maks 5MB'}
                      </p>
                    </div>
                  </label>
                </div>
                {formData.photo && (
                  <div className="mt-4 relative group">
                    <img
                      src={formData.photo}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-xl border-2 border-[#D4AF37]/30 shadow-lg"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                      <p className="text-white text-sm">📸 Preview Image</p>
                    </div>
                  </div>
                )}
              </div>

              {/* New Fields Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D4AF37]/20 to-[#FFD700]/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                  </div>
                  <h4 className="font-semibold text-gray-700">Detail Tambahan</h4>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Hotel className="w-4 h-4 text-[#D4AF37]" />
                      Hotel <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={formData.hotel}
                      onChange={(e) => setFormData({ ...formData, hotel: e.target.value })}
                      required
                      className="border-[#D4AF37]/30 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20 bg-white/50 backdrop-blur-sm"
                      placeholder="Hotel bintang 5 di Makkah"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Plane className="w-4 h-4 text-[#D4AF37]" />
                      Maskapai <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={formData.airline}
                      onChange={(e) => setFormData({ ...formData, airline: e.target.value })}
                      required
                      className="border-[#D4AF37]/30 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20 bg-white/50 backdrop-blur-sm"
                      placeholder="Penerbangan langsung dari Jakarta"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <List className="w-4 h-4 text-[#D4AF37]" />
                      Termasuk (satu per baris) <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      value={formData.includes}
                      onChange={(e) => setFormData({ ...formData, includes: e.target.value })}
                      rows={4}
                      placeholder="✈️ Direct flight from Jakarta&#10;🏨 5-star hotel in Makkah&#10;🍽️ Full board meals&#10;🚌 Private transportation"
                      className="border-[#D4AF37]/30 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20 bg-white/50 backdrop-blur-sm"
                    />
                    <p className="text-xs text-gray-500">Tambahkan emoji agar terlihat lebih menarik!</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <List className="w-4 h-4 text-[#D4AF37]" />
                      Tidak Termasuk (satu per baris) <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      value={formData.excludes}
                      onChange={(e) => setFormData({ ...formData, excludes: e.target.value })}
                      rows={4}
                      placeholder="Visa fees&#10;Travel insurance"
                      className="border-[#D4AF37]/30 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20 bg-white/50 backdrop-blur-sm"
                    />
                    <p className="text-xs text-gray-500">Tambahkan emoji agar terlihat lebih menarik!</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <List className="w-4 h-4 text-[#D4AF37]" />
                      Jadwal Perjalanan (satu per baris) <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      value={formData.itinerary}
                      onChange={(e) => setFormData({ ...formData, itinerary: e.target.value })}
                      rows={4}
                      placeholder="Hari 1: Tiba di Jeddah&#10;Hari 2: Ziarah ke Masjid Nabawi&#10;Hari 3: Ibadah di Masjidil Haram"
                      className="border-[#D4AF37]/30 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20 bg-white/50 backdrop-blur-sm"
                    />
                    <p className="text-xs text-gray-500">Tambahkan emoji agar terlihat lebih menarik!</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <List className="w-4 h-4 text-[#D4AF37]" />
                      Highlight (satu per baris) <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      value={formData.highlight}
                      onChange={(e) => setFormData({ ...formData, highlight: e.target.value })}
                      rows={4}
                      placeholder="Wisata eksklusif Makkah&#10;Transportasi pribadi ke tempat suci&#10;Makan 3 kali sehari (Full board)"
                      className="border-[#D4AF37]/30 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20 bg-white/50 backdrop-blur-sm"
                    />
                    <p className="text-xs text-gray-500">Tambahkan emoji agar terlihat lebih menarik!</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#D4AF37]" />
                      Syarat & Ketentuan <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      value={formData.terms}
                      onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                      rows={4}
                      placeholder="Syarat dan ketentuan paket"
                      className="border-[#D4AF37]/30 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20 bg-white/50 backdrop-blur-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#D4AF37]" />
                      Titik Kumpul <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={formData.meetingPoint}
                      onChange={(e) => setFormData({ ...formData, meetingPoint: e.target.value })}
                      required
                      className="border-[#D4AF37]/30 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20 bg-white/50 backdrop-blur-sm"
                      placeholder="Titik kumpul keberangkatan paket"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#D4AF37]" />
                      Nomor WhatsApp <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={formData.whatsappNumber}
                      onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                      required
                      className="border-[#D4AF37]/30 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20 bg-white/50 backdrop-blur-sm"
                      placeholder="Nomor WhatsApp untuk info paket"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-[#D4AF37]" />
                      Tour Leader Bertugas
                    </Label>
                    <Select value={formData.assignedTourLeaderId || 'none'} onValueChange={(value: any) => setFormData({ ...formData, assignedTourLeaderId: value === 'none' ? '' : value })}>
                      <SelectTrigger className="border-[#D4AF37]/30 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20 bg-white/50 backdrop-blur-sm">
                        <SelectValue placeholder="Pilih tour leader (opsional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Tidak Ada (Tanpa Tour Leader)</SelectItem>
                        {tourLeaders.length === 0 ? (
                          <SelectItem value="no-leaders-available" disabled>Tidak ada tour leader yang tersedia</SelectItem>
                        ) : (
                          tourLeaders.map((leader: any) => (
                            <SelectItem key={leader.id} value={leader.id}>
                              {leader.displayName || leader.email}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      {tourLeaders.length === 0
                        ? '⚠️ Belum ada tour leader yang disetujui. Setujui di Manajemen Pengguna.'
                        : `✅ ${tourLeaders.length} tour leader tersedia`
                      }
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-[#D4AF37]" />
                      Muthawif Bertugas
                    </Label>
                    <Select value={formData.assignedMuthawifId || 'none'} onValueChange={(value: any) => setFormData({ ...formData, assignedMuthawifId: value === 'none' ? '' : value })}>
                      <SelectTrigger className="border-[#D4AF37]/30 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20 bg-white/50 backdrop-blur-sm">
                        <SelectValue placeholder="Pilih muthawif (opsional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Tidak Ada (Tanpa Muthawif)</SelectItem>
                        {muthawifs.length === 0 ? (
                          <SelectItem value="no-muthawifs-available" disabled>Tidak ada muthawif yang tersedia</SelectItem>
                        ) : (
                          muthawifs.map((muthawif: any) => (
                            <SelectItem key={muthawif.id} value={muthawif.id}>
                              {muthawif.displayName || muthawif.email}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      {muthawifs.length === 0
                        ? '⚠️ Belum ada muthawif yang disetujui. Setujui di Manajemen Pengguna.'
                        : `✅ ${muthawifs.length} muthawif tersedia`
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* ✅ NEW: Package Items Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D4AF37]/20 to-[#FFD700]/20 flex items-center justify-center">
                      <ShoppingBag className="w-4 h-4 text-[#D4AF37]" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-700">Perlengkapan dalam Paket</h4>
                      <p className="text-xs text-gray-500">Item yang sudah termasuk dalam harga (all-in)</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={() => {
                      console.log('➕ Adding new package item...');
                      setPackageItems([...packageItems, { itemName: '', quantity: '1' }]);
                      console.log('✅ Package item added');
                    }}
                    size="sm"
                    className="bg-gradient-to-r from-[#D4AF37] to-[#FFD700] hover:from-[#C5A572] hover:to-[#D4AF37] text-white shadow-md"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Tambah Item
                  </Button>
                </div>

                {packageItems.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/50">
                    <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium mb-1">Belum Ada Perlengkapan</p>
                    <p className="text-xs text-gray-500">Klik "Tambah Item" untuk menambah perlengkapan paket</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {packageItems.map((item, index) => (
                      <div key={index} className="flex gap-3 items-start p-3 bg-white/70 rounded-lg border border-[#D4AF37]/20 hover:border-[#D4AF37] transition-all">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_120px] gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs text-gray-600">Nama Item</Label>
                            <Input
                              placeholder="Contoh: Mihrab, Tasbih, Air Zam-zam 5L..."
                              value={item.itemName}
                              onChange={(e) => {
                                const newItems = [...packageItems];
                                newItems[index].itemName = e.target.value;
                                setPackageItems(newItems);
                              }}
                              className="border-[#D4AF37]/30 focus:border-[#D4AF37] h-9"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-gray-600">Jumlah</Label>
                            <Input
                              type="number"
                              min="1"
                              placeholder="1"
                              value={item.quantity}
                              onChange={(e) => {
                                const newItems = [...packageItems];
                                newItems[index].quantity = e.target.value;
                                setPackageItems(newItems);
                              }}
                              className="border-[#D4AF37]/30 focus:border-[#D4AF37] h-9"
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setPackageItems(packageItems.filter((_, i) => i !== index));
                          }}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 mt-5"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex items-start gap-2 p-3 bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-200 rounded-lg">
                      <Sparkles className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-blue-700">
                        💡 <strong>Tips:</strong> Item-item ini sudah termasuk dalam harga paket (all-in). Jamaah tidak perlu membayar tambahan untuk perlengkapan ini.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* ✅ File Upload Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D4AF37]/20 to-[#FFD700]/20 flex items-center justify-center">
                    <File className="w-4 h-4 text-[#D4AF37]" />
                  </div>
                  <h4 className="font-semibold text-gray-700">File Upload</h4>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <File className="w-4 h-4 text-[#D4AF37]" />
                      File Paket
                    </Label>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handlePackageFileUpload}
                        id="package-file-upload"
                        className="hidden"
                      />
                      <label
                        htmlFor="package-file-upload"
                        className="flex items-center gap-3 p-4 border-2 border-dashed border-[#D4AF37]/30 rounded-xl bg-white/50 backdrop-blur-sm cursor-pointer hover:border-[#D4AF37] hover:bg-[#FFF9F0]/50 transition-all"
                      >
                        <File className="w-5 h-5 text-[#D4AF37]" />
                        <div>
                          <p className="text-sm font-medium text-[#D4AF37] hover:underline">
                            Pilih file
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {packageFile
                              ? '✓ File dipilih: ' + packageFile.name
                              : packageFileName
                                ? '📄 Saat ini: ' + packageFileName
                                : 'PDF, DOC, DOCX maks 10MB'}
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <File className="w-4 h-4 text-[#D4AF37]" />
                      File Jadwal
                    </Label>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleScheduleFileUpload}
                        id="schedule-file-upload"
                        className="hidden"
                      />
                      <label
                        htmlFor="schedule-file-upload"
                        className="flex items-center gap-3 p-4 border-2 border-dashed border-[#D4AF37]/30 rounded-xl bg-white/50 backdrop-blur-sm cursor-pointer hover:border-[#D4AF37] hover:bg-[#FFF9F0]/50 transition-all"
                      >
                        <File className="w-5 h-5 text-[#D4AF37]" />
                        <div>
                          <p className="text-sm font-medium text-[#D4AF37] hover:underline">
                            Pilih file
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {scheduleFile
                              ? '✓ File dipilih: ' + scheduleFile.name
                              : scheduleFileName
                                ? '📄 Saat ini: ' + scheduleFileName
                                : 'PDF, DOC, DOCX maks 10MB'}
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-[#D4AF37]/20">
                <Button
                  type="submit"
                  disabled={uploadingFiles || (!editingPackage && !isFormValid())} // ✅ Disable saat uploading atau form invalid
                  className="w-full h-12 bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#D4AF37] hover:from-[#C5A572] hover:via-[#D4AF37] hover:to-[#C5A572] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 bg-[length:200%_auto] hover:bg-right disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingFiles ? (
                    <>
                      <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {editingPackage ? 'Memperbarui...' : 'Membuat...'}
                    </>
                  ) : editingPackage ? (
                    <>
                      <Edit className="w-5 h-5 mr-2" />
                      Perbarui Paket
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5 mr-2" />
                      Buat Paket
                    </>
                  )}
                </Button>
                {/* ✅ Helper text showing validation status */}
                {!editingPackage && !isFormValid() && (
                  <p className="text-xs text-red-500 mt-2 text-center">
                    ⚠️ Harap isi semua kolom yang wajib diisi (ditandai dengan *)
                  </p>
                )}
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Slots</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {packages.map((pkg) => (
              <TableRow key={pkg.id}>
                <TableCell>{pkg.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{pkg.type.toUpperCase()}</Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      pkg.packageClass === 'super-vvip'
                        ? 'bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-white border-[#FFD700]'
                        : pkg.packageClass === 'vvip'
                          ? 'bg-gradient-to-r from-[#D4AF37] to-[#C5A572] text-white border-[#D4AF37]'
                          : pkg.packageClass === 'vip'
                            ? 'bg-gradient-to-r from-[#C0C0C0] to-[#A8A8A8] text-white border-[#C0C0C0]'
                            : 'bg-gray-100 text-gray-700 border-gray-300'
                    }
                  >
                    {pkg.packageClass === 'super-vvip' ? '⭐⭐⭐⭐ Super VVIP' :
                      pkg.packageClass === 'vvip' ? '⭐⭐⭐ VVIP' :
                        pkg.packageClass === 'vip' ? '⭐⭐ VIP' :
                          '⭐ Reguler'}
                  </Badge>
                </TableCell>
                <TableCell>Rp {pkg.price.toLocaleString('id-ID')}</TableCell>
                <TableCell>{pkg.duration} days</TableCell>
                <TableCell>{pkg.availableSlots} / {pkg.maxParticipants}</TableCell>
                <TableCell>
                  <Badge variant={pkg.status === 'active' ? 'default' : 'secondary'}>
                    {pkg.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(pkg)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(pkg.id)}>
                      <Trash className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md bg-gradient-to-br from-white via-[#FFF9F0] to-white backdrop-blur-xl border-2 border-red-200/50 shadow-2xl rounded-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Hapus Package</DialogTitle>
            <DialogDescription>
              Konfirmasi penghapusan package dari database
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-6 px-4">
            {/* Warning Icon */}
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center mb-4 animate-pulse">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>

            {/* Title */}
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Hapus Package?
            </h3>

            {/* Description */}
            <p className="text-gray-600 mb-6">
              Apakah Anda yakin ingin menghapus package ini?
              <br />
              <span className="text-sm text-red-500">Tindakan ini tidak dapat dibatalkan.</span>
            </p>

            {/* Buttons */}
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                className="px-6 py-2 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 rounded-xl font-semibold transition-all"
              >
                Batal
              </Button>
              <Button
                onClick={confirmDelete}
                className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Ya, Hapus
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PackageManagement;