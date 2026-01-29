import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  MessageSquare,
  Star,
  ThumbsUp,
  User,
  Calendar,
  TrendingUp,
  Award,
  Heart
} from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../../config/firebase';
import { useAuth } from '../../../../contexts/AuthContext';

interface Feedback {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  tourLeaderId: string;
  rating: number;
  comment: string;
  createdAt: string;
  packageName?: string;
}

const FeedbackSection: React.FC = () => {
  const { userProfile, currentUser } = useAuth();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalFeedbacks: 0,
    averageRating: 0,
    fiveStars: 0,
    fourStars: 0,
    threeStars: 0,
    twoStars: 0,
    oneStar: 0,
  });

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);

      // ✅ FIX: Use currentUser.uid which matches the docSnap.id from users collection
      const tourLeaderId = currentUser?.uid;

      if (!tourLeaderId) {
        console.log('❌ No valid tourLeaderId (currentUser.uid)');
        console.log('currentUser:', currentUser);
        console.log('userProfile:', userProfile);
        setLoading(false);
        return;
      }

      console.log('🔍 Fetching feedbacks for Tour Leader UID:', tourLeaderId);

      // ✅ FIX: Remove orderBy to avoid index requirement - we'll sort in frontend
      const feedbacksQuery = query(
        collection(db, 'tourLeaderFeedbacks'),
        where('tourLeaderId', '==', tourLeaderId)
        // ❌ REMOVED: orderBy('createdAt', 'desc') - causes index requirement
        // ✅ We'll sort manually in JavaScript instead
      );

      const feedbacksSnapshot = await getDocs(feedbacksQuery);

      const feedbackData: Feedback[] = [];
      let totalRating = 0;
      const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

      feedbacksSnapshot.forEach(doc => {
        const data = doc.data();

        console.log('📋 Feedback doc:', {
          id: doc.id,
          tourLeaderId: data.tourLeaderId,
          userName: data.userName,
          rating: data.rating,
          createdAt: data.createdAt
        });

        feedbackData.push({
          id: doc.id,
          userId: data.userId,
          userName: data.userName || 'Anonymous',
          userPhoto: data.userPhoto,
          tourLeaderId: data.tourLeaderId,
          rating: data.rating || 0,
          comment: data.feedback || data.comment || '', // ✅ FIX: Support both 'feedback' and 'comment' fields
          createdAt: data.createdAt?.toDate?.() || data.createdAt || new Date(), // ✅ FIX: Convert Timestamp to Date
          packageName: data.packageName,
        });

        totalRating += data.rating || 0;
        const rating = Math.round(data.rating || 0);
        if (rating >= 1 && rating <= 5) {
          ratingCounts[rating as keyof typeof ratingCounts]++;
        }
      });

      // ✅ SORT IN FRONTEND: Sort by createdAt descending (newest first)
      feedbackData.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA; // Descending (newest first)
      });

      setFeedbacks(feedbackData);
      setStats({
        totalFeedbacks: feedbackData.length,
        averageRating: feedbackData.length > 0 ? totalRating / feedbackData.length : 0,
        fiveStars: ratingCounts[5],
        fourStars: ratingCounts[4],
        threeStars: ratingCounts[3],
        twoStars: ratingCounts[2],
        oneStar: ratingCounts[1],
      });

      console.log('✅ Fetched feedbacks:', feedbackData.length);
    } catch (error: any) {
      console.error('❌ Error fetching feedbacks:', error);

      // Better error logging
      if (error?.code === 'permission-denied') {
        console.error('🚫 Permission denied - Check Firestore rules for tourLeaderFeedbacks collection');
      } else if (error?.code === 'failed-precondition') {
        console.error('⚠️ Missing Firestore index - Need composite index for tourLeaderId + createdAt');
        console.error('Create index at: https://console.firebase.google.com/project/_/firestore/indexes');
      }

      setFeedbacks([]);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5',
    };

    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`${sizeClasses[size]} ${i < Math.round(rating)
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-gray-300'
              }`}
          />
        ))}
      </div>
    );
  };

  const getRatingPercentage = (count: number) => {
    return stats.totalFeedbacks > 0 ? (count / stats.totalFeedbacks) * 100 : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 text-sm">Memuat ulasan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
        <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-md">
          <MessageSquare className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Ulasan Jamaah</h2>
          <p className="text-gray-500 text-sm">Ulasan dan penilaian dari jamaah</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Overall Rating Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <Star className="w-8 h-8" />
            <Award className="w-6 h-6 opacity-70" />
          </div>
          <div className="text-4xl font-bold mb-2">
            {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '0.0'}
          </div>
          <div className="flex items-center gap-2 mb-1">
            {renderStars(stats.averageRating, 'sm')}
          </div>
          <p className="text-yellow-100 text-sm">Rata-rata Penilaian</p>
        </motion.div>

        {/* Total Feedbacks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <MessageSquare className="w-8 h-8" />
            <TrendingUp className="w-6 h-6 opacity-70" />
          </div>
          <div className="text-4xl font-bold mb-2">{stats.totalFeedbacks}</div>
          <p className="text-blue-100 text-sm">Total Ulasan</p>
        </motion.div>

        {/* Satisfaction Rate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <Heart className="w-8 h-8" />
            <ThumbsUp className="w-6 h-6 opacity-70" />
          </div>
          <div className="text-4xl font-bold mb-2">
            {stats.totalFeedbacks > 0
              ? Math.round(((stats.fiveStars + stats.fourStars) / stats.totalFeedbacks) * 100)
              : 0}%
          </div>
          <p className="text-green-100 text-sm">Tingkat Kepuasan</p>
        </motion.div>
      </div>

      {/* Rating Distribution */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#D4AF37]" />
          Distribusi Penilaian
        </h3>
        <div className="space-y-3">
          {[
            { stars: 5, count: stats.fiveStars },
            { stars: 4, count: stats.fourStars },
            { stars: 3, count: stats.threeStars },
            { stars: 2, count: stats.twoStars },
            { stars: 1, count: stats.oneStar },
          ].map(({ stars, count }) => (
            <div key={stars} className="flex items-center gap-3">
              <div className="flex items-center gap-1 w-16">
                <span className="text-sm font-medium text-gray-700">{stars}</span>
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              </div>
              <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full transition-all duration-500"
                  style={{ width: `${getRatingPercentage(count)}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-600 w-12 text-right">
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Feedback List */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[#D4AF37]" />
          Ulasan Terbaru
        </h3>

        {feedbacks.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-900 font-semibold text-lg mb-1">Belum ada ulasan</p>
            <p className="text-sm text-gray-500">
              Ulasan dari jamaah akan muncul di sini
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {feedbacks.map((feedback, index) => (
              <motion.div
                key={feedback.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C5A572] to-[#D4AF37] flex items-center justify-center overflow-hidden flex-shrink-0">
                    {feedback.userPhoto ? (
                      <img
                        src={feedback.userPhoto}
                        alt={feedback.userName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate mb-1">
                      {feedback.userName}
                    </h4>
                    <div className="flex items-center gap-2 mb-1">
                      {renderStars(feedback.rating, 'sm')}
                      <span className="text-xs text-gray-500">
                        {feedback.rating.toFixed(1)}
                      </span>
                    </div>
                    {feedback.packageName && (
                      <p className="text-xs text-gray-500 truncate">
                        {feedback.packageName}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(feedback.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                </div>

                {/* Comment */}
                {feedback.comment && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      "{feedback.comment}"
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackSection;