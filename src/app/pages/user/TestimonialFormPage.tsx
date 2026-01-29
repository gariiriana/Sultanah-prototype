import React, { useState } from 'react';
import { ArrowLeft, Star, Upload, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Textarea } from '../../components/ui/textarea';
import { useAuth } from '../../../contexts/AuthContext';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { toast } from 'sonner';
import { compressImage } from '../../../utils/imageCompression';

interface TestimonialFormPageProps {
  onBack: () => void;
}

const TestimonialFormPage: React.FC<TestimonialFormPageProps> = ({ onBack }) => {
  const { userProfile, currentUser } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [photo, setPhoto] = useState<string>('');
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [packageName, setPackageName] = useState('');
  const [loading, setLoading] = useState(false);

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
      toast.success('Foto berhasil diupload');
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Gagal mengupload foto');
    }
  };

  const removePhoto = () => {
    setPhoto('');
    setPhotoPreview('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!currentUser || !userProfile) {
      toast.error('Silakan login terlebih dahulu');
      return;
    }

    if (rating === 0) {
      toast.error('Pilih rating bintang terlebih dahulu');
      return;
    }

    if (!comment.trim()) {
      toast.error('Komentar wajib diisi');
      return;
    }

    if (comment.length < 20) {
      toast.error('Komentar minimal 20 karakter');
      return;
    }

    setLoading(true);

    try {
      // Create testimonial document (not review!)
      await addDoc(collection(db, 'testimonials'), {
        userId: currentUser.uid,
        userName: userProfile.displayName || 'Anonymous',
        userEmail: userProfile.email || currentUser.email,
        userCity: userProfile.identityInfo?.address?.city || 'Indonesia',
        userPhoto: userProfile.profilePhoto || '',
        packageName: packageName.trim() || 'Paket Umrah',
        bookingId: '', // Empty for consultation-based system
        rating: rating,
        comment: comment.trim(),
        imageUrl: photo, // Match the field name expected by TestimonialsSection
        verified: true, // ✅ AUTO-APPROVE: Langsung publish tanpa admin moderation
        status: 'approved', // ✅ Status approved untuk consistency
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      toast.success('Testimoni berhasil dipublikasikan!', {
        description: 'Testimoni Anda sudah muncul di halaman Testimoni dan bisa dilihat oleh semua orang.',
        duration: 5000,
      });

      // Reset form
      setRating(0);
      setComment('');
      setPackageName('');
      setPhoto('');
      setPhotoPreview('');

      // Go back after delay
      setTimeout(() => {
        onBack();
      }, 2000);
    } catch (error) {
      console.error('Error submitting testimonial:', error);
      toast.error('Gagal mengirim testimoni. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-12">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-[#D4AF37] transition-colors text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Kembali</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Page Title */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] bg-clip-text text-transparent mb-2">
            Bagikan Pengalaman Spiritual Anda
          </h1>
          <p className="text-sm sm:text-base text-gray-600 px-4">
            Inspirasi untuk jamaah lainnya
          </p>
        </div>

        {/* Form Card */}
        <Card className="border-2 border-[#D4AF37]/20 shadow-xl">
          <CardContent className="p-4 sm:p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Rating Section */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Rating Pengalaman <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-10 h-10 ${
                          star <= (hoveredRating || rating)
                            ? 'fill-[#D4AF37] text-[#D4AF37]'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-sm text-gray-600 mt-2">
                    Anda memberikan rating: <span className="font-bold text-[#D4AF37]">{rating} Bintang</span>
                  </p>
                )}
              </div>

              {/* Package Name (Optional) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nama Paket (Opsional)
                </label>
                <input
                  type="text"
                  value={packageName}
                  onChange={(e) => setPackageName(e.target.value)}
                  placeholder="Contoh: Paket Umrah 9 Hari Reguler"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                />
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Testimoni Anda <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Ceritakan pengalaman umrah Anda... (minimal 20 karakter)"
                  rows={8}
                  className="resize-none focus:ring-2 focus:ring-[#D4AF37]"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {comment.length} karakter {comment.length < 20 && `(minimal 20 karakter)`}
                </p>
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Foto Pengalaman (Opsional)
                </label>
                
                {!photoPreview ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#D4AF37] transition-colors cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label htmlFor="photo-upload" className="cursor-pointer">
                      <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                      <p className="text-sm text-gray-600 mb-1">
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
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Info Notice */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  ✅ <strong>Info:</strong> Testimoni Anda akan langsung dipublikasikan dan bisa dilihat oleh semua orang setelah submit.
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={onBack}
                  variant="outline"
                  className="flex-1 border-2 border-gray-300"
                  disabled={loading}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] hover:opacity-90"
                  disabled={loading || rating === 0 || !comment.trim() || comment.length < 20}
                >
                  {loading ? 'Mengirim...' : 'Kirim Testimoni'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestimonialFormPage;