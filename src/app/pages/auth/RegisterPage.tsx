import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, User, Phone, Eye, EyeOff, ArrowLeft, Tag, UserCircle } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { UserRole } from '../../../types';

// Logo removed - using text branding instead

// ✅ BACKGROUND: Masjid Nabawi at Night - Beautiful & Premium
const backgroundImage = '/images/mecca-clock-tower.jpg';

interface RegisterPageProps {
  onNavigateToLogin: () => void;
  onRegisterSuccess: () => void;
  onBackToDashboard?: () => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigateToLogin, onRegisterSuccess, onBackToDashboard }) => {
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'prospective-jamaah' as UserRole,
    referralCode: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    setIsLoading(true);

    try {
      await signUp(
        formData.email,
        formData.password,
        formData.name,
        formData.phone,
        formData.role,
        formData.referralCode || undefined
      );

      // ✅ FIX: For roles requiring approval, DON'T navigate away
      // Let AppContent routing handle the redirect to WaitingApprovalPage
      const rolesRequiringApproval = ['agen', 'tour-leader', 'mutawwif', 'influencer'];
      if (!rolesRequiringApproval.includes(formData.role)) {
        onRegisterSuccess();
      }
      // If role requires approval, user will stay logged in
      // and AppContent will automatically show WaitingApprovalPage
    } catch (err: any) {
      console.error('Register error:', err);
      setError(err.message || 'Registrasi gagal. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      role: e.target.value as UserRole
    }));
  };

  const roleOptions = [
    { value: 'prospective-jamaah', label: 'Calon Jamaah', description: 'Saya ingin mendaftar Umrah/Haji' },
    { value: 'agen', label: 'Agen', description: 'Daftar sebagai agen travel (perlu persetujuan)' },
    { value: 'affiliator', label: 'Affiliator', description: 'Daftar program afiliasi (komisi per jamaah)' }, // ✅ NEW
    { value: 'influencer', label: 'Influencer', description: 'Kolaborasi media sosial (perlu persetujuan)' }, // ✅ NEW
    { value: 'tour-leader', label: 'Tour Leader', description: 'Daftar sebagai tour leader (perlu persetujuan)' },
    { value: 'mutawwif', label: 'Mutawwif', description: 'Daftar sebagai mutawwif (perlu persetujuan)' },
  ];

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6">
      {/* FULL SCREEN BACKGROUND - Beautiful Kaaba Photo */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${backgroundImage})`
        }}
      />

      {/* Back to Dashboard Button - Top Left */}
      {onBackToDashboard && (
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          onClick={onBackToDashboard}
          className="fixed top-6 left-6 z-20 flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-xl rounded-full border border-white/30 text-white font-medium text-sm shadow-lg transition-all group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Kembali ke Dashboard</span>
        </motion.button>
      )}

      {/* CENTER CONTENT */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Premium Text Branding - Centered */}
        <div className="flex flex-col items-center mb-6">
          <img
            src="/images/logo.png"
            alt="Sultanah Travel"
            className="h-24 w-auto object-contain drop-shadow-2xl rounded-xl"
          />
        </div>

        {/* Glassmorphism Card */}
        <div className="bg-white/20 backdrop-blur-2xl rounded-3xl shadow-2xl p-10 border border-white/30"
          style={{
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}
        >
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white mb-2">
              Buat Akun Baru
            </h1>
            <p className="text-sm text-white/90">
              Isi data Anda untuk memulai pendaftaran
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200"
            >
              <p className="text-sm text-red-600">{error}</p>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Input */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
                Nama Lengkap
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70" />
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Nama lengkap Anda"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/30 bg-white/10 text-white placeholder:text-white/50 focus:border-white/50 focus:ring-1 focus:ring-white/50 outline-none transition-all text-sm"
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="nama@email.com"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/30 bg-white/10 text-white placeholder:text-white/50 focus:border-white/50 focus:ring-1 focus:ring-white/50 outline-none transition-all text-sm"
                />
              </div>
            </div>

            {/* Phone Input */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-white mb-2">
                Nomor WhatsApp
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70" />
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="08123456789"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/30 bg-white/10 text-white placeholder:text-white/50 focus:border-white/50 focus:ring-1 focus:ring-white/50 outline-none transition-all text-sm"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Minimal 6 karakter"
                  className="w-full pl-11 pr-11 py-3 rounded-xl border border-white/30 bg-white/10 text-white placeholder:text-white/50 focus:border-white/50 focus:ring-1 focus:ring-white/50 outline-none transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-white mb-2">
                Konfirmasi Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="Ulangi password"
                  className="w-full pl-11 pr-11 py-3 rounded-xl border border-white/30 bg-white/10 text-white placeholder:text-white/50 focus:border-white/50 focus:ring-1 focus:ring-white/50 outline-none transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Referral Code Input */}
            <div>
              <label htmlFor="referralCode" className="block text-sm font-medium text-white mb-2">
                Kode Referral <span className="text-white/60 font-normal">(Opsional)</span>
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70" />
                <input
                  type="text"
                  id="referralCode"
                  name="referralCode"
                  value={formData.referralCode}
                  onChange={handleChange}
                  placeholder="SULTANAH-XXX (jika ada)"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/30 bg-white/10 text-white placeholder:text-white/50 focus:border-white/50 focus:ring-1 focus:ring-white/50 outline-none transition-all text-sm uppercase"
                />
              </div>
              <p className="text-xs text-white/70 mt-1 ml-1">
                Masukkan kode referral dari Alumni atau Agen untuk mendapatkan bonus
              </p>
            </div>

            {/* Role Selection */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-white mb-2">
                Pilih Peran
              </label>
              <div className="relative">
                <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70 pointer-events-none z-10" />
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleRoleChange}
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/30 bg-white/10 text-white focus:border-white/50 focus:ring-1 focus:ring-white/50 outline-none transition-all text-sm appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='rgba(255,255,255,0.7)' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.5rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.5em 1.5em'
                  }}
                >
                  {roleOptions.map(option => (
                    <option key={option.value} value={option.value} className="bg-gray-800 text-white">
                      {option.label} - {option.description}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold text-sm shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Memproses...
                </>
              ) : (
                <>
                  Daftar Sekarang
                  <span className="text-lg">→</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 text-center">
            <span className="text-sm text-white/70">atau</span>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-sm text-white/80 mb-2">
              Sudah memiliki akun?
            </p>
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="text-white hover:text-white/80 font-semibold text-sm transition-colors"
            >
              Masuk Sekarang →
            </button>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-white/70 mt-8">
            Dengan mendaftar, Anda menyetujui{' '}
            <a href="#" className="text-white hover:underline">Syarat & Ketentuan</a>
            {' '}serta{' '}
            <a href="#" className="text-white hover:underline">Kebijakan Privasi</a>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;