import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  Upload, 
  User, 
  Phone,
  AtSign,
  FileText,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Newspaper
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { toast } from 'sonner';

interface ArticleSubmissionFormProps {
  onBack: () => void;
}

const ArticleSubmissionForm: React.FC<ArticleSubmissionFormProps> = ({ onBack }) => {
  const { userProfile, currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string>('');
  const [uploadedImageName, setUploadedImageName] = useState<string>('');

  const [formData, setFormData] = useState({
    authorName: userProfile?.displayName || '',
    phoneNumber: '',
    socialMedia: '',
    title: '',
    content: '',
    category: 'article', // Default category
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload JPG or PNG.');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size too large. Maximum 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedImage(reader.result as string);
      setUploadedImageName(file.name);
      toast.success('Image uploaded successfully!');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.authorName || !formData.phoneNumber) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (!formData.title || !formData.content) {
      toast.error('Please fill in title and content');
      return;
    }
    if (!uploadedImage) {
      toast.error('Please upload an article image');
      return;
    }

    setLoading(true);

    try {
      // ✅ Get user ID with proper fallback chain
      const userId = userProfile?.uid || userProfile?.id || currentUser?.uid || '';
      
      if (!userId) {
        toast.error('User authentication error. Please refresh and try again.');
        return;
      }

      const articleData = {
        // ✅ FIXED: Match Firestore rules structure (author object)
        author: {
          id: userId, // ✅ Use proper userId that matches Firebase Auth UID
          name: formData.authorName,
          email: userProfile?.email || currentUser?.email || '',
          phone: formData.phoneNumber,
          socialMedia: formData.socialMedia,
          role: userProfile?.role || 'current-jamaah',
        },
        
        title: formData.title,
        content: formData.content,
        category: formData.category,
        image: uploadedImage,
        imageName: uploadedImageName,
        
        // Approval status
        status: 'pending', // pending, approved, rejected
        reviewedBy: '',
        reviewedAt: null,
        rejectionReason: '',
        
        // Timestamps
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        publishedAt: null,
        
        // Engagement metrics
        views: 0,
        likes: 0,
      };

      await addDoc(collection(db, 'articles'), articleData);

      toast.success('Article submitted successfully! Waiting for admin approval...');

      // Reset form
      setFormData({
        authorName: userProfile?.displayName || '',
        phoneNumber: '',
        socialMedia: '',
        title: '',
        content: '',
        category: 'article',
      });
      setUploadedImage('');
      setUploadedImageName('');

      // Go back after 2 seconds
      setTimeout(() => {
        onBack();
      }, 2000);
    } catch (error) {
      console.error('Error submitting article:', error);
      toast.error('Failed to submit article. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white hover:bg-gray-50 border border-gray-200 flex items-center justify-center shadow-sm hover:shadow transition-all mb-4"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>

          <div className="bg-gradient-to-r from-[#C5A572] to-[#D4AF37] rounded-2xl p-8 text-white">
            <div className="flex items-center gap-3 mb-2">
              <Newspaper className="w-8 h-8" />
              <h1 className="text-3xl font-bold">Submit Article</h1>
            </div>
            <p className="text-white/90">
              Bagikan pengalaman spiritual Anda dengan jamaah lainnya
            </p>
          </div>
        </motion.div>

        {/* Form */}
        <motion.form 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
        >
          {/* Author Information Section */}
          <div className="p-8 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Informasi Penulis</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Author Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Penulis <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.authorName}
                    onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                    placeholder="Nama lengkap Anda"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nomor HP <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    placeholder="08xxxxxxxxxx"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Social Media */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Media Sosial (Instagram/Facebook/Twitter)
                </label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.socialMedia}
                    onChange={(e) => setFormData({ ...formData, socialMedia: e.target.value })}
                    placeholder="@username atau link profil"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Article Content Section */}
          <div className="p-8 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Konten Artikel</h2>

            <div className="space-y-6">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategori <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="article"
                      checked={formData.category === 'article'}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-4 h-4 text-[#D4AF37] focus:ring-[#D4AF37]"
                    />
                    <span className="text-sm font-medium text-gray-700">📝 Artikel</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="news"
                      checked={formData.category === 'news'}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-4 h-4 text-[#D4AF37] focus:ring-[#D4AF37]"
                    />
                    <span className="text-sm font-medium text-gray-700">📰 Berita</span>
                  </label>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Judul <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Judul berita atau artikel Anda"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Konten <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Tuliskan konten berita atau artikel Anda di sini..."
                  rows={10}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent resize-none"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Minimal 100 karakter
                </p>
              </div>
            </div>
          </div>

          {/* Image Upload Section */}
          <div className="p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Gambar Artikel</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Gambar <span className="text-red-500">*</span>
              </label>

              {!uploadedImage ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-[#D4AF37] transition-colors">
                  <input
                    type="file"
                    id="image-upload"
                    className="hidden"
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={handleImageUpload}
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-1">
                      Drag & Drop gambar atau{' '}
                      <span className="text-[#D4AF37] font-semibold">Browse</span>
                    </p>
                    <p className="text-sm text-gray-500">
                      Supports: JPG, PNG (max 2MB)
                    </p>
                  </label>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="p-4 bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{uploadedImageName}</p>
                        <p className="text-sm text-gray-500">Image uploaded successfully</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setUploadedImage('');
                        setUploadedImageName('');
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Remove
                    </Button>
                  </div>
                  
                  {/* Preview */}
                  <img
                    src={uploadedImage}
                    alt="Article preview"
                    className="w-full h-auto"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="p-8 bg-gray-50 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <AlertCircle className="w-4 h-4" />
                <span>Artikel akan direview oleh admin sebelum dipublikasikan</span>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-[#C5A572] to-[#D4AF37] text-white px-8 py-3 rounded-lg shadow-md hover:shadow-lg disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Article'}
              </Button>
            </div>
          </div>
        </motion.form>
      </div>
    </div>
  );
};

export default ArticleSubmissionForm;