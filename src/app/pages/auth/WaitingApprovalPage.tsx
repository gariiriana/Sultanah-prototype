import React from 'react';
import { motion } from 'motion/react';
import { Clock, CheckCircle, MessageCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// ✅ LOGO: Genuine Sultanah Logo
const logoSultanah = '/images/logo.png';

const WaitingApprovalPage: React.FC = () => {
  const { userProfile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleBackToLogin = async () => {
    await signOut();
    navigate('/login');
  };



  const getRoleLabel = (role: string) => {
    const roleMap: Record<string, string> = {
      'tour-leader': 'Tour Leader',
      'mutawwif': 'Mutawwif',
      'agen': 'Agen'
    };
    return roleMap[role] || role;
  };

  const handleWhatsApp = () => {
    window.open('https://wa.me/6281234700116?text=Halo,%20saya%20ingin%20menanyakan%20status%20persetujuan%20akun%20saya', '_blank');
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6">
      {/* FULL SCREEN BACKGROUND - Beautiful Kaaba Photo */}
      <div
        style={{
          backgroundImage: `url(/images/mecca-clock-tower.jpg)`
        }}
      />

      {/* BACK BUTTON - TOP LEFT */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        onClick={handleBackToLogin}
        className="fixed top-6 left-6 z-30 bg-white/20 backdrop-blur-xl border border-white/30 rounded-xl px-4 py-2.5 text-white hover:bg-white/30 transition-all flex items-center gap-2 shadow-lg"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-medium text-sm">Kembali ke Login</span>
      </motion.button>

      {/* CENTER CONTENT */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-2xl"
      >
        {/* Logo Icon - ROUNDED */}
        <div className="flex justify-center mb-[-40px] relative z-20">
          <img
            src={logoSultanah}
            alt="Sultanah"
            className="h-20 w-auto object-contain drop-shadow-2xl rounded-2xl"
          />
        </div>

        {/* Glassmorphism Card - BENAR-BENAR TRANSPARAN */}
        <div className="bg-white/20 backdrop-blur-2xl rounded-3xl shadow-2xl p-10 pt-20 border border-white/30"
          style={{
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}
        >
          {/* Icon - Animated Clock */}
          <motion.div
            className="flex justify-center mb-6"
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <div className="bg-blue-500/20 border border-blue-400/30 rounded-full p-6">
              <Clock className="w-16 h-16 text-white" />
            </div>
          </motion.div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-3">
              Pendaftaran Sedang Ditinjau
            </h1>
            <p className="text-lg text-white/90">
              Akun Anda berhasil dibuat, namun <span className="font-semibold">memerlukan persetujuan admin</span> sebelum dapat digunakan.
            </p>
          </div>

          {/* Explanation Box - INFO LENGKAP */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/10 border border-white/30 rounded-2xl p-6 mb-8"
          >
            <div className="flex items-start gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-green-300 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-white font-semibold text-lg mb-2">
                  Akun Berhasil Dibuat
                </h3>
                <p className="text-white/80 text-sm leading-relaxed">
                  Selamat! Akun Anda dengan role <span className="font-semibold text-white">{getRoleLabel(userProfile?.role || 'Tour Leader')}</span> telah berhasil terdaftar di sistem Sultanah Travel.
                </p>
              </div>
            </div>

            <div className="border-t border-white/20 pt-4">
              <h4 className="text-white font-semibold mb-3">📋 Proses Selanjutnya:</h4>
              <ul className="space-y-2 text-white/90 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-blue-300 font-bold">1.</span>
                  <span>Role yang Anda pilih (<strong>{getRoleLabel(userProfile?.role || 'Tour Leader')}</strong>) memerlukan <strong>proses verifikasi manual</strong> oleh tim Sultanah Travel.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-300 font-bold">2.</span>
                  <span>Proses ini biasanya memakan waktu <strong>1–2 hari kerja</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-300 font-bold">3.</span>
                  <span>Kami akan menghubungi Anda melalui <strong>WhatsApp atau Email</strong> setelah akun disetujui.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-300 font-bold">4.</span>
                  <span>Setelah disetujui, Anda dapat <strong>login</strong> dan mengakses dashboard sesuai role Anda.</span>
                </li>
              </ul>
            </div>
          </motion.div>

          {/* Status Info */}
          <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-xl p-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-500/30 rounded-full p-2">
                <Clock className="w-5 h-5 text-yellow-100" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Status Akun Saat Ini:</p>
                <p className="text-yellow-100 text-xs">⏳ Menunggu Persetujuan Admin</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Primary Button - Back to Login */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleBackToLogin}
              className="bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-semibold text-sm shadow-lg transition-all flex items-center justify-center gap-2 border border-blue-500/50"
            >
              <ArrowLeft className="w-5 h-5" />
              Kembali ke Halaman Login
            </motion.button>

            {/* Secondary Button - Contact Admin */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleWhatsApp}
              className="bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-semibold text-sm shadow-lg transition-all flex items-center justify-center gap-2 border border-green-500/50"
            >
              <MessageCircle className="w-5 h-5" />
              Hubungi Admin (WhatsApp)
            </motion.button>
          </div>

          {/* Info Box */}
          <div className="bg-white/10 border border-white/20 rounded-xl p-4 mb-6">
            <p className="text-white/80 text-xs text-center leading-relaxed">
              💡 <strong>Tips:</strong> Pastikan Anda menyimpan email dan password yang Anda gunakan untuk registrasi. Anda akan membutuhkannya untuk login setelah akun disetujui.
            </p>
          </div>

          {/* Footer Note */}
          <div className="text-center">
            <p className="text-white/70 text-sm mb-2">
              <em>Mohon menunggu. Kami menghargai kesabaran Anda. 🙏</em>
            </p>
            <p className="text-white/60 text-xs">
              Jika Anda merasa sudah menunggu terlalu lama (lebih dari 3 hari kerja),<br />
              silakan hubungi admin kami melalui tombol WhatsApp di atas.
            </p>
          </div>

          {/* Bottom Divider */}
          <div className="border-t border-white/20 mt-8 pt-6">
            <p className="text-center text-xs text-white/70">
              Terima kasih telah memilih <span className="font-semibold">Sultanah Travel</span> sebagai partner perjalanan ibadah Anda. ✨
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default WaitingApprovalPage;