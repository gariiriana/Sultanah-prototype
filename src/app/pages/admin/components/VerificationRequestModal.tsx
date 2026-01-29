import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  CheckCircle, 
  XCircle, 
  FileText,
  Calendar,
  User,
  Mail,
  Phone,
  AlertCircle,
  Image as ImageIcon,
  ArrowRight,
  MessageCircle
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { toast } from 'sonner';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../../../config/firebase';
import { User as UserType } from '../../../../types';

interface VerificationRequestModalProps {
  open: boolean;
  onClose: () => void;
  user: UserType & {
    verificationRequest?: {
      type: 'upgrade-to-current' | 'upgrade-to-alumni';
      proofImage: string;
      message?: string;
      requestedAt: string;
      status: 'pending' | 'approved' | 'rejected';
    };
  };
  onApprove: () => void;
  onReject: () => void;
}

const VerificationRequestModal: React.FC<VerificationRequestModalProps> = ({
  open,
  onClose,
  user,
  onApprove,
  onReject,
}) => {
  const [processing, setProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  if (!open) return null;

  const hasVerificationRequest = !!user.verificationRequest;
  const isPending = user.verificationRequest?.status === 'pending';

  const handleApprove = async () => {
    setProcessing(true);

    try {
      if (!user.verificationRequest) {
        toast.error('No verification request found');
        return;
      }

      const updates: any = {
        'verificationRequest.status': 'approved',
        'verificationRequest.approvedAt': new Date().toISOString(),
      };

      // Update role based on verification type
      if (user.verificationRequest.type === 'upgrade-to-current') {
        updates.role = 'current-jamaah';
      } else if (user.verificationRequest.type === 'upgrade-to-alumni') {
        updates.role = 'alumni';
      }

      await updateDoc(doc(db, 'users', user.id), updates);

      toast.success('Verification approved! User role updated.', {
        description: `${user.displayName} has been upgraded successfully.`
      });

      onApprove();
    } catch (error) {
      console.error('Error approving verification:', error);
      toast.error('Failed to approve verification');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setProcessing(true);

    try {
      if (!user.verificationRequest) {
        toast.error('No verification request found');
        return;
      }

      await updateDoc(doc(db, 'users', user.id), {
        'verificationRequest.status': 'rejected',
        'verificationRequest.rejectionReason': rejectionReason,
        'verificationRequest.rejectedAt': new Date().toISOString(),
      });

      toast.success('Verification rejected', {
        description: `${user.displayName} has been notified.`
      });

      onReject();
    } catch (error) {
      console.error('Error rejecting verification:', error);
      toast.error('Failed to reject verification');
    } finally {
      setProcessing(false);
    }
  };

  const getVerificationTypeInfo = () => {
    if (!user.verificationRequest) return null;

    const { type } = user.verificationRequest;

    if (type === 'upgrade-to-current') {
      return {
        title: 'Upgrade to Jamaah Umroh',
        description: 'User requesting upgrade from Calon Jamaah to Jamaah Umroh',
        from: '🕌 Calon Jamaah',
        to: '✈️ Jamaah Umroh',
        color: 'from-blue-500 to-green-500',
      };
    } else {
      return {
        title: 'Upgrade to Alumni Jamaah',
        description: 'User requesting upgrade from Jamaah Umroh to Alumni',
        from: '✈️ Jamaah Umroh',
        to: '🏆 Alumni Jamaah',
        color: 'from-green-500 to-purple-500',
      };
    }
  };

  const typeInfo = getVerificationTypeInfo();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className={`bg-gradient-to-r ${typeInfo?.color || 'from-gray-500 to-gray-700'} p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                {hasVerificationRequest ? typeInfo?.title : 'User Details'}
              </h2>
              <p className="text-white/90 text-sm">
                {hasVerificationRequest ? typeInfo?.description : 'View user information'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-colors flex items-center justify-center"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Upgrade Flow Visual */}
          {hasVerificationRequest && typeInfo && (
            <div className="mt-6 flex items-center justify-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-center">
                <div className="text-2xl mb-1">{typeInfo.from.split(' ')[0]}</div>
                <p className="text-xs text-white/80">{typeInfo.from.split(' ').slice(1).join(' ')}</p>
              </div>
              <ArrowRight className="w-8 h-8 text-white" />
              <div className="text-center">
                <div className="text-2xl mb-1">{typeInfo.to.split(' ')[0]}</div>
                <p className="text-xs text-white/80">{typeInfo.to.split(' ').slice(1).join(' ')}</p>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* User Information */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <User className="w-5 h-5 text-[#D4AF37]" />
              User Information
            </h3>
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between">
                <span className="text-sm text-gray-600">Full Name</span>
                <span className="text-sm font-medium text-gray-900 text-right">{user.displayName || 'N/A'}</span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-sm text-gray-600">Email</span>
                <span className="text-sm font-medium text-gray-900 text-right">{user.email}</span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-sm text-gray-600">Phone</span>
                <span className="text-sm font-medium text-gray-900 text-right">{user.phoneNumber || 'N/A'}</span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-sm text-gray-600">Current Role</span>
                <span className="text-sm font-medium text-gray-900 text-right capitalize">{user.role?.replace('-', ' ')}</span>
              </div>
            </div>

            {/* Contact Actions */}
            {user.phoneNumber && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                {/* WhatsApp Button */}
                <a
                  href={`https://wa.me/${user.phoneNumber.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-50 hover:bg-green-100 text-green-700 hover:text-green-800 rounded-lg border border-green-200 transition-colors font-medium text-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </a>

                {/* Email Button */}
                <a
                  href={`mailto:${user.email}`}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 rounded-lg border border-blue-200 transition-colors font-medium text-sm"
                >
                  <Mail className="w-4 h-4" />
                  Email
                </a>
              </div>
            )}
          </div>

          {/* Verification Request Details */}
          {hasVerificationRequest && user.verificationRequest && (
            <>
              {/* Request Date & Message */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#D4AF37]" />
                  Request Details
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <span className="text-sm text-gray-600">Request Date</span>
                    <span className="text-sm font-medium text-gray-900 text-right">
                      {new Date(user.verificationRequest.requestedAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  {user.verificationRequest.message && (
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-sm text-gray-600 mb-1">Message from user:</p>
                      <p className="text-sm text-gray-900 italic">"{user.verificationRequest.message}"</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Proof Image */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-[#D4AF37]" />
                  Proof Document
                </h3>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="relative bg-white rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={user.verificationRequest.proofImage}
                      alt="Proof document"
                      className="w-full h-auto max-h-96 object-contain"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {user.verificationRequest.type === 'upgrade-to-current' 
                      ? 'Bukti pembayaran atau kesediaan untuk membeli paket umroh'
                      : 'Bukti telah menyelesaikan ibadah umroh'}
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Current Status */}
          {hasVerificationRequest && user.verificationRequest && (
            <div className={`p-4 rounded-xl border-2 ${
              user.verificationRequest.status === 'approved' 
                ? 'bg-green-50 border-green-200' 
                : user.verificationRequest.status === 'rejected'
                ? 'bg-red-50 border-red-200'
                : 'bg-amber-50 border-amber-200'
            }`}>
              <div className="flex items-center gap-2">
                {user.verificationRequest.status === 'approved' && <CheckCircle className="w-5 h-5 text-green-600" />}
                {user.verificationRequest.status === 'rejected' && <XCircle className="w-5 h-5 text-red-600" />}
                {user.verificationRequest.status === 'pending' && <AlertCircle className="w-5 h-5 text-amber-600" />}
                <p className={`font-medium ${
                  user.verificationRequest.status === 'approved' 
                    ? 'text-green-900' 
                    : user.verificationRequest.status === 'rejected'
                    ? 'text-red-900'
                    : 'text-amber-900'
                }`}>
                  Status: {user.verificationRequest.status.charAt(0).toUpperCase() + user.verificationRequest.status.slice(1)}
                </p>
              </div>
              {user.verificationRequest.status === 'rejected' && (user.verificationRequest as any).rejectionReason && (
                <p className="text-sm text-red-700 mt-2">
                  Reason: {(user.verificationRequest as any).rejectionReason}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          {hasVerificationRequest && isPending && (
            <div className="pt-6 border-t border-gray-200">
              {!showRejectForm ? (
                <div className="flex gap-3">
                  <Button
                    onClick={handleApprove}
                    disabled={processing}
                    className="flex-1 h-12 bg-green-500 hover:bg-green-600 text-white font-semibold"
                  >
                    {processing ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Approve Verification
                      </span>
                    )}
                  </Button>
                  <Button
                    onClick={() => setShowRejectForm(true)}
                    variant="outline"
                    className="flex-1 h-12 border-red-300 text-red-600 hover:bg-red-50 font-semibold"
                  >
                    <XCircle className="w-5 h-5 mr-2" />
                    Reject
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rejection Reason
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Explain why this verification is being rejected..."
                      className="w-full h-24 px-3 py-2 border border-gray-300 rounded-xl focus:border-red-500 focus:ring-red-500/30 focus:outline-none resize-none"
                      required
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleReject}
                      disabled={processing || !rejectionReason.trim()}
                      className="flex-1 h-12 bg-red-500 hover:bg-red-600 text-white font-semibold"
                    >
                      {processing ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Processing...
                        </span>
                      ) : (
                        'Confirm Rejection'
                      )}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowRejectForm(false);
                        setRejectionReason('');
                      }}
                      variant="outline"
                      className="h-12 px-6"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Close Button for non-pending requests */}
          {!isPending && (
            <div className="pt-6 border-t border-gray-200">
              <Button
                onClick={onClose}
                variant="outline"
                className="w-full h-12"
              >
                Close
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default VerificationRequestModal;