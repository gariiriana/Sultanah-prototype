import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  Upload,
  Trash2,
  X,
  Image as ImageIcon,
  Download,
  Eye
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { toast } from 'sonner';
import { collection, addDoc, query, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../../config/firebase';
import { useAuth } from '../../../../contexts/AuthContext';

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
  const [previewImage, setPreviewImage] = useState<string>('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    date: '',
    category: 'activity' as TripPhoto['category'],
  });

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'tripGallery'),
        orderBy('uploadedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const photosData: TripPhoto[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as TripPhoto));
      
      setPhotos(photosData);
    } catch (error) {
      console.error('Error fetching photos:', error);
      toast.error('Failed to load gallery');
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!previewImage) {
      toast.error('Please select an image');
      return;
    }

    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    setUploading(true);

    try {
      const newPhoto: Omit<TripPhoto, 'id'> = {
        ...formData,
        imageBase64: previewImage,
        uploadedBy: userProfile?.uid || '',
        uploadedByName: userProfile?.displayName || 'Tour Leader',
        uploadedAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'tripGallery'), newPhoto);

      toast.success('Photo uploaded successfully!');

      // Reset form
      setFormData({
        title: '',
        description: '',
        location: '',
        date: '',
        category: 'activity',
      });
      setPreviewImage('');

      // Clear file input
      const fileInput = document.getElementById('photo-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      fetchPhotos();
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;

    try {
      await deleteDoc(doc(db, 'tripGallery', id));
      toast.success('Photo deleted');
      fetchPhotos();
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast.error('Failed to delete photo');
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
        <div className="bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Upload className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Upload Trip Photo</h2>
              <p className="text-white/90 text-sm">Share memories with your jamaah</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleUpload} className="p-6 space-y-5">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Photo
            </label>
            <div className="relative">
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <label
                htmlFor="photo-upload"
                className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl hover:border-[#D4AF37] transition-colors cursor-pointer bg-gray-50 hover:bg-gray-100"
              >
                {previewImage ? (
                  <div className="relative w-full h-full">
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="w-full h-full object-cover rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setPreviewImage('');
                      }}
                      className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Camera className="w-12 h-12 text-gray-400 mb-3" />
                    <p className="text-sm font-medium text-gray-600">Click to upload photo</p>
                    <p className="text-xs text-gray-500 mt-1">Max size: 5MB</p>
                  </>
                )}
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <Input
                type="text"
                placeholder="e.g., Visit to Masjid Nabawi"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="h-12"
                required
              />
            </div>

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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
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

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              placeholder="Add a description..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full h-24 px-3 py-2 border border-gray-300 rounded-xl focus:border-[#D4AF37] focus:ring-[#D4AF37]/30 focus:outline-none resize-none"
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={uploading || !previewImage}
            className="w-full h-12 bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] hover:opacity-90 text-white shadow-lg font-semibold"
          >
            {uploading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Uploading...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Photo
              </span>
            )}
          </Button>
        </form>
      </div>

      {/* Gallery Grid */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Trip Gallery</h2>
                <p className="text-white/90 text-sm">{photos.length} photos</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {photos.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">No photos uploaded yet</p>
              <p className="text-sm text-gray-500 mt-1">Upload your first trip photo above</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {photos.map((photo, index) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative bg-gray-100 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer"
                  onClick={() => setSelectedPhoto(photo)}
                >
                  {/* Image */}
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={photo.imageBase64}
                      alt={photo.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(photo.category)}`}>
                          {getCategoryIcon(photo.category)} {photo.category}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(photo.id);
                          }}
                          className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <h3 className="font-semibold text-white text-sm mb-1">{photo.title}</h3>
                      <p className="text-white/80 text-xs">{photo.location}</p>
                    </div>
                  </div>

                  {/* View Icon */}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <Eye className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

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
    </div>
  );
};

export default TripGallerySection;
