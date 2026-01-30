import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Star, Quote, ThumbsUp } from 'lucide-react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../../config/firebase';
import { toast } from 'sonner';
import { useAuth } from '../../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/button';

interface Testimonial {
  id: string;
  userId: string;
  userName: string;
  userCity: string;
  rating: number;
  comment: string;
  imageUrl?: string;
  bookingId: string;
  packageName: string;
  verified: boolean;
  createdAt: any;
}

interface TestimonialsSectionProps {
  onViewAllTestimonials?: () => void; // ✅ NEW: Handler for "Lihat Semua"
}

const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({ onViewAllTestimonials }) => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null); // ✅ NEW: For modal
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTestimonials();
  }, []);

  // Check if profile is complete (same logic as Book Now in packages)
  const isProfileComplete = () => {
    if (!userProfile) return false;

    // Check basic text fields
    const basicFields = [
      userProfile.displayName,
      userProfile.phoneNumber,
      userProfile.identityInfo?.fullName,
      userProfile.identityInfo?.idNumber,
      userProfile.identityInfo?.birthDate,
      userProfile.emergencyContact?.name,
      userProfile.emergencyContact?.phone,
      userProfile.emergencyContact?.relationship,
    ];

    // Check address (it's an object, not a string)
    const address = userProfile.identityInfo?.address as any;
    const isAddressComplete = address &&
      typeof address === 'object' &&
      address.country &&
      address.province &&
      address.city &&
      address.street;

    // Check required documents (they can be objects with base64 or just base64 strings)
    const requiredDocs = [
      userProfile.travelDocuments?.ktpPhoto,
      userProfile.travelDocuments?.kkPhoto,
    ];

    return (
      basicFields.every(field => field && typeof field === 'string' && field.trim() !== '') &&
      isAddressComplete &&
      requiredDocs.every(doc => {
        if (!doc) return false;
        // Handle both new format (object with base64) and legacy format (string)
        if (typeof doc === 'object' && (doc as any).base64) return true;
        if (typeof doc === 'string') return true;
        return false;
      })
    );
  };

  const handleCreateTestimonial = () => {
    if (!currentUser) {
      toast.error('Silakan login terlebih dahulu');
      return;
    }

    if (!isProfileComplete()) {
      toast.error('Lengkapi profil Anda terlebih dahulu', {
        description: 'Anda harus melengkapi data diri dan dokumen perjalanan untuk membuat testimoni',
        duration: 5000,
      });
      return;
    }

    navigate('/create-testimonial');
  };

  const fetchTestimonials = async () => {
    try {
      // ✅ FIXED: Fetch all testimonials first, then filter client-side (no index needed!)
      const testimonialsQuery = query(
        collection(db, 'testimonials'),
        orderBy('createdAt', 'desc'),
        limit(50) // Fetch more to ensure we have enough verified ones
      );
      const querySnapshot = await getDocs(testimonialsQuery);
      const allTestimonials = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Testimonial[];

      // Filter only verified testimonials client-side
      const verifiedTestimonials = allTestimonials
        .filter(t => t.verified === true)
        .slice(0, 3); // ✅ Show only 3 cards (matching design)

      console.log('📊 Homepage - Total Testimonials:', allTestimonials.length);
      console.log('✅ Homepage - Verified Testimonials:', verifiedTestimonials.length);
      console.log('🔍 Homepage - First Testimonial Full Object:', verifiedTestimonials[0]);
      console.log('💬 Homepage - Comment Field Check:', {
        comment: (verifiedTestimonials[0] as any)?.comment,
        description: (verifiedTestimonials[0] as any)?.description,
        review: (verifiedTestimonials[0] as any)?.review,
        text: (verifiedTestimonials[0] as any)?.text,
        content: (verifiedTestimonials[0] as any)?.content,
        testimonial: (verifiedTestimonials[0] as any)?.testimonial,
        message: (verifiedTestimonials[0] as any)?.message,
        feedback: (verifiedTestimonials[0] as any)?.feedback,
        allKeys: verifiedTestimonials[0] ? Object.keys(verifiedTestimonials[0]) : []
      });

      setTestimonials(verifiedTestimonials);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      // Don't show error toast, just fail silently
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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

  // ✅ Helper function to get comment text (supports multiple field names)
  const getCommentText = (testimonial: any): string => {
    const possibleFields = [
      testimonial.comment,
      testimonial.description,
      testimonial.review,
      testimonial.text,
      testimonial.content,
      testimonial.testimonial,
      testimonial.message,
      testimonial.feedback
    ];

    const commentText = possibleFields.find(field => field && typeof field === 'string' && field.trim() !== '' && field !== '..');

    console.log('🔍 Comment fields check:', {
      comment: (testimonial as any).comment,
      description: (testimonial as any).description,
      review: (testimonial as any).review,
      text: (testimonial as any).text,
      content: (testimonial as any).content,
      selected: commentText
    });

    return commentText || 'Testimoni jamaah yang sangat puas dengan pelayanan kami';
  };

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1765892272462-bad4a8ba0fb9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpbmElMjBtb3NxdWUlMjBncmVlbiUyMGRvbWV8ZW58MXx8fHwxNzY4MTg1ODc3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Medina Mosque with Green Dome"
          className="w-full h-full object-cover"
        />
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/75 via-pink-900/65 to-rose-900/75" />
        <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/90 to-white/95" />
      </div>

      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4AF37' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Floating Orbs */}
      <motion.div
        animate={{ y: [0, -20, 0], rotate: [0, 180, 360] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-20 right-20 w-64 h-64 bg-gradient-to-br from-pink-300/20 to-rose-300/20 rounded-full blur-3xl z-0"
      />
      <motion.div
        animate={{ y: [0, 25, 0], x: [0, -20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-32 left-16 w-72 h-72 bg-gradient-to-tl from-purple-300/20 to-pink-300/20 rounded-full blur-3xl z-0"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-block mb-4"
          >
            <span className="px-4 py-2 rounded-full bg-gradient-to-r from-[#D4AF37]/10 to-[#FFD700]/10 border border-[#D4AF37]/20 text-[#D4AF37] font-medium text-sm">
              Ulasan Jamaah
            </span>
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-light mb-4">
            Apa Kata <span className="font-semibold bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] bg-clip-text text-transparent">Jamaah Kami</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Baca testimoni dari ribuan jamaah yang telah mempercayai kami untuk perjalanan spiritual mereka
          </p>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-8 mt-8"
          >
            <div className="flex items-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-[#FFD700] text-[#FFD700]" />
                ))}
              </div>
              <span className="font-semibold text-gray-900">4.9/5</span>
              <span className="text-gray-500">dari 2.500+ ulasan</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loading ? (
            // Loading skeleton
            [1, 2, 3].map((i) => (
              <div key={i} className="h-80 rounded-2xl bg-gray-200 animate-pulse" />
            ))
          ) : testimonials.length === 0 ? (
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
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                onClick={() => setSelectedTestimonial(testimonial)} // ✅ Make clickable
                className="group cursor-pointer" // ✅ Add cursor-pointer
              >
                <div className="relative h-full p-8 rounded-2xl bg-white border border-gray-200 hover:border-[#D4AF37]/40 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/0 to-[#FFD700]/0 group-hover:from-[#D4AF37]/5 group-hover:to-[#FFD700]/5 transition-all duration-300" />

                  {/* Decorative corner */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-bl-3xl" />

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
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: index * 0.1 + i * 0.05 }}
                        >
                          <Star className="w-5 h-5 fill-[#FFD700] text-[#FFD700]" />
                        </motion.div>
                      ))}
                    </div>

                    {/* Review Text */}
                    <p className="text-gray-700 mb-6 leading-relaxed italic">
                      "{getCommentText(testimonial)}"
                    </p>

                    {/* Testimonial Photo (if available) */}
                    {(testimonial.imageUrl || (testimonial as any).photo) && (
                      <div className="mb-6">
                        <img
                          src={testimonial.imageUrl || (testimonial as any).photo}
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
                          {getInitials(testimonial.userName)}
                        </motion.div>

                        {/* Name & Location */}
                        <div>
                          <div className="font-semibold text-gray-900">{testimonial.userName}</div>
                          <div className="text-sm text-gray-500">{testimonial.userCity}</div>
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

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-16 space-y-6"
        >
          {/* ✅ NEW: Lihat Semua Testimoni Button with Login Gate */}
          {onViewAllTestimonials && testimonials.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <button
                onClick={() => {
                  onViewAllTestimonials(); // Navigate to All Testimonials page
                }}
                className="group inline-flex items-center gap-3 px-8 py-4 bg-white hover:bg-emerald-50 border-2 border-emerald-600 rounded-xl text-emerald-700 font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <span>Lihat Semua Testimoni</span>
                <span className="text-2xl group-hover:translate-x-2 transition-transform duration-300">→</span>
              </button>
            </motion.div>
          )}

          {/* Create Testimonial Button - Only show if user is logged in */}
          {currentUser && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <Button
                onClick={handleCreateTestimonial}
                className="bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] hover:shadow-2xl hover:scale-105 transition-all duration-300 text-white px-8 py-6 rounded-xl text-lg font-semibold shadow-lg"
              >
                <Star className="w-5 h-5 mr-2" />
                Buat Testimoni
              </Button>
              {!isProfileComplete() && (
                <p className="text-sm text-gray-500 mt-3">
                  💡 Lengkapi profil Anda untuk membuat testimoni
                </p>
              )}
            </motion.div>
          )}

          {/* Info Box */}
          <div className="inline-flex flex-col items-center gap-4 px-8 py-6 rounded-2xl bg-gradient-to-r from-[#D4AF37]/10 via-[#FFD700]/10 to-[#D4AF37]/10 border border-[#D4AF37]/20">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 fill-[#FFD700] text-[#FFD700]" />
              <p className="font-semibold text-gray-900">Bergabunglah dengan ribuan jamaah yang puas</p>
            </div>
            <p className="text-sm text-gray-600">
              Siap memulai perjalanan Anda? <a href="#packages" className="text-[#D4AF37] hover:text-[#F4D03F] font-semibold transition-colors">Lihat paket kami →</a>
            </p>
          </div>
        </motion.div>
      </div>

      {/* ✅ Detail Modal - Same as AllTestimonialsPage */}
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
              {(selectedTestimonial.imageUrl || (selectedTestimonial as any).photo) && (
                <div className="mb-6">
                  <img
                    src={selectedTestimonial.imageUrl || (selectedTestimonial as any).photo}
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
                    {getInitials(selectedTestimonial.userName)}
                  </div>

                  {/* Name & Location */}
                  <div>
                    <div className="font-semibold text-gray-900 text-lg">
                      {selectedTestimonial.userName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {selectedTestimonial.userCity}
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
    </section>
  );
};

export default TestimonialsSection;