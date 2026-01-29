import React, { useState, useEffect } from 'react';
import { ArrowLeft, Upload, FileText, Award, Users, BookOpen, Send, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../../contexts/AuthContext';
import { AccountApproval } from '../../../types';
import { collection, query, where, getDocs, addDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { motion } from 'motion/react';
import { toast } from 'sonner';

interface RoleApplicationPageProps {
  onBack: () => void;
}

const RoleApplicationPage: React.FC<RoleApplicationPageProps> = ({ onBack }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [existingApplication, setExistingApplication] = useState<AccountApproval | null>(null);
  const [selectedRole, setSelectedRole] = useState<'tour-leader' | 'mutawwif'>('tour-leader');
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [experience, setExperience] = useState('');
  const [certifications, setCertifications] = useState<string[]>(['']);
  const [languages, setLanguages] = useState<string[]>(['Bahasa Indonesia']);
  const [specialization, setSpecialization] = useState<string[]>(['']);
  const [motivation, setMotivation] = useState('');
  const [references, setReferences] = useState('');
  const [cvFile, setCvFile] = useState('');
  const [certificates, setCertificates] = useState<string[]>([]);
  const [idCard, setIdCard] = useState('');

  useEffect(() => {
    if (currentUser) {
      checkExistingApplication();
      loadUserData();
    }
  }, [currentUser]);

  const checkExistingApplication = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const approvalsRef = collection(db, 'accountApprovals');
      const q = query(
        approvalsRef,
        where('userId', '==', currentUser.uid),
        where('status', 'in', ['pending', 'approved'])
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const appData = snapshot.docs[0].data() as AccountApproval;
        setExistingApplication({ id: snapshot.docs[0].id, ...appData });
        setSelectedRole(appData.requestedRole);
      }
    } catch (error) {
      console.error('Error checking application:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async () => {
    if (!currentUser) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setFullName(userData.displayName || userData.identityInfo?.fullName || '');
        setPhoneNumber(userData.phoneNumber || '');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'cv' | 'cert' | 'id') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      if (type === 'cv') {
        setCvFile(result);
      } else if (type === 'cert') {
        setCertificates([...certificates, result]);
      } else if (type === 'id') {
        setIdCard(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!fullName.trim() || !phoneNumber.trim() || !motivation.trim()) {
      toast.error('Mohon lengkapi data yang wajib diisi');
      return;
    }

    try {
      setSubmitting(true);

      const applicationData: Omit<AccountApproval, 'id'> = {
        userId: currentUser.uid,
        userName: fullName,
        userEmail: currentUser.email || '',
        requestedRole: selectedRole,
        currentRole: 'prospective-jamaah', // Default current role
        applicationData: {
          fullName: fullName.trim(),
          phoneNumber: phoneNumber.trim(),
          experience: experience.trim() || undefined,
          certifications: certifications.filter(c => c.trim()),
          languages: languages.filter(l => l.trim()),
          specialization: selectedRole === 'mutawwif' ? specialization.filter(s => s.trim()) : undefined,
          motivation: motivation.trim(),
          references: references.trim() || undefined,
          documents: {
            cv: cvFile || undefined,
            certificates: certificates.length > 0 ? certificates : undefined,
            idCard: idCard || undefined
          }
        },
        status: 'pending',
        appliedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'accountApprovals'), applicationData);
      
      toast.success('Aplikasi berhasil dikirim! Mohon tunggu review dari admin.');
      
      // Refresh to show pending status
      checkExistingApplication();
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Gagal mengirim aplikasi');
    } finally {
      setSubmitting(false);
    }
  };

  const addCertification = () => {
    setCertifications([...certifications, '']);
  };

  const addLanguage = () => {
    setLanguages([...languages, '']);
  };

  const addSpecialization = () => {
    setSpecialization([...specialization, '']);
  };

  const updateCertification = (index: number, value: string) => {
    const newCerts = [...certifications];
    newCerts[index] = value;
    setCertifications(newCerts);
  };

  const updateLanguage = (index: number, value: string) => {
    const newLangs = [...languages];
    newLangs[index] = value;
    setLanguages(newLangs);
  };

  const updateSpecialization = (index: number, value: string) => {
    const newSpecs = [...specialization];
    newSpecs[index] = value;
    setSpecialization(newSpecs);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
          <p className="mt-4 text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  // Show existing application status
  if (existingApplication) {
    const statusConfig = {
      pending: {
        icon: Clock,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        title: 'Aplikasi Sedang Direview',
        message: 'Aplikasi Anda sedang dalam proses review oleh tim admin. Kami akan menghubungi Anda segera.'
      },
      approved: {
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        title: 'Aplikasi Disetujui!',
        message: 'Selamat! Aplikasi Anda telah disetujui. Role Anda telah diupdate.'
      },
      rejected: {
        icon: XCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        title: 'Aplikasi Ditolak',
        message: existingApplication.rejectedReason || 'Mohon maaf, aplikasi Anda ditolak.'
      }
    };

    const config = statusConfig[existingApplication.status];
    const StatusIcon = config.icon;

    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] text-white py-20">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.05) 10px, rgba(255,255,255,.05) 20px)'
            }}></div>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Button
              onClick={onBack}
              variant="ghost"
              className="text-white hover:bg-white/20 gap-2 mb-6"
            >
              <ArrowLeft className="w-5 h-5" />
              Kembali
            </Button>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${config.bgColor} border-2 ${config.borderColor} rounded-2xl p-8 text-center`}
          >
            <StatusIcon className={`w-20 h-20 ${config.color} mx-auto mb-4`} />
            <h2 className={`text-2xl font-bold ${config.color} mb-2`}>{config.title}</h2>
            <p className="text-gray-700 mb-6">{config.message}</p>
            
            <div className="bg-white rounded-xl p-6 text-left space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Role yang Diajukan:</span>
                <span className="font-bold text-gray-900 capitalize">
                  {existingApplication.requestedRole === 'tour-leader' ? 'Tour Leader' : 'Mutawwif'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tanggal Aplikasi:</span>
                <span className="font-medium text-gray-900">
                  {new Date(existingApplication.appliedAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
              {existingApplication.reviewNotes && (
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Catatan Admin:</p>
                  <p className="text-gray-900">{existingApplication.reviewNotes}</p>
                </div>
              )}
            </div>

            <Button
              onClick={onBack}
              className="mt-6 bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] hover:opacity-90 text-white"
            >
              Kembali ke Dashboard
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] text-white py-20">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.05) 10px, rgba(255,255,255,.05) 20px)'
          }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button
            onClick={onBack}
            variant="ghost"
            className="text-white hover:bg-white/20 gap-2 mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Kembali
          </Button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-md rounded-full mb-6">
              <Award className="w-10 h-10" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Aplikasi Role Khusus
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Daftar sebagai Tour Leader atau Mutawwif untuk melayani jamaah
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Role Selection */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <button
            onClick={() => setSelectedRole('tour-leader')}
            className={`p-8 rounded-2xl border-2 transition-all ${
              selectedRole === 'tour-leader'
                ? 'border-gold bg-gold/5 shadow-lg'
                : 'border-gray-200 hover:border-gold/50'
            }`}
          >
            <Users className={`w-12 h-12 mx-auto mb-4 ${
              selectedRole === 'tour-leader' ? 'text-gold' : 'text-gray-400'
            }`} />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Tour Leader</h3>
            <p className="text-gray-600 text-sm">
              Memimpin dan mengkoordinir grup jamaah selama perjalanan
            </p>
          </button>

          <button
            onClick={() => setSelectedRole('mutawwif')}
            className={`p-8 rounded-2xl border-2 transition-all ${
              selectedRole === 'mutawwif'
                ? 'border-gold bg-gold/5 shadow-lg'
                : 'border-gray-200 hover:border-gold/50'
            }`}
          >
            <BookOpen className={`w-12 h-12 mx-auto mb-4 ${
              selectedRole === 'mutawwif' ? 'text-gold' : 'text-gray-400'
            }`} />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Mutawwif</h3>
            <p className="text-gray-600 text-sm">
              Membimbing ibadah dan memberikan panduan spiritual kepada jamaah
            </p>
          </button>
        </div>

        {/* Application Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Form Aplikasi {selectedRole === 'tour-leader' ? 'Tour Leader' : 'Mutawwif'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Data Pribadi</h3>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nomor Telepon/WhatsApp <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Experience & Qualifications */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Pengalaman & Kualifikasi</h3>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pengalaman (Tahun)
                </label>
                <input
                  type="text"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="Contoh: 5 tahun sebagai tour leader"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent"
                />
              </div>

              {/* Certifications */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Sertifikasi / Lisensi
                </label>
                {certifications.map((cert, index) => (
                  <input
                    key={index}
                    type="text"
                    value={cert}
                    onChange={(e) => updateCertification(index, e.target.value)}
                    placeholder="Contoh: Sertifikat Tour Leader ASITA"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent mb-2"
                  />
                ))}
                <Button type="button" onClick={addCertification} variant="outline" size="sm">
                  + Tambah Sertifikasi
                </Button>
              </div>

              {/* Languages */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Bahasa yang Dikuasai
                </label>
                {languages.map((lang, index) => (
                  <input
                    key={index}
                    type="text"
                    value={lang}
                    onChange={(e) => updateLanguage(index, e.target.value)}
                    placeholder="Contoh: Bahasa Arab"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent mb-2"
                  />
                ))}
                <Button type="button" onClick={addLanguage} variant="outline" size="sm">
                  + Tambah Bahasa
                </Button>
              </div>

              {/* Specialization (for Mutawwif only) */}
              {selectedRole === 'mutawwif' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Spesialisasi
                  </label>
                  {specialization.map((spec, index) => (
                    <input
                      key={index}
                      type="text"
                      value={spec}
                      onChange={(e) => updateSpecialization(index, e.target.value)}
                      placeholder="Contoh: Manasik Haji & Umroh"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent mb-2"
                    />
                  ))}
                  <Button type="button" onClick={addSpecialization} variant="outline" size="sm">
                    + Tambah Spesialisasi
                  </Button>
                </div>
              )}
            </div>

            {/* Motivation */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Motivasi <span className="text-red-500">*</span>
              </label>
              <textarea
                value={motivation}
                onChange={(e) => setMotivation(e.target.value)}
                placeholder="Jelaskan mengapa Anda ingin menjadi Tour Leader/Mutawwif..."
                rows={5}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent resize-none"
                required
              />
            </div>

            {/* References */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Referensi / Rekomendasi (Opsional)
              </label>
              <textarea
                value={references}
                onChange={(e) => setReferences(e.target.value)}
                placeholder="Nama dan kontak orang yang bisa memberikan referensi..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent resize-none"
              />
            </div>

            {/* Documents */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Dokumen Pendukung</h3>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  CV / Resume (Opsional)
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => handleFileUpload(e, 'cv')}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                />
                {cvFile && <p className="text-sm text-green-600 mt-2">✓ CV berhasil diupload</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Foto KTP (Opsional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'id')}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                />
                {idCard && <p className="text-sm text-green-600 mt-2">✓ KTP berhasil diupload</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Sertifikat (Opsional)
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileUpload(e, 'cert')}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                />
                {certificates.length > 0 && (
                  <p className="text-sm text-green-600 mt-2">✓ {certificates.length} sertifikat diupload</p>
                )}
              </div>
            </div>

            {/* Submit */}
            <div className="pt-6 border-t border-gray-200">
              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] hover:opacity-90 text-white py-4 rounded-xl gap-2 text-lg"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Mengirim Aplikasi...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Kirim Aplikasi
                  </>
                )}
              </Button>
              <p className="text-sm text-gray-500 text-center mt-4">
                Dengan mengirim aplikasi, Anda menyetujui bahwa data akan direview oleh tim admin
              </p>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default RoleApplicationPage;
