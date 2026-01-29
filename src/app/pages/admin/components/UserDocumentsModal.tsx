import React from 'react';
import { X, Download, FileText, File, FileSpreadsheet, CheckCircle2, Calendar, ArrowLeft } from 'lucide-react';
import { User } from '../../../../types';
import { Button } from '../../../components/ui/button';

interface UserDocumentsModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

const UserDocumentsModal: React.FC<UserDocumentsModalProps> = ({ user, isOpen, onClose }) => {
  if (!isOpen || !user) return null;

  // Helper function to format file size
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  // Helper function to download file
  const downloadFile = (fileData: any, fileName: string) => {
    if (!fileData) return;

    const isNewFormat = typeof fileData === 'object' && fileData.base64;
    const base64 = isNewFormat ? fileData.base64 : fileData;
    const name = isNewFormat ? fileData.fileName : fileName;

    // Create a download link
    const link = document.createElement('a');
    link.href = base64;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper function to render document card
  const renderDocumentCard = (
    label: string,
    fileData: any,
    isOptional: boolean = false
  ) => {
    if (!fileData) {
      return (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
          <div className="flex items-start gap-3">
            <div className="w-16 h-16 flex items-center justify-center rounded-lg bg-gray-200">
              <File className="w-8 h-8 text-gray-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-700">{label}</p>
              {isOptional && <span className="text-xs text-gray-500">(Optional)</span>}
              <p className="text-xs text-gray-500 mt-1">Belum diupload</p>
            </div>
          </div>
        </div>
      );
    }

    const isNewFormat = typeof fileData === 'object' && fileData.base64;
    const base64 = isNewFormat ? fileData.base64 : fileData;
    const fileName = isNewFormat ? fileData.fileName : `${label.toLowerCase().replace(' ', '-')}.jpg`;
    const fileSize = isNewFormat ? formatFileSize(fileData.fileSize) : 'Unknown size';
    const fileType = isNewFormat ? fileData.fileType : 'image/jpeg';

    // Determine file icon
    let FileIcon = File;
    let iconColor = 'text-blue-600';
    let bgColor = 'bg-blue-100';

    if (fileType === 'application/pdf') {
      FileIcon = FileText;
      iconColor = 'text-red-600';
      bgColor = 'bg-red-100';
    } else if (fileType.includes('word')) {
      FileIcon = FileText;
      iconColor = 'text-blue-700';
      bgColor = 'bg-blue-100';
    } else if (fileType.includes('sheet') || fileType.includes('excel')) {
      FileIcon = FileSpreadsheet;
      iconColor = 'text-green-700';
      bgColor = 'bg-green-100';
    }

    return (
      <div className="border-2 border-green-300 bg-green-50 rounded-lg p-4">
        <div className="flex items-start gap-3">
          {/* File Preview/Icon */}
          {fileType.startsWith('image/') ? (
            <img 
              src={base64} 
              alt={label} 
              className="w-16 h-16 object-cover rounded-lg border-2 border-green-400"
            />
          ) : (
            <div className={`w-16 h-16 flex items-center justify-center rounded-lg border-2 border-green-400 ${bgColor}`}>
              <FileIcon className={`w-8 h-8 ${iconColor}`} />
            </div>
          )}

          {/* File Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="text-sm font-semibold text-green-700">{label} Uploaded</span>
            </div>
            <p className="text-xs text-gray-600 truncate" title={fileName}>{fileName}</p>
            <p className="text-xs text-gray-500">{fileSize}</p>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => downloadFile(fileData, fileName)}
                className="text-xs text-[#D4AF37] hover:text-[#C5A572] cursor-pointer font-medium flex items-center gap-1"
              >
                <Download className="w-3 h-3" />
                Download
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-0 overflow-y-auto bg-white">
      <div className="w-full min-h-screen">
        {/* Header */}
        <div className="sticky top-0 z-10 relative bg-gradient-to-r from-[#D4AF37] via-[#F4D03F] to-[#C5A572] px-8 py-6 shadow-lg">
          {/* Back Button */}
          <button
            onClick={onClose}
            className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-lg transition-all duration-300 text-white font-medium border border-white/30"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Kembali</span>
          </button>

          {/* Title - Centered */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-1">
              <FileText className="w-7 h-7 text-white drop-shadow-md" />
              <h2 className="text-2xl font-bold text-white drop-shadow-md">Dokumen Perjalanan User</h2>
            </div>
            <p className="text-sm text-white/95 font-medium">{user.displayName || user.email}</p>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-6 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 rounded-lg p-2 transition-all duration-300 backdrop-blur-md border border-white/30"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-8 py-8 bg-gradient-to-br from-gray-50 to-white min-h-screen">
          {/* Passport Info */}
          <div className="mb-8 bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-[#D4AF37]/20 shadow-lg">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-[#D4AF37] to-[#C5A572] rounded-full"></div>
              Informasi Passport
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Nomor Passport</label>
                <div className="px-4 py-3 bg-gradient-to-br from-gray-50 to-white rounded-lg border-2 border-[#D4AF37]/30 shadow-sm">
                  <p className="text-gray-900 font-mono font-semibold text-lg">
                    {user.travelDocuments?.passportNumber || 'A1234432'}
                  </p>
                </div>
                <p className="text-xs text-gray-500 mt-2">6-9 karakter alfanumerik (A-Z, 0-9)</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#D4AF37]" />
                  Tanggal Kadaluarsa Passport
                </label>
                <div className="px-4 py-3 bg-gradient-to-br from-gray-50 to-white rounded-lg border-2 border-[#D4AF37]/30 shadow-sm">
                  <p className="text-gray-900 font-semibold text-lg">
                    {user.travelDocuments?.passportExpiry 
                      ? new Date(user.travelDocuments.passportExpiry).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })
                      : '01 Maret 2026'
                    }
                  </p>
                </div>
                <p className="text-xs text-gray-500 mt-2">Harus tanggal di masa depan</p>
              </div>
            </div>
          </div>

          {/* Documents Grid */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-[#D4AF37]/20 shadow-lg mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-[#D4AF37] to-[#C5A572] rounded-full"></div>
              Dokumen Upload
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Row 1 */}
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">Foto Passport</label>
                <p className="text-xs text-gray-500 mb-3">Max 3MB untuk gambar, 500KB untuk PDF/Word/Excel</p>
                {renderDocumentCard('Passport', user.travelDocuments?.passportPhoto)}
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">Foto KTP</label>
                <p className="text-xs text-gray-500 mb-3">Max 3MB untuk gambar, 500KB untuk PDF/Word/Excel</p>
                {renderDocumentCard('KTP', user.travelDocuments?.ktpPhoto)}
              </div>

              {/* Row 2 */}
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">Kartu Keluarga (KK)</label>
                <p className="text-xs text-gray-500 mb-3">Max 3MB untuk gambar, 500KB untuk PDF/Word/Excel</p>
                {renderDocumentCard('KK', user.travelDocuments?.kkPhoto)}
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">Akta Lahir</label>
                <p className="text-xs text-gray-500 mb-3">Max 3MB untuk gambar, 500KB untuk PDF/Word/Excel</p>
                {renderDocumentCard('Birth Certificate', user.travelDocuments?.birthCertificate)}
              </div>

              {/* Row 3 */}
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">
                  Buku Nikah <span className="text-xs text-gray-500 font-normal">(Opsional)</span>
                </label>
                <p className="text-xs text-gray-500 mb-3">Max 3MB untuk gambar, 500KB untuk PDF/Word/Excel</p>
                {renderDocumentCard('Marriage Certificate', user.travelDocuments?.marriageCertificate, true)}
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">Visa Umroh</label>
                <p className="text-xs text-gray-500 mb-3">Max 3MB untuk gambar, 500KB untuk PDF/Word/Excel</p>
                {renderDocumentCard('Umrah Visa', user.travelDocuments?.umrahVisa)}
              </div>

              {/* Row 4 */}
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">Tiket Pesawat</label>
                <p className="text-xs text-gray-500 mb-3">Max 3MB untuk gambar, 500KB untuk PDF/Word/Excel</p>
                {renderDocumentCard('Flight Ticket', user.travelDocuments?.flightTicket)}
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">Sertifikat Vaksinasi</label>
                <p className="text-xs text-gray-500 mb-3">Max 3MB untuk gambar, 500KB untuk PDF/Word/Excel</p>
                {renderDocumentCard('Vaccination Certificate', user.travelDocuments?.vaccinationCertificate)}
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-between items-center">
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white rounded-lg transition-all duration-300 font-semibold shadow-md"
            >
              <ArrowLeft className="w-5 h-5" />
              Kembali
            </button>
            <Button
              onClick={onClose}
              className="px-8 py-3 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] hover:from-[#C5A572] hover:to-[#D4AF37] text-white font-semibold shadow-lg"
            >
              Tutup
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDocumentsModal;