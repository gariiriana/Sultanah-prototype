import React from 'react';
import { motion } from 'motion/react';
import { Star, MessageCircle } from 'lucide-react';
import { Card, CardContent } from '../ui/card';

interface Testimonial {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  content: string;
  packageName?: string;
  createdAt: any;
  userPhoto?: string;
  imageUrl?: string; // ✅ ADD: Testimonial photo
  verified?: boolean;
}

interface TestimonialSectionProps {
  testimonials: Testimonial[];
  loading: boolean;
  emptyMessage?: string;
  showSubmitButton?: boolean;
  onSubmitClick?: () => void;
  onTestimonialClick?: (testimonial: Testimonial) => void; // ✅ NEW: Click handler for detail
  maxItems?: number; // ✅ NEW: Limit number of items to display (default: show all)
  onViewAllTestimonials?: () => void; // ✅ NEW: Handler for "Lihat Semua" button
}

const TestimonialSection: React.FC<TestimonialSectionProps> = ({
  testimonials,
  loading,
  emptyMessage = 'Belum ada testimonial',
  showSubmitButton = false,
  onSubmitClick,
  onTestimonialClick,
  maxItems, // ✅ FIXED: Don't set default here to avoid circular reference
  onViewAllTestimonials,
}) => {
  // ✅ FIXED: Set default value inside component body
  const displayLimit = maxItems !== undefined ? maxItems : testimonials.length;

  const formatDate = (timestamp: any): string => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // ✅ Helper function to get comment text (supports multiple field names)
  const getCommentText = (testimonial: any): string => {
    const possibleFields = [
      testimonial.content,
      testimonial.comment,
      testimonial.description, 
      testimonial.review,
      testimonial.text,
      testimonial.testimonial,
      testimonial.message,
      testimonial.feedback
    ];
    
    const commentText = possibleFields.find(field => field && typeof field === 'string' && field.trim() !== '' && field !== '..');
    
    return commentText || 'Testimoni jamaah yang sangat puas dengan pelayanan kami';
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
        <p className="mt-4 text-gray-600">Memuat testimonial...</p>
      </div>
    );
  }

  if (testimonials.length === 0) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm">
        <CardContent className="p-12">
          <div className="text-center">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold mb-2 text-gray-800">{emptyMessage}</h3>
            <p className="text-gray-600 mb-6">
              Testimonial dari jamaah akan ditampilkan di sini
            </p>
            {showSubmitButton && onSubmitClick && (
              <button
                onClick={onSubmitClick}
                className="px-6 py-3 bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                <Star className="w-4 h-4 inline mr-2" />
                Tulis Testimonial Pertama
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {testimonials.slice(0, displayLimit).map((testimonial, index) => (
        <motion.div
          key={testimonial.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.05 }}
        >
          <Card 
            className="bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300 h-full cursor-pointer group"
            onClick={() => onTestimonialClick?.(testimonial)}
          >
            <CardContent className="p-6">
              {/* User Info */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#FFD700] text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                  {testimonial.userName?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-800 truncate">
                    {testimonial.userName}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {formatDate(testimonial.createdAt)}
                  </p>
                </div>
                {testimonial.verified && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                    ✓ Verified
                  </span>
                )}
              </div>

              {/* Rating Stars */}
              <div className="flex mb-4">
                {[...Array(testimonial.rating || 5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#FFD700] text-[#FFD700]" />
                ))}
              </div>

              {/* ✅ Testimonial Photo (if available) */}
              {(testimonial.imageUrl || (testimonial as any).photo) && (
                <div className="mb-4 rounded-lg overflow-hidden">
                  <img
                    src={testimonial.imageUrl || (testimonial as any).photo}
                    alt="Testimonial"
                    className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* Content */}
              <p className="text-gray-700 text-sm mb-4 line-clamp-5">
                "{getCommentText(testimonial)}"
              </p>

              {/* Package Name & Read More */}
              <div className="flex items-center justify-between gap-2 mt-auto">
                {testimonial.packageName && (
                  <span className="inline-block text-xs px-3 py-1 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] font-medium border border-[#D4AF37]/20">
                    📦 {testimonial.packageName}
                  </span>
                )}
                <button className="text-xs text-[#D4AF37] font-semibold hover:underline ml-auto group-hover:translate-x-1 transition-transform">
                  Baca Selengkapnya →
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
      {testimonials.length > displayLimit && onViewAllTestimonials && (
        <div className="col-span-full text-center mt-6">
          <button
            onClick={onViewAllTestimonials}
            className="px-6 py-3 bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Lihat Semua Testimonial
          </button>
        </div>
      )}
    </div>
  );
};

export default TestimonialSection;