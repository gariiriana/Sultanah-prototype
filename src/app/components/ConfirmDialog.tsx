import React from 'react';
import { AlertTriangle, LogOut, Trash2, X, CreditCard, CheckCircle, XCircle } from 'lucide-react';

export type ConfirmDialogType = 'danger' | 'warning' | 'info' | 'success';
export type ConfirmDialogIcon = 'delete' | 'logout' | 'payment' | 'warning' | 'success' | 'error';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmDialogType;
  icon?: ConfirmDialogIcon;
  loading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  icon = 'warning',
  loading = false,
}) => {
  if (!isOpen) return null;

  // Icon configuration
  const getIcon = () => {
    switch (icon) {
      case 'delete':
        return <Trash2 className="w-6 h-6" />;
      case 'logout':
        return <LogOut className="w-6 h-6" />;
      case 'payment':
        return <CreditCard className="w-6 h-6" />;
      case 'success':
        return <CheckCircle className="w-6 h-6" />;
      case 'error':
        return <XCircle className="w-6 h-6" />;
      default:
        return <AlertTriangle className="w-6 h-6" />;
    }
  };

  // Color configuration based on type
  const getColors = () => {
    switch (type) {
      case 'danger':
        return {
          iconBg: 'bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200',
          iconColor: 'text-red-600',
          messageBg: 'bg-gradient-to-br from-red-50 to-orange-50 border border-red-200',
          messageHighlight: 'text-red-600',
          confirmBtn: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white',
        };
      case 'warning':
        return {
          iconBg: 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200',
          iconColor: 'text-yellow-600',
          messageBg: 'bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200',
          messageHighlight: 'text-yellow-600',
          confirmBtn: 'bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white',
        };
      case 'info':
        return {
          iconBg: 'bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200',
          iconColor: 'text-blue-600',
          messageBg: 'bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200',
          messageHighlight: 'text-blue-600',
          confirmBtn: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white',
        };
      case 'success':
        return {
          iconBg: 'bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200',
          iconColor: 'text-green-600',
          messageBg: 'bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200',
          messageHighlight: 'text-green-600',
          confirmBtn: 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white',
        };
    }
  };

  const colors = getColors();

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md w-full border border-gray-200/50 overflow-hidden animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gold gradient header accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#D4AF37]" />
        
        {/* Modal Content */}
        <div className="p-6">
          {/* Icon & Close Button */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full ${colors.iconBg} flex items-center justify-center`}>
                <div className={colors.iconColor}>
                  {getIcon()}
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                {description && (
                  <p className="text-sm text-gray-500">{description}</p>
                )}
              </div>
            </div>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Message */}
          <div className={`mb-6 p-4 ${colors.messageBg} rounded-xl`}>
            <p className="text-gray-700" dangerouslySetInnerHTML={{ __html: message }} />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all"
              onClick={onClose}
              disabled={loading}
            >
              {cancelText}
            </button>
            <button
              type="button"
              className={`flex-1 px-4 py-3 ${colors.confirmBtn} font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {getIcon()}
                  {confirmText}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
