import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { ArrowLeft, Star, Loader } from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { Package, Review } from '../../../types';
import ReviewCard from '../../components/ReviewCard';

const PackageReviewsPage = () => {
  const { packageId } = useParams();
  const navigate = useNavigate();
  const [packageData, setPackageData] = useState<Package | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    fetchPackageAndReviews();
  }, [packageId]);

  const fetchPackageAndReviews = async () => {
    try {
      if (!packageId) return;

      // Fetch package
      const packageRef = doc(db, 'packages', packageId);
      const packageSnap = await getDoc(packageRef);

      if (packageSnap.exists()) {
        setPackageData({ id: packageSnap.id, ...packageSnap.data() } as Package);
      }

      // Fetch reviews
      const q = query(collection(db, 'reviews'), where('packageId', '==', packageId));
      const querySnapshot = await getDocs(q);
      
      const reviewsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Review[];

      // Sort by date descending
      reviewsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setReviews(reviewsData);

      // Calculate average rating
      if (reviewsData.length > 0) {
        const total = reviewsData.reduce((sum, review) => sum + review.rating, 0);
        setAverageRating(total / reviewsData.length);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-[#FFF9F0]/30 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-[#FFF9F0]/30 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="mb-6 border-2 border-[#D4AF37]/30 hover:border-[#D4AF37] hover:bg-[#FFF9F0]/50 transition-all"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3">
            Customer <span className="bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#D4AF37] bg-clip-text text-transparent">Reviews</span>
          </h1>
          {packageData && (
            <p className="text-xl text-gray-600 mb-4">{packageData.name}</p>
          )}
        </div>

        {/* Rating Summary */}
        {reviews.length > 0 && (
          <div className="bg-gradient-to-br from-white via-[#FFF9F0] to-white backdrop-blur-xl border-2 border-[#D4AF37]/30 shadow-2xl rounded-2xl p-8 mb-8 text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="text-6xl font-bold bg-gradient-to-r from-[#D4AF37] to-[#FFD700] bg-clip-text text-transparent">
                {averageRating.toFixed(1)}
              </div>
              <div>
                <div className="flex items-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-6 h-6 ${
                        star <= Math.round(averageRating)
                          ? 'fill-[#FFD700] text-[#FFD700]'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-gray-600">Based on {reviews.length} review{reviews.length > 1 ? 's' : ''}</p>
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="max-w-md mx-auto space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = reviews.filter(r => r.rating === rating).length;
                const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;

                return (
                  <div key={rating} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-8">{rating}★</span>
                    <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#D4AF37] to-[#FFD700] transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 mb-4">
              <Star className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Reviews Yet</h3>
            <p className="text-gray-500">Be the first to share your experience!</p>
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">All Reviews</h2>
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                userName={review.userName}
                userPhoto={review.userPhoto}
                rating={review.rating}
                comment={review.comment}
                photo={review.photo}
                createdAt={review.createdAt}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PackageReviewsPage;
