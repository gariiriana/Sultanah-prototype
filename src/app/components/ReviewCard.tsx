import React from 'react';
import { Card, CardContent } from './ui/card';
import { Star, User } from 'lucide-react';

interface ReviewCardProps {
  userName: string;
  userPhoto?: string;
  rating: number;
  comment: string;
  photo?: string;
  createdAt: string;
}

const ReviewCard: React.FC<ReviewCardProps> = ({
  userName,
  userPhoto,
  rating,
  comment,
  photo,
  createdAt,
}) => {
  return (
    <Card className="bg-white/90 backdrop-blur-xl border-2 border-[#D4AF37]/20 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden">
      <CardContent className="p-6">
        {/* User Info */}
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0">
            {userPhoto ? (
              <img
                src={userPhoto}
                alt={userName}
                className="w-12 h-12 rounded-full object-cover border-2 border-[#D4AF37]/30"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#FFD700] flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <h4 className="font-semibold text-gray-800">{userName}</h4>
            <div className="flex items-center gap-2 mt-1">
              {/* Star Rating */}
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= rating
                        ? 'fill-[#FFD700] text-[#FFD700]'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500">
                {new Date(createdAt).toLocaleDateString('id-ID', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Comment */}
        <p className="text-gray-700 leading-relaxed mb-4">{comment}</p>

        {/* Photo */}
        {photo && (
          <div className="rounded-xl overflow-hidden border-2 border-[#D4AF37]/20">
            <img
              src={photo}
              alt="Review"
              className="w-full h-64 object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReviewCard;
