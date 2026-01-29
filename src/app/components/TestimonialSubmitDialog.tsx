import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Star, Send, Upload, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '../../config/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { compressImage } from '../../utils/imageCompression';

interface TestimonialSubmitDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  userEmail: string;
  packageName?: string;
}

const TestimonialSubmitDialog: React.FC<TestimonialSubmitDialogProps> = ({
  open,
  onClose,
  userId,
  userName,
  userEmail,
  packageName,
}) => {
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [hoveredStar, setHoveredStar] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [photo, setPhoto] = useState<string>('');
  const [photoPreview, setPhotoPreview] = useState<string>('');

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar (JPG, PNG, WebP)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB');
      return;
    }

    try {
      // Compress image
      const compressedBase64 = await compressImage(file);
      setPhoto(compressedBase64);
      setPhotoPreview(compressedBase64);
      toast.success('✅ Foto berhasil diupload');
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('❌ Gagal mengupload foto');
    }
  };

  const removePhoto = () => {
    setPhoto('');
    setPhotoPreview('');
    toast.success('Foto dihapus');
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error('Mohon isi testimoni Anda');
      return;
    }

    if (content.trim().length < 20) {
      toast.error('Testimoni minimal 20 karakter');
      return;
    }

    try {
      setSubmitting(true);

      await addDoc(collection(db, 'testimonials'), {
        userId,
        userName,
        userEmail,
        rating,
        content: content.trim(),
        imageUrl: photo || '', // Add photo to testimonial
        packageName: packageName || 'Paket Umrah',
        createdAt: Timestamp.now(),
        verified: true, // Auto-verified for alumni
        status: 'approved', // Auto-approved
        userRole: 'alumni',
      });

      toast.success('✅ Testimoni berhasil dikirim! Terima kasih atas sharingnya 🙏');
      
      // Reset form
      setContent('');
      setRating(5);
      setPhoto('');
      setPhotoPreview('');
      onClose();

      // Reload page to show new testimonial
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error submitting testimonial:', error);
      toast.error('Gagal mengirim testimoni. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl bg-gradient-to-r from-[#D4AF37] to-[#FFD700] bg-clip-text text-transparent">
            ✨ Bagikan Pengalaman Spiritual Anda
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Testimoni Anda akan membantu calon jamaah untuk memilih paket umrah yang tepat
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* User Info Display */}
          <div className="bg-gradient-to-br from-[#D4AF37]/10 to-[#FFD700]/10 rounded-xl p-4 border border-[#D4AF37]/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#FFD700] text-white flex items-center justify-center font-bold text-lg">
                {userName?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div>
                <p className="font-semibold text-gray-800">{userName}</p>
                <p className="text-sm text-gray-600">{userEmail}</p>
                {packageName && (
                  <p className="text-xs text-[#D4AF37] mt-1">📦 {packageName}</p>
                )}
              </div>
            </div>
          </div>

          {/* Rating Selection */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Star className="w-4 h-4 text-[#FFD700]" />
              Berikan Rating
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 transition-colors ${
                      star <= (hoveredStar || rating)
                        ? 'fill-[#FFD700] text-[#FFD700]'
                        : 'fill-gray-200 text-gray-300'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-4 text-2xl font-bold text-[#D4AF37]">
                {rating}/5
              </span>
            </div>
            <p className="text-xs text-gray-500 italic">
              {rating === 5 && '⭐ Sangat Puas - Pengalaman Luar Biasa!'}
              {rating === 4 && '⭐ Puas - Pengalaman Sangat Baik'}
              {rating === 3 && '⭐ Cukup - Pengalaman Baik'}
              {rating === 2 && '⭐ Kurang - Perlu Perbaikan'}
              {rating === 1 && '⭐ Sangat Kurang'}
            </p>
          </div>

          {/* Testimonial Content */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              Ceritakan Pengalaman Anda <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Bagikan pengalaman spiritual Anda selama umrah... 

Contoh:
- Bagaimana pelayanan tour leader?
- Bagaimana fasilitas hotel dan transportasi?
- Pengalaman spiritual apa yang paling berkesan?
- Apa yang membuat perjalanan umrah Anda special?

Minimal 20 karakter"
              rows={8}
              className="border-[#D4AF37]/30 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20 resize-none"
            />
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Minimal 20 karakter</span>
              <span className={content.length < 20 ? 'text-red-500' : 'text-green-600'}>
                {content.length} karakter
              </span>
            </div>
          </div>

          {/* Photo Upload */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-[#D4AF37]"/>
              Upload Foto Pengalaman (Opsional)
            </label>
            
            {!photoPreview ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#D4AF37] transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                />
                <label htmlFor="photo-upload" className="cursor-pointer">
                  <Upload className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Klik untuk upload foto
                  </p>
                  <p className="text-xs text-gray-500">
                    JPG, PNG, atau WebP (Max 5MB)
                  </p>
                </label>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg border-2 border-[#D4AF37]"
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors shadow-lg"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-lg">
                  ✓ Foto terupload
                </div>
              </div>
            )}
          </div>

          {/* Guidelines */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-blue-900 mb-2">💡 Tips Menulis Testimoni:</p>
            <ul className="text-xs text-blue-800 space-y-1 ml-4">
              <li>• Ceritakan pengalaman Anda secara jujur dan detail</li>
              <li>• Hindari kata-kata yang tidak pantas</li>
              <li>• Testimoni Anda akan membantu calon jamaah lainnya</li>
              <li>• Testimoni akan langsung ditampilkan setelah submit</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
              disabled={submitting}
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || content.trim().length < 20}
              className="flex-1 bg-gradient-to-r from-[#D4AF37] to-[#FFD700] hover:opacity-90 text-white"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Kirim Testimoni
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TestimonialSubmitDialog;