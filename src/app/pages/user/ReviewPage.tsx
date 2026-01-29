import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Card, CardContent } from '../../components/ui/card';
import { ArrowLeft, Star, Upload, X, Loader, Send } from 'lucide-react';
import { doc, getDoc, addDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'sonner';
import { Package } from '../../../types';
import { compressImage, validateImageFile } from '../../../utils/imageCompression';

const ReviewPage = () => {
  const { packageId } = useParams();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [packageData, setPackageData] = useState<Package | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [photo, setPhoto] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    fetchPackageData();
    fetchUserProfile();
    checkExistingReview();
  }, [packageId]);

  const fetchPackageData = async () => {
    try {
      if (!packageId) return;
      
      const docRef = doc(db, 'packages', packageId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setPackageData({ id: docSnap.id, ...docSnap.data() } as Package);
      } else {
        toast.error('Package not found');
        navigate('/my-bookings');
      }
    } catch (error) {
      toast.error('Failed to fetch package');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      if (!currentUser?.email) return;

      const q = query(collection(db, 'users'), where('email', '==', currentUser.email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setUserProfile({ id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const checkExistingReview = async () => {
    try {
      if (!currentUser?.uid || !packageId) return;

      const q = query(
        collection(db, 'reviews'),
        where('userId', '==', currentUser.uid),
        where('packageId', '==', packageId)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        toast.info('You have already reviewed this package');
        navigate('/my-bookings');
      }
    } catch (error) {
      console.error('Error checking review:', error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      validateImageFile(file);
      const compressed = await compressImage(file, 800, 0.8);
      setPhoto(compressed);
      toast.success('Photo uploaded');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSubmit = async () => {
    if (!currentUser || !packageData || !userProfile) {
      toast.error('Please login to submit review');
      return;
    }

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (comment.trim().length < 10) {
      toast.error('Please write at least 10 characters');
      return;
    }

    setSubmitting(true);

    try {
      await addDoc(collection(db, 'reviews'), {
        userId: currentUser.uid,
        userName: userProfile.displayName || currentUser.email?.split('@')[0] || 'User',
        userEmail: currentUser.email,
        userPhoto: userProfile.profilePhoto || '',
        packageId: packageData.id,
        packageName: packageData.name,
        rating,
        comment: comment.trim(),
        photo: photo || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      toast.success('Review submitted successfully!');
      navigate('/my-bookings');
    } catch (error: any) {
      console.error('Submit review error:', error);
      toast.error('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-[#FFF9F0]/30 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  if (!packageData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-[#FFF9F0]/30 flex items-center justify-center">
        <p>Package not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-[#FFF9F0]/30 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Button
          variant="outline"
          onClick={() => navigate('/my-bookings')}
          className="mb-6 border-2 border-[#D4AF37]/30 hover:border-[#D4AF37] hover:bg-[#FFF9F0]/50 transition-all"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to My Bookings
        </Button>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3">
            Write a <span className="bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#D4AF37] bg-clip-text text-transparent">Review</span>
          </h1>
          <p className="text-gray-600">Share your experience with other travelers</p>
        </div>

        <Card className="bg-white/90 backdrop-blur-xl border-2 border-[#D4AF37]/30 shadow-2xl rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-[#D4AF37] to-[#FFD700] p-6">
            <h3 className="text-xl font-bold text-white">{packageData.name}</h3>
          </div>

          <CardContent className="p-8 space-y-8">
            {/* Rating */}
            <div>
              <Label className="text-lg font-semibold text-gray-700 mb-4 block">
                How was your experience?
              </Label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-12 h-12 ${
                        star <= (hoverRating || rating)
                          ? 'fill-[#FFD700] text-[#FFD700]'
                          : 'text-gray-300'
                      } transition-colors`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="mt-3 text-sm text-gray-600">
                  You rated: <span className="font-bold text-[#D4AF37]">{rating} star{rating > 1 ? 's' : ''}</span>
                </p>
              )}
            </div>

            {/* Comment */}
            <div>
              <Label htmlFor="comment" className="text-lg font-semibold text-gray-700 mb-4 block">
                Tell us about your journey
              </Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience, highlights, and memories from this trip..."
                className="min-h-[200px] border-2 border-[#D4AF37]/30 focus:border-[#D4AF37] rounded-xl resize-none"
                maxLength={1000}
              />
              <p className="text-sm text-gray-500 mt-2 text-right">
                {comment.length}/1000 characters
              </p>
            </div>

            {/* Photo Upload (Optional) */}
            <div>
              <Label className="text-lg font-semibold text-gray-700 mb-4 block">
                Add a photo (optional)
              </Label>
              
              {!photo ? (
                <div className="border-2 border-dashed border-[#D4AF37]/30 rounded-xl p-8 text-center hover:border-[#D4AF37] transition-colors">
                  <input
                    type="file"
                    id="photo-upload"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="photo-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#D4AF37]/20 to-[#FFD700]/20 flex items-center justify-center mb-4">
                      <Upload className="w-8 h-8 text-[#D4AF37]" />
                    </div>
                    <p className="font-semibold text-gray-700 mb-1">Click to upload photo</p>
                    <p className="text-sm text-gray-500">PNG, JPG up to 5MB</p>
                  </label>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden border-2 border-[#D4AF37]/30">
                  <img
                    src={photo}
                    alt="Review"
                    className="w-full h-64 object-cover"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => setPhoto('')}
                    className="absolute top-4 right-4 rounded-full w-10 h-10 p-0"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={submitting || rating === 0 || comment.trim().length < 10}
              className="w-full py-6 text-lg bg-gradient-to-r from-[#D4AF37] to-[#FFD700] hover:from-[#C5A572] hover:to-[#D4AF37] text-white shadow-xl hover:shadow-2xl transition-all duration-300 font-bold rounded-xl"
            >
              {submitting ? (
                <>
                  <Loader className="w-5 h-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Submit Review
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReviewPage;
