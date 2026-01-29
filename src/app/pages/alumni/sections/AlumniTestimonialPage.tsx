import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Star, Plus, Edit2, Trash2, Quote } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { useAuth } from '../../../../contexts/AuthContext';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '../../../../config/firebase';
import { toast } from 'sonner';

interface AlumniTestimonialPageProps {
  onBack: () => void;
}

interface Testimonial {
  id: string;
  userId: string;
  userName: string;
  userCity?: string;
  packageName?: string;
  rating: number;
  comment: string;
  createdAt: any;
}

const AlumniTestimonialPage: React.FC<AlumniTestimonialPageProps> = ({ onBack }) => {
  const { currentUser, userProfile } = useAuth();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    packageName: '',
    rating: 5,
    comment: '',
  });

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      const testimonialsRef = collection(db, 'testimonials');
      // ✅ FIX: Only fetch approved testimonials (visible to all roles)
      const q = query(
        testimonialsRef, 
        where('status', '==', 'approved'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const data: Testimonial[] = [];
      
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as Testimonial);
      });
      
      setTestimonials(data);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      toast.error('Gagal memuat testimoni');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !userProfile) return;

    try {
      setLoading(true);

      if (editingId) {
        // Update existing testimonial
        const testimonialRef = doc(db, 'testimonials', editingId);
        await updateDoc(testimonialRef, {
          packageName: formData.packageName,
          rating: formData.rating,
          comment: formData.comment,
          updatedAt: new Date(),
        });
        toast.success('Testimoni berhasil diperbarui!');
      } else {
        // Create new testimonial
        await addDoc(collection(db, 'testimonials'), {
          userId: currentUser.uid,
          userName: userProfile.fullName,
          userCity: userProfile.city,
          packageName: formData.packageName,
          rating: formData.rating,
          comment: formData.comment,
          createdAt: new Date(),
          status: 'approved', // ✅ FIX: Auto-approve alumni testimonials
          verified: true,
          userRole: 'alumni',
        });
        toast.success('Testimoni berhasil ditambahkan!');
      }

      // Reset form
      setFormData({ packageName: '', rating: 5, comment: '' });
      setShowForm(false);
      setEditingId(null);
      fetchTestimonials();
    } catch (error: any) {
      console.error('Error saving testimonial:', error);
      toast.error('Gagal menyimpan testimoni');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (testimonial: Testimonial) => {
    setFormData({
      packageName: testimonial.packageName || '',
      rating: testimonial.rating,
      comment: testimonial.comment,
    });
    setEditingId(testimonial.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus testimoni ini?')) return;

    try {
      await deleteDoc(doc(db, 'testimonials', id));
      toast.success('Testimoni berhasil dihapus');
      fetchTestimonials();
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      toast.error('Gagal menghapus testimoni');
    }
  };

  const myTestimonials = testimonials.filter(t => t.userId === currentUser?.uid);
  const otherTestimonials = testimonials.filter(t => t.userId !== currentUser?.uid);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 pb-24 md:pb-8">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-xl border-b border-[#D4AF37]/20 shadow-lg sticky top-0 z-30">
        <div className="h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-700 hover:text-[#D4AF37] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Kembali</span>
            </button>

            <h1 className="text-lg md:text-xl font-semibold bg-gradient-to-r from-[#D4AF37] to-[#C5A572] bg-clip-text text-transparent">
              Testimonial
            </h1>

            <Button
              onClick={() => {
                setShowForm(!showForm);
                setEditingId(null);
                setFormData({ packageName: '', rating: 5, comment: '' });
              }}
              className="bg-gradient-to-r from-[#D4AF37] to-[#C5A572] text-white hover:opacity-90"
            >
              <Plus className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Tambah</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              {editingId ? 'Edit Testimoni' : 'Tambah Testimoni Baru'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="packageName">Nama Paket Umroh</Label>
                <Input
                  id="packageName"
                  value={formData.packageName}
                  onChange={(e) => setFormData(prev => ({ ...prev, packageName: e.target.value }))}
                  placeholder="Contoh: Umroh Reguler 12 Hari"
                  required
                />
              </div>

              <div>
                <Label htmlFor="rating">Rating</Label>
                <div className="flex items-center gap-2 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= formData.rating
                            ? 'fill-[#D4AF37] text-[#D4AF37]'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="comment">Testimoni Anda</Label>
                <Textarea
                  id="comment"
                  value={formData.comment}
                  onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder="Ceritakan pengalaman spiritual Anda..."
                  rows={4}
                  required
                  className="resize-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-[#D4AF37] to-[#C5A572] text-white hover:opacity-90"
                >
                  {loading ? 'Menyimpan...' : editingId ? 'Update' : 'Simpan'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({ packageName: '', rating: 5, comment: '' });
                  }}
                >
                  Batal
                </Button>
              </div>
            </form>
          </motion.div>
        )}

        {/* My Testimonials */}
        {myTestimonials.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Testimoni Saya</h2>
            <div className="grid grid-cols-1 gap-4">
              {myTestimonials.map((testimonial) => (
                <TestimonialCard
                  key={testimonial.id}
                  testimonial={testimonial}
                  isOwner={true}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </div>
        )}

        {/* All Testimonials */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Testimoni Alumni Lainnya ({otherTestimonials.length})
          </h2>
          
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : otherTestimonials.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl shadow-lg">
              <Quote className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Belum ada testimoni dari alumni lain</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {otherTestimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <TestimonialCard testimonial={testimonial} isOwner={false} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Testimonial Card Component
interface TestimonialCardProps {
  testimonial: Testimonial;
  isOwner: boolean;
  onEdit?: (testimonial: Testimonial) => void;
  onDelete?: (id: string) => void;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({ testimonial, isOwner, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 relative">
      {/* Quote Icon */}
      <div className="absolute top-4 right-4 text-[#D4AF37] opacity-20">
        <Quote className="w-12 h-12" />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#C5A572] flex items-center justify-center text-white font-bold shadow-lg">
            {testimonial.userName?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div>
            <div className="font-semibold text-gray-800">{testimonial.userName}</div>
            {testimonial.userCity && (
              <div className="text-sm text-gray-500">{testimonial.userCity}</div>
            )}
          </div>
        </div>

        {isOwner && onEdit && onDelete && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(testimonial)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(testimonial.id)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Rating */}
      <div className="flex items-center gap-1 mb-3">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-5 h-5 ${
              i < testimonial.rating
                ? 'fill-[#D4AF37] text-[#D4AF37]'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>

      {/* Package */}
      {testimonial.packageName && (
        <div className="text-sm text-[#D4AF37] font-medium mb-3">
          {testimonial.packageName}
        </div>
      )}

      {/* Comment */}
      <p className="text-gray-700 relative z-10 leading-relaxed">
        "{testimonial.comment}"
      </p>

      {/* Date */}
      <div className="text-xs text-gray-400 mt-4">
        {testimonial.createdAt
          ? new Date(testimonial.createdAt.seconds * 1000).toLocaleDateString('id-ID', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          : '-'}
      </div>
    </div>
  );
};

export default AlumniTestimonialPage;
