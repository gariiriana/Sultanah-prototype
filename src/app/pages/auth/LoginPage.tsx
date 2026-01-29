import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, X } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

// Logo removed - using text branding instead

// ✅ BACKGROUND: Holy Kaaba Mecca - Premium Quality
const backgroundImage = '/images/mecca-clock-tower.jpg';

interface LoginPageProps {
  onNavigateToRegister: () => void;
  onLoginSuccess: () => void;
  onBackToDashboard?: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onNavigateToRegister, onLoginSuccess, onBackToDashboard }) => {
  const { signIn, resetPassword } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await signIn(formData.email, formData.password);
      onLoginSuccess();
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login gagal. Silakan coba lagi.');
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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess(false);

    try {
      await resetPassword(resetEmail);
      setResetSuccess(true);
    } catch (err: any) {
      console.error('Reset password error:', err);
      setResetError(err.message || 'Reset password gagal. Silakan coba lagi.');
    }
  };

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
        <div className="bg-white/20 backdrop-blur-2xl rounded-3xl shadow-2xl p-10 pt-20 border border-white/30"
          style={{
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">
              Masuk ke Akun Anda
            </h1>
            <p className="text-sm text-white/90">
              Silakan masukkan kredensial Anda untuk melanjutkan
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
          <form onSubmit={handleSubmit} className="space-y-5">
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
                  placeholder="••••••••"
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

            {/* Forgot Password */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-white hover:text-white/80 font-medium transition-colors"
              >
                Lupa Password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold text-sm shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Memproses...
                </>
              ) : (
                <>
                  Masuk
                  <span className="text-lg">→</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 text-center">
            <span className="text-sm text-white/70">atau</span>
          </div>

          {/* Register Link */}
          <div className="text-center">
            <p className="text-sm text-white/80 mb-2">
              Belum memiliki akun?
            </p>
            <button
              type="button"
              onClick={onNavigateToRegister}
              className="text-white hover:text-white/80 font-semibold text-sm transition-colors"
            >
              Daftar Sekarang →
            </button>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-white/70 mt-8">
            Dengan masuk, Anda menyetujui{' '}
            <a href="#" className="text-white hover:underline">Syarat & Ketentuan</a>
            {' '}serta{' '}
            <a href="#" className="text-white hover:underline">Kebijakan Privasi</a>
          </p>
        </div>

        {/* Forgot Password Modal */}
        {showForgotPassword && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6"
            onClick={() => setShowForgotPassword(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white/20 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 border border-white/30 w-full max-w-md"
              style={{
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
              }}
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Reset Password</h2>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Success Message */}
              {resetSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 rounded-xl bg-green-500/20 border border-green-400/30"
                >
                  <p className="text-sm text-white font-medium">✅ Email reset password berhasil dikirim! Silakan cek inbox Anda.</p>
                </motion.div>
              )}

              {/* Error Message */}
              {resetError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-400/30"
                >
                  <p className="text-sm text-white font-medium">{resetError}</p>
                </motion.div>
              )}

              {/* Form */}
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div>
                  <label htmlFor="resetEmail" className="block text-sm font-medium text-white mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70" />
                    <input
                      type="email"
                      id="resetEmail"
                      name="resetEmail"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      placeholder="nama@email.com"
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/30 bg-white/10 text-white placeholder:text-white/50 focus:border-white/50 focus:ring-1 focus:ring-white/50 outline-none transition-all text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold text-sm shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Reset Password
                  <span className="text-lg">→</span>
                </button>
              </form>

              <p className="text-center text-xs text-white/70 mt-6">
                Link reset password akan dikirim ke email Anda
              </p>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default LoginPage;