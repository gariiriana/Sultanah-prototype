import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Star, Send, Loader2, UserCheck } from 'lucide-react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { db } from '../../config/firebase';
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { toast } from 'sonner';

interface TourLeader {
  id: string;
  userId: string;
  name: string;
  email: string;
  specialization?: string;
  totalTrips?: number;
}

interface TourLeaderRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  currentUserName: string;
}

const TourLeaderRatingModal: React.FC<TourLeaderRatingModalProps> = ({
  isOpen,
  onClose,
  currentUserId,
  currentUserName,
}) => {
  // Form states
  const [selectedTourLeader, setSelectedTourLeader] = useState<string>('');
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  
  // Data states
  const [tourLeaders, setTourLeaders] = useState<TourLeader[]>([]);
  const [loadingTourLeaders, setLoadingTourLeaders] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch approved Tour Leaders
  useEffect(() => {
    if (isOpen) {
      fetchTourLeaders();
    }
  }, [isOpen]);

  const fetchTourLeaders = async () => {
    try {
      setLoadingTourLeaders(true);

      // Fetch all users with role 'tour-leader'
      const usersQuery = query(
        collection(db, 'users'),
        where('role', '==', 'tour-leader')
      );
      
      const usersSnap = await getDocs(usersQuery);
      const tlList: TourLeader[] = [];

      for (const docSnap of usersSnap.docs) {
        const userData = docSnap.data();
        
        // Try to get profile data
        const profileQuery = query(
          collection(db, 'tourLeaderProfiles'),
          where('userId', '==', docSnap.id)
        );
        const profileSnap = await getDocs(profileQuery);
        
        let profileData = null;
        if (!profileSnap.empty) {
          profileData = profileSnap.docs[0].data();
        }

        tlList.push({
          id: docSnap.id,
          userId: docSnap.id,
          name: userData.fullName || userData.name || userData.email || 'Unknown',
          email: userData.email || '',
          specialization: profileData?.specialization || 'Umroh & Haji',
          totalTrips: profileData?.totalTrips || 0,
        });
      }

      // Sort by totalTrips (most experienced first)
      tlList.sort((a, b) => (b.totalTrips || 0) - (a.totalTrips || 0));

      setTourLeaders(tlList);
      console.log('✅ Loaded Tour Leaders:', tlList.length);
    } catch (error) {
      console.error('❌ Error fetching tour leaders:', error);
      toast.error('Gagal memuat daftar Tour Leader');
    } finally {
      setLoadingTourLeaders(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!selectedTourLeader) {
      toast.error('Pilih Tour Leader terlebih dahulu');
      return;
    }

    if (rating === 0) {
      toast.error('Berikan rating bintang 1-5');
      return;
    }

    if (!comment.trim()) {
      toast.error('Tulis komentar/ulasan Anda');
      return;
    }

    try {
      setSubmitting(true);

      // Find selected TL data
      const selectedTL = tourLeaders.find(tl => tl.userId === selectedTourLeader);
      
      if (!selectedTL) {
        toast.error('Tour Leader tidak ditemukan');
        return;
      }

      // Create feedback document
      const feedbackData = {
        userId: currentUserId,
        userName: currentUserName,
        tourLeaderId: selectedTL.userId,
        tourLeaderName: selectedTL.name,
        tourLeaderEmail: selectedTL.email,
        rating: rating,
        comment: comment.trim(),
        status: 'submitted',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await addDoc(collection(db, 'tourLeaderFeedbacks'), feedbackData);

      console.log('✅ Feedback submitted:', feedbackData);
      toast.success('Rating Tour Leader berhasil dikirim! 🎉');

      // Reset form
      setSelectedTourLeader('');
      setRating(0);
      setComment('');
      
      // Close modal
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error: any) {
      console.error('❌ Error submitting feedback:', error);
      
      if (error?.code === 'permission-denied') {
        toast.error('Anda tidak memiliki izin untuk mengirim rating. Hubungi admin.');
      } else {
        toast.error('Gagal mengirim rating. Coba lagi.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setSelectedTourLeader('');
      setRating(0);
      setComment('');
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-amber-500 to-amber-600 text-white p-6 rounded-t-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Star className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Rating Tour Leader</h2>
                    <p className="text-sm text-amber-50">Bagikan pengalaman Anda</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  disabled={submitting}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Tour Leader Selection */}
                <div>
                  <Label htmlFor="tourLeader" className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-3">
                    <UserCheck className="w-5 h-5 text-amber-600" />
                    Pilih Tour Leader
                  </Label>
                  
                  {loadingTourLeaders ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
                      <span className="ml-2 text-gray-600">Memuat Tour Leaders...</span>
                    </div>
                  ) : tourLeaders.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>Belum ada Tour Leader yang terdaftar</p>
                    </div>
                  ) : (
                    <select
                      id="tourLeader"
                      value={selectedTourLeader}
                      onChange={(e) => setSelectedTourLeader(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all text-gray-900 font-medium"
                      required
                    >
                      <option value="">-- Pilih Tour Leader --</option>
                      {tourLeaders.map((tl) => (
                        <option key={tl.userId} value={tl.userId}>
                          {tl.name} {tl.totalTrips ? `(${tl.totalTrips} trip${tl.totalTrips > 1 ? 's' : ''})` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                  <p className="mt-2 text-sm text-gray-500">
                    Pilih Tour Leader yang pernah memimpin perjalanan Anda
                  </p>
                </div>

                {/* Rating Stars */}
                <div>
                  <Label className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-3">
                    <Star className="w-5 h-5 text-amber-600 fill-amber-600" />
                    Rating Bintang
                  </Label>
                  
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        className="transition-transform hover:scale-110 focus:outline-none"
                      >
                        <Star
                          className={`w-12 h-12 transition-colors ${
                            star <= (hoveredRating || rating)
                              ? 'text-amber-500 fill-amber-500'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  
                  {rating > 0 && (
                    <p className="mt-2 text-sm font-medium text-amber-600">
                      {rating === 5 && '⭐ Luar biasa!'}
                      {rating === 4 && '⭐ Sangat baik!'}
                      {rating === 3 && '⭐ Baik'}
                      {rating === 2 && '⭐ Cukup'}
                      {rating === 1 && '⭐ Kurang memuaskan'}
                    </p>
                  )}
                </div>

                {/* Comment */}
                <div>
                  <Label htmlFor="comment" className="text-base font-semibold text-gray-900 mb-3 block">
                    Komentar / Ulasan
                  </Label>
                  <Textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Bagikan pengalaman Anda selama perjalanan bersama Tour Leader ini... (minimal 20 karakter)"
                    className="min-h-[150px] border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all resize-none"
                    required
                    minLength={20}
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    {comment.length}/500 karakter
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    onClick={handleClose}
                    disabled={submitting}
                    variant="outline"
                    className="flex-1 border-2 border-gray-300 hover:bg-gray-50"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting || !selectedTourLeader || rating === 0 || !comment.trim()}
                    className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Mengirim...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Kirim Rating
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default TourLeaderRatingModal;
