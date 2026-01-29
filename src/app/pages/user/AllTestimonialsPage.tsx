import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { ArrowLeft, Star, Quote, ThumbsUp } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '../../components/ui/button';

// ✅ LOGO: Sultanah local logo
const sultanahLogo = '/images/logo.png';

interface Testimonial {
  id: string;
  userId?: string;
  userName?: string;
  name?: string; // Legacy field from sample data
  userPhoto?: string;
  avatar?: string; // Legacy field from sample data for user photo
  userCity?: string;
  location?: string; // Legacy field from sample data
  packageName?: string;
  rating: number;
  comment: string;
  imageUrl?: string;
  photo?: string;
  tripDate?: string;
  date?: string;
  status?: 'pending' | 'approved' | 'rejected';
  verified?: boolean;
  createdAt: any;
}

interface AllTestimonialsPageProps {
  onBack: () => void;
}

const AllTestimonialsPage: React.FC<AllTestimonialsPageProps> = ({ onBack }) => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null);

  useEffect(() => {
    fetchAllTestimonials();
  }, []);

  const fetchAllTestimonials = async () => {
    try {
      setLoading(true);
      // ✅ FIXED: Fetch all testimonials first, then filter client-side (no index needed!)
      const q = query(
        collection(db, 'testimonials'),
        orderBy('createdAt', 'desc'),
      );

      const snapshot = await getDocs(q);
      const allTestimonials = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Testimonial[];

      // Filter client-side for verified or approved testimonials
      const verifiedTestimonials = allTestimonials.filter(t =>
        t.status === 'approved' || t.verified === true
      );

      console.log('📝 All Testimonials fetched:', allTestimonials.length);
      console.log('✅ Verified Testimonials:', verifiedTestimonials.length);
      console.log('🔍 Sample testimonial data:', verifiedTestimonials[0]);

      setTestimonials(verifiedTestimonials);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
    } finally {
      setLoading(false);
    }
  };

  const getColorClass = (index: number) => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-purple-500 to-purple-600',
      'from-green-500 to-green-600',
      'from-pink-500 to-pink-600',
      'from-orange-500 to-orange-600',
      'from-teal-500 to-teal-600',
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
      testimonial.feedback
    ];

    const commentText = possibleFields.find(field => field && typeof field === 'string' && field.trim() !== '' && field !== '..');

    return commentText || 'Testimoni jamaah yang sangat puas dengan pelayanan kami';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat testimoni...</p>
        </div>
      </div>
    );
  }

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
                  Semua Testimoni Jamaah
                </h1>
                <p className="text-sm text-white/90 mt-0.5 drop-shadow">
                  Baca pengalaman jamaah kami
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

      {/* Content - Same styling as HomePage TestimonialsSection */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.length === 0 ? (
            // Empty state
            <div className="col-span-3 text-center py-20">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gray-100 mb-6">
                <Star className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-700 mb-2">Belum Ada Testimoni</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Jadilah yang pertama berbagi pengalaman Anda! Selesaikan perjalanan dan tinggalkan ulasan.
              </p>
            </div>
          ) : (
            testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05, duration: 0.5 }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="group cursor-pointer"
                onClick={() => setSelectedTestimonial(testimonial)}
              >
                <div className="relative h-full p-8 rounded-2xl bg-white border border-gray-200 hover:border-[#D4AF37]/40 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/0 to-[#FFD700]/0 group-hover:from-[#D4AF37]/5 group-hover:to-[#FFD700]/5 transition-all duration-300" />

                  {/* Decorative corner */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-bl-3xl" />

                  {/* "Lihat Detail" Badge - Show on hover */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-[#D4AF37] text-white text-xs px-3 py-1.5 rounded-full font-medium shadow-lg">
                      👁 Lihat Detail
                    </div>
                  </div>

                  <div className="relative z-10">
                    {/* Quote Icon */}
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: -5 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <Quote className="w-12 h-12 text-[#D4AF37] mb-4 opacity-30" />
                    </motion.div>

                    {/* Stars */}
                    <div className="flex mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-[#FFD700] text-[#FFD700]" />
                      ))}
                    </div>

                    {/* Review Text */}
                    <p className="text-gray-700 mb-6 leading-relaxed italic line-clamp-4">
                      "{getCommentText(testimonial)}"
                    </p>

                    {/* Testimonial Photo (if available) */}
                    {(testimonial.imageUrl || testimonial.photo) && (
                      <div className="mb-6">
                        <img
                          src={testimonial.imageUrl || testimonial.photo}
                          alt="Foto testimoni"
                          className="w-full h-48 object-cover rounded-lg shadow-md"
                        />
                      </div>
                    )}

                    {/* Package Name (if available) */}
                    {testimonial.packageName && (
                      <div className="mb-4">
                        <span className="text-xs px-3 py-1 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] font-medium border border-[#D4AF37]/20">
                          📦 {testimonial.packageName}
                        </span>
                      </div>
                    )}

                    {/* Divider */}
                    <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mb-6" />

                    {/* Author Info */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          className={`w-12 h-12 rounded-full bg-gradient-to-br ${getColorClass(index)} flex items-center justify-center text-white font-semibold shadow-md`}
                        >
                          {getInitials(testimonial.userName || testimonial.name || 'Jamaah')}
                        </motion.div>

                        {/* Name & Location */}
                        <div>
                          <div className="font-semibold text-gray-900">
                            {testimonial.userName || testimonial.name || 'Jamaah'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {testimonial.userCity || testimonial.location || 'Indonesia'}
                          </div>
                        </div>
                      </div>

                      {/* Verified Badge */}
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 border border-green-200"
                      >
                        <ThumbsUp className="w-3 h-3 text-green-600" />
                        <span className="text-xs text-green-700 font-medium">Verified</span>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Detail Modal - Same styling as HomePage */}
      {selectedTestimonial && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedTestimonial(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Content - Same styling as card */}
            <div className="relative p-8">
              {/* Close Button */}
              <button
                onClick={() => setSelectedTestimonial(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Quote Icon */}
              <Quote className="w-12 h-12 text-[#D4AF37] mb-4 opacity-30" />

              {/* Stars */}
              <div className="flex mb-6">
                {[...Array(selectedTestimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 fill-[#FFD700] text-[#FFD700]" />
                ))}
              </div>

              {/* Full Review Text */}
              <p className="text-gray-700 mb-6 leading-relaxed text-lg italic">
                "{getCommentText(selectedTestimonial)}"
              </p>

              {/* Testimonial Photo (if available) */}
              {(selectedTestimonial.imageUrl || selectedTestimonial.photo) && (
                <div className="mb-6">
                  <img
                    src={selectedTestimonial.imageUrl || selectedTestimonial.photo}
                    alt="Foto testimoni"
                    className="w-full h-auto object-cover rounded-lg shadow-md"
                  />
                </div>
              )}

              {/* Package Name (if available) */}
              {selectedTestimonial.packageName && (
                <div className="mb-6">
                  <span className="text-sm px-4 py-2 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] font-medium border border-[#D4AF37]/20">
                    📦 {selectedTestimonial.packageName}
                  </span>
                </div>
              )}

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mb-6" />

              {/* Author Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${getColorClass(testimonials.indexOf(selectedTestimonial))} flex items-center justify-center text-white font-semibold text-lg shadow-md`}>
                    {getInitials(selectedTestimonial.userName || selectedTestimonial.name || 'Jamaah')}
                  </div>

                  {/* Name & Location */}
                  <div>
                    <div className="font-semibold text-gray-900 text-lg">
                      {selectedTestimonial.userName || selectedTestimonial.name || 'Jamaah'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {selectedTestimonial.userCity || selectedTestimonial.location || 'Indonesia'}
                    </div>
                  </div>
                </div>

                {/* Verified Badge */}
                <div className="flex items-center gap-1 px-3 py-2 rounded-full bg-green-50 border border-green-200">
                  <ThumbsUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700 font-medium">Verified</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AllTestimonialsPage;