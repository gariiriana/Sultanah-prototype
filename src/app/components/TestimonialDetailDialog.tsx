import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Star, Calendar, Package, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface Testimonial {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  rating: number;
  content: string;
  packageName?: string;
  imageUrl?: string; // ✅ ADD: Testimonial photo
  createdAt: any;
  verified?: boolean;
  userRole?: string;
}

interface TestimonialDetailDialogProps {
  open: boolean;
  onClose: () => void;
  testimonial: Testimonial | null;
}

const TestimonialDetailDialog: React.FC<TestimonialDetailDialogProps> = ({
  open,
  onClose,
  testimonial,
}) => {
  if (!testimonial) return null;

  const formatDate = (timestamp: any): string => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'alumni':
        return 'Alumni Jamaah';
      case 'jamaah':
        return 'Jamaah Umroh';
      default:
        return 'Jamaah';
    }
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl bg-gradient-to-r from-[#D4AF37] to-[#FFD700] bg-clip-text text-transparent">
            Detail Testimoni
          </DialogTitle>
          <DialogDescription className="sr-only">
            Detail lengkap testimoni jamaah termasuk rating, pengalaman spiritual, dan foto dokumentasi
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* User Profile Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-[#D4AF37]/10 to-[#FFD700]/10 rounded-xl p-6 border border-[#D4AF37]/20"
          >
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#FFD700] text-white flex items-center justify-center font-bold text-2xl flex-shrink-0 shadow-lg">
                {testimonial.userName?.charAt(0).toUpperCase() || 'U'}
              </div>

              {/* User Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-xl text-gray-800">
                    {testimonial.userName}
                  </h3>
                  {testimonial.verified && (
                    <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                      <CheckCircle className="w-3 h-3" />
                      Verified
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-600 mb-2">
                  {getRoleLabel(testimonial.userRole)}
                </p>

                {/* Package Badge */}
                {testimonial.packageName && (
                  <div className="inline-flex items-center gap-1 text-sm px-3 py-1 rounded-full bg-white border border-[#D4AF37]/30 text-[#D4AF37] font-medium">
                    <Package className="w-4 h-4" />
                    {testimonial.packageName}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Rating Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-center gap-4 py-4"
          >
            <div className="flex gap-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-8 h-8 ${
                    i < testimonial.rating
                      ? 'fill-[#FFD700] text-[#FFD700]'
                      : 'fill-gray-200 text-gray-300'
                  }`}
                />
              ))}
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-[#D4AF37]">
                {testimonial.rating}/5
              </p>
              <p className="text-xs text-gray-500">
                {testimonial.rating === 5 && 'Sangat Puas'}
                {testimonial.rating === 4 && 'Puas'}
                {testimonial.rating === 3 && 'Cukup'}
                {testimonial.rating === 2 && 'Kurang'}
                {testimonial.rating === 1 && 'Sangat Kurang'}
              </p>
            </div>
          </motion.div>

          {/* Testimonial Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
          >
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-[#D4AF37]">📝</span>
              Pengalaman Spiritual
            </h4>

            {/* ✅ Testimonial Photo (if available) */}
            {(testimonial.imageUrl || (testimonial as any).photo) && (
              <div className="mb-4 rounded-lg overflow-hidden border-2 border-[#D4AF37]/20">
                <img
                  src={testimonial.imageUrl || (testimonial as any).photo}
                  alt="Testimonial"
                  className="w-full max-h-96 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}

            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              "{getCommentText(testimonial)}"
            </p>
          </motion.div>

          {/* Metadata */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-200"
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Dikirim: {formatDate(testimonial.createdAt)}</span>
            </div>
            <div className="text-xs text-gray-400">
              ID: {testimonial.id.substring(0, 8)}...
            </div>
          </motion.div>

          {/* Footer Note */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-xs text-amber-800">
              💡 <strong>Catatan:</strong> Testimoni ini membantu calon jamaah untuk memahami pengalaman spiritual yang akan mereka dapatkan. Terima kasih telah berbagi! 🙏
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TestimonialDetailDialog;