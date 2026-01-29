import React, { useState, useEffect } from 'react';
import { User, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { UserRole } from '../../types';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'register';
}

const AuthModal: React.FC<AuthModalProps> = ({ open, onClose, defaultTab = 'login' }) => {
  const { signIn, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [currentTab, setCurrentTab] = useState(defaultTab);

  // Password visibility states
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'prospective-jamaah' as UserRole, // ✅ Added role field with default
    referralCode: '' // ✅ NEW: Optional referral code
  });

  // Update tab when defaultTab changes
  useEffect(() => {
    setCurrentTab(defaultTab);
  }, [defaultTab]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn(loginData.email, loginData.password);
      toast.success('Welcome back!');
      onClose();
    } catch (error: any) {
      // ✅ NEW: Handle approval errors
      const errorMessage = error.message || '';

      if (errorMessage.includes('APPROVAL_PENDING')) {
        toast.error('Your account is pending admin approval', {
          description: 'Please wait for admin to review and approve your application. You will receive an email once approved.',
          duration: 7000,
        });
      } else if (errorMessage.includes('APPROVAL_REJECTED')) {
        const reason = errorMessage.split(': ')[1] || 'Your application was rejected';
        toast.error('Account application rejected', {
          description: reason,
          duration: 7000,
        });
      } else if (errorMessage.includes('APPROVAL_REQUIRED')) {
        toast.error('Your account requires admin approval', {
          description: 'Please contact admin for more information.',
          duration: 5000,
        });
      } else {
        toast.error(errorMessage || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!registerData.fullName.trim()) {
      toast.error('Full name is required');
      return;
    }

    if (!registerData.phoneNumber.trim()) {
      toast.error('Phone number is required');
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (registerData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      // ✅ Pass role to signUp
      await signUp(
        registerData.email,
        registerData.password,
        registerData.fullName,
        registerData.phoneNumber,
        registerData.role, // ✅ Include selected role
        registerData.referralCode // ✅ NEW: Include referral code
      );

      // ✅ Check if role requires approval
      const requiresApproval = registerData.role === 'tour-leader' || registerData.role === 'mutawwif' || registerData.role === 'agen';

      if (requiresApproval) {
        // ✅ Close modal first
        onClose();

        // ✅ Show toast
        toast.success('Application submitted! Your account will be reviewed by our team.', {
          duration: 5000,
        });

        // ✅ Redirect to waiting approval page dengan data
        navigate('/waiting-approval', {
          state: {
            email: registerData.email,
            role: registerData.role,
            approvalStatus: 'pending',
          }
        });
      } else {
        // Regular jamaah - normal flow
        toast.success('Account created successfully! Welcome to Sultanah Travel!');
        onClose();
      }
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!forgotEmail.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);

    try {
      await resetPassword(forgotEmail);
      toast.success('Password reset email sent! Please check your inbox.');
      setShowForgotPassword(false);
      setForgotEmail('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-md max-h-[95vh] overflow-y-auto p-0 bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-3xl border-0 shadow-2xl"
        style={{
          backgroundImage: 'url(/images/mecca-clock-tower.jpg)', // ✅ Updated to mecca-clock-tower.jpg
        }}
      >
        {/* Accessibility - Hidden title and description */}
        <DialogTitle className="sr-only">
          {showForgotPassword ? 'Atur Ulang Kata Sandi' : currentTab === 'login' ? 'Masuk' : 'Buat Akun'}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {showForgotPassword
            ? 'Masukkan email Anda untuk reset password'
            : currentTab === 'login'
              ? 'Masuk ke akun Sultanah Travel Anda'
              : 'Buat akun baru untuk pesan perjalanan Umrah Anda'}
        </DialogDescription>

        <div className="p-8">
          {showForgotPassword ? (
            <>
              {/* Forgot Password View */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-light tracking-wide mb-3">
                  <span className="bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] bg-clip-text text-transparent">
                    Reset Password
                  </span>
                </h2>
                <p className="text-gray-300 text-sm">
                  Enter your email and we'll send you a reset link
                </p>
              </div>

              <form onSubmit={handleForgotPassword} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email" className="text-sm font-medium text-gray-200">
                    Email Address
                  </Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="Enter your email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-[#D4AF37] focus:ring-[#D4AF37]/30 rounded-xl"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] hover:opacity-90 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl font-medium"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending...
                    </span>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>

                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="w-full text-sm text-gray-300 hover:text-[#D4AF37] transition-colors mt-4"
                >
                  ← Back to login
                </button>
              </form>
            </>
          ) : (
            <>
              {/* Main Auth View */}
              <div className="text-center mb-8">
                {/* Logo - Premium Text Branding */}
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent mb-1">
                    SULTANAH
                  </h2>
                  <p className="text-xs text-gray-500 tracking-wider">UMRAH & HALAL TRAVEL</p>
                </div>

                <h2 className="text-4xl font-light tracking-wide mb-3">
                  <span className="bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] bg-clip-text text-transparent p-[0px] m-[0px]">
                    Welcome
                  </span>
                </h2>
                <p className="text-gray-300 text-sm">
                  Your journey to the sacred lands begins here
                </p>
              </div>

              {/* Tab Buttons */}
              <div className="flex gap-3 mb-8 bg-white/10 backdrop-blur-sm p-1.5 rounded-xl">
                <button
                  onClick={() => setCurrentTab('login')}
                  className={`flex-1 py-3 rounded-lg font-medium transition-all duration-300 ${currentTab === 'login'
                    ? 'bg-white/95 text-gray-900 shadow-md'
                    : 'text-gray-300 hover:text-white'
                    }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setCurrentTab('register')}
                  className={`flex-1 py-3 rounded-lg font-medium transition-all duration-300 ${currentTab === 'register'
                    ? 'bg-white/95 text-gray-900 shadow-md'
                    : 'text-gray-300 hover:text-white'
                    }`}
                >
                  Create Account
                </button>
              </div>

              {/* Login Form */}
              {currentTab === 'login' && (
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-sm font-medium text-gray-200">
                      Email Address
                    </Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="Enter your email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      className="h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-[#D4AF37] focus:ring-[#D4AF37]/30 rounded-xl"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-sm font-medium text-gray-200">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showLoginPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        className="h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-[#D4AF37] focus:ring-[#D4AF37]/30 rounded-xl pr-12"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#D4AF37] transition-colors p-1"
                      >
                        {showLoginPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-xs text-[#D4AF37] hover:text-[#F4D03F] transition-colors inline-block"
                      >
                        Forgot password?
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-gradient-to-r from-[#D4AF37] via-[#F4D03F] to-[#D4AF37] hover:from-[#C5A572] hover:via-[#D4AF37] hover:to-[#C5A572] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Signing in...
                      </span>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>
              )}

              {/* Register Form */}
              {currentTab === 'register' && (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-fullName" className="text-sm font-medium text-gray-200">
                      Full Name
                    </Label>
                    <Input
                      id="register-fullName"
                      type="text"
                      placeholder="Enter your full name"
                      value={registerData.fullName}
                      onChange={(e) => setRegisterData({ ...registerData, fullName: e.target.value })}
                      className="h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-[#D4AF37] focus:ring-[#D4AF37]/30 rounded-xl"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-phoneNumber" className="text-sm font-medium text-gray-200">
                      Phone Number
                    </Label>
                    <Input
                      id="register-phoneNumber"
                      type="tel"
                      placeholder="+62 812-3456-7890"
                      value={registerData.phoneNumber}
                      onChange={(e) => setRegisterData({ ...registerData, phoneNumber: e.target.value })}
                      className="h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-[#D4AF37] focus:ring-[#D4AF37]/30 rounded-xl"
                      required
                    />
                  </div>

                  {/* ✅ NEW: Role Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="register-role" className="text-sm font-medium text-gray-200">
                      Daftar sebagai
                    </Label>
                    <div className="relative">
                      <select
                        id="register-role"
                        value={registerData.role}
                        onChange={(e) => setRegisterData({ ...registerData, role: e.target.value as UserRole })}
                        className="h-12 w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 focus:border-[#D4AF37] focus:ring-[#D4AF37]/30 focus:outline-none appearance-none cursor-pointer"
                        required
                      >
                        <option value="prospective-jamaah" className="bg-gray-800 text-white">
                          🕌 Calon Jamaah
                        </option>
                        <option value="tour-leader" className="bg-gray-800 text-white">
                          🧑‍✈️ Tour Leader (Perlu Approval)
                        </option>
                        <option value="mutawwif" className="bg-gray-800 text-white">
                          📿 Mutawwif (Perlu Approval)
                        </option>
                        <option value="agen" className="bg-gray-800 text-white">
                          🏢 Agen (Perlu Approval)
                        </option>
                      </select>
                      {/* Custom dropdown arrow */}
                      <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>

                    {/* ✅ Show info if Tour Leader or Mutawwif selected */}
                    {(registerData.role === 'tour-leader' || registerData.role === 'mutawwif' || registerData.role === 'agen') && (
                      <div className="mt-2 p-3 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-lg">
                        <p className="text-xs text-[#F4D03F]">
                          ℹ️ Akun {registerData.role === 'tour-leader' ? 'Tour Leader' : registerData.role === 'mutawwif' ? 'Mutawwif' : 'Agen'} memerlukan approval dari Admin.
                          Anda akan mendapat notifikasi setelah akun disetujui.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email" className="text-sm font-medium text-gray-200">
                      Email Address
                    </Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="Enter your email"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      className="h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-[#D4AF37] focus:ring-[#D4AF37]/30 rounded-xl"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="text-sm font-medium text-gray-200">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="register-password"
                        type={showRegisterPassword ? 'text' : 'password'}
                        placeholder="Minimum 6 characters"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        className="h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-[#D4AF37] focus:ring-[#D4AF37]/30 rounded-xl pr-12"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#D4AF37] transition-colors p-1"
                      >
                        {showRegisterPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-confirm-password" className="text-sm font-medium text-gray-200">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="register-confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Re-enter your password"
                        value={registerData.confirmPassword}
                        onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                        className="h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-[#D4AF37] focus:ring-[#D4AF37]/30 rounded-xl pr-12"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#D4AF37] transition-colors p-1"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* ✅ NEW: Referral Code (Optional) */}
                  <div className="space-y-2">
                    <Label htmlFor="register-referralCode" className="text-sm font-medium text-gray-200">
                      Kode Referral <span className="text-gray-400 font-normal">(Opsional)</span>
                    </Label>
                    <Input
                      id="register-referralCode"
                      type="text"
                      placeholder="Masukkan kode referral jika ada (contoh: SULTANAH-XXX1234)"
                      value={registerData.referralCode}
                      onChange={(e) => setRegisterData({ ...registerData, referralCode: e.target.value.toUpperCase() })}
                      className="h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-[#D4AF37] focus:ring-[#D4AF37]/30 rounded-xl"
                    />
                    <p className="text-xs text-gray-400">
                      💡 Masukkan kode referral dari Alumni atau Agen untuk mendukung mereka mendapatkan komisi
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] hover:opacity-90 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl font-medium mt-6"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Creating account...
                      </span>
                    ) : (
                      'Create Account'
                    )}
                  </Button>

                  <p className="text-xs text-center text-gray-400 pt-3">
                    By creating an account, you agree to our Terms of Service
                  </p>
                </form>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;