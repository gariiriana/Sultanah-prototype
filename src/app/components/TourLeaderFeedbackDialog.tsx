import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Star, MessageSquare, CheckCircle } from 'lucide-react';
import { addDoc, collection, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { toast } from 'sonner';

interface TourLeaderFeedbackDialogProps {
  open: boolean;
  onClose: () => void;
  tourLeaderId: string;
  tourLeaderName: string;
  tripId: string;
  userId: string;
  userName: string;
  userEmail: string;
}

const TourLeaderFeedbackDialog: React.FC<TourLeaderFeedbackDialogProps> = ({
  open,
  onClose,
  tourLeaderId,
  tourLeaderName,
  tripId,
  userId,
  userName,
  userEmail,
}) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFeedbackSubmitted, setIsFeedbackSubmitted] = useState(false);

  useEffect(() => {
    const checkFeedbackSubmission = async () => {
      const q = query(
        collection(db, 'tourLeaderFeedbacks'),
        where('userId', '==', userId),
        where('tourLeaderId', '==', tourLeaderId),
        where('tripId', '==', tripId)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setIsFeedbackSubmitted(true);
      }
    };

    if (open) {
      checkFeedbackSubmission();
    }
  }, [open, userId, tourLeaderId, tripId]);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Mohon berikan rating terlebih dahulu');
      return;
    }

    if (!feedback.trim()) {
      toast.error('Mohon berikan feedback');
      return;
    }

    try {
      setLoading(true);

      await addDoc(collection(db, 'tourLeaderFeedbacks'), {
        userId,
        userName,
        userEmail,
        tourLeaderId,
        tourLeaderName,
        tripId,
        rating,
        feedback: feedback.trim(),
        createdAt: Timestamp.now(),
        status: 'submitted',
      });

      toast.success('Terima kasih atas feedback Anda!');
      
      // Reset form
      setRating(0);
      setFeedback('');
      onClose();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Gagal mengirim feedback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <MessageSquare className="w-6 h-6 text-amber-600" />
            Feedback Tour Leader
          </DialogTitle>
          <DialogDescription>
            Bagikan pengalaman Anda bersama Tour Leader <span className="font-semibold text-slate-900">{tourLeaderName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Already Submitted Message */}
          {isFeedbackSubmitted && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-900 mb-1">
                  Feedback Sudah Terkirim
                </p>
                <p className="text-xs text-green-700">
                  Anda sudah memberikan rating dan feedback untuk Tour Leader ini. Terima kasih atas partisipasinya!
                </p>
              </div>
            </div>
          )}

          {/* Rating */}
          <div className="space-y-3">
            <Label className="text-base">Rating Pelayanan</Label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => !isFeedbackSubmitted && setRating(star)}
                  onMouseEnter={() => !isFeedbackSubmitted && setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className={`focus:outline-none transition-transform ${!isFeedbackSubmitted ? 'hover:scale-110' : 'cursor-not-allowed opacity-50'}`}
                  disabled={isFeedbackSubmitted}
                >
                  <Star
                    className={`w-10 h-10 ${
                      star <= (hoverRating || rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm font-semibold text-slate-700">
                  {rating === 5 ? 'Sangat Baik' :
                   rating === 4 ? 'Baik' :
                   rating === 3 ? 'Cukup' :
                   rating === 2 ? 'Kurang' : 'Buruk'}
                </span>
              )}
            </div>
          </div>

          {/* Feedback Text */}
          <div className="space-y-3">
            <Label htmlFor="feedback" className="text-base">
              Feedback & Saran <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Bagikan pengalaman Anda selama perjalanan umrah. Apa yang dilakukan dengan baik oleh tour leader? Apa yang bisa ditingkatkan?"
              rows={6}
              className="border-slate-300 focus:border-amber-500 focus:ring-amber-500"
              disabled={isFeedbackSubmitted}
            />
            <p className="text-xs text-slate-500">
              Feedback Anda membantu kami meningkatkan kualitas pelayanan
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
              disabled={loading || rating === 0 || !feedback.trim() || isFeedbackSubmitted}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Mengirim...
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Kirim Feedback
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TourLeaderFeedbackDialog;