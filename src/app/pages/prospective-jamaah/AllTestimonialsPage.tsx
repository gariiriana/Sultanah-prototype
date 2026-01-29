import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Quote, Star, MessageCircle, MapPin, Calendar, Award } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../../contexts/AuthContext';

// ✅ LOGO: Sultanah local logo
const sultanahLogo = '/images/logo.png';

interface AllTestimonialsPageProps {
  testimonials: any[];
  onBack: () => void;
}

const AllTestimonialsPage: React.FC<AllTestimonialsPageProps> = ({ testimonials, onBack }) => {
  const { currentUser } = useAuth();
  const userName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Jamaah';

  const getColorClass = (index: number) => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-purple-500 to-purple-600',
      'from-green-500 to-green-600',
      'from-pink-500 to-pink-600',
      'from-orange-500 to-orange-600',
    ];
    return colors[index % colors.length];
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // ✅ Helper function to get comment text (supports multiple field names)
  const getCommentText = (testimonial: any): string => {
    const possibleFields = [
      testimonial.comment,
      testimonial.description,
      testimonial.review,
      testimonial.text,
      testimonial.testimonial,
      testimonial.message,
      testimonial.feedback,
      testimonial.content
    ];

    const commentText = possibleFields.find(field => field && typeof field === 'string' && field.trim() !== '' && field !== '..');

    return commentText || 'Testimoni jamaah yang sangat puas dengan pelayanan kami';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Beautiful Header with Background Image */}
      <div className="relative h-52 overflow-hidden">
        {/* Background Image - Mecca Kaaba */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(https://images.unsplash.com/photo-1668304521248-0dd0cc00fbfc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWNjYSUyMGthYWJhJTIwbmlnaHR8ZW58MXx8fHwxNzY3NzcyODk2fDA&ixlib=rb-4.1.0&q=80&w=1080)`
          }}
        >
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60" />
        </div>

        {/* Content on top of image */}
        <div className="relative z-10 h-full max-w-7xl mx-auto px-6 py-6 flex flex-col justify-between">
          {/* Top: Logo, Welcome Text, and Back Button */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {/* Logo */}
              <img src={sultanahLogo} alt="Sultanah" className="w-12 h-12 object-contain drop-shadow-2xl" />

              {/* Welcome Text */}
              <div>
                <h1 className="text-2xl font-bold text-white drop-shadow-lg">
                  Welcome Detail Testimoni
                </h1>
                <p className="text-sm text-white/90 mt-0.5 drop-shadow">
                  Halo, {userName}
                </p>
              </div>
            </div>

            {/* Back Button */}
            <Button
              onClick={onBack}
              className="bg-white/95 backdrop-blur-sm hover:bg-white text-gray-900 h-9 px-4 text-sm shadow-lg flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </Button>
          </div>

          {/* Bottom: Testimonial Count Badge */}
          <div className="bg-white/95 backdrop-blur-sm rounded-lg px-4 py-2 inline-block self-start shadow-md">
            <p className="text-sm font-semibold text-gray-900">
              {testimonials.length} Testimoni Jamaah
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-shadow"
            >
              {/* Quote Icon */}
              <Quote className="w-8 h-8 text-gray-300 mb-3" />

              {/* Rating */}
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < (testimonial.rating || 5)
                        ? 'text-yellow-500 fill-yellow-500'
                        : 'text-gray-300'
                      }`}
                  />
                ))}
              </div>

              {/* Review */}
              <p className="text-sm text-gray-700 mb-4 italic line-clamp-4">
                "{getCommentText(testimonial)}"
              </p>

              {/* Photo if available */}
              {(testimonial.photo || testimonial.imageUrl) && (
                <div className="mb-4 rounded-lg overflow-hidden">
                  <img
                    src={testimonial.photo || testimonial.imageUrl}
                    alt="Testimoni"
                    className="w-full h-40 object-cover"
                  />
                </div>
              )}

              {/* Package */}
              {testimonial.packageName && (
                <div className="mb-4 p-2 rounded bg-orange-50 flex items-center gap-2">
                  <Award className="w-3 h-3 text-[#D4AF37]" />
                  <span className="text-xs font-semibold text-[#D4AF37]">
                    {testimonial.packageName}
                  </span>
                </div>
              )}

              {/* User Info */}
              <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getColorClass(index)} flex items-center justify-center text-white font-bold text-sm`}>
                  {getInitials(testimonial.userName || testimonial.name || 'U')}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm text-gray-900">
                    {testimonial.userName || testimonial.name}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <MapPin className="w-3 h-3" />
                    <span>{testimonial.userCity || testimonial.city || 'Indonesia'}</span>
                  </div>
                </div>
              </div>

              {/* Date */}
              {testimonial.date && (
                <div className="mt-3 flex items-center gap-1 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {new Date(testimonial.date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {testimonials.length === 0 && (
          <div className="text-center py-12">
            <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="font-bold text-gray-900 mb-1">Belum Ada Testimoni</h3>
            <p className="text-sm text-gray-600">Testimoni jamaah akan ditampilkan di sini.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllTestimonialsPage;