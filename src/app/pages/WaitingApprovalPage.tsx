
import { useAuth } from '../../contexts/AuthContext';
import { CheckCircle, XCircle, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ✅ LOGO: Genuine Sultanah Logo
const logoSultanah = '/images/logo.png';

const WaitingApprovalPage = () => {
  const { userProfile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    console.log('🚪 Logout button clicked');
    try {
      console.log('🔄 Signing out...');
      await signOut();
      console.log('✅ Sign out successful, navigating to home...');
      // Small delay to ensure signOut completes
      setTimeout(() => {
        navigate('/');
      }, 100);
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Fallback - tetap redirect ke home jika ada error
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-cover bg-center flex items-center justify-center p-4" style={{ backgroundImage: 'url(/images/mecca-clock-tower.jpg)' }}>
      {/* Main Card */}
      <div className="w-full max-w-md bg-[#3a4a5c]/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/10">

        {/* Logo */}
        <div className="flex justify-center mb-4">
          <img
            src={logoSultanah}
            alt="Sultanah"
            className="h-24 w-auto"
          />
        </div>

        {/* Subtitle */}
        <p className="text-center text-gray-300 text-sm mb-8">
          Umrah & Halal Travel
        </p>

        {/* Status Icon */}
        <div className="flex justify-center mb-6">
          {userProfile?.approvalStatus === 'rejected' ? (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-lg">
              <XCircle className="w-12 h-12 text-white" strokeWidth={3} />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg">
              <CheckCircle className="w-12 h-12 text-white" strokeWidth={3} />
            </div>
          )}
        </div>

        {/* Status Title */}
        <h2 className="text-2xl font-bold text-white text-center mb-4">
          Status Akun
        </h2>

        {/* Badge */}
        <div className="flex justify-center mb-6">
          <span className="px-6 py-2 rounded-full bg-gradient-to-r from-yellow-600 to-yellow-500 text-white text-sm font-semibold">
            Pendaftaran Pengguna
          </span>
        </div>

        {/* Description */}
        <p className="text-center text-gray-300 text-sm mb-6">
          {userProfile?.approvalStatus === 'rejected'
            ? (userProfile?.rejectionReason || 'Permohonan Anda ditolak. Silakan hubungi admin untuk informasi lebih lanjut.')
            : 'Status akun Anda sedang diproses.'
          }
        </p>

        {/* Email Card */}
        <div className="bg-[#2a3947] rounded-xl p-4 mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-yellow-600/20 flex items-center justify-center flex-shrink-0">
            <svg
              className="w-5 h-5 text-yellow-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 mb-0.5">Email Terdaftar</p>
            <p className="text-white text-sm font-medium truncate">
              {userProfile?.email || 'user@example.com'}
            </p>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full bg-[#4a5d72] hover:bg-[#5a6d82] text-white rounded-xl py-3.5 px-6 flex items-center justify-center gap-2 transition-all duration-200 font-medium mb-4"
        >
          <LogOut className="w-5 h-5" />
          Keluar
        </button>

        {/* Footer Note */}
        <p className="text-center text-gray-400 text-xs leading-relaxed">
          Halaman ini akan otomatis terupdate setelah admin menyetujui akun Anda
        </p>
      </div>
    </div>
  );
};

export default WaitingApprovalPage;