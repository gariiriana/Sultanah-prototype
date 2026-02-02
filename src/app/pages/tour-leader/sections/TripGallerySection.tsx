import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { toast } from 'sonner';
import { collection, query, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../../../../config/firebase';
import { useAuth } from '../../../../contexts/AuthContext';
import imageCompression from 'browser-image-compression';
import jsPDF from 'jspdf';
import {
  Camera,
  Upload,
  Trash2,
  X,
  ImageIcon,
  Eye,
  Printer,
  MapPin
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../components/ui/alert-dialog';

interface TripPhoto {
  id: string;
  title: string;
  description?: string;
  location: string;
  date: string;
  imageBase64: string;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
  category: 'masjid' | 'hotel' | 'activity' | 'group' | 'other';
}

const TripGallerySection: React.FC = () => {
  const { userProfile } = useAuth();
  const [photos, setPhotos] = useState<TripPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<TripPhoto | null>(null);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedExportCategories, setSelectedExportCategories] = useState<TripPhoto['category'][]>(['masjid', 'hotel', 'activity', 'group', 'other']);
  const [deleteCategoryData, setDeleteCategoryData] = useState<TripPhoto['category'] | null>(null);

  const [formData, setFormData] = useState({
    location: '',
    date: new Date().toISOString().split('T')[0],
    category: 'activity' as TripPhoto['category'],
  });

  const categories: { id: TripPhoto['category']; label: string; icon: string }[] = [
    { id: 'masjid', label: 'Masjid & Landmark', icon: '🕌' },
    { id: 'hotel', label: 'Hotel & Akomodasi', icon: '🏨' },
    { id: 'activity', label: 'Kegiatan & Manasik', icon: '🎯' },
    { id: 'group', label: 'Foto Grup / Jamaah', icon: '👥' },
    { id: 'other', label: 'Lain-lain', icon: '📷' },
  ];

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      // ✅ FIX: Remove orderBy to avoid Firestore index requirement
      const q = query(collection(db, 'tripGallery'));

      const querySnapshot = await getDocs(q);
      let photosData: TripPhoto[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as TripPhoto));

      // Sort client-side instead
      photosData = photosData.sort((a, b) =>
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      );

      setPhotos(photosData);
    } catch (error) {
      console.error('Error fetching photos:', error);
      toast.error('Failed to load gallery');
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit for bulk
        toast.error(`${file.name} is too large (>10MB)`);
        return false;
      }
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(true);
    try {
      const compressedImages = await Promise.all(
        validFiles.map(async (file) => {
          const options = {
            maxSizeMB: 0.6, // Safer for Firestore 1MB limit (base64 adds +33%)
            maxWidthOrHeight: 1000,
            useWebWorker: true,
          };
          const compressedFile = await imageCompression(file, options);
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(compressedFile);
          });
        })
      );

      setPreviewImages(prev => [...prev, ...compressedImages]);
      toast.success(`${compressedImages.length} foto ditambahkan ke antrean`);
    } catch (error) {
      console.error('Error processing images:', error);
      toast.error('Gagal memproses gambar');
    } finally {
      setUploading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (previewImages.length === 0) {
      toast.error('Silakan pilih minimal satu foto');
      return;
    }

    if (!formData.location.trim()) {
      toast.error('Silakan isi lokasi trip (contoh: Madinah)');
      return;
    }

    setUploading(true);

    try {
      const batch = writeBatch(db);
      const galleryRef = collection(db, 'tripGallery');

      previewImages.forEach((imgBase64, index) => {
        // Safe check for base64 size (1 character ≈ 1 byte)
        if (imgBase64.length > 1000000) {
          toast.error(`Foto ke-${index + 1} terlalu besar bahkan setelah dikompres.`);
          return;
        }

        const newDocRef = doc(galleryRef);
        const photoData: Omit<TripPhoto, 'id'> = {
          title: `Trip Update ${formData.location}`,
          description: '',
          location: formData.location,
          date: formData.date,
          category: formData.category,
          imageBase64: imgBase64,
          uploadedBy: userProfile?.uid || '',
          uploadedByName: userProfile?.displayName || 'Tour Leader',
          uploadedAt: new Date().toISOString(),
        };
        batch.set(newDocRef, photoData);
      });

      await batch.commit();
      toast.success(`${previewImages.length} foto berhasil diunggah!`);
      setPreviewImages([]);
      fetchPhotos();
    } catch (error) {
      console.error('Error batch uploading:', error);
      toast.error('Gagal mengunggah foto');
    } finally {
      setUploading(false);
    }
  };

  const handleExportPDF = async (selectedCats: TripPhoto['category'][]) => {
    const filteredPhotos = photos.filter(p => selectedCats.includes(p.category));

    if (filteredPhotos.length === 0) {
      toast.error('Tidak ada foto dalam kategori yang dipilih');
      return;
    }

    setExportingPDF(true);
    setIsExportModalOpen(false);
    const toastId = toast.loading('Membuat Album PDF Selektif...');

    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);

      // Helper function for consistent page design
      const drawPageDesign = (pageNum: number) => {
        // Deep Navy Background
        doc.setFillColor(15, 15, 35);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');

        // Sultanah Branding Header
        doc.setTextColor(212, 175, 55); // Gold
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('SULTANAH', margin, 20);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(255, 255, 255, 0.6);
        doc.text('UMRAH & HALAL TRAVEL', margin, 25);

        // Trip Info Header (Right)
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(formData.location || 'Trip Gallery', pageWidth - margin, 20, { align: 'right' });

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID')}`, pageWidth - margin, 25, { align: 'right' });

        // Decorative Line
        doc.setDrawColor(212, 175, 55, 0.3);
        doc.line(margin, 30, pageWidth - margin, 30);

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255, 0.4);
        doc.text(`Halaman ${pageNum}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      };

      // --- PAGE 1: COVER ---
      doc.setFillColor(15, 15, 35);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');

      // Hero Text
      doc.setTextColor(212, 175, 55);
      doc.setFontSize(50);
      doc.setFont('helvetica', 'bold');
      doc.text('SULTANAH', pageWidth / 2, 80, { align: 'center' });

      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.text('ALBUM MEMORI PERJALANAN', pageWidth / 2, 95, { align: 'center', charSpace: 2 });

      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(1);
      doc.line(40, 110, pageWidth - 40, 110);

      doc.setFontSize(22);
      doc.text((formData.location || 'ALBUM TRIP').toUpperCase(), pageWidth / 2, 130, { align: 'center' });

      doc.setFontSize(12);
      doc.setTextColor(200, 200, 200);
      doc.text(`Bersama: ${userProfile?.displayName || 'Tour Leader'}`, pageWidth / 2, 145, { align: 'center' });

      // --- PHOTO ENTRIES ---
      const photosPerPage = 4;
      const cardMargin = 8;
      const cardWidth = (contentWidth / 2) - (cardMargin / 2);
      const cardHeight = (pageHeight - 60) / 2;

      for (let i = 0; i < filteredPhotos.length; i++) {
        if (i % photosPerPage === 0) {
          doc.addPage();
          drawPageDesign(Math.floor(i / photosPerPage) + 1);
        }

        const photo = filteredPhotos[i];
        const pageIdx = i % photosPerPage;
        const col = pageIdx % 2;
        const row = Math.floor(pageIdx / 2);

        const currentX = margin + (col * (cardWidth + cardMargin));
        const currentY = 40 + (row * (cardHeight + cardMargin));

        // Individual Photo Card Logic
        (doc as any).saveGraphicsState();
        try {
          doc.setFillColor(255, 255, 255, 0.05);
          doc.roundedRect(currentX, currentY, cardWidth, cardHeight, 4, 4, 'F');
          doc.setDrawColor(255, 255, 255, 0.1);
          doc.roundedRect(currentX, currentY, cardWidth, cardHeight, 4, 4, 'S');

          const locText = (photo.location || 'Trip Memory').toUpperCase();
          const dateText = new Date(photo.date || photo.uploadedAt || new Date()).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric'
          });

          doc.setFontSize(10);
          doc.setTextColor(212, 175, 55);
          doc.setFont('helvetica', 'bold');
          doc.text(locText, currentX + 5, currentY + 10);

          doc.setFontSize(7);
          doc.setTextColor(200, 200, 200);
          doc.setFont('helvetica', 'normal');
          doc.text(dateText, currentX + 5, currentY + 14);

          if (photo.imageBase64) {
            try {
              const imgAreaX = currentX + 5;
              const imgAreaY = currentY + 18;
              const imgAreaW = cardWidth - 10;
              const imgAreaH = cardHeight - 25;

              const imgProps = (doc as any).getImageProperties(photo.imageBase64);
              const ratio = imgProps.width / imgProps.height;

              let drawW = imgAreaW;
              let drawH = imgAreaW / ratio;
              if (drawH > imgAreaH) {
                drawH = imgAreaH;
                drawW = imgAreaH * ratio;
              }

              const offX = (imgAreaW - drawW) / 2;
              const offY = (imgAreaH - drawH) / 2;
              const finalX = imgAreaX + offX;
              const finalY = imgAreaY + offY;

              const mimeMatch = photo.imageBase64.match(/^data:image\/(\w+);base64,/);
              const format = (mimeMatch ? mimeMatch[1].toUpperCase() : 'JPEG') as any;

              (doc as any).saveGraphicsState();
              try {
                doc.roundedRect(finalX, finalY, drawW, drawH, 3, 3, 'S');
                doc.clip();
                doc.addImage(photo.imageBase64, format, finalX, finalY, drawW, drawH, undefined, 'FAST');
              } finally {
                (doc as any).restoreGraphicsState();
              }
            } catch (err) {
              console.warn(`Error rendering image ${i + 1}:`, err);
            }
          }
        } finally {
          (doc as any).restoreGraphicsState();
        }
      }

      doc.save(`Sultanah-Album-Selektif.pdf`);
      toast.success('Album PDF Selektif berhasil diunduh!');
    } catch (error) {
      console.error('PDF Export Error:', error);
      toast.error('Gagal membuat PDF.');
    } finally {
      setExportingPDF(false);
      toast.dismiss(toastId);
    }
  };

  const handleBulkDelete = async (category: TripPhoto['category']) => {
    const photosToDelete = photos.filter(p => p.category === category);
    if (photosToDelete.length === 0) return;

    const toastId = toast.loading(`Menghapus ${photosToDelete.length} foto...`);
    try {
      const batch = writeBatch(db);
      photosToDelete.forEach(p => {
        batch.delete(doc(db, 'tripGallery', p.id));
      });
      await batch.commit();
      toast.success(`Berhasil menghapus kategori ${category}`);
      setDeleteCategoryData(null);
      fetchPhotos();
    } catch (error) {
      console.error('Bulk Delete Error:', error);
      toast.error('Gagal menghapus foto massal');
    } finally {
      toast.dismiss(toastId);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteDoc(doc(db, 'tripGallery', deleteId));
      toast.success('Foto berhasil dihapus');
      setDeleteId(null);
      fetchPhotos();
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast.error('Gagal menghapus foto');
    }
  };

  const getCategoryIcon = (category: TripPhoto['category']) => {
    switch (category) {
      case 'masjid':
        return '🕌';
      case 'hotel':
        return '🏨';
      case 'activity':
        return '🎯';
      case 'group':
        return '👥';
      default:
        return '📷';
    }
  };

  const getCategoryColor = (category: TripPhoto['category']) => {
    switch (category) {
      case 'masjid':
        return 'bg-green-100 text-green-700';
      case 'hotel':
        return 'bg-blue-100 text-blue-700';
      case 'activity':
        return 'bg-purple-100 text-purple-700';
      case 'group':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
        <div className="flex items-center justify-center py-12">
          <div className="w-16 h-16 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] p-3 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
              <Upload className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-2xl font-bold text-white">Upload Photos</h2>
              <p className="text-white/90 text-[10px] sm:text-sm">Share memories with jamaah</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleUpload} className="p-3 sm:p-6 space-y-3 sm:space-y-5">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Photos (Bisa pilih banyak)
            </label>
            <div className="relative">
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
              />
              <div className="space-y-4">
                <label
                  htmlFor="photo-upload"
                  className="flex flex-col items-center justify-center w-full min-h-[80px] sm:min-h-[120px] p-3 sm:p-4 text-center border-2 border-dashed border-gray-300 rounded-xl hover:border-[#D4AF37] transition-colors cursor-pointer bg-gray-50 hover:bg-gray-100"
                >
                  <Camera className="w-6 h-6 sm:w-10 sm:h-10 text-gray-400 mb-1" />
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Pilih foto trip</p>
                  <p className="text-[9px] sm:text-xs text-gray-400 mt-0.5">
                    Maksimal 10 foto
                  </p>
                </label>

                {previewImages.length > 0 && (
                  <div className="grid grid-cols-4 xs:grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2">
                    {previewImages.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                        <img src={img} className="w-full h-full object-cover" alt={`Preview ${idx}`} />
                        <button
                          type="button"
                          onClick={() => setPreviewImages(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 p-1 bg-red-500/80 text-white rounded-md xs:opacity-0 xs:group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <label
                      htmlFor="photo-upload"
                      className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-[#D4AF37] hover:bg-gray-50 bg-gray-50/50"
                    >
                      <Upload className="w-5 h-5 text-gray-400" />
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <Input
                type="text"
                placeholder="e.g., Madinah"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="h-12"
                required
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trip Date
              </label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="h-12"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as TripPhoto['category'] })}
                className="w-full h-12 px-4 bg-white border border-gray-300 rounded-xl focus:border-[#D4AF37] focus:ring-[#D4AF37]/30 focus:outline-none"
              >
                <option value="masjid">🕌 Masjid</option>
                <option value="hotel">🏨 Hotel</option>
                <option value="activity">🎯 Activity</option>
                <option value="group">👥 Group Photo</option>
                <option value="other">📷 Other</option>
              </select>
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={uploading || previewImages.length === 0}
            className="w-full h-12 bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] hover:opacity-90 text-white shadow-lg font-semibold"
          >
            {uploading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Memproses {previewImages.length} Foto...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Unggah {previewImages.length} Foto ke Galeri
              </span>
            )}
          </Button>
        </form>
      </div>

      {/* Gallery Grid */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 p-3 sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
                <Camera className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h2 className="text-base sm:text-2xl font-bold text-white">Gallery</h2>
                <p className="text-white/90 text-[10px] sm:text-sm">{photos.length} photos</p>
              </div>
            </div>

            {/* ✅ NEW: PDF Export Button - Compact on Mobile */}
            <Button
              onClick={() => setIsExportModalOpen(true)}
              disabled={exportingPDF || photos.length === 0}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 text-white gap-2 shadow-xl py-2 px-3 sm:px-4 text-xs h-9 sm:h-10"
            >
              {exportingPDF ? (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              )}
              <span className="hidden xs:inline">{exportingPDF ? 'Wait...' : 'PDF Album'}</span>
              <span className="xs:hidden">{exportingPDF ? '...' : 'PDF'}</span>
            </Button>
          </div>
        </div>

        {/* Gallery Sections by Category */}
        <div className="space-y-12 p-6">
          {categories.map((cat) => {
            const catPhotos = photos.filter(p => p.category === cat.id);
            if (catPhotos.length === 0) return null;

            return (
              <div key={cat.id} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 p-3 sm:p-6 border-b border-gray-100 italic">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className="text-xl sm:text-3xl">{cat.icon}</span>
                      <div>
                        <h3 className="text-sm sm:text-xl font-bold text-gray-800">{cat.label}</h3>
                        <p className="text-gray-500 text-[10px] sm:text-sm">{catPhotos.length} foto tersedia</p>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteCategoryData(cat.id)}
                      className="rounded-lg gap-2 text-[10px] sm:text-sm h-8 px-2 sm:px-3 shrink-0"
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden xs:inline">Hapus Kategori</span>
                      <span className="xs:hidden">Hapus</span>
                    </Button>
                  </div>
                </div>

                <div className="p-2 sm:p-6">
                  <div className="grid grid-cols-3 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-4">
                    {catPhotos.map((photo, index) => (
                      <motion.div
                        key={photo.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="group relative bg-white rounded-lg sm:rounded-xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer"
                        onClick={() => setSelectedPhoto(photo)}
                      >
                        <div className="aspect-square relative">
                          <img
                            src={photo.imageBase64}
                            alt={photo.location}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            loading="lazy"
                          />

                          {/* Overlay - Always visible on desktop hover, compact on mobile */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 sm:p-3">
                            <div className="flex items-center justify-between gap-1">
                              <div className="flex items-center gap-1 min-w-0">
                                <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white shrink-0" />
                                <span className="text-[8px] sm:text-xs text-white font-medium truncate">
                                  {photo.location}
                                </span>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteId(photo.id);
                                }}
                                className="p-1 sm:p-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-md transition-colors shrink-0"
                              >
                                <Trash2 className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}

          {photos.length === 0 && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">Berapa foto pun belum ada di galeri</p>
            </div>
          )}
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* Selective Export Modal */}
      <AlertDialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
        <AlertDialogContent className="bg-white rounded-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Pilih Kategori untuk Album</AlertDialogTitle>
            <AlertDialogDescription>
              Pilih kategori foto yang ingin dimasukkan ke dalam album PDF.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-3">
            {categories.map(cat => {
              const count = photos.filter(p => p.category === cat.id).length;
              if (count === 0) return null;
              return (
                <label key={cat.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedExportCategories.includes(cat.id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedExportCategories(prev => [...prev, cat.id]);
                      else setSelectedExportCategories(prev => prev.filter(c => c !== cat.id));
                    }}
                    className="w-5 h-5 rounded accent-[#D4AF37]"
                  />
                  <div className="flex-1">
                    <span className="flex items-center gap-2 font-medium">
                      {cat.icon} {cat.label}
                    </span>
                    <span className="text-xs text-gray-500">{count} foto</span>
                  </div>
                </label>
              );
            })}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleExportPDF(selectedExportCategories)}
              className="bg-[#D4AF37] hover:bg-[#B48F27] text-white rounded-xl"
            >
              Gas, Buat PDF!
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Category Confirmation */}
      <AlertDialog open={!!deleteCategoryData} onOpenChange={() => setDeleteCategoryData(null)}>
        <AlertDialogContent className="bg-white rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Seluruh Kategori?</AlertDialogTitle>
            <AlertDialogDescription>
              Semua foto dalam kategori <strong>{categories.find(c => c.id === deleteCategoryData)?.label}</strong> akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteCategoryData && handleBulkDelete(deleteCategoryData)}
              className="bg-red-500 hover:bg-red-600 text-white rounded-xl"
            >
              Iya, Hapus Semua
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Photo Detail Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Image */}
              <div className="relative">
                <img
                  src={selectedPhoto.imageBase64}
                  alt={selectedPhoto.title}
                  className="w-full max-h-[60vh] object-contain bg-gray-900"
                />
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Details */}
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(selectedPhoto.category)}`}>
                        {getCategoryIcon(selectedPhoto.category)} {selectedPhoto.category.charAt(0).toUpperCase() + selectedPhoto.category.slice(1)}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedPhoto.title}</h2>
                    <p className="text-gray-600">{selectedPhoto.location}</p>
                  </div>
                </div>

                {selectedPhoto.description && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-gray-700 leading-relaxed">{selectedPhoto.description}</p>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-gray-600 pt-4 border-t border-gray-200">
                  <div>
                    <span className="font-medium">Uploaded by:</span> {selectedPhoto.uploadedByName}
                  </div>
                  <div>
                    {new Date(selectedPhoto.uploadedAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* \u2705 NEW: Custom Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="bg-white rounded-2xl border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-gray-900">Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Apakah Anda yakin ingin menghapus foto ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="rounded-xl border-gray-200 hover:bg-gray-50 font-semibold">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold shadow-lg shadow-red-100"
            >
              Hapus Foto
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TripGallerySection;
